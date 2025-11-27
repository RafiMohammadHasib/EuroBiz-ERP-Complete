
"use client";

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { useMemo } from "react";
import { useSettings } from "@/context/settings-context";
import { collection } from "firebase/firestore";
import type { FinishedGood } from "@/lib/data";
import { Skeleton } from "../ui/skeleton";

const chartConfig = {
  totalValue: {
    label: "Inventory Value",
    color: "hsl(var(--chart-3))",
  },
};

export default function InventoryValueChart() {
  const { currencySymbol } = useSettings();
  const firestore = useFirestore();
  const finishedGoodsCollection = useMemoFirebase(() => collection(firestore, 'finishedGoods'), [firestore]);
  const { data: finishedGoods, isLoading } = useCollection<FinishedGood>(finishedGoodsCollection);

  const data = useMemo(() => {
    if (!finishedGoods) return [];
    return finishedGoods.map(item => ({
        name: item.productName.substring(0, 15) + (item.productName.length > 15 ? '...' : ''), // shorten name for chart
        totalValue: item.quantity * item.unitCost,
    })).sort((a,b) => b.totalValue - a.totalValue);
  }, [finishedGoods]);
  
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
            <Bar dataKey="totalValue" fill="var(--color-totalValue)" radius={[0, 4, 4, 0]} layout="vertical" />
        </BarChart>
      </ChartContainer>
  );
}
