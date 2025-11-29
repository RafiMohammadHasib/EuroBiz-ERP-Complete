
'use client';

import { useMemo, useState } from "react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Invoice, PurchaseOrder, ProductionOrder, SalesCommission, SalaryPayment, Expense } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search, DollarSign, Landmark, Wallet } from "lucide-react";
import { useSettings } from "@/context/settings-context";
import IncomeExpenseChart from "../income-expense-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRange } from "react-day-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function IncomeExpenseDataTable({ dateRange }: { dateRange?: DateRange }) {
    const firestore = useFirestore();
    const { currencySymbol } = useSettings();

    const invoicesCol = useMemoFirebase(() => collection(firestore, 'invoices'), [firestore]);
    const poCol = useMemoFirebase(() => collection(firestore, 'purchaseOrders'), [firestore]);
    const prodCol = useMemoFirebase(() => collection(firestore, 'productionOrders'), [firestore]);
    const salaryCol = useMemoFirebase(() => collection(firestore, 'salary_payments'), [firestore]);
    const commissionCol = useMemoFirebase(() => collection(firestore, 'sales_commissions'), [firestore]);
    const expenseCol = useMemoFirebase(() => collection(firestore, 'expenses'), [firestore]);


    const { data: invoices, isLoading: l1 } = useCollection<Invoice>(invoicesCol);
    const { data: purchaseOrders, isLoading: l2 } = useCollection<PurchaseOrder>(poCol);
    const { data: productionOrders, isLoading: l3 } = useCollection<ProductionOrder>(prodCol);
    const { data: salaryPayments, isLoading: l4 } = useCollection<SalaryPayment>(salaryCol);
    const { data: salesCommissions, isLoading: l5 } = useCollection<SalesCommission>(commissionCol);
    const { data: expenses, isLoading: l6 } = useCollection<Expense>(expenseCol);

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const isLoading = l1 || l2 || l3 || l4 || l5 || l6;

    const filteredData = useMemo(() => {
        let allItems: {id: string, date: string, source: string, amount: number, type: 'Income' | 'Expense'}[] = [];
        
        const incomeData = (invoices || []).map(i => ({
            id: i.id,
            date: i.date,
            source: `Invoice ${i.id} - ${i.customer}`,
            amount: i.paidAmount,
            type: 'Income' as const
        })).filter(i => i.amount > 0);

        const poExpenses = (purchaseOrders || []).map(p => ({
            id: p.id,
            date: p.date,
            source: `PO ${p.id} - ${p.supplier}`,
            amount: p.paidAmount,
            type: 'Expense' as const
        })).filter(p => p.amount > 0);

        const prodExpenses = (productionOrders || []).map(p => ({
            id: p.id,
            date: p.startDate,
            source: `Production ${p.id} - ${p.productName}`,
            amount: p.labourCost + p.otherCosts,
            type: 'Expense' as const
        })).filter(p => p.amount > 0);

        const salaryExpenses = (salaryPayments || []).map(p => ({
            id: p.id,
            date: p.paymentDate,
            source: `Salary - ${p.employeeName}`,
            amount: p.amount,
            type: 'Expense' as const
        }));

        const commissionExpenses = (salesCommissions || []).map(c => ({
            id: c.id,
            date: c.saleDate,
            source: `Commission for Inv ${c.invoiceId}`,
            amount: c.commissionAmount,
            type: 'Expense' as const
        }));

        const generalExpenses = (expenses || []).map(e => ({
            id: e.id,
            date: e.date,
            source: `${e.category}: ${e.description}`,
            amount: e.amount,
            type: 'Expense' as const
        }));

        allItems = [...incomeData, ...poExpenses, ...prodExpenses, ...salaryExpenses, ...commissionExpenses, ...generalExpenses];
        
        if (dateRange?.from) {
            allItems = allItems.filter(item => new Date(item.date) >= dateRange.from!);
        }
        if (dateRange?.to) {
            allItems = allItems.filter(item => new Date(item.date) <= dateRange.to!);
        }
        return allItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [invoices, purchaseOrders, productionOrders, salaryPayments, salesCommissions, expenses, dateRange]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return filteredData.slice(startIndex, endIndex);
    }, [filteredData, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);

    const kpiData = useMemo(() => {
        const totalIncome = filteredData.filter(i => i.type === 'Income').reduce((acc, item) => acc + item.amount, 0);
        const totalExpense = filteredData.filter(i => i.type === 'Expense').reduce((acc, item) => acc + item.amount, 0);
        const netFlow = totalIncome - totalExpense;
        return { totalIncome, totalExpense, netFlow };
    }, [filteredData]);

    if (isLoading) {
        return <Skeleton className="h-[600px] w-full" />
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{currencySymbol}{kpiData.totalIncome.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">From all sales</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                        <Landmark className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{currencySymbol}{kpiData.totalExpense.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">From purchases, production, salaries</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${kpiData.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>{currencySymbol}{kpiData.netFlow.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Income minus expenses</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle>Monthly Income vs. Expense</CardTitle></CardHeader>
                <CardContent className="h-[300px]"><IncomeExpenseChart /></CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Transaction Details</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Source / Description</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedData.map(item => (
                                <TableRow key={`${item.type}-${item.id}`}>
                                    <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                                    <TableCell>{item.source}</TableCell>
                                    <TableCell>
                                        <span className={`font-semibold ${item.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>{item.type}</span>
                                    </TableCell>
                                    <TableCell className="text-right">{currencySymbol}{item.amount.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                 <CardFooter className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                        Showing <strong>{paginatedData.length}</strong> of <strong>{filteredData.length}</strong> transactions
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
