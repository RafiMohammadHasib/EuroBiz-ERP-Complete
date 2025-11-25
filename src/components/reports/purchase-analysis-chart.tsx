
"use client";

import { purchaseOrders } from "@/lib/data";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { useMemo } from "react";
import { useSettings } from "@/context/settings-context";

const chartConfig = {
  amount: {
    label: "PO Amount",
    color: "hsl(var(--chart-2))",
  },
};

export default function PurchaseAnalysisChart() {
  const { currency } = useSettings();
  const data = useMemo(() => {
    const monthlyData: { [key: string]: number } = {};
    purchaseOrders.forEach(po => {
        const month = new Date(po.date).toLocaleString('default', { month: 'short' });
        if (!monthlyData[month]) {
            monthlyData[month] = 0;
        }
        monthlyData[month] += po.amount;
    });

    const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    return monthOrder.map(month => ({
        month,
        amount: monthlyData[month] || 0
    })).filter(d => d.amount > 0);

  }, []);


  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
        <BarChart accessibilityLayer data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
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
            tickFormatter={(value) => `${currency} ${Number(value) / 1000}K`}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Bar dataKey="amount" fill="var(--color-amount)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
  );
}
