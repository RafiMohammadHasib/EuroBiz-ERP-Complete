

'use client';
import { notFound, useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Printer, Landmark, ArrowLeft, Loader2, User } from 'lucide-react';
import { useSettings } from '@/context/settings-context';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Invoice } from '@/lib/data';
import { companyDetails as initialCompanyDetails } from '@/lib/data';
import Image from 'next/image';

export default function InvoicePage() {
  const { currencySymbol, businessSettings } = useSettings();
  const router = useRouter();
  const firestore = useFirestore();
  const params = useParams();
  const id = params.id as string;
  const companyDetails = businessSettings || initialCompanyDetails;

  const invoiceQuery = useMemoFirebase(() => {
    if (!id || !firestore) return null;
    return query(collection(firestore, 'invoices'), where('invoiceNumber', '==', id));
  }, [firestore, id]);

  const { data, isLoading } = useCollection<Invoice>(invoiceQuery);
  const invoice = data?.[0];

  const handlePrint = () => {
    window.print();
  };
  
  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
  }

  if (!invoice && !isLoading) {
    notFound();
  }

  if (!invoice) {
      return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6 no-print">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sales
            </Button>
            <Button onClick={handlePrint} variant="outline" size="sm">
                <Printer className="mr-2 h-4 w-4" />
                Print Invoice
            </Button>
        </div>
      <Card className="print:shadow-none print:border-none">
        <CardHeader className="p-6 bg-muted/50 print:bg-transparent">
            <div className="flex justify-between items-start">
                <div>
                     {companyDetails.logoUrl && (
                        <div className="mb-4">
                            <Image src={companyDetails.logoUrl} alt={companyDetails.name} width={120} height={120} className="object-contain" />
                        </div>
                    )}
                    <h2 className="text-2xl font-bold text-primary">{companyDetails.name}</h2>
                    <p className="text-muted-foreground text-sm mt-2">{companyDetails.address}</p>
                    <p className="text-muted-foreground text-sm">{companyDetails.email}</p>
                    <p className="text-muted-foreground text-sm">{companyDetails.phone}</p>
                </div>
                <div className="text-right">
                    <h3 className="text-3xl font-bold tracking-tight">INVOICE</h3>
                    <p className="text-muted-foreground text-sm mt-1">{invoice.invoiceNumber}</p>
                    <Badge 
                        variant={invoice.status === 'Paid' ? 'secondary' : invoice.status === 'Unpaid' ? 'outline' : 'destructive'}
                        className="mt-4 text-lg"
                    >
                        {invoice.status}
                    </Badge>
                     {invoice.salesperson && (
                        <div className="text-sm text-gray-500 mt-4 flex items-center justify-end gap-2">
                            <User className="h-4 w-4"/>
                            <span>{invoice.salesperson}</span>
                        </div>
                    )}
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <h4 className="font-semibold mb-2">Bill To</h4>
              <p className="font-bold">{invoice.customer}</p>
              <p className="text-muted-foreground">{invoice.customerEmail}</p>
            </div>
            <div className="text-right">
              <h4 className="font-semibold mb-2">Invoice Details</h4>
              <p>
                <span className="font-medium">Date: </span>
                {new Date(invoice.date).toLocaleDateString()}
              </p>
              <p>
                <span className="font-medium">Due Date: </span>
                {new Date(invoice.dueDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60%]">Description</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.description}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">{currencySymbol}{item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{currencySymbol}{item.total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Separator className="my-6" />

          <div className="flex justify-end">
            <div className="grid gap-2 w-full sm:w-[250px]">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{currencySymbol}{invoice.items.reduce((acc, i) => acc + i.total, 0).toFixed(2)}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxes & Fees</span>
                    <span>{currencySymbol}0.00</span>
                </div>
                <Separator />
                 <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{currencySymbol}{invoice.totalAmount.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between font-bold text-lg text-destructive">
                    <span>Amount Due</span>
                    <span>{currencySymbol}{invoice.dueAmount.toFixed(2)}</span>
                </div>
            </div>
          </div>

        </CardContent>
        <CardFooter className="p-6 bg-muted/50 print:bg-transparent">
          <div className="text-center w-full">
            <p className="text-sm text-muted-foreground">
              Thank you for your business! Please contact us with any questions.
            </p>
          </div>
        </CardFooter>
      </Card>

      <style jsx global>{`
        @media print {
            body {
                background: white;
            }
            main {
                padding: 0;
            }
            .print\\:shadow-none {
                box-shadow: none;
            }
            .print\\:border-none {
                border: none;
            }
            .print\\:bg-transparent {
                background-color: transparent;
            }
            header, footer, .no-print {
                display: none;
            }
        }
      `}</style>
    </div>
  );
}
