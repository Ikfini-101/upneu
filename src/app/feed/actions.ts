'use server'

import { createClient } from "@/lib/supabase/server";

export type Confession = {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
    mask: {
        name: string;
        sex: 'H' | 'F';
        age: number;
        city: string;

    } | null;
    comments: {
        id: string;
        content: string;
        created_at: string;
        mask: {
            name: string;
        } | null;
    }[];
    likes: {
        count: number;
    }[];
};

export async function createConfession(content: string) {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non connecté" };

    // Get active mask for user
    const { data: mask } = await supabase
        .from('masks')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!mask) return { error: "Aucun masque trouvé" };

    const { error } = await supabase.from('confessions').insert({
        user_id: user.id,
        mask_id: mask.id,
        content,
        status: 'pending' // Default status
    });

    if (error) return { error: error.message };

    return { success: true };
}

export async function getFeedConfessions() {
    const supabase = await createClient();

    // In a real scenario, we would filter by status='validated'
    // For Dev Phase 3, we might fetch all or just pending for visibility
    const { data, error } = await supabase
        .from('confessions')
        .select(`
            id,
            user_id,
            content,
            created_at,
            mask: masks(
                name,
                sex,
                age,
                city
            ),
            comments(
                id,
                content,
                created_at,
                mask: masks(
                    name
                )
            ),
            likes(count)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching feed:", error);
        return [];
    }

    return data as unknown as Confession[];
}
