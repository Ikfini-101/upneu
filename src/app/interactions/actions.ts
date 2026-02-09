'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// --- LIKES ---

export async function toggleLike(confessionId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non connecté" };

    // Check if already liked
    const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('confession_id', confessionId)
        .single();

    if (existingLike) {
        // Unlike
        await supabase.from('likes').delete().eq('id', existingLike.id);
    } else {
        // Like
        await supabase.from('likes').insert({
            user_id: user.id,
            confession_id: confessionId
        });

        // Notify author
        const { data: confession } = await supabase.from('confessions').select('user_id').eq('id', confessionId).single();
        if (confession && confession.user_id !== user.id) {
            await supabase.from('notifications').insert({
                user_id: confession.user_id,
                type: 'like',
                content: "Quelqu'un soutient votre confession",
                related_id: confessionId,
                read: false
            });
        }
    }

    revalidatePath('/feed');
    return { success: true };
}

// --- COMMENTS (CONSEILS) ---

export async function addComment(confessionId: string, content: string, parentId?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non connecté" };

    // Get active mask
    const { data: mask } = await supabase
        .from('masks')
        .select('id, name')
        .eq('user_id', user.id)
        .single();

    if (!mask) return { error: "Masque requis" };

    const { error } = await supabase.from('comments').insert({
        user_id: user.id,
        mask_id: mask.id,
        confession_id: confessionId,
        parent_id: parentId || null,
        content
    });

    if (error) return { error: error.message };

    // Notify author of confession
    const { data: confession } = await supabase.from('confessions').select('user_id').eq('id', confessionId).single();
    if (confession && confession.user_id !== user.id) {
        await supabase.from('notifications').insert({
            user_id: confession.user_id,
            type: 'comment',
            content: `${mask.name} vous a donné un conseil`,
            related_id: confessionId,
            read: false
        });
    }

    // Notify parent comment author (Reply)
    if (parentId) {
        const { data: parentComment } = await supabase
            .from('comments')
            .select('user_id')
            .eq('id', parentId)
            .single();

        // Notify if parent exists and is not self, and is NOT the confession author (to avoid double notif if author replied to themselves? No, reply to author's comment on their own post)
        // Actually, if I reply to Author's comment, Author gets "New Advice" (on post) AND "Reply to comment".
        // Let's filter: if parentComment.user_id === confession.user_id, do we send both?
        // "New advice" is for the POST. "Reply" is for the COMMENT.
        // It's better to be specific.
        // If parentId is set, it IS a reply. Does it count as a "advice on confession"? Yes.
        // But maybe we should only send "Reply" if it's a thread.
        // Simplest: Send both if different.

        if (parentComment && parentComment.user_id !== user.id) {
            // Check if we already notified this user via the confession notification
            if (confession && parentComment.user_id === confession.user_id) {
                // User is both confession author AND parent comment author.
                // They already got "New Advice". Maybe "Reply" is more specific?
                // Let's send "Reply" INSTEAD of "Advice" if it's a reply?
                // Hard to coordinate because the block above runs first.
                // Let's just send both for now, or live with "New Advice" covering it.
                // Actually, "Reply" is more engaging.
                // I will add a check: if parent_id is set, maybe the first notification should be skipped or different?
                // But `addComment` uses `parentId` to distinguish.
                // Let's keep it simple: Just notify parent author regardless. 
                // Spam risk low (1 reply = 1 notif).

                await supabase.from('notifications').insert({
                    user_id: parentComment.user_id,
                    type: 'comment', // Using comment type as fallback
                    content: `${mask.name} a répondu à votre commentaire`,
                    related_id: confessionId,
                    read: false
                });
            } else {
                // Parent author is distinct from confession author. Send notification.
                await supabase.from('notifications').insert({
                    user_id: parentComment.user_id,
                    type: 'comment',
                    content: `${mask.name} a répondu à votre commentaire`,
                    related_id: confessionId,
                    read: false
                });
            }
        }
    }

    revalidatePath('/feed');
    return { success: true };
}

// --- COMMENT VOTES ---

export async function toggleCommentVote(commentId: string, vote: boolean) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non connecté" };

    // Check existing vote
    const { data: existingVote } = await supabase
        .from('comment_votes')
        .select('id, vote')
        .eq('user_id', user.id)
        .eq('comment_id', commentId)
        .single();

    if (existingVote) {
        if (existingVote.vote === vote) {
            // Toggle off (remove vote)
            await supabase.from('comment_votes').delete().eq('id', existingVote.id);
        } else {
            // Change vote
            await supabase.from('comment_votes').update({ vote }).eq('id', existingVote.id);
        }
    } else {
        // New vote
        await supabase.from('comment_votes').insert({
            user_id: user.id,
            comment_id: commentId,
            vote
        });
    }

    revalidatePath('/feed');
    return { success: true };
}

// --- VALIDATION ---

export async function getPendingConfessions() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get confessions that are pending AND that the user hasn't voted on yet
    // This is a simplified query; normally requires "not in" subquery or similar
    // For MVP Phase 4, we just fetch pending
    const { data } = await supabase
        .from('confessions')
        .select(`
            id,
            content,
            created_at,
            mask:masks(name, sex, age, city)
        `)
        .eq('status', 'pending')
        .neq('user_id', user?.id || '') // Don't validate own confessions
        .limit(10);

    return data || [];
}

export async function submitVote(confessionId: string, approved: boolean) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non connecté" };

    const { error } = await supabase.from('validations').insert({
        user_id: user.id,
        confession_id: confessionId,
        vote: approved
    });

    if (error) return { error: error.message };

    // Check if we have enough votes to validate/reject
    // This logic would typically be in a Database Trigger or Edge Function
    // For MVP, we'll keep it simple: just record the vote.

    return { success: true };
}

// --- VEILLES (FOLLOWS) ---

export async function toggleVeille(maskId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Non connecté" };

    // Check if already following (veillant)
    const { data: existingVeille } = await supabase
        .from('veilles')
        .select('id')
        .eq('user_id', user.id)
        .eq('mask_id', maskId)
        .single();

    if (existingVeille) {
        // Unfollow
        const { error } = await supabase.from('veilles').delete().eq('id', existingVeille.id);
        if (error) return { success: false, error: error.message };
        return { success: true, isFollowing: false };
    } else {
        // Follow
        const { error } = await supabase.from('veilles').insert({
            user_id: user.id,
            mask_id: maskId
        });

        if (error) return { success: false, error: error.message };

        return { success: true, isFollowing: true };
    }
}


// --- REPORTS & MODERATION ---
