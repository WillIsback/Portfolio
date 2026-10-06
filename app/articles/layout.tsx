import Footer from "@/components/Footer/Footer";
import Header from "@/components/Header/Header";

import "./articles.css";

export default function ArticlesLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<main className="relative flex min-h-screen flex-col bg-background">
			<div className="sticky top-0 z-50 flex w-full justify-center p-3 sm:p-6">
				<Header highlightContact={false} />
			</div>
			<div className="articles-scope flex-1 px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
				{children}
			</div>
			<Footer />
		</main>
	);
}
