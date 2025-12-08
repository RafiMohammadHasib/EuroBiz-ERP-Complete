
'use client';

import { useState, useMemo } from 'react';
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, MoreHorizontal, PlusCircle } from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase, useAuth } from "@/firebase";
import { collection, doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useToast } from "@/hooks/use-toast";
import { ManageRoleDialog } from "@/components/user-management/manage-role-dialog";
import { CreateUserDialog, type NewUser } from "@/components/user-management/create-user-dialog";
import { updateDoc } from 'firebase/firestore';


type User = {
    uid: string;
    name: string;
    email: string;
    role: 'admin' | 'salesperson' | 'viewer';
    createdAt: string;
};

export default function UserManagementPage() {
    const firestore = useFirestore();
    const auth = useAuth();
    const { toast } = useToast();
    
    const usersCollection = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
    const { data: users, isLoading } = useCollection<User>(usersCollection);

    const [userToManage, setUserToManage] = useState<User | null>(null);
    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

    const handleRoleChange = async (uid: string, newRole: 'admin' | 'salesperson' | 'viewer') => {
        if (!firestore) return;
        try {
            const userRef = doc(firestore, 'users', uid);
            await updateDoc(userRef, { role: newRole });
            toast({
                title: 'Role Updated',
                description: `The role has been successfully changed to ${newRole}.`,
            });
            setUserToManage(null);
        } catch (error) {
            console.error("Error updating role: ", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not update the user role.',
            });
        }
    };
    
    const handleCreateUser = async (newUser: NewUser) => {
        if (!auth || !firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Authentication or database service is not available.'});
            return;
        }

        try {
            // Step 1: Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password);
            const authUser = userCredential.user;

            // Step 2: Create user document in Firestore
            const userDocRef = doc(firestore, 'users', authUser.uid);
            await setDoc(userDocRef, {
                uid: authUser.uid,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                createdAt: new Date().toISOString(),
            });

            toast({
                title: 'User Created',
                description: `User ${newUser.name} has been created successfully.`,
            });
            setCreateDialogOpen(false);
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
        }
    };

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case 'admin':
                return 'destructive';
            case 'salesperson':
                return 'default';
            default:
                return 'secondary';
        }
    }

  return (
    <>
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                Manage user roles and permissions across the system.
                </CardDescription>
            </CardHeader>
        </Card>
        
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Registered Users</h2>
                     <Button size="sm" className="h-9 gap-1" onClick={() => setCreateDialogOpen(true)}>
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Create User
                        </span>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Creation Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">Loading users...</TableCell>
                            </TableRow>
                        ) : users && users.length > 0 ? (
                            users.map((user) => (
                                <TableRow key={user.uid}>
                                    <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                                    </TableCell>
                                    <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => setUserToManage(user)}>
                                            Manage Role
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">No users found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
    {userToManage && (
        <ManageRoleDialog
            isOpen={!!userToManage}
            onOpenChange={(open) => !open && setUserToManage(null)}
            user={userToManage}
            onRoleChange={handleRoleChange}
        />
    )}
    <CreateUserDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreateUser={handleCreateUser}
    />
    </>
  );
}
