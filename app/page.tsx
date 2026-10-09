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
	getAllArticles,
	latestArticles,
	projectEntries,
} from "@/lib/articles/loader";
import { MapDataSchema } from "@/lib/carnet/map-types";
import { toMapView, toSearchItems } from "@/lib/carnet/map-view";
import { mapNeighbors } from "@/lib/register";

const map = MapDataSchema.parse(mapJson);
const view = toMapView(map, clusterLabels);
const searchItems = toSearchItems(map);
const entries = latestArticles(3);
const byProject = projectEntries(getAllArticles());
const neighbors = mapNeighbors(map);

export default function Home() {
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
					searchItems={searchItems}
					intro={
						<>
							<h1
								id="carnet-title"
								className="font-display text-4xl font-bold tracking-tight sm:text-5xl"
							>
								Carnet de labo
							</h1>
							<p className="mt-4 max-w-prose text-lg leading-relaxed">
								William Derue, développeur IA en parcours AI Engineer. Ce carnet
								consigne mes expériences : modèles entraînés, agents,
								infrastructure.
							</p>
						</>
					}
					note={
						<MarginNote inline>
							essaie « vision », « agents » ou « LLM local » : la carte cherche
							avec un vrai modèle d&apos;embeddings, dans ton navigateur
						</MarginNote>
					}
				/>
			</section>

			<div className="mx-auto w-full max-w-6xl space-y-20 px-4 pb-20 sm:px-6">
				{entries.length > 0 ? (
					<section aria-labelledby="entries-title">
						<h2 id="entries-title" className="font-display text-2xl font-bold">
							Dernières entrées
						</h2>
						<div className="mt-6">
							<LatestEntries articles={entries} />
						</div>
					</section>
				) : null}
				<section id="realisations" aria-labelledby="register-title">
					<h2 id="register-title" className="font-display text-2xl font-bold">
						Registre des projets
					</h2>
					<div className="mt-6">
						<noscript>
							<p className="text-sm text-ink-soft">
								Le registre se charge avec JavaScript ; mes dépôts sont aussi
								sur{" "}
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
										Le registre des projets est momentanément indisponible.
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
						Instruments
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
