
'use client';

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Invoice } from "@/lib/data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PlusCircle, Search, DollarSign, CreditCard, FileText } from "lucide-react"
import { useSettings } from "@/context/settings-context";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function SalesPage() {
  const firestore = useFirestore();
  const { currencySymbol } = useSettings();
  const invoicesCollection = useMemoFirebase(() => collection(firestore, 'invoices'), [firestore]);
  const { data: invoices, isLoading } = useCollection<Invoice & { amount?: number }>(invoicesCollection);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const safeInvoices = invoices || [];

  const kpiData = useMemo(() => {
    const totalRevenue = safeInvoices
      .reduce((acc, inv) => acc + inv.paidAmount, 0);

    const outstandingDues = safeInvoices
      .reduce((acc, inv) => acc + inv.dueAmount, 0);

    const totalInvoices = safeInvoices.length;

    return { totalRevenue, outstandingDues, totalInvoices };
  }, [safeInvoices]);

  const filteredInvoices = useMemo(() => {
    return safeInvoices
      .filter(invoice => {
        // Status filter
        if (statusFilter !== 'all' && invoice.status.toLowerCase().replace(' ', '-') !== statusFilter) {
          return false;
        }
        // Search term filter
        if (searchTerm && !invoice.customer.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [safeInvoices, searchTerm, statusFilter]);

  const getStatusVariant = (status: Invoice['status']) => {
    switch (status) {
        case 'Paid': return 'secondary';
        case 'Overdue': return 'destructive';
        case 'Partially Paid': return 'default';
        case 'Unpaid':
        default: return 'outline';
    }
  }

  return (
    <>
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currencySymbol}{kpiData.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total amount received</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Dues</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currencySymbol}{kpiData.outstandingDues.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">From unpaid & overdue invoices</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiData.totalInvoices}</div>
              <p className="text-xs text-muted-foreground">Total invoices generated</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <div className="flex flex-col md:flex-row items-center gap-4">
                <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
                    <TabsTrigger value="partially-paid">Partially Paid</TabsTrigger>
                    <TabsTrigger value="paid">Paid</TabsTrigger>
                    <TabsTrigger value="overdue">Overdue</TabsTrigger>
                </TabsList>
                 <div className="flex-1 w-full md:w-auto relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by customer name..."
                        className="pl-8 w-full md:w-[300px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                 <div className="md:ml-auto">
                    <Link href="/sales/create" passHref>
                        <Button size="sm" className="h-9 gap-1 w-full md:w-auto">
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Create Sale
                            </span>
                        </Button>
                    </Link>
                </div>
            </div>
       
            <Card className="mt-4">
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-center">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : filteredInvoices.length > 0 ? (
                        filteredInvoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{invoice.customer}</TableCell>
                            <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                            <TableCell>
                                <Badge
                                variant={getStatusVariant(invoice.status)}
                                >
                                {invoice.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                {currencySymbol}{(invoice.totalAmount ?? invoice.amount ?? 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-center">
                                <Link href={`/invoices/${invoice.id}`} passHref>
                                    <Button size="sm" variant="outline">View Invoice</Button>
                                </Link>
                            </TableCell>
                            </TableRow>
                        ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                    No invoices found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    </Table>
            </CardContent>
            </Card>
        </Tabs>
    </div>
    </>
  );
}
