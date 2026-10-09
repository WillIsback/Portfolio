import type { Step } from "@/lib/about";

/** Chronologie du carnet (spec §8.3) : une ligne d'encre qui se trace au défilement, dates en Fira Code. */
export default function Chronology({ steps }: Readonly<{ steps: Step[] }>) {
	return (
		<ol className="relative ml-3 sm:ml-40">
			<span
				aria-hidden="true"
				className="chrono-ink absolute top-1 bottom-1 left-0 w-0.5 origin-top bg-primary"
			/>
			{steps.map((step, i) => (
				<li key={step.title} className="relative pb-10 pl-8 last:pb-0">
					<span
						aria-hidden="true"
						className="absolute top-1.5 -left-[5px] size-3 rounded-full border-2 border-primary bg-background"
					/>
					<p className="font-mono text-xs text-ink-soft sm:absolute sm:top-1 sm:-left-40 sm:w-32 sm:text-right">
						<span className="mr-2 text-primary">
							{String(i + 1).padStart(2, "0")}
						</span>
						{step.year}
					</p>
					<h2 className="mt-1 font-display text-xl font-semibold sm:mt-0">
						{step.title}
					</h2>
					<p className="mt-2 max-w-prose text-base leading-relaxed">
						{step.description}
					</p>
				</li>
			))}
		</ol>
	);
}
