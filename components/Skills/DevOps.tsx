import Image from "next/image";

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
		<article className="m-auto flex flex-col w-1/2 border border-gray-200 rounded-xl px-13 py-13 gap-10">
			<div className="flex items-center justify-between">
				<div className="flex flex-col gap-2">
					<h3 className="text-lg text-gray-950">DevOps & Outils</h3>
					<p className="text-m font-light text-gray-600">
						Les outils DevOps sur lesquels j&apos;ai travaillé — moteur
						d&apos;industrialisation automatisant déploiements et qualité de
						production
					</p>
				</div>
				<div className="flex gap-10">
					{Object.values(techEntities).map((tech) => (
						<TechEntityCard key={tech.type} tech={tech} />
					))}
				</div>
			</div>
			<div className="grid grid-cols-2 gap-6">
				<div>
					<h4 className="text-sm font-semibold text-gray-900 mb-3">
						Librairies préférées
					</h4>
					<ul className="text-sm text-gray-600 space-y-1.5">
						<li>• Pytest</li>
						<li>• Vitest</li>
						<li>• pre-commit</li>
						<li>• git-cliff</li>
						<li>• standard-version</li>
					</ul>
				</div>
				<div>
					<h4 className="text-sm font-semibold text-gray-900 mb-3">
						Utilitaires préférés
					</h4>
					<ul className="text-sm text-gray-600 space-y-1.5">
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
			<div className="flex flex-col gap-4 border rounded-xl border-gray-200 px-4 py-4">
				<Image
					src={tech.icon}
					alt={tech.type}
					width={32}
					height={32}
					className="w-8 h-8"
				/>
			</div>
			<h4 className="text-m text-gray-950">{tech.type}</h4>
		</div>
	);
}
