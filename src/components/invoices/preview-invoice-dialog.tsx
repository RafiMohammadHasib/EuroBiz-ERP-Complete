
'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useSettings } from '@/context/settings-context';
import type { Invoice, Distributor } from '@/lib/data';
import { companyDetails as initialCompanyDetails } from '@/lib/data';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import Image from 'next/image';
import { format } from 'date-fns';
import { Printer, User } from 'lucide-react';
import type { Payment } from './create-invoice-form';

interface PreviewInvoiceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Omit<Invoice, 'id'>;
  distributor?: Distributor;
  subTotal: number;
  discount: number;
  tax: number;
  notes: string;
  terms: string;
  payments: Payment[];
}

export function PreviewInvoiceDialog({ isOpen, onOpenChange, invoice, distributor, subTotal, discount, tax, notes, terms, payments }: PreviewInvoiceDialogProps) {
  const { currencySymbol, businessSettings } = useSettings();
  const companyDetails = businessSettings || initialCompanyDetails;

  const handlePrint = () => {
    const printContent = document.getElementById('invoice-preview-content');
    if (printContent) {
      const stylesheets = Array.from(document.styleSheets)
        .map(sheet => {
          try {
            return Array.from(sheet.cssRules)
              .map(rule => rule.cssText)
              .join('');
          } catch (e) {
            console.warn('Could not read stylesheet: ', sheet.href);
            return '';
          }
        })
        .join('\n');

      const printWindow = window.open('', '', 'height=800,width=800');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Print Invoice</title>');
        printWindow.document.write('<style>');
        printWindow.document.write(stylesheets);
        printWindow.document.write(`
          @media print {
            @page {
              size: A4;
              margin: 20px;
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              font-family: sans-serif;
            }
          }
        `);
        printWindow.document.write('</style></head><body>');
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl">Invoice Preview</DialogTitle>
             <DialogDescription>
              This is a preview of what your invoice will look like.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 overflow-y-auto max-h-[80vh]">
            <div id="invoice-preview-content" className="p-8 border rounded-lg bg-white text-black shadow-lg">
                <div className="flex justify-between items-start mb-8">
                    <div>
                         {companyDetails.logoUrl && (
                            <div className="mb-4">
                                <Image src={companyDetails.logoUrl} alt={companyDetails.name} width={120} height={120} className="object-contain" />
                            </div>
                        )}
                        <h2 className="text-xl font-bold text-gray-800">{companyDetails.name}</h2>
                        <p className="text-xs text-gray-500 mt-2">{companyDetails.address}</p>
                        <p className="text-xs text-gray-500">{companyDetails.email}</p>
                        <p className="text-xs text-gray-500">{companyDetails.phone}</p>
                        <div className="text-sm text-gray-500 mt-6">
                            <p className="font-semibold text-xs uppercase tracking-wider">BILL TO</p>
                            <p className="font-semibold text-black mt-1">{distributor?.name || invoice.customer}</p>
                            <p>{distributor?.location}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h3 className="text-3xl font-bold tracking-wider text-gray-700">INVOICE</h3>
                        <p className="text-sm text-gray-500 mt-1">{invoice.invoiceNumber}</p>
                        <div className="text-sm text-gray-500 mt-4">
                          <p>Date: {format(new Date(invoice.date), 'yyyy-MM-dd')}</p>
                          <p>Due Date: {format(new Date(invoice.dueDate), 'yyyy-MM-dd')}</p>
                        </div>
                        {invoice.salesperson && (
                            <div className="text-sm text-gray-500 mt-4 flex items-center justify-end gap-2">
                                <User className="h-4 w-4"/>
                                <span>{invoice.salesperson}</span>
                            </div>
                        )}
                    </div>
                </div>

                <table className="w-full text-sm mb-8">
                    <thead>
                        <tr className="border-b bg-gray-50">
                            <th className="text-left py-2 px-3 font-semibold uppercase tracking-wider">DESCRIPTION</th>
                            <th className="text-right py-2 px-3 font-semibold uppercase tracking-wider">PRICE</th>
                            <th className="text-center py-2 px-3 font-semibold uppercase tracking-wider">QTY</th>
                            <th className="text-right py-2 px-3 font-semibold uppercase tracking-wider">TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.items.map((item, index) => (
                            <tr key={index} className="border-b">
                                <td className="py-3 px-3">{item.description}</td>
                                <td className="text-right py-3 px-3">{currencySymbol}{item.unitPrice.toFixed(2)}</td>
                                <td className="text-center py-3 px-3">{item.quantity}</td>
                                <td className="text-right py-3 px-3">{currencySymbol}{(item.unitPrice * item.quantity).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                <div className="grid grid-cols-2 mt-6 items-start">
                    <div className="text-xs text-gray-500 pr-8">
                        <div className='mb-4'>
                            <h4 className="font-semibold text-black uppercase tracking-wider mb-1">Notes</h4>
                            <p>{notes}</p>
                        </div>
                        <div>
                             <h4 className="font-semibold text-black uppercase tracking-wider mb-1">Terms & Conditions</h4>
                            <p>{terms}</p>
                        </div>
                    </div>
                    <div className="space-y-2 text-sm text-right">
                        <div className="flex justify-between"><span>Subtotal</span><span>{currencySymbol}{subTotal.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>Discount</span><span>-{currencySymbol}{discount.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>Tax</span><span>{currencySymbol}{tax.toFixed(2)}</span></div>
                        <Separator className="bg-gray-300 my-2"/>
                        <div className="flex justify-between font-bold text-base"><span>Total</span><span>{currencySymbol}{invoice.totalAmount.toFixed(2)}</span></div>
                        
                        {payments.map((p, i) => (
                            <div key={i} className="flex justify-between items-center text-gray-500">
                                <span>Payment ({format(p.date, "PP")})</span>
                                <span>-{currencySymbol}{p.amount.toFixed(2)}</span>
                            </div>
                        ))}
                        
                        {(payments.length > 0) && <Separator className="bg-gray-300 mt-2"/>}

                        <div className="flex justify-between text-base font-bold mt-2 text-red-600"><span>AMOUNT DUE</span><span>{currencySymbol}{invoice.dueAmount.toFixed(2)}</span></div>
                    </div>
                </div>
            </div>
          </div>
       
        <DialogFooter className="p-6 pt-0 bg-white">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={handlePrint} className="bg-teal-600 hover:bg-teal-700 text-white"><Printer className="mr-2 h-4 w-4" /> Print</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
