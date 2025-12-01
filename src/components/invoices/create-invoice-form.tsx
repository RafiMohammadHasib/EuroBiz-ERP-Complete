

'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Invoice, FinishedGood, InvoiceItem as InvoiceItemType, Distributor, Commission, companyDetails } from '@/lib/data';
import { useSettings } from '@/context/settings-context';
import { PlusCircle, ArrowLeft, Download, Printer, Check, Trash2, Eye, X } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Card } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { PreviewInvoiceDialog } from './preview-invoice-dialog';

interface CreateInvoiceFormProps {
  distributors: Distributor[];
  products: FinishedGood[];
  commissionRules: Commission[];
  onCreateInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber'>, totalDiscount: number) => void;
  isLoading: boolean;
}

export type Payment = {
  amount: number;
  date: Date;
  method: 'Cash' | 'Card' | 'Bank Transfer';
};


function InvoiceItemForm({ item, products, onChange, onRemove }: {
    item: Omit<InvoiceItemType, 'id' | 'total'>;
    products: FinishedGood[];
    onChange: (item: Omit<InvoiceItemType, 'id' | 'total'>) => void;
    onRemove: () => void;
}) {
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
    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 items-center">
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
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
          <Input
            type="number"
            placeholder="Price"
            value={item.unitPrice}
            onChange={handlePriceChange}
            className="text-right pl-7"
          />
      </div>
      <div className="text-right font-medium pr-2">{currencySymbol}{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      <Button variant="ghost" size="icon" onClick={onRemove}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}


export function CreateInvoiceForm({ distributors, products, commissionRules, onCreateInvoice, isLoading }: CreateInvoiceFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { currencySymbol } = useSettings();
  
  const [customerName, setCustomerName] = useState('');
  const [items, setItems] = useState<Omit<InvoiceItemType, 'id' | 'total'>[]>([]);
  const [dateIssued, setDateIssued] = useState<Date | undefined>(new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  });
  const [discount, setDiscount] = useState('0');
  const [taxRate, setTaxRate] = useState('0');
  const [notes, setNotes] = useState('Thank you for your business!');
  const [terms, setTerms] = useState('The origins of the first constellations date back to their beliefs experiences');
  const [saved, setSaved] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('INV#...');

  // State for payments
  const [payments, setPayments] = useState<Payment[]>([]);
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newPaymentDate, setNewPaymentDate] = useState<Date | undefined>(new Date());
  const [newPaymentMethod, setNewPaymentMethod] = useState<'Cash' | 'Card' | 'Bank Transfer'>('Bank Transfer');


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
  
  const { subTotal, totalDiscountValue, taxAmount, grandTotal } = useMemo(() => {
    const subTotal = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const totalDiscountValue = parseFloat(discount) || 0;
    const preTaxTotal = subTotal - totalDiscountValue;
    const taxAmount = preTaxTotal * (parseFloat(taxRate) / 100);
    const grandTotal = preTaxTotal + taxAmount;
    return { subTotal, totalDiscountValue, taxAmount, grandTotal };
  }, [items, discount, taxRate]);

  const totalPaidAmount = useMemo(() => {
    return payments.reduce((acc, p) => acc + p.amount, 0);
  }, [payments]);

  const dueAmount = useMemo(() => {
    return grandTotal - totalPaidAmount;
  }, [grandTotal, totalPaidAmount]);

  const handleSavePayment = () => {
    const amount = parseFloat(newPaymentAmount);
    if (!newPaymentDate || isNaN(amount) || amount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Payment',
        description: 'Please enter a valid date and a positive amount.',
      });
      return;
    }
    setPayments([...payments, { amount, date: newPaymentDate, method: newPaymentMethod }]);
    setNewPaymentAmount(''); // Reset for next payment
  };


  const handleSubmit = () => {
    if (!customerName || items.length === 0 || !dateIssued || !dueDate) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Please select a distributor and add at least one valid item.',
      });
      return;
    }
    
    let invoiceStatus: Invoice['status'] = 'Unpaid';
    if (dueAmount <= 0.001) { // Use a small epsilon for float comparison
        invoiceStatus = 'Paid';
    } else if (totalPaidAmount > 0 && totalPaidAmount < grandTotal) {
        invoiceStatus = 'Partially Paid';
    } else {
        invoiceStatus = 'Unpaid';
    }

    const newInvoice: Omit<Invoice, 'id' | 'invoiceNumber'> = {
      customer: customerName,
      customerEmail: distributors.find(d => d.name === customerName)?.email || '',
      totalAmount: grandTotal,
      paidAmount: totalPaidAmount,
      dueAmount: dueAmount < 0 ? 0 : dueAmount,
      status: invoiceStatus,
      date: dateIssued.toISOString(),
      dueDate: dueDate.toISOString(),
      items: items.map((item, index) => ({
          ...item,
          id: `item-${Date.now()}-${index}`,
          total: item.quantity * item.unitPrice,
      })),
    };
    
    onCreateInvoice(newInvoice, totalDiscountValue);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  
  const selectedDistributor = useMemo(() => distributors.find(d => d.name === customerName), [customerName, distributors]);
  
  const previewInvoiceData: Omit<Invoice, 'id'> | null = useMemo(() => {
      let invoiceStatus: Invoice['status'] = 'Unpaid';
      if (dueAmount <= 0.001) {
          invoiceStatus = 'Paid';
      } else if (totalPaidAmount > 0 && totalPaidAmount < grandTotal) {
          invoiceStatus = 'Partially Paid';
      }

      return {
          invoiceNumber: invoiceNumber,
          customer: customerName || "Select a Customer",
          customerEmail: selectedDistributor?.email || '',
          totalAmount: grandTotal,
          paidAmount: totalPaidAmount,
          dueAmount: dueAmount < 0 ? 0 : dueAmount,
          status: invoiceStatus,
          date: dateIssued ? dateIssued.toISOString() : new Date().toISOString(),
          dueDate: dueDate ? dueDate.toISOString() : new Date().toISOString(),
          items: items.length > 0 ? items.map((item, index) => ({
              ...item,
              id: `item-preview-${index}`,
              total: item.quantity * item.unitPrice,
          })) : [{id: 'placeholder', description: 'Sample Item', quantity: 1, unitPrice: 100, total: 100}],
      };
  }, [invoiceNumber, customerName, selectedDistributor, grandTotal, totalPaidAmount, dueAmount, dateIssued, dueDate, items]);

  return (
    <>
    <div className="bg-[#f1f3f8]">
        <div className="p-4 border-b bg-background">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft />
                    </Button>
                    <h1 className="text-xl font-semibold">Create Invoice</h1>
                </div>
                <div className="flex items-center gap-2">
                   {saved && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="h-4 w-4" /> Saved</div>}
                    <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(true)} >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview Invoice
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading} size="sm">
                      {isLoading ? 'Saving...' : 'Save & Send'}
                    </Button>
                </div>
             </div>
        </div>

        <div className="p-8">
            <div className="space-y-6 max-w-4xl mx-auto">
                <Card className="p-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div style={{ backgroundColor: '#f1f3f8' }} className="p-4 rounded-md">
                             <Label className="text-xs text-blue-800 font-semibold">FROM (BUSINESS)</Label>
                            <div className="flex items-start gap-4 mt-4">
                                <div className="w-24 h-24 border-2 border-dashed border-gray-400 rounded-md flex flex-col items-center justify-center text-muted-foreground bg-white">
                                    <Image src={companyDetails.logoUrl} alt="logo" width={48} height={48} />
                                    <span className='text-xs mt-1'>Logo</span>
                                </div>
                                <div>
                                    <p className="font-semibold text-lg text-gray-800">{companyDetails.name}</p>
                                    <p className="text-sm text-gray-600">Upload a square or landscape logo.</p>
                                </div>
                            </div>
                             <div className="text-sm text-blue-800 mt-4 space-y-2">
                                <Separator className="bg-blue-200"/>
                                <p>{companyDetails.email}</p>
                                <Separator className="bg-blue-200"/>
                                <p>{companyDetails.address}</p>
                                 <Separator className="bg-blue-200"/>
                                <p>{companyDetails.phone}</p>
                                 <Separator className="bg-blue-200"/>
                                <p>www.deshchemicals.com</p>
                            </div>
                        </div>
                         <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="invoice-number">Invoice Number</Label>
                                <Input id="invoice-number" value={invoiceNumber} readOnly disabled />
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <Select defaultValue="Draft">
                                    <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Draft">Draft</SelectItem>
                                        <SelectItem value="Paid">Paid</SelectItem>
                                        <SelectItem value="Unpaid">Unpaid</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                         </div>
                    </div>
                     <div className="grid grid-cols-2 gap-6 mt-6 bg-[#f1f3f8] p-4 rounded-md">
                        <div>
                             <Label className="text-xs text-blue-800 font-semibold">BILL TO (CLIENT)</Label>
                             <Select value={customerName} onValueChange={setCustomerName}>
                                <SelectTrigger className="mt-2">
                                    <SelectValue placeholder="Select a distributor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {distributors.map(d => (
                                        <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedDistributor && (
                                 <div className="text-sm text-muted-foreground mt-2 space-y-1">
                                    <p>{selectedDistributor.email}</p>
                                    <p>{selectedDistributor.location}</p>
                                </div>
                            )}
                        </div>
                        <div className="space-y-4">
                             <div className="grid gap-2">
                                <Label>Date Issued</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className={cn("font-normal bg-white", !dateIssued && "text-muted-foreground")}>
                                            {dateIssued ? format(dateIssued, "MM/dd/yyyy") : <span>Pick a date</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={dateIssued} onSelect={setDateIssued} /></PopoverContent>
                                </Popover>
                            </div>
                             <div className="grid gap-2">
                                <Label>Due Date</Label>
                                 <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className={cn("font-normal bg-white", !dueDate && "text-muted-foreground")}>
                                            {dueDate ? format(dueDate, "MM/dd/yyyy") : <span>Pick a date</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={dueDate} onSelect={setDueDate} /></PopoverContent>
                                </Popover>
                            </div>
                        </div>
                     </div>
                </Card>

                <Card className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Line Items</h3>
                        <Button variant="default" size="sm" onClick={handleAddItem}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                        </Button>
                    </div>
                    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 text-sm font-bold text-muted-foreground mb-2 px-2">
                        <Label>DESCRIPTION</Label>
                        <Label className="text-right">QTY</Label>
                        <Label className="text-right">PRICE</Label>
                        <Label className="text-right">TOTAL</Label>
                        <span></span>
                    </div>
                    <div className="space-y-2">
                        {items.map((item, index) => (
                            <InvoiceItemForm
                                key={index}
                                item={item}
                                products={products}
                                onChange={(updatedItem) => handleItemChange(index, updatedItem)}
                                onRemove={() => handleRemoveItem(index)}
                            />
                        ))}
                    </div>
                </Card>

                <div className="grid md:grid-cols-2 gap-6 items-start">
                     <Card className="p-4 grid gap-2">
                        <Label>NOTES / MEMO</Label>
                        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </Card>
                    <div className="space-y-4">
                        <div className="space-y-2 p-4 border rounded-lg bg-white">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span className="font-medium">{currencySymbol}{subTotal.toFixed(2)}</span>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Discount</span>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                                    <Input className="w-28 text-right pl-7" type="number" value={discount} onChange={e => setDiscount(e.target.value)} />
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Tax Rate</span>
                                <div className="relative">
                                    <Input className="w-28 text-right pr-7" type="number" value={taxRate} onChange={e => setTaxRate(e.target.value)} />
                                     <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                                </div>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>{currencySymbol}{grandTotal.toFixed(2)}</span>
                            </div>
                             <div className="pt-4 space-y-2">
                                {payments.length > 0 && (
                                    <div className="pt-2">
                                        {payments.map((p, i) => (
                                            <div key={i} className="flex justify-between items-center text-gray-500 text-sm">
                                                <span>Payment ({format(p.date, "PP")})</span>
                                                <span>-{currencySymbol}{p.amount.toFixed(2)}</span>
                                            </div>
                                        ))}
                                        <Separator className="my-2"/>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex justify-between font-bold text-lg pt-2">
                                <span>BALANCE DUE</span>
                                <span className="text-red-600">{currencySymbol}{dueAmount.toFixed(2)}</span>
                            </div>
                        </div>

                         <div className="space-y-2 p-4 border rounded-lg bg-white">
                            <p className="text-sm font-medium text-muted-foreground">RECORD A NEW PAYMENT</p>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="paymentDate">Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn("font-normal bg-white w-full", !newPaymentDate && "text-muted-foreground")}>
                                                {newPaymentDate ? format(newPaymentDate, "MM/dd/yy") : <span>Pick a date</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={newPaymentDate} onSelect={setNewPaymentDate} /></PopoverContent>
                                    </Popover>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="paidAmount">New Payment</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                                        <Input
                                            id="paidAmount"
                                            type="number"
                                            value={newPaymentAmount}
                                            onChange={(e) => setNewPaymentAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="pl-7"
                                        />
                                    </div>
                                </div>
                                 <div className="grid gap-2">
                                    <Label htmlFor="paymentType">Payment Type</Label>
                                    <Select value={newPaymentMethod} onValueChange={(value) => setNewPaymentMethod(value as any)}>
                                        <SelectTrigger id="paymentType"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                            <SelectItem value="Cash">Cash</SelectItem>
                                            <SelectItem value="Card">Card</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button size="sm" className="w-full mt-2" onClick={handleSavePayment}>Save Payment</Button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
    
    {previewInvoiceData && (
        <PreviewInvoiceDialog
            isOpen={isPreviewOpen}
            onOpenChange={setIsPreviewOpen}
            invoice={previewInvoiceData}
            distributor={selectedDistributor}
            subTotal={subTotal}
            discount={totalDiscountValue}
            tax={taxAmount}
            notes={notes}
            terms={terms}
            payments={payments}
        />
    )}
    </>
  );
}
