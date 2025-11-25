
'use client';

import { useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Salary } from '@/lib/data';

interface CreateSalaryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (salary: Omit<Salary, 'id' | 'paymentDate'>) => void;
}

export function CreateSalaryDialog({ isOpen, onOpenChange, onCreate }: CreateSalaryDialogProps) {
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  const handleSubmit = () => {
    const numericAmount = parseFloat(amount);
    if (!name || !position || !amount || isNaN(numericAmount) || numericAmount <= 0) {
      // Simple validation, can be improved with a library like Zod
      alert('Please fill out all fields with valid data.');
      return;
    }

    onCreate({
      name,
      position,
      amount: numericAmount,
      status,
    });
    
    setName('');
    setPosition('');
    setAmount('');
    setStatus('Active');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Employee Salary</DialogTitle>
          <DialogDescription>
            Fill in the details for the new employee.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="emp-name" className="text-right">
              Name
            </Label>
            <Input
              id="emp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., John Doe"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="emp-position" className="text-right">
              Position
            </Label>
            <Input
              id="emp-position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Sales Manager"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Salary (BDT)
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select value={status} onValueChange={(value) => setStatus(value as 'Active' | 'Inactive')}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Save Employee</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
