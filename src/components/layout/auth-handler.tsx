
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import DashboardLayout from './dashboard-layout';
import { Skeleton } from '../ui/skeleton';
import { SettingsProvider } from '@/context/settings-context';
import { doc } from 'firebase/firestore';
import { companyDetails as initialCompanyDetails } from '@/lib/data';

type BusinessSettings = {
    name: string;
    address: string;
    email: string;
    phone: string;
    logoUrl: string;
    currency?: 'BDT' | 'USD';
};

function AppContentController({ children }: { children: React.ReactNode }) {
    const firestore = useFirestore();
    const settingsDocRef = useMemoFirebase(() => doc(firestore, 'settings', 'business'), [firestore]);
    const { data: businessSettingsData, isLoading: settingsLoading } = useDoc<BusinessSettings>(settingsDocRef);
    
    if (settingsLoading) {
        return (
             <div className="flex flex-col h-screen">
                <header className="flex h-16 items-center gap-4 border-b px-4 lg:px-6">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-6 w-32" />
                    <div className="ml-auto flex items-center gap-4">
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                </header>
                <div className="flex flex-1">
                    <aside className="hidden md:block w-64 border-r p-3">
                        <div className="flex flex-col gap-2">
                           {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
                        </div>
                    </aside>
                    <main className="flex-1 p-6">
                        <Skeleton className="h-full w-full" />
                    </main>
                </div>
            </div>
        );
    }

    return (
        <SettingsProvider initialBusinessSettings={businessSettingsData ?? initialCompanyDetails}>
            <DashboardLayout>
                {children}
            </DashboardLayout>
        </SettingsProvider>
    );
}

export default function AuthHandler({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const pathname = usePathname();

    const isAuthPage = pathname === '/login';

    useEffect(() => {
        if (!isUserLoading && !user && !isAuthPage) {
            router.push('/login');
        }
        if (!isUserLoading && user && isAuthPage) {
            router.push('/');
        }
    }, [isUserLoading, user, router, isAuthPage, pathname]);

    if (isUserLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Skeleton className="h-12 w-12 rounded-full" />
            </div>
        );
    }
    
    if (isAuthPage) {
        return <>{children}</>;
    }

    if (user) {
        return <AppContentController>{children}</AppContentController>;
    }

    return null;
}
