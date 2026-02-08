'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Heart, MessageCircle, Check, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getNotifications, markNotificationAsRead } from './actions'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type Notification = {
    id: string
    type: 'like' | 'comment' | 'validation' | 'message'
    content: string
    read: boolean
    created_at: string
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        loadNotifications()
    }, [])

    const loadNotifications = async () => {
        setLoading(true)
        const data = await getNotifications()
        setNotifications(data as Notification[])
        setLoading(false)
    }

    const handleRead = async (id: string) => {
        await markNotificationAsRead(id)
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    }

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'like': return <Heart className="h-5 w-5 text-pink-500" />
            case 'comment': return <MessageCircle className="h-5 w-5 text-blue-500" />
            case 'validation': return <Check className="h-5 w-5 text-green-500" />
            case 'message': return <MessageCircle className="h-5 w-5 text-purple-500" />
            default: return <Bell className="h-5 w-5" />
        }
    }

    return (
        <div className="min-h-screen bg-background p-4 max-w-md mx-auto relative">
            <header className="flex items-center gap-4 mb-6 pt-4">
                <Link href="/feed">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">Notifications</h1>
            </header>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center p-8 text-muted-foreground">Chargement...</div>
                ) : notifications.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground">Aucune notification.</div>
                ) : (
                    notifications.map((notif, i) => (
                        <motion.div
                            key={notif.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => handleRead(notif.id)}
                        >
                            <Card className={cn(
                                "p-4 flex items-start gap-4 transition-colors border-white/5",
                                notif.read ? "bg-card/20" : "bg-card/60 border-primary/20"
                            )}>
                                <div className="mt-1 p-2 rounded-full bg-background/50">
                                    {getIcon(notif.type)}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium leading-none mb-1">
                                        {notif.type === 'like' && "Nouveau soutien"}
                                        {notif.type === 'comment' && "Nouveau conseil"}
                                        {notif.type === 'validation' && "Statut validation"}
                                        {notif.type === 'message' && "Nouveau message"}
                                    </p>
                                    <p className="text-sm text-muted-foreground font-light">
                                        {notif.content}
                                    </p>
                                    <p className="text-xs text-muted-foreground/50 mt-2">
                                        {new Date(notif.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                {!notif.read && (
                                    <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                                )}
                            </Card>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    )
}
