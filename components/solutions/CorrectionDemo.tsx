import type { ReactNode } from "react";
import type { SolutionCopy } from "@/lib/solutions";

type Demo = NonNullable<SolutionCopy["demo"]>;

/**
 * Découpe la phrase autour des mots fautifs, dans l'ordre où ils apparaissent.
 * Chaque mot n'est souligné qu'une fois, à sa première occurrence après le
 * précédent ; un mot introuvable est simplement ignoré.
 */
export function highlightFaults(
	input: string,
	words: readonly string[],
): { text: string; fault: boolean }[] {
	const parts: { text: string; fault: boolean }[] = [];
	let cursor = 0;
	for (const word of words) {
		const at = input.indexOf(word, cursor);
		if (at < 0) continue;
		if (at > cursor)
			parts.push({ text: input.slice(cursor, at), fault: false });
		parts.push({ text: word, fault: true });
		cursor = at + word.length;
	}
	if (cursor < input.length)
		parts.push({ text: input.slice(cursor), fault: false });
	return parts;
}

/** Démonstration statique d'une analyse : la phrase, puis chaque faute nommée. */
export default function CorrectionDemo({
	demo,
	label,
	caption,
}: Readonly<{ demo: Demo; label: string; caption: string }>) {
	const parts = highlightFaults(
		demo.input,
		demo.faults.map((f) => f.wrong),
	);
	return (
		<figure className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-7">
			<p className="font-mono text-xs uppercase tracking-wide text-ink-soft">
				{label}
			</p>
			<div>
				<p
					lang="fr"
					className="mt-3 font-serif text-xl leading-relaxed sm:text-2xl"
				>
					{parts.map(
						(part, i): ReactNode =>
							part.fault ? (
								<span
									key={i}
									className="underline decoration-destructive decoration-wavy decoration-2 underline-offset-4"
								>
									{part.text}
								</span>
							) : (
								<span key={i}>{part.text}</span>
							),
					)}
				</p>
				<ol className="mt-6 space-y-4">
					{demo.faults.map((fault) => (
						<li key={fault.rule} className="border-l-2 border-primary/60 pl-4">
							<p className="font-display font-semibold">
								<span lang="fr" className="text-ink-soft line-through">
									{fault.wrong}
								</span>
								<span aria-hidden="true"> → </span>
								<span lang="fr" className="text-primary">
									{fault.right}
								</span>
							</p>
							<p className="mt-1 text-sm leading-relaxed text-muted-foreground">
								{fault.why}
							</p>
							<p className="mt-1 font-mono text-[11px] text-ink-soft">
								{fault.rule}
							</p>
						</li>
					))}
				</ol>
			</div>
			<figcaption className="mt-5 text-xs text-ink-soft">{caption}</figcaption>
		</figure>
	);
}
