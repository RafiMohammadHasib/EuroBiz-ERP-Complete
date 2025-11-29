
'use client';

import { useMemo, useState } from "react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Invoice } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Download, Search, ChevronDown, DollarSign, FileText, TrendingUp } from "lucide-react";
import { useSettings } from "@/context/settings-context";
import ProductPerformanceChart from "../product-performance-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRange } from "react-day-picker";

type SortKey = keyof Invoice | 'amount';

export function SalesDataTable({ dateRange }: { dateRange?: DateRange }) {
    const firestore = useFirestore();
    const { currencySymbol } = useSettings();

    const invoicesCol = useMemoFirebase(() => collection(firestore, 'invoices'), [firestore]);
    
    const { data: invoices, isLoading: l1 } = useCollection<Invoice>(invoicesCol);

    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: 'asc' | 'desc' } | null>(null);
    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
        customer: true,
        date: true,
        status: true,
        totalAmount: true,
        paidAmount: true,
        dueAmount: true,
    });
    
    const isLoading = l1;

    const filteredInvoices = useMemo(() => {
        let items = invoices || [];
        if (dateRange?.from) {
            items = items.filter(item => new Date(item.date) >= dateRange.from!);
        }
        if (dateRange?.to) {
            items = items.filter(item => new Date(item.date) <= dateRange.to!);
        }
        return items;
    }, [invoices, dateRange]);


    const kpiData = useMemo(() => {
        const totalRevenue = filteredInvoices.reduce((acc, inv) => acc + (inv.paidAmount ?? 0), 0);
        const totalSales = filteredInvoices.reduce((acc, inv) => acc + (inv.totalAmount ?? 0), 0);
        const totalInvoices = filteredInvoices.length;
        const avgSaleValue = totalInvoices > 0 ? totalSales / totalInvoices : 0;
        return { totalRevenue, totalInvoices, avgSaleValue };
    }, [filteredInvoices]);

    const sortedInvoices = useMemo(() => {
        let sortableItems = [...filteredInvoices];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key as keyof Invoice];
                const bValue = b[sortConfig.key as keyof Invoice];
                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems.filter(inv => inv.customer.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [filteredInvoices, sortConfig, searchTerm]);

    const requestSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };
    
    const handleExport = () => {
        const headers = ["ID", "Customer", "Date", "Status", "Total Amount", "Paid Amount", "Due Amount"];
        const csvRows = [
            headers.join(','),
            ...sortedInvoices.map(inv => 
                [
                    inv.id,
                    `"${inv.customer.replace(/"/g, '""')}"`,
                    new Date(inv.date).toLocaleDateString(),
                    inv.status,
                    inv.totalAmount,
                    inv.paidAmount,
                    inv.dueAmount,
                ].join(',')
            )
        ];
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'sales_report.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return <Skeleton className="h-[600px] w-full" />
    }

    return (
        <>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{currencySymbol}{kpiData.totalRevenue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Total amount received from sales</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sales Invoices</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{kpiData.totalInvoices}</div>
                    <p className="text-xs text-muted-foreground">Total number of invoices generated</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Sale Value</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{currencySymbol}{kpiData.avgSaleValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                    <p className="text-xs text-muted-foreground">Average value per invoice</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Top Performing Products</CardTitle>
                    <CardContent className="h-[300px] p-0 pt-4">
                        <ProductPerformanceChart />
                    </CardContent>
                </CardHeader>
            </Card>
        </div>
       
        <Card>
            <CardHeader>
                <CardTitle>Sales Details</CardTitle>
                <div className="flex items-center gap-4 mt-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Filter by customer..."
                            className="pl-8 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="ml-auto">
                                Columns <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {Object.keys(visibleColumns).map((key) => (
                                <DropdownMenuCheckboxItem
                                    key={key}
                                    className="capitalize"
                                    checked={visibleColumns[key]}
                                    onCheckedChange={(value) =>
                                        setVisibleColumns(prev => ({...prev, [key]: !!value}))
                                    }
                                >
                                    {key.replace(/([A-Z])/g, ' $1')}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button onClick={handleExport} variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            {visibleColumns.customer && <TableHead onClick={() => requestSort('customer')}>Customer</TableHead>}
                            {visibleColumns.date && <TableHead onClick={() => requestSort('date')}>Date</TableHead>}
                            {visibleColumns.status && <TableHead onClick={() => requestSort('status')}>Status</TableHead>}
                            {visibleColumns.totalAmount && <TableHead className="text-right" onClick={() => requestSort('totalAmount')}>Total Amount</TableHead>}
                            {visibleColumns.paidAmount && <TableHead className="text-right" onClick={() => requestSort('paidAmount')}>Paid Amount</TableHead>}
                            {visibleColumns.dueAmount && <TableHead className="text-right" onClick={() => requestSort('dueAmount')}>Due Amount</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedInvoices.map(invoice => (
                            <TableRow key={invoice.id}>
                                {visibleColumns.customer && <TableCell>{invoice.customer}</TableCell>}
                                {visibleColumns.date && <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>}
                                {visibleColumns.status && <TableCell><Badge variant={invoice.status === 'Paid' ? 'secondary' : 'outline'}>{invoice.status}</Badge></TableCell>}
                                {visibleColumns.totalAmount && <TableCell className="text-right">{currencySymbol}{(invoice.totalAmount ?? 0).toLocaleString()}</TableCell>}
                                {visibleColumns.paidAmount && <TableCell className="text-right">{currencySymbol}{(invoice.paidAmount ?? 0).toLocaleString()}</TableCell>}
                                {visibleColumns.dueAmount && <TableCell className="text-right">{currencySymbol}{(invoice.dueAmount ?? 0).toLocaleString()}</TableCell>}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        </>
    );
}
