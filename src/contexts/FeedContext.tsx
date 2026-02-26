'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Confession, getFeedConfessions } from '@/app/feed/actions';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

type FeedContextType = {
    confessions: Confession[];
    followedMaskIds: Set<string>;
    loading: boolean;
    scrollPosition: number;
    setScrollPosition: (pos: number) => void;
    refreshFeed: () => Promise<void>;
    lastFetched: number | null;
};

const FeedContext = createContext<FeedContextType | undefined>(undefined);

export function FeedProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const supabase = createClient();

    const [confessions, setConfessions] = useState<Confession[]>([]);
    const [followedMaskIds, setFollowedMaskIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [lastFetched, setLastFetched] = useState<number | null>(null);
    const [scrollPosition, setScrollPositionState] = useState(0);

    const isFetching = useRef(false);

    const setScrollPosition = (pos: number) => {
        setScrollPositionState(pos);
    };

    const fetchFeed = async (force = false) => {
        if (!user) return;
        if (isFetching.current) return;

        // Use cache if less than 5 minutes old and not forced
        const now = Date.now();
        if (!force && lastFetched && (now - lastFetched < 5 * 60 * 1000) && confessions.length > 0) {
            setLoading(false);
            return;
        }

        isFetching.current = true;
        setLoading(true);

        try {
            const data = await getFeedConfessions();
            setConfessions(data);

            const { data: userVeilles } = await supabase
                .from('veilles')
                .select('mask_id')
                .eq('user_id', user.id);

            setFollowedMaskIds(new Set(userVeilles?.map((v: any) => v.mask_id) || []));
            setLastFetched(now);
        } catch (error) {
            console.error("Error fetching feed:", error);
        } finally {
            setLoading(false);
            isFetching.current = false;
        }
    };

    useEffect(() => {
        if (user) {
            fetchFeed();
        } else {
            // Reset state on logout
            setConfessions([]);
            setFollowedMaskIds(new Set());
            setLastFetched(null);
            setScrollPositionState(0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, supabase]);

    return (
        <FeedContext.Provider value={{
            confessions,
            followedMaskIds,
            loading,
            scrollPosition,
            setScrollPosition,
            refreshFeed: () => fetchFeed(true),
            lastFetched
        }}>
            {children}
        </FeedContext.Provider>
    );
}

export function useFeed() {
    const context = useContext(FeedContext);
    if (context === undefined) {
        throw new Error('useFeed must be used within a FeedProvider');
    }
    return context;
}
