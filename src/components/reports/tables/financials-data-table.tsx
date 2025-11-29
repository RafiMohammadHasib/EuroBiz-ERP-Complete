
'use client';

import { useMemo, useState } from "react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Invoice, PurchaseOrder } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search, DollarSign, Landmark } from "lucide-react";
import { useSettings } from "@/context/settings-context";
import FinancialsChart from "../financials-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

type ReceivableSortKey = keyof Invoice;
type PayableSortKey = keyof PurchaseOrder;

export function FinancialsDataTable() {
    const firestore = useFirestore();
    const { currencySymbol } = useSettings();

    const invoicesCol = useMemoFirebase(() => collection(firestore, 'invoices'), [firestore]);
    const poCol = useMemoFirebase(() => collection(firestore, 'purchaseOrders'), [firestore]);

    const { data: invoices, isLoading: l1 } = useCollection<Invoice>(invoicesCol);
    const { data: purchaseOrders, isLoading: l2 } = useCollection<PurchaseOrder>(poCol);

    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfigReceivable, setSortConfigReceivable] = useState<{ key: ReceivableSortKey, direction: 'asc' | 'desc' } | null>(null);
    const [sortConfigPayable, setSortConfigPayable] = useState<{ key: PayableSortKey, direction: 'asc' | 'desc' } | null>(null);

    const isLoading = l1 || l2;

    const kpiData = useMemo(() => {
        const outstandingInvoices = (invoices || []).filter((i) => i.status !== 'Paid' && i.dueAmount > 0);
        const accountsReceivable = outstandingInvoices.reduce((acc, inv) => acc + inv.dueAmount, 0);

        const pendingPurchaseOrders = (purchaseOrders || []).filter((po) => po.paymentStatus !== 'Paid');
        const accountsPayable = pendingPurchaseOrders.reduce((acc, po) => acc + po.dueAmount, 0);

        return { accountsReceivable, accountsPayable };
    }, [invoices, purchaseOrders]);

    const sortedReceivables = useMemo(() => {
        let items = (invoices || []).filter(i => i.dueAmount > 0);
        if (sortConfigReceivable) {
            items.sort((a, b) => {
                const aVal = a[sortConfigReceivable.key];
                const bVal = b[sortConfigReceivable.key];
                if (aVal < bVal) return sortConfigReceivable.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfigReceivable.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return items.filter(i => i.customer.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [invoices, sortConfigReceivable, searchTerm]);

    const sortedPayables = useMemo(() => {
        let items = (purchaseOrders || []).filter(p => p.dueAmount > 0);
        if (sortConfigPayable) {
            items.sort((a, b) => {
                const aVal = a[sortConfigPayable.key];
                const bVal = b[sortConfigPayable.key];
                if (aVal < bVal) return sortConfigPayable.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfigPayable.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return items.filter(p => p.supplier.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [purchaseOrders, sortConfigPayable, searchTerm]);
    

    const handleExport = (type: 'receivable' | 'payable') => {
        const data = type === 'receivable' ? sortedReceivables : sortedPayables;
        const headers = type === 'receivable' ? ["Invoice ID", "Customer", "Due Date", "Amount Due"] : ["PO ID", "Supplier", "Date", "Amount Due"];
        const rows = data.map(item => type === 'receivable' ? 
            [(item as Invoice).id, (item as Invoice).customer, (item as Invoice).dueDate, (item as Invoice).dueAmount] : 
            [(item as PurchaseOrder).id, (item as PurchaseOrder).supplier, (item as PurchaseOrder).date, (item as PurchaseOrder).dueAmount]);
        const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${type}_report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return <Skeleton className="h-[600px] w-full" />
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Accounts Receivable</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{currencySymbol}{kpiData.accountsReceivable.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Total money to be received</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Accounts Payable</CardTitle>
                        <Landmark className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{currencySymbol}{kpiData.accountsPayable.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Total money to be paid</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle>AR vs. AP</CardTitle></CardHeader>
                <CardContent className="h-[300px]"><FinancialsChart /></CardContent>
            </Card>
            
            <Tabs defaultValue="receivable">
                 <div className="flex items-center gap-4">
                     <TabsList>
                        <TabsTrigger value="receivable">Receivables</TabsTrigger>
                        <TabsTrigger value="payable">Payables</TabsTrigger>
                    </TabsList>
                     <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Filter by name..."
                            className="pl-8 w-full md:w-[300px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <TabsContent value="receivable" className="mt-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center">
                                <CardTitle>Outstanding Invoices</CardTitle>
                                <Button onClick={() => handleExport('receivable')} variant="outline" className="ml-auto">
                                    <Download className="mr-2 h-4 w-4" /> Export
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead onClick={() => setSortConfigReceivable({ key: 'customer', direction: 'asc'})}>Customer</TableHead>
                                        <TableHead onClick={() => setSortConfigReceivable({ key: 'dueDate', direction: 'asc'})}>Due Date</TableHead>
                                        <TableHead className="text-right" onClick={() => setSortConfigReceivable({ key: 'dueAmount', direction: 'asc'})}>Amount Due</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedReceivables.map(inv => (
                                        <TableRow key={inv.id}>
                                            <TableCell>{inv.customer}</TableCell>
                                            <TableCell>{new Date(inv.dueDate).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right">{currencySymbol}{inv.dueAmount.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="payable" className="mt-4">
                     <Card>
                        <CardHeader>
                             <div className="flex items-center">
                                <CardTitle>Outstanding Purchase Orders</CardTitle>
                                <Button onClick={() => handleExport('payable')} variant="outline" className="ml-auto">
                                    <Download className="mr-2 h-4 w-4" /> Export
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead onClick={() => setSortConfigPayable({ key: 'supplier', direction: 'asc'})}>Supplier</TableHead>
                                        <TableHead onClick={() => setSortConfigPayable({ key: 'date', direction: 'asc'})}>Order Date</TableHead>
                                        <TableHead className="text-right" onClick={() => setSortConfigPayable({ key: 'dueAmount', direction: 'asc'})}>Amount Due</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                     {sortedPayables.map(po => (
                                        <TableRow key={po.id}>
                                            <TableCell>{po.supplier}</TableCell>
                                            <TableCell>{new Date(po.date).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right">{currencySymbol}{po.dueAmount.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

        </div>
    );
}
