/**
 * Noms des groupes de la carte (Fig. 1). Clé = identifiant produit par `pnpm embeddings`
 * (c1…c5). Relire l'appartenance des groupes après chaque régénération.
 *
 * Les noms sont lus dans le dictionnaire : `content/map.json` en garde une copie en
 * français (c'est un artefact de génération, régénéré par `scripts/carnet/build-map.ts`
 * avec le traducteur français), mais `toMapView(map, clusterLabels(t))` les remplace à
 * l'affichage par ceux de la locale courante.
 */
import type { Translator } from "@/i18n/translator";

export function clusterLabels(t: Translator): Record<string, string> {
	return {
		c1: t("c1"),
		c2: t("c2"),
		c3: t("c3"),
		c4: t("c4"),
		c5: t("c5"),
	};
}

/** Identifiants des groupes, dans l'ordre canonique (clé → nom de la carte). */
export const CLUSTER_IDS = ["c1", "c2", "c3", "c4", "c5"] as const;
