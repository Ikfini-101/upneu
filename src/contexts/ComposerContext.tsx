'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ComposerContextType {
    isOpen: boolean;
    openComposer: () => void;
    closeComposer: () => void;
    toggleComposer: () => void;
}

const ComposerContext = createContext<ComposerContextType | undefined>(undefined);

export function ComposerProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const openComposer = () => setIsOpen(true);
    const closeComposer = () => setIsOpen(false);
    const toggleComposer = () => setIsOpen(prev => !prev);

    return (
        <ComposerContext.Provider value={{ isOpen, openComposer, closeComposer, toggleComposer }}>
            {children}
        </ComposerContext.Provider>
    );
}

export function useComposer() {
    const context = useContext(ComposerContext);
    if (context === undefined) {
        throw new Error('useComposer must be used within a ComposerProvider');
    }
    return context;
}
