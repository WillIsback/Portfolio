import { ImageResponse } from "next/og";
import { OG_COLORS, OG_SIGNATURE, OG_SIZE, ogText } from "@/lib/og";

/**
 * Image de partage 1200×630 : le `kicker` en haut, le titre au centre, la signature
 * en bas. Police par défaut de `next/og` ; les glyphes manquants (chinois) sont
 * chargés dynamiquement par `next/og`.
 */
export function ogCard(input: { title: string; kicker: string }) {
	const { title, kicker } = ogText(input);
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				padding: "72px 80px",
				background: OG_COLORS.background,
				color: OG_COLORS.ink,
			}}
		>
			<div
				style={{
					display: "flex",
					fontSize: 30,
					letterSpacing: 4,
					textTransform: "uppercase",
					color: OG_COLORS.title,
				}}
			>
				{kicker}
			</div>
			<div
				style={{
					display: "flex",
					fontSize: 64,
					fontWeight: 700,
					lineHeight: 1.15,
					color: OG_COLORS.title,
				}}
			>
				{title}
			</div>
			<div
				style={{
					display: "flex",
					fontSize: 32,
					borderTop: `3px solid ${OG_COLORS.title}`,
					paddingTop: 24,
				}}
			>
				{OG_SIGNATURE}
			</div>
		</div>,
		OG_SIZE,
	);
}
