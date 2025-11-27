
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
import { Invoice, FinishedGood } from '@/lib/data';
import { PlusCircle, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { Separator } from '../ui/separator';
import { useSettings } from '@/context/settings-context';
import { Textarea } from '../ui/textarea';

interface ProcessReturnDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  invoices: Invoice[];
  products: FinishedGood[];
  onProcessReturn: (invoice: Invoice, returnItems: {productId: string, quantity: number}[], reason: string) => Promise<boolean>;
}

export function ProcessReturnDialog({ isOpen, onOpenChange, invoices, products, onProcessReturn }: ProcessReturnDialogProps) {
  const { toast } = useToast();
  const { currencySymbol } = useSettings();
  
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [returnItems, setReturnItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedInvoice = useMemo(() => {
    return invoices.find(inv => inv.id === selectedInvoiceId);
  }, [selectedInvoiceId, invoices]);

  useEffect(() => {
    // Reset items when invoice changes
    setReturnItems([]);
    setReason('');
  }, [selectedInvoiceId]);

  const handleAddItem = () => {
    if (!selectedInvoice) return;
    const firstInvoiceItem = selectedInvoice.items[0];
    if (!firstInvoiceItem) return;

    const product = products.find(p => p.productName === firstInvoiceItem.description);
    if (!product) return;

    setReturnItems([...returnItems, { productId: product.id || '', quantity: 1 }]);
  };

  const handleItemChange = (index: number, field: 'productId' | 'quantity', value: string | number) => {
    const newItems = [...returnItems];
    const item = newItems[index];

    if (field === 'productId') {
        const product = products.find(p => p.id === value);
        if(product) {
            item.productId = product.id;
        }
    } else {
        const invoiceItem = selectedInvoice?.items.find(i => {
            const product = products.find(p => p.id === item.productId);
            return i.description === product?.productName
        });
        const maxQuantity = invoiceItem?.quantity || 0;
        const newQuantity = Math.max(0, Math.min(Number(value), maxQuantity));
        item.quantity = newQuantity;
    }
    setReturnItems(newItems);
  };
  
  const handleRemoveItem = (index: number) => {
    setReturnItems(returnItems.filter((_, i) => i !== index));
  };

  const totalReturnValue = useMemo(() => {
    return returnItems.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      const price = product?.sellingPrice || 0;
      return total + (price * item.quantity);
    }, 0);
  }, [returnItems, products]);

  const resetForm = () => {
    setSelectedInvoiceId('');
    setReturnItems([]);
    setReason('');
    setIsProcessing(false);
  }

  const handleSubmit = async () => {
    if (!selectedInvoice || returnItems.length === 0 || returnItems.some(i => !i.productId || i.quantity <= 0)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Please select an invoice and add at least one valid item to return.',
      });
      return;
    }
    
    if (totalReturnValue > selectedInvoice.dueAmount) {
         toast({
            variant: 'destructive',
            title: 'Invalid Return Amount',
            description: 'Total return value cannot exceed the invoice due amount.',
        });
        return;
    }

    setIsProcessing(true);
    const success = await onProcessReturn(selectedInvoice, returnItems, reason);
    if(success) {
        resetForm();
        onOpenChange(false);
    }
    setIsProcessing(false);
  };

  const getProductFromId = (id: string) => products.find(p => p.id === id);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Process New Sales Return</DialogTitle>
          <DialogDescription>
            Select an invoice and specify which items are being returned.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="grid gap-2">
                <Label htmlFor="invoice">Select Invoice</Label>
                <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId} disabled={isProcessing}>
                    <SelectTrigger id="invoice">
                        <SelectValue placeholder="Select an invoice" />
                    </SelectTrigger>
                    <SelectContent>
                        {invoices.filter(inv => inv.status !== 'Paid').map(inv => (
                            <SelectItem key={inv.id} value={inv.id}>{inv.id} - {inv.customer}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             {selectedInvoice && (
                <div className="flex items-center justify-center bg-muted/50 p-2 rounded-md text-sm">
                    <p>Amount Due: <span className="font-bold">{currencySymbol}{selectedInvoice.dueAmount?.toLocaleString()}</span></p>
                </div>
             )}
          </div>
          
          {selectedInvoice && (
            <div className="space-y-2">
              <Label>Items to Return</Label>
              <div className="rounded-md border p-2 space-y-2 max-h-60 overflow-y-auto">
                {returnItems.map((item, index) => {
                  const selectedProduct = getProductFromId(item.productId);
                  const invoiceItem = selectedInvoice.items.find(i => i.description === selectedProduct?.productName);
                  const maxQuantity = invoiceItem?.quantity || 0;
                  
                  return (
                    <div key={index} className="grid grid-cols-[2fr_1fr_auto] gap-2 items-center">
                      <Select
                        value={item.productId}
                        onValueChange={(value) => handleItemChange(index, 'productId', value)}
                        disabled={isProcessing}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Item" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedInvoice.items.map(invItem => {
                              const product = products.find(p => p.productName === invItem.description);
                              return product ? (
                                <SelectItem key={invItem.id} value={product.id}>{invItem.description}</SelectItem>
                              ) : null;
                          })}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="Quantity"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        max={maxQuantity}
                        min={1}
                        disabled={isProcessing}
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} disabled={isProcessing}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </div>
              <Button variant="outline" size="sm" onClick={handleAddItem} className="mt-2" disabled={isProcessing}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Item
              </Button>
            </div>
          )}
          
          <div className="grid gap-2">
            <Label htmlFor="reason">Reason for Return (Optional)</Label>
            <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., Damaged goods" disabled={isProcessing} />
          </div>

          <Separator />
          
           <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
             <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Return Value</p>
                <p className="text-2xl font-bold">{currencySymbol}{totalReturnValue.toLocaleString()}</p>
             </div>
          </div>
           {selectedInvoice && totalReturnValue > selectedInvoice.dueAmount && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>Return value exceeds the invoice due amount.</span>
                </div>
            )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!selectedInvoice || returnItems.length === 0 || totalReturnValue > (selectedInvoice?.dueAmount || 0) || isProcessing}>
             {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Process Return
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
