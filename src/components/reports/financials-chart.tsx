
"use client";

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useMemo } from "react";
import { useSettings } from "@/context/settings-context";
import { collection } from "firebase/firestore";
import type { Invoice, PurchaseOrder } from "@/lib/data";
import { Skeleton } from "../ui/skeleton";

const chartConfig = {
  receivable: {
    label: "Receivable",
    color: "hsl(var(--chart-1))",
  },
  payable: {
    label: "Payable",
    color: "hsl(var(--chart-2))",
  },
};

export default function FinancialsChart() {
  const { currencySymbol } = useSettings();
  const firestore = useFirestore();

  const invoicesCollection = useMemoFirebase(() => collection(firestore, 'invoices'), [firestore]);
  const purchaseOrdersCollection = useMemoFirebase(() => collection(firestore, 'purchaseOrders'), [firestore]);

  const { data: invoices, isLoading: invoicesLoading } = useCollection<Invoice>(invoicesCollection);
  const { data: purchaseOrders, isLoading: poLoading } = useCollection<PurchaseOrder>(purchaseOrdersCollection);
  
  const isLoading = invoicesLoading || poLoading;

  const data = useMemo(() => {
    if (!invoices || !purchaseOrders) return [];
    
    const monthlyData: { [key: string]: { receivable: number, payable: number } } = {};
    const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    monthOrder.forEach(m => monthlyData[m] = { receivable: 0, payable: 0 });

    invoices.forEach(inv => {
        if (inv.dueAmount > 0) {
            const month = new Date(inv.dueDate).toLocaleString('default', { month: 'short' });
            if(monthlyData[month]) {
                monthlyData[month].receivable += inv.dueAmount;
            }
        }
    });

    purchaseOrders.forEach(po => {
        if (po.dueAmount > 0) {
            // Assuming POs also have a due date, which is not in the model. Let's use order date for now.
             const month = new Date(po.date).toLocaleString('default', { month: 'short' });
             if(monthlyData[month]) {
                monthlyData[month].payable += po.dueAmount;
            }
        }
    });
    
    return monthOrder.map(month => ({
        month,
        receivable: monthlyData[month].receivable,
        payable: monthlyData[month].payable,
    }));

  }, [invoices, purchaseOrders]);

  if (isLoading) {
    return <Skeleton className="h-full w-full" />;
  }

  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
      <AreaChart
        accessibilityLayer
        data={data}
        margin={{
          left: 12,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value.slice(0, 3)}
        />
         <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${currencySymbol}${Number(value) / 1000}K`}
          />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Area
          dataKey="receivable"
          type="natural"
          fill="var(--color-receivable)"
          fillOpacity={0.4}
          stroke="var(--color-receivable)"
          stackId="a"
        />
        <Area
          dataKey="payable"
          type="natural"
          fill="var(--color-payable)"
          fillOpacity={0.4}
          stroke="var(--color-payable)"
          stackId="a"
        />
      </AreaChart>
    </ChartContainer>
  );
}
