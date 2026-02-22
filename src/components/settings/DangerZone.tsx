'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Trash2 } from "lucide-react"
import { deleteAccount, deleteData } from "@/app/settings/actions"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"

export function DangerZone() {
    const [deleteDataOpen, setDeleteDataOpen] = useState(false)
    const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)
    const [confirmText, setConfirmText] = useState("")
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDeleteData = async () => {
        setIsDeleting(true)
        try {
            const res = await deleteData()
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success("Toutes vos données (confessions, commentaires, veilles) ont été supprimées.")
                setDeleteDataOpen(false)
            }
        } catch (e) {
            toast.error("Une erreur est survenue.")
        } finally {
            setIsDeleting(false)
        }
    }

    const handleDeleteAccount = async () => {
        if (confirmText !== "SUPPRIMER") return

        setIsDeleting(true)
        try {
            const res = await deleteAccount()
            // Redirect happens in server action
        } catch (e) {
            toast.error("Une erreur est survenue lors de la suppression du compte.")
            setIsDeleting(false)
        }
    }

    return (
        <Card className="border-red-900/20 bg-red-950/10 mt-8">
            <CardHeader>
                <CardTitle className="text-red-500 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Zone de Danger
                </CardTitle>
                <CardDescription className="text-red-400/80">
                    Ces actions sont irréversibles. Soyez prudent.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                
                {/* Wipe Data */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 border border-red-900/20 rounded-lg bg-red-950/5">
                    <div>
                        <h4 className="font-medium text-foreground">Effacer mon contenu</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            Supprime toutes vos confessions, commentaires et interactions. Votre compte reste actif.
                        </p>
                    </div>
                    <AlertDialog open={deleteDataOpen} onOpenChange={setDeleteDataOpen}>
                        <AlertDialogTrigger asChild>
                             <Button variant="outline" className="border-red-900/30 text-red-500 hover:bg-red-950/30 hover:text-red-400 shrink-0">
                                Effacer les données
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="border-red-900/20 bg-card">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Cette action supprimera toutes vos confessions, commentaires, likes et veilles de manière définitive.
                                    <br/><br/>
                                    Votre profil restera accessible mais vide.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <Button 
                                    variant="destructive" 
                                    onClick={handleDeleteData}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? "Suppression..." : "Oui, tout effacer"}
                                </Button>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>

                {/* Delete Account */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 border border-red-900/20 rounded-lg bg-red-950/5">
                    <div>
                        <h4 className="font-medium text-red-500">Supprimer mon compte</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            Supprime définitivement votre compte et tout son contenu. Pas de retour en arrière.
                        </p>
                    </div>
                     <AlertDialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
                        <AlertDialogTrigger asChild>
                             <Button variant="destructive" className="shrink-0">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer mon compte
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="border-red-900/20 bg-card">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-red-500">Suppression Définitive</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Vous êtes sur le point de supprimer votre compte <strong>définitivement</strong>.
                                    <br/><br/>
                                    Veuillez taper <strong>SUPPRIMER</strong> ci-dessous pour confirmer.
                                </AlertDialogDescription>
                                <div className="py-4">
                                    <Input 
                                        value={confirmText}
                                        onChange={(e) => setConfirmText(e.target.value)}
                                        placeholder="Tapez SUPPRIMER"
                                        className="border-red-900/30"
                                    />
                                </div>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setConfirmText("")}>Annuler</AlertDialogCancel>
                                <Button 
                                    variant="destructive" 
                                    onClick={handleDeleteAccount}
                                    disabled={isDeleting || confirmText !== "SUPPRIMER"}
                                >
                                    {isDeleting ? "Adieu..." : "Confirmer la suppression"}
                                </Button>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>

            </CardContent>
        </Card>
    )
}
