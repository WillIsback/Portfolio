import Image from "next/image";
import { invertOnDark } from "@/lib/theme-icons";
import { cn } from "@/lib/utils";

type TechEntity = {
	type: string;
	icon: string;
};

const techEntities: Record<string, TechEntity> = {
	Postgresql: { type: "Postgresql", icon: "/icon/Postgresql.svg" },
	MongoDB: { type: "MongoDB", icon: "/icon/Mongodb.svg" },
	Informix: { type: "Informix", icon: "/icon/Informix.svg" },
};

export default function DataBase() {
	return (
		<article className="mx-4 flex flex-col gap-10 rounded-xl border border-border px-6 py-8 sm:px-13 sm:py-13 lg:m-auto lg:w-1/2">
			<div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
				<div className="flex flex-col gap-2 lg:w-1/2">
					<h3 className="text-lg text-foreground">Base de donnée</h3>
					<p className="text-m font-light text-muted-foreground">
						Les bases de données sur lesquelles j&apos;ai travaillé — fondation
						de l&apos;architecture assurant persistance, intégrité et
						scalabilité
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
						<li>• Prisma</li>
						<li>• Drizzle</li>
						<li>• SQLAlchemy</li>
						<li>• pgvector</li>
						<li>• Faiss</li>
						<li>• Mongoose</li>
						<li>• ElectricSQL</li>
						<li>• TanStack DB</li>
					</ul>
				</div>
				<div>
					<h4 className="text-sm font-semibold text-foreground mb-3">
						Utilitaires préférés
					</h4>
					<ul className="text-sm text-muted-foreground space-y-1.5">
						<li>• lite-cli</li>
						<li>• Data Wrangler</li>
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
