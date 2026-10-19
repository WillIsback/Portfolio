// app/(admin)/admin/(app)/projects/[id]/layout.tsx
//
// Seul endroit de l'espace admin qui monte un `NextIntlClientProvider` : l'aperçu projet
// (`ProjectPreview`) rend `components/register/*` — `FeaturedCard`, `IndexRow`, et par
// eux `DomainChips`, `PracticeMarks`, `TechBar`, `TrainingBadge` — qui sont localisés et
// lisent la locale par hook.
//
// Il est ici, et pas dans `app/(admin)/layout.tsx`, parce que le provider sérialise le
// dictionnaire `fr` entier dans le HTML : au niveau racine, `/admin/login` (zéro chaîne
// traduite) l'aurait payé comme les neuf autres pages admin.
//
// Pas de `setRequestLocale("fr")` ici contrairement au segment `[locale]` : cette route
// est déjà `ƒ` (elle lit la base), donc la lecture de `headers()` que le provider
// provoque ne coûte rien. Au niveau racine, elle faisait basculer `/admin/login` de `○`
// à `ƒ`.

import { NextIntlClientProvider } from "next-intl";
import fr from "@/messages/fr.json";

export default function AdminProjectLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<NextIntlClientProvider locale="fr" messages={fr}>
			{children}
		</NextIntlClientProvider>
	);
}
