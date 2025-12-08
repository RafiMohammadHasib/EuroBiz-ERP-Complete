
'use client';

import { useMemo, useState } from "react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Distributor, Invoice, SalesCommission } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search, Users, DollarSign, CreditCard } from "lucide-react";
import { useSettings } from "@/context/settings-context";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRange } from "react-day-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DistributorSalesChart from "../distributor-sales-chart";

type SortKey = keyof DistributorReportData;

interface DistributorReportData {
    id: string;
    name: string;
    totalSales: number;
    outstandingDues: number;
    totalCommission: number;
}

export function DistributorWiseDataTable({ dateRange }: { dateRange?: DateRange }) {
    const firestore = useFirestore();
    const { currencySymbol } = useSettings();

    const distributorCol = useMemoFirebase(() => firestore ? collection(firestore, 'distributors') : null, [firestore]);
    const invoicesCol = useMemoFirebase(() => firestore ? collection(firestore, 'invoices') : null, [firestore]);
    const commissionCol = useMemoFirebase(() => firestore ? collection(firestore, 'sales_commissions') : null, [firestore]);

    const { data: distributors, isLoading: l1 } = useCollection<Distributor>(distributorCol);
    const { data: invoices, isLoading: l2 } = useCollection<Invoice>(invoicesCol);
    const { data: salesCommissions, isLoading: l3 } = useCollection<SalesCommission>(commissionCol);

    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: 'asc' | 'desc' } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const isLoading = l1 || l2 || l3;

    const filteredInvoices = useMemo(() => {
        let items = invoices || [];
        if (dateRange?.from) items = items.filter(item => new Date(item.date) >= dateRange.from!);
        if (dateRange?.to) items = items.filter(item => new Date(item.date) <= dateRange.to!);
        return items;
    }, [invoices, dateRange]);

    const filteredCommissions = useMemo(() => {
        let items = salesCommissions || [];
        if (dateRange?.from) items = items.filter(item => new Date(item.saleDate) >= dateRange.from!);
        if (dateRange?.to) items = items.filter(item => new Date(item.saleDate) <= dateRange.to!);
        return items;
    }, [salesCommissions, dateRange]);


    const distributorData: DistributorReportData[] = useMemo(() => {
        if (!distributors) return [];
        
        return distributors.map(dist => {
            const distInvoices = filteredInvoices.filter(inv => inv.customer === dist.name);
            const distCommissions = filteredCommissions.filter(sc => sc.distributionChannelId === dist.id);
            
            const totalSales = distInvoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);
            const outstandingDues = distInvoices.reduce((acc, inv) => acc + (inv.dueAmount || 0), 0);
            const totalCommission = distCommissions.reduce((acc, sc) => acc + sc.commissionAmount, 0);

            return {
                id: dist.id,
                name: dist.name,
                totalSales,
                outstandingDues,
                totalCommission
            };
        });
    }, [distributors, filteredInvoices, filteredCommissions]);

    const kpiData = useMemo(() => {
        const totalSales = distributorData.reduce((acc, item) => acc + item.totalSales, 0);
        const totalDues = distributorData.reduce((acc, item) => acc + item.outstandingDues, 0);
        return { totalDistributors: distributors?.length || 0, totalSales, totalDues };
    }, [distributorData, distributors]);

    const sortedData = useMemo(() => {
        let sortableItems = [...distributorData];
        if (sortConfig) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [distributorData, sortConfig, searchTerm]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return sortedData.slice(startIndex, endIndex);
    }, [sortedData, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(sortedData.length / rowsPerPage);

    const requestSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleExport = () => {
        const headers = ["Distributor Name", "Total Sales", "Outstanding Dues", "Total Commission"];
        const csvRows = [
            headers.join(','),
            ...sortedData.map(item => [item.name, item.totalSales, item.outstandingDues, item.totalCommission].join(','))
        ];
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'distributor_report.csv');
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
                        <CardTitle className="text-sm font-medium">Total Distributors</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpiData.totalDistributors}</div>
                        <p className="text-xs text-muted-foreground">Active distributors in your network</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{currencySymbol}{kpiData.totalSales.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">From all distributor sales</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Outstanding Dues</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{currencySymbol}{kpiData.totalDues.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Total receivable from distributors</p>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader><CardTitle>Top 10 Distributors by Sales</CardTitle></CardHeader>
                <CardContent className="h-[300px]">
                    <DistributorSalesChart />
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <div className="flex items-center">
                        <CardTitle>Distributor Performance Details</CardTitle>
                        <div className="ml-auto flex items-center gap-4">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Filter by distributor..."
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
                                <TableHead onClick={() => requestSort('name')}>Distributor Name</TableHead>
                                <TableHead className="text-right" onClick={() => requestSort('totalSales')}>Total Sales</TableHead>
                                <TableHead className="text-right" onClick={() => requestSort('outstandingDues')}>Outstanding Dues</TableHead>
                                <TableHead className="text-right" onClick={() => requestSort('totalCommission')}>Total Commission</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedData.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell className="text-right">{currencySymbol}{item.totalSales.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">{currencySymbol}{item.outstandingDues.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">{currencySymbol}{item.totalCommission.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                        Showing <strong>{paginatedData.length}</strong> of <strong>{sortedData.length}</strong> distributors
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
