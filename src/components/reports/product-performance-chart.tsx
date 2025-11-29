
"use client";

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { useMemo } from "react";
import { useSettings } from "@/context/settings-context";
import { collection } from "firebase/firestore";
import type { Invoice } from "@/lib/data";
import { Skeleton } from "../ui/skeleton";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-2))",
  },
};

export default function ProductPerformanceChart() {
  const { currencySymbol } = useSettings();
  const firestore = useFirestore();

  const invoicesCol = useMemoFirebase(() => collection(firestore, 'invoices'), [firestore]);
  const { data: invoices, isLoading } = useCollection<Invoice>(invoicesCol);

  const data = useMemo(() => {
    if (!invoices) return [];
    
    const productRevenue: { [key: string]: number } = {};

    invoices.forEach(inv => {
        if(inv.status === 'Paid' || inv.status === 'Partially Paid') {
            inv.items.forEach(item => {
                if(!productRevenue[item.description]) {
                    productRevenue[item.description] = 0;
                }
                productRevenue[item.description] += item.total;
            })
        }
    });
    
    return Object.entries(productRevenue).map(([name, revenue]) => ({
        name: name.substring(0,15) + (name.length > 15 ? '...' : ''),
        revenue,
    })).sort((a,b) => b.revenue - a.revenue).slice(0, 10);

  }, [invoices]);

  if (isLoading) {
    return <Skeleton className="h-full w-full" />;
  }

  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
        <BarChart accessibilityLayer data={data} layout="vertical" margin={{ top: 20, right: 20, bottom: 20, left: 40 }}>
            <YAxis
                dataKey="name"
                type="category"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
            />
            <XAxis
                type="number"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${currencySymbol}${Number(value) / 1000}K`}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[0, 4, 4, 0]} layout="vertical" />
        </BarChart>
      </ChartContainer>
  );
}


