'use client'

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { VenetianMask, Heart, MessageCircle, MoreHorizontal, Send, Mail } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import type { Confession } from "@/app/feed/actions"
import { toggleLike, addComment } from "@/app/interactions/actions"
import { toast } from "sonner" // Assuming sonner is installed

interface ConfessionCardProps {
    confession: Confession;
    index: number;
}

export function ConfessionCard({ confession, index }: ConfessionCardProps) {
    const [liked, setLiked] = useState(false)
    const [likeCount, setLikeCount] = useState(confession.likes?.[0]?.count || 0)
    const [showCommentInput, setShowCommentInput] = useState(false)
    const [comment, setComment] = useState("")
    const [sendingComment, setSendingComment] = useState(false)
    // Initialize comments with latest first
    const [comments, setComments] = useState(confession.comments?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || [])

    const router = useRouter()
    const [showReportMenu, setShowReportMenu] = useState(false)

    const handleReport = async () => {
        const { reportConfession } = await import("@/app/interactions/actions");
        if (confirm("Voulez-vous vraiment signaler ce contenu comme inapproprié ?")) {
            await reportConfession(confession.id)
            toast.success("Contenu signalé. Merci de votre vigilance.")
            setShowReportMenu(false)
        }
    }

    const handleStartChat = async () => {
        if (!confession.user_id) return

        try {
            const { startConversation } = await import("@/app/messaging/actions")
            const res = await startConversation(confession.user_id)
            if (res.conversationId) {
                router.push(`/messages/${res.conversationId}`)
            } else if (res.error) {
                toast.error(res.error)
            }
        } catch (e) {
            console.error(e)
            toast.error("Erreur lors de l'ouverture du chat")
        }
    }

    const handleLike = async () => {
        // Optimistic UI
        setLiked(!liked)
        setLikeCount(prev => liked ? prev - 1 : prev + 1)

        await toggleLike(confession.id)
    }

    const handleCommentSubmit = async () => {
        if (!comment.trim()) return
        setSendingComment(true)

        const res = await addComment(confession.id, comment)

        if (res?.error) {
            toast.error("Erreur: " + res.error)
        } else {
            toast.success("Conseil envoyé !")

            // Optimistic update
            const newComment = {
                id: Math.random().toString(), // temp id
                content: comment,
                created_at: new Date().toISOString(),
                mask: { name: 'Moi' } // simplifying for optimistic
            }
            setComments([newComment, ...comments])

            setComment("")
            // Keep input open to see the new comment
        }
        setSendingComment(false)
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
        >
            <Card className="bg-card/40 backdrop-blur-md border-white/5 hover:border-primary/20 transition-colors duration-300">
                <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                            <VenetianMask className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-foreground/90">
                                {confession.mask?.name || "Anonyme"}
                            </span>
                            <span className="text-xs text-muted-foreground flex gap-2">
                                <span>{confession.mask?.sex === 'H' ? 'Homme' : 'Femme'}</span>
                                <span>•</span>
                                <span>{confession.mask?.age} ans</span>
                                <span>•</span>
                                <span>{confession.mask?.city}</span>
                            </span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-lg leading-relaxed text-foreground/90 font-light">
                        {confession.content}
                    </p>
                </CardContent>
                <CardFooter className="pt-2 flex flex-col gap-4">
                    <div className="flex justify-between w-full text-muted-foreground">
                        <div className="flex gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn("hover:text-primary hover:bg-primary/10 gap-2 pl-0", liked && "text-primary")}
                                onClick={handleLike}
                            >
                                <Heart className={cn("h-4 w-4", liked && "fill-current")} />
                                <span className="text-xs">{likeCount > 0 ? likeCount : 'Soutien'}</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="hover:text-primary hover:bg-primary/10 gap-2"
                                onClick={() => setShowCommentInput(!showCommentInput)}
                            >
                                <MessageCircle className="h-4 w-4" />
                                <span className="text-xs">{comments.length > 0 ? comments.length : ''} Conseil{comments.length > 1 ? 's' : ''}</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="hover:text-primary hover:bg-primary/10 gap-2"
                                onClick={handleStartChat}
                            >
                                <Mail className="h-4 w-4" />
                                <span className="text-xs hidden sm:inline">MP</span>
                            </Button>
                        </div>
                        <div className="relative">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setShowReportMenu(!showReportMenu)}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>

                            {showReportMenu && (
                                <div className="absolute right-0 bottom-full mb-2 w-32 bg-card border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                                    <button
                                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 hover:text-red-300 transition-colors"
                                        onClick={handleReport}
                                    >
                                        Signaler
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <AnimatePresence>
                        {showCommentInput && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="w-full overflow-hidden space-y-4"
                            >
                                {/* Comment Input */}
                                <div className="flex gap-2 items-end pt-2 border-t border-white/5">
                                    <Textarea
                                        placeholder="Votre conseil bienveillant..."
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        className="min-h-[60px] bg-background/50 text-sm"
                                    />
                                    <Button size="icon" onClick={handleCommentSubmit} disabled={sendingComment || !comment.trim()}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* Comments List */}
                                <div className="space-y-3 pl-2">
                                    {comments.map((c) => (
                                        <div key={c.id} className="flex gap-3 items-start pl-2">
                                            <div className="h-8 w-8 rounded-full bg-secondary/30 flex items-center justify-center shrink-0 border border-white/5 mt-1">
                                                <VenetianMask className="h-4 w-4 opacity-70" />
                                            </div>
                                            <div className="flex flex-col gap-1 bg-secondary/10 p-3 rounded-2xl rounded-tl-none border border-white/5 max-w-[85%]">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-xs text-foreground/90">{c.mask?.name || "Anonyme"}</span>
                                                    <span className="text-[10px] text-muted-foreground/60">{new Date(c.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-sm font-light text-foreground/90 leading-relaxed">{c.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardFooter>
            </Card>
        </motion.div>
    )
}
