
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
import { type SalaryPayment } from '@/lib/data';

interface MakeSalaryPaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payment: Omit<SalaryPayment, 'id'> | SalaryPayment) => void;
  payment?: SalaryPayment | null;
}

export function MakeSalaryPaymentDialog({ isOpen, onOpenChange, onConfirm, payment }: MakeSalaryPaymentDialogProps) {
  const { toast } = useToast();
  
  const [employeeName, setEmployeeName] = useState('');
  const [position, setPosition] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (payment) {
        setEmployeeName(payment.employeeName);
        setPosition(payment.position);
        setAmount(String(payment.amount));
        setPaymentDate(payment.paymentDate);
    } else {
        // Reset form for new entry
        setEmployeeName('');
        setPosition('');
        setAmount('');
        setPaymentDate(new Date().toISOString().split('T')[0]);
    }
  }, [payment, isOpen]); // Rerun effect if dialog opens or payment data changes

  const handleSubmit = () => {
    const numericAmount = parseFloat(amount);
    if (!employeeName || !position || !paymentDate || !numericAmount || numericAmount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Please fill out all fields with valid data.',
      });
      return;
    }
    
    const paymentData = {
        employeeName,
        position,
        paymentDate,
        amount: numericAmount,
    };

    if(payment) {
      onConfirm({ ...payment, ...paymentData });
    } else {
      onConfirm(paymentData);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{payment ? 'Edit' : 'Record'} Salary Payment</DialogTitle>
          <DialogDescription>
            {payment ? 'Update the details for this salary payment record.' : 'Enter the details of the salary payment.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
              <Label htmlFor="employeeName">Employee Name</Label>
              <Input
                  id="employeeName"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  placeholder="e.g., John Doe"
              />
          </div>
          <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                  id="position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g., Sales Manager"
              />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g., 50000"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="payment-date">Payment Date</Label>
                <Input
                    id="payment-date"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>
            {payment ? 'Save Changes' : 'Save Record'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
