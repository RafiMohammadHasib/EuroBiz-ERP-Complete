
"use client";

import { useMemo } from "react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Invoice } from "@/lib/data";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { Skeleton } from "../ui/skeleton";
import { useSettings } from "@/context/settings-context";
import { DateRange } from "react-day-picker";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
};

export default function SalesChart({ dateRange }: { dateRange?: DateRange }) {
  const firestore = useFirestore();
  const { currencySymbol } = useSettings();
  const invoicesCollection = useMemoFirebase(() => collection(firestore, 'invoices'), [firestore]);
  const { data: invoices, isLoading } = useCollection<Invoice>(invoicesCollection);
  
  const filteredInvoices = useMemo(() => {
    let items = (invoices || []).filter(inv => inv.status !== 'Cancelled');
    if (dateRange?.from) {
      items = items.filter(item => new Date(item.date) >= dateRange.from!);
    }
    if (dateRange?.to) {
      items = items.filter(item => new Date(item.date) <= dateRange.to!);
    }
    return items;
  }, [invoices, dateRange]);


  const salesData = useMemo(() => {
    const monthlyRevenue: { [key: string]: number } = {};
    
    filteredInvoices?.forEach(invoice => {
      const date = new Date(invoice.date);
      // Format as 'YYYY-MM' to group by month
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyRevenue[monthKey]) {
        monthlyRevenue[monthKey] = 0;
      }
      // Use paidAmount for revenue recognition
      monthlyRevenue[monthKey] += invoice.paidAmount;
    });

    return Object.entries(monthlyRevenue)
      .map(([monthKey, revenue]) => ({
        month: new Date(monthKey + '-02').toLocaleString('default', { month: 'short' }), // Use a specific day to avoid timezone issues
        revenue: revenue,
      }))
      .sort((a, b) => {
          const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
      });
  }, [filteredInvoices]);

  if (isLoading) {
    return <Skeleton className="h-[350px] w-full" />;
  }

  return (
    <div className="h-[350px]">
      <ChartContainer config={chartConfig} className="w-full h-full">
        <BarChart accessibilityLayer data={salesData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis
            dataKey="month"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${currencySymbol}${Number(value) / 1000}K`}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

    