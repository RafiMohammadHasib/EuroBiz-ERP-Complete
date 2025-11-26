
'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { MoreHorizontal, DollarSign, TrendingUp, Boxes, ChevronDown, PackageCheck } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from 'firebase/firestore';
import type { FinishedGood, RawMaterial } from '@/lib/data';
import { useSettings } from '@/context/settings-context';

export default function FinishedGoodsPage() {
  const firestore = useFirestore();
  const { currencySymbol } = useSettings();
  const finishedGoodsCollection = useMemoFirebase(() => collection(firestore, 'finishedGoods'), [firestore]);
  const rawMaterialsCollection = useMemoFirebase(() => collection(firestore, 'rawMaterials'), [firestore]);

  const { data: finishedGoods, isLoading: fgLoading } = useCollection<FinishedGood>(finishedGoodsCollection);
  const { data: rawMaterials, isLoading: rmLoading } = useCollection<RawMaterial>(rawMaterialsCollection);

  const safeFinishedGoods = finishedGoods || [];
  const safeRawMaterials = rawMaterials || [];

  const totalInventoryValue = safeFinishedGoods.reduce((acc, item) => acc + item.quantity * item.unitCost, 0);
  const potentialRevenue = safeFinishedGoods.reduce((acc, item) => acc + item.quantity * (item.sellingPrice ?? 0), 0);
  const productLines = safeFinishedGoods.length;
  const totalUnits = safeFinishedGoods.reduce((acc, item) => acc + item.quantity, 0);

  const isLoading = fgLoading || rmLoading;
  
  return (
    <div className="space-y-6">
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
          <CardTitle>Finished Goods Inventory</CardTitle>
          <CardDescription>
            Manage your inventory of finished products. Click a row to see its formula.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Selling Price</TableHead>
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
                safeFinishedGoods.map((item) => (
                  <Collapsible key={item.id} asChild>
                    <React.Fragment>
                      <TableRow className="cursor-pointer">
                        <TableCell>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-9 p-0 data-[state=open]:-rotate-180">
                              <ChevronDown className="h-4 w-4" />
                              <span className="sr-only">Toggle</span>
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                        <TableCell className="font-medium">{item.productName}</TableCell>
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
                              <DropdownMenuItem>Edit Selling Price</DropdownMenuItem>
                              <DropdownMenuItem>View History</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      <CollapsibleContent asChild>
                        <tr className="bg-muted/50">
                          <td colSpan={6} className="p-0">
                            <div className="p-4 pl-16">
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
                          </td>
                        </tr>
                      </CollapsibleContent>
                    </React.Fragment>
                  </Collapsible>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
