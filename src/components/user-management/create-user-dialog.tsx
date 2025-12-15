
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

export type NewUser = {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'salesperson' | 'viewer';
};

interface CreateUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateUser: (newUser: NewUser) => void;
}

export function CreateUserDialog({ isOpen, onOpenChange, onCreateUser }: CreateUserDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'salesperson' | 'viewer'>('viewer');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async () => {
    if (!name || !email || !password) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Please fill out all fields.',
      });
      return;
    }
    
    setIsCreating(true);

    const tempAppName = `createUser-${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);

    try {
      // Step 1: Create user in the temporary auth instance
      const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
      const authUser = userCredential.user;

      // Step 2: Create user document in Firestore using the main app's firestore instance
      if (firestore) {
        const userDocRef = doc(firestore, 'users', authUser.uid);
        await setDoc(userDocRef, {
            uid: authUser.uid,
            name: name,
            email: email,
            role: role,
            createdAt: new Date().toISOString(),
        });
      } else {
        throw new Error("Firestore is not available.");
      }

      toast({
          title: 'User Created',
          description: `User ${name} has been created successfully.`,
      });

      // Reset form and close dialog
      setName('');
      setEmail('');
      setPassword('');
      setRole('viewer');
      onOpenChange(false);

    } catch (error: any) {
        console.error("Error creating user:", error);
        let errorMessage = 'Could not create the user.';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'This email address is already in use by another account.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'The password is too weak. Please use a stronger password.';
        }
        toast({
            variant: 'destructive',
            title: 'Error Creating User',
            description: errorMessage,
        });
    } finally {
        // Clean up the temporary app
        await deleteApp(tempApp);
        setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Enter the details for the new user account.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Full Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Jane Doe"
              disabled={isCreating}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3"
              placeholder="e.g., jane@example.com"
              disabled={isCreating}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="col-span-3"
              placeholder="A secure password"
              disabled={isCreating}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role-select" className="text-right">
              Role
            </Label>
            <Select value={role} onValueChange={(value) => setRole(value as any)} disabled={isCreating}>
              <SelectTrigger id="role-select" className="col-span-3">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="salesperson">Salesperson</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>Cancel</Button>
          <Button type="submit" onClick={handleSubmit} disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
