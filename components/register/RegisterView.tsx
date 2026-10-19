import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { MapPoint } from "@/lib/carnet/map-view";
import type { NormalizedProject } from "@/lib/projects-data";
import FeaturedCard from "./FeaturedCard";
import FilterDisclosure from "./FilterDisclosure";
import IndexRow from "./IndexRow";

type BlockStatus = "loading" | "error" | "ready";

interface RegisterViewProps {
	featuredStatus: BlockStatus;
	indexStatus: BlockStatus;
	featured: NormalizedProject[];
	index: NormalizedProject[];
	filtersActive: boolean;
	filterBar: ReactNode;
	points: MapPoint[];
	neighbors: Record<string, string[]>;
	entries: Record<number, { slug: string; title: string }>;
}

/**
 * Le message du squelette est passé en prop : `Skeleton` est un composant frère, et
 * `useTranslations` n'est pas disponible hors du corps d'un composant.
 */
function Skeleton({
	count,
	label,
}: Readonly<{ count: number; label: string }>) {
	return (
		<div aria-busy="true" className="grid gap-6 md:grid-cols-2">
			<p className="sr-only">{label}</p>
			{Array.from({ length: count }, (_, i) => `sk-${i}`).map((key) => (
				<div
					key={key}
					className="h-72 rounded-md border border-border bg-paper-grid motion-safe:animate-pulse"
				/>
			))}
		</div>
	);
}

function BlockError({ message }: Readonly<{ message: string }>) {
	return (
		<p
			role="alert"
			className="mt-4 rounded-md border border-destructive/40 p-4 text-sm text-destructive"
		>
			{message}
		</p>
	);
}

/**
 * Vue du registre : une section pour les projets phares, une pour l'index filtrable.
 *
 * `useTranslations` et non `getTranslations` : ce composant est rendu deux fois dans deux
 * graphes différents — comme `fallback` de `Suspense` par `app/[locale]/page.tsx`
 * (serveur), et comme enfant du composant client `ProjectRegister`. Un composant serveur
 * ne peut pas être importé par un composant client sans le devenir lui aussi : le hook,
 * qui fonctionne des deux côtés, est donc le seul choix possible ici.
 */
export default function RegisterView(props: Readonly<RegisterViewProps>) {
	const {
		featuredStatus,
		indexStatus,
		featured,
		index,
		filtersActive,
		filterBar,
		points,
		neighbors,
		entries,
	} = props;
	const t = useTranslations("register");
	const showFeatured = featuredStatus !== "ready" || featured.length > 0;
	return (
		<div className="space-y-12">
			{showFeatured ? (
				<div>
					<h3 className="font-display text-lg font-semibold">
						{t("featured")}
					</h3>
					{featuredStatus === "loading" ? (
						<div className="mt-4">
							<Skeleton count={4} label={t("loading")} />
						</div>
					) : featuredStatus === "error" ? (
						<BlockError message={t("error")} />
					) : (
						<ul className="mt-4 grid gap-6 md:grid-cols-2">
							{featured.map((project, i) => (
								<li key={project.id}>
									<FeaturedCard
										project={project}
										figureNumber={i + 2}
										points={points}
										neighborIds={neighbors[`project:${project.id}`] ?? []}
										entry={entries[project.id]}
									/>
								</li>
							))}
						</ul>
					)}
				</div>
			) : null}
			<div>
				<h3 className="font-display text-lg font-semibold">{t("index")}</h3>
				<FilterDisclosure filtersActive={filtersActive}>
					{filterBar}
				</FilterDisclosure>
				{indexStatus === "loading" ? (
					<div className="mt-4">
						<Skeleton count={2} label={t("loading")} />
					</div>
				) : indexStatus === "error" ? (
					<BlockError message={t("error")} />
				) : index.length > 0 ? (
					<ul className="mt-4">
						{index.map((project) => (
							<IndexRow key={project.id} project={project} />
						))}
					</ul>
				) : (
					<p className="mt-4 text-sm text-ink-soft">
						{filtersActive ? t("noMatch") : t("empty")}
					</p>
				)}
			</div>
		</div>
	);
}
