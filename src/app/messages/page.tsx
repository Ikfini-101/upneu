'use client'

import { useEffect, useState } from 'react'
import { getConversations } from '@/app/messaging/actions'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function MessagesPage() {
    const [conversations, setConversations] = useState<any[]>([])

    useEffect(() => {
        loadConversations()
    }, [])

    const loadConversations = async () => {
        const data = await getConversations()
        setConversations(data)
    }

    return (
        <div className="min-h-screen bg-background p-4 max-w-md mx-auto">
            <header className="flex items-center gap-4 mb-6 pt-4">
                <Link href="/feed">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">Messages</h1>
            </header>

            <div className="space-y-4">
                {conversations.length === 0 ? (
                    <div className="text-center p-10 text-muted-foreground">
                        Pas de conversations pour le moment.
                    </div>
                ) : (
                    conversations.map((conv) => (
                        <Link href={`/messages/${conv.id}`} key={conv.id}>
                            <Card className="p-4 flex items-center gap-4 hover:bg-card/80 transition-colors border-white/5 mb-2">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-foreground">{conv.partner_name}</p>
                                    <p className="text-xs text-muted-foreground">Cliquez pour voir les messages</p>
                                </div>
                            </Card>
                        </Link>
                    ))
                )}
            </div>
        </div>
    )
}
