'use client'

import { DangerZone } from "@/components/settings/DangerZone"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

export default function SettingsPage() {
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.replace('/login')
    }

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-0">

            <main className="container max-w-2xl mx-auto pt-24 px-4 space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Paramètres</h1>
                    <p className="text-muted-foreground">
                        Gérez vos préférences et votre compte.
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Placeholder for future settings */}
                    {/* <Card> ... Notifications, Theme etc ... </Card> */}

                    <DangerZone />

                    <div className="pt-8 border-t border-white/10">
                        <Button
                            variant="outline"
                            className="w-full justify-start text-muted-foreground hover:text-foreground"
                            onClick={handleLogout}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Se déconnecter
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    )
}
