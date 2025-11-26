
'use client';

import { useState, useMemo } from 'react';
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
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../ui/select';
import { Commission, Distributor, FinishedGood } from '@/lib/data';

interface CreateCommissionRuleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (rule: Omit<Commission, 'id'>) => void;
  products: FinishedGood[];
  distributors: Distributor[];
}

export function CreateCommissionRuleDialog({ isOpen, onOpenChange, onCreate, products, distributors }: CreateCommissionRuleDialogProps) {
  const [ruleName, setRuleName] = useState('');
  const [appliesTo, setAppliesTo] = useState('');
  const [type, setType] = useState<'Percentage' | 'Fixed'>('Percentage');
  const [rate, setRate] = useState('');

  const appliesToOptions = useMemo(() => {
    const productOptions = products.map(p => p.productName);
    const distributorOptions = distributors.map(d => d.name);
    const tierOptions = [...new Set(distributors.map(d => d.tier))];
    
    return {
      products: productOptions,
      distributors: distributorOptions,
      tiers: tierOptions
    };
  }, [products, distributors]);


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
            <Select value={appliesTo} onValueChange={setAppliesTo}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a product, distributor, or tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Products</SelectLabel>
                    {appliesToOptions.products.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Distributors</SelectLabel>
                    {appliesToOptions.distributors.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Distributor Tiers</SelectLabel>
                    {appliesToOptions.tiers.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectGroup>
                </SelectContent>
            </Select>
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
