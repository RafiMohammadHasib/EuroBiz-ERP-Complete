
'use client';

import { useState, useMemo } from "react";
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
import { Button } from "@/components/ui/button"
import { PlusCircle, MoreHorizontal, Users, DollarSign, UserCheck, Trash2, Edit } from "lucide-react"
import { type SalaryPayment } from "@/lib/data"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { MakeSalaryPaymentDialog } from "@/components/salaries/make-salary-payment-dialog";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, addDoc, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/context/settings-context";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function SalariesPage() {
  const firestore = useFirestore();
  const { currencySymbol } = useSettings();
  
  const salaryPaymentsCollection = useMemoFirebase(() => collection(firestore, 'salary_payments'), [firestore]);
  const { data: salaryPayments, isLoading: paymentsLoading } = useCollection<SalaryPayment>(salaryPaymentsCollection);

  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<SalaryPayment | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<SalaryPayment | null>(null);
  
  const { toast } = useToast();

  const safeSalaryPayments = salaryPayments || [];

  const totalPaidThisMonth = safeSalaryPayments
    .filter(p => new Date(p.paymentDate).getMonth() === new Date().getMonth() && new Date(p.paymentDate).getFullYear() === new Date().getFullYear())
    .reduce((acc, p) => acc + p.amount, 0);

  const uniqueEmployees = new Set(safeSalaryPayments.map(p => p.employeeName)).size;


  const isLoading = paymentsLoading;

  const handleCreatePayment = async (newPayment: Omit<SalaryPayment, 'id'>) => {
    try {
      await addDoc(salaryPaymentsCollection, newPayment);
      toast({
        title: 'Salary Payment Recorded',
        description: `Payment to ${newPayment.employeeName} has been recorded.`,
      });
    } catch(error) {
      console.error("Error making salary payment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not record the salary payment.",
      });
    }
  }
  
  const handleUpdatePayment = async (updatedPayment: SalaryPayment) => {
    if(!paymentToEdit) return;
    try {
      const paymentRef = doc(firestore, 'salary_payments', paymentToEdit.id);
      await updateDoc(paymentRef, updatedPayment as any);
      toast({
        title: 'Payment Updated',
        description: `Payment for ${updatedPayment.employeeName} has been updated.`,
      });
      setPaymentToEdit(null);
    } catch (error) {
       console.error("Error updating payment:", error);
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not update the payment record.',
       });
    }
  };

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;
    try {
      const paymentRef = doc(firestore, 'salary_payments', paymentToDelete.id);
      await deleteDoc(paymentRef);
      toast({
        title: 'Payment Record Deleted',
        description: `The payment record for "${paymentToDelete.employeeName}" has been deleted.`,
      });
      setPaymentToDelete(null);
    } catch (error) {
       console.error("Error deleting payment record:", error);
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not delete the payment record.',
       });
    }
  };


  return (
    <>
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Paid This Month</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{currencySymbol}{totalPaidThisMonth.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Across all employees</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Employees Paid</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{uniqueEmployees}</div>
                    <p className="text-xs text-muted-foreground">Unique employees paid this month</p>
                </CardContent>
            </Card>
        </div>
        <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Salary Payment History</CardTitle>
                    <CardDescription>
                    Track, manage, and filter all employee salary payments.
                    </CardDescription>
                </div>
                <Button size="sm" className="h-8 gap-1" onClick={() => setPaymentDialogOpen(true)}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Record Payment
                    </span>
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
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
                  safeSalaryPayments.map((payment) => (
                  <TableRow key={payment.id}>
                      <TableCell>
                        <div className="font-medium">{payment.employeeName}</div>
                      </TableCell>
                       <TableCell>{payment.position}</TableCell>
                      <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        {currencySymbol}{payment.amount.toLocaleString()}
                      </TableCell>
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
                          <DropdownMenuItem onClick={() => setPaymentToEdit(payment)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setPaymentToDelete(payment)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
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
    </div>
    <MakeSalaryPaymentDialog
        isOpen={isPaymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        onConfirm={handleCreatePayment}
        key={paymentToEdit ? 'edit-dialog-open' : 'create-dialog-open'}
    />
    {paymentToEdit && (
        <MakeSalaryPaymentDialog
            isOpen={!!paymentToEdit}
            onOpenChange={() => setPaymentToEdit(null)}
            onConfirm={(payment) => handleUpdatePayment(payment as SalaryPayment)}
            payment={paymentToEdit}
            key={paymentToEdit.id}
        />
    )}
    <AlertDialog open={!!paymentToDelete} onOpenChange={() => setPaymentToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the payment record for {paymentToDelete?.employeeName}.
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
