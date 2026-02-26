import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Preferences } from '@capacitor/preferences'

import { Capacitor } from '@capacitor/core'

const memoryCache = new Map<string, string>();

// Custom storage adapter for Capacitor Preferences
const capacitorStorage = {
    getItem: async (key: string): Promise<string | null> => {
        if (typeof window === 'undefined') return null;
        if (memoryCache.has(key)) return memoryCache.get(key) || null;

        try {
            const { value } = await Preferences.get({ key })
            if (value) {
                memoryCache.set(key, value);
                return value;
            }
        } catch (e) {
            console.warn('Preferences get error:', e);
        }

        const fallback = window.localStorage.getItem(key);
        if (fallback) memoryCache.set(key, fallback);
        return fallback;
    },
    setItem: async (key: string, value: string): Promise<void> => {
        if (typeof window === 'undefined') return;
        memoryCache.set(key, value);
        try {
            await Preferences.set({ key, value })
        } catch (e) { console.warn('Preferences set error:', e); }
        // Fallback or mirror
        try { window.localStorage.setItem(key, value); } catch (e) { }
    },
    removeItem: async (key: string): Promise<void> => {
        if (typeof window === 'undefined') return;
        memoryCache.delete(key);
        try {
            await Preferences.remove({ key })
        } catch (e) { console.warn('Preferences remove error:', e); }
        try { window.localStorage.removeItem(key); } catch (e) { }
    },
}

let supabaseInstance: any = null;

export function createClient() {
    if (!supabaseInstance) {
        supabaseInstance = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                auth: {
                    storage: capacitorStorage,
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true,
                }
            }
        )
    }
    return supabaseInstance;
}
