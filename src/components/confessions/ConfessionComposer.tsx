'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Mic, Type } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createConfession } from '@/app/feed/actions'
import { useComposer } from '@/contexts/ComposerContext'
import { SimpleAudioRecorder } from '@/components/audio/SimpleAudioRecorder'
import { createClient } from '@/lib/supabase/client'
// import { v4 as uuidv4 } from 'uuid' // Removed
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ... imports ...

export function ConfessionComposer() {
    const { isOpen, closeComposer } = useComposer()
    // const [mode, setMode] = useState<'text' | 'audio'>('text') // Audio disabled for Beta
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)

    const MAX_WORDS = 1000;
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

    // Helper for Audio Upload (Disabled for Beta)
    /*
    const uploadAudio = async (blob: Blob): Promise<string | null> => { ... };
    const handleAudioConfirmed = async (blob: Blob, duration: number) => { ... };
    */

    const handleSubmitText = async () => {
        if (!content.trim()) return;
        setLoading(true);

        const res = await createConfession(content);

        if (res?.error) {
            toast.error("Erreur: " + res.error);
        } else {
            setContent('');
            closeComposer();
            toast.success("Confession envoyée pour validation !");
            window.location.reload();
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
                        className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-border/50 flex justify-between items-center bg-muted/10">
                            <span className="font-semibold text-lg ml-2">Nouvelle Confession</span>
                            {/* Audio Toggle Disabled
                            <div className="flex bg-muted/50 p-1 rounded-full">
                                ...
                            </div>
                            */}
                            <Button variant="ghost" size="icon" onClick={() => closeComposer()}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <div className="p-6 h-full overflow-y-auto">
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Libérez votre parole..."
                                    className="w-full h-full min-h-[200px] bg-transparent resize-none outline-none text-lg text-foreground placeholder:text-muted-foreground/50"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-muted/20 flex justify-between items-center">
                            <span className={cn("text-xs", wordCount > MAX_WORDS ? "text-red-500 font-bold" : "text-muted-foreground")}>
                                {wordCount} / {MAX_WORDS} mots
                            </span>
                            <Button
                                onClick={handleSubmitText}
                                disabled={!content.trim() || loading || wordCount > MAX_WORDS}
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
