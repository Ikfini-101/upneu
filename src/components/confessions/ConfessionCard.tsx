'use client'

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { VeillerButton } from "@/components/ui/VeillerButton"
import { VenetianMask, Heart, MessageCircle, Send, Flag } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import type { Confession } from "@/app/feed/actions"
import { toggleLike, addComment, toggleCommentVote, toggleVeille } from "@/app/interactions/actions";
import { toast } from "sonner"
import { ThumbsUp, ThumbsDown, Reply, Eye, EyeOff } from "lucide-react"
import { getRank } from "@/lib/karma"
import { FeedAudioPlayer } from "@/components/audio/FeedAudioPlayer"

interface ConfessionCardProps {
    confession: Confession;
    index: number;
    currentUserId: string;
    isFollowed?: boolean;
}

export function ConfessionCard({ confession, index, currentUserId, isFollowed = false }: ConfessionCardProps) {
    const [liked, setLiked] = useState(false)
    const [likeCount, setLikeCount] = useState(confession.likes?.[0]?.count || 0)
    const [isExpanded, setIsExpanded] = useState(false)
    // following state removed - delegated to VeillerButton
    const [showCommentInput, setShowCommentInput] = useState(false)
    const [comment, setComment] = useState("")
    const [sendingComment, setSendingComment] = useState(false)
    const [comments, setComments] = useState(confession.comments?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || [])
    const [replyingTo, setReplyingTo] = useState<string | null>(null)

    const router = useRouter()


    const handleReport = async () => {
        const { reportConfession } = await import("@/app/interactions/moderation");
        if (confirm("Voulez-vous vraiment signaler ce contenu comme inapproprié ?")) {
            await reportConfession(confession.id)
            toast.success("Contenu signalé. Merci de votre vigilance.")
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

        const res = await addComment(confession.id, comment, replyingTo || undefined)

        if (res?.error) {
            toast.error("Erreur: " + res.error)
        } else {
            toast.success("Conseil envoyé !")

            // Optimistic update
            const newComment = {
                id: Math.random().toString(), // temp id
                content: comment,
                created_at: new Date().toISOString(),
                parent_id: replyingTo,
                mask: { name: 'Moi', karma: 0 },
                comment_votes: []
            }
            setComments([newComment, ...comments])

            setComment("")
            setReplyingTo(null)
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
            {/* Confession Card Content */}
            <Card className="bg-card/40 backdrop-blur-md border-white/5 hover:border-primary/20 transition-colors duration-300 relative z-10 rounded-xl">
                <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden relative">
                            <img
                                src="/icons/mask-logo.png"
                                alt="Masque ANO"
                                className="h-full w-full object-cover opacity-90 scale-110" // scale-110 to zoom slightly if logo has padding
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
                                {confession.mask?.name || "Anonyme"}
                                {confession.mask?.karma !== undefined && (
                                    (() => {
                                        const rank = getRank(confession.mask!.karma);
                                        return (
                                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border flex items-center gap-1", rank.color, rank.bg)}>
                                                {rank.icon}
                                                {rank.label}
                                            </span>
                                        );
                                    })()
                                )}
                            </span>
                            {/* Veiller Button Removed from here */}
                            <span className="text-xs text-muted-foreground flex gap-2">
                                <span>{confession.mask?.sex === 'H' ? 'Homme' : 'Femme'}</span>
                                <span>•</span>
                                <span>{confession.mask?.age} ans</span>
                                <span>•</span>
                                <span>{confession.mask?.city}</span>
                            </span>
                        </div>
                    </div>

                    {/* Right Side Actions: Veiller & Menu */}
                    <div className="flex items-center gap-1">
                        {/* Veiller Button (Prominent) */}
                        {confession.user_id !== currentUserId && confession.mask?.id && (
                            <VeillerButton
                                targetId={confession.mask.id}
                                initialIsVeilling={isFollowed}
                                onToggle={toggleVeille}
                                size="sm"
                            />
                        )}
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="text-lg leading-relaxed text-foreground/90 font-light">
                        {confession.content.length > 300 && !isExpanded ? (
                            <>
                                {confession.content.slice(0, 300)}...
                                <button
                                    onClick={() => setIsExpanded(true)}
                                    className="font-medium text-primary hover:underline ml-1 text-sm"
                                >
                                    Voir plus
                                </button>
                            </>
                        ) : (
                            <>
                                {confession.content}
                                {confession.content.length > 300 && (
                                    <button
                                        onClick={() => setIsExpanded(false)}
                                        className="font-medium text-muted-foreground hover:text-primary hover:underline ml-1 text-sm block mt-1"
                                    >
                                        Voir moins
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                    {/* confession.confession_type === 'audio' && confession.audio_url && (
                            <div className="mt-4">
                                <FeedAudioPlayer src={confession.audio_url} duration={confession.audio_duration} />
                            </div>
                        ) */}
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
                                className="text-red-500 hover:text-red-400 hover:bg-red-500/10 gap-2"
                                onClick={handleReport}
                            >
                                <Flag className="h-4 w-4" />
                                <span className="text-xs hidden sm:inline">Signaler</span>
                            </Button>
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
                                        id={`comment-input-${index}`}
                                        placeholder={replyingTo ? "Votre réponse..." : "Votre conseil bienveillant..."}
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        className="min-h-[60px] bg-background/50 text-sm flex-1 resize-none focus-visible:ring-primary/50"
                                    />
                                    <Button size="icon" onClick={handleCommentSubmit} disabled={sendingComment || !comment.trim()}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* Comments List */}
                                <div className="space-y-4 pl-2">
                                    {comments.filter(c => !c.parent_id).map((c) => (
                                        <div key={c.id} className="space-y-2">
                                            {/* Parent Comment */}
                                            <CommentItem
                                                comment={c}
                                                currentUserId={currentUserId}
                                                onReply={(id) => {
                                                    setReplyingTo(id);
                                                    const input = document.getElementById(`comment-input-${index}`);
                                                    if (input) input.focus();
                                                }}
                                            />

                                            {/* Replies */}
                                            <div className="pl-8 space-y-2 border-l border-white/5 ml-2">
                                                {comments.filter(reply => reply.parent_id === c.id)
                                                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                                                    .map(reply => (
                                                        <CommentItem
                                                            key={reply.id}
                                                            comment={reply}
                                                            currentUserId={currentUserId}
                                                            onReply={(id) => {
                                                                setReplyingTo(id); // Reply to the reply's parent (or reply itself? simplified flat reply for now or 2-level)
                                                                // Actually for this UI let's just set replyingTo the same as parent or original reply.
                                                                // But simple constraint: Reply to Reply = parent ID.
                                                                // Actually let's just allow generic replyingTo for now, visual nesting is 2 levels max usually for mobile.
                                                                setReplyingTo(c.id); // Consolidate threads
                                                                const input = document.getElementById(`comment-input-${index}`);
                                                                if (input) input.focus();
                                                            }}
                                                            isReply
                                                        />
                                                    ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardFooter>
            </Card>

        </motion.div >
    )
}

function CommentItem({ comment, onReply, currentUserId, isReply = false }: { comment: any, onReply: (id: string) => void, currentUserId: string, isReply?: boolean }) {
    const [votes, setVotes] = useState<any[]>(comment.comment_votes || [])

    // Check if current user voted
    const userVote = votes.find((v: any) => v.user_id === currentUserId);
    const hasLiked = userVote?.vote === true;
    const hasDisliked = userVote?.vote === false;

    // Calc score
    const likes = votes.filter((v: any) => v.vote === true).length;
    const dislikes = votes.filter((v: any) => v.vote === false).length;

    const handleVote = async (vote: boolean) => {
        // Optimistic Update
        let newVotes = [...votes];
        const existingVoteIndex = newVotes.findIndex((v: any) => v.user_id === currentUserId);

        if (existingVoteIndex !== -1) {
            if (newVotes[existingVoteIndex].vote === vote) {
                // Toggle off (remove)
                newVotes.splice(existingVoteIndex, 1);
            } else {
                // Change vote
                newVotes[existingVoteIndex].vote = vote;
            }
        } else {
            // New vote
            newVotes.push({ user_id: currentUserId, vote });
        }
        setVotes(newVotes);

        // Server action
        await toggleCommentVote(comment.id, vote);
    }

    return (
        <div className="flex gap-3 items-start">
            <div className={cn("rounded-full bg-secondary/30 flex items-center justify-center shrink-0 border border-white/5 mt-1", isReply ? "h-6 w-6" : "h-8 w-8")}>
                <VenetianMask className={cn("opacity-70", isReply ? "h-3 w-3" : "h-4 w-4")} />
            </div>
            <div className="flex flex-col gap-1 flex-1">
                <div className="bg-secondary/10 p-3 rounded-2xl rounded-tl-none border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-xs text-foreground/90 flex items-center gap-1.5">
                            {comment.mask?.name || "Anonyme"}
                            {comment.mask?.karma !== undefined && (
                                (() => {
                                    const rank = getRank(comment.mask!.karma);
                                    return (
                                        <span className={cn("text-[8px] px-1 py-0.5 rounded-full border flex items-center gap-0.5", rank.color, rank.bg)}>
                                            {rank.icon}
                                            {rank.label}
                                        </span>
                                    );
                                })()
                            )}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60">{new Date(comment.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm font-light text-foreground/90 leading-relaxed">{comment.content}</p>
                </div>

                {/* Actions Line */}
                <div className="flex items-center gap-4 px-2">
                    <button
                        onClick={() => handleVote(true)}
                        className={cn("flex items-center gap-1 text-[10px] transition-colors", hasLiked ? "text-green-400 font-bold" : "text-muted-foreground hover:text-green-400")}
                    >
                        <ThumbsUp className={cn("h-3 w-3", hasLiked && "fill-current")} /> {likes > 0 && likes}
                    </button>
                    <button
                        onClick={() => handleVote(false)}
                        className={cn("flex items-center gap-1 text-[10px] transition-colors", hasDisliked ? "text-red-400 font-bold" : "text-muted-foreground hover:text-red-400")}
                    >
                        <ThumbsDown className={cn("h-3 w-3", hasDisliked && "fill-current")} /> {dislikes > 0 && dislikes}
                    </button>
                    <button onClick={() => onReply(comment.id)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors font-medium">
                        <Reply className="h-3 w-3" /> Répondre
                    </button>
                </div>
            </div>
        </div>
    )
}

