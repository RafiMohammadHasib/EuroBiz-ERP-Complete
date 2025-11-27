
"use client";

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { useMemo } from "react";
import { collection } from "firebase/firestore";
import type { SalesCommission, Distributor } from "@/lib/data";
import { useSettings } from "@/context/settings-context";
import { Skeleton } from "../ui/skeleton";

const chartConfig = {
  commission: {
    label: "Commission",
    color: "hsl(var(--chart-1))",
  },
};

export default function CommissionReport() {
    const firestore = useFirestore();
    const { currencySymbol } = useSettings();
    
    const salesCommissionsCollection = useMemoFirebase(() => collection(firestore, 'sales_commissions'), [firestore]);
    const distributorsCollection = useMemoFirebase(() => collection(firestore, 'distributors'), [firestore]);
    
    const { data: salesCommissions, isLoading: scLoading } = useCollection<SalesCommission>(salesCommissionsCollection);
    const { data: distributors, isLoading: distLoading } = useCollection<Distributor>(distributorsCollection);
    
    const isLoading = scLoading || distLoading;

    const commissionData = useMemo(() => {
        if (!salesCommissions || !distributors) return [];

        const distributorCommissions: { [key: string]: number } = {};

        salesCommissions.forEach(sc => {
            const distributor = distributors.find(d => d.id === sc.distributionChannelId);
            if (distributor) {
                if (!distributorCommissions[distributor.name]) {
                    distributorCommissions[distributor.name] = 0;
                }
                distributorCommissions[distributor.name] += sc.commissionAmount;
            }
        });

        return Object.entries(distributorCommissions).map(([distributorName, totalCommission]) => ({
            name: distributorName,
            commission: totalCommission,
        }));
    }, [salesCommissions, distributors]);
    
    if (isLoading) {
        return <Skeleton className="h-full w-full" />;
    }

    return (
        <ChartContainer config={chartConfig} className="w-full h-full">
            <BarChart accessibilityLayer data={commissionData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <YAxis
                    dataKey="name"
                    type="category"
                    tickCount={commissionData.length}
                    tickLine={false}
                    axisLine={false}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    className="w-20"
                />
                <XAxis 
                    dataKey="commission"
                    type="number"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${currencySymbol}${Number(value).toLocaleString()}`}
                />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                />
                <Bar dataKey="commission" layout="vertical" fill="var(--color-commission)" radius={4} />
            </BarChart>
        </ChartContainer>
    );
}
