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
  ShoppingCart,
  DollarSign
} from "lucide-react";

interface NavItem {
    href: string;
    label: string;
    icon: Icon;
}

export const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Sales", icon: DollarSign },
  { href: "/purchase-orders", label: "Purchase Orders", icon: ShoppingCart },
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
        <Link href="/" className="flex items-center gap-2.5">
          <Landmark className="h-7 w-7 text-primary" />
          <span className="font-bold text-xl whitespace-nowrap group-data-[collapsible=icon]:hidden">
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
                  size="lg"
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
                    size="lg"
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
          ))}
          <SidebarSeparator className="my-2"/>
           <SidebarMenuItem>
            <SidebarMenuButton tooltip="Logout" size="lg">
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
           </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
