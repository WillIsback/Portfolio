import type { ReactNode } from "react";

export function Lesson({
	title,
	children,
}: Readonly<{ title: string; children: ReactNode }>) {
	return (
		<aside className="my-5 rounded-xl border border-border bg-card p-5 shadow-sm">
			<p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
				{title}
			</p>
			<div className="leading-relaxed text-article-body [&>p+p]:mt-3 [&>p]:m-0">
				{children}
			</div>
		</aside>
	);
}
