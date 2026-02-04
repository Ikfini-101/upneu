'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getMessages, sendMessage } from '@/app/messaging/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ChatPage() {
    const { id } = useParams()
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const scrollRef = useRef<HTMLDivElement>(null)

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

    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    // ...

    const loadMessages = async () => {
        if (!id) return
        const { messages, currentUserId } = await getMessages(id as string)
        setMessages(messages)
        setCurrentUserId(currentUserId)
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

    return (
        <div className="flex flex-col h-screen bg-background max-w-md mx-auto">
            <header className="flex items-center gap-4 p-4 border-b border-white/5">
                <Button variant="ghost" size="icon" onClick={() => router.push('/messages')}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-lg font-bold">Chat</h1>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.map((msg) => {
                    const isMe = msg.sender_id === currentUserId || msg.sender_id === 'me';
                    return (
                        <div
                            key={msg.id}
                            className={cn(
                                "max-w-[80%] p-3 rounded-2xl text-sm",
                                isMe
                                    ? "bg-primary text-primary-foreground self-end rounded-br-none"
                                    : "bg-card/50 border border-white/5 self-start rounded-bl-none"
                            )}
                        >
                            {msg.content}
                        </div>
                    )
                })}
            </div>

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
