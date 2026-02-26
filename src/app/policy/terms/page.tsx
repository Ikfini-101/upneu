import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background py-10 px-4">
            <div className="max-w-2xl mx-auto space-y-8">
                <Button variant="ghost" asChild className="mb-8">
                    <Link href="/login">← Retour</Link>
                </Button>

                <div className="prose prose-invert max-w-none">
                    <h1 className="text-3xl font-bold mb-6 text-primary">Conditions d'Utilisation (CGU)</h1>
                    <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : 18 Février 2026</p>

                    <p>Bienvenue sur ANO. En utilisant notre application, vous acceptez les règles suivantes, inspirées par l'esprit de <strong>Sutura</strong> (discrétion et dignité).</p>

                    <h3>1. Acceptation des Conditions</h3>
                    <p>L'accès à ANO implique l'acceptation sans réserve des présentes conditions. Si vous n'êtes pas d'accord, veuillez ne pas utiliser l'application.</p>

                    <h3>2. Le concept ANO</h3>
                    <p>ANO est un espace de libération de la parole anonyme.</p>
                    <ul>
                        <li><strong>Anonymat</strong> : Vous portez un "Masque" virtuel. Votre identité réelle n'est jamais affichée publiquement.</li>
                        <li><strong>Bienveillance</strong> : Cet espace est fait pour le soutien, pas pour le jugement ou la haine.</li>
                    </ul>

                    <h3>3. Règles de Conduite (Code de l'Initié)</h3>
                    <p>Il est strictement interdit de poster :</p>
                    <ul>
                        <li>Des propos diffamatoires, racistes, haineux ou discriminatoires.</li>
                        <li>Du contenu identifiant précisément d'autres personnes (doxxing).</li>
                        <li>Du contenu sexuellement explicite ou violent.</li>
                        <li>Du harcèlement ou des menaces.</li>
                    </ul>
                    <p><strong>Sanctions</strong> : Tout manquement entraînera une perte de Karma, une suspension temporaire ou un bannissement définitif (suppression de compte).</p>

                    <h3>4. Modération et Signalement</h3>
                    <p>La communauté veille. Vous vous engagez à signaler tout contenu violant ces règles via le bouton "Signaler". Nos modérateurs (et l'IA) se réservent le droit de supprimer tout contenu inapproprié.</p>

                    <h3>5. Responsabilité</h3>
                    <p>Vous êtes seul responsable de vos propos. Bien que l'application soit anonyme, votre adresse IP et vos métadonnées peuvent être conservées pour répondre aux requêtes légales en cas d'infraction grave.</p>
                </div>
            </div>
        </div>
    )
}
