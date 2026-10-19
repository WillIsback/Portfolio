import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import CarnetExplorer from "@/components/carnet/CarnetExplorer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Footer from "@/components/Footer/Footer";
import Header from "@/components/Header/Header";
import Instruments from "@/components/home/Instruments";
import LatestEntries from "@/components/home/LatestEntries";
import MarginNote from "@/components/notebook/MarginNote";
import ProjectRegister from "@/components/register/ProjectRegister";
import RegisterView from "@/components/register/RegisterView";
import mapJson from "@/content/map.json";
import { clusterLabels } from "@/content/map-clusters";
import {
	articlesDir,
	getAllArticles,
	latestArticles,
	projectEntries,
	readArticle,
} from "@/lib/articles/loader";
import { MapDataSchema } from "@/lib/carnet/map-types";
import { toMapView } from "@/lib/carnet/map-view";
import { mapNeighbors } from "@/lib/register";

const map = MapDataSchema.parse(mapJson);
const neighbors = mapNeighbors(map);

export default async function Home({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	const dir = articlesDir(locale);
	const entries = latestArticles(3, dir);
	const byProject = projectEntries(getAllArticles(dir));
	const fallbackSlugs = entries
		.filter((entry) => readArticle(entry.slug, locale).fallback)
		.map((entry) => entry.slug);

	// Les noms de groupes sont traduits : la vue se construit donc dans le composant,
	// et plus au niveau du module où aucune locale n'est encore connue.
	const view = toMapView(map, clusterLabels(await getTranslations("clusters")));
	const t = await getTranslations("home");

	return (
		<main className="relative flex min-h-screen flex-col">
			<div className="sticky top-0 z-50 w-full">
				<Header />
			</div>

			<section
				aria-labelledby="carnet-title"
				className="mx-auto w-full max-w-6xl px-4 pt-10 pb-16 sm:px-6 lg:pt-16"
			>
				<CarnetExplorer
					points={view.points}
					clusters={view.clusters}
					intro={
						<>
							<h1
								id="carnet-title"
								className="font-display text-4xl font-bold tracking-tight sm:text-5xl"
							>
								{t("title")}
							</h1>
							<p className="mt-4 max-w-prose text-lg leading-relaxed">
								{t("intro")}
							</p>
						</>
					}
					note={<MarginNote inline>{t("note")}</MarginNote>}
				/>
			</section>

			<div className="mx-auto w-full max-w-6xl space-y-20 px-4 pb-20 sm:px-6">
				{entries.length > 0 ? (
					<section aria-labelledby="entries-title">
						<h2 id="entries-title" className="font-display text-2xl font-bold">
							{t("latestEntries")}
						</h2>
						<div className="mt-6">
							<LatestEntries articles={entries} fallbackSlugs={fallbackSlugs} />
						</div>
					</section>
				) : null}
				<section id="realisations" aria-labelledby="register-title">
					<h2 id="register-title" className="font-display text-2xl font-bold">
						{t("register")}
					</h2>
					<div className="mt-6">
						<noscript>
							<p className="text-sm text-ink-soft">
								{/* La phrase s'arrête avant le nom de marque, qui reste en dur
								    comme `ML`/`LLM` : seul le texte se traduit. */}
								{t("registerNoscript")}{" "}
								<a
									href="https://github.com/WillIsback"
									className="text-primary underline underline-offset-4"
								>
									GitHub
								</a>
								.
							</p>
						</noscript>
						<Suspense
							fallback={
								<RegisterView
									featuredStatus="loading"
									indexStatus="loading"
									featured={[]}
									index={[]}
									filtersActive={false}
									filterBar={null}
									points={[]}
									neighbors={{}}
									entries={{}}
								/>
							}
						>
							<ErrorBoundary
								fallback={
									<p role="alert" className="text-sm text-destructive">
										{t("registerUnavailable")}
									</p>
								}
							>
								<ProjectRegister
									points={view.points}
									neighbors={neighbors}
									entries={byProject}
								/>
							</ErrorBoundary>
						</Suspense>
					</div>
				</section>
				<section aria-labelledby="instruments-title">
					<h2
						id="instruments-title"
						className="font-display text-2xl font-bold"
					>
						{t("instruments")}
					</h2>
					<div className="mt-6">
						<Instruments />
					</div>
				</section>
			</div>
			<Footer />
		</main>
	);
}
