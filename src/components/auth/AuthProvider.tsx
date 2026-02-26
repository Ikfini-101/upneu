'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { App, URLOpenListenerEvent } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

type AuthContextType = {
    session: Session | null
    user: User | null
    isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    isLoading: true,
})

export const useAuth = () => useContext(AuthContext)

const publicRoutes = ['/', '/login'] // Add other public routes if needed

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        let mounted = true

        // Handle native deep links (e.g. Supabase OAuth redirects)
        if (Capacitor.isNativePlatform()) {
            App.addListener('appUrlOpen', async (event: URLOpenListenerEvent) => {
                const incomingUrl = event.url;

                // Parse explicit tokens on resume

                if (incomingUrl.startsWith('com.upcorp.ano://')) {
                    try {
                        let hashPart = '';
                        if (incomingUrl.includes('#')) {
                            hashPart = incomingUrl.substring(incomingUrl.indexOf('#'));

                            // Extract access_token and refresh_token from the hash
                            const hashParams = new URLSearchParams(hashPart.substring(1)); // Remove the '#'
                            const accessToken = hashParams.get('access_token');
                            const refreshToken = hashParams.get('refresh_token');

                            if (accessToken && refreshToken) {
                                const { data, error } = await supabase.auth.setSession({
                                    access_token: accessToken,
                                    refresh_token: refreshToken
                                });

                                if (error) {
                                    console.error("Erreur Session: ", error.message);
                                }
                            }

                            // Let the browser/supabase know the hash changed just in case
                            window.location.hash = hashPart;
                            router.replace('/feed');
                        } else {
                            const url = new URL(incomingUrl);
                            const code = url.searchParams.get('code');

                            // If code is not empty, exchange it
                            if (code && code.trim() !== '') {
                                const { data, error } = await supabase.auth.exchangeCodeForSession(code);
                                if (error) {
                                    console.error("Erreur Echange Code: ", error.message);
                                }
                            }

                            // Whether code existed or was inexplicably empty, direct to feed
                            // The session listener might pick it up automatically anyway
                            router.replace('/feed');
                        }
                    } catch (err) {
                        console.error("Error connecting: ", err);
                    }
                }
            });
        }

        // Initialize session
        supabase.auth.getSession().then(({ data: { session } }: any) => {
            if (mounted) {
                setSession(session)
                setUser(session?.user ?? null)
                setIsLoading(false)

                // Handle initial auth redirect
                if (!session && pathname && !publicRoutes.includes(pathname)) {
                    router.replace('/login')
                }
            }
        })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
            if (mounted) {
                setSession(session)
                setUser(session?.user ?? null)
                setIsLoading(false)

                if (!session && pathname && !publicRoutes.includes(pathname)) {
                    router.replace('/login')
                }
            }
        })

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [pathname, router, supabase.auth])

    return (
        <AuthContext.Provider value={{ session, user, isLoading }}>
            {children}
        </AuthContext.Provider>
    )
}
