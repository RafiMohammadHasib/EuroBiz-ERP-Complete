
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2 } from 'lucide-react';

interface LogoUploaderProps {
  currentLogoUrl: string;
  onUploadComplete: (newUrl: string) => void;
}

export function LogoUploader({ currentLogoUrl, onUploadComplete }: LogoUploaderProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const [isSaving, setIsSaving] = useState(false);
  const [newLogoFile, setNewLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB size limit
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Please select an image smaller than 1MB.',
        });
        return;
      }
      setNewLogoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!newLogoFile || !firestore) {
      toast({
        variant: 'destructive',
        title: 'No file selected',
        description: 'Please select a logo file to save.',
      });
      return;
    }

    setIsSaving(true);

    try {
      // Convert image to data URI
      const reader = new FileReader();
      reader.readAsDataURL(newLogoFile);
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;

        // Update the settings document in Firestore
        const settingsRef = doc(firestore, 'settings', 'business');
        await setDoc(settingsRef, { logoUrl: dataUrl }, { merge: true });

        onUploadComplete(dataUrl); // Notify parent component

        toast({
          title: 'Logo Updated',
          description: 'Your new company logo has been saved.',
        });
        setNewLogoFile(null);
        setPreviewUrl(null);
        setIsSaving(false);
      };
      reader.onerror = (error) => {
        throw new Error("Could not read file as data URL: " + error);
      };

    } catch (error: any) {
      console.error("Error saving logo:", error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: error.message || 'Could not save the logo.',
      });
      setIsSaving(false);
    }
  };

  const logoToShow = previewUrl || currentLogoUrl;

  return (
    <div className="space-y-4">
        <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-muted rounded-md flex items-center justify-center relative overflow-hidden border">
                {logoToShow ? (
                    <Image src={logoToShow} alt="Company Logo" layout="fill" objectFit="contain" />
                ) : (
                    <Upload className="h-10 w-10 text-muted-foreground" />
                )}
            </div>
            <div className="grid gap-2 flex-1">
                <Label htmlFor="logo-file">Select new logo</Label>
                <Input id="logo-file" type="file" accept="image/png, image/jpeg, image/gif, image/svg+xml" onChange={handleFileChange} disabled={isSaving} />
                <p className="text-xs text-muted-foreground">Recommended: .PNG with transparent background (max 1MB).</p>
            </div>
        </div>
         {newLogoFile && (
            <Button onClick={handleSave} disabled={isSaving} className="w-full">
                {isSaving ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                    </>
                ) : (
                   <>
                     <Upload className="mr-2 h-4 w-4" />
                     Save New Logo
                   </>
                )}
            </Button>
        )}
    </div>
  );
}
