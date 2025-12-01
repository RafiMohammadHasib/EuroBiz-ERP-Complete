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
import type { SalesReturn } from '@/lib/data';
import { Separator } from '../ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface ViewSalesReturnDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  salesReturn: (SalesReturn & { invoiceNumber: string }) | null;
}

export function ViewSalesReturnDialog({ isOpen, onOpenChange, salesReturn }: ViewSalesReturnDialogProps) {
  const { currencySymbol } = useSettings();
  
  if (!salesReturn) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Return Details</DialogTitle>
          <DialogDescription>
            Details for the return associated with Invoice #{salesReturn.invoiceNumber}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className='grid grid-cols-2 gap-4 rounded-lg border p-4'>
                <div>
                    <p className="text-sm text-muted-foreground">Return Date</p>
                    <p className="font-semibold">{new Date(salesReturn.returnDate).toLocaleDateString()}</p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Original Invoice</p>
                    <p className="font-semibold">{salesReturn.invoiceNumber}</p>
                </div>
                 <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Reason</p>
                    <p className="font-semibold">{salesReturn.reason}</p>
                </div>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-center">Quantity</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {salesReturn.items.map(item => (
                        <TableRow key={item.productId}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">{currencySymbol}{item.unitPrice.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{currencySymbol}{(item.quantity * item.unitPrice).toFixed(2)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <Separator />
             <div className="flex justify-end">
                <div className="w-full md:w-1/2 space-y-2">
                    <div className="flex justify-between font-semibold text-lg">
                        <span>Total Return Value</span>
                        <span>{currencySymbol}{salesReturn.totalReturnValue.toLocaleString()}</span>
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
