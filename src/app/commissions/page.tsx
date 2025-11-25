
'use client';

import { useState } from "react";
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
import { Button } from "@/components/ui/button"
import { PlusCircle, MoreHorizontal, Percent, BarChart } from "lucide-react"
import { type Commission } from "@/lib/data"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CreateCommissionRuleDialog } from "@/components/commissions/create-commission-rule-dialog";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/context/settings-context";

export default function CommissionsPage() {
    const firestore = useFirestore();
    const { currencySymbol } = useSettings();
    const commissionsCollection = useMemoFirebase(() => collection(firestore, 'commissions'), [firestore]);
    const { data: commissions, isLoading } = useCollection<Commission>(commissionsCollection);
    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
    const { toast } = useToast();

    const safeCommissions = commissions || [];

    const totalCommissionValue = safeCommissions.reduce((acc, commission) => {
        if (commission.type === 'Percentage') {
            // This is an estimation. A real calculation would need sales data.
            return acc + (10000 * (commission.rate / 100)); 
        }
        return acc + commission.rate;
    }, 0);

    const averageCommissionRate = safeCommissions.filter(c => c.type === 'Percentage').reduce((acc, c, _, arr) => arr.length > 0 ? acc + c.rate / arr.length : 0, 0);

    const addCommissionRule = async (newRule: Omit<Commission, 'id'>) => {
      try {
        await addDoc(commissionsCollection, newRule);
        toast({
          title: 'Commission Rule Created',
          description: `A new rule "${newRule.ruleName}" has been added.`,
        });
      } catch (error) {
        console.error("Error adding commission rule:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not create the commission rule.",
        });
      }
    }

  return (
    <>
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Commission Paid (Est.)</CardTitle>
                    <BarChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{currencySymbol}{totalCommissionValue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Based on current rules</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Commission Rate</CardTitle>
                    <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{averageCommissionRate.toFixed(2)}%</div>
                    <p className="text-xs text-muted-foreground">For percentage-based rules</p>
                </CardContent>
            </Card>
        </div>
        <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Commission Rules</CardTitle>
                    <CardDescription>
                    Manage product and distribution-based sales commissions.
                    </CardDescription>
                </div>
                <Button size="sm" className="h-8 gap-1" onClick={() => setCreateDialogOpen(true)}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Add Rule
                    </span>
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Rule Name</TableHead>
                <TableHead>Applies To</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead>
                    <span className="sr-only">Actions</span>
                </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell>
                  </TableRow>
                ) : (
                  safeCommissions.map((commission) => (
                  <TableRow key={commission.id}>
                      <TableCell className="font-medium">{commission.ruleName}</TableCell>
                      <TableCell>{commission.appliesTo}</TableCell>
                      <TableCell>{commission.type}</TableCell>
                      <TableCell className="text-right">
                      {commission.type === 'Percentage' ? `${commission.rate}%` : `${currencySymbol}${commission.rate.toLocaleString()}`}
                      </TableCell>
                      <TableCell>
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                          </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>
                      </TableCell>
                  </TableRow>
                  ))
                )}
            </TableBody>
            </Table>
        </CardContent>
        </Card>
    </div>
    <CreateCommissionRuleDialog 
        isOpen={isCreateDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={addCommissionRule}
    />
    </>
  );
}
