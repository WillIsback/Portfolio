import { cn } from "@/lib/utils";

export interface TimelineItem {
	date: string;
	text: string;
	title?: string;
	key?: boolean;
}

export function Timeline({ items }: Readonly<{ items: TimelineItem[] }>) {
	return (
		<ol className="my-10">
			{items.map((item) => (
				<li
					key={`${item.date}-${item.text.slice(0, 24)}`}
					className="grid grid-cols-1 sm:grid-cols-[7rem_1fr] sm:gap-5"
				>
					<div
						className={cn(
							"font-code border-l-2 border-border pl-6 text-sm leading-6 sm:border-l-0 sm:pl-0 sm:pt-0.5 sm:text-right",
							item.key ? "font-semibold text-primary" : "text-muted-foreground",
						)}
					>
						{item.date}
					</div>
					<div className="relative border-l-2 border-border pb-7 pl-6 sm:pl-5 [li:last-child>&]:pb-0">
						<span
							aria-hidden="true"
							className={cn(
								"absolute -top-[18px] -left-[7px] size-3 rounded-full border-2 border-background sm:top-2",
								item.key
									? "bg-primary ring-4 ring-primary/20"
									: "bg-muted-foreground/60",
							)}
						/>
						{item.title ? (
							<p className="mb-0.5 font-display font-semibold text-foreground">
								{item.title}
							</p>
						) : null}
						<p
							className={cn(
								"leading-relaxed",
								item.key ? "text-article-body" : "text-muted-foreground",
							)}
						>
							{item.text}
						</p>
					</div>
				</li>
			))}
		</ol>
	);
}
