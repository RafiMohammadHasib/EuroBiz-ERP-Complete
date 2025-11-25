
'use client';

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, MoreHorizontal, Building, Package, TrendingUp, UserCheck } from "lucide-react"
import { type Supplier, purchaseOrders as initialPurchaseOrders } from "@/lib/data"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { CreateSupplierDialog } from "@/components/suppliers/create-supplier-dialog";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/context/settings-context";


export default function SuppliersPage() {
    const firestore = useFirestore();
    const { currencySymbol } = useSettings();
    const suppliersCollection = useMemoFirebase(() => collection(firestore, 'suppliers'), [firestore]);
    const { data: suppliers, isLoading: isLoadingSuppliers } = useCollection<Supplier>(suppliersCollection);
    const [purchaseOrders, setPurchaseOrders] = useState(initialPurchaseOrders);
    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
    const { toast } = useToast();

    const supplierData = useMemo(() => {
        if (!suppliers) return [];
        return suppliers.map(supplier => {
            const supplierPOs = purchaseOrders.filter(po => po.supplier === supplier.name);
            const totalPOValue = supplierPOs.reduce((acc, po) => acc + po.amount, 0);
            return {
                ...supplier,
                totalPOValue,
            }
        });
    }, [suppliers, purchaseOrders]);

    const totalSuppliers = supplierData.length;
    const activeSuppliers = supplierData.filter(s => s.status === 'Active').length;
    const totalPOValue = supplierData.reduce((acc, s) => acc + s.totalPOValue, 0);
    const averagePOValue = totalSuppliers > 0 ? totalPOValue / totalSuppliers : 0;

    const addSupplier = async (newSupplier: Omit<Supplier, 'id'>) => {
        try {
            await addDoc(suppliersCollection, newSupplier);
            toast({
                title: 'Supplier Added',
                description: `New supplier "${newSupplier.name}" has been added.`,
            });
        } catch (error) {
            console.error("Error adding supplier:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not add the supplier.',
            });
        }
    }

  return (
    <>
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
                    <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalSuppliers}</div>
                    <p className="text-xs text-muted-foreground">Including active and inactive</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{activeSuppliers}</div>
                    <p className="text-xs text-muted-foreground">Currently supplying materials</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total PO Value</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{currencySymbol}{totalPOValue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Across all suppliers</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average PO Value</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{currencySymbol}{averagePOValue.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                    <p className="text-xs text-muted-foreground">Per supplier</p>
                </CardContent>
            </Card>
        </div>
        <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Suppliers</CardTitle>
                    <CardDescription>
                    Manage your raw material suppliers.
                    </CardDescription>
                </div>
                <Button size="sm" className="h-8 gap-1" onClick={() => setCreateDialogOpen(true)}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Add Supplier
                    </span>
                </Button>
            </div>
        </CardHeader>
        <CardContent>
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Supplier Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Total PO Value</TableHead>
                        <TableHead>
                            <span className="sr-only">Actions</span>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoadingSuppliers ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                        </TableRow>
                    ) : (
                        supplierData.map((supplier) => (
                            <TableRow key={supplier.id}>
                                <TableCell className="font-medium">{supplier.name}</TableCell>
                                <TableCell>{supplier.category}</TableCell>
                                <TableCell>
                                    <Badge variant={supplier.status === 'Active' ? 'secondary' : 'outline'}>{supplier.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">{currencySymbol}{supplier.totalPOValue.toLocaleString()}</TableCell>
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
                                        <DropdownMenuItem>Edit</DropdownMenuItem>
                                        <DropdownMenuItem>Delete</DropdownMenuItem>
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
    </div>
    <CreateSupplierDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={addSupplier}
    />
    </>
  );
}
