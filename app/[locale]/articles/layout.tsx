import { setRequestLocale } from "next-intl/server";
import Footer from "@/components/Footer/Footer";
import Header from "@/components/Header/Header";

import "./articles.css";

export default async function ArticlesLayout({
	children,
	params,
}: Readonly<{
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}>) {
	const { locale } = await params;
	setRequestLocale(locale);

	return (
		<main className="relative flex min-h-screen flex-col">
			<div className="sticky top-0 z-50 w-full">
				<Header />
			</div>
			<div className="articles-scope flex-1 px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
				{children}
			</div>
			<Footer />
		</main>
	);
}
