import { cn } from "@/lib/utils";

interface SatirBackgroundProps {
    variant?: 'weave' | 'none';
    className?: string;
    children?: React.ReactNode;
}

export function SatirBackground({
    variant = 'weave',
    className,
    children
}: SatirBackgroundProps) {
    const bgClasses = {
        weave: 'satir-bg-weave',
        none: ''
    };

    return (
        <div className={cn(bgClasses[variant], className)}>
            {children}
        </div>
    );
}
