import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { MapPoint } from "@/lib/carnet/map-view";
import type { NormalizedProject } from "@/lib/projects-data";
import DomainChips from "./DomainChips";
import FeaturedCard from "./FeaturedCard";
import IndexRow from "./IndexRow";
import MiniMap from "./MiniMap";
import { parseFilters } from "./ProjectRegister";
import TechBar from "./TechBar";

const p = (over: Partial<NormalizedProject> = {}): NormalizedProject => ({
	id: 7,
	title: "P13-Fashion-Insta",
	description: "Segmentation de vêtements. Deuxième phrase.",
	imagePath: "logo/ML.svg",
	github: "https://github.com/x/p13",
	lastUpdate: new Date("2025-06-01T00:00:00Z"),
	isPrivate: false,
	isAiGenerated: false,
	createdAt: new Date(0),
	updatedAt: new Date(0),
	languages: [{ language: "Python" }],
	databases: [],
	backends: [{ backend: "FastAPI" }],
	frontends: [],
	devops: [{ devops: "Docker" }],
	domains: [],
	mlStack: [],
	pitch: null,
	status: null,
	period: null,
	featuredRank: null,
	githubRepoId: null,
	...over,
});
const points: MapPoint[] = [
	{
		id: "project:7",
		kind: "project",
		title: "P13",
		href: "h",
		x: 0.5,
		y: 0.5,
		cluster: 4,
	},
	{
		id: "project:8",
		kind: "project",
		title: "P8",
		href: "h",
		x: 0.6,
		y: 0.5,
		cluster: 4,
	},
	{
		id: "article:a",
		kind: "article",
		title: "A",
		href: "/articles/a",
		x: 0.1,
		y: 0.1,
		cluster: 1,
	},
];

describe("MiniMap", () => {
	it("met le projet à l'accent et cercle ses voisins, sans être annoncée", () => {
		const html = renderToStaticMarkup(
			<MiniMap
				points={points}
				focusId="project:7"
				neighborIds={["project:8"]}
			/>,
		);
		expect(html).toContain('aria-hidden="true"');
		expect(html.match(/data-role="focus"/g)?.length).toBe(1);
		expect(html.match(/data-role="neighbor"/g)?.length).toBe(1);
		expect(html.match(/data-role="other"/g)?.length).toBe(1);
	});

	it("dessine le projet focalisé en dernier, avec un halo", () => {
		const html = renderToStaticMarkup(
			<MiniMap
				points={[points[0], ...points.slice(1)].reverse()}
				focusId="project:7"
				neighborIds={[]}
			/>,
		);
		const roles = [...html.matchAll(/data-role="(\w+)"/g)].map((m) => m[1]);
		expect(roles.at(-1)).toBe("focus");
		expect(html).toContain("var(--background)");
	});
});

describe("TechBar", () => {
	it("décrit la composition en texte et la dessine en segments proportionnels", () => {
		const html = renderToStaticMarkup(
			<TechBar
				shares={[
					{ key: "languages", label: "Langages", count: 1, share: 0.5 },
					{ key: "devops", label: "DevOps", count: 1, share: 0.5 },
				]}
			/>,
		);
		expect(html).toContain('role="img"');
		expect(html).toContain(
			'aria-label="Composition technique : Langages 50\u00a0%, DevOps 50\u00a0%"',
		);
		expect(html).toContain("flex-grow:1");
		expect(html).not.toContain("width:50%");
	});

	it("ne rend rien sans technologie", () => {
		expect(renderToStaticMarkup(<TechBar shares={[]} />)).toBe("");
	});
});

describe("FeaturedCard", () => {
	it("montre une figure numérotée, la première phrase, les technologies et le dépôt", () => {
		const html = renderToStaticMarkup(
			<FeaturedCard
				project={p()}
				figureNumber={2}
				points={points}
				neighborIds={["project:8"]}
			/>,
		);
		expect(html).toContain("<h3");
		expect(html).toContain("P13-Fashion-Insta");
		expect(html).toContain("Segmentation de vêtements.");
		expect(html).not.toContain("Deuxième phrase");
		expect(html).toContain("Fig. 2 · ");
		expect(html).toContain("Python");
		expect(html).toContain('href="https://github.com/x/p13"');
		expect(html).toContain('rel="noopener noreferrer"');
		expect(html).not.toContain("Lire l");
	});

	it("renvoie à l'entrée du carnet qui cite le projet", () => {
		const html = renderToStaticMarkup(
			<FeaturedCard
				project={p()}
				figureNumber={2}
				points={points}
				neighborIds={[]}
				entry={{ slug: "a", title: "A" }}
			/>,
		);
		expect(html).toContain('href="/articles/a"');
		expect(html).toContain("Lire l&#x27;entrée du carnet");
	});

	it("préfère une vraie capture à la mini-carte", () => {
		const html = renderToStaticMarkup(
			<FeaturedCard
				project={p({ imagePath: "/captures/p13.webp" })}
				figureNumber={2}
				points={points}
				neighborIds={[]}
			/>,
		);
		expect(html).toContain("p13.webp");
		expect(html).not.toContain('data-role="focus"');
	});

	it("sans point sur la carte, garde la seule barre de composition", () => {
		const html = renderToStaticMarkup(
			<FeaturedCard
				project={p({ id: 99 })}
				figureNumber={3}
				points={points}
				neighborIds={[]}
			/>,
		);
		expect(html).not.toContain('data-role="focus"');
		expect(html).toContain("Composition technique");
	});
});

