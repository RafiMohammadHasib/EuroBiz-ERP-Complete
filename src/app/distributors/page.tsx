
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
import { PlusCircle, MoreHorizontal, Users, Truck, DollarSign, TrendingUp, Award, Mail, Phone, CreditCard, Percent, ArrowUpDown, Search } from "lucide-react"
import { type Distributor, type Invoice, type SalesCommission } from "@/lib/data"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CreateDistributorDialog } from "@/components/distributors/create-distributor-dialog";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/context/settings-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditDistributorDialog } from "@/components/distributors/edit-distributor-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

type SortKey = keyof Distributor;

export default function DistributorsPage() {
    const firestore = useFirestore();
    const { currencySymbol } = useSettings();
    
    const distributorsCollection = useMemoFirebase(() => collection(firestore, 'distributors'), [firestore]);
    const invoicesCollection = useMemoFirebase(() => collection(firestore, 'invoices'), [firestore]);
    const salesCommissionsCollection = useMemoFirebase(() => collection(firestore, 'sales_commissions'), [firestore]);

    const { data: distributors, isLoading: distributorsLoading } = useCollection<Distributor>(distributorsCollection);
    const { data: invoices, isLoading: invoicesLoading } = useCollection<Invoice>(invoicesCollection);
    const { data: salesCommissions, isLoading: scLoading } = useCollection<SalesCommission>(salesCommissionsCollection);
    
    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
    const [distributorToEdit, setDistributorToEdit] = useState<Distributor | null>(null);
    const [distributorToDelete, setDistributorToDelete] = useState<Distributor | null>(null);
    const { toast } = useToast();
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const isLoading = distributorsLoading || invoicesLoading || scLoading;

    const distributorData = useMemo(() => {
        if (!distributors || !invoices || !salesCommissions) return [];
        return distributors.map(dist => {
            const distributorInvoices = invoices.filter(inv => inv.customer === dist.name);
            const totalSales = distributorInvoices
                .filter(inv => inv.status === 'Paid')
                .reduce((acc, inv) => acc + (inv.totalAmount ?? 0), 0);
            
            const outstandingDues = distributorInvoices.reduce((acc, inv) => acc + (inv.dueAmount ?? 0), 0);

            const totalCommission = salesCommissions
                .filter(sc => sc.distributionChannelId === dist.id)
                .reduce((acc, sc) => acc + (sc.commissionAmount ?? 0), 0);

            return {
                ...dist,
                totalSales,
                outstandingDues,
                totalCommission
            }
        });
    }, [distributors, invoices, salesCommissions]);

    const filteredAndSortedDistributors = useMemo(() => {
        let sortableItems = [...distributorData];
        if(searchTerm) {
            sortableItems = sortableItems.filter(dist => 
                dist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                dist.location.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key as keyof typeof a];
                const bValue = b[sortConfig.key as keyof typeof b];

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
    }, [distributorData, sortConfig, searchTerm]);

    const paginatedDistributors = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return filteredAndSortedDistributors.slice(startIndex, endIndex);
    }, [filteredAndSortedDistributors, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(filteredAndSortedDistributors.length / rowsPerPage);

    const totalDistributors = filteredAndSortedDistributors.length;
    const totalSales = filteredAndSortedDistributors.reduce((acc, dist) => acc + dist.totalSales, 0);
    const totalDues = filteredAndSortedDistributors.reduce((acc, dist) => acc + dist.outstandingDues, 0);
    const totalCommissionsPaid = filteredAndSortedDistributors.reduce((acc, dist) => acc + dist.totalCommission, 0);

    const requestSort = (key: SortKey) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const addDistributor = async (newDistributorData: Omit<Distributor, 'id' | 'totalSales' | 'totalCommission' | 'outstandingDues'>) => {
      try {
        if (!firestore) return;
        const newDistributor = {
            ...newDistributorData,
            totalSales: 0,
            totalCommission: 0,
            outstandingDues: 0
        };
        await addDoc(distributorsCollection, newDistributor);
        toast({
          title: 'Distributor Added',
          description: `New distributor "${newDistributor.name}" has been added.`,
        });
      } catch (error) {
        console.error("Error adding distributor: ", error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not add the distributor.',
        });
      }
    }

    const handleUpdateDistributor = async (updatedDistributor: Distributor) => {
        if (!firestore) return;
        try {
            const distRef = doc(firestore, 'distributors', updatedDistributor.id);
            await updateDoc(distRef, {
                name: updatedDistributor.name,
                location: updatedDistributor.location,
                tier: updatedDistributor.tier,
                email: updatedDistributor.email,
                phone: updatedDistributor.phone,
            });
            toast({
                title: 'Distributor Updated',
                description: `Distributor "${updatedDistributor.name}" has been updated.`,
            });
            setDistributorToEdit(null);
        } catch (error) {
            console.error("Error updating distributor: ", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not update distributor details.',
            });
        }
    };

    const handleDeleteDistributor = async () => {
        if (!distributorToDelete || !firestore) return;
        try {
            const distRef = doc(firestore, 'distributors', distributorToDelete.id);
            await deleteDoc(distRef);
            toast({
                title: 'Distributor Deleted',
                description: `Distributor "${distributorToDelete.name}" has been deleted.`,
            });
            setDistributorToDelete(null);
        } catch (error) {
            console.error("Error deleting distributor: ", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not delete the distributor.',
            });
        }
    };

  return (
    <>
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Distributors</CardTitle>
                <CardDescription>
                A comprehensive overview of your sales distributors.
                </CardDescription>
            </CardHeader>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Distributors</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalDistributors}</div>
                    <p className="text-xs text-muted-foreground">Active distributors in your network</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{currencySymbol}{totalSales.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">From all distributor sales</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Outstanding Dues</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{currencySymbol}{totalDues.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Total receivable from distributors</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Commissions Paid</CardTitle>
                    <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{currencySymbol}{totalCommissionsPaid.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                        Total commissions paid to all distributors
                    </p>
                </CardContent>
            </Card>
        </div>
        <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Distributor Report</h2>
                 <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by name or location..."
                            className="pl-8 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button size="sm" className="h-9 gap-1" onClick={() => setCreateDialogOpen(true)}>
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Add Distributor
                        </span>
                    </Button>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead onClick={() => requestSort('name')}>
                           <div className="flex items-center gap-2 cursor-pointer">Distributor Name <ArrowUpDown className="h-4 w-4" /></div>
                        </TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead onClick={() => requestSort('tier')}>
                           <div className="flex items-center gap-2 cursor-pointer">Tier <ArrowUpDown className="h-4 w-4" /></div>
                        </TableHead>
                        <TableHead className="text-right" onClick={() => requestSort('totalSales')}>
                            <div className="flex items-center justify-end gap-2 cursor-pointer">Total Sales <ArrowUpDown className="h-4 w-4" /></div>
                        </TableHead>
                        <TableHead className="text-right" onClick={() => requestSort('outstandingDues')}>
                            <div className="flex items-center justify-end gap-2 cursor-pointer">Outstanding Dues <ArrowUpDown className="h-4 w-4" /></div>
                        </TableHead>
                        <TableHead className="text-right" onClick={() => requestSort('totalCommission')}>
                            <div className="flex items-center justify-end gap-2 cursor-pointer">Total Commissions <ArrowUpDown className="h-4 w-4" /></div>
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
                      paginatedDistributors.map((dist) => (
                        <TableRow key={dist.id}>
                            <TableCell className="font-medium">
                                <div>{dist.name}</div>
                                <div className="text-xs text-muted-foreground">{dist.location}</div>
                            </TableCell>
                            <TableCell>
                                {dist.email && <div className="flex items-center gap-2 text-sm"><Mail className="h-3 w-3" /> {dist.email}</div>}
                                {dist.phone && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="h-3 w-3" /> {dist.phone}</div>}
                            </TableCell>
                            <TableCell>{dist.tier}</TableCell>
                            <TableCell className="text-right">{currencySymbol}{dist.totalSales.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-destructive">{currencySymbol}{dist.outstandingDues.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{currencySymbol}{dist.totalCommission.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
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
                                    <DropdownMenuItem onClick={() => setDistributorToEdit(dist)}>Edit</DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => setDistributorToDelete(dist)}>Delete</DropdownMenuItem>
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
                    Showing <strong>{paginatedDistributors.length}</strong> of <strong>{filteredAndSortedDistributors.length}</strong> distributors
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
    <CreateDistributorDialog 
        isOpen={isCreateDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={addDistributor}
    />
    {distributorToEdit && (
        <EditDistributorDialog
            isOpen={!!distributorToEdit}
            onOpenChange={(open) => !open && setDistributorToEdit(null)}
            distributor={distributorToEdit}
            onUpdate={handleUpdateDistributor}
        />
    )}
    <AlertDialog open={!!distributorToDelete} onOpenChange={(open) => !open && setDistributorToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete the distributor "{distributorToDelete?.name}". This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteDistributor} className="bg-destructive hover:bg-destructive/90">
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
