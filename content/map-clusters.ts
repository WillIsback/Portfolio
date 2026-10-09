/**
 * Noms des groupes de la carte (Fig. 1). Clé = identifiant produit par `pnpm embeddings`
 * (c1…c5). Relire l'appartenance des groupes après chaque régénération.
 */
export const clusterLabels: Record<string, string> = {
	c1: "Agents et SRE",
	c2: "Outillage et CI",
	c3: "Web TypeScript",
	c4: "Data science",
	c5: "LLM et NLP",
};
