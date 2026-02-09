'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useComposer } from '@/contexts/ComposerContext';

export function BottomNav() {
    const pathname = usePathname();
    const { openComposer } = useComposer();

    const isActive = (path: string) => pathname === path;

    return (
        <>
            {/* 
                FLOATING ACTION BUTTON (FAB) - INDEPENDENT LAYER
                ================================================
                CRITICAL: This button is OUTSIDE the nav container to prevent any clipping.
                - Position: fixed (independent of nav overflow)
                - z-index: 100 (above nav's z-50)
                - Dimensions: 70px × 70px (perfect circle)
                - No parent with overflow: hidden
            */}
            <button
                onClick={() => openComposer()}
                className="fixed left-1/2 -translate-x-1/2 flex items-center justify-center transition-all duration-300 ease-out hover:scale-105 active:scale-95 shadow-[0_0_0_3px_rgba(255,255,255,0.2),0_0_15px_4px_rgba(255,255,255,0.15),0_0_30px_rgba(125,110,231,0.3)] hover:shadow-[0_0_0_4px_rgba(255,255,255,0.35),0_0_20px_6px_rgba(255,255,255,0.25),0_0_38px_rgba(125,110,231,0.45)]"
                style={{
                    // Explicit dimensions for perfect circle
                    width: '70px',
                    height: '70px',
                    // Positioning: centered horizontally, vertically above nav
                    bottom: 'calc(64px - 35px + env(safe-area-inset-bottom, 0px))', // 64px nav height - 35px (half button) + iOS safe area
                    // z-index above nav
                    zIndex: 100,
                    // Perfect circle
                    borderRadius: '50%',
                    // Background
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'white',
                    // No padding to preserve circle
                    padding: 0,
                    border: 'none',
                    cursor: 'pointer'
                }}
                aria-label="Poster une confession"
            >
                {/* Authentic Satir Pagne Texture */}
                <div
                    className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
                    style={{ zIndex: 0 }}
                >
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: 'url(/patterns/satir-fab-texture.png)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    />
                    {/* Subtle tint to ensure text contrast and theme harmony */}
                    <div className="absolute inset-0 bg-black/10" />
                </div>

                {/* Icon perfectly centered with Flexbox */}
                <Plus
                    style={{
                        width: '36px',
                        height: '36px',
                        strokeWidth: '3',
                        zIndex: 10,
                        position: 'relative'
                    }}
                />
            </button>

            {/* 
                NAVIGATION BAR
                ==============
                - No overflow: hidden that could clip FAB
                - FAB is positioned relative to this but NOT a child of it
            */}
            <nav
                className="fixed bottom-0 left-0 right-0 w-full border-t border-white/5"
                style={{
                    position: 'fixed',
                    bottom: 0,
                    zIndex: 50, // Below FAB (z-100)
                    paddingBottom: 'env(safe-area-inset-bottom, 0px)'
                }}
            >
                {/* Cultural Pattern Background */}
                <div
                    className="absolute inset-0 opacity-60 pointer-events-none"
                    style={{
                        backgroundImage: 'url(/patterns/satir-bottom-nav.svg)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'top center',
                        backgroundRepeat: 'no-repeat',
                        // CRITICAL: overflow hidden ONLY on pattern, NOT on nav
                        overflow: 'hidden'
                    }}
                />

                {/* Navigation Content */}
                <div
                    className="flex items-center justify-between max-w-2xl mx-auto px-4 bg-background/60 backdrop-blur-xl"
                    style={{
                        height: '64px', // Explicit height
                        position: 'relative',
                        zIndex: 10
                    }}
                >
                    {/* Left Side - Home */}
                    <Link href="/feed" className="flex-1 flex flex-col items-center justify-center gap-1 group">
                        <div className={cn("p-2 rounded-xl transition-all duration-300", isActive('/feed') ? "text-primary" : "text-muted-foreground group-hover:text-primary/70")}>
                            <Home className={cn("h-6 w-6", isActive('/feed') && "fill-current")} />
                        </div>
                    </Link>

                    {/* Center Spacer - Leave space for FAB */}
                    <div style={{ width: '100px' }} /> {/* Explicit spacer */}

                    {/* Right Side - Profile */}
                    <Link href="/profile" className="flex-1 flex flex-col items-center justify-center gap-1 group">
                        <div className={cn("p-2 rounded-xl transition-all duration-300", isActive('/profile') ? "text-primary" : "text-muted-foreground group-hover:text-primary/70")}>
                            <User className={cn("h-6 w-6", isActive('/profile') && "fill-current")} />
                        </div>
                    </Link>
                </div>
            </nav>
        </>
    );
}
