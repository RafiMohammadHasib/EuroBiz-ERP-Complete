
"use client";

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { useMemo } from "react";
import { useSettings } from "@/context/settings-context";
import { collection } from "firebase/firestore";
import type { SalaryPayment } from "@/lib/data";
import { Skeleton } from "../ui/skeleton";

const chartConfig = {
  amount: {
    label: "Salaries",
    color: "hsl(var(--chart-3))",
  },
};

export default function SalaryReportChart() {
  const { currencySymbol } = useSettings();
  const firestore = useFirestore();
  const salaryPaymentsCol = useMemoFirebase(() => collection(firestore, 'salary_payments'), [firestore]);
  const { data: salaryPayments, isLoading } = useCollection<SalaryPayment>(salaryPaymentsCol);

  const data = useMemo(() => {
    if (!salaryPayments) return [];
    
    const monthlyData: { [key: string]: number } = {};
    const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    monthOrder.forEach(m => monthlyData[m] = 0);

    salaryPayments.forEach(po => {
        const month = new Date(po.paymentDate).toLocaleString('default', { month: 'short' });
        if (monthlyData[month] !== undefined) {
          monthlyData[month] += po.amount;
        }
    });

    return monthOrder.map(month => ({
        month,
        amount: monthlyData[month] || 0
    }));

  }, [salaryPayments]);

  if (isLoading) {
    return <Skeleton className="h-full w-full" />;
  }

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
            tickFormatter={(value) => `${currencySymbol}${Number(value) / 1000}K`}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Bar dataKey="amount" fill="var(--color-amount)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
  );
}
