
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FinishedGood, RawMaterial } from '@/lib/data';
import { PlusCircle, Trash2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { useSettings } from '@/context/settings-context';

interface CreateFormulaDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (formula: Omit<FinishedGood, 'id'>) => void;
  rawMaterials: RawMaterial[];
}

export function CreateFormulaDialog({ isOpen, onOpenChange, onCreate, rawMaterials }: CreateFormulaDialogProps) {
  const { toast } = useToast();
  const { currency } = useSettings();
  const [productName, setProductName] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [components, setComponents] = useState<{ materialId: string; quantity: number }[]>([]);

  const handleAddComponent = () => {
    setComponents([...components, { materialId: '', quantity: 0 }]);
  };

  const handleComponentChange = (index: number, field: 'materialId' | 'quantity', value: string | number) => {
    const newComponents = [...components];
    const component = newComponents[index];
    if (field === 'materialId') {
        component.materialId = value as string;
    } else {
        component.quantity = Number(value);
    }
    setComponents(newComponents);
  };
  
  const handleRemoveComponent = (index: number) => {
    const newComponents = components.filter((_, i) => i !== index);
    setComponents(newComponents);
  };

  const calculateUnitCost = () => {
    return components.reduce((total, comp) => {
        const material = rawMaterials.find(rm => rm.id === comp.materialId);
        if (material) {
            return total + (material.unitCost * comp.quantity);
        }
        return total;
    }, 0);
  };


  const resetForm = () => {
    setProductName('');
    setSellingPrice('');
    setComponents([]);
  }

  const handleSubmit = () => {
    if (!productName || components.length === 0 || components.some(c => !c.materialId || c.quantity <= 0)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Please provide a product name and at least one valid component.',
      });
      return;
    }

    const unitCost = calculateUnitCost();

    onCreate({
      productName,
      quantity: 0, // Initial quantity is 0
      unitCost,
      sellingPrice: parseFloat(sellingPrice) || undefined,
      components,
    });
    
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Production Formula</DialogTitle>
          <DialogDescription>
            Define the raw material components for a new finished good.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2">
                <Label htmlFor="productName">Product Name</Label>
                <Input id="productName" value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g., Premium Glossy Paint" />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="sellingPrice">Selling Price (Optional)</Label>
                <Input id="sellingPrice" type="number" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} placeholder="e.g., 120" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Components</Label>
            <ScrollArea className="h-64 w-full rounded-md border">
                 <div className="grid grid-cols-[2fr_1fr_auto] gap-2 p-2 bg-muted/50 text-sm font-medium sticky top-0">
                    <div>Material</div>
                    <div>Quantity</div>
                    <div className="w-9"></div>
                </div>
                <Separator />
                <div className="p-2 space-y-2">
                    {components.map((component, index) => (
                    <div key={index} className="grid grid-cols-[2fr_1fr_auto] gap-2 items-center">
                        <Select
                            value={component.materialId}
                            onValueChange={(value) => handleComponentChange(index, 'materialId', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Material" />
                            </SelectTrigger>
                            <SelectContent>
                                {rawMaterials.map(m => (
                                    <SelectItem key={m.id} value={m.id}>{m.name} ({m.unit})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input
                        type="number"
                        placeholder="Quantity"
                        value={component.quantity}
                        onChange={(e) => handleComponentChange(index, 'quantity', e.target.value)}
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveComponent(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                    ))}
                </div>
            </ScrollArea>
            <Button variant="outline" size="sm" onClick={handleAddComponent} className="mt-2">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Component
            </Button>
          </div>
           <Separator />
            <div className="flex justify-end items-center">
                <div className="text-right">
                    <p className="text-sm text-muted-foreground">Calculated Unit Cost</p>
                    <p className="font-bold text-lg">{currency} {calculateUnitCost().toFixed(2)}</p>
                </div>
            </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Save Formula</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
