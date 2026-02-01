import Image from "next/image";

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
		<article className="m-auto flex flex-col w-1/2 border border-gray-200 rounded-xl px-13 py-13 gap-10">
			<div className="flex items-center justify-between">
				<div className="flex flex-col gap-2 w-1/2">
					<h3 className="text-lg text-gray-950">Base de donnée</h3>
					<p className="text-m font-light text-gray-600">
						Les bases de données sur lesquelles j&apos;ai travaillé — fondation
						de l&apos;architecture assurant persistance, intégrité et
						scalabilité
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
					<h4 className="text-sm font-semibold text-gray-900 mb-3">
						Utilitaires préférés
					</h4>
					<ul className="text-sm text-gray-600 space-y-1.5">
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
