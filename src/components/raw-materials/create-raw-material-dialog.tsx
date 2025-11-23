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
import { RawMaterial } from '@/lib/data';

interface CreateRawMaterialDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (material: Omit<RawMaterial, 'id' | 'quantity' | 'unitCost'>) => void;
}

export function CreateRawMaterialDialog({ isOpen, onOpenChange, onCreate }: CreateRawMaterialDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState<'kg' | 'litre' | 'pcs'>('kg');

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
      unit,
    });
    
    toast({
      title: 'Raw Material Added (Simulated)',
      description: `New material "${name}" has been added to inventory.`,
    });

    setName('');
    setCategory('');
    setUnit('kg');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Raw Material</DialogTitle>
          <DialogDescription>
            Fill in the details for the new raw material.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="mat-name" className="text-right">
              Name
            </Label>
            <Input
              id="mat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Titanium Dioxide"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="mat-category" className="text-right">
              Category
            </Label>
            <Input
              id="mat-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Pigment"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="mat-unit" className="text-right">
              Unit
            </Label>
             <Select value={unit} onValueChange={(value) => setUnit(value as 'kg' | 'litre' | 'pcs')}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select Unit" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="litre">litre</SelectItem>
                    <SelectItem value="pcs">pcs</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Save Material</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
