
'use client';

import { useState, useMemo } from 'react';
import type { DateRange } from 'react-day-picker';
import { subDays, differenceInDays } from 'date-fns';
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
import { DollarSign, CreditCard, Users, Truck, ShoppingCart, Building, Package, FileText, ArrowUp, ArrowDown } from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Invoice, Distributor, Supplier, PurchaseOrder } from "@/lib/data";
import { useSettings } from "@/context/settings-context";
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { cn } from '@/lib/utils';

export default function Home() {
  const firestore = useFirestore();
  const { currencySymbol } = useSettings();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const invoicesCollection = useMemoFirebase(() => collection(firestore, 'invoices'), [firestore]);
  const purchaseOrdersCollection = useMemoFirebase(() => collection(firestore, 'purchaseOrders'), [firestore]);
  const distributorsCollection = useMemoFirebase(() => collection(firestore, 'distributors'), [firestore]);
  const suppliersCollection = useMemoFirebase(() => collection(firestore, 'suppliers'), [firestore]);

  const { data: invoices, isLoading: invoicesLoading } = useCollection<Invoice>(invoicesCollection);
  const { data: purchaseOrders, isLoading: poLoading } = useCollection<PurchaseOrder>(purchaseOrdersCollection);
  const { data: distributors, isLoading: distributorsLoading } = useCollection<Distributor>(distributorsCollection);
  const { data: suppliers, isLoading: suppliersLoading } = useCollection<Supplier>(suppliersCollection);

  const { currentPeriodStats, previousPeriodStats, growth } = useMemo(() => {
    const getStatsForPeriod = (start?: Date, end?: Date) => {
        let periodInvoices = (invoices || []).filter(inv => inv.status !== 'Cancelled');
        if (start) periodInvoices = periodInvoices.filter(inv => new Date(inv.date) >= start);
        if (end) periodInvoices = periodInvoices.filter(inv => new Date(inv.date) <= end);
        
        const totalRevenue = periodInvoices.reduce((acc, i) => acc + (i.paidAmount ?? 0), 0);
        const uniqueCustomers = new Set(periodInvoices.map(i => i.customer)).size;
        const salesVolume = periodInvoices.length;

        return { totalRevenue, uniqueCustomers, salesVolume };
    };

    const currentStats = getStatsForPeriod(dateRange?.from, dateRange?.to);
    
    let previousStats = { totalRevenue: 0, uniqueCustomers: 0, salesVolume: 0 };
    if (dateRange?.from && dateRange?.to) {
        const diff = differenceInDays(dateRange.to, dateRange.from);
        const prevStart = subDays(dateRange.from, diff + 1);
        const prevEnd = subDays(dateRange.to, diff + 1);
        previousStats = getStatsForPeriod(prevStart, prevEnd);
    }

    const calculateGrowth = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    return {
      currentPeriodStats: currentStats,
      previousPeriodStats: previousStats,
      growth: {
        revenue: calculateGrowth(currentStats.totalRevenue, previousStats.totalRevenue),
        customers: calculateGrowth(currentStats.uniqueCustomers, previousStats.uniqueCustomers),
        salesVolume: calculateGrowth(currentStats.salesVolume, previousStats.salesVolume),
      }
    };
  }, [invoices, dateRange]);


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


  const safeInvoices = (invoices || []).filter(inv => inv.status !== 'Cancelled') || [];
  const safePOs = filteredPOs || [];
  const safeDistributors = distributors || [];
  const safeSuppliers = suppliers || [];

  const outstandingDues = safeInvoices.filter(i => i.status !== 'Paid').reduce((acc, i) => acc + (i.dueAmount ?? 0), 0);
  
  const pendingPurchaseOrders = safePOs.filter(p => p.deliveryStatus === 'Pending').length;
  const totalPurchaseValue = safePOs.reduce((acc, p) => acc + p.amount, 0);
  const totalSuppliers = new Set(safeSuppliers.map(p => p.name)).size;
  const totalDistributors = new Set(safeDistributors.map(d => d.name)).size;

  const isLoading = invoicesLoading || poLoading || distributorsLoading || suppliersLoading;

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

  const GrowthCard = ({ title, value, growth, formatAsCurrency = false }: { title: string, value: number, growth: number, formatAsCurrency?: boolean }) => {
    const isPositive = growth >= 0;
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {isPositive ? <ArrowUp className="h-4 w-4 text-green-500" /> : <ArrowDown className="h-4 w-4 text-red-500" />}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {formatAsCurrency && currencySymbol}
                    {value.toLocaleString(undefined, { maximumFractionDigits: formatAsCurrency ? 2 : 0 })}
                </div>
                <p className={cn("text-xs", isPositive ? "text-green-600" : "text-red-600")}>
                    {isPositive ? '+' : ''}{growth.toFixed(1)}% from previous period
                </p>
            </CardContent>
        </Card>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <DateRangePicker onUpdate={(range) => setDateRange(range.range)} />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <GrowthCard title="Revenue" value={currentPeriodStats.totalRevenue} growth={growth.revenue} formatAsCurrency />
          <GrowthCard title="New Customers" value={currentPeriodStats.uniqueCustomers} growth={growth.customers} />
          <GrowthCard title="Sales Volume" value={currentPeriodStats.salesVolume} growth={growth.salesVolume} />
      </div>


      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSuppliers}</div>
            <p className="text-xs text-muted-foreground">Active suppliers in the system</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
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
                      <TableCell>
                      <div className="font-medium">{new Date(invoice.date).toLocaleDateString()}</div>
                      <div className="text-sm text-muted-foreground">{new Date(invoice.date).toLocaleTimeString()}</div>
                    </TableCell>
                    <TableCell>{currencySymbol}{(invoice.totalAmount ?? 0).toLocaleString()}</TableCell>
                    <TableCell>
                        <Badge variant={getStatusVariant(invoice.status)}>
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
  )
}
