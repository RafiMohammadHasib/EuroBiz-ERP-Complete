
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Invoice, FinishedGood, InvoiceItem as InvoiceItemType, Distributor } from '@/lib/data';
import { useSettings } from '@/context/settings-context';
import { PlusCircle } from 'lucide-react';
import { Separator } from '../ui/separator';
import { InvoiceItemForm } from './invoice-item-form';

interface CreateInvoiceFormProps {
  distributors: Distributor[];
  products: FinishedGood[];
  onCreateInvoice: (invoice: Omit<Invoice, 'id'>) => void;
  isLoading: boolean;
}

export function CreateInvoiceDialog({ distributors, products, onCreateInvoice, isLoading }: CreateInvoiceFormProps) {
  const { toast } = useToast();
  const { currencySymbol } = useSettings();
  
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [status, setStatus] = useState<'Paid' | 'Unpaid' | 'Overdue'>('Unpaid');
  const [items, setItems] = useState<Omit<InvoiceItemType, 'id' | 'total'>[]>([]);

  useEffect(() => {
    // Since distributors don't have an email in the current data model, we'll leave it blank.
    // This can be updated if the distributor data model changes.
    setCustomerEmail('');
  }, [customerName]);


  const handleItemChange = (index: number, updatedItem: Omit<InvoiceItemType, 'id' | 'total'>) => {
    const newItems = [...items];
    newItems[index] = updatedItem;
    setItems(newItems);
  };
  
  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };
  
  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };
  
  const subTotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

  const handleSubmit = () => {
    if (!customerName || items.length === 0 || items.some(i => !i.description || i.quantity <= 0 || i.unitPrice <= 0)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Please select a distributor and add at least one valid item.',
      });
      return;
    }

    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + 30);

    const newInvoice: Omit<Invoice, 'id'> = {
      customer: customerName,
      customerEmail: customerEmail, // This will be blank for now
      amount: subTotal,
      status,
      date: today.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      items: items.map((item, index) => ({
          ...item,
          id: `item-${Date.now()}-${index}`,
          total: item.quantity * item.unitPrice,
      })),
    };
    
    onCreateInvoice(newInvoice);

    // Reset form
    setCustomerName('');
    setCustomerEmail('');
    setStatus('Unpaid');
    setItems([]);
  };

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="grid gap-2">
                <Label htmlFor="distributor-name">Distributor</Label>
                <Select value={customerName} onValueChange={setCustomerName}>
                    <SelectTrigger id="distributor-name">
                        <SelectValue placeholder="Select a distributor" />
                    </SelectTrigger>
                    <SelectContent>
                        {distributors.map(d => (
                            <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="customer-email">Email</Label>
                <Input id="customer-email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="(Optional) Distributor email" />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as 'Paid' | 'Unpaid' | 'Overdue')}>
                    <SelectTrigger id="status">
                        <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Unpaid">Unpaid</SelectItem>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Overdue">Overdue</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        <div className="space-y-4">
            <Label className="font-semibold">Invoice Items</Label>
            <div className="rounded-md border p-4 space-y-4">
                {items.map((item, index) => (
                    <InvoiceItemForm
                        key={index}
                        item={item}
                        products={products}
                        onChange={(updatedItem) => handleItemChange(index, updatedItem)}
                        onRemove={() => handleRemoveItem(index)}
                    />
                ))}
                 <Button variant="outline" size="sm" onClick={handleAddItem} className="mt-2">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                </Button>
            </div>
        </div>
        
        <Separator />

        <div className="flex justify-end">
            <div className="w-full md:w-1/3 space-y-2">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{currencySymbol}{subTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">{currencySymbol}0.00</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-lg">{currencySymbol}{subTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
            </div>
        </div>

        <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isLoading} size="lg">
                {isLoading ? 'Saving...' : 'Generate Invoice'}
            </Button>
        </div>

    </div>
  );
}
