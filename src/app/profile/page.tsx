'use client';

import { useEffect, useState } from "react";
import { getUserConfessions, getUserProfile, getCurrentUserId } from "./actions";
import { ConfessionCard } from "@/components/confessions/ConfessionCard";
import { VenetianMask, MapPin, Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DeleteAccountButton } from "@/components/profile/DeleteAccountButton";
import { Confession } from "../feed/actions";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [confessions, setConfessions] = useState<Confession[]>([]);
    const [mask, setMask] = useState<any>(null);
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        const fetchProfileData = async () => {
            if (!user) return;
            setLoading(true);

            const [fetchedConfessions, fetchedMask, fetchedUserId] = await Promise.all([
                getUserConfessions(),
                getUserProfile(),
                getCurrentUserId()
            ]);

            setConfessions(fetchedConfessions);
            setMask(fetchedMask);
            setCurrentUserId(fetchedUserId);
            setLoading(false);
        };

        if (user) {
            fetchProfileData();
        }
    }, [user]);

    if (authLoading || loading) {
        return <div className="flex justify-center items-center min-h-[60vh]">Chargement...</div>;
    }

    if (!user) {
        return null;
    }

    if (!mask) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p>Aucun profil trouvé.</p>
                <Link href="/login">
                    <Button>Se connecter</Button>
                </Link>
            </div>
        )
    }

    return (
        <main className="max-w-2xl mx-auto p-4 pb-24 space-y-8">
            <header className="space-y-6">
                <Link href="/feed" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour au fil
                </Link>

                <div className="bg-card/30 backdrop-blur-md rounded-3xl p-6 border border-white/5 flex flex-col md:flex-row items-center gap-6">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center border-2 border-primary/30 shadow-[0_0_30px_-5px_rgba(124,58,237,0.3)]">
                        <VenetianMask className="h-10 w-10 text-primary" />
                    </div>

                    <div className="flex flex-col items-center md:items-start gap-2 text-center md:text-left">
                        <h1 className="text-2xl font-bold text-foreground">{mask.name}</h1>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-full">
                                {mask.sex === 'H' ? 'Homme' : 'Femme'} • {mask.age} ans
                            </span>
                            <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-full">
                                <MapPin className="h-3 w-3" /> {mask.city}
                            </span>
                            <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-full">
                                <Calendar className="h-3 w-3" /> Membre depuis {new Date(mask.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <section className="space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    Mes Confessions ({confessions.length})
                </h2>

                {confessions.length === 0 ? (
                    <div className="text-center py-20 opacity-50 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                        <p>Vous n'avez rien confessé pour le moment.</p>
                    </div>
                ) : (
                    confessions.map((confession, index) => (
                        <ConfessionCard key={confession.id} confession={confession} index={index} currentUserId={currentUserId} />
                    ))
                )}
            </section>
        </main>
    );
}
