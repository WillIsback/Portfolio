import { describe, expect, it } from "vitest";
import { SOLUTIONS, solutionCopy } from "./solutions";
import {
	PERSON_ID,
	personJsonLd,
	softwareApplicationJsonLd,
	WEBSITE_ID,
	websiteJsonLd,
} from "./structured-data";

describe("données structurées", () => {
	it("décrit la personne et la relie à ses profils", () => {
		expect(personJsonLd("fr", "Développeur IA")).toMatchObject({
			"@context": "https://schema.org",
			"@type": "Person",
			"@id": PERSON_ID,
			name: "William Derue",
			alternateName: ["WillisBack", "willisback"],
			url: "https://www.willisback.fr",
			image: "https://www.willisback.fr/william-derue.png",
			sameAs: [
				"https://github.com/WillIsback",
				"https://www.linkedin.com/in/williamderue/",
			],
			jobTitle: "Développeur IA",
		});
		expect(PERSON_ID).toBe("https://www.willisback.fr/#person");
	});

	it("décrit le site dans sa locale, publié par la personne", () => {
		expect(websiteJsonLd("en")).toMatchObject({
			"@context": "https://schema.org",
			"@type": "WebSite",
			"@id": WEBSITE_ID,
			name: "WillisBack",
			alternateName: ["William Derue", "Will Is Back"],
			url: "https://www.willisback.fr/en",
			inLanguage: "en-US",
			publisher: { "@id": PERSON_ID },
		});
		expect(WEBSITE_ID).toBe("https://www.willisback.fr/#website");
	});

	it("décrit une solution comme logiciel gratuit, écrit par la personne", () => {
		const data = softwareApplicationJsonLd(
			"en",
			SOLUTIONS.grammaria,
			solutionCopy("grammaria", "en"),
		);
		expect(data).toMatchObject({
			"@context": "https://schema.org",
			"@type": "SoftwareApplication",
			name: "Grammaria",
			url: "https://grammaria.fr",
			mainEntityOfPage: "https://www.willisback.fr/en/solutions/grammaria",
			operatingSystem: "Linux, Windows",
			applicationCategory: "UtilitiesApplication",
			softwareVersion: "0.5",
			license: "https://spdx.org/licenses/GPL-3.0.html",
			isAccessibleForFree: true,
			offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
			author: { "@id": PERSON_ID },
			codeRepository: "https://github.com/WillIsback/Grammaria",
			inLanguage: "en-US",
		});
		expect(data.description).toBe(solutionCopy("grammaria", "en").summary);
	});
});
