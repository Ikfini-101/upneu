'use client'

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
            <div className="flex h-16 items-center px-4 max-w-2xl mx-auto relative">
                <Link href="/feed" className="flex items-center gap-3 transition-opacity hover:opacity-80">
                    <div className="relative h-10 w-10 overflow-hidden rounded-xl shadow-lg shadow-primary/20">
                        <Image
                            src="/icon.png"
                            alt="ANO Logo"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <span className="font-black tracking-tight text-xl bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">
                        ANO
                    </span>
                </Link>
            </div>
        </header>
    );
}
