'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, RefreshCw, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { blurVoice } from '@/lib/audio/processor';
import { toast } from 'sonner';

interface SimpleAudioRecorderProps {
    onAudioConfirmed: (blob: Blob, duration: number) => void;
}

export function SimpleAudioRecorder({ onAudioConfirmed }: SimpleAudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Cleanup
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            stopStream();
        };
    }, []);

    const stopStream = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                const rawBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                handleProcessing(rawBlob);
                stopStream();
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setAudioBlob(null);

            startTimeRef.current = Date.now();
            timerRef.current = setInterval(() => {
                setDuration((Date.now() - startTimeRef.current) / 1000);
            }, 100);

        } catch (err) {
            console.error(err);
            toast.error("Impossible d'accéder au micro");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const handleProcessing = async (rawBlob: Blob) => {
        setIsProcessing(true);
        try {
            // Process the audio (Blur)
            const processed = await blurVoice(rawBlob);
            setAudioBlob(processed);
        } catch (err) {
            console.error(err);
            toast.error("Erreur lors du traitement audio");
        } finally {
            setIsProcessing(false);
        }
    };

    const togglePlay = () => {
        if (!audioRef.current || !audioBlob) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            const url = URL.createObjectURL(audioBlob);
            audioRef.current.src = url;
            audioRef.current.play();
            audioRef.current.onended = () => setIsPlaying(false);
        }
        setIsPlaying(!isPlaying);
    };

    const handleReset = () => {
        setAudioBlob(null);
        setDuration(0);
        setIsPlaying(false);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
        }
    };

    const handleConfirm = () => {
        if (audioBlob) {
            onAudioConfirmed(audioBlob, duration);
        }
    };

    // --- RENDER ---

    // 1. IDLE STATE
    if (!isRecording && !audioBlob && !isProcessing) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 animate-in fade-in zoom-in">
                <button
                    onClick={startRecording}
                    className="w-20 h-20 rounded-full bg-primary text-black flex items-center justify-center shadow-2xl hover:scale-105 transition-transform"
                >
                    <Mic className="w-8 h-8" />
                </button>
                <span className="mt-4 text-sm font-medium text-muted-foreground">Appuyez pour parler</span>
            </div>
        );
    }

    // 2. RECORDING STATE
    if (isRecording) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6">
                <div className="relative">
                    <span className="absolute inset-0 rounded-full animate-ping bg-red-500/20"></span>
                    <button
                        onClick={stopRecording}
                        className="relative w-24 h-24 rounded-full bg-red-500 text-white flex items-center justify-center shadow-2xl hover:scale-105 transition-transform"
                    >
                        <Square className="w-8 h-8 fill-current" />
                    </button>
                </div>
                <div className="mt-6 text-2xl font-mono font-bold text-red-500">
                    {duration.toFixed(1)}s
                </div>
                <span className="mt-2 text-sm text-red-400/80 animate-pulse">Enregistrement en cours...</span>
            </div>
        );
    }

    // 3. PROCESSING STATE
    if (isProcessing) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <span className="text-sm text-muted-foreground">Anonymisation de la voix...</span>
            </div>
        );
    }

    // 4. REVIEW STATE (Blob Ready)
    return (
        <div className="flex flex-col items-center justify-between h-full w-full p-4 animate-in slide-in-from-bottom-4">

            {/* Audio Player (Hidden Element + UI) */}
            <audio ref={audioRef} className="hidden" />

            <div className="flex-1 flex flex-col items-center justify-center gap-6">
                <div className="flex flex-col items-center gap-2">
                    <button
                        onClick={togglePlay}
                        className={cn(
                            "w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl border-4",
                            "bg-amber-500 text-black border-amber-600/30 hover:scale-105"
                        )}
                    >
                        {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                    </button>
                    <span className="text-xs font-mono text-muted-foreground">{duration.toFixed(1)}s</span>
                </div>

                <div className="px-4 py-2 bg-secondary/50 rounded-lg border border-border/50 text-center">
                    <p className="text-xs text-muted-foreground">
                        ✅ Voix floutée prête à l'envoi
                    </p>
                </div>
            </div>

            {/* Actions Footer */}
            <div className="w-full flex items-center gap-3 pt-4 mt-auto">
                <Button
                    variant="ghost"
                    onClick={handleReset}
                    className="flex-1"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refaire
                </Button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleConfirm();
                    }}
                    className="flex-[2] bg-primary text-black hover:bg-primary/90 rounded-md font-medium text-sm h-10 px-4 py-2 flex items-center justify-center cursor-pointer relative z-[100] active:scale-95 transition-transform"
                >
                    <Send className="w-4 h-4 mr-2" />
                    Publier
                </button>
            </div>
        </div>
    );
}
