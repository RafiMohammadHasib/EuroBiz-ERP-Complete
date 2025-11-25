
'use client';

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, MoreHorizontal, Users, Truck, DollarSign, TrendingUp, Award } from "lucide-react"
import { type Distributor } from "@/lib/data"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CreateDistributorDialog } from "@/components/distributors/create-distributor-dialog";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/context/settings-context";

export default function DistributorsPage() {
    const firestore = useFirestore();
    const { currency } = useSettings();
    const distributorsCollection = useMemoFirebase(() => collection(firestore, 'distributors'), [firestore]);
    const { data: distributors, isLoading } = useCollection<Distributor>(distributorsCollection);
    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
    const { toast } = useToast();

    const safeDistributors = distributors || [];

    const totalDistributors = safeDistributors.length;
    const totalSales = safeDistributors.reduce((acc, dist) => acc + dist.totalSales, 0);
    const averageSales = totalDistributors > 0 ? totalSales / totalDistributors : 0;
    const topDistributor = safeDistributors.length > 0 ? safeDistributors.reduce((prev, current) => (prev.totalSales > current.totalSales) ? prev : current) : null;

    const addDistributor = async (newDistributor: Omit<Distributor, 'id'>) => {
      try {
        await addDoc(distributorsCollection, newDistributor);
        toast({
          title: 'Distributor Added',
          description: `New distributor "${newDistributor.name}" has been added.`,
        });
      } catch (error) {
        console.error("Error adding distributor: ", error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not add the distributor.',
        });
      }
    }

  return (
    <>
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Distributors</CardTitle>
                    <Truck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalDistributors}</div>
                    <p className="text-xs text-muted-foreground">Active distributors</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Distributor Sales</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{currency} {totalSales.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">From all distributors</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Sales</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{currency} {averageSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    <p className="text-xs text-muted-foreground">Per distributor</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{topDistributor?.name || 'N/A'}</div>
                    <p className="text-xs text-muted-foreground">
                        {topDistributor ? `${currency} ${topDistributor.totalSales.toLocaleString()} in sales` : 'No distributors found'}
                    </p>
                </CardContent>
            </Card>
        </div>
        <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Distributors</CardTitle>
                    <CardDescription>
                    Manage your sales distributors.
                    </CardDescription>
                </div>
                <Button size="sm" className="h-8 gap-1" onClick={() => setCreateDialogOpen(true)}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Add Distributor
                    </span>
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Distributor Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead className="text-right">Total Sales</TableHead>
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
                      safeDistributors.map((dist) => (
                        <TableRow key={dist.id}>
                            <TableCell className="font-medium">{dist.name}</TableCell>
                            <TableCell>{dist.location}</TableCell>
                            <TableCell>{dist.tier}</TableCell>
                            <TableCell className="text-right">{currency} {dist.totalSales.toLocaleString()}</TableCell>
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
    <CreateDistributorDialog 
        isOpen={isCreateDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={addDistributor}
    />
    </>
  );
}
