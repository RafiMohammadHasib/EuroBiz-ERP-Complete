
'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSettings } from '@/context/settings-context';
import type { PurchaseOrder, RawMaterial } from '@/lib/data';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

interface PoDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrder: PurchaseOrder;
}

export function PoDetailsDialog({ isOpen, onOpenChange, purchaseOrder }: PoDetailsDialogProps) {
  const { currencySymbol } = useSettings();
  const firestore = useFirestore();
  const rawMaterialsCollection = useMemoFirebase(() => collection(firestore, 'rawMaterials'), [firestore]);
  const { data: rawMaterials } = useCollection<RawMaterial>(rawMaterialsCollection);

  const getDeliveryStatusVariant = (status: PurchaseOrder['deliveryStatus']) => {
    switch (status) {
        case 'Received': return 'secondary';
        case 'Shipped': return 'default';
        case 'Cancelled': return 'destructive';
        case 'Pending':
        default: return 'outline';
    }
  }
  
  const getPaymentStatusVariant = (status: PurchaseOrder['paymentStatus']) => {
    switch (status) {
        case 'Paid': return 'secondary';
        case 'Partially Paid': return 'default';
        case 'Unpaid':
        default: return 'outline';
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Details for Purchase Order #{purchaseOrder.id}</DialogTitle>
          <DialogDescription>
            A complete summary of the purchase order.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className='grid grid-cols-3 gap-4 rounded-lg border p-4'>
                <div>
                    <p className="text-sm text-muted-foreground">Supplier</p>
                    <p className="font-semibold">{purchaseOrder.supplier}</p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Delivery Status</p>
                    <Badge variant={getDeliveryStatusVariant(purchaseOrder.deliveryStatus)}>{purchaseOrder.deliveryStatus}</Badge>
                </div>
                 <div>
                    <p className="text-sm text-muted-foreground">Payment Status</p>
                    <Badge variant={getPaymentStatusVariant(purchaseOrder.paymentStatus)}>{purchaseOrder.paymentStatus}</Badge>
                </div>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-center">Quantity</TableHead>
                        <TableHead className="text-right">Unit Cost</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {purchaseOrder.items.map(item => {
                      const material = rawMaterials?.find(rm => rm.id === item.rawMaterialId);
                      return (
                        <TableRow key={item.id}>
                            <TableCell>{material?.name || item.rawMaterialId}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">{currencySymbol}{item.unitCost.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{currencySymbol}{(item.quantity * item.unitCost).toFixed(2)}</TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
            </Table>
            <Separator />
             <div className="flex justify-end">
                <div className="w-full md:w-1/2 space-y-2">
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">{currencySymbol}{(purchaseOrder.amount + purchaseOrder.discount - purchaseOrder.tax).toLocaleString()}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Discount</span>
                        <span className="font-medium">-{currencySymbol}{purchaseOrder.discount.toLocaleString()}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax</span>
                        <span className="font-medium">{currencySymbol}{purchaseOrder.tax.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Total</span>
                        <span className="font-semibold text-lg">{currencySymbol}{purchaseOrder.amount.toLocaleString()}</span>
                    </div>
                    <Separator />
                     <div className="flex justify-between text-green-600">
                        <span className="text-muted-foreground">Paid Amount</span>
                        <span className="font-semibold">{currencySymbol}{purchaseOrder.paidAmount.toLocaleString()}</span>
                    </div>
                     <div className="flex justify-between text-destructive">
                        <span className="text-muted-foreground">Due Amount</span>
                        <span className="font-semibold">{currencySymbol}{purchaseOrder.dueAmount.toLocaleString()}</span>
                    </div>
                </div>
             </div>

        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
