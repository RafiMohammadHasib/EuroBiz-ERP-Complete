
'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { SalesReturn, Invoice, FinishedGood } from '@/lib/data';
import { PlusCircle, Trash2, CalendarIcon } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import { useSettings } from '@/context/settings-context';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface CreateSalesReturnDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (sreturn: Omit<SalesReturn, 'id'>) => void;
  invoices: Invoice[];
  products: FinishedGood[];
}

export function CreateSalesReturnDialog({ isOpen, onOpenChange, onCreate, invoices, products }: CreateSalesReturnDialogProps) {
  const { toast } = useToast();
  const { currencySymbol } = useSettings();

  const [invoiceId, setInvoiceId] = useState('');
  const [returnDate, setReturnDate] = useState<Date | undefined>(new Date());
  const [items, setItems] = useState<{ productId: string, productName: string, quantity: number, unitPrice: number }[]>([]);
  const [reason, setReason] = useState('');
  
  const selectedInvoice = useMemo(() => invoices.find(inv => inv.id === invoiceId), [invoiceId, invoices]);

  useEffect(() => {
    // Reset items when invoice changes
    setItems([]);
  }, [invoiceId]);

  const handleAddItem = () => {
    if (!selectedInvoice) {
      toast({ variant: 'destructive', title: 'Please select an invoice first.' });
      return;
    }
    setItems([...items, { productId: '', productName: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleItemChange = (index: number, field: 'productId' | 'quantity', value: string | number) => {
    const newItems = [...items];
    const item = newItems[index];

    if (field === 'productId') {
        const invoiceItem = selectedInvoice?.items.find(i => i.description === value);
        const product = products.find(p => p.productName === value);
        if (invoiceItem && product) {
            item.productId = product.id;
            item.productName = invoiceItem.description;
            item.unitPrice = invoiceItem.unitPrice;
        }
    } else if (field === 'quantity') {
        item.quantity = Number(value);
    }
    setItems(newItems);
  };
  
  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };
  
  const totalReturnValue = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  }, [items]);

  const resetForm = () => {
    setInvoiceId('');
    setReturnDate(new Date());
    setItems([]);
    setReason('');
  }

  const handleSubmit = () => {
    if (!invoiceId || !returnDate || items.length === 0 || items.some(i => !i.productId || i.quantity <= 0)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Please fill all fields and add at least one valid item.',
      });
      return;
    }

    onCreate({
      invoiceId,
      returnDate: returnDate.toISOString(),
      items,
      totalReturnValue,
      reason,
    });
    
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Sales Return</DialogTitle>
          <DialogDescription>
            Process a customer return against an existing invoice. Stock and invoice dues will be updated.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="invoiceId">Original Invoice</Label>
                <Select value={invoiceId} onValueChange={setInvoiceId}>
                    <SelectTrigger id="invoiceId">
                        <SelectValue placeholder="Select an invoice" />
                    </SelectTrigger>
                    <SelectContent>
                        {invoices.map(inv => (
                            <SelectItem key={inv.id} value={inv.id}>
                                {inv.invoiceNumber} ({inv.customer})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="returnDate">Return Date</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !returnDate && "text-muted-foreground"
                        )}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {returnDate ? format(returnDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                        mode="single"
                        selected={returnDate}
                        onSelect={setReturnDate}
                        initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>
          </div>
          
           <div className="space-y-2">
            <Label>Returned Items</Label>
            <div className="rounded-md border">
                <div className="p-2 space-y-2">
                    {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-[2fr_1fr_auto] gap-2 items-center">
                        <Select
                            value={item.productName}
                            onValueChange={(value) => handleItemChange(index, 'productId', value)}
                            disabled={!selectedInvoice}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Item" />
                            </SelectTrigger>
                            <SelectContent>
                                {selectedInvoice?.items.map(invItem => (
                                    <SelectItem key={invItem.id} value={invItem.description}>{invItem.description}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input
                            type="number"
                            placeholder="Quantity"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            max={selectedInvoice?.items.find(i => i.description === item.productName)?.quantity}
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                    ))}
                </div>
                 <Button variant="outline" size="sm" onClick={handleAddItem} className="m-2" disabled={!selectedInvoice}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reason">Reason for Return</Label>
            <Textarea 
                id="reason" 
                value={reason} 
                onChange={e => setReason(e.target.value)} 
                placeholder="e.g., Damaged goods, wrong item, etc."
            />
          </div>

          <Separator />

          <div className="flex justify-end">
            <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Return Value</p>
                <p className="font-bold text-lg text-destructive">{currencySymbol}{totalReturnValue.toLocaleString()}</p>
            </div>
          </div>

        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Process Return</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
