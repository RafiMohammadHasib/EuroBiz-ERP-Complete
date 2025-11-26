
'use client';

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, writeBatch, doc } from "firebase/firestore";
import type { Invoice, FinishedGood, Customer } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
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
import { PlusCircle } from "lucide-react"
import { useSettings } from "@/context/settings-context";


export default function SalesPage() {
  const firestore = useFirestore();
  const { currencySymbol } = useSettings();
  const invoicesCollection = useMemoFirebase(() => collection(firestore, 'invoices'), [firestore]);
  const { data: invoices, isLoading } = useCollection<Invoice>(invoicesCollection);
  
  const safeInvoices = invoices || [];

  return (
    <>
    <div className="space-y-6">
       <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Invoices</CardTitle>
                    <CardDescription>
                      View and manage all your sales invoices.
                    </CardDescription>
                </div>
                 <Link href="/sales/create" passHref>
                    <Button size="sm" className="h-8 gap-1">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Create Sale
                        </span>
                    </Button>
                </Link>
            </div>
          </CardHeader>
          <CardContent>
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
                    ) : safeInvoices.length > 0 ? (
                    safeInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.customer}</TableCell>
                        <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                            <Badge
                            variant={
                                invoice.status === 'Paid' ? 'secondary' : invoice.status === 'Overdue' ? 'destructive' : 'outline'
                            }
                            >
                            {invoice.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            {currencySymbol}{invoice.amount.toLocaleString()}
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
    </div>
    </>
  );
}
