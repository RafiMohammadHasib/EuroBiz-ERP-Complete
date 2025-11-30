
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { FinishedGood, InvoiceItem } from '@/lib/data';
import { Trash2 } from 'lucide-react';
import { useSettings } from '@/context/settings-context';
import { useMemo } from 'react';

interface InvoiceItemFormProps {
  item: Omit<InvoiceItem, 'id' | 'total'>;
  products: FinishedGood[];
  onChange: (item: Omit<InvoiceItem, 'id' | 'total'>) => void;
  onRemove: () => void;
}

export function InvoiceItemForm({ item, products, onChange, onRemove }: InvoiceItemFormProps) {
  const { currencySymbol } = useSettings();

  const selectedProduct = useMemo(() => {
    return products.find(p => p.productName === item.description);
  }, [item.description, products]);

  const handleProductChange = (productName: string) => {
    const product = products.find(p => p.productName === productName);
    onChange({
      ...item,
      description: productName,
      unitPrice: product?.sellingPrice || 0,
      quantity: 1, // Reset quantity to 1 on product change
    });
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...item, quantity: parseInt(e.target.value, 10) || 0 });
  };
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...item, unitPrice: parseFloat(e.target.value) || 0 });
  };
  
  const total = item.quantity * item.unitPrice;

  return (
    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 items-center p-2 border-b">
      <Select value={item.description} onValueChange={handleProductChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a product" />
        </SelectTrigger>
        <SelectContent>
          {products.map(p => (
            <SelectItem key={p.id} value={p.productName}>
              {p.productName} ({p.quantity} available)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="number"
        placeholder="Qty"
        value={item.quantity}
        onChange={handleQuantityChange}
        min="1"
        max={selectedProduct?.quantity}
        className="text-right"
      />
      <div className="relative">
          <Input
            type="number"
            placeholder="Price"
            value={item.unitPrice}
            onChange={handlePriceChange}
            className="text-right"
          />
      </div>
      <div className="text-right font-medium pr-2">{currencySymbol}{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      <Button variant="ghost" size="icon" onClick={onRemove}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}
