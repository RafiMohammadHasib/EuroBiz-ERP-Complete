
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
import { PlusCircle, MoreHorizontal, Users, Wallet } from "lucide-react"
import { type SalaryPayment } from "@/lib/data"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/context/settings-context";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CreateSalaryPaymentDialog } from "@/components/salaries/create-salary-payment-dialog";
import { EditSalaryPaymentDialog } from "@/components/salaries/edit-salary-payment-dialog";

export default function SalariesPage() {
    const firestore = useFirestore();
    const { currencySymbol } = useSettings();
    const salaryPaymentsCollection = useMemoFirebase(() => query(collection(firestore, 'salary_payments'), orderBy('paymentDate', 'desc')), [firestore]);

    const { data: salaryPayments, isLoading } = useCollection<SalaryPayment>(salaryPaymentsCollection);

    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
    const [paymentToEdit, setPaymentToEdit] = useState<SalaryPayment | null>(null);
    const [paymentToDelete, setPaymentToDelete] = useState<SalaryPayment | null>(null);
    const { toast } = useToast();

    const safePayments = salaryPayments || [];

    const totalPaidThisMonth = safePayments.filter(p => {
        const paymentDate = new Date(p.paymentDate);
        const today = new Date();
        return paymentDate.getMonth() === today.getMonth() && paymentDate.getFullYear() === today.getFullYear();
    }).reduce((acc, p) => acc + p.amount, 0);

    const totalEmployeesPaid = new Set(safePayments.map(p => p.employeeName)).size;

    const addSalaryPayment = async (newPayment: Omit<SalaryPayment, 'id'>) => {
      if (!firestore) return;
      try {
        await addDoc(collection(firestore, 'salary_payments'), newPayment);
        toast({
          title: 'Salary Payment Recorded',
          description: `Payment for ${newPayment.employeeName} has been added.`,
        });
      } catch (error) {
        console.error("Error adding salary payment:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not record the salary payment.",
        });
      }
    }

    const updateSalaryPayment = async (updatedPayment: SalaryPayment) => {
      if (!firestore) return;
      try {
        const paymentRef = doc(firestore, 'salary_payments', updatedPayment.id);
        await updateDoc(paymentRef, {
            employeeName: updatedPayment.employeeName,
            position: updatedPayment.position,
            paymentDate: updatedPayment.paymentDate,
            amount: updatedPayment.amount,
        });
        toast({
          title: 'Salary Payment Updated',
          description: `The payment record for "${updatedPayment.employeeName}" has been updated.`,
        });
        setPaymentToEdit(null);
      } catch (error) {
        console.error("Error updating payment:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not update the payment record.",
        });
      }
    };
    
    const deleteSalaryPayment = async () => {
        if (!paymentToDelete || !firestore) return;
        try {
            const paymentRef = doc(firestore, 'salary_payments', paymentToDelete.id);
            await deleteDoc(paymentRef);
            toast({
                title: 'Salary Payment Deleted',
                description: `The payment for "${paymentToDelete.employeeName}" has been deleted.`,
            });
            setPaymentToDelete(null);
        } catch (error) {
            console.error("Error deleting payment:", error);
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
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{currencySymbol}{totalPaidThisMonth.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Based on recorded payments</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Employees Paid</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalEmployeesPaid}</div>
                    <p className="text-xs text-muted-foreground">Unique employees in records</p>
                </CardContent>
            </Card>
        </div>
        <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Salary Payments</CardTitle>
                    <CardDescription>
                    Manage and record all employee salary payments.
                    </CardDescription>
                </div>
                <Button size="sm" className="h-8 gap-1" onClick={() => setCreateDialogOpen(true)}>
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
                    <TableHead>Employee Name</TableHead>
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
                  safePayments.map((payment) => (
                  <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.employeeName}</TableCell>
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
                          <DropdownMenuItem onClick={() => setPaymentToEdit(payment)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setPaymentToDelete(payment)}>Delete</DropdownMenuItem>
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
    <CreateSalaryPaymentDialog 
        isOpen={isCreateDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={addSalaryPayment}
    />
    {paymentToEdit && (
        <EditSalaryPaymentDialog
            isOpen={!!paymentToEdit}
            onOpenChange={(open) => !open && setPaymentToEdit(null)}
            onUpdate={updateSalaryPayment}
            payment={paymentToEdit}
        />
    )}
    <AlertDialog open={!!paymentToDelete} onOpenChange={(open) => !open && setPaymentToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the payment record for "{paymentToDelete?.employeeName}".
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteSalaryPayment} className="bg-destructive hover:bg-destructive/90">
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
