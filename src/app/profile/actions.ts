import { createClient } from "@/lib/supabase/client";
import { Confession } from "../feed/actions";

export async function getUserConfessions() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('confessions')
        .select(`
            id,
            content,
            created_at,
            mask:masks (
                name,
                sex,
                age,
                city
            ),
            comments (
                id,
                content,
                created_at,
                mask:masks (
                    name
                )
            ),
            likes (count)
        `)
        .eq('user_id', user.id) // Only my confessions
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching user confessions:", error);
        return [];
    }

    return data as unknown as Confession[];
}

export async function getUserProfile() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Get active mask
    const { data: mask } = await supabase
        .from('masks')
        .select('*')
        .eq('user_id', user.id)
        .single();

    return mask;
}

export async function deleteAccount() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Utilisateur non connecté" };
    }

    // Delete the mask
    const { error } = await supabase
        .from('masks')
        .delete()
        .eq('user_id', user.id);

    if (error) {
        console.error("Error deleting account/mask:", error);
        return { error: "Erreur lors de la suppression du compte" };
    }

    // Sign out logic
    await supabase.auth.signOut();

    return { success: true };
}

export async function getCurrentUserId() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || '';
}
