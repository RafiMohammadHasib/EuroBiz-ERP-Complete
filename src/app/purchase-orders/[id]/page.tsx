
'use client';
import { notFound, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Printer, Landmark, ArrowLeft, Loader2 } from 'lucide-react';
import { useSettings } from '@/context/settings-context';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import type { PurchaseOrder, RawMaterial, Supplier } from '@/lib/data';
import { companyDetails } from '@/lib/data';

export default function PurchaseOrderPage({ params }: { params: { id: string } }) {
  const { currencySymbol } = useSettings();
  const router = useRouter();
  const firestore = useFirestore();

  const poRef = useMemoFirebase(() => doc(firestore, 'purchaseOrders', params.id), [firestore, params.id]);
  const { data: po, isLoading: poLoading } = useDoc<PurchaseOrder>(poRef);

  const rawMaterialsCollection = useMemoFirebase(() => collection(firestore, 'rawMaterials'), [firestore]);
  const { data: rawMaterials, isLoading: materialsLoading } = useCollection<RawMaterial>(rawMaterialsCollection);
  
  const suppliersCollection = useMemoFirebase(() => collection(firestore, 'suppliers'), [firestore]);
  const { data: suppliers, isLoading: suppliersLoading } = useCollection<Supplier>(suppliersCollection);

  const supplier = suppliers?.find(s => s.name === po?.supplier);
  const isLoading = poLoading || materialsLoading || suppliersLoading;

  if (!po && !isLoading) {
    notFound();
  }

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
  
  if (!po) {
      return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6 no-print">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Purchase Orders
            </Button>
            <Button onClick={handlePrint} variant="outline" size="sm">
                <Printer className="mr-2 h-4 w-4" />
                Print PO
            </Button>
        </div>
      <Card className="print:shadow-none print:border-none">
        <CardHeader className="p-6 bg-muted/50 print:bg-transparent">
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3">
                        <Landmark className="h-8 w-8 text-primary" />
                        <h2 className="text-2xl font-bold text-primary">{companyDetails.name}</h2>
                    </div>
                    <p className="text-muted-foreground text-sm mt-2">{companyDetails.address}</p>
                    <p className="text-muted-foreground text-sm">{companyDetails.email}</p>
                    <p className="text-muted-foreground text-sm">{companyDetails.phone}</p>
                </div>
                <div className="text-right">
                    <h3 className="text-3xl font-bold tracking-tight">PURCHASE ORDER</h3>
                    <p className="text-muted-foreground text-sm mt-1">{po.id}</p>
                    <Badge 
                        variant={po.status === 'Completed' ? 'secondary' : po.status === 'Pending' ? 'outline' : 'default'}
                        className="mt-4 text-lg"
                    >
                        {po.status}
                    </Badge>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <h4 className="font-semibold mb-2">Supplier</h4>
              <p className="font-bold">{po.supplier}</p>
              {supplier && (
                <>
                    <p className="text-muted-foreground">{supplier.category}</p>
                </>
              )}
            </div>
            <div className="text-right">
              <h4 className="font-semibold mb-2">PO Details</h4>
              <p>
                <span className="font-medium">Order Date: </span>
                {new Date(po.date).toLocaleDateString()}
              </p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60%]">Item Description</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {po.items.map((item) => {
                const materialName = rawMaterials?.find(rm => rm.id === item.rawMaterialId)?.name || item.rawMaterialId;
                return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{materialName}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">{currencySymbol}{item.unitCost.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{currencySymbol}{(item.quantity * item.unitCost).toFixed(2)}</TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>

          <Separator className="my-6" />

          <div className="flex justify-end">
            <div className="grid gap-2 w-full sm:w-[250px]">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{currencySymbol}{(po.amount - po.tax + po.discount).toFixed(2)}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span>-{currencySymbol}{po.discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{currencySymbol}{po.tax.toFixed(2)}</span>
                </div>
                <Separator />
                 <div className="flex justify-between font-bold text-lg">
                    <span>Grand Total</span>
                    <span>{currencySymbol}{po.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid Amount</span>
                    <span>{currencySymbol}{po.paidAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-destructive">
                    <span>Amount Due</span>
                    <span>{currencySymbol}{po.dueAmount.toFixed(2)}</span>
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
            .no-print {
                display: none;
            }
        }
      `}</style>
    </div>
  );
}
