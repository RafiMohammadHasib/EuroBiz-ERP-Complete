
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth, useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Copy, Check, Download } from 'lucide-react';
import { collection, doc, setDoc, addDoc } from 'firebase/firestore';
import type { Commission, FinishedGood, RawMaterial, Distributor, PurchaseOrder, SalesCommission, Supplier } from '@/lib/data';
import { CreateCommissionRuleDialog } from '@/components/commissions/create-commission-rule-dialog';
import { CreateFormulaDialog } from '@/components/settings/create-formula-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '@/context/settings-context';
import { companyDetails as initialCompanyDetails } from '@/lib/data';
import { Textarea } from '@/components/ui/textarea';


type ProfileSettings = {
    displayName: string;
};

type SystemSettings = {
    language: string;
    currency: 'BDT' | 'USD';
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
  const { setCurrency } = useSettings();

  // --- Firestore References ---
  const profileSettingsDocRef = useMemoFirebase(() => user ? doc(firestore, 'settings', user.uid) : null, [firestore, user]);
  const systemSettingsDocRef = useMemoFirebase(() => doc(firestore, 'settings', 'system'), [firestore]);
  const businessSettingsDocRef = useMemoFirebase(() => doc(firestore, 'settings', 'business'), [firestore]);
  
  const commissionsCollection = useMemoFirebase(() => collection(firestore, 'commissions'), [firestore]);
  const finishedGoodsCollection = useMemoFirebase(() => collection(firestore, 'finishedGoods'), [firestore]);
  const rawMaterialsCollection = useMemoFirebase(() => collection(firestore, 'rawMaterials'), [firestore]);
  const distributorsCollection = useMemoFirebase(() => collection(firestore, 'distributors'), [firestore]);
  const purchaseOrdersCollection = useMemoFirebase(() => collection(firestore, 'purchaseOrders'), [firestore]);
  const salesCommissionsCollection = useMemoFirebase(() => collection(firestore, 'sales_commissions'), [firestore]);
  const suppliersCollection = useMemoFirebase(() => collection(firestore, 'suppliers'), [firestore]);

  
  // --- Data Hooks ---
  const { data: profileSettingsData, isLoading: profileLoading } = useDoc<ProfileSettings>(profileSettingsDocRef);
  const { data: systemSettingsData, isLoading: systemLoading } = useDoc<SystemSettings>(systemSettingsDocRef);
  const { data: businessSettingsData, isLoading: businessLoading } = useDoc<BusinessSettings>(businessSettingsDocRef);
  
  const { data: commissions, isLoading: commissionsLoading } = useCollection<Commission>(commissionsCollection);
  const { data: finishedGoods, isLoading: fgLoading } = useCollection<FinishedGood>(finishedGoodsCollection);
  const { data: rawMaterials, isLoading: rmLoading } = useCollection<RawMaterial>(rawMaterialsCollection);
  const { data: distributors, isLoading: distLoading } = useCollection<Distributor>(distributorsCollection);
  const { data: purchaseOrders, isLoading: poLoading } = useCollection<PurchaseOrder>(purchaseOrdersCollection);
  const { data: salesCommissions, isLoading: scLoading } = useCollection<SalesCommission>(salesCommissionsCollection);
  const { data: suppliers, isLoading: suppliersLoading } = useCollection<Supplier>(suppliersCollection);


  // --- Component State ---
  const [profileSettings, setProfileSettings] = useState<ProfileSettings>({ displayName: '' });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({ language: 'English', currency: 'BDT' });
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
      name: initialCompanyDetails.name, 
      address: initialCompanyDetails.address, 
      email: initialCompanyDetails.email, 
      phone: initialCompanyDetails.phone, 
      logoUrl: initialCompanyDetails.logoUrl,
  });

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingSystem, setIsSavingSystem] = useState(false);
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);

  const [isCommissionRuleDialogOpen, setCommissionRuleDialogOpen] = useState(false);
  const [isFormulaDialogOpen, setFormulaDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);


  // --- Effects to sync state with data from hooks ---
  useEffect(() => {
    if (user && user.displayName) {
        setProfileSettings(prev => ({...prev, displayName: user.displayName!}));
    }
    if (profileSettingsData) {
      setProfileSettings(profileSettingsData);
    }
  }, [user, profileSettingsData]);

  useEffect(() => {
    if (systemSettingsData) {
      setSystemSettings(systemSettingsData);
      setCurrency(systemSettingsData.currency || 'BDT');
    }
  }, [systemSettingsData, setCurrency]);

  useEffect(() => {
    if (businessSettingsData) {
      setBusinessSettings(businessSettingsData);
    }
  }, [businessSettingsData]);


  // --- Handlers ---
  const handleProfileSave = async () => {
    if (!user || !profileSettingsDocRef) return;
    setIsSavingProfile(true);
    try {
      await updateProfile(user, { displayName: profileSettings.displayName });
      await setDoc(profileSettingsDocRef, profileSettings, { merge: true });
      toast({
        title: 'Profile Updated',
        description: 'Your display name has been successfully updated.',
      });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error updating profile', description: error.message });
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

  const handleSystemSave = async () => {
    setIsSavingSystem(true);
    try {
        await setDoc(systemSettingsDocRef, systemSettings, { merge: true });
        setCurrency(systemSettings.currency);
        toast({ title: 'System Settings Updated', description: 'Your new system settings have been saved.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error Saving Settings', description: error.message });
    } finally {
        setIsSavingSystem(false);
    }
  };

  const handleBusinessSave = async () => {
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

    const handleProfileDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setProfileSettings(prev => ({ ...prev, [id]: value }));
    }

    const handleSystemSettingsChange = (field: keyof SystemSettings, value: string) => {
        setSystemSettings(prev => ({...prev, [field]: value as any}));
    }

    const handleBusinessDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
                          <CardDescription>Update your personal information.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                          <div className="space-y-2">
                              <Label htmlFor="displayName">Display Name</Label>
                              <Input id="displayName" value={profileSettings.displayName} onChange={handleProfileDetailsChange} />
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="email">Email Address</Label>
                              <Input id="email" type="email" value={user?.email || ''} disabled />
                          </div>
                      </CardContent>
                      <CardFooter>
                          <Button onClick={handleProfileSave} disabled={isSavingProfile}>
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
                              {isSavingPassword ? 'Saving...' : 'Update Password'}
                          </Button>
                      </CardFooter>
                  </Card>
              </div>
          </TabsContent>

          <TabsContent value="system" className="mt-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>System Configuration</CardTitle>
                    <CardDescription>Manage system-wide preferences like localization.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="language">Language</Label>
                            <Select value={systemSettings.language} onValueChange={(value) => handleSystemSettingsChange('language', value)}>
                                <SelectTrigger id="language">
                                    <SelectValue placeholder="Select Language" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="English">English</SelectItem>
                                    <SelectItem value="Bengali" disabled>Bengali (Coming Soon)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Select value={systemSettings.currency} onValueChange={(value) => handleSystemSettingsChange('currency', value)}>
                                <SelectTrigger id="currency">
                                    <SelectValue placeholder="Select Currency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BDT">BDT (৳)</SelectItem>
                                    <SelectItem value="USD">USD ($)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSystemSave} disabled={isSavingSystem}>
                        {isSavingSystem ? 'Saving...' : 'Save System Settings'}
                    </Button>
                </CardFooter>
            </Card>

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
                        {fgLoading ? <p>Loading formulas...</p> : finishedGoods?.map(fg => (
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
                    {commissionsLoading ? <p>Loading rules...</p> : commissions && commissions.length > 0 ? (
                        <div className="space-y-4">
                            {commissions.map(rule => (
                                <div key={rule.id} className="flex justify-between items-center rounded-lg border p-4">
                                    <div>
                                        <p className="font-semibold">{rule.ruleName}</p>
                                        <p className="text-sm text-muted-foreground">{Array.isArray(rule.appliesTo) ? rule.appliesTo.join(', ') : rule.appliesTo}</p>
                                    </div>
                                    <div className="font-semibold text-primary">
                                        {rule.type === 'Percentage' ? `${rule.rate}%` : `৳${rule.rate.toLocaleString()}`}
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
            </Card>
          </TabsContent>

          <TabsContent value="business" className="mt-6">
              <Card>
                  <CardHeader>
                      <CardTitle>Business Details</CardTitle>
                      <CardDescription>Manage general business information used across the application, like on invoices.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
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
                           <div className="space-y-2">
                              <Label htmlFor="logoUrl">Logo URL</Label>
                              <Input id="logoUrl" value={businessSettings.logoUrl} onChange={handleBusinessDetailsChange} />
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
