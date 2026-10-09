import { formatPercentFr } from "@/lib/articles/format";
import type { TechShare } from "@/lib/register";

const TINT: Record<TechShare["key"], string> = {
	languages: "var(--cluster-1)",
	databases: "var(--cluster-2)",
	backends: "var(--cluster-3)",
	frontends: "var(--cluster-4)",
	devops: "var(--cluster-5)",
};

/** Barre de composition technique : proportions réelles des technologies en base. */
export default function TechBar({ shares }: Readonly<{ shares: TechShare[] }>) {
	if (shares.length === 0) return null;
	const total = shares.reduce((t, x) => t + x.count, 0);
	const pct = (s: TechShare) => formatPercentFr(s.count, total);
	const label = `Composition technique : ${shares.map((s) => `${s.label} ${pct(s)}`).join(", ")}`;
	return (
		<div>
			<div
				role="img"
				aria-label={label}
				className="flex h-2 w-full overflow-hidden rounded-full bg-paper-grid"
			>
				{shares.map((s) => (
					<span
						key={s.key}
						className="h-full"
						style={{
							flexGrow: s.count,
							flexBasis: 0,
							background: TINT[s.key],
						}}
					/>
				))}
			</div>
			<ul
				aria-hidden="true"
				className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-ink-soft"
			>
				{shares.map((s) => (
					<li key={s.key} className="flex items-center gap-1.5">
						<span
							className="inline-block size-2 rounded-full"
							style={{ background: TINT[s.key] }}
						/>
						{s.label} {pct(s)}
					</li>
				))}
			</ul>
		</div>
	);
}
