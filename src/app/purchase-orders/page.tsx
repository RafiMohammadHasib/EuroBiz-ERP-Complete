
'use client';

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { PlusCircle, MoreHorizontal, Package, ShoppingCart, List, CheckCircle, Truck, CreditCard, ArrowUpDown, Search } from "lucide-react"
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
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc, updateDoc, writeBatch } from "firebase/firestore";
import { useSettings } from "@/context/settings-context";
import { MakePaymentDialog } from "@/components/dues/make-payment-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PoDetailsDialog } from "@/components/purchase-orders/po-details-dialog";

type SortKey = keyof PurchaseOrder;

export default function PurchaseOrdersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { currencySymbol } = useSettings();

  const purchaseOrdersCollection = useMemoFirebase(() => firestore ? collection(firestore, 'purchaseOrders') : null, [firestore]);
  const suppliersCollection = useMemoFirebase(() => firestore ? collection(firestore, 'suppliers') : null, [firestore]);
  const rawMaterialsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'rawMaterials') : null, [firestore]);

  const { data: purchaseOrders, isLoading: poLoading } = useCollection<PurchaseOrder>(purchaseOrdersCollection);
  const { data: suppliers, isLoading: suppliersLoading } = useCollection<Supplier>(suppliersCollection);
  const { data: rawMaterials, isLoading: materialsLoading } = useCollection<RawMaterial>(rawMaterialsCollection);

  const [paymentPo, setPaymentPo] = useState<PurchaseOrder | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<PurchaseOrder | null>(null);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState("all");
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const safePOs = purchaseOrders || [];
  const safeSuppliers = suppliers || [];
  const safeRawMaterials = rawMaterials || [];

  const filteredOrders = useMemo(() => {
    let items = safePOs;

    if (activeTab !== "all") {
        const statusMap = {
            'pending': 'Pending',
            'shipped': 'Shipped',
            'received': 'Received',
            'cancelled': 'Cancelled'
        };
        items = items.filter(o => o.deliveryStatus === statusMap[activeTab as keyof typeof statusMap]);
    }
    
    if (searchTerm) {
        items = items.filter(po => po.supplier.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    return items;
  }, [safePOs, activeTab, searchTerm]);

  
  const sortedOrders = useMemo(() => {
    let sortableItems = [...filteredOrders];
    if (sortConfig !== null) {
        sortableItems.sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];
            if (aValue < bValue) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
    } else {
        sortableItems.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return sortableItems;
  }, [filteredOrders, sortConfig]);
  
  const totalPages = Math.ceil(sortedOrders.length / rowsPerPage);
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedOrders.slice(startIndex, endIndex);
  }, [sortedOrders, currentPage, rowsPerPage]);


  const totalPOValue = safePOs.reduce((sum, order) => sum + order.amount, 0);
  const pendingShipment = safePOs.filter(o => o.deliveryStatus === 'Pending').length;
  const totalOrders = safePOs.length;
  const totalPaid = safePOs.reduce((sum, order) => sum + order.paidAmount, 0);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };


  const handleMarkAsReceived = async (orderId: string) => {
    if(!firestore) return;
    const orderToUpdate = safePOs.find(po => po.id === orderId);

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
        if (!orderToCancel || !firestore) return;
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

  return (
    <>
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Purchase Orders</CardTitle>
                <CardDescription>
                Manage your purchase orders and track their status.
                </CardDescription>
            </CardHeader>
        </Card>
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
      <Tabs value={activeTab} onValueChange={(value) => {setActiveTab(value); setCurrentPage(1);}}>
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="shipped">Shipped</TabsTrigger>
            <TabsTrigger value="received">Received</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search by supplier..."
                    className="pl-8 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Link href="/purchase-orders/create">
              <Button size="sm" className="h-9 gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Create Purchase Order
                </span>
              </Button>
            </Link>
          </div>
        </div>
        <Card className="mt-4">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => requestSort('date')}><div className="flex items-center gap-2 cursor-pointer">Date <ArrowUpDown className="h-4 w-4" /></div></TableHead>
                  <TableHead onClick={() => requestSort('supplier')}><div className="flex items-center gap-2 cursor-pointer">Supplier <ArrowUpDown className="h-4 w-4" /></div></TableHead>
                  <TableHead onClick={() => requestSort('paymentStatus')}><div className="flex items-center gap-2 cursor-pointer">Payment Status <ArrowUpDown className="h-4 w-4" /></div></TableHead>
                  <TableHead onClick={() => requestSort('deliveryStatus')}><div className="flex items-center gap-2 cursor-pointer">Delivery Status <ArrowUpDown className="h-4 w-4" /></div></TableHead>
                  <TableHead className="text-right" onClick={() => requestSort('amount')}><div className="flex items-center justify-end gap-2 cursor-pointer">Amount <ArrowUpDown className="h-4 w-4" /></div></TableHead>
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
                    paginatedOrders.map((order) => (
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
                              <DropdownMenuItem onClick={() => setSelectedPO(order)}>View Details</DropdownMenuItem>
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
           <CardFooter className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                    Showing <strong>{paginatedOrders.length}</strong> of <strong>{sortedOrders.length}</strong> orders
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                         <p className="text-xs font-medium">Rows per page</p>
                         <Select
                            value={`${rowsPerPage}`}
                            onValueChange={(value) => {
                            setRowsPerPage(Number(value));
                            setCurrentPage(1);
                            }}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={rowsPerPage} />
                            </SelectTrigger>
                            <SelectContent side="top">
                            {[10, 20, 30, 40, 50].map((pageSize) => (
                                <SelectItem key={pageSize} value={`${pageSize}`}>
                                {pageSize}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="text-xs font-medium">
                        Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </CardFooter>
        </Card>
      </Tabs>
    </div>
    {selectedPO && (
        <PoDetailsDialog
            isOpen={!!selectedPO}
            onOpenChange={(open) => !open && setSelectedPO(null)}
            purchaseOrder={selectedPO}
        />
    )}
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
