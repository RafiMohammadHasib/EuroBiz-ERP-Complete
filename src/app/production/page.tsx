
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, CheckCircle, Clock, Package, Factory, DollarSign } from "lucide-react"
import { productionOrders } from "@/lib/data"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function ProductionPage() {
    const wipOrders = productionOrders.filter(o => o.status === "In Progress").length;
    const completedOrders = productionOrders.filter(o => o.status === "Completed").length;
    const totalProductionCost = productionOrders.reduce((acc, order) => acc + order.totalCost, 0);
    const totalUnitsProduced = productionOrders.reduce((acc, order) => acc + order.quantity, 0);

  return (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Work In Progress</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{wipOrders}</div>
                    <p className="text-xs text-muted-foreground">Active production orders</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{completedOrders}</div>
                    <p className="text-xs text-muted-foreground">Finished this month</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Production Cost</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">BDT {totalProductionCost.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">For all production orders</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Units Produced</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalUnitsProduced.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Across all orders</p>
                </CardContent>
            </Card>
        </div>
        <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Production</CardTitle>
                    <CardDescription>
                    Manage production orders and calculate unit costs.
                    </CardDescription>
                </div>
                <Button size="sm" className="h-8 gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    New Production
                    </span>
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead className="text-right">Total Cost</TableHead>
                        <TableHead className="text-right">Unit Cost</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Start Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {productionOrders.map(order => (
                         <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.id}</TableCell>
                            <TableCell>{order.productName}</TableCell>
                            <TableCell>{order.quantity.toLocaleString()}</TableCell>
                            <TableCell className="text-right">BDT {order.totalCost.toLocaleString()}</TableCell>
                            <TableCell className="text-right">BDT {(order.totalCost / order.quantity).toFixed(2)}</TableCell>
                             <TableCell>
                                <Badge variant={order.status === 'Completed' ? 'secondary' : order.status === 'In Progress' ? 'default' : 'outline'}>
                                    {order.status}
                                </Badge>
                             </TableCell>
                            <TableCell>{new Date(order.startDate).toLocaleDateString()}</TableCell>
                         </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
        </Card>
    </div>
  );
}
