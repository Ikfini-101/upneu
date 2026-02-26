import { createClient } from "@/lib/supabase/client";

export async function checkPseudoAvailability(pseudo: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('masks')
        .select('id')
        .ilike('name', pseudo)
        .single();

    if (error && error.code !== 'PGRST116') {
        // PGRST116 matches no rows found, which is good
        return { error: error.message };
    }

    return { available: !data };
}

export async function createMask(formData: {
    pseudo: string;
    sex: 'H' | 'F';
    age: number;
    city: string;
    phone?: string; // Add optional phone
}) {
    const supabase = createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Utilisateur non connecté" };
    }

    // Attempt to save phone to user metadata (private)
    if (formData.phone) {
        const { error: updateError } = await supabase.auth.updateUser({
            data: { mobile_phone_collected: formData.phone }
        });
        if (updateError) console.error("Error saving phone:", updateError);
    }

    const { error } = await supabase.from('masks').insert({
        user_id: user.id,
        name: formData.pseudo,
        sex: formData.sex,
        age: formData.age,
        city: formData.city,
    });

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}
