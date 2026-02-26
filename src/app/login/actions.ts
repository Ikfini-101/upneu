import { createClient } from "@/lib/supabase/client";
import { Capacitor } from '@capacitor/core';

export async function signInWithPhone(phone: string) {
    const supabase = createClient();

    // Ensure E.164 format (dumb fix: add + if missing)
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone.trim()}`;

    const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
    });

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}

export async function signInWithProvider(provider: 'google' | 'facebook' | 'apple', redirectBase?: string) {
    const supabase = createClient();
    const origin = redirectBase || window.location.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    let redirectUrl = `${origin}/feed`; // Redirect straight to feed or root, AuthProvider handles it

    // If native iOS/Android, force the custom scheme for OAuth callback
    if (Capacitor.isNativePlatform()) {
        redirectUrl = 'com.upcorp.ano://feed';
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: redirectUrl,
        },
    });

    if (error) {
        return { error: error.message };
    }

    if (data.url) {
        return { url: data.url };
    }
}

export async function signInWithEmail(email: string) {
    const supabase = createClient();
    const origin = window.location.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            // Check if email link redirect works, usually just Magic Link
            emailRedirectTo: `${origin}/feed`,
        }
    });

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}

export async function verifyOtp(phone: string, token: string) {
    const supabase = createClient();

    // Verify the OTP
    const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
    })

    if (error) {
        return { error: error.message };
    }

    // Check if user has a mask
    const { data: masks, error: maskError } = await supabase
        .from('masks')
        .select('id')
        .eq('user_id', data.user?.id)
        .single();

    if (!masks) {
        return { redirect: '/wizard' };
    }

    return { redirect: '/feed' };
}
