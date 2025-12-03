
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Landmark, ArrowUpDown } from 'lucide-react';
import { useSettings } from '@/context/settings-context';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, writeBatch } from 'firebase/firestore';
import type { Invoice, PurchaseOrder } from '@/lib/data';
import { MakePaymentDialog } from '@/components/dues/make-payment-dialog';
import { RecordSalePaymentDialog } from '@/components/dues/record-sale-payment-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type SortKeyReceivable = keyof Invoice;
type SortKeyPayable = keyof PurchaseOrder;


export default function DuesPage() {
  const { toast } = useToast();
  const { currencySymbol } = useSettings();
  const firestore = useFirestore();

  const [paymentPo, setPaymentPo] = useState<PurchaseOrder | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);

  const [currentPageReceivable, setCurrentPageReceivable] = useState(1);
  const [rowsPerPageReceivable, setRowsPerPageReceivable] = useState(10);
  const [currentPagePayable, setCurrentPagePayable] = useState(1);
  const [rowsPerPagePayable, setRowsPerPagePayable] = useState(10);
  const [sortConfigReceivable, setSortConfigReceivable] = useState<{ key: SortKeyReceivable; direction: 'ascending' | 'descending' } | null>(null);
  const [sortConfigPayable, setSortConfigPayable] = useState<{ key: SortKeyPayable; direction: 'ascending' | 'descending' } | null>(null);


  // Firestore collections
  const invoicesCollection = useMemoFirebase(() => collection(firestore, 'invoices'), [firestore]);
  const purchaseOrdersCollection = useMemoFirebase(() => collection(firestore, 'purchaseOrders'), [firestore]);

  // Data hooks
  const { data: invoices, isLoading: invoicesLoading } = useCollection<Invoice>(invoicesCollection);
  const { data: purchaseOrders, isLoading: poLoading } = useCollection<PurchaseOrder>(purchaseOrdersCollection);

  const requestSortReceivable = (key: SortKeyReceivable) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfigReceivable && sortConfigReceivable.key === key && sortConfigReceivable.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfigReceivable({ key, direction });
  };
  
  const requestSortPayable = (key: SortKeyPayable) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfigPayable && sortConfigPayable.key === key && sortConfigPayable.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfigPayable({ key, direction });
  };

  const outstandingInvoices = useMemo(() => {
    let items = (invoices || [])
        .filter((i) => i.status !== 'Paid' && i.dueAmount > 0);
    
    if (sortConfigReceivable !== null) {
        items.sort((a, b) => {
            if (a[sortConfigReceivable.key] < b[sortConfigReceivable.key]) {
                return sortConfigReceivable.direction === 'ascending' ? -1 : 1;
            }
            if (a[sortConfigReceivable.key] > b[sortConfigReceivable.key]) {
                return sortConfigReceivable.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
    } else {
        items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return items;
  }, [invoices, sortConfigReceivable]);

  const totalSalesDue = outstandingInvoices.reduce((acc, i) => acc + i.dueAmount, 0);
  
  const paginatedOutstandingInvoices = useMemo(() => {
    const startIndex = (currentPageReceivable - 1) * rowsPerPageReceivable;
    const endIndex = startIndex + rowsPerPageReceivable;
    return outstandingInvoices.slice(startIndex, endIndex);
  }, [outstandingInvoices, currentPageReceivable, rowsPerPageReceivable]);
  const totalPagesReceivable = Math.ceil(outstandingInvoices.length / rowsPerPageReceivable);


  const pendingPurchaseOrders = useMemo(() => {
    let items = purchaseOrders?.filter((po) => po.paymentStatus !== 'Paid') || [];
    if (sortConfigPayable !== null) {
        items.sort((a, b) => {
            const aValue = a[sortConfigPayable.key];
            const bValue = b[sortConfigPayable.key];

            if (aValue < bValue) {
                return sortConfigPayable.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfigPayable.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
    } else {
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return items;
  }, [purchaseOrders, sortConfigPayable]);
  
  const totalPurchaseDue = pendingPurchaseOrders.reduce((acc, po) => acc + po.dueAmount, 0);

  const paginatedPendingPurchaseOrders = useMemo(() => {
    const startIndex = (currentPagePayable - 1) * rowsPerPagePayable;
    const endIndex = startIndex + rowsPerPagePayable;
    return pendingPurchaseOrders.slice(startIndex, endIndex);
  }, [pendingPurchaseOrders, currentPagePayable, rowsPerPagePayable]);
  const totalPagesPayable = Math.ceil(pendingPurchaseOrders.length / rowsPerPagePayable);


  const handleRecordSalePayment = async (invoiceId: string, paymentAmount: number) => {
    if (!firestore) return;
    const invoiceToUpdate = invoices?.find(inv => inv.id === invoiceId);
    if (!invoiceToUpdate) return;
    
    const newPaidAmount = invoiceToUpdate.paidAmount + paymentAmount;
    const newDueAmount = invoiceToUpdate.totalAmount - newPaidAmount;

    let newStatus: Invoice['status'];
    if (newDueAmount <= 0.001) {
        newStatus = 'Paid';
    } else {
        newStatus = 'Partially Paid';
    }

    try {
        const invoiceRef = doc(firestore, 'invoices', invoiceId);
        await updateDoc(invoiceRef, { 
            status: newStatus,
            paidAmount: newPaidAmount,
            dueAmount: newDueAmount < 0 ? 0 : newDueAmount,
        });
        toast({
            title: 'Payment Recorded',
            description: `${currencySymbol}${paymentAmount.toLocaleString()} recorded for Invoice ${invoiceId}.`,
        });
        setPaymentInvoice(null);
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
    
    let newPaymentStatus: PurchaseOrder['paymentStatus'];
    if (newDueAmount <= 0.001) { // Using a small epsilon for floating point comparison
      newPaymentStatus = 'Paid';
    } else if (newPaidAmount > 0) {
      newPaymentStatus = 'Partially Paid';
    } else {
      newPaymentStatus = 'Unpaid';
    }

    try {
        const poRef = doc(firestore, 'purchaseOrders', poId);
        await updateDoc(poRef, { 
            paymentStatus: newPaymentStatus,
            paidAmount: newPaidAmount,
            dueAmount: newDueAmount < 0 ? 0 : newDueAmount,
        });
        toast({
            title: 'Payment Made',
            description: `${currencySymbol}${paymentAmount.toLocaleString()} paid for PO ${poId}.`,
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
        <Card>
            <CardHeader>
                <CardTitle>Outstanding Dues</CardTitle>
                <CardDescription>
                Monitor and manage all outstanding payments for sales and purchases.
                </CardDescription>
            </CardHeader>
        </Card>
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
                        <TableHead onClick={() => requestSortReceivable('customer')}>
                            <div className="flex items-center gap-2 cursor-pointer">Customer <ArrowUpDown className="h-4 w-4" /></div>
                        </TableHead>
                        <TableHead onClick={() => requestSortReceivable('id')}>
                            <div className="flex items-center gap-2 cursor-pointer">Invoice ID <ArrowUpDown className="h-4 w-4" /></div>
                        </TableHead>
                        <TableHead onClick={() => requestSortReceivable('status')}>
                            <div className="flex items-center gap-2 cursor-pointer">Status <ArrowUpDown className="h-4 w-4" /></div>
                        </TableHead>
                        <TableHead className="text-right" onClick={() => requestSortReceivable('dueAmount')}>
                            <div className="flex items-center justify-end gap-2 cursor-pointer">Amount Due ({currencySymbol}) <ArrowUpDown className="h-4 w-4" /></div>
                        </TableHead>
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
                    ) : paginatedOutstandingInvoices.length > 0 ? (
                    paginatedOutstandingInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.customer}</TableCell>
                        <TableCell>{invoice.id}</TableCell>
                        <TableCell>
                            <Badge
                            variant={
                                invoice.status === 'Overdue' ? 'destructive' : invoice.status === 'Partially Paid' ? 'default' : 'outline'
                            }
                            >
                            {invoice.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            {invoice.dueAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                            <Button size="sm" onClick={() => setPaymentInvoice(invoice)}>Record Payment</Button>
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
             <CardFooter className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                    Showing <strong>{paginatedOutstandingInvoices.length}</strong> of <strong>{outstandingInvoices.length}</strong> dues
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                         <p className="text-xs font-medium">Rows per page</p>
                         <Select
                            value={`${rowsPerPageReceivable}`}
                            onValueChange={(value) => {
                            setRowsPerPageReceivable(Number(value));
                            setCurrentPageReceivable(1);
                            }}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={rowsPerPageReceivable} />
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
                        Page {currentPageReceivable} of {totalPagesReceivable}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPageReceivable(prev => Math.max(prev - 1, 1))}
                            disabled={currentPageReceivable === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPageReceivable(prev => Math.min(prev + 1, totalPagesReceivable))}
                            disabled={currentPageReceivable === totalPagesReceivable}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </CardFooter>
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
                        <TableHead onClick={() => requestSortPayable('supplier')}>
                            <div className="flex items-center gap-2 cursor-pointer">Supplier <ArrowUpDown className="h-4 w-4" /></div>
                        </TableHead>
                        <TableHead onClick={() => requestSortPayable('id')}>
                             <div className="flex items-center gap-2 cursor-pointer">PO ID <ArrowUpDown className="h-4 w-4" /></div>
                        </TableHead>
                        <TableHead onClick={() => requestSortPayable('paymentStatus')}>
                             <div className="flex items-center gap-2 cursor-pointer">Payment Status <ArrowUpDown className="h-4 w-4" /></div>
                        </TableHead>
                        <TableHead className="text-right" onClick={() => requestSortPayable('dueAmount')}>
                             <div className="flex items-center justify-end gap-2 cursor-pointer">Amount Due ({currencySymbol}) <ArrowUpDown className="h-4 w-4" /></div>
                        </TableHead>
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
                        ) : paginatedPendingPurchaseOrders.length > 0 ? (
                        paginatedPendingPurchaseOrders.map((po) => (
                            <TableRow key={po.id}>
                            <TableCell className="font-medium">{po.supplier}</TableCell>
                            <TableCell>{po.id}</TableCell>
                            <TableCell>
                                <Badge variant={po.paymentStatus === 'Partially Paid' ? 'default' : 'outline'}>{po.paymentStatus}</Badge>
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
            <CardFooter className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                    Showing <strong>{paginatedPendingPurchaseOrders.length}</strong> of <strong>{pendingPurchaseOrders.length}</strong> dues
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                         <p className="text-xs font-medium">Rows per page</p>
                         <Select
                            value={`${rowsPerPagePayable}`}
                            onValueChange={(value) => {
                            setRowsPerPagePayable(Number(value));
                            setCurrentPagePayable(1);
                            }}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={rowsPerPagePayable} />
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
                        Page {currentPagePayable} of {totalPagesPayable}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPagePayable(prev => Math.max(prev - 1, 1))}
                            disabled={currentPagePayable === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPagePayable(prev => Math.min(prev + 1, totalPagesPayable))}
                            disabled={currentPagePayable === totalPagesPayable}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </CardFooter>
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
     {paymentInvoice && (
      <RecordSalePaymentDialog 
        isOpen={!!paymentInvoice}
        onOpenChange={(isOpen) => !isOpen && setPaymentInvoice(null)}
        invoice={paymentInvoice}
        onConfirmPayment={handleRecordSalePayment}
      />
    )}
    </>
  );
}
