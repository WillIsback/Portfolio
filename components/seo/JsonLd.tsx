/**
 * Bloc `<script type="application/ld+json">`. Les `<` sont échappés en `<` :
 * une valeur contenant `</script>` ne peut pas fermer la balise.
 */
export default function JsonLd({
	data,
}: {
	data: Record<string, unknown> | Record<string, unknown>[];
}) {
	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON sérialisé et échappé ci-dessus
			dangerouslySetInnerHTML={{
				__html: JSON.stringify(data).replace(/</g, "\\u003c"),
			}}
		/>
	);
}
