'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { ConfessionComposer } from '../confessions/ConfessionComposer';
import { ComposerProvider } from '@/contexts/ComposerContext';

export function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Define routes where Nav/Header/Composer should be hidden
    // Also hide on specific chat pages (dynamic route /messages/xyz) but NOT on /messages list
    const isMessageDetail = pathname.startsWith('/messages/') && pathname !== '/messages';
    const hiddenRoutes = ['/', '/login', '/wizard'];
    const isHidden = hiddenRoutes.includes(pathname) || isMessageDetail;

    return (
        <ComposerProvider>
            {!isHidden && <Header />}

            {children}

            {!isHidden && (
                <>
                    <ConfessionComposer />
                    <BottomNav />
                </>
            )}
        </ComposerProvider>
    );
}
