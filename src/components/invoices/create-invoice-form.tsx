
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
import { PlusCircle, ArrowLeft, Download, Printer, Check } from 'lucide-react';
import { Separator } from '../ui/separator';
import { InvoiceItemForm } from './invoice-item-form';
import { Card } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface CreateInvoiceFormProps {
  distributors: Distributor[];
  products: FinishedGood[];
  commissionRules: Commission[];
  onCreateInvoice: (invoice: Omit<Invoice, 'id'>, totalDiscount: number) => void;
  isLoading: boolean;
}

export function CreateInvoiceForm({ distributors, products, commissionRules, onCreateInvoice, isLoading }: CreateInvoiceFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { currencySymbol } = useSettings();
  
  const [customerName, setCustomerName] = useState('');
  const [items, setItems] = useState<Omit<InvoiceItemType, 'id' | 'total'>[]>([]);
  const [paidAmount, setPaidAmount] = useState('0');
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
  const [paymentInstructions, setPaymentInstructions] = useState('By Bank London State Bank\nLN34 00\n1258 QQ RR74 15587');
  const [saved, setSaved] = useState(false);
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        setIsDrawing(true);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.closePath();
        setIsDrawing(false);
      }
    }
  };
  
  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

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

  const dueAmount = useMemo(() => {
    const numericPaidAmount = parseFloat(paidAmount) || 0;
    return grandTotal - numericPaidAmount;
  }, [grandTotal, paidAmount]);


  const handleSubmit = () => {
    if (!customerName || items.length === 0 || !dateIssued || !dueDate) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Please select a distributor and add at least one valid item.',
      });
      return;
    }
    
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

  return (
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
                    <Button variant="outline" size="sm"><Printer className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm"><Download className="h-4 w-4" /></Button>
                </div>
             </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            <div className="space-y-6">
                <Card className="p-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div style={{ backgroundColor: '#d0d6e7' }} className="p-4 rounded-md">
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
                                <p>{companyDetails.name}.com</p>
                            </div>
                        </div>
                         <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="invoice-number">Invoice Number</Label>
                                <Input id="invoice-number" defaultValue="INV-001" />
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
                     <div className="grid grid-cols-2 gap-6 mt-6">
                        <div>
                             <Label className="text-xs text-muted-foreground">BILL TO (CLIENT)</Label>
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
                                        <Button variant="outline" className={cn("font-normal", !dateIssued && "text-muted-foreground")}>
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
                                        <Button variant="outline" className={cn("font-normal", !dueDate && "text-muted-foreground")}>
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
                     <Label className="text-xs text-muted-foreground">LINE ITEMS</Label>
                     <div className="mt-4 space-y-2">
                        <div className="grid grid-cols-[3fr_1fr_1fr_1fr_auto] gap-2 text-sm text-muted-foreground">
                            <span>DESCRIPTION</span>
                            <span className="text-right">QTY</span>
                            <span className="text-right">PRICE</span>
                            <span className="text-right">TOTAL</span>
                            <span></span>
                        </div>
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
                     <Button variant="outline" size="sm" onClick={handleAddItem} className="mt-4">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                    </Button>
                </Card>

                <div className="grid grid-cols-2 gap-6">
                    <Card className="p-4 grid gap-2">
                        <Label>PAYMENT INSTRUCTIONS</Label>
                        <Textarea value={paymentInstructions} onChange={(e) => setPaymentInstructions(e.target.value)} className="min-h-[80px]" />
                    </Card>
                     <Card className="p-4 grid gap-2">
                        <Label>TERMS & CONDITIONS</Label>
                        <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} className="min-h-[80px]" />
                    </Card>
                </div>
                 <div className="grid grid-cols-2 gap-6">
                    <Card className="p-4 grid gap-2">
                        <Label>NOTES / MEMO</Label>
                        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </Card>
                     <Card className="p-4 grid gap-2">
                        <Label>SIGNATURE</Label>
                         <canvas
                            ref={signatureCanvasRef}
                            width="250"
                            height="100"
                            className="border rounded-md bg-white cursor-crosshair"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                        />
                        <Button variant="link" size="sm" onClick={clearSignature} className="self-start">Clear</Button>
                    </Card>
                </div>


            </div>

            <div className="lg:sticky lg:top-24 h-min">
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-center">LIVE PREVIEW</h3>
                    <div className="border rounded-lg p-6 bg-white text-black shadow-lg">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-teal-600">INVOICE</h2>
                                <div className="text-sm text-gray-500">
                                    <p>BILL TO</p>
                                    <p className="font-semibold text-black">{customerName || 'Business Company 123'}</p>
                                    <p>{selectedDistributor?.email || 'accounts@client.com'}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h3 className="font-bold text-lg">{companyDetails.name}</h3>
                                <p className="text-sm text-gray-500">#INV-001</p>
                                <p className="text-sm text-gray-500">Date: {dateIssued ? format(dateIssued, 'yyyy-MM-dd') : ''}</p>
                                <p className="text-sm text-gray-500">Due Date: {dueDate ? format(dueDate, 'yyyy-MM-dd') : ''}</p>
                            </div>
                        </div>

                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2 font-semibold">DESCRIPTION</th>
                                    <th className="text-right py-2 font-semibold">PRICE</th>
                                    <th className="text-right py-2 font-semibold">QTY</th>
                                    <th className="text-right py-2 font-semibold">TOTAL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={index} className="border-b">
                                        <td className="py-2">{item.description}</td>
                                        <td className="text-right py-2">{currencySymbol}{item.unitPrice.toFixed(2)}</td>
                                        <td className="text-right py-2">{item.quantity}</td>
                                        <td className="text-right py-2">{currencySymbol}{(item.unitPrice * item.quantity).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        <div className="flex justify-end mt-6">
                            <div className="w-64 space-y-2 text-sm">
                                <div className="flex justify-between"><span>Subtotal</span><span>{currencySymbol}{subTotal.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span>Discount</span><span>{currencySymbol}{totalDiscountValue.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span>Tax ({taxRate}%)</span><span>{currencySymbol}{taxAmount.toFixed(2)}</span></div>
                                <Separator className="bg-gray-300 my-2"/>
                                <div className="flex justify-between font-bold text-base"><span>Total</span><span>{currencySymbol}{grandTotal.toFixed(2)}</span></div>
                                <div className="flex justify-between text-base font-bold mt-4"><span>AMOUNT DUE</span><span>{currencySymbol}{dueAmount.toFixed(2)}</span></div>
                            </div>
                        </div>

                         <div className="mt-8 pt-4 border-t-2 border-teal-600 flex justify-between text-xs text-white bg-teal-600 -m-6 px-6 py-2 rounded-b-lg">
                           <span>info@deshchemicals.com</span>
                           <span>www.deshchemicals.com</span>
                        </div>
                    </div>
                </Card>
                <Button onClick={handleSubmit} disabled={isLoading} size="lg" className="w-full mt-6">
                    {isLoading ? 'Saving...' : 'Save & Send'}
                </Button>
            </div>
        </div>
    </div>
  );
}
