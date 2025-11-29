
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
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc, writeBatch } from "firebase/firestore";
import type { Invoice, SalesCommission, UserRole, FinishedGood } from "@/lib/data";
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
import { PlusCircle, Search, DollarSign, CreditCard, FileText, MoreHorizontal } from "lucide-react"
import { useSettings } from "@/context/settings-context";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SalesDetailsDialog } from "@/components/sales/sales-details-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";


export default function SalesPage() {
  const firestore = useFirestore();
  const { currencySymbol } = useSettings();
  const { toast } = useToast();
  const invoicesCollection = useMemoFirebase(() => collection(firestore, 'invoices'), [firestore]);
  const salesCommissionsCollection = useMemoFirebase(() => collection(firestore, 'sales_commissions'), [firestore]);
  const usersCollection = useMemoFirebase(() => collection(firestore, 'salespeople'), [firestore]);
  const productsCollection = useMemoFirebase(() => collection(firestore, 'finishedGoods'), [firestore]);
  
  const { data: invoices, isLoading: invoicesLoading } = useCollection<Invoice>(invoicesCollection);
  const { data: salesCommissions, isLoading: commissionsLoading } = useCollection<SalesCommission>(salesCommissionsCollection);
  const { data: users, isLoading: usersLoading } = useCollection<UserRole>(usersCollection);
  const { data: products, isLoading: productsLoading } = useCollection<FinishedGood>(productsCollection);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceToCancel, setInvoiceToCancel] = useState<Invoice | null>(null);

  const safeInvoices = invoices || [];
  const safeCommissions = salesCommissions || [];
  const safeUsers = users || [];
  
  const isLoading = invoicesLoading || commissionsLoading || usersLoading || productsLoading;

  const invoiceWithSalesperson = useMemo(() => {
    return safeInvoices.map(invoice => {
      const commission = safeCommissions.find(c => c.invoiceId === invoice.id);
      const salesperson = safeUsers.find(u => u.uid === commission?.salespersonId);
      return {
        ...invoice,
        salespersonName: salesperson ? `${salesperson.firstName} ${salesperson.lastName}` : 'N/A',
      };
    });
  }, [safeInvoices, safeCommissions, safeUsers]);

  const kpiData = useMemo(() => {
    const relevantInvoices = safeInvoices.filter(inv => inv.status !== 'Cancelled');
    
    const totalRevenue = relevantInvoices
      .reduce((acc, inv) => acc + (inv.paidAmount ?? 0), 0);

    const outstandingDues = relevantInvoices
      .filter(inv => inv.status !== 'Paid')
      .reduce((acc, inv) => acc + (inv.dueAmount ?? 0), 0);

    const totalInvoices = relevantInvoices.length;

    return { totalRevenue, outstandingDues, totalInvoices };
  }, [safeInvoices]);

  const filteredInvoices = useMemo(() => {
    return invoiceWithSalesperson
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
  }, [invoiceWithSalesperson, searchTerm, statusFilter]);

  const getStatusVariant = (status: Invoice['status']) => {
    switch (status) {
        case 'Paid': return 'secondary';
        case 'Overdue': return 'destructive';
        case 'Partially Paid': return 'default';
        case 'Cancelled': return 'destructive';
        case 'Unpaid':
        default: return 'outline';
    }
  }

  const handleCancelSale = async () => {
    if (!invoiceToCancel || !firestore || !products) return;
    
    const batch = writeBatch(firestore);

    // 1. Update invoice status to 'Cancelled' and zero out amounts
    const invoiceRef = doc(firestore, 'invoices', invoiceToCancel.id);
    batch.update(invoiceRef, { 
        status: 'Cancelled',
        dueAmount: 0,
        paidAmount: 0, // Also zero out paid amount
    });

    // 2. Restock items
    for (const item of invoiceToCancel.items) {
        const product = products.find(p => p.productName === item.description);
        if (product) {
            const productRef = doc(firestore, 'finishedGoods', product.id);
            const newQuantity = product.quantity + item.quantity;
            batch.update(productRef, { quantity: newQuantity });
        }
    }

    try {
        await batch.commit();
        toast({
            title: 'Sale Cancelled',
            description: `Invoice ${invoiceToCancel.id} has been cancelled and its impact has been reversed.`
        });
    } catch (error) {
        console.error("Error cancelling sale: ", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not cancel the sale.'
        });
    } finally {
        setInvoiceToCancel(null);
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
              <p className="text-xs text-muted-foreground">Total amount received from paid invoices</p>
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
              <p className="text-xs text-muted-foreground">Total non-cancelled invoices generated</p>
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
                    <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
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
                    <Link href="/sales/invoice/create" passHref>
                        <Button size="sm" className="h-9 gap-1 w-full md:w-auto">
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Generate Invoice
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
                            <TableCell>{new Date(invoice.date).toLocaleString()}</TableCell>
                            <TableCell>
                                <Badge
                                variant={getStatusVariant(invoice.status)}
                                >
                                {invoice.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                {currencySymbol}{(invoice.totalAmount ?? 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-center">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Toggle menu</span>
                                    </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => setSelectedInvoice(invoice)}>View Details</DropdownMenuItem>
                                    <DropdownMenuItem disabled>Edit</DropdownMenuItem>
                                    <DropdownMenuItem disabled>Generate Invoice</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                        className="text-destructive" 
                                        disabled={invoice.status === 'Paid' || invoice.status === 'Cancelled'}
                                        onClick={() => setInvoiceToCancel(invoice)}
                                    >
                                        Cancel Sale
                                    </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
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
    {selectedInvoice && (
        <SalesDetailsDialog 
            isOpen={!!selectedInvoice}
            onOpenChange={() => setSelectedInvoice(null)}
            invoice={selectedInvoice}
        />
    )}
     <AlertDialog open={!!invoiceToCancel} onOpenChange={(open) => !open && setInvoiceToCancel(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will cancel the invoice #{invoiceToCancel?.id}, reverse its financial impact, and restock the items. This cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Back</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancelSale} className="bg-destructive hover:bg-destructive/90">
                    Confirm Cancellation
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
