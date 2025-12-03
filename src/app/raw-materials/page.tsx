
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
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { type RawMaterial } from "@/lib/data"
import { DollarSign, List, PackageCheck, Archive, PlusCircle, Download, ArrowUpDown, Search } from "lucide-react"
import { CreateRawMaterialDialog } from "@/components/raw-materials/create-raw-material-dialog";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/context/settings-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type SortKey = keyof RawMaterial;

export default function RawMaterialsPage() {
  const firestore = useFirestore();
  const { currencySymbol } = useSettings();
  
  const rawMaterialsQuery = useMemoFirebase(() => 
    query(collection(firestore, 'rawMaterials'), orderBy('createdAt', 'desc')), 
    [firestore]
  );
  const { data: rawMaterials, isLoading } = useCollection<RawMaterial>(rawMaterialsQuery);
  
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const safeRawMaterials = rawMaterials || [];

  const filteredAndSortedRawMaterials = useMemo(() => {
    let sortableItems = [...safeRawMaterials];

    if (searchTerm) {
        sortableItems = sortableItems.filter(material =>
            material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            material.category.toLowerCase().includes(searchTerm.toLowerCase())
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
}, [safeRawMaterials, sortConfig, searchTerm]);

  const paginatedRawMaterials = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredAndSortedRawMaterials.slice(startIndex, endIndex);
  }, [filteredAndSortedRawMaterials, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedRawMaterials.length / rowsPerPage);

  const totalInventoryValue = filteredAndSortedRawMaterials.reduce((acc, item) => acc + item.quantity * item.unitCost, 0);
  const materialTypes = filteredAndSortedRawMaterials.length;
  const totalUnits = filteredAndSortedRawMaterials.reduce((acc, item) => acc + item.quantity, 0);
  const mostStocked = filteredAndSortedRawMaterials.length > 0 ? filteredAndSortedRawMaterials.reduce((prev, current) => (prev.quantity > current.quantity) ? prev : current) : null;
  
  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const addRawMaterial = async (newMaterial: Omit<RawMaterial, 'id' | 'createdAt'>) => {
    try {
      const materialWithTimestamp = {
        ...newMaterial,
        createdAt: serverTimestamp(),
      }
      await addDoc(collection(firestore, 'rawMaterials'), materialWithTimestamp);
       toast({
        title: 'Raw Material Added',
        description: `New material "${newMaterial.name}" has been added to inventory.`,
      });
    } catch(error) {
      console.error("Error adding raw material:", error);
      toast({
        variant: "destructive",
        title: 'Error',
        description: 'Could not add the new raw material.'
      })
    }
  }

  const handleExport = () => {
    const headers = ["ID", "Name", "Category", "Quantity", "Unit", "Unit Cost"];
    const csvRows = [
      headers.join(','),
      ...filteredAndSortedRawMaterials.map(material => 
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
        <Card>
            <CardHeader>
                <CardTitle>Raw Materials</CardTitle>
                <CardDescription>
                Manage your inventory of raw materials.
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
            <h2 className="text-lg font-semibold">Raw Materials Inventory</h2>
            <div className="flex items-center gap-2">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by name or category..."
                        className="pl-8 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
              <Button size="sm" variant="outline" className="h-9 gap-1" onClick={handleExport}>
                  <Download className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Export
                  </span>
              </Button>
              <Button size="sm" className="h-9 gap-1" onClick={() => setCreateDialogOpen(true)}>
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Add Material
                  </span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => requestSort('name')}>
                    <div className="flex items-center gap-2 cursor-pointer">Material Name <ArrowUpDown className="h-4 w-4" /></div>
                </TableHead>
                <TableHead onClick={() => requestSort('category')}>
                    <div className="flex items-center gap-2 cursor-pointer">Category <ArrowUpDown className="h-4 w-4" /></div>
                </TableHead>
                <TableHead className="text-right" onClick={() => requestSort('quantity')}>
                    <div className="flex items-center justify-end gap-2 cursor-pointer">Quantity <ArrowUpDown className="h-4 w-4" /></div>
                </TableHead>
                <TableHead className="text-right" onClick={() => requestSort('unitCost')}>
                     <div className="flex items-center justify-end gap-2 cursor-pointer">Unit Cost <ArrowUpDown className="h-4 w-4" /></div>
                </TableHead>
                <TableHead className="text-right">Total Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell>
                </TableRow>
              ) : (
                paginatedRawMaterials.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="text-right">{item.quantity.toLocaleString()} {item.unit}</TableCell>
                    <TableCell className="text-right">{currencySymbol}{item.unitCost.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{currencySymbol}{(item.quantity * item.unitCost).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                    Showing <strong>{paginatedRawMaterials.length}</strong> of <strong>{filteredAndSortedRawMaterials.length}</strong> materials
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
    <CreateRawMaterialDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={addRawMaterial}
    />
    </>
  );
}
