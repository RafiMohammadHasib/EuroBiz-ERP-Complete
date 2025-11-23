
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { invoices as initialInvoices } from '@/lib/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function DuesPage() {
  const [invoices, setInvoices] = useState(initialInvoices);

  useEffect(() => {
    const handleDataUpdate = (event: Event) => {
        const customEvent = event as CustomEvent;
        setInvoices(customEvent.detail.localInvoices);
    };

    window.addEventListener('data-updated', handleDataUpdate);

    return () => {
        window.removeEventListener('data-updated', handleDataUpdate);
    };
  }, []);

  const outstandingInvoices = invoices.filter((i) => i.status !== 'Paid' && i.amount > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Outstanding Dues</CardTitle>
        <CardDescription>
          Monitor and manage all outstanding payments from customers. This will update if a sales return is processed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Invoice ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount Due (BDT)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {outstandingInvoices.length > 0 ? (
              outstandingInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.customer}</TableCell>
                  <TableCell>{invoice.id}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        invoice.status === 'Overdue' ? 'destructive' : 'outline'
                      }
                    >
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {invoice.amount.toLocaleString('en-US')}
                  </TableCell>
                </TableRow>
              ))
            ) : (
                <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                        No outstanding dues.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
