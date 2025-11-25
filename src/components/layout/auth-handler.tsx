'use client';

import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import DashboardLayout from './dashboard-layout';
import { Skeleton } from '../ui/skeleton';

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
            <div className="flex flex-col h-screen">
                <header className="flex h-16 items-center gap-4 border-b px-4 lg:px-6">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-6 w-32" />
                    <div className="ml-auto flex items-center gap-4">
                        <Skeleton className="h-8 w-8 rounded-full" />
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
    
    if (isAuthPage) {
        return <>{children}</>;
    }

    if (user) {
        return <DashboardLayout>{children}</DashboardLayout>;
    }

    // This is mainly for the brief moment before the redirect happens.
    return null;
}
