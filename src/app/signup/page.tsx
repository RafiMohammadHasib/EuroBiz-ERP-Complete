'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Landmark } from 'lucide-react';
import Image from 'next/image';
import placeholder from '@/lib/placeholder-images.json';
import type { ImagePlaceholder } from '@/lib/placeholder-images';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const authIllustration = placeholder.placeholderImages.find(p => p.id === 'auth-illustration') as ImagePlaceholder | undefined;


  const handleSignup = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!auth) {
        throw new Error('Firebase Auth is not initialized');
      }
      await createUserWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
     <div className="w-full lg:grid lg:min-h-[100vh] lg:grid-cols-2 xl:min-h-[100vh]">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
             <div className="inline-flex items-center justify-center gap-2 mb-2">
                <Landmark className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">BizFin</h1>
            </div>
            <p className="text-balance text-muted-foreground">
              Create an account to get started
            </p>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <Button type="submit" className="w-full" onClick={handleSignup} disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Log in
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:flex items-center justify-center">
        {authIllustration && (
             <Image
                src={authIllustration.imageUrl}
                alt="Illustration"
                width="1280"
                height="853"
                className="w-[80%] h-auto object-contain"
                data-ai-hint={authIllustration.imageHint}
             />
        )}
      </div>
    </div>
  );
}
