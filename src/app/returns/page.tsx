
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
import { invoices } from '@/lib/data';

// This is a client-side simulation. State is not persisted.
let finishedGoodsInventory = 150; // Starting mock inventory
let localInvoices = JSON.parse(JSON.stringify(invoices)); // Deep copy for local manipulation

export default function ReturnsPage() {
  const { toast } = useToast();
  const [invoiceId, setInvoiceId] = useState('');
  const [returnAmount, setReturnAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

    // 2. Add returned stock to inventory (assuming each 1000 BDT is one unit)
    const returnedUnits = Math.floor(amount / 1000);
    finishedGoodsInventory += returnedUnits;

    // In a real app, you would call a server action here to update the database.
    // For now, we just show a success message.
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
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Process Sales Return</CardTitle>
        <CardDescription>
          Enter the invoice ID and the value of returned goods to update inventory and customer dues.
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
          <Label htmlFor="return-amount">Value of Returned Goods (BDT)</Label>
          <Input
            id="return-amount"
            type="number"
            placeholder="e.g., 10000"
            value={returnAmount}
            onChange={(e) => setReturnAmount(e.target.value)}
          />
        </div>
        <Button onClick={handleProcessReturn} disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Process Return'}
        </Button>
      </CardContent>
    </Card>
  );
}
