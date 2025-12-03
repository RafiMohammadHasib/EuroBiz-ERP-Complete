
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
import { MoreHorizontal, PlusCircle, Wallet, Receipt, TrendingUp, ArrowUpDown, Search } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/context/settings-context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { Expense } from '@/lib/data';
import { CreateExpenseDialog } from '@/components/expenses/create-expense-dialog';
import { EditExpenseDialog } from '@/components/expenses/edit-expense-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

type SortKey = keyof Expense;

export default function ExpensesPage() {
  const firestore = useFirestore();
  const { currencySymbol } = useSettings();
  const { toast } = useToast();

  const expensesQuery = useMemoFirebase(() => 
    query(collection(firestore, 'expenses'), orderBy('date', 'desc')), 
    [firestore]
  );
  const { data: expenses, isLoading } = useCollection<Expense>(expensesQuery);

  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const safeExpenses = expenses || [];

  const filteredAndSortedExpenses = useMemo(() => {
    let sortableItems = [...safeExpenses];

    if (searchTerm) {
        sortableItems = sortableItems.filter(expense => 
            expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (expense.description && expense.description.toLowerCase().includes(searchTerm.toLowerCase()))
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
}, [safeExpenses, sortConfig, searchTerm]);

  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredAndSortedExpenses.slice(startIndex, endIndex);
  }, [filteredAndSortedExpenses, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedExpenses.length / rowsPerPage);

  const kpiData = useMemo(() => {
    const totalExpenses = filteredAndSortedExpenses.reduce((acc, p) => acc + p.amount, 0);
    const totalTransactions = filteredAndSortedExpenses.length;
    const avgTransaction = totalTransactions > 0 ? totalExpenses / totalTransactions : 0;
    return { totalExpenses, totalTransactions, avgTransaction };
  }, [filteredAndSortedExpenses]);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };


  const handleCreateExpense = async (newExpense: Omit<Expense, 'id'>) => {
    if (!firestore) return;
    try {
      await addDoc(collection(firestore, 'expenses'), newExpense);
      toast({
        title: 'Expense Recorded',
        description: `Expense for ${newExpense.category} has been recorded.`,
      });
    } catch (error) {
      console.error("Error recording expense: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not record expense.' });
    }
  };

  const handleUpdateExpense = async (updatedExpense: Expense) => {
    if (!firestore) return;
    try {
      const expenseRef = doc(firestore, 'expenses', updatedExpense.id);
      await updateDoc(expenseRef, { ...updatedExpense });
      toast({
        title: 'Expense Updated',
        description: `Expense record has been updated.`,
      });
      setExpenseToEdit(null);
    } catch (error) {
      console.error("Error updating expense: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update expense record.' });
    }
  };

  const handleDeleteExpense = async () => {
    if (!firestore || !expenseToDelete) return;
    try {
      const expenseRef = doc(firestore, 'expenses', expenseToDelete.id);
      await deleteDoc(expenseRef);
      toast({
        title: 'Expense Deleted',
        description: `Expense record has been deleted.`,
      });
      setExpenseToDelete(null);
    } catch (error) {
      console.error("Error deleting expense: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete expense record.' });
    }
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Expense Management</CardTitle>
                <CardDescription>Record and manage all business operating expenses.</CardDescription>
            </CardHeader>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currencySymbol}{kpiData.totalExpenses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Across all recorded expenses</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiData.totalTransactions}</div>
              <p className="text-xs text-muted-foreground">Total expense records</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Transaction Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currencySymbol}{kpiData.avgTransaction.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Average value per transaction</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Expense Records</h2>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by category..."
                            className="pl-8 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                  <Button size="sm" className="h-9 gap-1" onClick={() => setCreateDialogOpen(true)}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Record Expense</span>
                  </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => requestSort('date')}>
                     <div className="flex items-center gap-2 cursor-pointer">Date <ArrowUpDown className="h-4 w-4" /></div>
                  </TableHead>
                  <TableHead onClick={() => requestSort('category')}>
                    <div className="flex items-center gap-2 cursor-pointer">Category <ArrowUpDown className="h-4 w-4" /></div>
                  </TableHead>
                  <TableHead onClick={() => requestSort('description')}>
                    <div className="flex items-center gap-2 cursor-pointer">Description <ArrowUpDown className="h-4 w-4" /></div>
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
                ) : paginatedExpenses.length > 0 ? (
                  paginatedExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{expense.category}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell className="text-right">{currencySymbol}{expense.amount.toLocaleString()}</TableCell>
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
                            <DropdownMenuItem onClick={() => setExpenseToEdit(expense)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setExpenseToDelete(expense)}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">No expenses recorded.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
           <CardFooter className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                    Showing <strong>{paginatedExpenses.length}</strong> of <strong>{filteredAndSortedExpenses.length}</strong> expenses
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

      <CreateExpenseDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={handleCreateExpense}
      />

      {expenseToEdit && (
        <EditExpenseDialog
          isOpen={!!expenseToEdit}
          onOpenChange={(open) => !open && setExpenseToEdit(null)}
          onUpdate={handleUpdateExpense}
          expense={expenseToEdit}
        />
      )}

      <AlertDialog open={!!expenseToDelete} onOpenChange={(open) => !open && setExpenseToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this expense record.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteExpense} className="bg-destructive hover:bg-destructive/90">
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    </>
  );
}
