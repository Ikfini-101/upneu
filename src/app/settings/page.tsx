'use client'

import { DangerZone } from "@/components/settings/DangerZone"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"

export default function SettingsPage() {

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-0">
            <Header />

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
                </div>
            </main>

            <div className="md:hidden">
                <BottomNav />
            </div>
        </div>
    )
}
