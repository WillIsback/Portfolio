import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { ogCard } from "@/components/seo/OgCard";
import { routing } from "@/i18n/routing";
import { OG_SIGNATURE, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = OG_SIGNATURE;

export function generateStaticParams() {
	return routing.locales.map((locale) => ({ locale }));
}

export default async function Image({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale: requested } = await params;
	const locale = hasLocale(routing.locales, requested)
		? requested
		: routing.defaultLocale;
	const t = await getTranslations({ locale, namespace: "meta" });
	return ogCard({ title: t("title"), kicker: "Portfolio" });
}
