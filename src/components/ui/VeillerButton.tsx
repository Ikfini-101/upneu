"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * Props for the VeillerButton component.
 * @property targetId - ID of the entity (mask) to follow/veiller.
 * @property initialIsVeilling - Initial state of the relationship.
 * @property onToggle - Async function to toggle the state on the server. Should return { success: boolean, error?: string }.
 */
interface VeillerButtonProps {
    targetId: string;
    initialIsVeilling: boolean;
    onToggle: (id: string) => Promise<{ success: boolean; error?: string }>;
    className?: string;
    size?: "sm" | "md";
}

/**
 * VeillerButton - "Care/Watch" Button Component
 * 
 * Lead Engineering Implementation Notes:
 * - **Optimistic UI**: State updates immediately for perceived performance (0ms latency).
 * - **Rollback Mechanism**: Reverts state if server action fails.
 * - **Micro-interactions**: Uses Framer Motion for tap scale, color transitions, and icon pop-in.
 * - **Debouncing**: Prevents rapid-fire API calls via strict loading state.
 * - **Semantics**: Uses correct ARIA attributes for accessibility.
 * - **Aesthetics**: "Ghost" style for inactive (non-intrusive), "Amber/Gold" for active (warmth/value).
 */
export function VeillerButton({
    targetId,
    initialIsVeilling,
    onToggle,
    className,
    size = "sm"
}: VeillerButtonProps) {
    // Local state for immediate feedback
    // We use useState because useOptimistic (Next.js 14) is overkill for this isolated component
    // and complex to integrate with pure client-side async flows without form actions.
    const [isVeilling, setIsVeilling] = useState(initialIsVeilling);
    const [isLoading, setIsLoading] = useState(false);

    // Memoized handler to prevent recreation on renders
    const handleToggle = useCallback(async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isLoading) return; // Prevent double-clicks

        // 1. Optimistic Update
        setIsLoading(true);
        const previousState = isVeilling;
        const newState = !isVeilling;

        // Instant visual feedback
        setIsVeilling(newState);

        // 2. User Feedback (Toast)
        // We only toast on significant state changes effectively, or keep it subtle.
        // For "Veiller", a confirmation feels reassuring.
        if (newState) {
            toast.message("Veille activée 🛡️", {
                description: "Vous protégez ce masque et recevrez ses nouvelles.",
                duration: 2000,
            });
        }

        try {
            // 3. Server Action
            // We await the server response in background (while UI is already updated)
            const result = await onToggle(targetId);

            if (!result.success) {
                throw new Error(result.error || "Erreur inconnue");
            }

            // Success: State remains as is (optimized)
        } catch (error) {
            // 4. Rollback on Error
            console.error("Veille toggle failed:", error);
            setIsVeilling(previousState);
            toast.error("Impossible de modifier la veille", {
                description: "Une erreur est survenue, veuillez réessayer.",
            });
        } finally {
            // Unlock interaction
            setIsLoading(false);
        }
    }, [isVeilling, isLoading, onToggle, targetId]);

    // Color Palette Logic
    // Active: Solid Amber (Reassuring/Protected) - strong visual weight
    // Inactive: Outlined Amber (Inviting/Precious) - clearly visible to attract the eye
    const activeColorClass = "bg-amber-500 text-amber-950 font-semibold border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:bg-amber-400";
    const inactiveColorClass = "bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50";

    return (
        <motion.button
            onClick={handleToggle}
            className={cn(
                "relative flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 border backdrop-blur-sm",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
                // Size variants
                size === "sm" && "h-7 px-3 text-[11px]",
                size === "md" && "h-9 px-4 text-sm",
                // Dynamic colors
                isVeilling ? activeColorClass : inactiveColorClass,
                className
            )}
            // Framer Motion Micro-interactions
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05, y: -1 }}
            layout
            aria-pressed={isVeilling}
            aria-label={isVeilling ? "Ne plus veiller sur ce masque" : "Veiller sur ce masque"}
            disabled={isLoading}
        >
            <AnimatePresence mode="wait" initial={false}>
                {isLoading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="flex items-center justify-center"
                    >
                        <Loader2 className="animate-spin w-3 h-3" />
                    </motion.div>
                ) : isVeilling ? (
                    <motion.div
                        key="veilling"
                        initial={{ opacity: 0, scale: 0.8, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -5 }}
                        className="flex flex-row items-center gap-1.5 whitespace-nowrap leading-none"
                    >
                        {/* Glowing Eye or Shield for Protection */}
                        <ShieldCheck className="w-3.5 h-3.5 fill-current shrink-0" />
                        <span>Je veille</span>
                    </motion.div>
                ) : (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0, scale: 0.8, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 5 }}
                        className="flex flex-row items-center gap-1.5 whitespace-nowrap leading-none"
                    >
                        <Eye className="w-3.5 h-3.5 shrink-0" />
                        <span>Veiller</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Subtle glow effect for active state */}
            {isVeilling && (
                <motion.div
                    layoutId="glow"
                    className="absolute inset-0 rounded-full bg-amber-500/5 -z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                />
            )}
        </motion.button>
    );
}
