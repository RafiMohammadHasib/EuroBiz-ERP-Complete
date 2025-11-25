import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import AuthHandler from '@/components/layout/auth-handler';

export const metadata: Metadata = {
  title: 'BizFin Sales ERP',
  description: 'A comprehensive ERP system for manufacturing businesses, focusing on financial and sales management.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
           <AuthHandler>
              {children}
           </AuthHandler>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
