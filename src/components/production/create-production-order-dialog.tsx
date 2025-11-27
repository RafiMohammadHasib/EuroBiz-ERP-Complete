
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
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ProductionOrder, FinishedGood, RawMaterial } from '@/lib/data';
import { Separator } from '../ui/separator';
import { useSettings } from '@/context/settings-context';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateProductionOrderDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (order: Omit<ProductionOrder, 'id' | 'createdAt'>) => void;
  products: FinishedGood[];
  rawMaterials: RawMaterial[];
}

export function CreateProductionOrderDialog({ isOpen, onOpenChange, onCreate, products, rawMaterials }: CreateProductionOrderDialogProps) {
  const { toast } = useToast();
  const { currencySymbol } = useSettings();

  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [labourCost, setLabourCost] = useState('');
  const [wastageValue, setWastageValue] = useState('');
  const [otherCosts, setOtherCosts] = useState('');
  const [status, setStatus] = useState<'In Progress' | 'Completed' | 'Pending'>('Pending');

  const { materialCost, totalCost, unitCost, productName, requiredMaterials, isStockAvailable } = useMemo(() => {
    const selectedProduct = products.find(p => p.id === productId);
    const numericQuantity = parseInt(quantity, 10) || 0;
    
    if (!selectedProduct || !rawMaterials.length || numericQuantity <= 0) {
      return { materialCost: 0, totalCost: 0, unitCost: 0, productName: '', requiredMaterials: [], isStockAvailable: false };
    }

    const materialCostPerUnit = selectedProduct.components.reduce((acc, component) => {
      const material = rawMaterials.find(rm => rm.id === component.materialId);
      return acc + (material ? material.unitCost * component.quantity : 0);
    }, 0);

    const materialCost = materialCostPerUnit * numericQuantity;
    
    const numericLabourCost = parseFloat(labourCost) || 0;
    const numericWastageValue = parseFloat(wastageValue) || 0;
    const numericOtherCosts = parseFloat(otherCosts) || 0;

    const totalCost = materialCost + numericLabourCost + numericWastageValue + numericOtherCosts;
    const unitCost = totalCost / numericQuantity;

    const requiredMaterials = selectedProduct.components.map(component => {
        const material = rawMaterials.find(rm => rm.id === component.materialId);
        const required = component.quantity * numericQuantity;
        const available = material?.quantity || 0;
        return {
            name: material?.name || 'Unknown Material',
            required,
            available,
            unit: material?.unit || '',
            isAvailable: available >= required,
        };
    });

    const isStockAvailable = requiredMaterials.every(m => m.isAvailable);

    return { materialCost, totalCost, unitCost, productName: selectedProduct.productName, requiredMaterials, isStockAvailable };
  }, [productId, quantity, products, rawMaterials, labourCost, wastageValue, otherCosts]);

  const resetForm = () => {
    setProductId('');
    setQuantity('');
    setLabourCost('');
    setWastageValue('');
    setOtherCosts('');
    setStatus('Pending');
  }

  const handleSubmit = () => {
    const numericQuantity = parseInt(quantity, 10);
    if (!productId || isNaN(numericQuantity) || numericQuantity <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Please select a product and enter a valid quantity.',
      });
      return;
    }
    
    if (!isStockAvailable) {
        toast({
            variant: 'destructive',
            title: 'Insufficient Stock',
            description: 'Cannot create order due to unavailable raw materials.',
        });
        return;
    }

    onCreate({
      productName,
      quantity: numericQuantity,
      materialCost,
      labourCost: parseFloat(labourCost) || 0,
      otherCosts: parseFloat(otherCosts) || 0,
      wastageValue: parseFloat(wastageValue) || 0,
      totalCost,
      unitCost,
      status,
      startDate: new Date().toISOString().split('T')[0],
    });
    
    toast({
      title: 'Production Order Created',
      description: `New order for ${quantity} units of ${productName} has been created.`,
    });

    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New Production Order</DialogTitle>
          <DialogDescription>
            Fill in the details for the new production run. Costs will be calculated automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="product-name">Product</Label>
                <Select value={productId} onValueChange={setProductId}>
                    <SelectTrigger id="product-name">
                        <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                        {products.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.productName}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity to Produce</Label>
                <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g., 500"
                />
            </div>
          </div>
          
           {requiredMaterials.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Required Materials</Label>
              <div className="mt-2 space-y-2 rounded-md border p-2">
                {requiredMaterials.map((mat, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                        <div className="flex items-center">
                            {mat.isAvailable ? (
                                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            ) : (
                                <AlertCircle className="h-4 w-4 mr-2 text-destructive" />
                            )}
                            <span>{mat.name}</span>
                        </div>
                        <span className={cn('font-mono text-xs', !mat.isAvailable && 'text-destructive')}>
                            {mat.required.toLocaleString()} / {mat.available.toLocaleString()} {mat.unit}
                        </span>
                    </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="material-cost">Material Cost</Label>
                <Input
                id="material-cost"
                type="text"
                value={`${currencySymbol}${materialCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                readOnly
                className="font-medium bg-muted"
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="labour-cost">Labour Cost</Label>
                <Input
                id="labour-cost"
                type="number"
                value={labourCost}
                onChange={(e) => setLabourCost(e.target.value)}
                placeholder="e.g., 5000"
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="wastage-value">Wastage Value</Label>
                <Input
                id="wastage-value"
                type="number"
                value={wastageValue}
                onChange={(e) => setWastageValue(e.target.value)}
                placeholder="e.g., 250"
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="other-costs">Other Costs</Label>
                <Input
                id="other-costs"
                type="number"
                value={otherCosts}
                onChange={(e) => setOtherCosts(e.target.value)}
                placeholder="e.g., 1000"
                />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as 'In Progress' | 'Completed' | 'Pending')}>
                <SelectTrigger id="status">
                    <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
            </Select>
          </div>
          
          <Separator />

          <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
             <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Production Cost</p>
                <p className="text-2xl font-bold">{currencySymbol}{totalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
             </div>
             <div className="text-center">
                <p className="text-sm text-muted-foreground">Cost Per Unit</p>
                <p className="text-2xl font-bold">{currencySymbol}{unitCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
             </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={!productId || !quantity || !isStockAvailable}>
            Create Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