describe("IndexRow", () => {
	it("tient sur une ligne : nom, description, technologies, année", () => {
		const html = renderToStaticMarkup(
			<ul>
				<IndexRow project={p()} />
			</ul>,
		);
		expect(html).toContain("<li");
		expect(html).toContain("P13-Fashion-Insta");
		expect(html).toContain("2025");
		expect(html).toContain("line-clamp-1");
		expect(html).toContain("self-start");
		expect(html).toContain("Python");
	});

	it("garde la liste des technologies hors de la description tronquée", () => {
		const html = renderToStaticMarkup(
			<ul>
				<IndexRow project={p()} />
			</ul>,
		);
		const clamped = html.match(
			/<span class="line-clamp-1[^"]*">(.*?)<\/span>/,
		)?.[1];
		expect(clamped).not.toContain("Python");
		expect(html).toContain("Python");
	});

	it("tronque la description avec line-clamp-1, sans la classe block qui l'écraserait", () => {
		const html = renderToStaticMarkup(
			<ul>
				<IndexRow
					project={p({ description: "Description longue à tronquer" })}
				/>
			</ul>,
		);
		const cls =
			html.match(
				/<span class="([^"]*)">Description longue à tronquer<\/span>/,
			)?.[1] ?? "";
		const classes = cls.split(/\s+/);
		expect(classes).toContain("line-clamp-1");
		expect(classes).not.toContain("block");
	});

	it("n'ouvre pas dans un nouvel onglet un lien non externe", () => {
		const html = renderToStaticMarkup(
			<ul>
				<IndexRow project={p({ github: "/projets/x" })} />
			</ul>,
		);
		expect(html).not.toContain("_blank");
	});

	it("affiche un projet privé sans lien, avec la mention privé", () => {
		const html = renderToStaticMarkup(
			<ul>
				<IndexRow project={p({ isPrivate: true, github: null })} />
			</ul>,
		);
		expect(html).not.toContain("<a ");
		expect(html).toContain("privé");
	});
});

describe("accroche et statut", () => {
	const card = (project: NormalizedProject) =>
		renderToStaticMarkup(
			<FeaturedCard
				project={project}
				figureNumber={1}
				points={points}
				neighborIds={[]}
			/>,
		);
	const row = (project: NormalizedProject) =>
		renderToStaticMarkup(
			<ul>
				<IndexRow project={project} />
			</ul>,
		);

	it("l'accroche remplace la première phrase et la description", () => {
		const project = p({ pitch: "Une accroche nette." });
		expect(card(project)).toContain("Une accroche nette.");
		expect(card(project)).not.toContain("Segmentation de vêtements.");
		expect(row(project)).toContain("Une accroche nette.");
		expect(row(project)).not.toContain("Segmentation de vêtements");
	});

	it("affiche « en cours » et « archivé », pas « terminé »", () => {
		expect(row(p({ status: "InProgress" }))).toContain("en cours");
		expect(row(p({ status: "Archived" }))).toContain("archivé");
		expect(row(p({ status: "Done" }))).not.toContain("terminé");
		expect(row(p({ status: null }))).not.toContain("en cours");
	});

	it("TechBar teinte ML & Data avec --primary", () => {
		const html = renderToStaticMarkup(
			<TechBar
				shares={[{ key: "mlStack", label: "ML & Data", count: 1, share: 1 }]}
			/>,
		);
		expect(html).toContain("var(--primary)");
	});
});

describe("DomainChips", () => {
	it("ne rend rien sans domaine", () => {
		expect(renderToStaticMarkup(<DomainChips domains={[]} />)).toBe("");
	});

	it("rend les libellés dans l'ordre canonique, ML ajouté pour Classification", () => {
		const html = renderToStaticMarkup(
			<DomainChips domains={[{ domain: "LLM" }, { domain: "Classifier" }]} />,
		);
		expect(html).toContain('aria-label="Domaines"');
		const labels = [...html.matchAll(/<li[^>]*>(.*?)<\/li>/g)].map((m) => m[1]);
		expect(labels).toEqual(["ML", "Classification", "LLM"]);
	});
});

describe("puces de domaine dans le registre", () => {
	const withDomains = p({ domains: [{ domain: "Vision" }] });

	it("FeaturedCard les montre sous le titre", () => {
		const html = renderToStaticMarkup(
			<FeaturedCard
				project={withDomains}
				figureNumber={1}
				points={points}
				neighborIds={[]}
			/>,
		);
		expect(html).toContain('aria-label="Domaines"');
		expect(html.indexOf("</h3>")).toBeLessThan(html.indexOf("Domaines"));
	});

	it("IndexRow les montre avant les technologies", () => {
		const html = renderToStaticMarkup(
			<ul>
				<IndexRow project={withDomains} />
			</ul>,
		);
		expect(html.indexOf("Vision")).toBeGreaterThan(-1);
		expect(html.indexOf("Vision")).toBeLessThan(html.indexOf("Python"));
	});

	it("sans domaine, aucune liste de puces", () => {
		const html = renderToStaticMarkup(
			<ul>
				<IndexRow project={p()} />
			</ul>,
		);
		expect(html).not.toContain("Domaines");
	});
});

describe("parseFilters", () => {
	it("lit le paramètre domain", () => {
		const f = parseFilters(new URLSearchParams("domain=Vision,LLM"));
		expect(f.domain).toEqual(["Vision", "LLM"]);
		expect(parseFilters(new URLSearchParams("")).domain).toEqual([]);
	});
});

describe("IndexRow lecteurs d'écran", () => {
	it("sépare l'année et le statut par une virgule masquée", () => {
		const html = renderToStaticMarkup(
			<ul>
				<IndexRow project={p({ status: "Archived" })} />
			</ul>,
		);
		expect(html).toContain('<span class="sr-only">, </span>');
	});
});
