
"use client";

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { useMemo } from "react";
import { collection } from "firebase/firestore";
import type { Invoice, Distributor } from "@/lib/data";
import { useSettings } from "@/context/settings-context";
import { Skeleton } from "../ui/skeleton";

const chartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--chart-1))",
  },
};

export default function DistributorSalesChart() {
    const firestore = useFirestore();
    const { currencySymbol } = useSettings();
    
    const invoicesCollection = useMemoFirebase(() => collection(firestore, 'invoices'), [firestore]);
    const distributorsCollection = useMemoFirebase(() => collection(firestore, 'distributors'), [firestore]);
    
    const { data: invoices, isLoading: invoicesLoading } = useCollection<Invoice>(invoicesCollection);
    const { data: distributors, isLoading: distLoading } = useCollection<Distributor>(distributorsCollection);
    
    const isLoading = invoicesLoading || distLoading;

    const distributorSalesData = useMemo(() => {
        if (!invoices || !distributors) return [];

        const distributorSales: { [key: string]: number } = {};

        invoices.forEach(inv => {
            // Assuming inv.customer is the distributor name which matches distributor.name
            const distributor = distributors.find(d => d.name === inv.customer);
            if (distributor) {
                if (!distributorSales[distributor.name]) {
                    distributorSales[distributor.name] = 0;
                }
                if (inv.status === 'Paid' || inv.status === 'Partially Paid') {
                    distributorSales[distributor.name] += inv.paidAmount;
                }
            }
        });

        return Object.entries(distributorSales).map(([distributorName, totalSales]) => ({
            name: distributorName,
            sales: totalSales,
        })).sort((a,b) => b.sales - a.sales).slice(0, 10); // Top 10
    }, [invoices, distributors]);
    
    if (isLoading) {
        return <Skeleton className="h-full w-full" />;
    }

    return (
        <ChartContainer config={chartConfig} className="w-full h-full">
            <BarChart accessibilityLayer data={distributorSalesData} layout="vertical" margin={{ left: 30, right: 20 }}>
                <YAxis
                    dataKey="name"
                    type="category"
                    tickCount={distributorSalesData.length}
                    tickLine={false}
                    axisLine={false}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    className="w-20"
                />
                <XAxis 
                    dataKey="sales"
                    type="number"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${currencySymbol}${Number(value) / 1000}K`}
                />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                />
                <Bar dataKey="sales" layout="vertical" fill="var(--color-sales)" radius={4} />
            </BarChart>
        </ChartContainer>
    );
}
