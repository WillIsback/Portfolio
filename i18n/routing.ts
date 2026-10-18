import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
	locales: ["fr", "en", "zh"],
	defaultLocale: "fr",
	localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
