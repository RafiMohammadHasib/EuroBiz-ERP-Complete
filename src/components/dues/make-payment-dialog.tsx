
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
import type { PurchaseOrder } from '@/lib/data';
import { useSettings } from '@/context/settings-context';
import { Badge } from '../ui/badge';

interface MakePaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrder: PurchaseOrder;
  onConfirmPayment: (poId: string, paymentAmount: number) => void;
}

export function MakePaymentDialog({ isOpen, onOpenChange, purchaseOrder, onConfirmPayment }: MakePaymentDialogProps) {
  const { toast } = useToast();
  const { currencySymbol } = useSettings();
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    // Set default payment amount to the due amount when the dialog opens for a new PO
    if (purchaseOrder) {
      setPaymentAmount(String(purchaseOrder.dueAmount));
    }
  }, [purchaseOrder]);

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
    if (numericAmount > purchaseOrder.dueAmount) {
         toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Payment amount cannot be greater than the due amount.',
      });
      return;
    }

    onConfirmPayment(purchaseOrder.id, numericAmount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Make Payment for PO: {purchaseOrder.id}</DialogTitle>
          <DialogDescription>
            Enter the amount you wish to pay for this purchase order.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="flex justify-between items-center bg-muted/50 p-3 rounded-md">
                <div className="font-medium">Total Amount Due</div>
                <div className="font-bold text-lg text-destructive">{currencySymbol}{purchaseOrder.dueAmount.toLocaleString()}</div>
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
              placeholder="e.g., 5000"
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
