
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Invoice } from '@/lib/data';
import { useSettings } from '@/context/settings-context';
import { Badge } from '../ui/badge';

interface RecordSalePaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
  onConfirmPayment: (invoiceId: string, paymentAmount: number) => void;
}

export function RecordSalePaymentDialog({ isOpen, onOpenChange, invoice, onConfirmPayment }: RecordSalePaymentDialogProps) {
  const { toast } = useToast();
  const { currencySymbol } = useSettings();
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    if (invoice) {
      setPaymentAmount(String(invoice.dueAmount));
    }
  }, [invoice]);

  const handleSubmit = () => {
    const numericAmount = parseFloat(paymentAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Please enter a valid positive payment amount.',
      });
      return;
    }
    if (numericAmount > invoice.dueAmount) {
         toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Payment amount cannot be greater than the due amount.',
      });
      return;
    }

    onConfirmPayment(invoice.id, numericAmount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Record Payment for Invoice: {invoice.id}</DialogTitle>
          <DialogDescription>
            Enter the amount received from the customer for this invoice.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="flex justify-between items-center bg-muted/50 p-3 rounded-md">
                <div className="font-medium">Total Amount Due</div>
                <div className="font-bold text-lg text-destructive">{currencySymbol}{invoice.dueAmount.toLocaleString()}</div>
            </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="payment-amount" className="text-right">
              Payment Amount
            </Label>
            <Input
              id="payment-amount"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="col-span-3"
              placeholder="e.g., 500.00"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" onClick={handleSubmit}>Confirm Payment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
