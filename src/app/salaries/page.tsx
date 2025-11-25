
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
import { PlusCircle, MoreHorizontal, Users, DollarSign, UserCheck } from "lucide-react"
import { type Salary } from "@/lib/data"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { CreateSalaryDialog } from "@/components/salaries/create-salary-dialog";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/context/settings-context";

export default function SalariesPage() {
  const firestore = useFirestore();
  const { currency } = useSettings();
  const salariesCollection = useMemoFirebase(() => collection(firestore, 'salaries'), [firestore]);
  const { data: salaries, isLoading } = useCollection<Salary>(salariesCollection);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const safeSalaries = salaries || [];

  const totalMonthlySalary = safeSalaries.filter(s => s.status === 'Active').reduce((acc, salary) => acc + salary.amount, 0);
  const totalEmployees = safeSalaries.length;
  const activeEmployees = safeSalaries.filter(s => s.status === 'Active').length;
  const averageSalary = activeEmployees > 0 ? totalMonthlySalary / activeEmployees : 0;

  const addSalary = async (newSalary: Omit<Salary, 'id'>) => {
    try {
      await addDoc(salariesCollection, newSalary);
      toast({
        title: 'Employee Added',
        description: `New employee "${newSalary.name}" has been added to the payroll.`,
      });
    } catch(error) {
      console.error("Error adding salary:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not add the employee salary.",
      });
    }
  }

  return (
    <>
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Monthly Salary</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{currency} {totalMonthlySalary.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">For active employees</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{activeEmployees}</div>
                    <p className="text-xs text-muted-foreground">Currently on payroll</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalEmployees}</div>
                    <p className="text-xs text-muted-foreground">Includes active and inactive</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{currency} {averageSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <p className="text-xs text-muted-foreground">For active employees</p>
                </CardContent>
            </Card>
        </div>
        <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Salary Management</CardTitle>
                    <CardDescription>
                    Manage employee salaries and view monthly totals.
                    </CardDescription>
                </div>
                <Button size="sm" className="h-8 gap-1" onClick={() => setCreateDialogOpen(true)}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Add Employee
                    </span>
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Employee Name</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead className="text-right">Salary</TableHead>
                <TableHead>
                    <span className="sr-only">Actions</span>
                </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                   <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell>
                  </TableRow>
                ) : (
                  safeSalaries.map((salary) => (
                  <TableRow key={salary.id}>
                      <TableCell className="font-medium">{salary.name}</TableCell>
                      <TableCell>{salary.position}</TableCell>
                      <TableCell>
                        <Badge variant={salary.status === 'Active' ? 'secondary' : 'outline'}>
                          {salary.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(salary.paymentDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                      {currency} {salary.amount.toLocaleString()}
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
    <CreateSalaryDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={addSalary}
    />
    </>
  );
}
