import { Crown, Star, VenetianMask, AlertTriangle, Ban } from "lucide-react";
import React from "react";

export type Rank = {
    label: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
};

export function getRank(karma: number): Rank {
    if (karma >= 1000) {
        return {
            label: "Sage",
            icon: <Crown className="w-3 h-3" />,
            color: "text-amber-400",
            bg: "bg-amber-400/10 border-amber-400/20"
        };
    }
    if (karma >= 500) {
        return {
            label: "Guide",
            icon: <Star className="w-3 h-3" />,
            color: "text-blue-400",
            bg: "bg-blue-400/10 border-blue-400/20"
        };
    }
    if (karma >= 0) {
        return {
            label: "Membre",
            icon: <VenetianMask className="w-3 h-3" />,
            color: "text-slate-400",
            bg: "bg-slate-400/10 border-slate-400/20"
        };
    }
    if (karma >= -49) {
        return {
            label: "Surveillance",
            icon: <AlertTriangle className="w-3 h-3" />,
            color: "text-orange-500",
            bg: "bg-orange-500/10 border-orange-500/20"
        };
    }
    return {
        label: "Banni",
        icon: <Ban className="w-3 h-3" />,
        color: "text-red-500",
        bg: "bg-red-500/10 border-red-500/20"
    };
}
