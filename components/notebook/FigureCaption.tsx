import type { ReactNode } from "react";

/** Légende de figure numérotée (« Fig. 2 · … »). */
export default function FigureCaption({
	number,
	children,
}: Readonly<{ number: number; children: ReactNode }>) {
	return (
		<figcaption className="mt-3 font-mono text-xs tracking-wide text-ink-soft">
			Fig. {number} · {children}
		</figcaption>
	);
}
