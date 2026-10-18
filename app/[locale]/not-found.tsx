import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function LocaleNotFound() {
	const t = useTranslations("notFound");

	return (
		<main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-4 px-6">
			<h1 className="font-display text-3xl font-bold">{t("title")}</h1>
			<p className="text-ink-soft">{t("body")}</p>
			<Link href="/" className="text-primary underline underline-offset-4">
				{t("back")}
			</Link>
		</main>
	);
}
