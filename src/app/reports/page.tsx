
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import SalesChart from "@/components/dashboard/sales-chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PurchaseAnalysisChart from "@/components/reports/purchase-analysis-chart"
import InventoryValueChart from "@/components/reports/inventory-value-chart"
import CommissionReport from "@/components/reports/commission-chart"
import FinancialsChart from "@/components/reports/financials-chart"

export default function ReportsPage() {
  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Comprehensive Reports</CardTitle>
                <CardDescription>
                A complete overview of your business performance across all key areas.
                </CardDescription>
            </CardHeader>
        </Card>
        <Tabs defaultValue="sales">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="purchasing">Purchasing</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
        </TabsList>
        <TabsContent value="sales">
            <Card>
            <CardHeader>
                <CardTitle>Sales Report</CardTitle>
                <CardDescription>
                An overview of your company's sales performance over the last year.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="h-[400px]">
                <SalesChart />
                </div>
            </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="purchasing">
            <Card>
            <CardHeader>
                <CardTitle>Purchase Order Analysis</CardTitle>
                <CardDescription>
                Track purchase order volume and spending over time.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[400px]">
                    <PurchaseAnalysisChart />
                </div>
            </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="inventory">
            <Card>
            <CardHeader>
                <CardTitle>Inventory Report</CardTitle>
                <CardDescription>
                Value of your finished goods inventory.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[400px]">
                    <InventoryValueChart />
                </div>
            </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="financials">
            <Card>
            <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
                <CardDescription>
                Overview of accounts receivable vs. accounts payable.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[400px]">
                    <FinancialsChart />
                </div>
            </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="commissions">
            <Card>
            <CardHeader>
                <CardTitle>Distributor Commission Report</CardTitle>
                <CardDescription>
                Total commission generated per distributor.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[400px]">
                    <CommissionReport />
                </div>
            </CardContent>
            </Card>
        </TabsContent>
        </Tabs>
    </div>
  )
}
