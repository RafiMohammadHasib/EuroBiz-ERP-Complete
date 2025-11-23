import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { invoices } from "@/lib/data"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { commissions } from "@/lib/data"

export default function SqlViewerPage() {
  return (
    <Tabs defaultValue="invoices">
        <CardHeader className="px-0">
            <CardTitle>SQL Viewer</CardTitle>
            <CardDescription>
                Inspect the application's live data. This is a read-only view.
            </CardDescription>
        </CardHeader>
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="invoices">invoices</TabsTrigger>
          <TabsTrigger value="commissions">commissions</TabsTrigger>
          <TabsTrigger value="sales_data">sales_data</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="invoices">
        <Card>
          <CardHeader>
            <Textarea readOnly value="SELECT * FROM invoices;" className="font-mono bg-muted" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>id</TableHead>
                  <TableHead>customer</TableHead>
                  <TableHead>customerEmail</TableHead>
                  <TableHead>date</TableHead>
                  <TableHead>status</TableHead>
                  <TableHead className="text-right">amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono">{invoice.id}</TableCell>
                    <TableCell>{invoice.customer}</TableCell>
                    <TableCell>{invoice.customerEmail}</TableCell>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell>
                      <Badge variant={invoice.status === 'Paid' ? 'secondary' : invoice.status === 'Unpaid' ? 'outline' : 'destructive'}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">${invoice.amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="commissions">
        <Card>
            <CardHeader>
                <Textarea readOnly value="SELECT * FROM commissions;" className="font-mono bg-muted" />
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>id</TableHead>
                            <TableHead>ruleName</TableHead>
                            <TableHead>appliesTo</TableHead>
                            <TableHead>type</TableHead>
                            <TableHead className="text-right">rate</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {commissions.map((commission) => (
                            <TableRow key={commission.id}>
                                <TableCell className="font-mono">{commission.id}</TableCell>
                                <TableCell>{commission.ruleName}</TableCell>
                                <TableCell>{commission.appliesTo}</TableCell>
                                <TableCell>{commission.type}</TableCell>
                                <TableCell className="text-right">{commission.rate}{commission.type === 'Percentage' ? '%' : ''}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
