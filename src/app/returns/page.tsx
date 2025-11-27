
'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Package, Undo, PlusCircle } from 'lucide-react';
import { useSettings } from '@/context/settings-context';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import type { SalesReturn, Invoice, FinishedGood } from '@/lib/data';
import { ProcessReturnDialog } from '@/components/returns/process-return-dialog';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function ReturnsPage() {
  const { toast } = useToast();
  const { currencySymbol } = useSettings();
  const firestore = useFirestore();

  const [isProcessReturnOpen, setProcessReturnOpen] = useState(false);

  const returnsCollection = useMemoFirebase(() => collection(firestore, 'sales_returns'), [firestore]);
  const invoicesCollection = useMemoFirebase(() => collection(firestore, 'invoices'), [firestore]);
  const productsCollection = useMemoFirebase(() => collection(firestore, 'finishedGoods'), [firestore]);

  const { data: salesReturns, isLoading: returnsLoading } = useCollection<SalesReturn>(returnsCollection);
  const { data: invoices, isLoading: invoicesLoading } = useCollection<Invoice>(invoicesCollection);
  const { data: products, isLoading: productsLoading } = useCollection<FinishedGood>(productsCollection);

  const safeReturns = salesReturns || [];
  const safeInvoices = invoices || [];
  const safeProducts = products || [];
  const isLoading = returnsLoading || invoicesLoading || productsLoading;

  const totalReturnValue = safeReturns.reduce((acc, r) => acc + r.amount, 0);
  const totalReturnsProcessed = safeReturns.length;
  const totalUnitsReturned = safeReturns.reduce((acc, r) => acc + (r.returnedUnits || 0), 0);

  const handleProcessReturn = async (invoice: Invoice, returnItems: { productId: string; quantity: number }[], reason: string) => {
    if (!firestore) return false;
    
    let totalReturnAmount = 0;
    const batch = writeBatch(firestore);

    // 1. Update inventory and calculate total return value
    for (const item of returnItems) {
        const product = safeProducts.find(p => p.id === item.productId);
        if (product) {
            const returnAmountForItem = item.quantity * (product.sellingPrice || 0);
            totalReturnAmount += returnAmountForItem;

            const productRef = doc(firestore, 'finishedGoods', product.id);
            batch.update(productRef, {
                quantity: product.quantity + item.quantity
            });
        }
    }
    
    // 2. Update the invoice
    const invoiceRef = doc(firestore, 'invoices', invoice.id);
    const newTotalAmount = invoice.totalAmount - totalReturnAmount;
    const newDueAmount = Math.max(0, newTotalAmount - invoice.paidAmount);

    let newStatus: Invoice['status'] = invoice.status;
    if (newDueAmount <= 0.001 && newTotalAmount > 0) {
        newStatus = 'Paid';
    } else if (invoice.paidAmount > 0 && newDueAmount > 0) {
        newStatus = 'Partially Paid';
    } else if (newDueAmount > 0){
        newStatus = 'Unpaid';
    } else {
        newStatus = 'Paid'; // If due amount is 0, it's paid.
    }
    
    const invoiceUpdatePayload = {
      totalAmount: newTotalAmount < 0 ? 0 : newTotalAmount,
      dueAmount: newDueAmount,
      status: newStatus,
    };
    batch.update(invoiceRef, invoiceUpdatePayload);


    // 3. Create a new return record
    const returnRef = doc(collection(firestore, 'sales_returns'));
    const newReturn: Omit<SalesReturn, 'id'> = {
        invoiceId: invoice.id,
        customer: invoice.customer,
        date: new Date().toISOString(),
        amount: totalReturnAmount,
        returnedUnits: returnItems.reduce((acc, item) => acc + item.quantity, 0),
        reason: reason,
    };
    batch.set(returnRef, newReturn);
    
    return batch.commit().then(() => {
        toast({
            title: 'Return Processed',
            description: `Return for invoice ${invoice.id} has been processed successfully.`,
        });
        return true; // Indicate success
    }).catch((error) => {
        console.error("Intercepted error during return processing:", error);

        // This is a batch write, so it's hard to pinpoint the exact failing operation.
        // We will construct a generic error message for the batch.
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `BATCHED_WRITE (invoices, finishedGoods, sales_returns)`,
            operation: 'write',
            requestResourceData: {
                invoiceUpdate: { id: invoice.id, payload: invoiceUpdatePayload },
                returnRecord: { id: returnRef.id, payload: newReturn },
            }
        }));

        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not process the return due to a permission issue.',
        });
        return false; // Indicate failure
    });
  };

  return (
    <>
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Return Value</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{currencySymbol}{totalReturnValue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">From {totalReturnsProcessed} returns</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Returns Processed</CardTitle>
                    <Undo className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalReturnsProcessed}</div>
                    <p className="text-xs text-muted-foreground">Total number of return transactions</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Units Returned</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalUnitsReturned.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Returned items added back to inventory</p>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Sales Returns</CardTitle>
                        <CardDescription>
                            Manage and track all sales returns.
                        </CardDescription>
                    </div>
                    <Button size="sm" className="h-8 gap-1" onClick={() => setProcessReturnOpen(true)}>
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Process Return
                        </span>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Return ID</TableHead>
                            <TableHead>Invoice ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell>
                            </TableRow>
                        ) : safeReturns.length > 0 ? (
                            safeReturns.map((r) => (
                                <TableRow key={r.id}>
                                    <TableCell className="font-medium">{r.id}</TableCell>
                                    <TableCell>{r.invoiceId}</TableCell>
                                    <TableCell>{r.customer}</TableCell>
                                    <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">{currencySymbol}{r.amount.toLocaleString()}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No sales returns found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
    <ProcessReturnDialog
        isOpen={isProcessReturnOpen}
        onOpenChange={setProcessReturnOpen}
        invoices={safeInvoices}
        products={safeProducts}
        onProcessReturn={handleProcessReturn}
    />
    </>
  );
}
