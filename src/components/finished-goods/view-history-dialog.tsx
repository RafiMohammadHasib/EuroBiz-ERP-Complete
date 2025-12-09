
'use client';

import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { FinishedGood, ProductionOrder, Invoice } from '@/lib/data';
import { format } from 'date-fns';

interface ViewHistoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  product: FinishedGood;
  productionOrders: ProductionOrder[];
  invoices: Invoice[];
}

export function ViewHistoryDialog({ isOpen, onOpenChange, product, productionOrders, invoices }: ViewHistoryDialogProps) {
  
  const history = useMemo(() => {
    if (!product) return [];

    const productionHistory = productionOrders
      .filter(order => order.productName === product.productName && order.status === 'Completed')
      .map(order => ({
        date: new Date(order.startDate),
        type: 'Production',
        description: `Order #${order.id}`,
        quantity: `+${order.quantity.toLocaleString()}`,
        isProduction: true,
      }));

    const salesHistory = invoices
      .flatMap(invoice => 
        invoice.items
          .filter(item => item.description === product.productName)
          .map(item => ({
            date: new Date(invoice.date),
            type: 'Sale',
            description: `Invoice #${invoice.invoiceNumber}`,
            quantity: `-${item.quantity.toLocaleString()}`,
            isProduction: false,
          }))
      );
      
    return [...productionHistory, ...salesHistory].sort((a, b) => b.date.getTime() - a.date.getTime());

  }, [product, productionOrders, invoices]);


  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Transaction History for "{product.productName}"</DialogTitle>
          <DialogDescription>
            A log of all inventory movements for this product.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Quantity Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length > 0 ? history.map((entry, index) => (
                <TableRow key={index}>
                  <TableCell>{format(entry.date, 'PPp')}</TableCell>
                  <TableCell>
                    <Badge variant={entry.isProduction ? 'secondary' : 'default'}>{entry.type}</Badge>
                  </TableCell>
                  <TableCell>{entry.description}</TableCell>
                  <TableCell className={`text-right font-medium ${entry.isProduction ? 'text-green-600' : 'text-destructive'}`}>
                    {entry.quantity}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No history found for this product.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
