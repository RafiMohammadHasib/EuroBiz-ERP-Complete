'use client';

import { useState } from 'react';
import { useAuth, useUser } from '@/firebase';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import type { Commission, FinishedGood, RawMaterial } from '@/lib/data';
import { CreateCommissionRuleDialog } from '@/components/commissions/create-commission-rule-dialog';
import { CreateFormulaDialog } from '@/components/settings/create-formula-dialog';

export default function SettingsPage() {
  const { user } = useUser();
  const auth = useAuth();
  const { toast } = useToast();

  // User settings state
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Business settings state
  const firestore = useFirestore();
  const commissionsCollection = useMemoFirebase(() => collection(firestore, 'commissions'), [firestore]);
  const finishedGoodsCollection = useMemoFirebase(() => collection(firestore, 'finishedGoods'), [firestore]);
  const rawMaterialsCollection = useMemoFirebase(() => collection(firestore, 'rawMaterials'), [firestore]);

  const { data: commissions, isLoading: commissionsLoading } = useCollection<Commission>(commissionsCollection);
  const { data: finishedGoods, isLoading: fgLoading } = useCollection<FinishedGood>(finishedGoodsCollection);
  const { data: rawMaterials, isLoading: rmLoading } = useCollection<RawMaterial>(rawMaterialsCollection);

  const [isCommissionRuleDialogOpen, setCommissionRuleDialogOpen] = useState(false);
  const [isFormulaDialogOpen, setFormulaDialogOpen] = useState(false);

  const handleProfileUpdate = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    try {
      await updateProfile(user, { displayName });
      // Email update requires re-authentication and is more complex, so we'll skip it for now.
      toast({
        title: 'Profile Updated',
        description: 'Your display name has been successfully updated.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error updating profile',
        description: error.message,
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!user || !auth.currentUser) return;
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
        if(!auth.currentUser.email) {
            throw new Error("No email found for current user.");
        }
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
      toast({
        variant: 'destructive',
        title: 'Error updating password',
        description: error.code === 'auth/wrong-password' ? 'The current password you entered is incorrect.' : error.message,
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const addCommissionRule = async (newRule: Omit<Commission, 'id'>) => {
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
  };

  const addFormula = async (newFormula: Omit<FinishedGood, 'id'>) => {
    try {
      await addDoc(finishedGoodsCollection, newFormula);
      toast({
        title: 'Production Formula Created',
        description: `The formula for "${newFormula.productName}" has been added.`,
      });
    } catch (error) {
        console.error("Error adding formula:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not create the new formula.",
        });
    }
  };

  return (
    <>
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="md:col-span-1">
            <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
            <p className="text-muted-foreground">
              Manage your account and business-wide settings.
            </p>
          </div>

          <div className="md:col-span-2 space-y-8">
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
                  <Input id="email" type="email" value={email} disabled />
                </div>
              </CardContent>
              <CardContent>
                <Button onClick={handleProfileUpdate} disabled={isSavingProfile}>
                  {isSavingProfile ? 'Saving...' : 'Save Profile'}
                </Button>
              </CardContent>
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
              <CardContent>
                <Button onClick={handlePasswordUpdate} disabled={isSavingPassword}>
                  {isSavingPassword ? 'Saving...' : 'Update Password'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="md:col-span-1">
                <h2 className="text-2xl font-bold tracking-tight">Business Settings</h2>
                <p className="text-muted-foreground">
                Define rules and formulas that govern your business operations.
                </p>
            </div>
            <div className="md:col-span-2">
                <Tabs defaultValue="formulas">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="formulas">Production Formulas</TabsTrigger>
                    <TabsTrigger value="commissions">Commission Rules</TabsTrigger>
                </TabsList>
                <TabsContent value="formulas">
                    <Card className="mt-4">
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
                </TabsContent>
                <TabsContent value="commissions">
                    <Card className="mt-4">
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
                </Tabs>
            </div>
        </div>
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

    