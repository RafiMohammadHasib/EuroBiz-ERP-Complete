
'use client';

import { useState } from "react";
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
import { PlusCircle, MoreHorizontal, Package, ShoppingCart, List, CheckCircle } from "lucide-react"
import { type PurchaseOrder, type Supplier, type RawMaterial } from "@/lib/data"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreatePurchaseOrderDialog } from "@/components/purchase-orders/create-purchase-order-dialog";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, addDoc, doc, updateDoc, writeBatch } from "firebase/firestore";
import { useSettings } from "@/context/settings-context";


export default function PurchaseOrdersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { currency } = useSettings();

  const purchaseOrdersCollection = useMemoFirebase(() => collection(firestore, 'purchaseOrders'), [firestore]);
  const suppliersCollection = useMemoFirebase(() => collection(firestore, 'suppliers'), [firestore]);
  const rawMaterialsCollection = useMemoFirebase(() => collection(firestore, 'rawMaterials'), [firestore]);

  const { data: purchaseOrders, isLoading: poLoading } = useCollection<PurchaseOrder>(purchaseOrdersCollection);
  const { data: suppliers, isLoading: suppliersLoading } = useCollection<Supplier>(suppliersCollection);
  const { data: rawMaterials, isLoading: materialsLoading } = useCollection<RawMaterial>(rawMaterialsCollection);

  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

  const safePOs = purchaseOrders || [];
  const safeSuppliers = suppliers || [];
  const safeRawMaterials = rawMaterials || [];

  const totalPOValue = safePOs.reduce((sum, order) => sum + order.amount, 0);
  const pendingPOValue = safePOs.filter(o => o.status === 'Pending').reduce((sum, order) => sum + order.amount, 0);
  const totalOrders = safePOs.length;
  const completedOrders = safePOs.filter(o => o.status === 'Completed').length;

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

  const handleMarkAsCompleted = async (orderId: string) => {
    const orderToUpdate = safePOs.find(po => po.id === orderId);

    if (orderToUpdate) {
        try {
            const batch = writeBatch(firestore);

            // 1. Update PO status
            const poRef = doc(firestore, 'purchaseOrders', orderId);
            batch.update(poRef, { status: 'Completed' });

            // 2. Update raw material stock and unit cost
            orderToUpdate.items.forEach(item => {
                const material = safeRawMaterials.find(rm => rm.id === item.rawMaterialId);
                if (material) {
                    const materialRef = doc(firestore, 'rawMaterials', material.id);
                    
                    const oldTotalValue = material.quantity * material.unitCost;
                    const newItemsValue = item.quantity * item.unitCost;
                    const newTotalQuantity = material.quantity + item.quantity;
                    
                    // Calculate weighted-average cost. Avoid division by zero.
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
                title: "Purchase Order Completed",
                description: `Order ${orderId} has been marked as completed and stock has been updated.`
            });
        } catch(error) {
            console.error("Error completing PO: ", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not complete the purchase order."
            });
        }
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
              <TableHead>Order ID</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
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
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.supplier}</TableCell>
                    <TableCell>
                    <Badge variant={order.status === 'Completed' ? 'secondary' : order.status === 'Pending' ? 'outline' : 'destructive'}>
                        {order.status}
                    </Badge>
                    </TableCell>
                    <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">{currency} {order.amount.toLocaleString()}</TableCell>
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
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        {order.status === 'Pending' && (
                            <DropdownMenuItem onClick={() => handleMarkAsCompleted(order.id)}>Mark as Completed</DropdownMenuItem>
                        )}
                        <DropdownMenuItem>Cancel</DropdownMenuItem>
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
            <div className="text-2xl font-bold">{currency} {totalPOValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From all purchase orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending PO Value</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currency} {pendingPOValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">For all pending orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">Across all statuses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedOrders}</div>
            <p className="text-xs text-muted-foreground">Successfully fulfilled POs</p>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="all">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
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
          {renderPurchaseOrderTable(safePOs)}
        </TabsContent>
        <TabsContent value="pending" className="mt-4">
          {renderPurchaseOrderTable(safePOs.filter(o => o.status === 'Pending'))}
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          {renderPurchaseOrderTable(safePOs.filter(o => o.status === 'Completed'))}
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
    </>
  );
}
