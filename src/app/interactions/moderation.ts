import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

// ============================================
// MODERATION RULES CONFIGURATION
// ============================================

const MODERATION_RULES = {
    R1: { threshold: 4, windowMs: 30 * 1000, status: 'hidden_pending_review', windowSec: 30 },
    R2: { threshold: 10, windowMs: 5 * 60 * 1000, status: 'removed_high_risk', windowSec: 300 },
    R3: { threshold: 100, windowMs: 60 * 60 * 1000, status: 'auto_deleted_mass_reports', windowSec: 3600 },
    R4: { threshold: 1000, windowMs: null, status: 'auto_deleted_absolute_threshold', windowSec: null }
} as const;

type ModerationStatus =
    | 'active'
    | 'hidden_pending_review'
    | 'removed_high_risk'
    | 'auto_deleted_mass_reports'
    | 'auto_deleted_absolute_threshold';

// ============================================
// REPORT CONFESSION (MAIN ENTRY POINT)
// ============================================

export async function reportConfession(confessionId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Non authentifié" };

    // 1. Validate confession exists and is active
    const { data: confession } = await supabase
        .from('confessions')
        .select('id, moderation_status, user_id')
        .eq('id', confessionId)
        .single();

    if (!confession) return { error: "Confession introuvable" };
    if (confession.moderation_status !== 'active') {
        return { error: "Ce contenu n'est plus disponible" };
    }
    if (confession.user_id === user.id) {
        return { error: "Vous ne pouvez pas signaler votre propre contenu" };
    }

    // 2. Insert report with millisecond timestamp
    const nowMs = Date.now();
    const { error: insertError } = await supabase
        .from('confession_reports')
        .insert({
            confession_id: confessionId,
            reporter_id: user.id,
            created_at_ms: nowMs
        });

    if (insertError) {
        if (insertError.code === '23505') { // Unique constraint violation
            return { error: "Vous avez déjà signalé ce contenu" };
        }
        console.error('Report insert error:', insertError);
        return { error: "Erreur lors du signalement" };
    }

    // 3. Apply moderation rules
    const moderationResult = await applyModerationRules(supabase, confessionId, nowMs);


    return { success: true, ...moderationResult };
}

// ============================================
// APPLY MODERATION RULES (4-TIER LOGIC)
// ============================================

async function applyModerationRules(
    supabase: SupabaseClient,
    confessionId: string,
    currentTimeMs: number
) {
    // Fetch all reports for this confession (ordered by most recent first)
    const { data: reports } = await supabase
        .from('confession_reports')
        .select('created_at_ms')
        .eq('confession_id', confessionId)
        .order('created_at_ms', { ascending: false });

    if (!reports || reports.length === 0) {
        return { rule: null, totalReports: 0 };
    }

    const totalReports = reports.length;

    // RULE 4: Absolute threshold (1000 reports, any timeframe)
    // Priority: MAXIMUM - check first
    if (totalReports >= MODERATION_RULES.R4.threshold) {
        await applyRule(
            supabase,
            confessionId,
            'R4',
            MODERATION_RULES.R4.status as ModerationStatus,
            totalReports,
            null
        );
        return {
            rule: 'R4',
            status: MODERATION_RULES.R4.status,
            totalReports,
            message: `Suppression définitive (${totalReports} signalements)`
        };
    }

    // RULE 3: 100 reports within 1 hour (3600 seconds = 3600000 ms)
    const reportsIn1Hour = reports.filter(
        r => (currentTimeMs - r.created_at_ms) <= MODERATION_RULES.R3.windowMs!
    ).length;

    if (reportsIn1Hour >= MODERATION_RULES.R3.threshold) {
        await applyRule(
            supabase,
            confessionId,
            'R3',
            MODERATION_RULES.R3.status as ModerationStatus,
            totalReports,
            MODERATION_RULES.R3.windowSec!
        );
        return {
            rule: 'R3',
            status: MODERATION_RULES.R3.status,
            totalReports,
            reportsInWindow: reportsIn1Hour,
            message: `Suppression automatique (${reportsIn1Hour} signalements en 1h)`
        };
    }

    // RULE 2: 10 reports within 5 minutes (300 seconds = 300000 ms)
    const reportsIn5Min = reports.filter(
        r => (currentTimeMs - r.created_at_ms) <= MODERATION_RULES.R2.windowMs
    ).length;

    if (reportsIn5Min >= MODERATION_RULES.R2.threshold) {
        await applyRule(
            supabase,
            confessionId,
            'R2',
            MODERATION_RULES.R2.status as ModerationStatus,
            totalReports,
            MODERATION_RULES.R2.windowSec
        );
        return {
            rule: 'R2',
            status: MODERATION_RULES.R2.status,
            totalReports,
            reportsInWindow: reportsIn5Min,
            message: `Contenu retiré (${reportsIn5Min} signalements en 5min)`
        };
    }

    // RULE 1: 4 reports within 30 seconds (30000 ms)
    const reportsIn30Sec = reports.filter(
        r => (currentTimeMs - r.created_at_ms) <= MODERATION_RULES.R1.windowMs
    ).length;

    if (reportsIn30Sec >= MODERATION_RULES.R1.threshold) {
        await applyRule(
            supabase,
            confessionId,
            'R1',
            MODERATION_RULES.R1.status as ModerationStatus,
            totalReports,
            MODERATION_RULES.R1.windowSec
        );
        return {
            rule: 'R1',
            status: MODERATION_RULES.R1.status,
            totalReports,
            reportsInWindow: reportsIn30Sec,
            message: `Contenu masqué pour vérification (${reportsIn30Sec} signalements rapides)`
        };
    }

    // No rule triggered
    return {
        rule: null,
        totalReports,
        message: 'Signalement enregistré'
    };
}

// ============================================
// APPLY RULE (UPDATE DB + LOG)
// ============================================

async function applyRule(
    supabase: SupabaseClient,
    confessionId: string,
    rule: string,
    status: ModerationStatus,
    totalReports: number,
    timeWindowSeconds: number | null
) {
    const now = new Date().toISOString();

    // 1. Update confession with moderation status
    await supabase
        .from('confessions')
        .update({
            moderation_status: status,
            moderation_triggered_at: now,
            moderation_rule: rule,
            total_reports_at_trigger: totalReports
        })
        .eq('id', confessionId);

    // 2. Log the action for admin dashboard
    await supabase
        .from('moderation_logs')
        .insert({
            confession_id: confessionId,
            rule_triggered: rule,
            status_applied: status,
            total_reports: totalReports,
            time_window_seconds: timeWindowSeconds,
            metadata: {
                triggered_at_iso: now,
                automatic: true,
                timestamp_ms: Date.now()
            }
        });
}
