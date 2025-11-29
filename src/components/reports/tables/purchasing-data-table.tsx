
'use client';

import { useMemo, useState } from "react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { PurchaseOrder } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Download, Search, ChevronDown, Package, ShoppingCart, TrendingUp } from "lucide-react";
import { useSettings } from "@/context/settings-context";
import PurchaseAnalysisChart from "../purchase-analysis-chart";
import SupplierSpendChart from "../supplier-spend-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRange } from "react-day-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SortKey = keyof PurchaseOrder;

export function PurchasingDataTable({ dateRange }: { dateRange?: DateRange }) {
    const firestore = useFirestore();
    const { currencySymbol } = useSettings();

    const poCol = useMemoFirebase(() => collection(firestore, 'purchaseOrders'), [firestore]);
    const { data: purchaseOrders, isLoading } = useCollection<PurchaseOrder>(poCol);

    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: 'asc' | 'desc' } | null>(null);
    const [visibleColumns, setVisibleColumns] = useState({
        supplier: true,
        date: true,
        deliveryStatus: true,
        paymentStatus: true,
        amount: true,
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const filteredPOs = useMemo(() => {
        let items = purchaseOrders || [];
        if (dateRange?.from) {
            items = items.filter(item => new Date(item.date) >= dateRange.from!);
        }
        if (dateRange?.to) {
            items = items.filter(item => new Date(item.date) <= dateRange.to!);
        }
        return items;
    }, [purchaseOrders, dateRange]);
    
    const kpiData = useMemo(() => {
        const totalPOValue = filteredPOs.reduce((acc, po) => acc + po.amount, 0);
        const totalPOs = filteredPOs.length;
        const avgPOValue = totalPOs > 0 ? totalPOValue / totalPOs : 0;
        return { totalPOValue, totalPOs, avgPOValue };
    }, [filteredPOs]);

    const sortedPOs = useMemo(() => {
        let sortableItems = [...filteredPOs];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems.filter(po => po.supplier.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [filteredPOs, sortConfig, searchTerm]);

    const paginatedPOs = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return sortedPOs.slice(startIndex, endIndex);
    }, [sortedPOs, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(sortedPOs.length / rowsPerPage);

    const requestSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };
    
    const handleExport = () => {
        const headers = Object.keys(visibleColumns).filter(k => visibleColumns[k as keyof typeof visibleColumns]);
        const csvRows = [
            headers.join(','),
            ...sortedPOs.map(po => headers.map(header => po[header as keyof PurchaseOrder]).join(','))
        ];
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'purchasing_report.csv');
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
                    <CardTitle className="text-sm font-medium">Total Purchase Value</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{currencySymbol}{kpiData.totalPOValue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Across all purchase orders</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Purchase Orders</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{kpiData.totalPOs}</div>
                    <p className="text-xs text-muted-foreground">Total orders placed</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average PO Value</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{currencySymbol}{kpiData.avgPOValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                    <p className="text-xs text-muted-foreground">Average value per PO</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Monthly Purchase Analysis</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] p-0 pt-4">
                    <PurchaseAnalysisChart />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Spend by Supplier</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] p-0 pt-4">
                    <SupplierSpendChart />
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Purchasing Details</CardTitle>
                <div className="flex items-center gap-4 mt-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Filter by supplier..."
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
                                    checked={visibleColumns[key as keyof typeof visibleColumns]}
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
                            {visibleColumns.supplier && <TableHead onClick={() => requestSort('supplier')}>Supplier</TableHead>}
                            {visibleColumns.date && <TableHead onClick={() => requestSort('date')}>Date</TableHead>}
                            {visibleColumns.deliveryStatus && <TableHead onClick={() => requestSort('deliveryStatus')}>Delivery Status</TableHead>}
                            {visibleColumns.paymentStatus && <TableHead onClick={() => requestSort('paymentStatus')}>Payment Status</TableHead>}
                            {visibleColumns.amount && <TableHead className="text-right" onClick={() => requestSort('amount')}>Amount</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedPOs.map(po => (
                            <TableRow key={po.id}>
                                {visibleColumns.supplier && <TableCell>{po.supplier}</TableCell>}
                                {visibleColumns.date && <TableCell>{new Date(po.date).toLocaleDateString()}</TableCell>}
                                {visibleColumns.deliveryStatus && <TableCell><Badge variant={po.deliveryStatus === 'Received' ? 'secondary' : po.deliveryStatus === 'Cancelled' ? 'destructive' : 'outline'}>{po.deliveryStatus}</Badge></TableCell>}
                                {visibleColumns.paymentStatus && <TableCell><Badge variant={po.paymentStatus === 'Paid' ? 'secondary' : 'outline'}>{po.paymentStatus}</Badge></TableCell>}
                                {visibleColumns.amount && <TableCell className="text-right">{currencySymbol}{po.amount.toLocaleString()}</TableCell>}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
             <CardFooter className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                    Showing <strong>{paginatedPOs.length}</strong> of <strong>{sortedPOs.length}</strong> orders
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
        </>
    );
}
