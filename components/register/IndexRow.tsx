import { isExternalHref } from "@/lib/carnet/map-view";
import type { NormalizedProject } from "@/lib/projects-data";
import { projectYear, techNames } from "@/lib/register";
import DomainChips from "./DomainChips";

export default function IndexRow({
	project,
}: Readonly<{ project: NormalizedProject }>) {
	const name = (
		<span className="font-display font-semibold">{project.title}</span>
	);
	const tech = techNames(project).slice(0, 4).join(" · ");
	return (
		<li className="grid grid-cols-[1fr_auto] items-start gap-x-4 gap-y-0.5 border-b border-border/60 py-2.5 sm:grid-cols-[minmax(10rem,14rem)_1fr_auto]">
			<span>
				{project.github && !project.isPrivate ? (
					<a
						href={project.github}
						{...(isExternalHref(project.github)
							? { target: "_blank", rel: "noopener noreferrer" }
							: {})}
						className="rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						{name}
					</a>
				) : (
					<>
						{name}{" "}
						<span className="font-mono text-[11px] text-ink-soft">privé</span>
					</>
				)}
			</span>
			<span className="order-3 col-span-2 self-start text-sm text-ink-soft sm:order-none sm:col-span-1">
				<span className="line-clamp-1">{project.description}</span>
				{tech || project.domains.length > 0 ? (
					<span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px]">
						<DomainChips domains={project.domains} />
						{tech ? <span>{tech}</span> : null}
					</span>
				) : null}
			</span>
			<span className="font-mono text-xs text-ink-soft">
				{projectYear(project)}
			</span>
		</li>
	);
}
