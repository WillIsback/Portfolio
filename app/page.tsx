import { Suspense } from "react";
import CarnetExplorer from "@/components/carnet/CarnetExplorer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Footer from "@/components/Footer/Footer";
import Header from "@/components/Header/Header";
import MarginNote from "@/components/notebook/MarginNote";
import ProjectRegister from "@/components/register/ProjectRegister";
import SkillsStack from "@/components/Skills/SkillsStack";
import mapJson from "@/content/map.json";
import { clusterLabels } from "@/content/map-clusters";
import { MapDataSchema } from "@/lib/carnet/map-types";
import { toMapView, toSearchItems } from "@/lib/carnet/map-view";

const map = MapDataSchema.parse(mapJson);
const view = toMapView(map, clusterLabels);
const searchItems = toSearchItems(map);

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

			<hr />
			<div className="flex flex-col py-10">
				<h2 className="m-auto text-center text-2xl font-bold">
					Mes skills à travers les stacks
				</h2>
				<SkillsStack />
			</div>
			<section id="realisations" className="h-fit px-4 sm:px-8 lg:px-30">
				<Suspense>
					<ErrorBoundary
						fallback={
							<p role="alert" className="text-sm text-destructive">
								Le registre des projets est momentanément indisponible.
							</p>
						}
					>
						<ProjectRegister points={view.points} neighbors={{}} entries={{}} />
					</ErrorBoundary>
				</Suspense>
			</section>
			<Footer />
		</main>
	);
}
