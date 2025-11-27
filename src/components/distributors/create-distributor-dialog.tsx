
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
import { Distributor } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

interface CreateDistributorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (distributor: Omit<Distributor, 'id' | 'totalSales'>) => void;
}

export function CreateDistributorDialog({ isOpen, onOpenChange, onCreate }: CreateDistributorDialogProps) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [tier, setTier] = useState<'Tier 1' | 'Tier 2' | 'Tier 3'>('Tier 2');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!name || !location) {
       toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Please fill out name and location.',
      });
      return;
    }

    const distributorData: Omit<Distributor, 'id' | 'totalSales'> = {
      name,
      location,
      tier,
      ...(email && { email }),
      ...(phone && { phone }),
    };

    onCreate(distributorData);
    
    setName('');
    setLocation('');
    setTier('Tier 2');
    setEmail('');
    setPhone('');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Distributor</DialogTitle>
          <DialogDescription>
            Fill in the details for the new distributor. Total sales will be calculated automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dist-name" className="text-right">
              Name
            </Label>
            <Input
              id="dist-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Regional Sales Co."
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dist-location" className="text-right">
              Location
            </Label>
            <Input
              id="dist-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Dhaka, Bangladesh"
            />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dist-email" className="text-right">
              Email
            </Label>
            <Input
              id="dist-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3"
              placeholder="(Optional) contact@example.com"
            />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dist-phone" className="text-right">
              Phone
            </Label>
            <Input
              id="dist-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="col-span-3"
              placeholder="(Optional) +880123456789"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dist-tier" className="text-right">
              Tier
            </Label>
             <Select value={tier} onValueChange={(value) => setTier(value as 'Tier 1' | 'Tier 2' | 'Tier 3')}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select Tier" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Tier 1">Tier 1</SelectItem>
                    <SelectItem value="Tier 2">Tier 2</SelectItem>
                    <SelectItem value="Tier 3">Tier 3</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Save Distributor</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
