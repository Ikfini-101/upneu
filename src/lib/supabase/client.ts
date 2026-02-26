import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Preferences } from '@capacitor/preferences'

import { Capacitor } from '@capacitor/core'

// Custom storage adapter for Capacitor Preferences
const capacitorStorage = {
    getItem: async (key: string): Promise<string | null> => {
        if (typeof window === 'undefined') return null;
        if (Capacitor.isNativePlatform()) {
            try {
                const { value } = await Preferences.get({ key })
                return value
            } catch (e) {
                console.warn('Preferences get error:', e);
                return null;
            }
        }
        return window.localStorage.getItem(key);
    },
    setItem: async (key: string, value: string): Promise<void> => {
        if (typeof window === 'undefined') return;
        if (Capacitor.isNativePlatform()) {
            try {
                await Preferences.set({ key, value })
            } catch (e) { console.warn('Preferences set error:', e); }
        } else {
            window.localStorage.setItem(key, value);
        }
    },
    removeItem: async (key: string): Promise<void> => {
        if (typeof window === 'undefined') return;
        if (Capacitor.isNativePlatform()) {
            try {
                await Preferences.remove({ key })
            } catch (e) { console.warn('Preferences remove error:', e); }
        } else {
            window.localStorage.removeItem(key);
        }
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
