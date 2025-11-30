
'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useSettings } from '@/context/settings-context';
import type { Invoice } from '@/lib/data';
import { companyDetails } from '@/lib/data';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import Image from 'next/image';
import { format } from 'date-fns';
import { Printer } from 'lucide-react';
import type { Payment } from './create-invoice-form';

interface PreviewInvoiceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Omit<Invoice, 'id'>;
  subTotal: number;
  discount: number;
  tax: number;
  notes: string;
  terms: string;
  payments: Payment[];
}

export function PreviewInvoiceDialog({ isOpen, onOpenChange, invoice, subTotal, discount, tax, notes, terms, payments }: PreviewInvoiceDialogProps) {
  const { currencySymbol } = useSettings();

  const handlePrint = () => {
    const printContent = document.getElementById('invoice-preview-content');
    if (printContent) {
      const originalContents = document.body.innerHTML;
      const printContents = printContent.innerHTML;
      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload(); // To restore event listeners
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0">
        <div id="invoice-preview-content">
          <DialogHeader className="p-6 print:hidden">
            <DialogTitle className="text-2xl">Invoice Preview</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <div className="p-6 border rounded-lg bg-white text-black shadow-lg">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-teal-600">INVOICE</h2>
                        <div className="text-sm text-gray-500">
                            <p>BILL TO</p>
                            <p className="font-semibold text-black">{invoice.customer}</p>
                            <p>{invoice.customerEmail}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h3 className="font-bold text-lg">{companyDetails.name}</h3>
                        <p className="text-sm text-gray-500">#INV-001</p>
                        <p className="text-sm text-gray-500">Date: {format(new Date(invoice.date), 'yyyy-MM-dd')}</p>
                        <p className="text-sm text-gray-500">Due Date: {format(new Date(invoice.dueDate), 'yyyy-MM-dd')}</p>
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
                        {invoice.items.map((item) => (
                            <tr key={item.id} className="border-b">
                                <td className="py-2">{item.description}</td>
                                <td className="text-right py-2">{currencySymbol}{item.unitPrice.toFixed(2)}</td>
                                <td className="text-right py-2">{item.quantity}</td>
                                <td className="text-right py-2">{currencySymbol}{(item.unitPrice * item.quantity).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                <div className="flex justify-end mt-6">
                    <div className="w-full md:w-80 space-y-2 text-sm">
                        <div className="flex justify-between"><span>Subtotal</span><span>{currencySymbol}{subTotal.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>Discount</span><span>{currencySymbol}{discount.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>Tax</span><span>{currencySymbol}{tax.toFixed(2)}</span></div>
                        <Separator className="bg-gray-300 my-2"/>
                        <div className="flex justify-between font-bold text-base"><span>Total</span><span>{currencySymbol}{invoice.totalAmount.toFixed(2)}</span></div>
                        
                        {payments.length > 0 && (
                            <div className="pt-2">
                                <p className="font-semibold mb-1">PAYMENTS RECEIVED</p>
                                {payments.map((p, i) => (
                                    <div key={i} className="flex justify-between items-center text-gray-500">
                                        <span>{format(p.date, "PP")} ({p.method})</span>
                                        <span>-{currencySymbol}{p.amount.toFixed(2)}</span>
                                    </div>
                                ))}
                                <Separator className="bg-gray-300 mt-2"/>
                            </div>
                        )}
                        
                        <div className="flex justify-between text-base font-bold mt-2 text-red-600"><span>AMOUNT DUE</span><span>{currencySymbol}{invoice.dueAmount.toFixed(2)}</span></div>
                    </div>
                </div>

                 <div className="mt-8 pt-4 border-t-2 border-teal-600 flex justify-between text-xs text-white bg-teal-600 -m-6 px-6 py-2 rounded-b-lg">
                   <span>{companyDetails.email}</span>
                   <span>www.deshchemicals.com</span>
                </div>
            </div>
          </div>
           <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #invoice-preview-content, #invoice-preview-content * {
                        visibility: visible;
                    }
                    #invoice-preview-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                }
            `}</style>
        </div>
        <DialogFooter className="p-6 pt-0 print:hidden">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
