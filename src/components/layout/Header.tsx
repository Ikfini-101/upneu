'use client'

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Notifications } from '@/components/notifications/Notifications';
import { Settings } from 'lucide-react';

export function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
            <div className="flex h-16 items-center px-4 max-w-2xl mx-auto relative">
                <Link href="/feed" className="flex items-center gap-3 transition-opacity hover:opacity-80">
                    <div className="relative h-12 w-12 overflow-hidden">
                        <Image
                            src="/ano-logo.png"
                            alt="ANO Logo"
                            width={48}
                            height={48}
                            className="object-contain"
                        />
                    </div>
                </Link>

                <div className="ml-auto flex items-center gap-2">
                    <Link href="/settings" className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                        <Settings className="h-5 w-5" />
                    </Link>
                    <Notifications />
                </div>
            </div>
        </header>
    );
}
