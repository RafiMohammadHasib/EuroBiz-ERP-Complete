"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Undo2,
  PieChart,
  Settings,
  BrainCircuit,
  LogOut,
  Landmark,
  Building,
  Package,
  Factory,
  Truck,
  Database,
  Icon,
} from "lucide-react";

interface NavItem {
    href: string;
    label: string;
    icon: Icon;
}

export const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/commissions", label: "Commissions", icon: CreditCard },
  { href: "/returns", label: "Returns", icon: Undo2 },
  { href: "/dues", label: "Outstanding Dues", icon: Landmark },
  { href: "/suppliers", label: "Suppliers", icon: Building },
  { href: "/raw-materials", label: "Raw Materials", icon: Package },
  { href: "/production", label: "Production", icon: Factory },
  { href: "/finished-goods", label: "Finished Goods", icon: Package },
  { href: "/distributors", label: "Distributors", icon: Truck },
  { href: "/reports", label: "Reports", icon: PieChart },
  { href: "/forecast", label: "AI Forecast", icon: BrainCircuit },
  { href: "/sql-viewer", label: "SQL Viewer", icon: Database },
];

const bottomNavItems: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarNavProps {
    navItems: NavItem[];
}

export default function SidebarNav({ navItems: itemsToRender }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2">
          <Landmark className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg whitespace-nowrap group-data-[collapsible=icon]:hidden">
            BizFin
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {itemsToRender.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {bottomNavItems.map((item) => (
             <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
          ))}
          <SidebarSeparator />
           <SidebarMenuItem>
            <SidebarMenuButton tooltip="Logout">
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
           </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
