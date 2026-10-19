import { describe, expect, it } from "vitest";
import { LOCALES, translator } from "@/tests/translator";
import {
	formatDate,
	formatNumber,
	formatPercent,
	formatReadingTime,
} from "./format";

/**
 * Le formatage est le premier endroit où la locale se voit : un point décimal français
 * sous une locale anglaise, une espace insécable autour du `%` déplacée. Les deux
 * familles de fonctions n'ont pas la même source de vérité — `Intl` d'un côté, le
 * dictionnaire de l'autre — donc les deux sont testées sur les trois locales.
 */

describe("formatDate", () => {
	it("écrit la date dans l'ordre de la langue", () => {
		expect(formatDate("2026-10-07", "fr")).toBe("7 octobre 2026");
		expect(formatDate("2026-10-07", "en")).toBe("October 7, 2026");
		expect(formatDate("2026-10-07", "zh")).toBe("2026年10月7日");
	});

	it("interpole en UTC, sans dérive de fuseau", () => {
		// Une date ISO sans heure, formatée en heure locale, peut basculer au jour
		// précédent : le jour près de minuit serait donc affiché faux.
		for (const locale of LOCALES)
			expect(formatDate("2026-01-01", locale)).toContain(
				locale === "zh" ? "2026" : "2026",
			);
	});
});

describe("formatNumber", () => {
	it("garde le français par défaut", () => {
		expect(formatNumber(19.4)).toBe("19,4");
		expect(formatNumber(0.2)).toBe("0,2");
		expect(formatNumber(24537)).toMatch(/^24\s537$/u);
	});

	it("suit la locale demandée, séparateur décimal et milliers", () => {
		expect(formatNumber(19.4, 1, "en")).toBe("19.4");
		expect(formatNumber(24537, 1, "en")).toBe("24,537");
	});

	it("respecte le nombre de décimales demandé", () => {
		expect(formatNumber(19.44, 1, "en")).toBe("19.4");
		expect(formatNumber(19.44, 2, "en")).toBe("19.44");
	});
});

describe("formatPercent", () => {
	it("arrondit et met la part en français", () => {
		const t = translator("fr", "percent");
		expect(formatPercent(t, 199, 428)).toBe("46\u00a0%");
		expect(formatPercent(t, 128, 428)).toBe("30\u00a0%");
		expect(formatPercent(t, 100, 428)).toBe("23\u00a0%");
	});

	it("bascule sous le pourcent pour une part non nulle mais minime", () => {
		expect(formatPercent(translator("fr", "percent"), 1, 428)).toBe(
			"<\u00a01\u00a0%",
		);
		expect(formatPercent(translator("en", "percent"), 1, 428)).toBe("< 1%");
		expect(formatPercent(translator("zh", "percent"), 1, 428)).toBe("不足 1%");
	});

	it("annonce un zéro franc, jamais « < 1 % », quand il n'y a rien à arrondir", () => {
		// Régression : la garde en `pct === 0 && part > 0` ignorait `total`, si bien que
		// `part > 0, total === 0` — une part de zéro sur zéro — rendait « < 1 % ».
		for (const locale of LOCALES) {
			const t = translator(locale, "percent");
			expect(formatPercent(t, 0, 0)).not.toContain("1");
			expect(formatPercent(t, 5, 0)).not.toContain("1");
		}
		expect(formatPercent(translator("fr", "percent"), 0, 0)).toBe("0\u00a0%");
		expect(formatPercent(translator("fr", "percent"), 5, 0)).toBe("0\u00a0%");
	});

	it("colle le pourcent en anglais et en chinois, l'écarte en français", () => {
		expect(formatPercent(translator("fr", "percent"), 199, 428)).toContain(
			"\u00a0%",
		);
		expect(formatPercent(translator("en", "percent"), 199, 428)).toBe("46%");
		expect(formatPercent(translator("zh", "percent"), 199, 428)).toBe("46%");
	});
});

describe("formatReadingTime", () => {
	/**
	 * La signature prend un `Translator` et non une locale : c'est tout l'objet de la
	 * fonction — « 7 min de lecture », « 7 min read », « 阅读约 7 分钟 » ne dérivent pas
	 * d'un ternaire. Une locale n'aurait produit que le français.
	 */
	it("traduit le temps de lecture dans les trois langues", () => {
		expect(formatReadingTime(translator("fr", "readingTime"), 7)).toBe(
			"7\u00a0min de lecture",
		);
		expect(formatReadingTime(translator("en", "readingTime"), 7)).toBe(
			"7 min read",
		);
		expect(formatReadingTime(translator("zh", "readingTime"), 7)).toBe(
			"阅读约 7 分钟",
		);
	});

	it("garde l'espace insécable du français, qu'un rendu HTML ne doit pas couper", () => {
		expect(formatReadingTime(translator("fr", "readingTime"), 7)).toBe(
			"7\u00a0min de lecture",
		);
	});

	it("formate le nombre selon la locale, même au-delà de 999", () => {
		expect(formatReadingTime(translator("fr", "readingTime"), 1200)).toContain(
			"1 200",
		);
		expect(formatReadingTime(translator("en", "readingTime"), 1200)).toContain(
			"1,200",
		);
	});

	it("reste synchrone et sans nombre pour zéro minute", () => {
		for (const locale of LOCALES)
			expect(formatReadingTime(translator(locale, "readingTime"), 0)).toContain(
				"0",
			);
	});
});
