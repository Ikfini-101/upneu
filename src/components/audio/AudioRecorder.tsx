'use client';

import React, { useState, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import { Mic, Square, Play, Pause, ShieldCheck, Lock, Unlock, Loader2, RefreshCw, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { blurVoice } from '@/lib/audio/processor';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type AudioRecorderProps = {
    onAudioConfirmed: (audioBlob: Blob, duration: number) => void;
};

export function AudioRecorder({ onAudioConfirmed }: AudioRecorderProps) {
    // ... (rest is same until confirm)


    const [status, setStatus] = useState<'idle' | 'recording' | 'processing' | 'review'>('idle');
    const [originalBlob, setOriginalBlob] = useState<Blob | null>(null);
    const [blurredBlob, setBlurredBlob] = useState<Blob | null>(null);
    const [playbackMode, setPlaybackMode] = useState<'original' | 'blurred'>('blurred');
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0); // in seconds

    // Tone.js Refs
    const recorder = useRef<MediaRecorder | null>(null);
    const player = useRef<Tone.Player | null>(null);
    const meter = useRef<Tone.Meter | null>(null);
    const chunks = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    // Canvas Ref for Visualizer (Optional V2)
    // const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        return () => {
            // Cleanup Tone.js
            if (player.current) player.current.dispose();
            if (meter.current) meter.current.dispose();
            if (timerRef.current) clearInterval(timerRef.current);

            // Cleanup Stream
            if (recorder.current && recorder.current.stream) {
                recorder.current.stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            await Tone.start();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            recorder.current = new MediaRecorder(stream);
            chunks.current = [];

            recorder.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.current.push(e.data);
            };

            recorder.current.onstop = async () => {
                const blob = new Blob(chunks.current, { type: 'audio/webm; codecs=opus' });
                setOriginalBlob(blob);
                handleProcessing(blob);
            };

            recorder.current.start();
            setStatus('recording');
            startTimeRef.current = Date.now();

            timerRef.current = setInterval(() => {
                setDuration((Date.now() - startTimeRef.current) / 1000);
            }, 100);

        } catch (err) {
            console.error("Mic Error:", err);
            toast.error("Impossible d'accéder au micro.");
        }
    };

    const stopRecording = () => {
        if (recorder.current && recorder.current.state !== 'inactive') {
            recorder.current.stop();
            if (timerRef.current) clearInterval(timerRef.current);
            // Stop streams to release mic
            recorder.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleProcessing = async (blob: Blob) => {
        setStatus('processing');
        try {
            // Wait a bit for UI transition
            await new Promise(r => setTimeout(r, 500));

            // BLUR PIPELINE
            const processedBlob = await blurVoice(blob);
            setBlurredBlob(processedBlob);

            // Setup Player for Review
            // We load the buffer into Tone.Player for playback
            // (Note: We'll load based on selection)
            setStatus('review');
            toast.success("Voix anonymisée avec succès !");

        } catch (err) {
            console.error("Processing Error:", err);
            toast.error("Erreur lors du traitement audio.");
            setStatus('idle');
        }
    };

    const togglePlayback = async () => {
        if (isPlaying) {
            player.current?.stop();
            setIsPlaying(false);
            return;
        }

        // LOAD SELECTED BLOB
        const blobToPlay = playbackMode === 'original' ? originalBlob : blurredBlob;
        if (!blobToPlay) return;

        try {
            if (player.current) player.current.dispose();

            const arrayBuffer = await blobToPlay.arrayBuffer();
            const audioBuffer = await new AudioContext().decodeAudioData(arrayBuffer);

            player.current = new Tone.Player(audioBuffer).toDestination();
            player.current.onstop = () => setIsPlaying(false);

            await Tone.loaded();
            player.current.start();
            setIsPlaying(true);

        } catch (err) {
            console.error("Playback Error", err);
        }
    };

    const reset = () => {
        setStatus('idle');
        setOriginalBlob(null);
        setBlurredBlob(null);
        setDuration(0);
        if (player.current) player.current.stop();
    };

    const confirm = async () => {
        console.log("Confirm button clicked");
        if (blurredBlob) {
            console.log("Blurred blob exists, sending...", blurredBlob, duration);
            await onAudioConfirmed(blurredBlob, duration);
        } else {
            console.error("No blurred blob found!");
            toast.error("Erreur : Aucun fichier audio à envoyer.");
            throw new Error("No blob");
        }
    };

    return (

        <div className="flex flex-col items-center justify-between h-full w-full max-w-md mx-auto relative p-2">

            {/* MAIN ACTION AREA (Centered) */}
            <div className="flex-1 flex items-center justify-center w-full">
                <AnimatePresence mode="wait">
                    {status === 'idle' && (
                        <motion.button
                            key="idle"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={startRecording}
                            className="w-24 h-24 rounded-full bg-primary flex flex-col items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-shadow gap-1"
                        >
                            <Mic className="w-8 h-8 text-black" />
                            <span className="text-[10px] font-bold text-black uppercase tracking-wider">Enregistrer</span>
                        </motion.button>
                    )}

                    {status === 'recording' && (
                        <motion.div
                            key="recording"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            className="relative flex flex-col items-center justify-center"
                        >
                            {/* Pulse Effect */}
                            <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20 duration-1000" />
                            <div className="absolute -inset-8 rounded-full border border-red-500/30 animate-pulse" />

                            <button
                                onClick={stopRecording}
                                className="w-24 h-24 rounded-full bg-red-500 flex flex-col items-center justify-center shadow-lg relative z-10 gap-1"
                            >
                                <Square className="w-8 h-8 text-white fill-current" />
                                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Stop</span>
                            </button>

                            <div className="mt-4 text-red-400 font-mono text-xl font-bold tracking-widest">
                                {duration.toFixed(1)}s
                            </div>
                        </motion.div>
                    )}

                    {status === 'processing' && (
                        <motion.div
                            key="processing"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="flex flex-col items-center gap-4"
                        >
                            <div className="w-24 h-24 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/50">
                                <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                            </div>
                            <span className="text-indigo-300 text-sm animate-pulse font-medium">Anonymisation... (IA-Proof)</span>
                        </motion.div>
                    )}

                    {status === 'review' && (
                        <motion.div
                            key="review"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="w-full flex flex-col items-center gap-6"
                        >
                            <div className="flex flex-col items-center gap-2">
                                {/* Player Controls */}
                                <button
                                    onClick={togglePlayback}
                                    className={cn(
                                        "w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl border-4",
                                        playbackMode === 'blurred' ? "bg-amber-500 text-black border-amber-600/30" : "bg-gray-800 text-white border-white/10"
                                    )}
                                >
                                    {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                                </button>
                                <span className="text-xs text-muted-foreground font-mono">{duration.toFixed(1)}s</span>
                            </div>

                            {/* Toggle Switch */}
                            <div className="flex bg-secondary/30 p-1 rounded-full relative w-full max-w-[200px]">
                                <motion.div
                                    className="absolute top-1 bottom-1 w-[50%] bg-primary rounded-full shadow-md z-0"
                                    animate={{ left: playbackMode === 'original' ? '4px' : '50%' }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />

                                <button
                                    onClick={() => { setPlaybackMode('original'); if (isPlaying) player.current?.stop(); setIsPlaying(false); }}
                                    className={cn("relative z-10 flex-1 py-1.5 rounded-full text-xs font-bold uppercase transition-colors flex items-center justify-center gap-2", playbackMode === 'original' ? "text-black" : "text-muted-foreground")}
                                >
                                    <Unlock className="w-3 h-3" />
                                    Original
                                </button>
                                <button
                                    onClick={() => { setPlaybackMode('blurred'); if (isPlaying) player.current?.stop(); setIsPlaying(false); }}
                                    className={cn("relative z-10 flex-1 py-1.5 rounded-full text-xs font-bold uppercase transition-colors flex items-center justify-center gap-2", playbackMode === 'blurred' ? "text-black" : "text-muted-foreground")}
                                >
                                    <ShieldCheck className="w-3 h-3" />
                                    Floutée
                                </button>
                            </div>

                            <p className="text-[10px] text-muted-foreground text-center px-4 leading-tight">
                                {playbackMode === 'original'
                                    ? "⚠️ Seule vous entendez cette version. Elle sera détruite."
                                    : "✅ Cette version sera publiée. Voix méconnaissable garantie."
                                }
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* FOOTER ACTIONS (Fixed at bottom of component) */}
            {status === 'review' && (
                <div className="w-full flex items-center justify-between gap-3 pt-4 border-t border-white/5 mt-auto relative z-[100] bg-background/90 backdrop-blur-xl pb-4 pointer-events-auto">
                    <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground hover:text-white cursor-pointer z-50">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refaire
                    </Button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (blurredBlob) {
                                alert(`CONFIRMATION: Envoi du blob (${blurredBlob.size} bytes)`);
                                confirm();
                            } else {
                                alert("ERREUR: Audio non disponible (Blob is null)");
                            }
                        }}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 flex-1 cursor-pointer z-[100] relative active:scale-95 transition-transform"
                    >
                        <Send className="w-4 h-4 mr-2" />
                        Publier
                    </button>
                </div>
            )}
        </div>
    );
}
