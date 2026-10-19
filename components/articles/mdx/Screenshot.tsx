import Image from "next/image";
import { useTranslations } from "next-intl";

/** Capture d'écran numérotée comme les graphiques (fichier dans `public/`). */
export function Screenshot({
	src,
	alt,
	width,
	height,
	caption,
	figureNumber,
}: Readonly<{
	src: string;
	alt: string;
	width: number;
	height: number;
	caption?: string;
	figureNumber?: number;
}>) {
	const t = useTranslations("figure");
	return (
		<figure className="article-figure my-10">
			<a href={src} target="_blank" rel="noopener noreferrer">
				<Image
					src={src}
					alt={alt}
					width={width}
					height={height}
					sizes="(max-width: 44rem) 100vw, 44rem"
					className="article-screenshot"
				/>
			</a>
			{caption || figureNumber ? (
				<figcaption>
					{figureNumber ? t("prefix", { n: figureNumber }) : ""}
					{caption}
				</figcaption>
			) : null}
		</figure>
	);
}
