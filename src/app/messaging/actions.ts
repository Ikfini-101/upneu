'use server'

import { createClient } from "@/lib/supabase/server";

// --- NOTIFICATIONS ---

export async function getNotifications() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

    return data || [];
}

export async function markNotificationAsRead(id: string) {
    const supabase = await createClient();
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    return { success: true };
}

// --- MESSAGING ---

export async function getConversations() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: conversations } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_a_id.eq.${user.id},participant_b_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

    if (!conversations) return [];

    // Enrich with partner info
    const enriched = await Promise.all(conversations.map(async (conv) => {
        const partnerId = conv.participant_a_id === user.id ? conv.participant_b_id : conv.participant_a_id;

        const { data: mask } = await supabase
            .from('masks')
            .select('name')
            .eq('user_id', partnerId)
            .single();

        return {
            ...conv,
            partner_name: mask?.name || "Anonyme"
        };
    }));

    return enriched;
}

export async function getMessages(conversationId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { messages: [], currentUserId: null };

    const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    return {
        messages: data || [],
        currentUserId: user.id
    };
}

export async function sendMessage(conversationId: string, content: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non connecté" };

    const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content
    });

    if (error) return { error: error.message };

    await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversationId);

    return { success: true };
}

export async function startConversation(targetUserId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non connecté" };

    if (targetUserId === user.id) return { error: "Vous ne pouvez pas vous parler à vous-même" };

    // Check existing
    const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant_a_id.eq.${user.id},participant_b_id.eq.${targetUserId}),and(participant_a_id.eq.${targetUserId},participant_b_id.eq.${user.id})`)
        .single();

    if (existing) {
        return { success: true, conversationId: existing.id };
    }

    // Create new
    const { data, error } = await supabase.from('conversations').insert({
        participant_a_id: user.id,
        participant_b_id: targetUserId, // Ensure this column is correct in DB schema
        last_message_at: new Date().toISOString()
    }).select().single();

    if (error) return { error: error.message };

    return { success: true, conversationId: data.id };
}
