
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
import { Commission } from '@/lib/data';

interface CreateCommissionRuleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (rule: Omit<Commission, 'id'>) => void;
}

export function CreateCommissionRuleDialog({ isOpen, onOpenChange, onCreate }: CreateCommissionRuleDialogProps) {
  const [ruleName, setRuleName] = useState('');
  const [appliesTo, setAppliesTo] = useState('');
  const [type, setType] = useState<'Percentage' | 'Fixed'>('Percentage');
  const [rate, setRate] = useState('');

  const handleSubmit = () => {
    const numericRate = parseFloat(rate);
    if (!ruleName || !appliesTo || !rate || isNaN(numericRate) || numericRate <= 0) {
      alert('Please fill out all fields with valid data.');
      return;
    }

    onCreate({
      ruleName,
      appliesTo,
      type,
      rate: numericRate,
    });
    
    setRuleName('');
    setAppliesTo('');
    setType('Percentage');
    setRate('');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Commission Rule</DialogTitle>
          <DialogDescription>
            Fill in the details for the new commission rule.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rule-name" className="text-right">
              Rule Name
            </Label>
            <Input
              id="rule-name"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Q4 Bonus"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="applies-to" className="text-right">
              Applies To
            </Label>
            <Input
              id="applies-to"
              value={appliesTo}
              onChange={(e) => setAppliesTo(e.target.value)}
              className="col-span-3"
              placeholder="e.g., All Products, Tier 1"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Type
            </Label>
             <Select value={type} onValueChange={(value) => setType(value as 'Percentage' | 'Fixed')}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Percentage">Percentage</SelectItem>
                    <SelectItem value="Fixed">Fixed</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rate" className="text-right">
              Rate
            </Label>
            <Input
              id="rate"
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="col-span-3"
              placeholder={type === 'Percentage' ? "e.g., 5.5" : "e.g., 1000"}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Save Rule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
