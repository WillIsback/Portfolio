/**
 * Noms des groupes de la carte (Fig. 1). Clé = identifiant produit par `pnpm embeddings`
 * (c1…c5). Relire l'appartenance des groupes après chaque régénération.
 */
export const clusterLabels: Record<string, string> = {
	c1: "LLM et agents",
	c2: "Services et API",
	c3: "Data et web",
	c4: "Vision et classification",
	c5: "Outillage développeur",
};
