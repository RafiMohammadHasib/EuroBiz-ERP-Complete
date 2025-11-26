'use client';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import placeholder from '@/lib/placeholder-images.json';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Bell, PieChart, Search, Circle } from 'lucide-react';
import Link from 'next/link';
import { notifications as initialNotifications } from '@/lib/data';
import type { Notification } from '@/lib/data';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';


interface HeaderProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

export default function Header({ searchQuery, setSearchQuery }: HeaderProps) {
  const userAvatar = placeholder.placeholderImages.find(p => p.id === 'user-avatar') as ImagePlaceholder | undefined;
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
      setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm lg:px-6">
      <SidebarTrigger />
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search..."
          className="w-full rounded-lg bg-card pl-8 md:w-[200px] lg:w-[320px]"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <Button variant="ghost" asChild>
        <Link href="/reports">
          <PieChart className="h-5 w-5" />
          <span className="ml-2 hidden sm:inline">Reports</span>
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
                <span className="absolute top-0 right-0 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
            )}
            <span className="sr-only">Toggle notifications</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[350px]">
            <div className="flex items-center justify-between p-2">
                <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                {unreadCount > 0 && <Badge variant="secondary">{unreadCount} New</Badge>}
            </div>
          <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
            {notifications.map(notification => (
                 <DropdownMenuItem key={notification.id} className="flex items-start gap-3 p-2 cursor-default" onSelect={(e) => e.preventDefault()}>
                    {!notification.read && <Circle className="h-2 w-2 mt-1.5 flex-shrink-0 fill-blue-500 text-blue-500" />}
                    <div className={cn("flex-grow space-y-1", notification.read && "pl-5")}>
                        <p className={cn("font-medium text-sm", notification.type === 'warning' && 'text-destructive')}>{notification.title}</p>
                        <p className="text-xs text-muted-foreground">{notification.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(notification.datetime), { addSuffix: true })}</p>
                    </div>
                </DropdownMenuItem>
            ))}
            </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="p-0">
             <Button
                variant="link"
                className="w-full text-sm text-primary"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
              >
                Mark all as read
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar className="h-8 w-8">
              {userAvatar && <AvatarImage src={userAvatar.imageUrl} alt="Admin" data-ai-hint={userAvatar.imageHint} />}
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild><Link href="/settings">Settings</Link></DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
