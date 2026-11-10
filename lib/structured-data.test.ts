import { describe, expect, it } from "vitest";
import {
	PERSON_ID,
	personJsonLd,
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
});
