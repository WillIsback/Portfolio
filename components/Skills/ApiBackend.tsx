import Image from "next/image";

type TechEntity = {
	type: string;
	icon1: string;
	icon2: string;
};

const techEntities: Record<string, TechEntity> = {
	python: {
		type: "FastAPI",
		icon1: "/icon/Python.svg",
		icon2: "/icon/FastApi.svg",
	},
	typescript: {
		type: "Fastify",
		icon1: "/icon/Typescript.svg",
		icon2: "/icon/Fastify.svg",
	},
	Fastify: {
		type: "Express.js",
		icon1: "/icon/Typescript.svg",
		icon2: "/icon/Expressjs.svg",
	},
};

export default function ApiBackend() {
	return (
		<article className="m-auto flex flex-col w-1/2 border border-gray-200 rounded-xl px-13 py-13 gap-10">
			<div className="flex items-center justify-between">
				<div className="flex flex-col gap-2 w-1/2">
					<h3 className="text-lg text-gray-950">Backend & API</h3>
					<p className="text-m font-light text-gray-600">
						Les backends & APIs sur lesquels j&apos;ai travaillé — cerveau
						opérationnel orchestrant logique métier, sécurité et haute
						performance
					</p>
				</div>
				<div className="flex gap-10 ">
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
						<li>• Uvicorn</li>
						<li>• Bun</li>
						<li>• Pytest</li>
						<li>• Playwright</li>
						<li>• Zod</li>
						<li>• Swagger / OpenAPI</li>
						<li>• JOSE</li>
						<li>• MkDocs</li>
						<li>• Psycopg</li>
						<li>• PyTorch</li>
						<li>• Transformers</li>
						<li>• Scikit-learn</li>
						<li>• Ruff</li>
						<li>• uv</li>
					</ul>
				</div>
				<div>
					<h4 className="text-sm font-semibold text-gray-900 mb-3">
						Utilitaires préférés
					</h4>
					<ul className="text-sm text-gray-600 space-y-1.5">
						<li>• Postman</li>
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
			<div className="flex flex-col gap-4 border rounded-xl border-gray-200 px-4 py-4">
				<Image
					src={tech.icon1}
					alt={tech.type}
					width={32}
					height={32}
					className="w-8 h-8"
				/>
				<hr />
				<Image
					src={tech.icon2}
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
