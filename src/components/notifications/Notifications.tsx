'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, X, Check } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { getNotifications, getUnreadCount, markAllNotificationsAsRead, markNotificationAsRead, Notification } from '@/app/notifications/actions'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function Notifications() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const supabase = createClient()
    const dropdownRef = useRef<HTMLDivElement>(null)

    const fetchNotifications = async () => {
        const [notifs, count] = await Promise.all([
            getNotifications(),
            getUnreadCount()
        ])
        setNotifications(notifs)
        setUnreadCount(count)
    }

    useEffect(() => {
        fetchNotifications()

        const setupRealtime = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const channel = supabase
                .channel('realtime_notifications')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                }, (payload: any) => {
                    setNotifications(prev => [payload.new as Notification, ...prev])
                    setUnreadCount(prev => prev + 1)
                    toast.info("Nouvelle notification !")
                })
                .subscribe()

            return () => { supabase.removeChannel(channel) }
        }
        setupRealtime()

        // Click outside to close
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const toggleOpen = () => {
        const newState = !isOpen
        setIsOpen(newState)
        if (newState) {
            fetchNotifications()
        }
    }

    const handleMarkAllRead = async () => {
        await markAllNotificationsAsRead()
        setNotifications(notifications.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <Button variant="ghost" size="icon" className="relative text-white/80 hover:text-white hover:bg-white/10" onClick={toggleOpen}>
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 animate-pulse ring-2 ring-background" />
                )}
            </Button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                        <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAllRead} className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                                <Check className="h-3 w-3" /> Tout lire
                            </button>
                        )}
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-xs">
                                Aucune notification récente.
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className={cn(
                                            "p-4 border-b border-white/5 hover:bg-white/5 transition-colors flex gap-3 items-start cursor-pointer group",
                                            !notif.read ? "bg-primary/5" : "opacity-80"
                                        )}
                                        onClick={async () => {
                                            if (!notif.read) {
                                                await markNotificationAsRead(notif.id)
                                                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))
                                                setUnreadCount(prev => Math.max(0, prev - 1))
                                            }
                                        }}
                                    >
                                        <div className="mt-1.5 shrink-0">
                                            <div className={cn("h-2 w-2 rounded-full transition-colors", !notif.read ? "bg-primary" : "bg-transparent group-hover:bg-white/10")} />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-xs text-foreground/90 leading-relaxed font-light">
                                                {notif.content}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground/60">
                                                {new Date(notif.created_at).toLocaleDateString()} • {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
