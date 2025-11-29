
'use client';

import {
  Card,
  CardContent,
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
import SalesChart from "@/components/dashboard/sales-chart"
import { DollarSign, CreditCard, Users, Truck, ShoppingCart, Building, Package, FileText } from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Invoice, Distributor, Supplier, PurchaseOrder } from "@/lib/data";
import { useSettings } from "@/context/settings-context";

export default function Home() {
  const firestore = useFirestore();
  const { currencySymbol } = useSettings();

  const invoicesCollection = useMemoFirebase(() => collection(firestore, 'invoices'), [firestore]);
  const purchaseOrdersCollection = useMemoFirebase(() => collection(firestore, 'purchaseOrders'), [firestore]);
  const distributorsCollection = useMemoFirebase(() => collection(firestore, 'distributors'), [firestore]);
  const suppliersCollection = useMemoFirebase(() => collection(firestore, 'suppliers'), [firestore]);

  const { data: invoices, isLoading: invoicesLoading } = useCollection<Invoice>(invoicesCollection);
  const { data: purchaseOrders, isLoading: poLoading } = useCollection<PurchaseOrder>(purchaseOrdersCollection);
  const { data: distributors, isLoading: distributorsLoading } = useCollection<Distributor>(distributorsCollection);
  const { data: suppliers, isLoading: suppliersLoading } = useCollection<Supplier>(suppliersCollection);

  const safeInvoices = invoices || [];
  const safePOs = purchaseOrders || [];
  const safeDistributors = distributors || [];
  const safeSuppliers = suppliers || [];

  const totalRevenue = safeInvoices.reduce((acc, i) => acc + (i.paidAmount ?? 0), 0);
  const outstandingDues = safeInvoices.filter(i => i.status !== 'Paid').reduce((acc, i) => acc + (i.dueAmount ?? 0), 0);
  const paidInvoices = safeInvoices.filter(i => i.status === 'Paid').length;
  const uniqueCustomers = new Set(safeInvoices.map(i => i.customer)).size;
  
  const pendingPurchaseOrders = safePOs.filter(p => p.deliveryStatus === 'Pending').length;
  const totalPurchaseValue = safePOs.reduce((acc, p) => acc + p.amount, 0);
  const totalSuppliers = new Set(safeSuppliers.map(p => p.name)).size;
  const totalDistributors = new Set(safeDistributors.map(d => d.name)).size;

  const isLoading = invoicesLoading || poLoading || distributorsLoading || suppliersLoading;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencySymbol}{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total amount received from sales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Dues</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencySymbol}{outstandingDues.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all unpaid invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{uniqueCustomers}</div>
            <p className="text-xs text-muted-foreground">Unique customers this period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Distributors</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalDistributors}</div>
            <p className="text-xs text-muted-foreground">From your distributor network</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending POs</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPurchaseOrders}</div>
            <p className="text-xs text-muted-foreground">Purchase orders awaiting completion</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total PO Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencySymbol}{totalPurchaseValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">For all purchase orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSuppliers}</div>
            <p className="text-xs text-muted-foreground">Active suppliers in the system</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeInvoices.length}</div>
            <p className="text-xs text-muted-foreground">Generated invoices</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : (
                  safeInvoices.slice(0, 5).map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                          <div className="font-medium">{invoice.customer}</div>
                          <div className="hidden text-sm text-muted-foreground md:inline">
                              {invoice.customerEmail}
                          </div>
                      </TableCell>
                      <TableCell>{currencySymbol}{(invoice.totalAmount ?? 0).toLocaleString()}</TableCell>
                      <TableCell>
                          <Badge variant={invoice.status === 'Paid' ? 'secondary' : invoice.status === 'Unpaid' ? 'outline' : 'destructive'}>
                            {invoice.status}
                          </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
