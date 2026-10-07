import { describe, expect, it } from "vitest";
import {
	articleToCorpusItem,
	normalizeKeyword,
	type ProjectForCorpus,
	projectToCorpusItem,
} from "./corpus";
import { tokenize } from "./tokenize";

const baseProject: ProjectForCorpus = {
	id: 7,
	title: "P13-Fashion-Insta",
	description: "OpenClassroom ML/AI project on Vision task",
	github: "https://github.com/WillIsback/P13-Fashion-Insta",
	isPrivate: false,
	languages: [{ language: "Python" }],
	databases: [],
	backends: [{ backend: "FastAPI" }],
	frontends: [],
	devops: [{ devops: "Docker" }],
};

describe("tokenize", () => {
	it("plie accents et casse, coupe sur la ponctuation, ignore les mots d'une lettre", () => {
		expect(tokenize("Évaluation d'IA : COMPUTER Vision, à 2 mains")).toEqual([
			"evaluation",
			"ia",
			"computer",
			"vision",
			"mains",
		]);
	});

	it("renvoie une liste vide pour un texte sans mot", () => {
		expect(tokenize("🤖 ! ?")).toEqual([]);
	});
});

describe("normalizeKeyword", () => {
	it("met en minuscules et retire les accents", () => {
		expect(normalizeKeyword("Échec Système")).toBe("echec systeme");
	});
});

describe("articleToCorpusItem", () => {
	it("construit un élément article avec un id préfixé et des mots-clés normalisés", () => {
		const item = articleToCorpusItem({
			slug: "neuf-agents-neuf-jours",
			title: "Neuf agents, neuf jours",
			description: "Retour d'expérience sur une flotte d'agents.",
			tags: ["Agents autonomes", "SRE"],
		});
		expect(item).toEqual({
			id: "article:neuf-agents-neuf-jours",
			kind: "article",
			title: "Neuf agents, neuf jours",
			text: "Neuf agents, neuf jours. Retour d'expérience sur une flotte d'agents. Agents autonomes, SRE",
			href: "/articles/neuf-agents-neuf-jours",
			keywords: ["agents autonomes", "sre"],
			terms: ["neuf", "agents", "jours", "retour", "experience", "flotte"],
		});
	});
});

describe("projectToCorpusItem", () => {
	it("construit un élément projet à partir des technologies", () => {
		const item = projectToCorpusItem(baseProject);
		expect(item).toEqual({
			id: "project:7",
			kind: "project",
			title: "P13-Fashion-Insta",
			text: "P13-Fashion-Insta. OpenClassroom ML/AI project on Vision task. Python, FastAPI, Docker",
			href: "https://github.com/WillIsback/P13-Fashion-Insta",
			keywords: ["python", "fastapi", "docker"],
			terms: [
				"p13",
				"fashion",
				"insta",
				"openclassroom",
				"project",
				"vision",
				"task",
			],
		});
	});

	it("exclut un projet privé", () => {
		expect(projectToCorpusItem({ ...baseProject, isPrivate: true })).toBeNull();
	});

	it("exclut un projet sans lien GitHub", () => {
		expect(projectToCorpusItem({ ...baseProject, github: null })).toBeNull();
	});

	it("tolère une description vide", () => {
		expect(projectToCorpusItem({ ...baseProject, description: "" })?.text).toBe(
			"P13-Fashion-Insta. Python, FastAPI, Docker",
		);
	});
});

describe("termes de recherche", () => {
	it("dérive les termes d'un article de son titre et de sa description", () => {
		const item = articleToCorpusItem({
			slug: "x",
			title: "Neuf agents, neuf jours",
			description: "Une flotte SRE",
			tags: ["LLM local"],
		});
		expect(item.terms).toEqual(["neuf", "agents", "jours", "flotte", "sre"]);
	});

	it("dérive les termes d'un projet de son titre et de sa description", () => {
		expect(projectToCorpusItem(baseProject)?.terms).toEqual([
			"p13",
			"fashion",
			"insta",
			"openclassroom",
			"project",
			"vision",
			"task",
		]);
	});
});
