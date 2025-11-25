
"use client";

import { finishedGoods } from "@/lib/data";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { useMemo } from "react";
import { useSettings } from "@/context/settings-context";

const chartConfig = {
  totalValue: {
    label: "Inventory Value",
    color: "hsl(var(--chart-3))",
  },
};

export default function InventoryValueChart() {
  const { currencySymbol } = useSettings();
  const data = useMemo(() => {
    return finishedGoods.map(item => ({
        name: item.productName.substring(0, 15) + (item.productName.length > 15 ? '...' : ''), // shorten name for chart
        totalValue: item.quantity * item.unitCost,
    }));
  }, []);


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
