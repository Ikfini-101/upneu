import { cn } from "@/lib/utils";

interface SatirDividerProps {
    variant?: 'bands' | 'simple';
    opacity?: number;
    className?: string;
}

export function SatirDivider({
    variant = 'bands',
    opacity = 0.08,
    className
}: SatirDividerProps) {
    if (variant === 'simple') {
        return (
            <div
                className={cn("h-px w-full", className)}
                style={{
                    backgroundColor: `rgba(245,245,220,${opacity})`
                }}
            />
        );
    }

    return (
        <div
            className={cn("satir-divider-bands h-1.5 w-full", className)}
            style={{ opacity }}
        />
    );
}
