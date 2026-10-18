import LatestEntries from "@/components/home/LatestEntries";
import { getAllArticles } from "@/lib/articles/loader";

const description =
	"Retours d'expérience chiffrés sur les agents autonomes, les LLM servis en local, l'observabilité et l'infrastructure.";

export default function ArticlesPage() {
	const articles = getAllArticles();

	return (
		<div className="mx-auto w-full max-w-3xl">
			<header className="mb-10 space-y-3">
				<p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
					Carnet · entrées
				</p>
				<h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
					Articles
				</h1>
				<p className="max-w-2xl text-lg text-muted-foreground">{description}</p>
			</header>

			{articles.length === 0 ? (
				<p className="text-muted-foreground">Aucun article pour le moment.</p>
			) : (
				<LatestEntries
					articles={articles}
					showAllLink={false}
					headingLevel={2}
				/>
			)}
		</div>
	);
}
