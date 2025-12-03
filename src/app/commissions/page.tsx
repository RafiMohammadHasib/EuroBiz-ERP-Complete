
'use client';

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { PlusCircle, MoreHorizontal, Percent, BarChart, ArrowUpDown, Search } from "lucide-react"
import { type Commission, type FinishedGood, type Distributor } from "@/lib/data"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CreateCommissionRuleDialog } from "@/components/commissions/create-commission-rule-dialog";
import { EditCommissionRuleDialog } from "@/components/commissions/edit-commission-rule-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/context/settings-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type SortKey = keyof Commission;

export default function CommissionsPage() {
    const firestore = useFirestore();
    const { currencySymbol } = useSettings();
    const commissionsCollection = useMemoFirebase(() => collection(firestore, 'commissions'), [firestore]);
    const finishedGoodsCollection = useMemoFirebase(() => collection(firestore, 'finishedGoods'), [firestore]);
    const distributorsCollection = useMemoFirebase(() => collection(firestore, 'distributors'), [firestore]);

    const { data: commissions, isLoading: commissionsLoading } = useCollection<Commission>(commissionsCollection);
    const { data: finishedGoods, isLoading: fgLoading } = useCollection<FinishedGood>(finishedGoodsCollection);
    const { data: distributors, isLoading: distLoading } = useCollection<Distributor>(distributorsCollection);

    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
    const [ruleToEdit, setRuleToEdit] = useState<Commission | null>(null);
    const [ruleToDelete, setRuleToDelete] = useState<Commission | null>(null);
    const { toast } = useToast();
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const safeCommissions = commissions || [];
    const isLoading = commissionsLoading || fgLoading || distLoading;

    const filteredAndSortedCommissions = useMemo(() => {
        let sortableItems = [...safeCommissions];
        
        if (searchTerm) {
            sortableItems = sortableItems.filter(commission =>
                commission.ruleName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [safeCommissions, sortConfig, searchTerm]);
    
    const paginatedCommissions = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return filteredAndSortedCommissions.slice(startIndex, endIndex);
    }, [filteredAndSortedCommissions, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(filteredAndSortedCommissions.length / rowsPerPage);

    const totalCommissionValue = filteredAndSortedCommissions.reduce((acc, commission) => {
        if (commission.type === 'Percentage') {
            // This is an estimation. A real calculation would need sales data.
            return acc + (10000 * (commission.rate / 100)); 
        }
        return acc + commission.rate;
    }, 0);

    const averageCommissionRate = filteredAndSortedCommissions.filter(c => c.type === 'Percentage').reduce((acc, c, _, arr) => arr.length > 0 ? acc + c.rate / arr.length : 0, 0);

    const requestSort = (key: SortKey) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };


    const addCommissionRule = async (newRule: Omit<Commission, 'id'>) => {
      if (!commissionsCollection) return;
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

    const updateCommissionRule = async (updatedRule: Commission) => {
      if (!firestore) return;
      try {
        const ruleRef = doc(firestore, 'commissions', updatedRule.id);
        await updateDoc(ruleRef, {
            ruleName: updatedRule.ruleName,
            appliesTo: updatedRule.appliesTo,
            type: updatedRule.type,
            rate: updatedRule.rate
        });
        toast({
          title: 'Commission Rule Updated',
          description: `The rule "${updatedRule.ruleName}" has been updated.`,
        });
        setRuleToEdit(null);
      } catch (error) {
        console.error("Error updating commission rule:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not update the commission rule.",
        });
      }
    };
    
    const deleteCommissionRule = async () => {
        if (!ruleToDelete || !firestore) return;
        try {
            const ruleRef = doc(firestore, 'commissions', ruleToDelete.id);
            await deleteDoc(ruleRef);
            toast({
                title: 'Commission Rule Deleted',
                description: `The rule "${ruleToDelete.ruleName}" has been deleted.`,
            });
            setRuleToDelete(null);
        } catch (error) {
            console.error("Error deleting commission rule:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not delete the commission rule.',
            });
        }
    };

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
                 <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by rule name..."
                            className="pl-8 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button size="sm" className="h-9 gap-1" onClick={() => setCreateDialogOpen(true)}>
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Add Rule
                        </span>
                    </Button>
                 </div>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                    <TableHead onClick={() => requestSort('ruleName')}>
                        <div className="flex items-center gap-2 cursor-pointer">
                            Rule Name <ArrowUpDown className="h-4 w-4" />
                        </div>
                    </TableHead>
                    <TableHead onClick={() => requestSort('appliesTo')}>
                        <div className="flex items-center gap-2 cursor-pointer">
                            Applies To <ArrowUpDown className="h-4 w-4" />
                        </div>
                    </TableHead>
                    <TableHead onClick={() => requestSort('type')}>
                        <div className="flex items-center gap-2 cursor-pointer">
                            Type <ArrowUpDown className="h-4 w-4" />
                        </div>
                    </TableHead>
                    <TableHead className="text-right" onClick={() => requestSort('rate')}>
                         <div className="flex items-center justify-end gap-2 cursor-pointer">
                            Rate <ArrowUpDown className="h-4 w-4" />
                        </div>
                    </TableHead>
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
                  paginatedCommissions.map((commission) => (
                  <TableRow key={commission.id}>
                      <TableCell className="font-medium">{commission.ruleName}</TableCell>
                      <TableCell>{Array.isArray(commission.appliesTo) ? commission.appliesTo.join(', ') : commission.appliesTo}</TableCell>
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
                          <DropdownMenuItem onClick={() => setRuleToEdit(commission)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setRuleToDelete(commission)}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>
                      </TableCell>
                  </TableRow>
                  ))
                )}
            </TableBody>
            </Table>
        </CardContent>
         <CardFooter className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                    Showing <strong>{paginatedCommissions.length}</strong> of <strong>{filteredAndSortedCommissions.length}</strong> rules
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                         <p className="text-xs font-medium">Rows per page</p>
                         <Select
                            value={`${rowsPerPage}`}
                            onValueChange={(value) => {
                            setRowsPerPage(Number(value));
                            setCurrentPage(1);
                            }}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={rowsPerPage} />
                            </SelectTrigger>
                            <SelectContent side="top">
                            {[10, 20, 30, 40, 50].map((pageSize) => (
                                <SelectItem key={pageSize} value={`${pageSize}`}>
                                {pageSize}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="text-xs font-medium">
                        Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </CardFooter>
        </Card>
    </div>
    <CreateCommissionRuleDialog 
        isOpen={isCreateDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={addCommissionRule}
        products={finishedGoods || []}
        distributors={distributors || []}
    />
    {ruleToEdit && (
        <EditCommissionRuleDialog
            isOpen={!!ruleToEdit}
            onOpenChange={(open) => !open && setRuleToEdit(null)}
            onUpdate={updateCommissionRule}
            products={finishedGoods || []}
            distributors={distributors || []}
            commission={ruleToEdit}
        />
    )}
    <AlertDialog open={!!ruleToDelete} onOpenChange={(open) => !open && setRuleToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the rule "{ruleToDelete?.ruleName}".
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteCommissionRule} className="bg-destructive hover:bg-destructive/90">
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
