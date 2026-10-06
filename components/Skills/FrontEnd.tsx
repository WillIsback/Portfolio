import Image from "next/image";
import { invertOnDark } from "@/lib/theme-icons";
import { cn } from "@/lib/utils";

type TechEntity = {
	type: string;
	icon: string;
	icon2?: string;
};

const techEntities: Record<string, TechEntity> = {
	React: {
		type: "React/Nextjs",
		icon: "/icon/React.svg",
		icon2: "/icon/Nextjs.svg",
	},
	Tanstack: {
		type: "React/Tanstack",
		icon: "/icon/React.svg",
		icon2: "/icon/Tanstack.svg",
	},
	Svelte: { type: "Svelte", icon: "/icon/Vite.svg", icon2: "/icon/Svelte.svg" },
};

export default function Frontend() {
	return (
		<article className="mx-4 flex flex-col gap-10 rounded-xl border border-border px-6 py-8 sm:px-13 sm:py-13 lg:m-auto lg:w-1/2">
			<div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
				<div className="flex flex-col gap-2 lg:w-1/2">
					<h3 className="text-lg text-foreground">Frontend</h3>
					<p className="text-m font-light text-muted-foreground">
						Les frameworks frontend sur lesquels j&apos;ai travaillé — vitrine
						interactive offrant une expérience fluide, réactive et performante
					</p>
				</div>
				<div className="flex flex-wrap gap-6 sm:gap-10">
					{Object.values(techEntities).map((tech) => (
						<TechEntityCard key={tech.type} tech={tech} />
					))}
				</div>
			</div>
			<div className="grid grid-cols-2 gap-6">
				<div>
					<h4 className="text-sm font-semibold text-foreground mb-3">
						Librairies préférées
					</h4>
					<ul className="text-sm text-muted-foreground space-y-1.5">
						<li>• NextAuth</li>
						<li>• Biome</li>
						<li>• Lucide React</li>
						<li>• shadcn/ui</li>
						<li>• DOMPurify</li>
						<li>• date-fns</li>
						<li>• TailwindCSS</li>
						<li>• DaisyUI</li>
						<li>• TSDoc</li>
					</ul>
				</div>
				<div>
					<h4 className="text-sm font-semibold text-foreground mb-3">
						Utilitaires préférés
					</h4>
					<ul className="text-sm text-muted-foreground space-y-1.5">
						<li>• Wave</li>
						<li>• Playwright</li>
						<li>• WebDevTools</li>
					</ul>
				</div>
			</div>
		</article>
	);
}

function TechEntityCard({ tech }: { tech: TechEntity }) {
	return (
		<div className="flex flex-col items-center gap-2">
			<div className="flex flex-col gap-4 border rounded-xl border-border px-4 py-4">
				<Image
					src={tech.icon}
					alt={tech.type}
					width={32}
					height={32}
					className={cn("w-8 h-8", invertOnDark(tech.icon))}
				/>
				{tech.icon2 && (
					<>
						<hr />
						<Image
							src={tech.icon2}
							alt={tech.type}
							width={32}
							height={32}
							className={cn("w-8 h-8", invertOnDark(tech.icon2))}
						/>
					</>
				)}
			</div>
			<h4 className="text-m text-foreground">{tech.type}</h4>
		</div>
	);
}
