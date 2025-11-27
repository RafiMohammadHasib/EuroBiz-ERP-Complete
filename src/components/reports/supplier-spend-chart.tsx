
"use client";

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { useMemo } from "react";
import { useSettings } from "@/context/settings-context";
import { collection } from "firebase/firestore";
import type { PurchaseOrder } from "@/lib/data";
import { Skeleton } from "../ui/skeleton";

const chartConfig = {
  spend: {
    label: "Total Spend",
    color: "hsl(var(--chart-5))",
  },
};

export default function SupplierSpendChart() {
  const { currencySymbol } = useSettings();
  const firestore = useFirestore();

  const purchaseOrdersCol = useMemoFirebase(() => collection(firestore, 'purchaseOrders'), [firestore]);
  const { data: purchaseOrders, isLoading } = useCollection<PurchaseOrder>(purchaseOrdersCol);

  const data = useMemo(() => {
    if (!purchaseOrders) return [];
    
    const supplierSpend: { [key: string]: number } = {};

    purchaseOrders.forEach(po => {
        if(!supplierSpend[po.supplier]) {
            supplierSpend[po.supplier] = 0;
        }
        supplierSpend[po.supplier] += po.amount;
    });
    
    return Object.entries(supplierSpend).map(([name, spend]) => ({
        name: name.substring(0,15) + (name.length > 15 ? '...' : ''),
        spend,
    })).sort((a,b) => b.spend - a.spend);

  }, [purchaseOrders]);

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
            <Bar dataKey="spend" fill="var(--color-spend)" radius={[0, 4, 4, 0]} layout="vertical" />
        </BarChart>
      </ChartContainer>
  );
}
