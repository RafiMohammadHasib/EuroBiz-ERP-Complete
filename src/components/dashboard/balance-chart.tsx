
"use client";

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Line } from "recharts";
import { useMemo } from "react";
import { useSettings } from "@/context/settings-context";
import { collection } from "firebase/firestore";
import type { Invoice, PurchaseOrder, ProductionOrder, SalesCommission, SalaryPayment, Expense } from "@/lib/data";
import { Skeleton } from "../ui/skeleton";
import { DateRange } from "react-day-picker";

const chartConfig = {
  income: {
    label: "Income",
    color: "hsl(var(--chart-1))",
  },
  expense: {
    label: "Expense",
    color: "hsl(var(--chart-2))",
  },
  netProfit: {
    label: "Net Profit",
    color: "hsl(var(--chart-3))",
  }
};

interface BalanceChartProps {
    dateRange?: DateRange;
    invoices: Invoice[];
    purchaseOrders: PurchaseOrder[];
    productionOrders: ProductionOrder[];
    salesCommissions: SalesCommission[];
    salaryPayments: SalaryPayment[];
    expenses: Expense[];
    isLoading: boolean;
}

export default function BalanceChart({ 
    dateRange, 
    invoices,
    purchaseOrders,
    productionOrders,
    salesCommissions,
    salaryPayments,
    expenses,
    isLoading 
}: BalanceChartProps) {
  const { currencySymbol } = useSettings();
  
  const data = useMemo(() => {
    let allInvoices = invoices || [];
    if (dateRange?.from) {
        allInvoices = allInvoices.filter(item => new Date(item.date) >= dateRange.from!);
    }
    if (dateRange?.to) {
        allInvoices = allInvoices.filter(item => new Date(item.date) <= dateRange.to!);
    }

    const allExpensesRaw = [
        ...(purchaseOrders || []).map(p => ({ date: p.date, amount: p.paidAmount })),
        ...(productionOrders || []).map(p => ({ date: p.startDate, amount: (p.labourCost || 0) + (p.otherCosts || 0) })),
        ...(salesCommissions || []).map(c => ({ date: c.saleDate, amount: c.commissionAmount })),
        ...(salaryPayments || []).map(s => ({ date: s.paymentDate, amount: s.amount })),
        ...(expenses || []).map(e => ({ date: e.date, amount: e.amount })),
    ];

    let allExpenses = allExpensesRaw;
     if (dateRange?.from) {
        allExpenses = allExpenses.filter(item => new Date(item.date) >= dateRange.from!);
    }
    if (dateRange?.to) {
         allExpenses = allExpenses.filter(item => new Date(item.date) <= dateRange.to!);
    }


    const monthlyData: { [key: string]: { income: number, expense: number } } = {};
    const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    monthOrder.forEach(m => monthlyData[m] = { income: 0, expense: 0 });

    allInvoices.forEach(inv => {
        if (inv.paidAmount > 0) {
            const month = new Date(inv.date).toLocaleString('default', { month: 'short' });
            if(monthlyData[month]) {
                monthlyData[month].income += inv.paidAmount;
            }
        }
    });

    allExpenses.forEach(exp => {
        const month = new Date(exp.date).toLocaleString('default', { month: 'short' });
        if(monthlyData[month]) {
            monthlyData[month].expense += exp.amount || 0;
        }
    });
    
    return monthOrder.map(month => ({
        month,
        income: monthlyData[month].income,
        expense: monthlyData[month].expense,
        netProfit: monthlyData[month].income - monthlyData[month].expense,
    }));

  }, [invoices, purchaseOrders, productionOrders, salesCommissions, salaryPayments, expenses, dateRange]);

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
        <defs>
            <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-income)"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="var(--color-income)"
                stopOpacity={0.1}
              />
            </linearGradient>
             <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-expense)"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="var(--color-expense)"
                stopOpacity={0.1}
              />
            </linearGradient>
          </defs>
        <Area
          dataKey="income"
          type="natural"
          fill="url(#fillIncome)"
          stroke="var(--color-income)"
        />
        <Area
          dataKey="expense"
          type="natural"
          fill="url(#fillExpense)"
          stroke="var(--color-expense)"
        />
        <Line
          dataKey="netProfit"
          type="natural"
          stroke="var(--color-netProfit)"
          strokeWidth={2}
          dot={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}
