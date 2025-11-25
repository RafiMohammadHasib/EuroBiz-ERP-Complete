
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { invoices as initialInvoices, purchaseOrders as initialPurchaseOrders } from '@/lib/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Landmark } from 'lucide-react';
import { useSettings } from '@/context/settings-context';

export default function DuesPage() {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [purchaseOrders, setPurchaseOrders] = useState(initialPurchaseOrders);
  const { toast } = useToast();
  const { currency } = useSettings();

  useEffect(() => {
    const handleDataUpdate = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail.localInvoices) {
            setInvoices(customEvent.detail.localInvoices);
        }
    };

    window.addEventListener('data-updated', handleDataUpdate);

    return () => {
        window.removeEventListener('data-updated', handleDataUpdate);
    };
  }, []);

  const outstandingInvoices = invoices.filter((i) => i.status !== 'Paid' && i.amount > 0);
  const totalSalesDue = outstandingInvoices.reduce((acc, i) => acc + i.amount, 0);

  const pendingPurchaseOrders = purchaseOrders.filter((po) => po.status === 'Pending');
  const totalPurchaseDue = pendingPurchaseOrders.reduce((acc, po) => acc + po.amount, 0);

  const handleRecordPayment = (invoiceId: string) => {
    toast({
        title: 'Payment Recorded (Simulated)',
        description: `A payment for Invoice ${invoiceId} has been recorded.`,
      });
  }

  const handleMakePayment = (poId: string) => {
    toast({
        title: 'Payment Made (Simulated)',
        description: `A payment for Purchase Order ${poId} has been made.`,
      });
  }

  return (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Accounts Receivable</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{currency} {totalSalesDue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Total money to be received</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Accounts Payable</CardTitle>
                    <Landmark className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{currency} {totalPurchaseDue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Total money to be paid</p>
                </CardContent>
            </Card>
        </div>
        <Tabs defaultValue="receivable">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 md:w-[500px]">
            <TabsTrigger value="receivable">Accounts Receivable (Sales Dues)</TabsTrigger>
            <TabsTrigger value="payable">Accounts Payable (Purchase Dues)</TabsTrigger>
        </TabsList>
        <TabsContent value="receivable">
            <Card>
            <CardHeader>
                <CardTitle>Sales Dues</CardTitle>
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
                    <TableHead className="text-right">Amount Due ({currency})</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
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
                        <TableCell className="text-center">
                            <Button size="sm" onClick={() => handleRecordPayment(invoice.id)}>Record Payment</Button>
                        </TableCell>
                        </TableRow>
                    ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24">
                                No outstanding sales dues.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
                </Table>
            </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="payable">
            <Card>
            <CardHeader>
                <CardTitle>Purchase Dues</CardTitle>
                <CardDescription>
                Manage all outstanding payments to your suppliers.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Supplier</TableHead>
                        <TableHead>PO ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount Due ({currency})</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pendingPurchaseOrders.length > 0 ? (
                        pendingPurchaseOrders.map((po) => (
                            <TableRow key={po.id}>
                            <TableCell className="font-medium">{po.supplier}</TableCell>
                            <TableCell>{po.id}</TableCell>
                            <TableCell>
                                <Badge variant="outline">{po.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                {po.amount.toLocaleString('en-US')}
                            </TableCell>
                            <TableCell className="text-center">
                                <Button size="sm" onClick={() => handleMakePayment(po.id)}>Make Payment</Button>
                            </TableCell>
                            </TableRow>
                        ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                    No outstanding purchase dues.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
            </Card>
        </TabsContent>
        </Tabs>
    </div>
  );
}
