
'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MoreHorizontal, DollarSign, TrendingUp, Boxes, ChevronDown, PackageCheck, ArrowUpDown, Search } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc, updateDoc } from 'firebase/firestore';
import type { FinishedGood, RawMaterial } from '@/lib/data';
import { useSettings } from '@/context/settings-context';
import { cn } from '@/lib/utils';
import { EditSellingPriceDialog } from '@/components/finished-goods/edit-selling-price-dialog';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

type SortKey = keyof FinishedGood;

export default function FinishedGoodsPage() {
  const firestore = useFirestore();
  const { currencySymbol } = useSettings();
  const { toast } = useToast();
  const finishedGoodsCollection = useMemoFirebase(() => collection(firestore, 'finishedGoods'), [firestore]);
  const rawMaterialsCollection = useMemoFirebase(() => collection(firestore, 'rawMaterials'), [firestore]);

  const { data: finishedGoods, isLoading: fgLoading } = useCollection<FinishedGood>(finishedGoodsCollection);
  const { data: rawMaterials, isLoading: rmLoading } = useCollection<RawMaterial>(rawMaterialsCollection);
  
  const [itemToEdit, setItemToEdit] = useState<FinishedGood | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const safeFinishedGoods = finishedGoods || [];
  const safeRawMaterials = rawMaterials || [];
  
  const filteredAndSortedFinishedGoods = useMemo(() => {
    let sortableItems = [...safeFinishedGoods];
    if(searchTerm) {
        sortableItems = sortableItems.filter(item => 
            item.productName.toLowerCase().includes(searchTerm.toLowerCase())
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
}, [safeFinishedGoods, sortConfig, searchTerm]);

  const paginatedFinishedGoods = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredAndSortedFinishedGoods.slice(startIndex, endIndex);
  }, [filteredAndSortedFinishedGoods, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedFinishedGoods.length / rowsPerPage);

  const totalInventoryValue = filteredAndSortedFinishedGoods.reduce((acc, item) => acc + item.quantity * item.unitCost, 0);
  const potentialRevenue = filteredAndSortedFinishedGoods.reduce((acc, item) => acc + item.quantity * (item.sellingPrice ?? 0), 0);
  const productLines = filteredAndSortedFinishedGoods.length;
  const totalUnits = filteredAndSortedFinishedGoods.reduce((acc, item) => acc + item.quantity, 0);

  const isLoading = fgLoading || rmLoading;

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleUpdateSellingPrice = async (productId: string, newPrice: number) => {
    if (!firestore) return;
    try {
      const productRef = doc(firestore, 'finishedGoods', productId);
      await updateDoc(productRef, { sellingPrice: newPrice });
      toast({
        title: 'Selling Price Updated',
        description: `The price has been updated to ${currencySymbol}${newPrice.toFixed(2)}.`,
      });
      setItemToEdit(null); // Close the dialog
    } catch (error) {
      console.error('Error updating selling price:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not update the selling price.',
      });
    }
  };
  
  return (
    <>
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Finished Goods</CardTitle>
                <CardDescription>
                Manage your inventory of finished products.
                </CardDescription>
            </CardHeader>
        </Card>
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencySymbol}{totalInventoryValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Based on unit cost</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencySymbol}{potentialRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Based on selling price</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Product Lines</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productLines}</div>
            <p className="text-xs text-muted-foreground">Number of unique products</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units in Stock</CardTitle>
            <PackageCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUnits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Sum of all product quantities</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Finished Goods Inventory
            </h2>
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search by product name..."
                    className="pl-8 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => requestSort('productName')}>
                  <div className="flex items-center gap-2 cursor-pointer">Product Name <ArrowUpDown className="h-4 w-4" /></div>
                </TableHead>
                <TableHead className="text-right" onClick={() => requestSort('quantity')}>
                  <div className="flex items-center justify-end gap-2 cursor-pointer">Quantity <ArrowUpDown className="h-4 w-4" /></div>
                </TableHead>
                <TableHead className="text-right" onClick={() => requestSort('unitCost')}>
                  <div className="flex items-center justify-end gap-2 cursor-pointer">Unit Cost <ArrowUpDown className="h-4 w-4" /></div>
                </TableHead>
                <TableHead className="text-right" onClick={() => requestSort('sellingPrice')}>
                  <div className="flex items-center justify-end gap-2 cursor-pointer">Selling Price <ArrowUpDown className="h-4 w-4" /></div>
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
                paginatedFinishedGoods.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <Collapsible>
                        <div className='flex items-center gap-2'>
                          <CollapsibleTrigger asChild>
                             <Button variant="ghost" size="sm" className="w-9 p-0 data-[state=open]:-rotate-180">
                              <ChevronDown className="h-4 w-4" />
                              <span className="sr-only">Toggle</span>
                            </Button>
                          </CollapsibleTrigger>
                          <div>
                            <span>{item.productName}</span>
                            {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                          </div>
                        </div>
                        <CollapsibleContent>
                           <div className="p-4 pl-12 bg-muted/50 rounded-md mt-2">
                              <h4 className="font-semibold text-sm mb-2">Production Formula:</h4>
                              {item.components && item.components.length > 0 ? (
                                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                                  {item.components.map(comp => {
                                    const material = safeRawMaterials.find(rm => rm.id === comp.materialId);
                                    return material ? (
                                      <li key={comp.materialId}>
                                        {material.name}: {comp.quantity} {material.unit}
                                      </li>
                                    ) : null;
                                  })}
                                </ul>
                              ) : (
                                <p className="text-sm text-muted-foreground">No formula defined for this product.</p>
                              )}
                            </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </TableCell>
                    <TableCell className="text-right">{item.quantity.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{currencySymbol}{item.unitCost.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      {item.sellingPrice ? `${currencySymbol}${item.sellingPrice.toFixed(2)}` : <span className="text-muted-foreground">Not set</span>}
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
                          <DropdownMenuItem onClick={() => setItemToEdit(item)}>Edit Selling Price</DropdownMenuItem>
                          <DropdownMenuItem>View History</DropdownMenuItem>
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
                    Showing <strong>{paginatedFinishedGoods.length}</strong> of <strong>{filteredAndSortedFinishedGoods.length}</strong> products
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
    {itemToEdit && (
        <EditSellingPriceDialog
            isOpen={!!itemToEdit}
            onOpenChange={(open) => !open && setItemToEdit(null)}
            product={itemToEdit}
            onUpdate={handleUpdateSellingPrice}
        />
    )}
    </>
  );
}
