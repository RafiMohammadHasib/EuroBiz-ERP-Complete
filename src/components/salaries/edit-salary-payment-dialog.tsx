
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
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import type { SalaryPayment } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

interface EditSalaryPaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (payment: SalaryPayment) => void;
  payment: SalaryPayment;
}

export function EditSalaryPaymentDialog({ isOpen, onOpenChange, onUpdate, payment }: EditSalaryPaymentDialogProps) {
  const [employeeName, setEmployeeName] = useState('');
  const [position, setPosition] = useState('');
  const [paymentDate, setPaymentDate] = useState<Date | undefined>();
  const [amount, setAmount] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (payment) {
        setEmployeeName(payment.employeeName);
        setPosition(payment.position);
        setPaymentDate(parseISO(payment.paymentDate));
        setAmount(String(payment.amount));
    }
  }, [payment]);

  const handleSubmit = () => {
    const numericAmount = parseFloat(amount);
    if (!employeeName || !position || !paymentDate || isNaN(numericAmount) || numericAmount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Please fill out all fields with valid data.',
      });
      return;
    }

    onUpdate({
      ...payment,
      employeeName,
      position,
      paymentDate: format(paymentDate, 'yyyy-MM-dd'),
      amount: numericAmount,
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Salary Payment</DialogTitle>
          <DialogDescription>
            Update the details for this salary payment record.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="employee-name" className="text-right">
              Employee Name
            </Label>
            <Input
              id="employee-name"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., John Doe"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="position" className="text-right">
              Position
            </Label>
            <Input
              id="position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Sales Manager"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="payment-date" className="text-right">
              Payment Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !paymentDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {paymentDate ? format(paymentDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={paymentDate}
                  onSelect={setPaymentDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="col-span-3"
              placeholder="e.g., 50000"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
