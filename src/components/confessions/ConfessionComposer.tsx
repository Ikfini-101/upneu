'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea' // Need to create this or use standard textarea
import { createConfession } from '@/app/feed/actions'
import { toast } from 'sonner' // Ensure sonner is installed or simple alert

export function ConfessionComposer() {
    const [isOpen, setIsOpen] = useState(false)
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        if (!content.trim()) return;
        setLoading(true);

        const res = await createConfession(content);

        if (res?.error) {
            alert("Erreur: " + res.error); // Replace with toast later
        } else {
            setContent('');
            setIsOpen(false);
            // Trigger refresh or Optimistic UI update
            alert("Confession envoyée pour validation !");
            window.location.reload(); // Simple reload for Phase 3
        }
        setLoading(false);
    }

    return (
        <>
            <motion.div
                className="z-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <Button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-[0_0_20px_-5px_hsl(var(--primary))] bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105"
                >
                    <PenLine className="h-6 w-6" />
                </Button>
            </motion.div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-4 border-b border-border/50 flex justify-between items-center">
                                <h3 className="font-semibold text-lg">Votre Confession</h3>
                                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="p-6">
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Libérez votre parole..."
                                    className="w-full min-h-[150px] bg-transparent resize-none outline-none text-lg text-foreground placeholder:text-muted-foreground/50"
                                    autoFocus
                                />
                            </div>
                            <div className="p-4 bg-muted/20 flex justify-end">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!content.trim() || loading}
                                    className="gap-2"
                                >
                                    {loading ? 'Envoi...' : (
                                        <>
                                            Envoyer <Send className="h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
