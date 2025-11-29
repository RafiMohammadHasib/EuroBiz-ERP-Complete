
"use client";

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useMemo } from "react";
import { useSettings } from "@/context/settings-context";
import { collection } from "firebase/firestore";
import type { Invoice, PurchaseOrder, ProductionOrder, SalesCommission, SalaryPayment, Expense } from "@/lib/data";
import { Skeleton } from "../ui/skeleton";

const chartConfig = {
  income: {
    label: "Income",
    color: "hsl(var(--chart-1))",
  },
  expense: {
    label: "Expense",
    color: "hsl(var(--chart-2))",
  },
};

export default function IncomeExpenseChart() {
  const { currencySymbol } = useSettings();
  const firestore = useFirestore();

  const invoicesCol = useMemoFirebase(() => collection(firestore, 'invoices'), [firestore]);
  const poCol = useMemoFirebase(() => collection(firestore, 'purchaseOrders'), [firestore]);
  const prodCol = useMemoFirebase(() => collection(firestore, 'productionOrders'), [firestore]);
  const commissionCol = useMemoFirebase(() => collection(firestore, 'sales_commissions'), [firestore]);
  const salaryCol = useMemoFirebase(() => collection(firestore, 'salary_payments'), [firestore]);
  const expenseCol = useMemoFirebase(() => collection(firestore, 'expenses'), [firestore]);

  const { data: invoices, isLoading: l1 } = useCollection<Invoice>(invoicesCol);
  const { data: purchaseOrders, isLoading: l2 } = useCollection<PurchaseOrder>(poCol);
  const { data: productionOrders, isLoading: l3 } = useCollection<ProductionOrder>(prodCol);
  const { data: salesCommissions, isLoading: l4 } = useCollection<SalesCommission>(commissionCol);
  const { data: salaryPayments, isLoading: l5 } = useCollection<SalaryPayment>(salaryCol);
  const { data: expenses, isLoading: l6 } = useCollection<Expense>(expenseCol);
  
  const isLoading = l1 || l2 || l3 || l4 || l5 || l6;

  const data = useMemo(() => {
    const monthlyData: { [key: string]: { income: number, expense: number } } = {};
    const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    monthOrder.forEach(m => monthlyData[m] = { income: 0, expense: 0 });

    // Calculate Income from paid invoices
    (invoices || []).forEach(inv => {
        if (inv.paidAmount > 0) {
            const month = new Date(inv.date).toLocaleString('default', { month: 'short' });
            if(monthlyData[month]) {
                monthlyData[month].income += inv.paidAmount;
            }
        }
    });

    // Calculate Expenses
    const allExpenses = [
      ...(purchaseOrders || []).filter(p => p.paidAmount > 0).map(p => ({ date: p.date, amount: p.paidAmount })),
      ...(productionOrders || []).map(p => ({ date: p.startDate, amount: p.labourCost + p.otherCosts })),
      ...(salesCommissions || []).map(s => ({ date: s.saleDate, amount: s.commissionAmount })),
      ...(salaryPayments || []).map(s => ({ date: s.paymentDate, amount: s.amount })),
      ...(expenses || []).map(e => ({ date: e.date, amount: e.amount })),
    ];

    allExpenses.forEach(exp => {
        const month = new Date(exp.date).toLocaleString('default', { month: 'short' });
        if(monthlyData[month]) {
            monthlyData[month].expense += exp.amount;
        }
    });
    
    return monthOrder.map(month => ({
        month,
        income: monthlyData[month].income,
        expense: monthlyData[month].expense,
    }));

  }, [invoices, purchaseOrders, productionOrders, salesCommissions, salaryPayments, expenses]);

  if (isLoading) {
    return <Skeleton className="h-full w-full" />;
  }

  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
      <BarChart
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
        <Bar
          dataKey="income"
          fill="var(--color-income)"
          radius={4}
        />
        <Bar
          dataKey="expense"
          fill="var(--color-expense)"
          radius={4}
        />
      </BarChart>
    </ChartContainer>
  );
}
