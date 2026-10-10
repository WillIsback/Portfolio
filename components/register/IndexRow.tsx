import type React from "react";
import { Fragment } from "react";
import { isExternalHref } from "@/lib/carnet/map-view";
import { domainLabels } from "@/lib/domains";
import { familiesOf } from "@/lib/practices";
import type { NormalizedProject } from "@/lib/projects-data";
import { projectYear, techNames } from "@/lib/register";
import { type ProjectStatusValue, STATUS_LABELS } from "@/lib/status";
import { isTraining } from "@/lib/training";
import DomainChips from "./DomainChips";
import PracticeMarks from "./PracticeMarks";
import TrainingBadge from "./TrainingBadge";

export default function IndexRow({
	project,
}: Readonly<{ project: NormalizedProject }>) {
	const name = (
		<span className="font-display font-semibold">{project.title}</span>
	);
	const statusLabel =
		project.status === "InProgress" || project.status === "Archived"
			? STATUS_LABELS[project.status as ProjectStatusValue]
			: null;
	const tech = techNames(project).slice(0, 4).join(" · ");
	// Segments présents seulement ; séparés pour un lecteur d'écran (le visuel n'a que des espaces).
	const segments = [
		isTraining(project.training) && {
			key: "training",
			node: <TrainingBadge training={project.training} short />,
		},
		domainLabels(project.domains).length > 0 && {
			key: "domains",
			node: <DomainChips domains={project.domains} />,
		},
		tech && { key: "tech", node: <span>{tech}</span> },
		familiesOf(project.practices.map((x) => x.practice)).length > 0 && {
			key: "practices",
			node: <PracticeMarks practices={project.practices} variant="compact" />,
		},
	].filter((x): x is { key: string; node: React.JSX.Element } => Boolean(x));
	return (
		<li className="grid grid-cols-[1fr_auto] items-start gap-x-4 gap-y-0.5 border-b border-border/60 py-2.5 sm:grid-cols-[minmax(10rem,14rem)_1fr_auto]">
			<span className="min-w-0">
				{project.github && !project.isPrivate ? (
					<a
						href={project.github}
						{...(isExternalHref(project.github)
							? { target: "_blank", rel: "noopener noreferrer" }
							: {})}
						className="block truncate rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						{name}
					</a>
				) : (
					<span className="flex min-w-0 items-baseline gap-2">
						<span className="truncate">{name}</span>
						<span className="shrink-0 font-mono text-[11px] text-ink-soft">
							privé
						</span>
					</span>
				)}
			</span>
			<span className="order-3 col-span-2 self-start text-sm text-ink-soft sm:order-none sm:col-span-1">
				<span className="line-clamp-1">
					{project.pitch?.trim() || project.description}
				</span>
				{segments.length > 0 ? (
					<span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px]">
						<span className="sr-only">, </span>
						{segments.map((segment, i) => (
							<Fragment key={segment.key}>
								{i > 0 ? <span className="sr-only">, </span> : null}
								{segment.node}
							</Fragment>
						))}
					</span>
				) : null}
			</span>
			<span className="font-mono text-xs text-ink-soft">
				{projectYear(project)}
				{statusLabel ? (
					<>
						<span className="sr-only">, </span>
						<span className="ml-2 font-mono text-[11px] text-ink-soft">
							{statusLabel}
						</span>
					</>
				) : null}
			</span>
		</li>
	);
}
