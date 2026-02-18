'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FeedAudioPlayerProps {
    src: string;
    duration?: number | null;
}

export function FeedAudioPlayer({ src, duration }: FeedAudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const togglePlay = () => {
        if (!audioRef.current || isLoading || error) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(e => {
                console.error("Play error:", e);
                setError("Lecture impossible");
            });
        }
        setIsPlaying(!isPlaying);
    };

    const handleError = (e: any) => {
        console.error("Audio Load Error:", e);
        const err = audioRef.current?.error;
        let msg = "Erreur lecture";
        if (err) {
            switch (err.code) {
                case 1: msg = "Annulé"; break;
                case 2: msg = "Réseau"; break; // MEDIA_ERR_NETWORK
                case 3: msg = "Décodage"; break; // MEDIA_ERR_DECODE
                case 4: msg = "Non supporté"; break; // MEDIA_ERR_SRC_NOT_SUPPORTED
            }
        }
        setError(msg);
        setIsLoading(false);
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full bg-secondary/10 border border-white/5 rounded-xl p-3 flex flex-col gap-2 mt-3 shadow-inner group transition-all hover:bg-secondary/20">
            <div className="flex items-center gap-3">
                <audio
                    ref={audioRef}
                    src={src}
                    onTimeUpdate={() => {
                        if (!audioRef.current) return;
                        const current = audioRef.current.currentTime;
                        const total = audioRef.current.duration || duration || 0;
                        setCurrentTime(current);
                        if (total > 0) setProgress((current / total) * 100);
                    }}
                    onEnded={() => { setIsPlaying(false); setProgress(0); setCurrentTime(0); }}
                    onCanPlay={() => { setIsLoading(false); setError(null); }}
                    onWaiting={() => setIsLoading(true)}
                    onError={handleError}
                    onPlaying={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    className="hidden"
                    preload="metadata"
                />

                <Button
                    onClick={togglePlay}
                    size="icon"
                    disabled={isLoading && !error}
                    className={cn(
                        "h-10 w-10 shrink-0 rounded-full transition-all shadow-lg relative",
                        error ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" :
                            isPlaying ? "bg-amber-500 text-black shadow-amber-500/20" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                >
                    {isLoading && !error ? (
                        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : error ? (
                        <span className="font-bold text-xs">!</span>
                    ) : (
                        isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-1" />
                    )}
                </Button>

                <div className="flex-1 flex flex-col justify-center gap-1.5 cursor-pointer" onClick={(e) => {
                    if (!audioRef.current || error) return;
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const percent = x / rect.width;
                    if (audioRef.current.duration) {
                        audioRef.current.currentTime = percent * audioRef.current.duration;
                    }
                }}>
                    {/* Waveform Visualization (Fake/CSS) */}
                    <div className="h-5 flex items-center gap-[2px] overflow-hidden opacity-60">
                        {Array.from({ length: 30 }).map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "w-1 rounded-full transition-all duration-300",
                                    error ? "bg-red-500/50" : "bg-foreground/40",
                                    isPlaying && "bg-amber-500 animate-[pulse_1s_ease-in-out_infinite]"
                                )}
                                style={{
                                    height: isPlaying ? `${Math.max(20, Math.random() * 100)}%` : '30%',
                                    animationDelay: `${i * 0.05}s`
                                }}
                            />
                        ))}
                    </div>

                    {/* Progress Bar / Error Msg */}
                    <div className="w-full relative h-4 flex items-center">
                        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-amber-500 transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>

                <span className="text-[10px] font-mono text-muted-foreground w-10 text-right tabular-nums">
                    {formatTime(currentTime)}
                </span>
            </div>
            {error && <div className="text-red-400 text-[10px] font-bold text-center">{error}</div>}
        </div>
    );
}
