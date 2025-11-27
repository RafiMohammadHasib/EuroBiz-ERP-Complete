
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { PurchaseOrder, Supplier, RawMaterial, PurchaseOrderItem } from '@/lib/data';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Separator } from '../ui/separator';
import { useSettings } from '@/context/settings-context';
import { useRouter } from 'next/navigation';

interface CreatePurchaseOrderFormProps {
  onCreate: (order: Omit<PurchaseOrder, 'id'>) => void;
  suppliers: Supplier[];
  rawMaterials: RawMaterial[];
  isLoading: boolean;
}

export function CreatePurchaseOrderForm({ onCreate, suppliers, rawMaterials, isLoading }: CreatePurchaseOrderFormProps) {
  const { toast } = useToast();
  const { currencySymbol } = useSettings();
  const router = useRouter();
  
  const [supplier, setSupplier] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState<PurchaseOrder['deliveryStatus']>('Pending');
  const [items, setItems] = useState<Omit<PurchaseOrderItem, 'id'>[]>([]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);

  const handleAddItem = () => {
    setItems([...items, { rawMaterialId: '', quantity: 1, unitCost: 0 }]);
  };

  const handleItemChange = (index: number, field: keyof Omit<PurchaseOrderItem, 'id'>, value: string | number) => {
    const newItems = [...items];
    const material = rawMaterials.find(rm => rm.id === value);
    
    const item = newItems[index] as any;
    if (field === 'rawMaterialId' && material) {
        item[field] = material.id;
        item['unitCost'] = material.unitCost; // auto-fill unit cost
    } else {
        item[field] = value;
    }
    setItems(newItems);
  };
  
  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const { subTotal, grandTotal, dueAmount } = useMemo(() => {
    const subTotal = items.reduce((total, item) => total + item.quantity * item.unitCost, 0);
    const grandTotal = subTotal - discount + tax;
    const dueAmount = grandTotal - paidAmount;
    return { subTotal, grandTotal, dueAmount };
  }, [items, discount, tax, paidAmount]);

  const handleSubmit = () => {
    if (!supplier || items.length === 0 || items.some(i => !i.rawMaterialId || i.quantity <= 0 || i.unitCost < 0)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Please select a supplier and add at least one valid item.',
      });
      return;
    }

    const newOrderItems: PurchaseOrderItem[] = items.map((item, index) => ({
        id: `po-item-${Date.now()}-${index}`,
        ...item
    }));

    let initialPaymentStatus: PurchaseOrder['paymentStatus'];
    if (dueAmount <= 0.001) {
        initialPaymentStatus = 'Paid';
    } else if (paidAmount > 0) {
        initialPaymentStatus = 'Partially Paid';
    } else {
        initialPaymentStatus = 'Unpaid';
    }

    onCreate({
      supplier,
      amount: grandTotal,
      deliveryStatus,
      paymentStatus: initialPaymentStatus,
      date: new Date().toISOString().split('T')[0],
      items: newOrderItems,
      discount,
      tax,
      paidAmount,
      dueAmount,
    });
  };

  return (
    <div className="grid gap-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
            <Label htmlFor="supplier">Supplier</Label>
            <Select value={supplier} onValueChange={setSupplier}>
                <SelectTrigger id="supplier">
                    <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent>
                    {suppliers.map(s => (
                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
            <div className="grid gap-2">
            <Label htmlFor="deliveryStatus">Delivery Status</Label>
            <Select value={deliveryStatus} onValueChange={(value) => setDeliveryStatus(value as PurchaseOrder['deliveryStatus'])}>
                <SelectTrigger id="deliveryStatus">
                    <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Shipped">Shipped</SelectItem>
                    <SelectItem value="Received">Received</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
            </Select>
        </div>
        </div>

        <div className="space-y-2">
        <Label>Items</Label>
        <div className="rounded-md border">
            <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 p-2 bg-muted/50 text-sm font-medium">
                <div>Material</div>
                <div>Quantity</div>
                <div>Unit Cost</div>
                <div className="w-9"></div>
            </div>
            <Separator />
            {items.map((item, index) => (
            <div key={index} className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 items-center p-2">
                <Select
                    value={item.rawMaterialId}
                    onValueChange={(value) => handleItemChange(index, 'rawMaterialId', value)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select Material" />
                    </SelectTrigger>
                    <SelectContent>
                        {rawMaterials.map(m => (
                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Input
                type="number"
                placeholder="Quantity"
                value={item.quantity}
                min={1}
                onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                />
                <Input
                type="number"
                placeholder="Unit Cost"
                value={item.unitCost}
                onChange={(e) => handleItemChange(index, 'unitCost', parseFloat(e.target.value) || 0)}
                />
                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}>
                <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </div>
            ))}
        </div>
        <Button variant="outline" size="sm" onClick={handleAddItem} className="mt-2">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Item
        </Button>
        </div>

        <Separator />
        
        <div className="flex justify-end">
        <div className="w-full md:w-1/2 space-y-4">
            <div className="flex justify-between items-center">
                <Label htmlFor="discount">Discount</Label>
                <Input id="discount" type="number" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} placeholder="0.00" className="text-right w-32" />
            </div>
            <div className="flex justify-between items-center">
                <Label htmlFor="tax">VAT/Tax</Label>
                <Input id="tax" type="number" value={tax} onChange={e => setTax(parseFloat(e.target.value) || 0)} placeholder="0.00" className="text-right w-32" />
            </div>
             <div className="flex justify-between items-center">
                <Label htmlFor="paidAmount">Paid Amount</Label>
                <Input id="paidAmount" type="number" value={paidAmount} onChange={e => setPaidAmount(parseFloat(e.target.value) || 0)} placeholder="0.00" className="text-right w-32" />
            </div>
            <Separator />
             <div className="flex justify-between items-center text-lg font-semibold">
                <p>Grand Total</p>
                <p>{currencySymbol}{grandTotal.toLocaleString()}</p>
            </div>
             <div className="flex justify-between items-center text-lg font-semibold text-destructive">
                <p>Due Amount</p>
                <p>{currencySymbol}{dueAmount.toLocaleString()}</p>
            </div>
        </div>
        </div>
        <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Purchase Order'}
            </Button>
        </div>
    </div>
  );
}
