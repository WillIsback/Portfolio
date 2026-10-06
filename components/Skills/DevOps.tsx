import Image from "next/image";
import { invertOnDark } from "@/lib/theme-icons";
import { cn } from "@/lib/utils";

type TechEntity = {
	type: string;
	icon: string;
};

const techEntities: Record<string, TechEntity> = {
	Docker: { type: "Docker", icon: "/icon/Docker.svg" },
	"Github Actions": { type: "Github Actions", icon: "/icon/Github.svg" },
};

export default function DevOps() {
	return (
		<article className="mx-4 flex flex-col gap-10 rounded-xl border border-border px-6 py-8 sm:px-13 sm:py-13 lg:m-auto lg:w-1/2">
			<div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
				<div className="flex flex-col gap-2">
					<h3 className="text-lg text-foreground">DevOps & Outils</h3>
					<p className="text-m font-light text-muted-foreground">
						Les outils DevOps sur lesquels j&apos;ai travaillé — moteur
						d&apos;industrialisation automatisant déploiements et qualité de
						production
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
						<li>• Pytest</li>
						<li>• Vitest</li>
						<li>• pre-commit</li>
						<li>• git-cliff</li>
						<li>• standard-version</li>
					</ul>
				</div>
				<div>
					<h4 className="text-sm font-semibold text-foreground mb-3">
						Utilitaires préférés
					</h4>
					<ul className="text-sm text-muted-foreground space-y-1.5">
						<li>• Wave</li>
						<li>• Playwright</li>
						<li>• lazy-docker</li>
						<li>• docker-compose</li>
						<li>• Portainer</li>
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
			</div>
			<h4 className="text-m text-foreground">{tech.type}</h4>
		</div>
	);
}
