
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { invoices, salesReturns as initialSalesReturns } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Package, Undo } from 'lucide-react';
import { useSettings } from '@/context/settings-context';

// This is a client-side simulation. State is not persisted.
let finishedGoodsInventory = 150; // Starting mock inventory
let localInvoices = JSON.parse(JSON.stringify(invoices)); // Deep copy for local manipulation
let localSalesReturns = [...initialSalesReturns];

export default function ReturnsPage() {
  const { toast } = useToast();
  const { currency } = useSettings();
  const [invoiceId, setInvoiceId] = useState('');
  const [returnAmount, setReturnAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [salesReturns, setSalesReturns] = useState(localSalesReturns);

  const totalReturnValue = salesReturns.reduce((acc, r) => acc + r.amount, 0);
  const totalReturnsProcessed = salesReturns.length;
  const totalUnitsReturned = salesReturns.reduce((acc, r) => acc + r.returnedUnits, 0);

  const handleProcessReturn = () => {
    setIsLoading(true);

    const amount = parseFloat(returnAmount);
    if (!invoiceId || !returnAmount || isNaN(amount) || amount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Please provide a valid Invoice ID and return amount.',
      });
      setIsLoading(false);
      return;
    }

    const invoiceIndex = localInvoices.findIndex((inv: any) => inv.id === invoiceId && inv.status !== 'Paid');

    if (invoiceIndex === -1) {
      toast({
        variant: 'destructive',
        title: 'Invoice Not Found',
        description: 'Could not find an unpaid or overdue invoice with that ID.',
      });
      setIsLoading(false);
      return;
    }

    const invoice = localInvoices[invoiceIndex];
    if (amount > invoice.amount) {
        toast({
            variant: 'destructive',
            title: 'Invalid Amount',
            description: 'Return amount cannot be greater than the invoice amount.',
        });
        setIsLoading(false);
        return;
    }

    // Simulate the business logic
    // 1. Decrease the outstanding due amount
    localInvoices[invoiceIndex].amount -= amount;

    // 2. Add returned stock to inventory (assuming each 15 BDT is one unit for this mock)
    const returnedUnits = Math.floor(amount / 15);
    finishedGoodsInventory += returnedUnits;

    // 3. Create a new return record
    const newReturn = {
        id: `RET-${String(localSalesReturns.length + 1).padStart(3, '0')}`,
        invoiceId: invoice.id,
        customer: invoice.customer,
        date: new Date().toISOString().split('T')[0],
        amount,
        returnedUnits,
    };
    localSalesReturns.push(newReturn);
    setSalesReturns([...localSalesReturns]);

    // In a real app, you would call a server action here to update the database.
    setTimeout(() => {
        toast({
          title: 'Return Processed Successfully',
          description: `Invoice ${invoiceId} has been updated. The new due amount is ${localInvoices[invoiceIndex].amount.toLocaleString('en-US', { style: 'currency', currency: 'BDT' })}. ${returnedUnits} units returned to inventory.`,
        });
        setInvoiceId('');
        setReturnAmount('');
        setIsLoading(false);
        
        // This is a trick to notify other components that data has changed
        window.dispatchEvent(new CustomEvent('data-updated', { detail: { localInvoices, finishedGoodsInventory }}));
    }, 1000);


  };

  return (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Return Value</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{currency} {totalReturnValue.toLocaleString()}</div>
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

        <div className="grid gap-6 md:grid-cols-5">
            <div className="md:col-span-2">
                 <Card>
                    <CardHeader>
                        <CardTitle>Process Sales Return</CardTitle>
                        <CardDescription>
                        Enter invoice ID and return value to update inventory and dues.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                        <Label htmlFor="invoice-id">Original Invoice ID</Label>
                        <Input
                            id="invoice-id"
                            placeholder="e.g., INV-003"
                            value={invoiceId}
                            onChange={(e) => setInvoiceId(e.target.value.toUpperCase())}
                        />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="return-amount">Value of Returned Goods ({currency})</Label>
                        <Input
                            id="return-amount"
                            type="number"
                            placeholder="e.g., 10000"
                            value={returnAmount}
                            onChange={(e) => setReturnAmount(e.target.value)}
                        />
                        </div>
                        <Button onClick={handleProcessReturn} disabled={isLoading} className="w-full">
                        {isLoading ? 'Processing...' : 'Process Return'}
                        </Button>
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Returns</CardTitle>
                        <CardDescription>
                        A log of the most recently processed sales returns.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Return ID</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {salesReturns.map((r) => (
                                    <TableRow key={r.id}>
                                        <TableCell className="font-medium">{r.id}</TableCell>
                                        <TableCell>{r.customer}</TableCell>
                                        <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">{currency} {r.amount.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
