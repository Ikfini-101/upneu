'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code');
            const next = searchParams.get('next') ?? '/feed';

            if (code) {
                const supabase = createClient();
                const { error } = await supabase.auth.exchangeCodeForSession(code);

                if (!error) {
                    router.push(next);
                } else {
                    console.error('Auth error:', error);
                    setError(error.message);
                    setTimeout(() => router.push('/login?error=auth-code-error'), 3000);
                }
            } else {
                // No code, maybe already logged in or direct access?
                // Check session just in case
                const supabase = createClient();
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    router.push(next);
                } else {
                    router.push('/login');
                }
            }
        };

        handleCallback();
    }, [router, searchParams]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
                <p className="text-red-500 mb-4">Erreur d'authentification : {error}</p>
                <p className="text-sm text-muted-foreground">Redirection vers la connexion...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-lg animate-pulse">Finalisation de la connexion...</p>
        </div>
    );
}
