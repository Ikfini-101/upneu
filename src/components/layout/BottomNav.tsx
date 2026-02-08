'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Bell, User, Mail, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useComposer } from '@/contexts/ComposerContext';

export function BottomNav() {
    const pathname = usePathname();
    const { openComposer } = useComposer();

    const isActive = (path: string) => pathname === path;

    return (
        <nav
            className="fixed bottom-0 left-0 w-full z-40 border-t border-white/5 pb-safe satir-bottom-nav-wrapper"
            style={{ bottom: 0, top: 'auto' }}
        >
            {/* Satir Protection Pattern - Cultural symbolism */}
            <div
                className="absolute inset-0 opacity-60 pointer-events-none"
                style={{
                    backgroundImage: 'url(/patterns/satir-bottom-nav.svg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'top center',
                    backgroundRepeat: 'no-repeat'
                }}
            />

            <div className="flex items-center justify-between h-16 max-w-2xl mx-auto px-4 relative z-10 bg-background/60 backdrop-blur-xl">

                {/* Left Side */}
                <Link href="/feed" className="flex-1 flex flex-col items-center justify-center gap-1 group">
                    <div className={cn("p-2 rounded-xl transition-all duration-300", isActive('/feed') ? "text-primary" : "text-muted-foreground group-hover:text-primary/70")}>
                        <Home className={cn("h-6 w-6", isActive('/feed') && "fill-current")} />
                    </div>
                </Link>

                {/* Messages - Temporarily disabled (mobile layout issues) */}
                {/* <Link href="/messages" className="flex-1 flex flex-col items-center justify-center gap-1 group mr-8">
                    <div className={cn("p-2 rounded-xl transition-all duration-300", isActive('/messages') ? "text-primary" : "text-muted-foreground group-hover:text-primary/70")}>
                        <Mail className={cn("h-6 w-6", isActive('/messages') && "fill-current")} />
                    </div>
                </Link> */}

                {/* Central Button Container - Absolute Positioning for Protuberance */}
                <div className="absolute left-1/2 -top-6 -translate-x-1/2 p-2 rounded-full bg-background border-t border-white/5">
                    <button
                        onClick={() => openComposer()}
                        className="flex items-center justify-center h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-[0_0_20px_-5px_hsl(var(--primary))] hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-300 ease-out"
                        aria-label="Poster une confession"
                    >
                        <Plus className="h-8 w-8" />
                    </button>
                </div>

                {/* Right Side */}
                <Link href="/notifications" className="flex-1 flex flex-col items-center justify-center gap-1 group ml-8">
                    <div className={cn("p-2 rounded-xl transition-all duration-300", isActive('/notifications') ? "text-primary" : "text-muted-foreground group-hover:text-primary/70")}>
                        <Bell className={cn("h-6 w-6", isActive('/notifications') && "fill-current")} />
                    </div>
                </Link>

                <Link href="/profile" className="flex-1 flex flex-col items-center justify-center gap-1 group">
                    <div className={cn("p-2 rounded-xl transition-all duration-300", isActive('/profile') ? "text-primary" : "text-muted-foreground group-hover:text-primary/70")}>
                        <User className={cn("h-6 w-6", isActive('/profile') && "fill-current")} />
                    </div>
                </Link>
            </div>
        </nav>
    );
}
