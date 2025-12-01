
'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Wallet, Users, Landmark, ArrowUpDown } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/context/settings-context';
import type { SalaryPayment } from '@/lib/data';
import { CreateSalaryPaymentDialog } from '@/components/salaries/create-salary-payment-dialog';
import { EditSalaryPaymentDialog } from '@/components/salaries/edit-salary-payment-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type SortKey = keyof SalaryPayment;

export default function SalariesPage() {
  const firestore = useFirestore();
  const { currencySymbol } = useSettings();
  const { toast } = useToast();

  const salaryPaymentsQuery = useMemoFirebase(() => 
    query(collection(firestore, 'salary_payments'), orderBy('paymentDate', 'desc')), 
    [firestore]
  );
  const { data: salaryPayments, isLoading } = useCollection<SalaryPayment>(salaryPaymentsQuery);

  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<SalaryPayment | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<SalaryPayment | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>(null);

  const safePayments = salaryPayments || [];

  const sortedPayments = useMemo(() => {
    let sortableItems = [...safePayments];
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
}, [safePayments, sortConfig]);

  const paginatedPayments = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedPayments.slice(startIndex, endIndex);
  }, [sortedPayments, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(sortedPayments.length / rowsPerPage);

  const totalPaid = sortedPayments.reduce((acc, p) => acc + p.amount, 0);
  const totalEmployees = new Set(sortedPayments.map(p => p.employeeName)).size;
  const totalTransactions = sortedPayments.length;

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleCreatePayment = async (newPayment: Omit<SalaryPayment, 'id'>) => {
    if (!firestore) return;
    try {
      await addDoc(collection(firestore, 'salary_payments'), newPayment);
      toast({
        title: 'Payment Recorded',
        description: `Salary for ${newPayment.employeeName} has been recorded.`,
      });
    } catch (error) {
      console.error("Error recording payment: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not record salary payment.' });
    }
  };

  const handleUpdatePayment = async (updatedPayment: SalaryPayment) => {
    if (!firestore) return;
    try {
      const paymentRef = doc(firestore, 'salary_payments', updatedPayment.id);
      await updateDoc(paymentRef, { ...updatedPayment });
      toast({
        title: 'Payment Updated',
        description: `Salary record for ${updatedPayment.employeeName} has been updated.`,
      });
      setPaymentToEdit(null);
    } catch (error) {
      console.error("Error updating payment: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update salary payment.' });
    }
  };

  const handleDeletePayment = async () => {
    if (!firestore || !paymentToDelete) return;
    try {
      const paymentRef = doc(firestore, 'salary_payments', paymentToDelete.id);
      await deleteDoc(paymentRef);
      toast({
        title: 'Payment Deleted',
        description: `Salary record for ${paymentToDelete.employeeName} has been deleted.`,
      });
      setPaymentToDelete(null);
    } catch (error) {
      console.error("Error deleting payment: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete salary payment.' });
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Salaries Paid</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currencySymbol}{totalPaid.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Across all recorded payments</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Employees Paid</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEmployees}</div>
              <p className="text-xs text-muted-foreground">Unique employees in records</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <Landmark className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTransactions}</div>
              <p className="text-xs text-muted-foreground">Total salary payments made</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Salary Payments</CardTitle>
                <CardDescription>Manage and record all salary payments made to employees.</CardDescription>
              </div>
              <Button size="sm" className="h-8 gap-1" onClick={() => setCreateDialogOpen(true)}>
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Record Payment</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => requestSort('employeeName')}>
                     <div className="flex items-center gap-2 cursor-pointer">Employee Name <ArrowUpDown className="h-4 w-4" /></div>
                  </TableHead>
                  <TableHead onClick={() => requestSort('position')}>
                     <div className="flex items-center gap-2 cursor-pointer">Position <ArrowUpDown className="h-4 w-4" /></div>
                  </TableHead>
                  <TableHead onClick={() => requestSort('paymentDate')}>
                     <div className="flex items-center gap-2 cursor-pointer">Payment Date <ArrowUpDown className="h-4 w-4" /></div>
                  </TableHead>
                  <TableHead className="text-right" onClick={() => requestSort('amount')}>
                     <div className="flex items-center justify-end gap-2 cursor-pointer">Amount <ArrowUpDown className="h-4 w-4" /></div>
                  </TableHead>
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
                ) : paginatedPayments.length > 0 ? (
                  paginatedPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.employeeName}</TableCell>
                      <TableCell>{payment.position}</TableCell>
                      <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">{currencySymbol}{payment.amount.toLocaleString()}</TableCell>
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
                            <DropdownMenuItem onClick={() => setPaymentToEdit(payment)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setPaymentToDelete(payment)}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">No salary payments recorded.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                    Showing <strong>{paginatedPayments.length}</strong> of <strong>{sortedPayments.length}</strong> payments
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

      <CreateSalaryPaymentDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={handleCreatePayment}
      />

      {paymentToEdit && (
        <EditSalaryPaymentDialog
          isOpen={!!paymentToEdit}
          onOpenChange={(open) => !open && setPaymentToEdit(null)}
          onUpdate={handleUpdatePayment}
          payment={paymentToEdit}
        />
      )}

      <AlertDialog open={!!paymentToDelete} onOpenChange={(open) => !open && setPaymentToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the salary record for "{paymentToDelete?.employeeName}".
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeletePayment} className="bg-destructive hover:bg-destructive/90">
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    </>
  );
}
