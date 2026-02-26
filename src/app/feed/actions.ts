'use server'

import { createClient } from "@/lib/supabase/server";

export type Confession = {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
    audio_url?: string | null;
    audio_duration?: number | null;
    confession_type: 'text' | 'audio';
    mask: {
        id: string;
        name: string;
        sex: 'H' | 'F';
        age: number;
        city: string;
        karma: number;
    } | null;
    comments: {
        id: string;
        content: string;
        created_at: string;
        parent_id: string | null;
        mask: {
            name: string;
            karma: number;
        } | null;
        comment_votes: {
            user_id: string;
            vote: boolean;
        }[];
    }[];
    likes: {
        count: number;
    }[];
};

export async function createConfession(content: string, audio?: { url: string, duration: number }) {
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
        status: 'pending', // Default status
        audio_url: audio?.url || null,
        audio_duration: audio?.duration || null,
        confession_type: audio ? 'audio' : 'text'
    }).select('id').single();

    if (error) return { error: error.message };

    // --- NOTIFY FOLLOWERS (VEILLEURS) ---
    const { data: veilleurs } = await supabase
        .from('veilles')
        .select('user_id')
        .eq('mask_id', mask.id);

    if (veilleurs && veilleurs.length > 0) {
        const notifications = veilleurs.filter(v => v.user_id !== user.id).map(v => ({
            user_id: v.user_id,
            type: 'message',
            content: `Le masque que vous veillez vient de poster une confession ${audio ? 'audio 🎙️' : ''}.`,
            related_id: mask.id,
            read: false
        }));
        if (notifications.length > 0) await supabase.from('notifications').insert(notifications);
    }

    return { success: true };
}

export async function getFeedConfessions() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('confessions')
        .select(`
            id,
            user_id,
            content,
            created_at,
            audio_url,
            audio_duration,
            confession_type,
            mask: masks(
                id,
                name,
                sex,
                age,
                city,
                karma
            ),
            comments(
                id,
                content,
                created_at,
                parent_id,
                mask: masks(
                    name,
                    karma
                ),
                comment_votes(
                    user_id,
                    vote
                )
            ),
            likes(count)
        `)
        .eq('moderation_status', 'active') // Only show active (non-moderated) content
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching feed:", JSON.stringify(error, null, 2));
        return [];
    }

    return data as unknown as Confession[];
}
