
'use client';

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PlusCircle, MoreHorizontal, Package, ShoppingCart, List, CheckCircle, Truck, CreditCard } from "lucide-react"
import { type PurchaseOrder, type Supplier, type RawMaterial } from "@/lib/data"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreatePurchaseOrderDialog } from "@/components/purchase-orders/create-purchase-order-dialog";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, addDoc, doc, updateDoc, writeBatch } from "firebase/firestore";
import { useSettings } from "@/context/settings-context";
import { MakePaymentDialog } from "@/components/dues/make-payment-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";


export default function PurchaseOrdersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { currencySymbol } = useSettings();

  const purchaseOrdersCollection = useMemoFirebase(() => collection(firestore, 'purchaseOrders'), [firestore]);
  const suppliersCollection = useMemoFirebase(() => collection(firestore, 'suppliers'), [firestore]);
  const rawMaterialsCollection = useMemoFirebase(() => collection(firestore, 'rawMaterials'), [firestore]);

  const { data: purchaseOrders, isLoading: poLoading } = useCollection<PurchaseOrder>(purchaseOrdersCollection);
  const { data: suppliers, isLoading: suppliersLoading } = useCollection<Supplier>(suppliersCollection);
  const { data: rawMaterials, isLoading: materialsLoading } = useCollection<RawMaterial>(rawMaterialsCollection);

  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [paymentPo, setPaymentPo] = useState<PurchaseOrder | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<PurchaseOrder | null>(null);

  const safePOs = purchaseOrders || [];
  const safeSuppliers = suppliers || [];
  const safeRawMaterials = rawMaterials || [];

  const sortedPOs = useMemo(() => 
    safePOs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [safePOs]
  );

  const totalPOValue = sortedPOs.reduce((sum, order) => sum + order.amount, 0);
  const pendingShipment = sortedPOs.filter(o => o.deliveryStatus === 'Pending').length;
  const totalOrders = sortedPOs.length;
  const totalPaid = sortedPOs.reduce((sum, order) => sum + order.paidAmount, 0);

  const addPurchaseOrder = async (newOrder: Omit<PurchaseOrder, 'id'>) => {
    try {
      await addDoc(purchaseOrdersCollection, newOrder);
      toast({
        title: "Purchase Order Created",
        description: `New PO for ${newOrder.supplier} has been added.`,
      });
    } catch(error) {
       console.error("Error adding purchase order: ", error);
       toast({
        variant: "destructive",
        title: "Error",
        description: "Could not create purchase order."
       });
    }
  }

  const handleMarkAsReceived = async (orderId: string) => {
    const orderToUpdate = sortedPOs.find(po => po.id === orderId);

    if (orderToUpdate) {
        try {
            const batch = writeBatch(firestore);
            const poRef = doc(firestore, 'purchaseOrders', orderId);
            batch.update(poRef, { deliveryStatus: 'Received' });

            orderToUpdate.items.forEach(item => {
                const material = safeRawMaterials.find(rm => rm.id === item.rawMaterialId);
                if (material) {
                    const materialRef = doc(firestore, 'rawMaterials', material.id);
                    
                    const oldTotalValue = material.quantity * material.unitCost;
                    const newItemsValue = item.quantity * item.unitCost;
                    const newTotalQuantity = material.quantity + item.quantity;
                    
                    const newUnitCost = newTotalQuantity > 0
                        ? (oldTotalValue + newItemsValue) / newTotalQuantity
                        : item.unitCost;

                    batch.update(materialRef, { 
                        quantity: newTotalQuantity,
                        unitCost: newUnitCost
                    });
                }
            });

            await batch.commit();

            toast({
                title: "Purchase Order Received",
                description: `Order ${orderId} marked as received. Stock quantity and value have been updated.`
            });
        } catch(error) {
            console.error("Error receiving PO: ", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not mark the purchase order as received."
            });
        }
    }
  }

    const handleCancelOrder = async () => {
        if (!orderToCancel) return;
        try {
            const poRef = doc(firestore, 'purchaseOrders', orderToCancel.id);
            await updateDoc(poRef, { deliveryStatus: 'Cancelled' });
            toast({
                title: 'Purchase Order Cancelled',
                description: `Order ${orderToCancel.id} has been cancelled.`,
            });
            setOrderToCancel(null);
        } catch (error) {
            console.error("Error cancelling order:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not cancel the purchase order.',
            });
        }
    };


  const handleMakePayment = async (poId: string, paymentAmount: number) => {
    if (!firestore) return;
    const poToUpdate = purchaseOrders?.find(po => po.id === poId);
    if (!poToUpdate) return;

    const newPaidAmount = poToUpdate.paidAmount + paymentAmount;
    const newDueAmount = poToUpdate.amount - newPaidAmount;
    
    let newPaymentStatus: PurchaseOrder['paymentStatus'];
    if (newDueAmount <= 0.001) { // Using a small epsilon for floating point comparison
      newPaymentStatus = 'Paid';
    } else if (newPaidAmount > 0) {
      newPaymentStatus = 'Partially Paid';
    } else {
      newPaymentStatus = 'Unpaid';
    }


    try {
        const poRef = doc(firestore, 'purchaseOrders', poId);
        await updateDoc(poRef, { 
            paymentStatus: newPaymentStatus,
            paidAmount: newPaidAmount,
            dueAmount: newDueAmount < 0 ? 0 : newDueAmount,
        });
        toast({
            title: 'Payment Made',
            description: `${currencySymbol}${paymentAmount.toLocaleString()} paid for PO ${poId}.`,
        });
        setPaymentPo(null); // Close dialog on success
    } catch (error) {
        console.error("Error making payment:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not make the payment.',
        });
    }
  }
  
  const getPaymentStatusVariant = (status: PurchaseOrder['paymentStatus']) => {
    switch (status) {
        case 'Paid': return 'secondary';
        case 'Partially Paid': return 'default';
        case 'Unpaid': return 'outline';
        default: return 'outline';
    }
  }

  const getDeliveryStatusVariant = (status: PurchaseOrder['deliveryStatus']) => {
    switch (status) {
        case 'Received': return 'secondary';
        case 'Shipped': return 'default';
        case 'Pending': return 'outline';
        case 'Cancelled': return 'destructive'
        default: return 'outline';
    }
  }

  const renderPurchaseOrderTable = (orders: PurchaseOrder[]) => (
    <Card>
      <CardHeader>
        <CardTitle>Purchase Orders</CardTitle>
        <CardDescription>
          Manage your purchase orders and track their status.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Delivery Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {poLoading ? (
               <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell>
               </TableRow>
            ) : (
                orders.map((order) => (
                <TableRow key={order.id}>
                    <TableCell className="font-medium">{new Date(order.date).toLocaleDateString()}</TableCell>
                    <TableCell>{order.supplier}</TableCell>
                    <TableCell>
                      <Badge variant={getPaymentStatusVariant(order.paymentStatus)}>
                        {order.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getDeliveryStatusVariant(order.deliveryStatus)}>
                        {order.deliveryStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{currencySymbol}{order.amount.toLocaleString()}</TableCell>
                    <TableCell>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/purchase-orders/${order.id}`}>View Details</Link>
                          </DropdownMenuItem>
                           <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setPaymentPo(order)} disabled={order.paymentStatus === 'Paid'}>
                            Make Payment
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleMarkAsReceived(order.id)} disabled={order.deliveryStatus === 'Received' || order.deliveryStatus === 'Cancelled'}>
                            Mark as Received
                          </DropdownMenuItem>
                           <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive" 
                            onClick={() => setOrderToCancel(order)}
                            disabled={order.deliveryStatus === 'Cancelled' || order.deliveryStatus === 'Received'}
                          >
                            Cancel Order
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <>
    <div className="space-y-6">
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total PO Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencySymbol}{totalPOValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From all purchase orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencySymbol}{totalPaid.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all purchase orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Shipments</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingShipment}</div>
            <p className="text-xs text-muted-foreground">Orders awaiting delivery</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">Across all statuses</p>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="all">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="received">Received</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" className="h-8 gap-1" onClick={() => setCreateDialogOpen(true)}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Create Purchase Order
              </span>
            </Button>
          </div>
        </div>
        <TabsContent value="all" className="mt-4">
          {renderPurchaseOrderTable(sortedPOs)}
        </TabsContent>
        <TabsContent value="pending" className="mt-4">
          {renderPurchaseOrderTable(sortedPOs.filter(o => o.deliveryStatus === 'Pending'))}
        </TabsContent>
        <TabsContent value="received" className="mt-4">
          {renderPurchaseOrderTable(sortedPOs.filter(o => o.deliveryStatus === 'Received'))}
        </TabsContent>
        <TabsContent value="paid" className="mt-4">
          {renderPurchaseOrderTable(sortedPOs.filter(o => o.paymentStatus === 'Paid'))}
        </TabsContent>
      </Tabs>
    </div>
    <CreatePurchaseOrderDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={addPurchaseOrder}
        suppliers={safeSuppliers}
        rawMaterials={safeRawMaterials}
    />
    {paymentPo && (
      <MakePaymentDialog 
        isOpen={!!paymentPo}
        onOpenChange={(isOpen) => !isOpen && setPaymentPo(null)}
        purchaseOrder={paymentPo}
        onConfirmPayment={handleMakePayment}
      />
    )}
    <AlertDialog open={!!orderToCancel} onOpenChange={(open) => !open && setOrderToCancel(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will cancel purchase order "{orderToCancel?.id}".
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction
                onClick={handleCancelOrder}
                className="bg-destructive hover:bg-destructive/90"
            >
                Confirm Cancellation
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

    