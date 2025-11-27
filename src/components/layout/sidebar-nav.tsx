

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  PieChart,
  Settings,
  BrainCircuit,
  LogOut,
  LogIn,
  Landmark,
  Building,
  Package,
  Factory,
  Truck,
  Database,
  Icon,
  ShoppingCart,
  DollarSign,
  Users as UsersIcon,
  ChevronDown,
  Percent,
  LifeBuoy,
} from "lucide-react";
import { useAuth, useUser } from "@/firebase";
import { signOut } from "firebase/auth";

interface NavItem {
    href: string;
    label: string;
    icon: Icon;
}

interface NavGroup {
    label: string;
    items: NavItem[];
}

export const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
];

export const navGroups: NavGroup[] = [
    {
        label: "Sales & Purchasing",
        items: [
            { href: "/sales", label: "Sales", icon: DollarSign },
            { href: "/purchase-orders", label: "Purchase Orders", icon: ShoppingCart },
            { href: "/distributors", label: "Distributors", icon: Truck },
            { href: "/suppliers", label: "Suppliers", icon: Building },
        ]
    },
    {
        label: "Inventory & Production",
        items: [
            { href: "/raw-materials", label: "Raw Materials", icon: Package },
            { href: "/production", label: "Production", icon: Factory },
            { href: "/finished-goods", label: "Finished Goods", icon: Package },
        ]
    },
    {
        label: "Financials",
        items: [
            { href: "/dues", label: "Outstanding Dues", icon: Landmark },
        ]
    },
]

const bottomNavItems: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/support", label: "Support", icon: LifeBuoy },
];

interface SidebarNavProps {
    navItems: NavItem[]; // This will now be used for the core items like Dashboard
    navGroups: NavGroup[];
}

export default function SidebarNav({ navItems: itemsToRender, navGroups: groupsToRender }: SidebarNavProps) {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  const isLoginPage = pathname === '/login';

  if (isUserLoading) {
      return null;
  }

  if (!user && !isLoginPage) {
      return null; // Don't render sidebar if not logged in and not on login page
  }

  if (isLoginPage) {
      return null;
  }

  return (
    <>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2.5">
          <Landmark className="h-7 w-7 text-primary" />
          <span className="font-bold text-xl whitespace-nowrap group-data-[collapsible=icon]:hidden">
            EuroBiz
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {itemsToRender.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={item.label}
                  size="sm"
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <div className="flex flex-col gap-2">
        {groupsToRender.map((group) => (
            <SidebarGroup key={group.label} className="pt-0">
                <SidebarGroupLabel className="h-7 group-data-[collapsible=icon]:hidden">{group.label}</SidebarGroupLabel>
                <SidebarMenu>
                    {group.items.map((item) => (
                         <SidebarMenuItem key={item.href}>
                            <Link href={item.href}>
                                <SidebarMenuButton
                                isActive={pathname.startsWith(item.href)}
                                tooltip={item.label}
                                size="sm"
                                >
                                <item.icon />
                                <span>{item.label}</span>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroup>
        ))}
        </div>

      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {bottomNavItems.map((item) => (
             <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={item.label}
                    size="sm"
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Logout" size="sm" onClick={handleLogout}>
                <LogOut />
                <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
