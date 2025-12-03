
'use client';

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, CheckCircle, Clock, Package, Factory, DollarSign, MoreHorizontal, ArrowUpDown, Search } from "lucide-react"
import { type ProductionOrder, type FinishedGood, type RawMaterial } from "@/lib/data"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CreateProductionOrderDialog } from "@/components/production/create-production-order-dialog";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, doc, updateDoc, writeBatch } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/context/settings-context";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type SortKey = keyof ProductionOrder;

export default function ProductionPage() {
    const firestore = useFirestore();
    const { currencySymbol } = useSettings();
    const productionOrdersCollection = useMemoFirebase(() => query(collection(firestore, 'productionOrders'), orderBy('createdAt', 'desc')), [firestore]);
    const finishedGoodsCollection = useMemoFirebase(() => collection(firestore, 'finishedGoods'), [firestore]);
    const rawMaterialsCollection = useMemoFirebase(() => collection(firestore, 'rawMaterials'), [firestore]);
    
    const { data: productionOrders, isLoading: poLoading } = useCollection<ProductionOrder>(productionOrdersCollection);
    const { data: finishedGoods, isLoading: fgLoading } = useCollection<FinishedGood>(finishedGoodsCollection);
    const { data: rawMaterials, isLoading: rmLoading } = useCollection<RawMaterial>(rawMaterialsCollection);
    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
    const [orderToCancel, setOrderToCancel] = useState<ProductionOrder | null>(null);
    const { toast } = useToast();
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');


    const safeProductionOrders = productionOrders || [];
    const safeFinishedGoods = finishedGoods || [];
    const safeRawMaterials = rawMaterials || [];

    const filteredAndSortedProductionOrders = useMemo(() => {
        let sortableItems = [...safeProductionOrders];

        if (searchTerm) {
            sortableItems = sortableItems.filter(order => 
                order.productName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

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
        }
        return sortableItems;
    }, [safeProductionOrders, sortConfig, searchTerm]);

    const paginatedProductionOrders = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return filteredAndSortedProductionOrders.slice(startIndex, endIndex);
    }, [filteredAndSortedProductionOrders, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(filteredAndSortedProductionOrders.length / rowsPerPage);

    const wipOrders = filteredAndSortedProductionOrders.filter(o => o.status === "In Progress").length;
    const completedOrders = filteredAndSortedProductionOrders.filter(o => o.status === "Completed").length;
    const totalProductionCost = filteredAndSortedProductionOrders.reduce((acc, order) => acc + (order.totalCost || 0), 0);
    const totalUnitsProduced = filteredAndSortedProductionOrders.filter(o => o.status === "Completed").reduce((acc, order) => acc + (order.quantity || 0), 0);
    
    const isLoading = poLoading || fgLoading || rmLoading;

    const requestSort = (key: SortKey) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const addProductionOrder = async (newOrder: Omit<ProductionOrder, 'id' | 'createdAt'>) => {
      if (!firestore) return;
      try {
        await addDoc(collection(firestore, 'productionOrders'), { ...newOrder, createdAt: serverTimestamp() });
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
    
    const handleUpdateStatus = async (orderId: string, status: 'Completed' | 'Cancelled') => {
        if (!firestore) return;
        const order = safeProductionOrders.find(o => o.id === orderId);
        if (!order) return;

        try {
            const batch = writeBatch(firestore);
            const orderRef = doc(firestore, 'productionOrders', orderId);
            batch.update(orderRef, { status });

            if (status === 'Completed') {
                const finishedGood = safeFinishedGoods.find(fg => fg.productName === order.productName);
                if (finishedGood) {
                    const fgRef = doc(firestore, 'finishedGoods', finishedGood.id);

                    // Update Finished Good quantity and unit cost
                    const oldTotalValue = finishedGood.quantity * finishedGood.unitCost;
                    const newItemsValue = order.quantity * order.unitCost;
                    const newTotalQuantity = finishedGood.quantity + order.quantity;
                    
                    const newUnitCost = newTotalQuantity > 0
                        ? (oldTotalValue + newItemsValue) / newTotalQuantity
                        : order.unitCost;

                    batch.update(fgRef, {
                        quantity: newTotalQuantity,
                        unitCost: newUnitCost
                    });

                    // Deduct raw materials
                    finishedGood.components.forEach(component => {
                        const material = safeRawMaterials.find(rm => rm.id === component.materialId);
                        if (material) {
                            const materialRef = doc(firestore, 'rawMaterials', material.id);
                            const quantityToDeduct = component.quantity * order.quantity;
                            batch.update(materialRef, {
                                quantity: material.quantity - quantityToDeduct
                            });
                        }
                    });
                }
            }
            
            await batch.commit();

            toast({
                title: `Production ${status}`,
                description: `Order ${orderId} has been marked as ${status.toLowerCase()}. Inventory updated.`,
            });
        } catch (error) {
            console.error(`Error updating order status:`, error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not update the order status.',
            });
        }
    };
    
    const handleCancelOrder = async () => {
        if (!orderToCancel) return;
        await handleUpdateStatus(orderToCancel.id, 'Cancelled');
        setOrderToCancel(null);
    };

  return (
    <>
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Production</CardTitle>
                <CardDescription>
                Manage production orders and calculate unit costs.
                </CardDescription>
            </CardHeader>
        </Card>
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
                    <div className="text-2xl font-bold">{currencySymbol}{totalProductionCost.toLocaleString()}</div>
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
                    <p className="text-xs text-muted-foreground">Across all completed orders</p>
                </CardContent>
            </Card>
        </div>
        <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Production Orders</h2>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by product name..."
                            className="pl-8 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button size="sm" className="h-9 gap-1" onClick={() => setCreateDialogOpen(true)}>
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        New Production
                        </span>
                    </Button>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead onClick={() => requestSort('productName')}>
                             <div className="flex items-center gap-2 cursor-pointer">Product <ArrowUpDown className="h-4 w-4" /></div>
                        </TableHead>
                        <TableHead onClick={() => requestSort('quantity')}>
                             <div className="flex items-center gap-2 cursor-pointer">Quantity <ArrowUpDown className="h-4 w-4" /></div>
                        </TableHead>
                        <TableHead className="text-right" onClick={() => requestSort('totalCost')}>
                             <div className="flex items-center justify-end gap-2 cursor-pointer">Total Cost <ArrowUpDown className="h-4 w-4" /></div>
                        </TableHead>
                        <TableHead className="text-right" onClick={() => requestSort('unitCost')}>
                             <div className="flex items-center justify-end gap-2 cursor-pointer">Unit Cost <ArrowUpDown className="h-4 w-4" /></div>
                        </TableHead>
                        <TableHead onClick={() => requestSort('status')}>
                             <div className="flex items-center gap-2 cursor-pointer">Status <ArrowUpDown className="h-4 w-4" /></div>
                        </TableHead>
                        <TableHead onClick={() => requestSort('startDate')}>
                            <div className="flex items-center gap-2 cursor-pointer">Start Date <ArrowUpDown className="h-4 w-4" /></div>
                        </TableHead>
                        <TableHead>
                            <span className="sr-only">Actions</span>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">Loading...</TableCell>
                      </TableRow>
                    ) : (
                      paginatedProductionOrders.map(order => (
                         <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.productName}</TableCell>
                            <TableCell>{order.quantity.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{currencySymbol}{(order.totalCost || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                            <TableCell className="text-right">{currencySymbol}{(order.unitCost || 0).toFixed(2)}</TableCell>
                             <TableCell>
                                <Badge variant={order.status === 'Completed' ? 'secondary' : order.status === 'In Progress' ? 'default' : order.status === 'Cancelled' ? 'destructive' : 'outline'}>
                                    {order.status}
                                </Badge>
                             </TableCell>
                            <TableCell>{new Date(order.startDate).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                               <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Toggle menu</span>
                                    </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem disabled>View Details</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => handleUpdateStatus(order.id, 'Completed')}
                                            disabled={order.status === 'Completed' || order.status === 'Cancelled'}
                                        >
                                            Mark as Complete
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                            className="text-destructive"
                                            onClick={() => setOrderToCancel(order)}
                                            disabled={order.status === 'Completed' || order.status === 'Cancelled'}
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
                    Showing <strong>{paginatedProductionOrders.length}</strong> of <strong>{filteredAndSortedProductionOrders.length}</strong> orders
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
    </div>
    <CreateProductionOrderDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={addProductionOrder}
        products={safeFinishedGoods}
        rawMaterials={safeRawMaterials}
    />
     <AlertDialog open={!!orderToCancel} onOpenChange={(open) => !open && setOrderToCancel(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will cancel production order for "{orderToCancel?.productName}".
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
