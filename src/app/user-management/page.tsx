
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
import { Users, MoreHorizontal } from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { ManageRoleDialog } from "@/components/user-management/manage-role-dialog";

type User = {
    uid: string;
    name: string;
    email: string;
    role: 'admin' | 'salesperson' | 'viewer';
    createdAt: string;
};

export default function UserManagementPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const usersCollection = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
    const { data: users, isLoading } = useCollection<User>(usersCollection);

    const [userToManage, setUserToManage] = useState<User | null>(null);

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
                <h2 className="text-lg font-semibold">Registered Users</h2>
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
            onOpenChange={() => setUserToManage(null)}
            user={userToManage}
            onRoleChange={handleRoleChange}
        />
    )}
    </>
  );
}

    