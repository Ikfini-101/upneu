'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createConfession } from '@/app/feed/actions'
import { useComposer } from '@/contexts/ComposerContext'

export function ConfessionComposer() {
    const { isOpen, closeComposer } = useComposer()
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
            closeComposer();
            // Trigger refresh or Optimistic UI update
            alert("Confession envoyée pour validation !");
            window.location.reload(); // Simple reload for Phase 3
        }
        setLoading(false);
    }

    return (
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
                            <Button variant="ghost" size="icon" onClick={() => closeComposer()}>
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
    )
}
