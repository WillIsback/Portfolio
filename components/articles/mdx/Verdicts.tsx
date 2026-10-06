import { Check, X } from "lucide-react";

export interface Verdict {
	title: string;
	text: string;
}

function Column({
	heading,
	items,
	tone,
}: Readonly<{ heading: string; items: Verdict[]; tone: "good" | "bad" }>) {
	const Icon = tone === "good" ? Check : X;
	const color = `var(--article-${tone})`;
	return (
		<section
			className="rounded-xl border border-border bg-card p-5 shadow-sm"
			style={{ borderTop: `3px solid ${color}` }}
		>
			<h3 className="mb-4 flex items-center gap-2 font-display text-base font-semibold text-foreground">
				<span
					aria-hidden="true"
					className="inline-flex size-6 items-center justify-center rounded-full"
					style={{
						background: `color-mix(in oklch, ${color} 16%, transparent)`,
						color,
					}}
				>
					<Icon className="size-4" strokeWidth={2.5} />
				</span>
				{heading}
			</h3>
			<ul className="space-y-3.5">
				{items.map((item) => (
					<li key={item.title} className="flex gap-3">
						<Icon
							aria-hidden="true"
							className="mt-1 size-4 shrink-0"
							style={{ color }}
							strokeWidth={2.5}
						/>
						<p className="text-[0.95rem] leading-relaxed text-article-body">
							<strong className="font-semibold text-foreground">
								{item.title}
							</strong>{" "}
							{item.text}
						</p>
					</li>
				))}
			</ul>
		</section>
	);
}

export function Verdicts({
	good,
	bad,
}: Readonly<{ good: Verdict[]; bad: Verdict[] }>) {
	return (
		<div className="my-10 grid grid-cols-1 gap-4 md:grid-cols-2">
			<Column heading="Ce qui a tenu" items={good} tone="good" />
			<Column heading="Ce qui a cassé" items={bad} tone="bad" />
		</div>
	);
}
