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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { rawMaterials as initialRawMaterials, type RawMaterial } from "@/lib/data"
import { DollarSign, List, PackageCheck, Archive, PlusCircle, Download } from "lucide-react"
import { CreateRawMaterialDialog } from "@/components/raw-materials/create-raw-material-dialog";

export default function RawMaterialsPage() {
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>(initialRawMaterials);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

  const totalInventoryValue = rawMaterials.reduce((acc, item) => acc + item.quantity * item.unitCost, 0);
  const materialTypes = rawMaterials.length;
  const totalUnits = rawMaterials.reduce((acc, item) => acc + item.quantity, 0);
  const mostStocked = rawMaterials.length > 0 ? rawMaterials.reduce((prev, current) => (prev.quantity > current.quantity) ? prev : current) : null;

  const addRawMaterial = (newMaterial: Omit<RawMaterial, 'id' | 'quantity' | 'unitCost'>) => {
    const materialWithId: RawMaterial = {
        ...newMaterial,
        id: `RM-${String(rawMaterials.length + 1).padStart(3, '0')}`,
        quantity: 0, // Start with 0 quantity
        unitCost: 0, // Unit cost will be determined by purchase orders
    };
    setRawMaterials(prev => [materialWithId, ...prev]);
  }

  const handleExport = () => {
    const headers = ["ID", "Name", "Category", "Quantity", "Unit", "Unit Cost"];
    const csvRows = [
      headers.join(','),
      ...rawMaterials.map(material => 
        [
          material.id,
          `"${material.name.replace(/"/g, '""')}"`,
          material.category,
          material.quantity,
          material.unit,
          material.unitCost
        ].join(',')
      )
    ];
    
    const csvString = csvRows.join('\\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'raw_materials.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <>
    <div className="space-y-6">
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">BDT {totalInventoryValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Based on unit cost</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Material Types</CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{materialTypes}</div>
            <p className="text-xs text-muted-foreground">Unique raw materials</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units in Stock</CardTitle>
            <PackageCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUnits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Sum of all material quantities</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Stocked Material</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mostStocked?.name || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
                {mostStocked ? `${mostStocked.quantity.toLocaleString()} ${mostStocked.unit} in stock` : 'No materials found'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Raw Materials Inventory</CardTitle>
              <CardDescription>
                Manage your inventory of raw materials.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleExport}>
                  <Download className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Export to Excel
                  </span>
              </Button>
              <Button size="sm" className="h-8 gap-1" onClick={() => setCreateDialogOpen(true)}>
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Add Raw Material
                  </span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rawMaterials.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="text-right">{item.quantity.toLocaleString()} {item.unit}</TableCell>
                  <TableCell className="text-right">BDT {item.unitCost.toFixed(2)}</TableCell>
                  <TableCell className="text-right">BDT {(item.quantity * item.unitCost).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    <CreateRawMaterialDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={addRawMaterial}
    />
    </>
  );
}
