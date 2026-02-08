'use client'

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getModerationQueue, getModerationStats, restoreConfession } from './actions';
import { ArrowLeft, Flag, Eye, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

type FilterType = 'all' | 'R1' | 'R2' | 'critical';

const StatusBadge = ({ status }: { status: string }) => {
    const colors = {
        'hidden_pending_review': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        'removed_high_risk': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        'auto_deleted_mass_reports': 'bg-red-500/20 text-red-400 border-red-500/30',
        'auto_deleted_absolute_threshold': 'bg-red-700/20 text-red-300 border-red-700/30'
    };

    const labels = {
        'hidden_pending_review': 'Masqué (R1)',
        'removed_high_risk': 'Retiré (R2)',
        'auto_deleted_mass_reports': 'Supprimé (R3)',
        'auto_deleted_absolute_threshold': 'Supprimé (R4)'
    };

    return (
        <span className={`px-2 py-1 rounded-md text-xs font-medium border ${colors[status as keyof typeof colors] || 'bg-gray-500/20 text-gray-400'}`}>
            {labels[status as keyof typeof labels] || status}
        </span>
    );
};

export default function ModerationDashboard() {
    const [queue, setQueue] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [filter, setFilter] = useState<FilterType>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [filter]);

    const loadData = async () => {
        setLoading(true);
        const [queueData, statsData] = await Promise.all([
            getModerationQueue(filter),
            getModerationStats()
        ]);
        setQueue(queueData);
        setStats(statsData);
        setLoading(false);
    };

    const handleRestore = async (id: string) => {
        if (!confirm('Restaurer ce contenu et le rendre visible dans le feed ?')) return;

        const result = await restoreConfession(id);
        if (result.success) {
            toast.success('Contenu restauré');
            loadData();
        } else {
            toast.error(result.error || 'Erreur');
        }
    };

    return (
        <div className="min-h-screen bg-background p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/feed">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Modération automatique</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Système à 4 niveaux - Gestion des signalements
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card className="p-4 border-yellow-500/30">
                        <div className="text-sm text-muted-foreground">En révision (R1)</div>
                        <div className="text-2xl font-bold text-yellow-400">{stats.byStatus.hidden_pending_review}</div>
                    </Card>
                    <Card className="p-4 border-orange-500/30">
                        <div className="text-sm text-muted-foreground">Haut risque (R2)</div>
                        <div className="text-2xl font-bold text-orange-400">{stats.byStatus.removed_high_risk}</div>
                    </Card>
                    <Card className="p-4 border-red-500/30">
                        <div className="text-sm text-muted-foreground">Supprimés (R3+R4)</div>
                        <div className="text-2xl font-bold text-red-400">
                            {stats.byStatus.auto_deleted_mass_reports + stats.byStatus.auto_deleted_absolute_threshold}
                        </div>
                    </Card>
                    <Card className="p-4 border-primary/30">
                        <div className="text-sm text-muted-foreground">24h - Actions</div>
                        <div className="text-2xl font-bold text-primary">{stats.recentActions}</div>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-2 mb-6 flex-wrap">
                <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilter('all')}
                >
                    Tous ({stats?.totalModerated || 0})
                </Button>
                <Button
                    variant={filter === 'R1' ? 'default' : 'outline'}
                    onClick={() => setFilter('R1')}
                >
                    R1 - Révision ({stats?.byStatus.hidden_pending_review || 0})
                </Button>
                <Button
                    variant={filter === 'R2' ? 'default' : 'outline'}
                    onClick={() => setFilter('R2')}
                >
                    R2 - Haut risque ({stats?.byStatus.removed_high_risk || 0})
                </Button>
                <Button
                    variant={filter === 'critical' ? 'default' : 'outline'}
                    onClick={() => setFilter('critical')}
                >
                    🚨 Critique (R3+R4)
                </Button>
            </div>

            {/* Queue Table */}
            {loading ? (
                <div className="text-center p-8 text-muted-foreground">Chargement...</div>
            ) : queue.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">
                    Aucun contenu modéré dans cette catégorie
                </Card>
            ) : (
                <div className="space-y-3">
                    {queue.map((item) => (
                        <Card key={item.id} className="p-4 border-white/5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-3">
                                        <StatusBadge status={item.moderation_status} />
                                        <span className="text-xs text-muted-foreground">
                                            Règle: <span className="font-mono text-primary">{item.moderation_rule}</span>
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {item.total_reports_at_trigger} signalement{item.total_reports_at_trigger > 1 ? 's' : ''}
                                        </span>
                                    </div>

                                    <p className="text-sm line-clamp-2 text-foreground">
                                        {item.content}
                                    </p>

                                    <div className="flex items-center gap-4 text-xs text-muted-foreground/70">
                                        <span>
                                            Posté: {new Date(item.created_at).toLocaleDateString('fr-FR')}
                                        </span>
                                        <span>
                                            Modéré: {new Date(item.moderation_triggered_at).toLocaleString('fr-FR')}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm">
                                        <Eye className="h-4 w-4 mr-2" />
                                        Détails
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRestore(item.id)}
                                    >
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                        Restaurer
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
