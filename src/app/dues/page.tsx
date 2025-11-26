
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Landmark } from 'lucide-react';
import { useSettings } from '@/context/settings-context';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, writeBatch } from 'firebase/firestore';
import type { Invoice, PurchaseOrder } from '@/lib/data';
import { MakePaymentDialog } from '@/components/dues/make-payment-dialog';

export default function DuesPage() {
  const { toast } = useToast();
  const { currencySymbol } = useSettings();
  const firestore = useFirestore();

  const [paymentPo, setPaymentPo] = useState<PurchaseOrder | null>(null);

  // Firestore collections
  const invoicesCollection = useMemoFirebase(() => collection(firestore, 'invoices'), [firestore]);
  const purchaseOrdersCollection = useMemoFirebase(() => collection(firestore, 'purchaseOrders'), [firestore]);

  // Data hooks
  const { data: invoices, isLoading: invoicesLoading } = useCollection<Invoice>(invoicesCollection);
  const { data: purchaseOrders, isLoading: poLoading } = useCollection<PurchaseOrder>(purchaseOrdersCollection);

  const outstandingInvoices = invoices?.filter((i) => i.status !== 'Paid' && i.amount > 0) || [];
  const totalSalesDue = outstandingInvoices.reduce((acc, i) => acc + i.amount, 0);

  const pendingPurchaseOrders = purchaseOrders?.filter((po) => po.status === 'Pending' || po.status === 'Received') || [];
  const totalPurchaseDue = pendingPurchaseOrders.reduce((acc, po) => acc + po.dueAmount, 0);

  const handleRecordPayment = async (invoiceId: string) => {
    if (!firestore) return;
    try {
        const invoiceRef = doc(firestore, 'invoices', invoiceId);
        await updateDoc(invoiceRef, { status: 'Paid' });
        toast({
            title: 'Payment Recorded',
            description: `Invoice ${invoiceId} has been marked as Paid.`,
        });
    } catch (error) {
        console.error("Error recording payment:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not record the payment.',
        });
    }
  }

  const handleMakePayment = async (poId: string, paymentAmount: number) => {
    if (!firestore) return;
    const poToUpdate = purchaseOrders?.find(po => po.id === poId);
    if (!poToUpdate) return;

    const newPaidAmount = poToUpdate.paidAmount + paymentAmount;
    const newDueAmount = poToUpdate.amount - newPaidAmount;
    const newStatus = newDueAmount <= 0 ? 'Completed' : 'Received';

    try {
        const poRef = doc(firestore, 'purchaseOrders', poId);
        await updateDoc(poRef, { 
            status: newStatus,
            paidAmount: newPaidAmount,
            dueAmount: newDueAmount < 0 ? 0 : newDueAmount,
        });
        toast({
            title: 'Payment Made',
            description: `${currencySymbol}${paymentAmount.toLocaleString()} paid for PO ${poId}. Remaining due: ${currencySymbol}${newDueAmount.toLocaleString()}`,
        });
        setPaymentPo(null); // Close dialog on success
    } catch (error) {
        console.error("Error making payment:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not make the payment.',
        });
    }
  }
  
  const isLoading = invoicesLoading || poLoading;

  return (
    <>
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Accounts Receivable</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{currencySymbol}{totalSalesDue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Total money to be received</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Accounts Payable</CardTitle>
                    <Landmark className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{currencySymbol}{totalPurchaseDue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Total money to be paid</p>
                </CardContent>
            </Card>
        </div>
        <Tabs defaultValue="receivable">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 md:w-[500px]">
            <TabsTrigger value="receivable">Accounts Receivable (Sales Dues)</TabsTrigger>
            <TabsTrigger value="payable">Accounts Payable (Purchase Dues)</TabsTrigger>
        </TabsList>
        <TabsContent value="receivable">
            <Card>
            <CardHeader>
                <CardTitle>Sales Dues</CardTitle>
                <CardDescription>
                Monitor and manage all outstanding payments from customers.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount Due ({currencySymbol})</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                Loading...
                            </TableCell>
                        </TableRow>
                    ) : outstandingInvoices.length > 0 ? (
                    outstandingInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.customer}</TableCell>
                        <TableCell>{invoice.id}</TableCell>
                        <TableCell>
                            <Badge
                            variant={
                                invoice.status === 'Overdue' ? 'destructive' : 'outline'
                            }
                            >
                            {invoice.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            {invoice.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                            <Button size="sm" onClick={() => handleRecordPayment(invoice.id)}>Record Payment</Button>
                        </TableCell>
                        </TableRow>
                    ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24">
                                No outstanding sales dues.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
                </Table>
            </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="payable">
            <Card>
            <CardHeader>
                <CardTitle>Purchase Dues</CardTitle>
                <CardDescription>
                Manage all outstanding payments to your suppliers.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Supplier</TableHead>
                        <TableHead>PO ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount Due ({currencySymbol})</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : pendingPurchaseOrders.length > 0 ? (
                        pendingPurchaseOrders.map((po) => (
                            <TableRow key={po.id}>
                            <TableCell className="font-medium">{po.supplier}</TableCell>
                            <TableCell>{po.id}</TableCell>
                            <TableCell>
                                <Badge variant={po.status === 'Pending' ? 'outline' : 'default'}>{po.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                {po.dueAmount.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-center">
                                <Button size="sm" onClick={() => setPaymentPo(po)}>Make Payment</Button>
                            </TableCell>
                            </TableRow>
                        ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No outstanding purchase dues.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
            </Card>
        </TabsContent>
        </Tabs>
    </div>
    {paymentPo && (
      <MakePaymentDialog 
        isOpen={!!paymentPo}
        onOpenChange={(isOpen) => !isOpen && setPaymentPo(null)}
        purchaseOrder={paymentPo}
        onConfirmPayment={handleMakePayment}
      />
    )}
    </>
  );
}
