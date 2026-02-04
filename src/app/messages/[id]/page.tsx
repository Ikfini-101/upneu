'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getMessages, sendMessage } from '@/app/messaging/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Send, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ChatPage() {
    const { id } = useParams()
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const scrollRef = useRef<HTMLDivElement>(null)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [partnerMask, setPartnerMask] = useState<any>(null)

    // Poll for messages every 5s (MVP Realtime)
    useEffect(() => {
        loadMessages()
        const interval = setInterval(loadMessages, 5000)
        return () => clearInterval(interval)
    }, [id])

    useEffect(() => {
        // Scroll to bottom on new messages
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const loadMessages = async () => {
        if (!id) return
        const { messages, currentUserId } = await getMessages(id as string)
        setMessages(messages)
        setCurrentUserId(currentUserId)

        // Get partner's mask info from first message
        if (messages.length > 0) {
            const partnerMsg = messages.find((m: any) => m.sender_id !== currentUserId)
            if (partnerMsg?.sender_mask) {
                setPartnerMask(partnerMsg.sender_mask)
            }
        }
    }

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim()) return

        // Optimistic
        const tempMsg = {
            id: 'temp-' + Date.now(),
            content: newMessage,
            created_at: new Date().toISOString(),
            sender_id: 'me'
        }
        setMessages(prev => [...prev, tempMsg])
        setNewMessage("")

        await sendMessage(id as string, tempMsg.content)
        loadMessages()
    }

    // Format time (HH:MM)
    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div className="flex flex-col h-screen bg-background max-w-md mx-auto">
            {/* Header with Mask */}
            <header className="flex items-center gap-4 p-4 border-b border-white/5">
                <Button variant="ghost" size="icon" onClick={() => router.push('/messages')}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>

                {/* Partner Mask Display */}
                <div className="flex items-center gap-3 flex-1">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        {partnerMask?.avatar_url ? (
                            <img
                                src={partnerMask.avatar_url}
                                alt={partnerMask.pseudo}
                                className="h-full w-full rounded-full object-cover"
                            />
                        ) : (
                            <User className="h-5 w-5 text-primary" />
                        )}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-base font-semibold">
                            {partnerMask?.pseudo || 'Contact'}
                        </h1>
                        {partnerMask && (
                            <p className="text-xs text-muted-foreground">
                                {partnerMask.sexe === 'H' ? '👨' : '👩'} {partnerMask.ville}
                            </p>
                        )}
                    </div>
                </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={scrollRef}>
                {messages.map((msg) => {
                    const isMe = msg.sender_id === currentUserId || msg.sender_id === 'me';
                    return (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex",
                                isMe ? "justify-end" : "justify-start"
                            )}
                        >
                            <div
                                className={cn(
                                    "max-w-[75%] px-3 py-2 rounded-2xl flex flex-col gap-1",
                                    isMe
                                        ? "bg-primary text-primary-foreground rounded-br-none"
                                        : "bg-card/50 border border-white/5 rounded-bl-none"
                                )}
                            >
                                <p className="text-sm leading-relaxed">{msg.content}</p>
                                <span className="text-[10px] self-end opacity-70">
                                    {formatTime(msg.created_at)}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-white/5 flex gap-2">
                <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Message..."
                    className="flex-1 bg-secondary/20"
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div >
    )
}
