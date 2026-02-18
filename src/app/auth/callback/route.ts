import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    console.log("DEBUG: Auth Callback Hit", request.url);
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/feed";

    // Use X-Forwarded-Host if available (Cloudflare), otherwise fall back to Host or request.url
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = host ? `${protocol}://${host}` : new URL(request.url).origin;

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            return NextResponse.redirect(`${baseUrl}${next}`);
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${baseUrl}/login?error=auth-code-error`);
}
