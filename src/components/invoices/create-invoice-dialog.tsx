
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Invoice, FinishedGood, InvoiceItem as InvoiceItemType, Distributor, Commission } from '@/lib/data';
import { useSettings } from '@/context/settings-context';
import { PlusCircle } from 'lucide-react';
import { Separator } from '../ui/separator';
import { InvoiceItemForm } from './invoice-item-form';

interface CreateInvoiceFormProps {
  distributors: Distributor[];
  products: FinishedGood[];
  commissionRules: Commission[];
  onCreateInvoice: (invoice: Omit<Invoice, 'id'>, totalCommission: number) => void;
  isLoading: boolean;
}

export function CreateInvoiceDialog({ distributors, products, commissionRules, onCreateInvoice, isLoading }: CreateInvoiceFormProps) {
  const { toast } = useToast();
  const { currencySymbol } = useSettings();
  
  const [customerName, setCustomerName] = useState('');
  const [items, setItems] = useState<Omit<InvoiceItemType, 'id' | 'total'>[]>([]);
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentType, setPaymentType] = useState<'Cash' | 'Card' | 'Bank Transfer'>('Cash');


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
  
  const { subTotal, totalCommission, grandTotal } = useMemo(() => {
    const distributor = distributors.find(d => d.name === customerName);
    let subTotal = 0;
    let totalCommission = 0;

    items.forEach(item => {
        const itemTotal = item.quantity * item.unitPrice;
        subTotal += itemTotal;
        let itemDiscountRate = 0;

        const product = products.find(p => p.productName === item.description);
        if (!product || !distributor) return;

        (commissionRules || []).forEach(rule => {
            if (rule.type === 'Percentage') {
                const ruleAppliesToProduct = rule.appliesTo.includes(product.productName);
                const ruleAppliesToDistributor = rule.appliesTo.includes(distributor.name);
                const ruleAppliesToTier = rule.appliesTo.includes(distributor.tier);

                if (ruleAppliesToProduct || ruleAppliesToDistributor || ruleAppliesToTier) {
                    itemDiscountRate += rule.rate;
                }
            }
        });
        
        if (itemDiscountRate > 0) {
            totalCommission += itemTotal * (itemDiscountRate / 100);
        }
    });

    const grandTotal = subTotal - totalCommission;
    return { subTotal, totalCommission, grandTotal };
  }, [items, customerName, distributors, products, commissionRules]);

  const dueAmount = useMemo(() => {
    const numericPaidAmount = parseFloat(paidAmount) || 0;
    return grandTotal - numericPaidAmount;
  }, [grandTotal, paidAmount]);


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
    
    const numericPaidAmount = parseFloat(paidAmount) || 0;

    let invoiceStatus: Invoice['status'] = 'Unpaid';
    if (numericPaidAmount > 0) {
        if (numericPaidAmount < grandTotal) {
            invoiceStatus = 'Partially Paid';
        } else {
            invoiceStatus = 'Paid';
        }
    }
     if (grandTotal <= 0 && numericPaidAmount <= 0) {
        invoiceStatus = 'Paid'; // Consider it paid if total is 0
    }

    const newInvoice: Omit<Invoice, 'id'> = {
      customer: customerName,
      customerEmail: distributors.find(d => d.name === customerName)?.email || '',
      totalAmount: grandTotal,
      paidAmount: numericPaidAmount,
      dueAmount: grandTotal - numericPaidAmount,
      status: invoiceStatus,
      date: today.toISOString(),
      dueDate: dueDate.toISOString().split('T')[0],
      items: items.map((item, index) => ({
          ...item,
          id: `item-${Date.now()}-${index}`,
          total: item.quantity * item.unitPrice,
      })),
    };
    
    onCreateInvoice(newInvoice, totalCommission);

    // Reset form
    setCustomerName('');
    setItems([]);
    setPaidAmount('');
  };

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                 <div className="flex justify-between text-destructive">
                    <span className="text-muted-foreground">Commission</span>
                    <span className="font-medium">-{currencySymbol}{totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">{currencySymbol}0.00</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-lg">{currencySymbol}{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                 <div className="grid grid-cols-2 gap-4 pt-4">
                     <div className="grid gap-2">
                        <Label htmlFor="paidAmount">Amount Paid</Label>
                        <Input
                            id="paidAmount"
                            type="number"
                            value={paidAmount}
                            onChange={(e) => setPaidAmount(e.target.value)}
                            placeholder="0.00"
                        />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="paymentType">Payment Type</Label>
                        <Select value={paymentType} onValueChange={(value) => setPaymentType(value as any)}>
                            <SelectTrigger id="paymentType">
                                <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Cash">Cash</SelectItem>
                                <SelectItem value="Card">Card</SelectItem>
                                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                 <Separator />
                 <div className="flex justify-between font-bold text-lg text-destructive">
                    <span>Due Amount</span>
                    <span>{currencySymbol}{dueAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
