import Image from "next/image";
import Link from "next/link";
import FigureCaption from "@/components/notebook/FigureCaption";
import { isExternalHref, type MapPoint } from "@/lib/carnet/map-view";
import type { NormalizedProject } from "@/lib/projects-data";
import { isCapture, techComposition, techNames } from "@/lib/register";
import MiniMap from "./MiniMap";
import TechBar from "./TechBar";

interface FeaturedCardProps {
	project: NormalizedProject;
	figureNumber: number;
	points: MapPoint[];
	neighborIds: string[];
	entry?: { slug: string; title: string };
}

const firstSentence = (text: string) =>
	text.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? text;

const LINK =
	"rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function FeaturedCard({
	project,
	figureNumber,
	points,
	neighborIds,
	entry,
}: Readonly<FeaturedCardProps>) {
	const mapId = `project:${project.id}`;
	const onMap = points.some((pt) => pt.id === mapId);
	const capture = isCapture(project.imagePath) ? project.imagePath : null;
	const shares = techComposition(project);
	return (
		<article className="flex h-full flex-col rounded-md border border-border bg-background/70 p-5">
			<figure className="m-0">
				{capture ? (
					<div className="relative aspect-[16/10] overflow-hidden rounded-sm border border-border">
						<Image
							src={capture}
							alt={`Capture de ${project.title}`}
							fill
							sizes="(min-width: 1024px) 30vw, 100vw"
							className="object-cover"
						/>
					</div>
				) : onMap ? (
					<div className="mx-auto aspect-square w-40">
						<MiniMap
							points={points}
							focusId={mapId}
							neighborIds={neighborIds}
						/>
					</div>
				) : null}
				<div className="mt-3">
					<TechBar shares={shares} />
				</div>
				<FigureCaption number={figureNumber}>
					{capture
						? project.title
						: onMap
							? `${project.title} parmi ses voisins`
							: `Composition de ${project.title}`}
				</FigureCaption>
			</figure>
			<h3 className="mt-4 font-display text-xl font-semibold">
				{project.title}
			</h3>
			<p className="mt-2 text-base leading-relaxed">
				{firstSentence(project.description)}
			</p>
			<p className="mt-3 font-mono text-[11px] text-ink-soft">
				{techNames(project).join(" · ")}
			</p>
			<div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-4 text-sm">
				{project.github && isExternalHref(project.github) ? (
					<a
						href={project.github}
						target="_blank"
						rel="noopener noreferrer"
						className={LINK}
					>
						Dépôt GitHub
					</a>
				) : null}
				{entry ? (
					<Link href={`/articles/${entry.slug}`} className={LINK}>
						Lire l&apos;entrée du carnet
					</Link>
				) : null}
			</div>
		</article>
	);
}
