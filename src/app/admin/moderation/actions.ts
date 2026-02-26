import { createClient } from "@/lib/supabase/client";

// ============================================
// GET MODERATION QUEUE
// ============================================

export async function getModerationQueue(filter: 'all' | 'R1' | 'R2' | 'critical' = 'all') {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    // TODO: Add admin role check when RBAC is implemented
    // For now, any authenticated user can access (will be restricted later)

    let query = supabase
        .from('confessions')
        .select('id, content, moderation_status, moderation_rule, total_reports_at_trigger, moderation_triggered_at, created_at')
        .neq('moderation_status', 'active'); // Exclude active confessions

    // Apply filter
    if (filter === 'R1') {
        query = query.eq('moderation_status', 'hidden_pending_review');
    } else if (filter === 'R2') {
        query = query.eq('moderation_status', 'removed_high_risk');
    } else if (filter === 'critical') {
        query = query.in('moderation_status', [
            'auto_deleted_mass_reports',
            'auto_deleted_absolute_threshold'
        ]);
    }

    const { data, error } = await query
        .order('moderation_triggered_at', { ascending: false })
        .limit(100); // Limit to last 100 for performance

    if (error) {
        console.error('Error fetching moderation queue:', error);
        return [];
    }

    return data || [];
}

// ============================================
// GET MODERATION DETAILS
// ============================================

export async function getModerationDetails(confessionId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Fetch confession details
    const { data: confession } = await supabase
        .from('confessions')
        .select(`
            id,
            content,
            created_at,
            moderation_status,
            moderation_rule,
            moderation_triggered_at,
            total_reports_at_trigger,
            mask:masks(name, age, city, sex)
        `)
        .eq('id', confessionId)
        .single();

    if (!confession) return null;

    // Fetch moderation logs for this confession
    const { data: logs } = await supabase
        .from('moderation_logs')
        .select('*')
        .eq('confession_id', confessionId)
        .order('triggered_at', { ascending: false });

    // Fetch all reports (for audit)
    const { data: reports, count: reportCount } = await supabase
        .from('confession_reports')
        .select('created_at, created_at_ms', { count: 'exact' })
        .eq('confession_id', confessionId)
        .order('created_at_ms', { ascending: false });

    return {
        confession,
        logs: logs || [],
        reports: reports || [],
        totalReports: reportCount || 0
    };
}

// ============================================
// RESTORE CONFESSION
// ============================================

export async function restoreConfession(confessionId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Non authentifié" };

    // TODO: Add admin role check when RBAC is implemented

    // Restore to active status
    const { error } = await supabase
        .from('confessions')
        .update({
            moderation_status: 'active',
            // Keep moderation_triggered_at and moderation_rule for audit trail
        })
        .eq('id', confessionId);

    if (error) {
        console.error('Error restoring confession:', error);
        return { error: 'Erreur lors de la restoration' };
    }

    // Log the manual restoration
    await supabase
        .from('moderation_logs')
        .insert({
            confession_id: confessionId,
            rule_triggered: 'MANUAL_RESTORE',
            status_applied: 'active',
            total_reports: 0,
            time_window_seconds: null,
            metadata: {
                admin_id: user.id,
                restored_at: new Date().toISOString(),
                automatic: false
            }
        });



    return { success: true };
}

// ============================================
// GET MODERATION STATS (DASHBOARD OVERVIEW)
// ============================================

export async function getModerationStats() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Count by status
    const { data: statsByStatus } = await supabase
        .from('confessions')
        .select('moderation_status')
        .neq('moderation_status', 'active');

    const stats = {
        hidden_pending_review: 0,
        removed_high_risk: 0,
        auto_deleted_mass_reports: 0,
        auto_deleted_absolute_threshold: 0
    };

    statsByStatus?.forEach((item: any) => {
        if (item.moderation_status in stats) {
            stats[item.moderation_status as keyof typeof stats]++;
        }
    });

    // Recent activity (last 24h)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentActions } = await supabase
        .from('moderation_logs')
        .select('*', { count: 'exact', head: true })
        .gte('triggered_at', yesterday);

    return {
        byStatus: stats,
        recentActions: recentActions || 0,
        totalModerated: Object.values(stats).reduce((a, b) => a + b, 0)
    };
}
