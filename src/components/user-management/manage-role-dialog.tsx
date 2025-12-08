
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '@/hooks/use-toast';

type User = {
    uid: string;
    name: string;
    email: string;
    role: 'admin' | 'salesperson' | 'viewer';
    createdAt: string;
};

interface ManageRoleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  onRoleChange: (uid: string, newRole: 'admin' | 'salesperson' | 'viewer') => void;
}

export function ManageRoleDialog({ isOpen, onOpenChange, user, onRoleChange }: ManageRoleDialogProps) {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<'admin' | 'salesperson' | 'viewer'>('viewer');

  useEffect(() => {
    if (user) {
      setSelectedRole(user.role);
    }
  }, [user]);

  const handleSubmit = () => {
    onRoleChange(user.uid, selectedRole);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Role for {user?.name}</DialogTitle>
          <DialogDescription>
            Select a new role for the user. Changes will take effect immediately.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="user-email" className="text-right">
              Email
            </Label>
            <p id="user-email" className="col-span-3 text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role-select" className="text-right">
              Role
            </Label>
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as any)}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" onClick={handleSubmit}>Update Role</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
