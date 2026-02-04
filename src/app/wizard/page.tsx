'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { checkPseudoAvailability, createMask } from './actions'
import { Loader2, ArrowRight, ArrowLeft, ShieldCheck, VenetianMask } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

// Schema Step 1: Pseudo
const pseudoSchema = z.object({
    pseudo: z.string().min(3, "Le pseudo doit faire au moins 3 caractères").max(20, "Pseudo trop long"),
})

// Schema Step 2: Demographics
const demographicsSchema = z.object({
    sex: z.enum(['H', 'F']),
    age: z.coerce.number().min(13, "Vous devez avoir au moins 13 ans").max(100, "Âge invalide"),
    city: z.string().min(2, "Ville requise"),
})

// Schema Step 3: Phone (Optional/Required based on context, but let's make it required as per user request)
const phoneSchema = z.object({
    phone: z.string().min(9, "Numéro requis (Ex: +221 77...)").regex(/^\+?[0-9\s]+$/, "Format invalide"),
})

export default function WizardPage() {
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1) // Increased steps
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Data State
    const [pseudoData, setPseudoData] = useState<string>('')
    const [demographicsData, setDemographicsData] = useState<{ sex: 'H' | 'F', age: number, city: string } | null>(null)
    const [phoneData, setPhoneData] = useState<string>('')

    const router = useRouter()

    // Forms
    const pseudoForm = useForm({
        resolver: zodResolver(pseudoSchema),
        defaultValues: { pseudo: '' },
    })

    const demographicsForm = useForm({
        resolver: zodResolver(demographicsSchema),
        defaultValues: { city: 'Dakar', age: 18, sex: 'H' as const },
    })

    const phoneForm = useForm({
        resolver: zodResolver(phoneSchema),
        defaultValues: { phone: '' },
    })

    // Handlers
    const onPseudoSubmit = async (data: z.infer<typeof pseudoSchema>) => {
        setLoading(true)
        setError(null)
        const res = await checkPseudoAvailability(data.pseudo)

        if (res?.error) {
            setError(res.error)
        } else if (!res.available) {
            setError("Ce pseudo est déjà pris, désolé !")
        } else {
            setPseudoData(data.pseudo)
            setStep(2)
        }
        setLoading(false)
    }

    const onDemographicsSubmit = (data: z.infer<typeof demographicsSchema>) => {
        setDemographicsData(data)
        setStep(3)
    }

    const onPhoneSubmit = (data: z.infer<typeof phoneSchema>) => {
        setPhoneData(data.phone)
        setStep(4)
    }

    const onFinalSubmit = async () => {
        if (!pseudoData || !demographicsData) return
        setLoading(true)

        const res = await createMask({
            pseudo: pseudoData,
            ...demographicsData,
            phone: phoneData // Pass phone data
        })

        if (res?.error) {
            setError(res.error || "Une erreur est survenue")
            setLoading(false)
        } else {
            router.push('/feed')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background overflow-hidden relative">
            {/* Ambient Background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/10 blur-[120px] rounded-full pointer-events-none" />

            <Card className="w-full max-w-lg border-border/50 bg-card/60 backdrop-blur-xl shadow-2xl relative z-10 transition-all duration-500">
                <CardHeader className="text-center space-y-2">
                    <div className="flex justify-center mb-4">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                            {step === 1 && <VenetianMask className="h-8 w-8 text-primary" />}
                            {step === 2 && <ShieldCheck className="h-8 w-8 text-primary" />}
                            {step === 3 && <ShieldCheck className="h-8 w-8 text-primary" />}
                            {step === 4 && <ShieldCheck className="h-8 w-8 text-primary" />}
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        {step === 1 && "Choisissez votre Masque"}
                        {step === 2 && "Qui est derrière le masque ?"}
                        {step === 3 && "Sécurité & Contact"}
                        {step === 4 && "Ultime étape"}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        {step === 1 && "Ce nom sera votre nouvelle identité sur ANO."}
                        {step === 2 && "Ces infos servent uniquement aux statistiques."}
                        {step === 3 && "Un numéro pour récupérer votre compte en cas de problème."}
                        {step === 4 && "Sachez que votre anonymat est notre priorité."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.form
                                key="step-1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={pseudoForm.handleSubmit(onPseudoSubmit)}
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-xs">Nom du Masque</label>
                                    <Input
                                        {...pseudoForm.register('pseudo')}
                                        placeholder="Ex: LePenseurSilencieux"
                                        className="bg-background/50 border-white/10 focus:border-primary/50 text-lg py-6"
                                    />
                                    {pseudoForm.formState.errors.pseudo && (
                                        <p className="text-destructive text-sm">{pseudoForm.formState.errors.pseudo.message}</p>
                                    )}
                                </div>

                                {error && <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>}

                                <Button type="submit" className="w-full h-12 text-lg font-medium shadow-[0_0_15px_rgba(var(--primary),0.5)] hover:shadow-[0_0_25px_rgba(var(--primary),0.7)] transition-all duration-300" disabled={loading}>
                                    {loading ? <Loader2 className="animate-spin" /> : "Suivant"}
                                </Button>
                            </motion.form>
                        )}

                        {step === 2 && (
                            <motion.form
                                key="step-2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={demographicsForm.handleSubmit(onDemographicsSubmit)}
                                className="space-y-6"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2 col-span-2 sm:col-span-1">
                                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-xs">Age</label>
                                        <Input
                                            type="number"
                                            {...demographicsForm.register('age')}
                                            className="bg-background/50 border-white/10 focus:border-primary/50"
                                        />
                                        {demographicsForm.formState.errors.age && (
                                            <p className="text-destructive text-sm">{demographicsForm.formState.errors.age.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2 col-span-2 sm:col-span-1">
                                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-xs">Sexe</label>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant={demographicsForm.watch('sex') === 'H' ? 'default' : 'outline'}
                                                onClick={() => demographicsForm.setValue('sex', 'H')}
                                                className="flex-1"
                                            >
                                                Homme
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={demographicsForm.watch('sex') === 'F' ? 'default' : 'outline'}
                                                onClick={() => demographicsForm.setValue('sex', 'F')}
                                                className="flex-1"
                                            >
                                                Femme
                                            </Button>
                                        </div>
                                        {demographicsForm.formState.errors.sex && (
                                            <p className="text-destructive text-sm">{demographicsForm.formState.errors.sex.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-xs">Ville</label>
                                        <Input
                                            {...demographicsForm.register('city')}
                                            className="bg-background/50 border-white/10 focus:border-primary/50"
                                        />
                                        {demographicsForm.formState.errors.city && (
                                            <p className="text-destructive text-sm">{demographicsForm.formState.errors.city.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <Button type="button" variant="ghost" onClick={() => setStep(1)} disabled={loading}>
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                                    </Button>
                                    <Button type="submit" className="flex-1" disabled={loading}>
                                        Continuer <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </motion.form>
                        )}

                        {step === 3 && (
                            <motion.form
                                key="step-3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={phoneForm.handleSubmit(onPhoneSubmit)}
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-xs">Numéro de mobile</label>
                                    <Input
                                        {...phoneForm.register('phone')}
                                        placeholder="+221 77 000 00 00"
                                        className="bg-background/50 border-white/10 focus:border-primary/50 text-lg py-6"
                                    />
                                    <p className="text-xs text-muted-foreground">Utilisé uniquement pour récupérer votre compte.</p>
                                    {phoneForm.formState.errors.phone && (
                                        <p className="text-destructive text-sm">{phoneForm.formState.errors.phone.message}</p>
                                    )}
                                </div>

                                <div className="flex gap-4">
                                    <Button type="button" variant="ghost" onClick={() => setStep(2)} disabled={loading}>
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                                    </Button>
                                    <Button type="submit" className="flex-1" disabled={loading}>
                                        Continuer <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </motion.form>
                        )}

                        {step === 4 && (
                            <motion.div
                                key="step-4"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                className="space-y-6 text-center"
                            >
                                <div className="p-6 rounded-xl bg-primary/10 border border-primary/20 text-left space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-primary/20 rounded-lg">
                                            <ShieldCheck className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-foreground">Confidentialité Totale</h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                                                Votre numéro de téléphone ne sera
                                                <span className="text-foreground font-medium"> JAMAIS </span>
                                                lié publiquement à votre masque <span className="text-primary font-bold">"{pseudoData}"</span>.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {error && <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>}

                                <div className="flex gap-4 pt-4">
                                    <Button type="button" variant="ghost" onClick={() => setStep(3)} disabled={loading}>
                                        Retour
                                    </Button>
                                    <Button onClick={onFinalSubmit} className="flex-1 h-12 text-lg shadow-[0_0_20px_rgba(var(--primary),0.4)]" disabled={loading}>
                                        {loading ? <Loader2 className="animate-spin" /> : "Créer mon Masque"}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>
        </div>
    )
}
