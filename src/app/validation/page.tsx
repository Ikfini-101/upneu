'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { getPendingConfessions, submitVote } from '@/app/interactions/actions'
import type { Confession } from '@/app/feed/actions'

export default function ValidationPage() {
    const [confessions, setConfessions] = useState<any[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadConfessions()
    }, [])

    const loadConfessions = async () => {
        setLoading(true)
        const data = await getPendingConfessions()
        setConfessions(data)
        setLoading(false)
    }

    const handleVote = async (approved: boolean) => {
        if (!confessions[currentIndex]) return

        // Optimistic UI
        const currentConfession = confessions[currentIndex]
        setCurrentIndex(prev => prev + 1)

        await submitVote(currentConfession.id, approved)

        // Fetch more if running low? For MVP just show "Done"
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (currentIndex >= confessions.length) {
        return (
            <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
                <h2 className="text-2xl font-bold mb-2">Tout est validé !</h2>
                <p className="text-muted-foreground mb-6">Merci pour votre contribution à la communauté.</p>
                <Button onClick={() => window.location.href = '/feed'}>
                    Retour au fil
                </Button>
            </div>
        )
    }

    const confession = confessions[currentIndex]

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 pointer-events-none" />

            <div className="max-w-md w-full relative z-10">
                <div className="mb-6 text-center">
                    <h1 className="text-xl font-bold">Validation Communautaire</h1>
                    <p className="text-sm text-muted-foreground">Aidez-nous à garantir un espace bienveillant.</p>
                </div>

                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={confession.id}
                        initial={{ opacity: 0, scale: 0.95, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.05, x: 0 }} // Simple fade out
                        transition={{ duration: 0.3 }}
                    >
                        <Card className="border-primary/20 bg-card/80 backdrop-blur-xl shadow-2xl h-[400px] flex flex-col">
                            <CardHeader>
                                <CardTitle className="text-lg font-medium text-muted-foreground">
                                    Confession Anonyme
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 flex items-center justify-center">
                                <p className="text-xl text-center leading-relaxed font-light">
                                    "{confession.content}"
                                </p>
                            </CardContent>
                            <CardFooter className="flex justify-between gap-4 py-6">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10 h-14 rounded-full"
                                    onClick={() => handleVote(false)}
                                >
                                    <X className="h-6 w-6 mr-2" /> Refuser
                                </Button>
                                <Button
                                    size="lg"
                                    className="flex-1 bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20 border h-14 rounded-full"
                                    onClick={() => handleVote(true)}
                                >
                                    <Check className="h-6 w-6 mr-2" /> Valider
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}
