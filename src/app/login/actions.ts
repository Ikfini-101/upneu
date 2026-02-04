'use server'

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signInWithPhone(phone: string) {
    const supabase = await createClient();

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

export async function signInWithProvider(provider: 'google' | 'facebook' | 'apple') {
    const supabase = await createClient();
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`;

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
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            // Check if email link redirect works, usually just Magic Link
            emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
        }
    });

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}

export async function verifyOtp(phone: string, token: string) {
    const supabase = await createClient();

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

    // If we have an error other than "no rows found", handle it
    // But for now, if no mask, we redirect to wizard

    if (!masks) {
        redirect('/wizard');
    }

    redirect('/feed');
}
