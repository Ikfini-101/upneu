'use client'

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SatirEmptyStateProps {
    message?: string;
    submessage?: string;
    animate?: boolean;
    className?: string;
}

export function SatirEmptyState({
    message = "Aucun contenu pour le moment",
    submessage,
    animate = true,
    className
}: SatirEmptyStateProps) {
    const MotionDiv = animate ? motion.div : 'div';

    const animationProps = animate ? {
        animate: {
            opacity: [0.6, 1, 0.6],
            scale: [0.98, 1, 0.98]
        },
        transition: {
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
        }
    } : {};

    return (
        <div className={cn("flex flex-col items-center justify-center py-16 px-6", className)}>
            <MotionDiv
                className="satir-square-pattern w-32 h-32 mb-6"
                {...animationProps}
            />
            <p className="text-center text-muted-foreground font-medium">
                {message}
            </p>
            {submessage && (
                <p className="text-center text-muted-foreground/60 text-sm mt-2">
                    {submessage}
                </p>
            )}
        </div>
    );
}
