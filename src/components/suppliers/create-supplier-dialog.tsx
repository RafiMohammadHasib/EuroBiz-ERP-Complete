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
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Supplier } from '@/lib/data';

interface CreateSupplierDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (supplier: Omit<Supplier, 'id'>) => void;
}

export function CreateSupplierDialog({ isOpen, onOpenChange, onCreate }: CreateSupplierDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  const handleSubmit = () => {
    if (!name || !category) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Please fill out all fields with valid data.',
      });
      return;
    }

    onCreate({
      name,
      category,
      status,
    });
    
    toast({
      title: 'Supplier Added (Simulated)',
      description: `New supplier "${name}" has been added.`,
    });

    setName('');
    setCategory('');
    setStatus('Active');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Supplier</DialogTitle>
          <DialogDescription>
            Fill in the details for the new supplier.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sup-name" className="text-right">
              Name
            </Label>
            <Input
              id="sup-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Chemical Supply Inc."
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sup-category" className="text-right">
              Category
            </Label>
            <Input
              id="sup-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Chemicals"
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
          <Button type="submit" onClick={handleSubmit}>Save Supplier</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
