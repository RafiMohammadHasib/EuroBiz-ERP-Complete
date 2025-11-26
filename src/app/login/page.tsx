'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Landmark, User, Lock, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import placeholder from '@/lib/placeholder-images.json';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const loginIllustration = placeholder.placeholderImages.find(p => p.id === 'login-illustration') as ImagePlaceholder | undefined;

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
        description: "Welcome back! Redirecting you to the dashboard.",
      });
      router.push('/');
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          setError('Invalid username or password. Please try again.');
      } else {
        setError(error.message);
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2 bg-[#F7F7F7] font-sans relative">
      <div className="hidden lg:flex flex-col items-center justify-center p-12 bg-gradient-to-br from-primary/20 via-white to-primary/10 relative overflow-hidden">
        <div className='absolute top-10 left-10 flex items-center gap-3 text-2xl font-bold text-primary'>
            EuroBiz <span className='font-light text-gray-700'>ERP</span>
        </div>
        <div className="text-left w-full max-w-md">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Everything you need to manage your business — all in one place.</h1>
            <p className="text-gray-600 mb-8">EuroBiz helps you manage sales, inventory, suppliers, production, finance, and reporting with ease.</p>
        </div>
        {loginIllustration && (
             <Image
                src={loginIllustration.imageUrl}
                alt="EuroBiz ERP Illustration"
                width="1280"
                height="853"
                className="w-full h-auto object-contain rounded-lg"
                data-ai-hint={loginIllustration.imageHint}
                priority
             />
        )}
         <div className='absolute -bottom-20 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl'></div>
         <div className='absolute -top-20 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl'></div>
      </div>
      <div className="flex items-center justify-center py-12 px-4">
        <div className="mx-auto w-[380px] space-y-8">
            <div className='bg-white rounded-xl shadow-2xl shadow-primary/10 p-8'>
                <div className="grid gap-2 text-left mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
                    <p className="text-balance text-gray-500">
                    Login to continue using EuroBiz ERP
                    </p>
                </div>
                <div className="grid gap-6">
                    <div className="grid gap-2">
                    <Label htmlFor="email">Username</Label>
                    <div className='relative'>
                        <User className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400' />
                        <Input
                            id="email"
                            type="email"
                            placeholder="Enter Username"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            className="pl-10 h-12"
                        />
                    </div>
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center">
                            <Label htmlFor="password">Password</Label>
                            <Link
                            href="#"
                            className="ml-auto inline-block text-sm text-primary hover:underline"
                            >
                            Forgot Password?
                            </Link>
                        </div>
                        <div className='relative'>
                            <Lock className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400' />
                            <Input 
                                id="password" 
                                type={showPassword ? 'text' : 'password'}
                                required 
                                placeholder='Enter Password'
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                className="pl-10 h-12"
                            />
                            <button type='button' onClick={() => setShowPassword(!showPassword)} className='absolute right-3 top-1/2 -translate-y-1/2'>
                                {showPassword ? <EyeOff className='h-5 w-5 text-gray-400' /> : <Eye className='h-5 w-5 text-gray-400' />}
                            </button>
                        </div>
                    </div>
                    {error && (
                        <p className="text-sm text-destructive text-center">{error}</p>
                    )}
                    <Button type="submit" className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90" onClick={handleLogin} disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Login'}
                    </Button>
                </div>
            </div>
            <div className="text-center text-sm text-gray-500">
                Need an account? Please contact the admin.
            </div>
        </div>
      </div>
      <footer className='absolute bottom-4 w-full text-center text-xs text-gray-400'>
        © 2025 EuroBiz — All Rights Reserved
      </footer>
       <div className='absolute bottom-4 right-4 text-xs text-gray-400'>
        v1.0.0
       </div>
    </div>
  );
}
