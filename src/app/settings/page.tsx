
'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useAuth, useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Copy, Check, Download, Upload, Loader2 } from 'lucide-react';
import { collection, doc, setDoc, addDoc } from 'firebase/firestore';
import type { Commission, FinishedGood, RawMaterial, Distributor, PurchaseOrder, SalesCommission, Supplier, Salesperson } from '@/lib/data';
import { CreateCommissionRuleDialog } from '@/components/commissions/create-commission-rule-dialog';
import { CreateFormulaDialog } from '@/components/settings/create-formula-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '@/context/settings-context';
import { companyDetails as initialCompanyDetails } from '@/lib/data';
import { Textarea } from '@/components/ui/textarea';
import { LogoUploader } from '@/components/settings/logo-uploader';
import { ScrollArea } from '@/components/ui/scroll-area';


type ProfileSettings = {
    displayName: string;
};

type BusinessSettings = {
    name: string;
    address: string;
    email: string;
    phone: string;
    logoUrl: string;
};

type ForeignKey = {
  column: string;
  referencesTable: string;
  referencesColumn: string;
};

export default function SettingsPage() {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { currencySymbol, businessSettings, setBusinessSettings } = useSettings();

  // --- Profile State ---
  const salespersonDocRef = useMemoFirebase(() => user ? doc(firestore, 'salespeople', user.uid) : null, [user, firestore]);
  const { data: salespersonData, isLoading: salespersonLoading } = useDoc<Salesperson>(salespersonDocRef);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // --- Firestore References ---
  const businessSettingsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'business') : null, [firestore]);
  
  const commissionsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'commissions') : null, [firestore]);
  const finishedGoodsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'finishedGoods') : null, [firestore]);
  const rawMaterialsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'rawMaterials') : null, [firestore]);
  const distributorsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'distributors') : null, [firestore]);
  const purchaseOrdersCollection = useMemoFirebase(() => firestore ? collection(firestore, 'purchaseOrders') : null, [firestore]);
  const salesCommissionsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'sales_commissions') : null, [firestore]);
  const suppliersCollection = useMemoFirebase(() => firestore ? collection(firestore, 'suppliers') : null, [firestore]);

  
  // --- Data Hooks ---
  const { data: commissions, isLoading: commissionsLoading } = useCollection<Commission>(commissionsCollection);
  const { data: finishedGoods, isLoading: fgLoading } = useCollection<FinishedGood>(finishedGoodsCollection);
  const { data: rawMaterials, isLoading: rmLoading } = useCollection<RawMaterial>(rawMaterialsCollection);
  const { data: distributors, isLoading: distLoading } = useCollection<Distributor>(distributorsCollection);
  const { data: purchaseOrders, isLoading: poLoading } = useCollection<PurchaseOrder>(purchaseOrdersCollection);
  const { data: salesCommissions, isLoading: scLoading } = useCollection<SalesCommission>(salesCommissionsCollection);
  const { data: suppliers, isLoading: suppliersLoading } = useCollection<Supplier>(suppliersCollection);


  // --- Component State ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);

  const [isCommissionRuleDialogOpen, setCommissionRuleDialogOpen] = useState(false);
  const [isFormulaDialogOpen, setFormulaDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Pagination state for formulas
  const [formulasCurrentPage, setFormulasCurrentPage] = useState(1);
  const [formulasRowsPerPage, setFormulasRowsPerPage] = useState(5);

  const safeFinishedGoods = finishedGoods || [];
  
  const paginatedFormulas = useMemo(() => {
    const startIndex = (formulasCurrentPage - 1) * formulasRowsPerPage;
    const endIndex = startIndex + formulasRowsPerPage;
    return safeFinishedGoods.slice(startIndex, endIndex);
  }, [safeFinishedGoods, formulasCurrentPage, formulasRowsPerPage]);

  const totalPagesFormulas = Math.ceil(safeFinishedGoods.length / formulasRowsPerPage);

  // Pagination state for commissions
  const [commissionsCurrentPage, setCommissionsCurrentPage] = useState(1);
  const [commissionsRowsPerPage, setCommissionsRowsPerPage] = useState(5);

  const safeCommissions = commissions || [];

  const paginatedCommissions = useMemo(() => {
    const startIndex = (commissionsCurrentPage - 1) * commissionsRowsPerPage;
    const endIndex = startIndex + commissionsRowsPerPage;
    return safeCommissions.slice(startIndex, endIndex);
  }, [safeCommissions, commissionsCurrentPage, commissionsRowsPerPage]);

  const totalPagesCommissions = Math.ceil(safeCommissions.length / commissionsRowsPerPage);


  // --- Handlers ---
  const handleProfileSave = async () => {
    if (!user || !salespersonDocRef) return;
    
    setIsSavingProfile(true);
    try {
      // Since name fields are removed, we just show a success message or save other potential fields.
      // For now, we don't have other fields to save.
      toast({ title: 'Profile Saved', description: 'Your profile information is up to date.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error saving profile', description: error.message });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!user || !auth?.currentUser) return;
    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Passwords do not match' });
      return;
    }
    if (!currentPassword || !newPassword) {
        toast({ variant: 'destructive', title: 'All password fields are required' });
        return;
    }

    setIsSavingPassword(true);
    try {
      if(!auth.currentUser.email) throw new Error("No email found for current user.");
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      toast({
        title: 'Password Updated',
        description: 'Your password has been changed successfully.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error updating password', description: error.code === 'auth/wrong-password' ? 'The current password you entered is incorrect.' : error.message });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleBusinessSave = async () => {
    if (!businessSettingsDocRef) return;
    setIsSavingBusiness(true);
    try {
        await setDoc(businessSettingsDocRef, businessSettings, { merge: true });
        toast({ title: 'Business Details Updated', description: 'Your new business details have been saved.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error Saving Details', description: error.message });
    } finally {
        setIsSavingBusiness(false);
    }
  };

    const handleBusinessDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setBusinessSettings(prev => ({ ...prev, [id]: value }));
    }

  const addCommissionRule = async (newRule: Omit<Commission, 'id'>) => {
     if (!commissionsCollection) return;
    try {
      await addDoc(commissionsCollection, newRule);
      toast({
        title: 'Commission Rule Added',
        description: `New rule "${newRule.ruleName}" has been added.`,
      });
    } catch (error) {
      console.error("Error adding commission rule:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not create the commission rule.",
      });
    }
  };

  const addFormula = async (newFormula: Omit<FinishedGood, 'id'>) => {
    if (!finishedGoodsCollection) return;
    try {
        const formulaWithCost = {
          ...newFormula,
          unitCost: newFormula.components.reduce((acc, comp) => {
            const material = rawMaterials?.find(rm => rm.id === comp.materialId);
            return acc + (material ? material.unitCost * comp.quantity : 0);
          }, 0)
        };
        await addDoc(finishedGoodsCollection, formulaWithCost);
        toast({
            title: 'Production Formula Created',
            description: `New formula for "${newFormula.productName}" has been added.`,
        });
    } catch (error) {
        console.error("Error adding formula:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not create the production formula.",
        });
    }
  };
  
    // --- Data Backup Logic ---
    const generateSqlForTable = (tableName: string, data: any[], foreignKeys: ForeignKey[] = []): string => {
        if (!data || !data.length) return `-- No data for table: ${tableName}\n`;

        const firstItem = data[0];
        const columns = Object.keys(firstItem);
        
        let createTableStatement = `CREATE TABLE IF NOT EXISTS "${tableName}" (\n`;

        columns.forEach((column) => {
        const value = firstItem[column];
        let sqlType: string;

        const fk = foreignKeys.find(fk => fk.column === column);

        if (column.endsWith('_id') || column === 'id' || fk) {
            sqlType = 'VARCHAR(255)';
            if(column === 'id') {
                sqlType += ' PRIMARY KEY NOT NULL';
            }
        } else {
            switch (typeof value) {
                case 'number':
                    sqlType = Number.isInteger(value) ? 'INTEGER' : 'DECIMAL(10, 2)';
                    break;
                case 'string':
                    if (column.toLowerCase().includes('date')) {
                        sqlType = 'DATE';
                    } else if (value.length > 255 || column.toLowerCase().includes('description')) {
                        sqlType = 'TEXT';
                    } else {
                        sqlType = 'VARCHAR(255)';
                    }
                    break;
                case 'boolean':
                    sqlType = 'BOOLEAN';
                    break;
                case 'object':
                    if (value && 'seconds' in value && 'nanoseconds' in value) {
                       sqlType = 'TIMESTAMP'; // Firestore timestamp
                    } else {
                       sqlType = 'TEXT'; // JSON string for other objects/arrays
                    }
                    break;
                default:
                    sqlType = 'TEXT'; // For arrays, objects, etc.
            }
            if(!column.endsWith('description')) {
                sqlType += ' NOT NULL';
            }
        }
        
        createTableStatement += `  "${column}" ${sqlType},\n`;
        });

        foreignKeys.forEach(fk => {
            createTableStatement += `  FOREIGN KEY ("${fk.column}") REFERENCES "${fk.referencesTable}"("${fk.referencesColumn}"),\n`;
        });

        if(createTableStatement.trim().endsWith(',')) {
            createTableStatement = createTableStatement.trim().slice(0, -1);
        }
        
        createTableStatement += '\n);\n\n';

        let insertStatements = `INSERT INTO "${tableName}" ("${columns.join('", "')}") VALUES\n`;
        data.forEach((item, itemIndex) => {
        const values = columns.map(column => {
            let value = item[column];
            if (value === null || value === undefined) {
                return 'NULL';
            }
            if (Array.isArray(value) || (value !== null && typeof value === 'object')) {
                if (value && 'seconds' in value && 'nanoseconds' in value) {
                     return `'${new Date(value.seconds * 1000).toISOString()}'`;
                }
                value = JSON.stringify(value).replace(/'/g, "''");
                return `'${value}'`;
            }
            if (typeof value === 'string') {
            return `'${value.replace(/'/g, "''")}'`;
            }
            return value;
        });
        insertStatements += `  (${values.join(', ')})${itemIndex === data.length - 1 ? ';' : ','}\n`;
        });

        return createTableStatement + insertStatements;
    };
  
    const allSql = useMemo(() => [
        generateSqlForTable('suppliers', suppliers || []),
        generateSqlForTable('distributors', distributors || []),
        generateSqlForTable('raw_materials', rawMaterials || []),
        generateSqlForTable('finished_goods', finishedGoods || []),
        generateSqlForTable('purchase_orders', purchaseOrders || []),
        generateSqlForTable('commissions', commissions || []),
        generateSqlForTable('sales_commissions', salesCommissions || []),
    ].join('\n\n'), [suppliers, distributors, rawMaterials, finishedGoods, purchaseOrders, commissions, salesCommissions]);


    const handleCopy = () => {
        navigator.clipboard.writeText(allSql);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    
    const handleDownload = () => {
        const blob = new Blob([allSql], { type: 'application/sql' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data_backup.sql';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };


  return (
    <>
      <div className="space-y-6">
         <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account, business rules, and system preferences.
            </p>
        </div>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="business">Business</TabsTrigger>
              <TabsTrigger value="backup">Data Backup</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                      <CardHeader>
                          <CardTitle>User Profile</CardTitle>
                          <CardDescription>This information will appear on sales records.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                          <div className="space-y-2">
                              <Label htmlFor="email">Email Address</Label>
                              <Input id="email" type="email" value={user?.email || ''} disabled />
                          </div>
                          
                      </CardContent>
                      <CardFooter>
                          <Button onClick={handleProfileSave} disabled={isSavingProfile || salespersonLoading}>
                              {isSavingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                              {isSavingProfile ? 'Saving...' : 'Save Profile'}
                          </Button>
                      </CardFooter>
                  </Card>
                  <Card>
                      <CardHeader>
                          <CardTitle>Change Password</CardTitle>
                          <CardDescription>For security, you must provide your current password.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                          <div className="space-y-2">
                              <Label htmlFor="currentPassword">Current Password</Label>
                              <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="newPassword">New Password</Label>
                              <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                          </div>
                           <div className="space-y-2">
                              <Label htmlFor="confirmPassword">Confirm New Password</Label>
                              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                          </div>
                      </CardContent>
                      <CardFooter>
                          <Button onClick={handlePasswordUpdate} disabled={isSavingPassword}>
                              {isSavingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Update Password'}
                          </Button>
                      </CardFooter>
                  </Card>
              </div>
          </TabsContent>

          <TabsContent value="system" className="mt-6 space-y-6">
            <Card>
                <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Production Formulas</CardTitle>
                            <CardDescription>Define recipes for your manufactured products.</CardDescription>
                        </div>
                        <Button size="sm" className="h-8 gap-1" onClick={() => setFormulaDialogOpen(true)}>
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Formula</span>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                   <div className="space-y-4">
                        {fgLoading ? <p>Loading formulas...</p> : paginatedFormulas.map(fg => (
                            <Card key={fg.id} className="bg-muted/50">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg">{fg.productName}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <h4 className="font-semibold text-sm mb-2">Components:</h4>
                                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                                        {fg.components.map(comp => {
                                            const material = rawMaterials?.find(rm => rm.id === comp.materialId);
                                            return material ? (
                                                <li key={comp.materialId}>
                                                    {material.name}: {comp.quantity} {material.unit}
                                                </li>
                                            ) : null;
                                        })}
                                    </ul>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                        Showing <strong>{paginatedFormulas.length}</strong> of <strong>{safeFinishedGoods.length}</strong> formulas
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <p className="text-xs font-medium">Rows per page</p>
                            <Select
                                value={`${formulasRowsPerPage}`}
                                onValueChange={(value) => {
                                    setFormulasRowsPerPage(Number(value));
                                    setFormulasCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={formulasRowsPerPage} />
                                </SelectTrigger>
                                <SelectContent side="top">
                                {[5, 10, 15].map((pageSize) => (
                                    <SelectItem key={pageSize} value={`${pageSize}`}>
                                    {pageSize}
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="text-xs font-medium">
                            Page {formulasCurrentPage} of {totalPagesFormulas}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFormulasCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={formulasCurrentPage === 1}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFormulasCurrentPage(prev => Math.min(prev + 1, totalPagesFormulas))}
                                disabled={formulasCurrentPage === totalPagesFormulas}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardFooter>
            </Card>
            
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Commission Rules</CardTitle>
                            <CardDescription>Set up rules for sales commissions.</CardDescription>
                        </div>
                        <Button size="sm" className="h-8 gap-1" onClick={() => setCommissionRuleDialogOpen(true)}>
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Rule</span>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {commissionsLoading ? <p>Loading rules...</p> : paginatedCommissions && paginatedCommissions.length > 0 ? (
                        <div className="space-y-4">
                            {paginatedCommissions.map(rule => (
                                <div key={rule.id} className="flex justify-between items-center rounded-lg border p-4">
                                    <div>
                                        <p className="font-semibold">{rule.ruleName}</p>
                                        <p className="text-sm text-muted-foreground">{Array.isArray(rule.appliesTo) ? rule.appliesTo.join(', ') : rule.appliesTo}</p>
                                    </div>
                                    <div className="font-semibold text-primary">
                                        {rule.type === 'Percentage' ? `${rule.rate}%` : `${currencySymbol}${rule.rate.toLocaleString()}`}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center border-2 border-dashed rounded-lg p-12">
                            <h3 className="text-xl font-semibold">No commission rules defined</h3>
                            <p className="text-muted-foreground mt-2">Add your first commission rule to get started.</p>
                        </div>
                    )}
                </CardContent>
                 <CardFooter className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                        Showing <strong>{paginatedCommissions.length}</strong> of <strong>{safeCommissions.length}</strong> rules
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <p className="text-xs font-medium">Rows per page</p>
                            <Select
                                value={`${commissionsRowsPerPage}`}
                                onValueChange={(value) => {
                                    setCommissionsRowsPerPage(Number(value));
                                    setCommissionsCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={commissionsRowsPerPage} />
                                </SelectTrigger>
                                <SelectContent side="top">
                                {[5, 10, 15].map((pageSize) => (
                                    <SelectItem key={pageSize} value={`${pageSize}`}>
                                    {pageSize}
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="text-xs font-medium">
                            Page {commissionsCurrentPage} of {totalPagesCommissions}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCommissionsCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={commissionsCurrentPage === 1}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCommissionsCurrentPage(prev => Math.min(prev + 1, totalPagesCommissions))}
                                disabled={commissionsCurrentPage === totalPagesCommissions}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="business" className="mt-6">
              <Card>
                  <CardHeader>
                      <CardTitle>Business Details</CardTitle>
                      <CardDescription>Manage general business information used across the application, like on invoices.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                      <LogoUploader />
                      <div className="grid md:grid-cols-2 gap-4 pt-4">
                          <div className="space-y-2">
                              <Label htmlFor="name">Company Name</Label>
                              <Input id="name" value={businessSettings.name} onChange={handleBusinessDetailsChange} />
                          </div>
                           <div className="space-y-2">
                              <Label htmlFor="email">Company Email</Label>
                              <Input id="email" type="email" value={businessSettings.email} onChange={handleBusinessDetailsChange} />
                          </div>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Input id="address" value={businessSettings.address} onChange={handleBusinessDetailsChange} />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <Label htmlFor="phone">Phone</Label>
                              <Input id="phone" value={businessSettings.phone} onChange={handleBusinessDetailsChange} />
                          </div>
                      </div>
                  </CardContent>
                  <CardFooter>
                      <Button onClick={handleBusinessSave} disabled={isSavingBusiness}>
                          {isSavingBusiness ? 'Saving...' : 'Save Business Details'}
                      </Button>
                  </CardFooter>
              </Card>
          </TabsContent>

          <TabsContent value="backup" className="mt-6">
             <Card>
                <CardHeader>
                    <CardTitle>Data Backup</CardTitle>
                    <CardDescription>
                        Generate a complete SQL backup of your most important business data from Firestore.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={handleCopy} className="w-full sm:w-auto">
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            <span className="ml-2">{copied ? 'Copied!' : 'Copy SQL to Clipboard'}</span>
                        </Button>
                        <Button onClick={handleDownload} className="w-full sm:w-auto">
                            <Download className="h-4 w-4" />
                            <span className="ml-2">Download .sql File</span>
                        </Button>
                    </div>
                    <Textarea
                        readOnly
                        value={allSql}
                        className="font-mono bg-muted h-[60vh] text-xs"
                    />
                </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
      <CreateCommissionRuleDialog
        isOpen={isCommissionRuleDialogOpen}
        onOpenChange={setCommissionRuleDialogOpen}
        onCreate={addCommissionRule}
        products={finishedGoods || []}
        distributors={distributors || []}
      />
      <CreateFormulaDialog
        isOpen={isFormulaDialogOpen}
        onOpenChange={setFormulaDialogOpen}
        onCreate={addFormula}
        rawMaterials={rawMaterials || []}
      />
    </>
  );
}
