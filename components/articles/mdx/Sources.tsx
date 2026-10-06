import type { ReactNode } from "react";

export function Sources({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<aside
			aria-labelledby="sources-title"
			className="mt-14 border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground"
		>
			<p
				id="sources-title"
				className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground"
			>
				Sources des chiffres
			</p>
			<div className="[&>p+p]:mt-2 [&>p]:m-0">{children}</div>
		</aside>
	);
}
