'use server'

import { createClient } from "@/lib/supabase/server";

export type Notification = {
    id: string;
    type: 'comment' | 'reply' | 'like_confession' | 'like_comment' | 'karma_milestone' | 'validation' | 'message';
    content: string;
    related_id: string;
    read: boolean;
    created_at: string;
};

export async function getNotifications() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50); // Limit to last 50 for performance

    if (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }

    return data as Notification[];
}

export async function getUnreadCount() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return 0;

    const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);

    if (error) {
        console.error("Error fetching unread count:", error);
        return 0;
    }

    return count || 0;
}

export async function markNotificationAsRead(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Non connecté" };

    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) return { error: error.message };
    return { success: true };
}

export async function markAllNotificationsAsRead() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Non connecté" };

    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

    if (error) return { error: error.message };
    return { success: true };
}
