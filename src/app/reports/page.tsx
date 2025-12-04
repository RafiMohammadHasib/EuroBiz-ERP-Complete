
'use client';

import { useState } from "react";
import { DateRange } from "react-day-picker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SalesDataTable } from "@/components/reports/tables/sales-data-table";
import { PurchasingDataTable } from "@/components/reports/tables/purchasing-data-table";
import { InventoryDataTable } from "@/components/reports/tables/inventory-data-table";
import { FinancialsDataTable } from "@/components/reports/tables/financials-data-table";
import { CommissionsDataTable } from "@/components/reports/tables/commissions-data-table";
import { IncomeExpenseDataTable } from "@/components/reports/tables/income-expense-data-table";
import { ProfitLossDataTable } from "@/components/reports/tables/profit-loss-data-table";
import { DistributorWiseDataTable } from "@/components/reports/tables/distributor-wise-data-table";
import { DateRangePicker } from "@/components/ui/date-range-picker";

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader className="flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <CardTitle>Comprehensive Reports</CardTitle>
                    <CardDescription>
                    An interactive overview of your business performance across all key areas.
                    </CardDescription>
                </div>
                <DateRangePicker onUpdate={(range) => setDateRange(range.range)} />
            </CardHeader>
        </Card>
        <Tabs defaultValue="sales" className="grid grid-cols-1 gap-6">
            <TabsList className="grid w-full grid-cols-1 h-auto sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8">
                <TabsTrigger value="sales">Sales</TabsTrigger>
                <TabsTrigger value="purchasing">Purchasing</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="financials">Financials</TabsTrigger>
                <TabsTrigger value="commissions">Commissions</TabsTrigger>
                <TabsTrigger value="income-expense">Income/Expense</TabsTrigger>
                <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
                <TabsTrigger value="distributors">Distributors</TabsTrigger>
            </TabsList>
            <TabsContent value="sales">
                <div className="grid gap-6">
                   <SalesDataTable dateRange={dateRange}/>
                </div>
            </TabsContent>
            <TabsContent value="purchasing">
                <div className="grid gap-6">
                    <PurchasingDataTable dateRange={dateRange} />
                </div>
            </TabsContent>
            <TabsContent value="inventory">
                <InventoryDataTable />
            </TabsContent>
            <TabsContent value="financials">
                 <FinancialsDataTable dateRange={dateRange} />
            </TabsContent>
            <TabsContent value="commissions">
               <CommissionsDataTable dateRange={dateRange} />
            </TabsContent>
             <TabsContent value="income-expense">
               <IncomeExpenseDataTable dateRange={dateRange} />
            </TabsContent>
            <TabsContent value="profit-loss">
               <ProfitLossDataTable dateRange={dateRange} />
            </TabsContent>
            <TabsContent value="distributors">
               <DistributorWiseDataTable dateRange={dateRange} />
            </TabsContent>
        </Tabs>
    </div>
  )
}
