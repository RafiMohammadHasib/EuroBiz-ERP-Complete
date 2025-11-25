'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Landmark } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import placeholder from '@/lib/placeholder-images.json';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const authIllustration = placeholder.placeholderImages.find(p => p.id === 'auth-illustration') as ImagePlaceholder | undefined;

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!auth) {
        throw new Error('Firebase Auth is not initialized');
      }
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Login Successful",
        description: "Welcome back! You have successfully logged in.",
      });
      router.push('/');
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          setError('Invalid email or password. Please try again.');
      } else {
        setError(error.message);
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full lg:grid lg:min-h-[100vh] lg:grid-cols-2 xl:min-h-[100vh]">
      <div className="hidden bg-gray-900 lg:flex items-center justify-center p-12">
        {authIllustration && (
             <Image
                src={authIllustration.imageUrl}
                alt="Illustration"
                width="1280"
                height="853"
                className="w-full h-auto object-contain rounded-lg shadow-2xl"
                data-ai-hint={authIllustration.imageHint}
             />
        )}
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
             <div className="inline-flex items-center justify-center gap-2 mb-4">
                <Landmark className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">BizFin</h1>
            </div>
            <p className="text-balance text-muted-foreground">
              Login to access your ERP dashboard
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
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="#"
                  className="ml-auto inline-block text-sm underline"
                >
                  Forgot password?
                </Link>
              </div>
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
            <Button type="submit" className="w-full" onClick={handleLogin} disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <span className="text-muted-foreground">
              Contact admin
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
