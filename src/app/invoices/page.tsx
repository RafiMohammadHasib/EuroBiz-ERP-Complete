
'use client';

import Link from "next/link";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { PlusCircle, File, MoreHorizontal, DollarSign, CreditCard, AlertCircle, Hourglass } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreateInvoiceDialog } from "@/components/invoices/create-invoice-dialog";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, addDoc } from "firebase/firestore";
import type { Invoice } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

export default function InvoicesPage() {
  const firestore = useFirestore();
  const invoicesCollection = useMemoFirebase(() => collection(firestore, 'invoices'), [firestore]);
  const { data: invoices, isLoading } = useCollection<Invoice>(invoicesCollection);
  const [isCreateInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const { toast } = useToast();

  const safeInvoices = invoices || [];

  const totalInvoiceValue = safeInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const totalUnpaid = safeInvoices.filter(i => i.status === 'Unpaid').reduce((sum, invoice) => sum + invoice.amount, 0);
  const totalOverdue = safeInvoices.filter(i => i.status === 'Overdue').reduce((sum, invoice) => sum + invoice.amount, 0);
  const totalDues = totalUnpaid + totalOverdue;

  const handleExport = () => {
    const headers = ["ID", "Customer", "Email", "Date", "Due Date", "Amount", "Status"];
    const csvRows = [
      headers.join(','),
      ...safeInvoices.map(invoice => 
        [
          invoice.id,
          `"${invoice.customer.replace(/"/g, '""')}"`,
          invoice.customerEmail,
          invoice.date,
          invoice.dueDate,
          invoice.amount,
          invoice.status
        ].join(',')
      )
    ];
    
    const csvString = csvRows.join('\\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'invoices.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const addInvoice = async (newInvoice: Omit<Invoice, 'id' | 'items'>) => {
    const invoiceWithItems = {
      ...newInvoice,
      items: [{
        id: 'item-new',
        description: 'New Item',
        quantity: 1,
        unitPrice: newInvoice.amount,
        total: newInvoice.amount
      }]
    };
    try {
      await addDoc(invoicesCollection, invoiceWithItems);
      toast({
        title: "Invoice Created",
        description: `A new invoice for ${newInvoice.customer} has been added.`,
      });
    } catch(error) {
      console.error("Error adding invoice: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not create the invoice.",
      });
    }
  }

  const renderInvoiceTable = (invoiceList: Invoice[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice ID</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell>
          </TableRow>
        ) : (
          invoiceList.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-medium">{invoice.id}</TableCell>
            <TableCell>{invoice.customer}</TableCell>
            <TableCell>
              <Badge variant={invoice.status === 'Paid' ? 'secondary' : invoice.status === 'Unpaid' ? 'outline' : 'destructive'}>
                {invoice.status}
              </Badge>
            </TableCell>
            <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
            <TableCell className="text-right">BDT {invoice.amount.toLocaleString()}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button aria-haspopup="true" size="icon" variant="ghost">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href={`/invoices/${invoice.id}`}>View Details</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>Mark as Paid</DropdownMenuItem>
                  <DropdownMenuItem>Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        )))}
      </TableBody>
    </Table>
  );


  return (
    <>
    <div className="space-y-6">
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoice Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">BDT {totalInvoiceValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From all invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding Dues</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">BDT {totalDues.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all unpaid & overdue invoices</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Unpaid</CardTitle>
            <Hourglass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">BDT {totalUnpaid.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Invoices currently pending payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">BDT {totalOverdue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Invoices past their due date</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
            <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleExport}>
              <File className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Export
              </span>
            </Button>
            <Button size="sm" className="h-8 gap-1" onClick={() => setCreateInvoiceOpen(true)}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Create Invoice
              </span>
            </Button>
          </div>
        </div>
        <Card className="mt-4">
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>
                Manage your sales invoices and track their status.
              </CardDescription>
            </CardHeader>
            <CardContent>
                <TabsContent value="all" className="mt-0">
                  {renderInvoiceTable(safeInvoices)}
                </TabsContent>
                <TabsContent value="paid" className="mt-0">
                  {renderInvoiceTable(safeInvoices.filter(i => i.status === 'Paid'))}
                </TabsContent>
                <TabsContent value="unpaid" className="mt-0">
                  {renderInvoiceTable(safeInvoices.filter(i => i.status === 'Unpaid'))}
                </TabsContent>
                <TabsContent value="overdue" className="mt-0">
                  {renderInvoiceTable(safeInvoices.filter(i => i.status === 'Overdue'))}
                </TabsContent>
            </CardContent>
          </Card>
      </Tabs>
    </div>
    <CreateInvoiceDialog 
        isOpen={isCreateInvoiceOpen} 
        onOpenChange={setCreateInvoiceOpen} 
        onCreateInvoice={addInvoice} 
    />
    </>
  );
}
