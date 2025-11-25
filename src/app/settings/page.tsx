
'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle } from 'lucide-react';
import { collection, doc, setDoc } from 'firebase/firestore';
import type { Commission, FinishedGood, RawMaterial } from '@/lib/data';
import { CreateCommissionRuleDialog } from '@/components/commissions/create-commission-rule-dialog';
import { CreateFormulaDialog } from '@/components/settings/create-formula-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Define a type for your settings document
type BusinessSettings = {
    name: string;
    address: string;
    email: string;
    phone: string;
    logoUrl: string;
    language: string;
    currency: string;
    vatTax: number;
};

export default function SettingsPage() {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  // --- Firestore References ---
  const settingsDocRef = useMemoFirebase(() => doc(firestore, 'settings', 'business'), [firestore]);
  const commissionsCollection = useMemoFirebase(() => collection(firestore, 'commissions'), [firestore]);
  const finishedGoodsCollection = useMemoFirebase(() => collection(firestore, 'finishedGoods'), [firestore]);
  const rawMaterialsCollection = useMemoFirebase(() => collection(firestore, 'rawMaterials'), [firestore]);
  
  // --- Data Hooks ---
  const { data: settingsData, isLoading: settingsLoading } = useDoc<BusinessSettings>(settingsDocRef);
  const { data: commissions, isLoading: commissionsLoading } = useCollection<Commission>(commissionsCollection);
  const { data: finishedGoods, isLoading: fgLoading } = useCollection<FinishedGood>(finishedGoodsCollection);
  const { data: rawMaterials, isLoading: rmLoading } = useCollection<RawMaterial>(rawMaterialsCollection);

  // --- Component State ---
  const [displayName, setDisplayName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
      name: '', address: '', email: '', phone: '', logoUrl: '',
      language: 'English', currency: 'BDT', vatTax: 0,
  });

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);

  const [isCommissionRuleDialogOpen, setCommissionRuleDialogOpen] = useState(false);
  const [isFormulaDialogOpen, setFormulaDialogOpen] = useState(false);

  // --- Effects to sync state with data from hooks ---
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
    }
  }, [user]);

  useEffect(() => {
    if (settingsData) {
      setBusinessSettings(settingsData);
    }
  }, [settingsData]);


  // --- Handlers ---
  const handleProfileUpdate = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    try {
      await updateProfile(user, { displayName });
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

  const handleSettingsUpdate = async () => {
    setIsSavingBusiness(true);
    try {
        await setDoc(settingsDocRef, businessSettings, { merge: true });
        toast({ title: 'Settings Updated', description: 'Your new settings have been saved.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error Saving Settings', description: error.message });
    } finally {
        setIsSavingBusiness(false);
    }
  };

    const handleBusinessDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        const isNumeric = id === 'vatTax';
        setBusinessSettings(prev => ({ ...prev, [id]: isNumeric ? Number(value) : value }));
    }

    const handleSettingsSelectChange = (field: keyof BusinessSettings, value: string) => {
        setBusinessSettings(prev => ({...prev, [field]: value}))
    }

  const addCommissionRule = async (newRule: Omit<Commission, 'id'>) => {
    // This functionality is already connected to Firestore via `commissions/page.tsx` logic
    // but we can add it here too if direct creation from settings is needed.
  };

  const addFormula = async (newFormula: Omit<FinishedGood, 'id'>) => {
    // Similar to commissions, this is handled elsewhere but can be added here.
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
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="business">Business</TabsTrigger>
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
                              <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="email">Email Address</Label>
                              <Input id="email" type="email" value={user?.email || ''} disabled />
                          </div>
                      </CardContent>
                      <CardFooter>
                          <Button onClick={handleProfileUpdate} disabled={isSavingProfile}>
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
                    <CardDescription>Manage system-wide preferences like localization and taxes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="language">Language</Label>
                            <Select value={businessSettings.language} onValueChange={(value) => handleSettingsSelectChange('language', value)}>
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
                            <Select value={businessSettings.currency} onValueChange={(value) => handleSettingsSelectChange('currency', value)}>
                                <SelectTrigger id="currency">
                                    <SelectValue placeholder="Select Currency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BDT">BDT</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="vatTax">VAT / Tax (%)</Label>
                            <Input id="vatTax" type="number" value={businessSettings.vatTax} onChange={handleBusinessDetailsChange} />
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSettingsUpdate} disabled={isSavingBusiness}>
                        {isSavingBusiness ? 'Saving...' : 'Save System Settings'}
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
                                        <p className="text-sm text-muted-foreground">{rule.appliesTo}</p>
                                    </div>
                                    <div className="font-semibold text-primary">
                                        {rule.type === 'Percentage' ? `${rule.rate}%` : `BDT ${rule.rate.toLocaleString()}`}
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
                      <Button onClick={handleSettingsUpdate} disabled={isSavingBusiness}>
                          {isSavingBusiness ? 'Saving...' : 'Save Business Details'}
                      </Button>
                  </CardFooter>
              </Card>
          </TabsContent>

        </Tabs>
      </div>
      <CreateCommissionRuleDialog
        isOpen={isCommissionRuleDialogOpen}
        onOpenChange={setCommissionRuleDialogOpen}
        onCreate={addCommissionRule}
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
