
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
import { PlusCircle, MoreHorizontal, Building, Package, TrendingUp, UserCheck } from "lucide-react"
import { type Supplier, type PurchaseOrder } from "@/lib/data"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { CreateSupplierDialog } from "@/components/suppliers/create-supplier-dialog";
import { EditSupplierDialog } from "@/components/suppliers/edit-supplier-dialog";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, addDoc, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/context/settings-context";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export default function SuppliersPage() {
    const firestore = useFirestore();
    const { currencySymbol } = useSettings();
    const suppliersCollection = useMemoFirebase(() => collection(firestore, 'suppliers'), [firestore]);
    const purchaseOrdersCollection = useMemoFirebase(() => collection(firestore, 'purchaseOrders'), [firestore]);

    const { data: suppliers, isLoading: isLoadingSuppliers } = useCollection<Supplier>(suppliersCollection);
    const { data: purchaseOrders, isLoading: isLoadingPOs } = useCollection<PurchaseOrder>(purchaseOrdersCollection);

    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
    const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
    const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);
    const { toast } = useToast();
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const supplierData = useMemo(() => {
        if (!suppliers || !purchaseOrders) return [];
        return suppliers.map(supplier => {
            const supplierPOs = purchaseOrders.filter(po => po.supplier === supplier.name);
            const totalPOValue = supplierPOs.reduce((acc, po) => acc + po.amount, 0);
            return {
                ...supplier,
                totalPOValue,
            }
        });
    }, [suppliers, purchaseOrders]);

    const paginatedSuppliers = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return supplierData.slice(startIndex, endIndex);
    }, [supplierData, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(supplierData.length / rowsPerPage);

    const isLoading = isLoadingSuppliers || isLoadingPOs;

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

    const handleUpdateSupplier = async (updatedSupplier: Supplier) => {
        if (!updatedSupplier) return;
        try {
            const supplierRef = doc(firestore, 'suppliers', updatedSupplier.id);
            await updateDoc(supplierRef, {
                name: updatedSupplier.name,
                category: updatedSupplier.category,
                status: updatedSupplier.status,
            });
            toast({
                title: 'Supplier Updated',
                description: `Supplier "${updatedSupplier.name}" has been updated.`,
            });
        } catch (error) {
            console.error("Error updating supplier:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not update the supplier.',
            });
        }
    };

    const handleDeleteSupplier = async () => {
        if (!supplierToDelete) return;
        try {
            const supplierRef = doc(firestore, 'suppliers', supplierToDelete.id);
            await deleteDoc(supplierRef);
            toast({
                title: 'Supplier Deleted',
                description: `Supplier "${supplierToDelete.name}" has been deleted.`,
            });
            setSupplierToDelete(null);
        } catch (error) {
            console.error("Error deleting supplier:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not delete the supplier.',
            });
        }
    };


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
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell>
                        </TableRow>
                    ) : (
                        paginatedSuppliers.map((supplier) => (
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
                                        <DropdownMenuItem onClick={() => setSupplierToEdit(supplier)}>Edit</DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-destructive"
                                            onClick={() => setSupplierToDelete(supplier)}
                                        >
                                            Delete
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
                    Showing <strong>{paginatedSuppliers.length}</strong> of <strong>{supplierData.length}</strong> suppliers
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
    <CreateSupplierDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={addSupplier}
    />
    {supplierToEdit && (
        <EditSupplierDialog
            isOpen={!!supplierToEdit}
            onOpenChange={(open) => !open && setSupplierToEdit(null)}
            supplier={supplierToEdit}
            onUpdate={handleUpdateSupplier}
        />
    )}
     <AlertDialog open={!!supplierToDelete} onOpenChange={(open) => !open && setSupplierToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the supplier
                "{supplierToDelete?.name}".
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
                onClick={handleDeleteSupplier}
                className="bg-destructive hover:bg-destructive/90"
            >
                Continue
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
