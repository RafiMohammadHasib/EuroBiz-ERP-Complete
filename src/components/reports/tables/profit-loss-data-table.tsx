
'use client';

import { useMemo, useState } from "react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Invoice, FinishedGood } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { useSettings } from "@/context/settings-context";
import { Skeleton } from "@/components/ui/skeleton";
import ProfitLossChart from "../profit-loss-chart";
import { DateRange } from "react-day-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ProductProfit = {
    name: string;
    revenue: number;
    cogs: number;
    grossProfit: number;
};

export function ProfitLossDataTable({ dateRange }: { dateRange?: DateRange }) {
    const firestore = useFirestore();
    const { currencySymbol } = useSettings();

    const invoicesCol = useMemoFirebase(() => collection(firestore, 'invoices'), [firestore]);
    const finishedGoodsCol = useMemoFirebase(() => collection(firestore, 'finishedGoods'), [firestore]);

    const { data: invoices, isLoading: l1 } = useCollection<Invoice>(invoicesCol);
    const { data: finishedGoods, isLoading: l2 } = useCollection<FinishedGood>(finishedGoodsCol);
    
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const isLoading = l1 || l2;
    
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


    const productProfitData: ProductProfit[] = useMemo(() => {
        if (!filteredInvoices || !finishedGoods) return [];
        
        const profitMap: { [key: string]: { revenue: number, cogs: number } } = {};

        filteredInvoices.forEach(inv => {
            // Include revenue and COGS from any invoice that has received payment.
            if (inv.paidAmount > 0) {
                const proportionOfTotalPaid = inv.totalAmount > 0 ? inv.paidAmount / inv.totalAmount : 0;
                inv.items.forEach(item => {
                    if (!profitMap[item.description]) {
                        profitMap[item.description] = { revenue: 0, cogs: 0 };
                    }
                    // Recognize revenue based on the proportion of the invoice that has been paid.
                    profitMap[item.description].revenue += item.total * proportionOfTotalPaid;
                    
                    const product = finishedGoods.find(fg => fg.productName === item.description);
                    if (product) {
                        // Recognize COGS based on the proportion of the invoice that has been paid.
                        profitMap[item.description].cogs += (item.quantity * product.unitCost) * proportionOfTotalPaid;
                    }
                });
            }
        });

        return Object.entries(profitMap).map(([name, data]) => ({
            name,
            revenue: data.revenue,
            cogs: data.cogs,
            grossProfit: data.revenue - data.cogs
        }));
    }, [filteredInvoices, finishedGoods]);

    const kpiData = useMemo(() => {
        const totalRevenue = productProfitData.reduce((acc, item) => acc + item.revenue, 0);
        const totalCogs = productProfitData.reduce((acc, item) => acc + item.cogs, 0);
        const grossProfit = totalRevenue - totalCogs;
        const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
        return { grossProfit, profitMargin, totalRevenue };
    }, [productProfitData]);

    const filteredData = useMemo(() => {
        return productProfitData.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [productProfitData, searchTerm]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return filteredData.slice(startIndex, endIndex);
    }, [filteredData, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);

    const handleExport = () => {
        const headers = ["Product Name", "Revenue", "Cost of Goods Sold", "Gross Profit"];
        const csvRows = [
            headers.join(','),
            ...filteredData.map(item => [item.name, item.revenue, item.cogs, item.grossProfit].join(','))
        ];
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'profit_loss_report.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    if (isLoading) {
        return <Skeleton className="h-[600px] w-full" />
    }

    return (
        <div className="space-y-6">
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{currencySymbol}{kpiData.grossProfit.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Revenue - Cost of Goods Sold</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{currencySymbol}{kpiData.totalRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">From all paid invoices</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Gross Profit Margin</CardTitle>
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpiData.profitMargin.toFixed(2)}%</div>
                        <p className="text-xs text-muted-foreground">Overall profitability</p>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader><CardTitle>Monthly Profit & Loss</CardTitle></CardHeader>
                <CardContent className="h-[300px]">
                    <ProfitLossChart />
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <div className="flex items-center">
                        <CardTitle>Profitability by Product</CardTitle>
                        <div className="ml-auto flex items-center gap-4">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Filter by product..."
                                    className="pl-8 w-full"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button onClick={handleExport} variant="outline">
                                <Download className="mr-2 h-4 w-4" />
                                Export
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead className="text-right">Revenue</TableHead>
                                <TableHead className="text-right">COGS</TableHead>
                                <TableHead className="text-right">Gross Profit</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedData.map(item => (
                                <TableRow key={item.name}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell className="text-right">{currencySymbol}{item.revenue.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">{currencySymbol}{item.cogs.toLocaleString()}</TableCell>
                                    <TableCell className="text-right font-semibold">{currencySymbol}{item.grossProfit.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                        Showing <strong>{paginatedData.length}</strong> of <strong>{filteredData.length}</strong> products
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                             <p className="text-xs font-medium">Rows per page</p>
                             <Select
                                value={`${rowsPerPage}`}
                                onValueChange={(value) => {
                                setRowsPerPage(Number(value));
                                setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={rowsPerPage} />
                                </SelectTrigger>
                                <SelectContent side="top">
                                {[10, 20, 30, 40, 50].map((pageSize) => (
                                    <SelectItem key={pageSize} value={`${pageSize}`}>
                                    {pageSize}
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="text-xs font-medium">
                            Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
