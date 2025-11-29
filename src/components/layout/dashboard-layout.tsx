'use client';

import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import SidebarNav from '@/components/layout/sidebar-nav';
import Header from '@/components/layout/header';
import { useState } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarNav searchQuery={searchQuery} />
      </Sidebar>
      <SidebarInset>
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <main className="p-4 lg:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
