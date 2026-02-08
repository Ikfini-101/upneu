'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
// Schema for Step 1: Phone or Email
const phoneSchema = z.object({
    phone: z.string().min(10, "Numéro invalide").regex(/^\+?[0-9\s]+$/, "Format invalide"),
})

const emailSchema = z.object({
    email: z.string().email("Email invalide"),
})

// Schema for OTP Step
const otpSchema = z.object({
    otp: z.string().length(6, "Le code doit contenir 6 chiffres"),
})

import { signInWithPhone, verifyOtp, signInWithProvider, signInWithEmail } from './actions'
import { Mail, Phone } from 'lucide-react'

export default function LoginPage() {
    const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('email') // Default to email for free testing
    const [step, setStep] = useState<'input' | 'otp'>('input') // Renamed 'phone' step to 'input' generic
    const [loading, setLoading] = useState(false)
    const [identifier, setIdentifier] = useState('') // Phone or Email
    const [error, setError] = useState<string | null>(null)
    const [emailSent, setEmailSent] = useState(false)

    // Phone Form
    const phoneForm = useForm<z.infer<typeof phoneSchema>>({
        resolver: zodResolver(phoneSchema),
        defaultValues: { phone: '' },
    })

    // Email Form
    const emailForm = useForm<z.infer<typeof emailSchema>>({
        resolver: zodResolver(emailSchema),
        defaultValues: { email: '' },
    })

    // OTP Form
    const otpForm = useForm<z.infer<typeof otpSchema>>({
        resolver: zodResolver(otpSchema),
        defaultValues: { otp: '' },
    })

    const onPhoneSubmit = async (data: z.infer<typeof phoneSchema>) => {
        setLoading(true)
        setError(null)
        const formattedPhone = data.phone
        const res = await signInWithPhone(formattedPhone)

        if (res?.error) {
            setError(res.error)
        } else {
            setIdentifier(formattedPhone)
            setStep('otp')
        }
        setLoading(false)
    }

    const onEmailSubmit = async (data: z.infer<typeof emailSchema>) => {
        setLoading(true)
        setError(null)
        const res = await signInWithEmail(data.email)

        if (res?.error) {
            setError(res.error)
        } else {
            setIdentifier(data.email)
            setEmailSent(true) // Show success message for magic link
        }
        setLoading(false)
    }

    const onOtpSubmit = async (data: z.infer<typeof otpSchema>) => {
        setLoading(true)
        setError(null)
        const res = await verifyOtp(identifier, data.otp)

        if (res?.error) {
            setError(res.error)
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background overflow-hidden relative">
            {/* Ambient Background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[100px] rounded-full pointer-events-none" />

            <Card className="w-full max-w-md border-border/50 bg-card/60 backdrop-blur-xl shadow-2xl relative z-10">
                <CardHeader className="text-center space-y-2">
                    <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        Connexion
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-lg">
                        Connectez-vous simplement.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Social Buttons - Prominent & Simple */}
                    <div className="space-y-4">
                        <Button
                            variant="outline"
                            className="w-full h-14 bg-white hover:bg-white/90 text-black border-none font-semibold text-lg flex items-center gap-3 shadow-lg hover:scale-105 transition-transform"
                            onClick={async () => {
                                setLoading(true);
                                try {
                                    const res = await signInWithProvider('google', window.location.origin);
                                    if (res?.error) {
                                        alert("Erreur Google: " + res.error);
                                    } else if (res?.url) {
                                        window.location.href = res.url;
                                    }
                                } catch (e) {
                                    alert("Erreur inattendue: " + e);
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin text-black" /> : (
                                <>
                                    <svg className="h-6 w-6" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Continuer avec Google
                                </>
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full h-14 bg-black hover:bg-black/80 text-white border-white/20 font-semibold text-lg flex items-center gap-3 shadow-lg hover:scale-105 transition-transform"
                            onClick={async () => {
                                setLoading(true);
                                try {
                                    const res = await signInWithProvider('apple');
                                    if (res?.error) {
                                        alert("Erreur Apple: " + res.error);
                                    } else if (res?.url) {
                                        window.location.href = res.url;
                                    }
                                } catch (e) {
                                    alert("Erreur inattendue: " + e);
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin text-white" /> : (
                                <>
                                    <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                                        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z" />
                                    </svg>
                                    Continuer avec Apple
                                </>
                            )}
                        </Button>


                    </div>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground cursor-pointer hover:text-white transition-colors" onClick={() => setStep(step === 'input' ? 'otp' : 'input')}>
                                Autres options
                            </span>
                        </div>
                    </div>


                    {/* Classic Auth (Hidden/Secondary) */}
                    <div className="text-center">
                        <Button
                            variant="ghost"
                            onClick={() => document.getElementById('classic-auth')?.classList.toggle('hidden')}
                            className="text-muted-foreground hover:text-white"
                        >
                            Pas de réseaux sociaux ?
                        </Button>
                    </div>

                    <div id="classic-auth" className="hidden space-y-4 pt-4 border-t border-white/5">
                        <div className="text-center mb-4">
                            <span className="text-sm text-muted-foreground">Ou connectez-vous par email</span>
                        </div>

                        <AnimatePresence mode="wait">
                            {!emailSent ? (
                                <motion.div
                                    key="input-step"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                                        <div className="space-y-2">
                                            <Input
                                                {...emailForm.register('email')}
                                                placeholder="votre@email.com"
                                                className="bg-background/50 border-white/10 focus:border-primary/50 text-lg py-6"
                                            />
                                            {emailForm.formState.errors.email && (
                                                <p className="text-destructive text-sm">{emailForm.formState.errors.email.message}</p>
                                            )}
                                        </div>
                                        {error && <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>}
                                        <Button type="submit" className="w-full h-12 text-lg font-medium shadow-[0_0_15px_rgba(var(--primary),0.5)] transition-all duration-300" disabled={loading}>
                                            {loading ? <Loader2 className="animate-spin" /> : "Envoyer le Magic Link"}
                                        </Button>
                                    </form>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="email-sent"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center space-y-4 py-8"
                                >
                                    <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                                        <Mail className="w-8 h-8 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-semibold">Vérifiez vos emails</h3>
                                    <p className="text-muted-foreground">Un lien de connexion magique a été envoyé à <br /><span className="text-foreground">{identifier}</span>.</p>
                                    <Button variant="ghost" onClick={() => setEmailSent(false)}>Essayer une autre adresse</Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </CardContent>
            </Card>
        </div >
    )
}
