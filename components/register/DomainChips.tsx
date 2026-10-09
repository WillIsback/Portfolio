import { domainLabels } from "@/lib/domains";

export default function DomainChips({
	domains,
	className = "",
}: Readonly<{ domains: { domain: string }[]; className?: string }>) {
	const labels = domainLabels(domains);
	if (labels.length === 0) return null;
	return (
		<ul
			aria-label="Domaines"
			className={`m-0 flex list-none flex-wrap gap-1.5 p-0 ${className}`}
		>
			{labels.map((label) => (
				<li
					key={label}
					className="rounded-sm border border-primary/40 px-1.5 py-0.5 font-mono text-[11px] leading-none text-primary"
				>
					{label}
				</li>
			))}
		</ul>
	);
}
