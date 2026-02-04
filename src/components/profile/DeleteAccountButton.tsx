'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteAccount } from "@/app/profile/actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function DeleteAccountButton() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        if (confirm("ATTENTION : Cette action est irréversible.\n\nVoulez-vous vraiment supprimer votre compte et toutes vos données ?")) {
            setLoading(true)
            try {
                const res = await deleteAccount()
                if (res.success) {
                    toast.success("Compte supprimé.")
                    router.push('/')
                } else {
                    toast.error("Erreur lors de la suppression.")
                }
            } catch (e) {
                toast.error("Une erreur est survenue.")
            } finally {
                setLoading(false)
            }
        }
    }

    return (
        <Button
            variant="destructive"
            className="w-full sm:w-auto bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
            onClick={handleDelete}
            disabled={loading}
        >
            <Trash2 className="mr-2 h-4 w-4" />
            {loading ? "Suppression..." : "Supprimer mon compte"}
        </Button>
    )
}
