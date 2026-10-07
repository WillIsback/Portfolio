import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
	cosine,
	createStaticModel,
	embedText,
	embedTokens,
} from "./static-model";
import { CARNET_MODEL_DIR, loadStaticModelFromDir } from "./static-model-node";
import { tokenize } from "./tokenize";

const tiny = createStaticModel(
	{
		version: "t",
		teacher: "t",
		dim: 2,
		vocabSize: 2,
		wordPrompt: "none",
		sifA: 1e-4,
	},
	["vision", "agents"],
	new Int8Array([127, 0, 0, 127]),
	new Float32Array([1 / 127, 1 / 127]),
);

describe("embedTokens", () => {
	it("moyenne les mots connus et normalise", () => {
		const v = embedTokens(tiny, ["vision", "agents", "inconnu"]);
		expect(v).not.toBeNull();
		expect(v?.[0]).toBeCloseTo(Math.SQRT1_2, 5);
		expect(v?.[1]).toBeCloseTo(Math.SQRT1_2, 5);
	});

	it("renvoie null quand aucun mot n'est connu", () => {
		expect(embedTokens(tiny, ["inconnu"])).toBeNull();
		expect(embedText(tiny, "🤖 zzqx")).toBeNull();
		expect(embedText(tiny, "")).toBeNull();
	});
});

describe("createStaticModel", () => {
	it("refuse des tailles incohérentes", () => {
		expect(() =>
			createStaticModel(
				{
					version: "t",
					teacher: "t",
					dim: 2,
					vocabSize: 2,
					wordPrompt: "none",
					sifA: 1e-4,
				},
				["a"],
				new Int8Array(4),
				new Float32Array(2),
			),
		).toThrow(/vocab/);
	});
});

describe("cosine", () => {
	it("vaut 1 pour deux vecteurs identiques et 0 pour des orthogonaux", () => {
		expect(cosine([1, 0], [1, 0])).toBeCloseTo(1);
		expect(cosine([1, 0], [0, 1])).toBeCloseTo(0);
	});
});

describe("parité avec le calcul Python", () => {
	const golden: {
		text: string;
		tokens: string[];
		embedding: number[] | null;
	}[] = JSON.parse(
		readFileSync(path.join(__dirname, "__fixtures__", "golden.json"), "utf8"),
	);
	const model = loadStaticModelFromDir(CARNET_MODEL_DIR);

	it.each(golden)("même tokenisation et même embedding pour « $text »", ({
		text,
		tokens,
		embedding,
	}) => {
		expect(tokenize(text)).toEqual(tokens);
		const v = embedText(model, text);
		if (embedding === null) {
			expect(v).toBeNull();
		} else {
			expect(v).not.toBeNull();
			expect(cosine(v as Float32Array, embedding)).toBeGreaterThan(0.9999);
		}
	});
});
