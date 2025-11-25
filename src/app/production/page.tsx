
'use client';

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, CheckCircle, Clock, Package, Factory, DollarSign } from "lucide-react"
import { type ProductionOrder, type FinishedGood } from "@/lib/data"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CreateProductionOrderDialog } from "@/components/production/create-production-order-dialog";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/context/settings-context";

export default function ProductionPage() {
    const firestore = useFirestore();
    const { currency } = useSettings();
    const productionOrdersCollection = useMemoFirebase(() => collection(firestore, 'productionOrders'), [firestore]);
    const finishedGoodsCollection = useMemoFirebase(() => collection(firestore, 'finishedGoods'), [firestore]);
    
    const { data: productionOrders, isLoading: poLoading } = useCollection<ProductionOrder>(productionOrdersCollection);
    const { data: finishedGoods, isLoading: fgLoading } = useCollection<FinishedGood>(finishedGoodsCollection);
    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
    const { toast } = useToast();

    const safeProductionOrders = productionOrders || [];
    const safeFinishedGoods = finishedGoods || [];

    const wipOrders = safeProductionOrders.filter(o => o.status === "In Progress").length;
    const completedOrders = safeProductionOrders.filter(o => o.status === "Completed").length;
    const totalProductionCost = safeProductionOrders.reduce((acc, order) => acc + order.totalCost, 0);
    const totalUnitsProduced = safeProductionOrders.reduce((acc, order) => acc + order.quantity, 0);
    
    const isLoading = poLoading || fgLoading;

    const addProductionOrder = async (newOrder: Omit<ProductionOrder, 'id'>) => {
      try {
        await addDoc(productionOrdersCollection, newOrder);
        toast({
          title: 'Production Order Created',
          description: `New order for ${newOrder.quantity} units of ${newOrder.productName} has been created.`,
        });
      } catch(error) {
        console.error("Error adding production order: ", error);
        toast({
          variant: "destructive",
          title: 'Error',
          description: 'Could not create the production order.'
        })
      }
    }

  return (
    <>
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Work In Progress</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{wipOrders}</div>
                    <p className="text-xs text-muted-foreground">Active production orders</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{completedOrders}</div>
                    <p className="text-xs text-muted-foreground">Finished this month</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Production Cost</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{currency} {totalProductionCost.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">For all production orders</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Units Produced</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalUnitsProduced.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Across all orders</p>
                </CardContent>
            </Card>
        </div>
        <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Production</CardTitle>
                    <CardDescription>
                    Manage production orders and calculate unit costs.
                    </CardDescription>
                </div>
                <Button size="sm" className="h-8 gap-1" onClick={() => setCreateDialogOpen(true)}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    New Production
                    </span>
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead className="text-right">Total Cost</TableHead>
                        <TableHead className="text-right">Unit Cost</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Start Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">Loading...</TableCell>
                      </TableRow>
                    ) : (
                      safeProductionOrders.map(order => (
                         <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.id}</TableCell>
                            <TableCell>{order.productName}</TableCell>
                            <TableCell>{order.quantity.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{currency} {order.totalCost.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{currency} {(order.totalCost / order.quantity).toFixed(2)}</TableCell>
                             <TableCell>
                                <Badge variant={order.status === 'Completed' ? 'secondary' : order.status === 'In Progress' ? 'default' : 'outline'}>
                                    {order.status}
                                </Badge>
                             </TableCell>
                            <TableCell>{new Date(order.startDate).toLocaleDateString()}</TableCell>
                         </TableRow>
                      ))
                    )}
                </TableBody>
            </Table>
        </CardContent>
        </Card>
    </div>
    <CreateProductionOrderDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={addProductionOrder}
        products={safeFinishedGoods}
    />
    </>
  );
}
