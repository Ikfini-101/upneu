'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Bell, User, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <nav
            className="fixed bottom-0 left-0 w-full z-50 bg-background/80 backdrop-blur-xl border-t border-white/5 pb-safe"
            style={{ bottom: 0, top: 'auto' }}
        >
            <div className="flex items-center justify-around h-16 max-w-2xl mx-auto px-2">
                <Link href="/feed" className="flex-1 flex flex-col items-center justify-center gap-1 group">
                    <div className={cn("p-2 rounded-xl transition-all duration-300", isActive('/feed') ? "bg-primary/20 text-primary" : "text-muted-foreground group-hover:text-primary/70")}>
                        <Home className={cn("h-6 w-6", isActive('/feed') && "fill-current")} />
                    </div>
                </Link>

                <Link href="/messages" className="flex-1 flex flex-col items-center justify-center gap-1 group">
                    <div className={cn("p-2 rounded-xl transition-all duration-300", isActive('/messages') || isActive('/messages/') ? "bg-primary/20 text-primary" : "text-muted-foreground group-hover:text-primary/70")}>
                        <Mail className={cn("h-6 w-6", isActive('/messages') && "fill-current")} />
                    </div>
                </Link>

                <Link href="/notifications" className="flex-1 flex flex-col items-center justify-center gap-1 group">
                    <div className={cn("p-2 rounded-xl transition-all duration-300 relative", isActive('/notifications') ? "bg-primary/20 text-primary" : "text-muted-foreground group-hover:text-primary/70")}>
                        <Bell className={cn("h-6 w-6", isActive('/notifications') && "fill-current")} />
                    </div>
                </Link>

                <Link href="/profile" className="flex-1 flex flex-col items-center justify-center gap-1 group">
                    <div className={cn("p-2 rounded-xl transition-all duration-300", isActive('/profile') ? "bg-primary/20 text-primary" : "text-muted-foreground group-hover:text-primary/70")}>
                        <User className={cn("h-6 w-6", isActive('/profile') && "fill-current")} />
                    </div>
                </Link>
            </div>
        </nav>
    );
}
