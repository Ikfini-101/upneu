import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background py-10 px-4">
            <div className="max-w-2xl mx-auto space-y-8">
                <Button variant="ghost" asChild className="mb-8">
                    <Link href="/login">← Retour</Link>
                </Button>

                <div className="prose prose-invert max-w-none">
                    <h1 className="text-3xl font-bold mb-6 text-primary">Politique de Confidentialité</h1>
                    <p className="text-lg font-light text-muted-foreground mb-8">Chez ANO, votre Sutura (discrétion) est notre priorité absolue.</p>

                    <h3>1. Données Collectées</h3>
                    <p>Nous minimisons la collecte de données :</p>
                    <ul>
                        <li><strong>Compte</strong> : Numéro de téléphone (pour l'authentification unique), Pseudo d'Initié (public), Âge et Sexe (pour le contexte du Masque).</li>
                        <li><strong>Contenu</strong> : Vos confessions (texte/audio) et commentaires.</li>
                        <li><strong>Technique</strong> : Logs de connexion, adresse IP (sécurité uniquement).</li>
                    </ul>

                    <h3>2. Anonymat et Pseudonymat</h3>
                    <ul>
                        <li>Sur l'application, vous n'êtes identifié que par votre <strong>Masque</strong> (ex: "Anonyme").</li>
                        <li>Votre numéro de téléphone n'est <strong>JAMAIS</strong> visible par les autres utilisateurs.</li>
                    </ul>

                    <h3>3. Utilisation des Données</h3>
                    <p>Vos données servent uniquement à :</p>
                    <ul>
                        <li>Vous authentifier.</li>
                        <li>Afficher votre fil d'actualité et vos interactions.</li>
                        <li>Assurer la modération et la sécurité de la plateforme.</li>
                    </ul>

                    <h3>4. Partage des Données</h3>
                    <p>Nous ne vendons <strong>jamais</strong> vos données personnelles. Elles peuvent être partagées uniquement si la loi l'exige (réquisition judiciaire).</p>

                    <h3>5. Vos Droits (Zone de Danger)</h3>
                    <p>Conformément aux réglementations (RGPD/Lois locales), vous pouvez à tout moment :</p>
                    <ul>
                        <li><strong>Tout effacer</strong> : Supprimer vos confessions et commentaires via les Paramètres.</li>
                        <li><strong>Partir</strong> : Supprimer définitivement votre compte. Toutes vos données seront effacées de nos serveurs.</li>
                    </ul>

                    <h3>6. Contact</h3>
                    <p>Pour toute question sur vos données ou pour exercer vos droits : <code>support@ano-app.com</code></p>
                </div>
            </div>
        </div>
    )
}
