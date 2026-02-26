'use server'

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function deleteAccount() {
    const supabase = await createClient()

    const { error } = await supabase.rpc('delete_own_account')

    if (error) {
        console.error('Error deleting account:', error)
        return { error: "Impossible de supprimer le compte. Réessayez plus tard." }
    }

    // Sign out explicitly
    await supabase.auth.signOut()

    redirect('/')
}

export async function deleteData() {
    const supabase = await createClient()

    const { error } = await supabase.rpc('wipe_user_content')

    if (error) {
        console.error('Error wiping data:', error)
        return { error: "Erreur lors de la suppression des données." }
    }

    return { success: true }
}
