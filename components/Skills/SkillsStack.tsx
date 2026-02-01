"use client";
import { type ReactNode, useEffect, useRef, useState } from "react";
import ApiBackend from "./ApiBackend";
import Database from "./DataBase";
import DevOps from "./DevOps";
import Frontend from "./FrontEnd";

type StackSectionProps = {
	children: ReactNode;
	index: number;
	onInView: (index: number) => void;
};

const STACK_COLORS = [
	"#f59e0b", // DevOps - orange (premier, en haut)
	"#10b981", // Frontend - green
	"#3b82f6", // API - blue
	undefined, // Database - transparent (dernier, fondation en bas)
];

function StackCube({
	color,
	stackIndex,
	isNext,
	progress = 1,
}: {
	color?: string;
	stackIndex: number;
	isNext?: boolean;
	progress?: number;
}) {
	const isFilled = Boolean(color);
	const fillColor = color ?? "transparent";
	const borderColor = color ? color : "#6b7280";
	const darkerColor = color ? `${color}bb` : "#4b5563";
	const darkestColor = color ? `${color}88` : "#374151";

	// Dimensions du cube isométrique
	const width = 80;
	const height = 16;
	const stackSpacing = height;

	// Position finale quand empilé - vers le BAS (positif)
	const finalY = stackIndex * stackSpacing;

	// Position initiale en bas de l'écran pour le prochain cube - réduit pour moins de mouvement
	const startY = 250; // Réduit de 400 à 250

	// Interpolation smooth entre position de départ et finale
	const currentY = isNext ? startY + (finalY - startY) * progress : finalY;

	// Opacité progressive pour le prochain cube - plus douce
	const opacity = isNext ? 0.5 + 0.5 * progress : 1;

	return (
		<div
			className="absolute transition-all duration-1000 ease-out"
			style={{
				width: `${width + 20}px`,
				height: `${height + 20}px`,
				transform: `translateY(${currentY}px) scale(${isNext ? 0.98 + 0.02 * progress : 1})`,
				opacity,
				zIndex: 100 - stackIndex, // Plus l'index est haut, plus le z-index est bas (empile par dessous)
				filter: isFilled
					? `drop-shadow(2px 4px 6px ${color}55)`
					: "drop-shadow(1px 2px 3px rgba(0,0,0,0.15))",
				transition: "all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
			}}
		>
			{/* Face du dessus (top) - parallélogramme */}
			<svg
				className="absolute"
				width={width + 20}
				height={height + 25}
				style={{ top: 0, left: 0 }}
			>
				<title>{`Stack cube ${stackIndex}`}</title>
				{/* Face du dessus */}
				<polygon
					points={`10,${height} ${width / 2 + 10},0 ${width + 10},${height} ${width / 2 + 10},${height * 2}`}
					fill={isFilled ? `${fillColor}50` : "transparent"}
					stroke={borderColor}
					strokeWidth="2"
				/>
				{/* Face gauche */}
				<polygon
					points={`10,${height} ${width / 2 + 10},${height * 2} ${width / 2 + 10},${height * 2 + 8} 10,${height + 8}`}
					fill={isFilled ? darkerColor : "transparent"}
					stroke={borderColor}
					strokeWidth="2"
				/>
				{/* Face droite */}
				<polygon
					points={`${width + 10},${height} ${width / 2 + 10},${height * 2} ${width / 2 + 10},${height * 2 + 8} ${width + 10},${height + 8}`}
					fill={isFilled ? darkestColor : "transparent"}
					stroke={borderColor}
					strokeWidth="2"
				/>
			</svg>
		</div>
	);
}

function PersistentStack({ activeIndex }: { activeIndex: number }) {
	const [scrollProgress, setScrollProgress] = useState(0);

	useEffect(() => {
		const handleScroll = () => {
			// Calculer la progression du scroll pour le prochain cube
			const sections = document.querySelectorAll("[data-stack-section]");
			if (sections[activeIndex + 1]) {
				const nextSection = sections[activeIndex + 1];
				const rect = nextSection.getBoundingClientRect();
				const windowHeight = window.innerHeight;

				// Progress de 0 à 1 basé sur la position de la prochaine section
				// Commence quand la section est en bas (100%) et finit au centre (50%)
				const progress = Math.max(
					0,
					Math.min(1, (windowHeight * 0.9 - rect.top) / (windowHeight * 0.4)),
				);

				setScrollProgress(progress);
			}
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		handleScroll(); // Initial call

		return () => window.removeEventListener("scroll", handleScroll);
	}, [activeIndex]);

	return (
		<div
			className="sticky top-1/2 -translate-y-1/2 h-fit"
			style={{
				width: "120px",
				height: "100px",
				position: "sticky",
				left: "calc(75% + 50px)", // 75% = bord droit des articles (w-1/2 centré) + 50px
			}}
		>
			{/* Cubes empilés actuels */}
			{STACK_COLORS.slice(0, activeIndex + 1).map((color, i) => (
				<StackCube key={`stack-${i}`} color={color} stackIndex={i} />
			))}

			{/* Prochain cube qui remonte depuis le bas */}
			{activeIndex < STACK_COLORS.length - 1 && (
				<StackCube
					key={`stack-next-${activeIndex + 1}`}
					color={STACK_COLORS[activeIndex + 1]}
					stackIndex={activeIndex + 1}
					isNext={true}
					progress={scrollProgress}
				/>
			)}
		</div>
	);
}

function StackSection({ children, index, onInView }: StackSectionProps) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						onInView(index);
					}
				});
			},
			{
				rootMargin: "-45% 0px -45% 0px", // Déclenche quand la section est au centre
				threshold: 0,
			},
		);

		if (ref.current) {
			observer.observe(ref.current);
		}

		return () => observer.disconnect();
	}, [index, onInView]);

	return (
		<div ref={ref} data-stack-section className="mb-24">
			{children}
		</div>
	);
}

export default function SkillsStack() {
	const [activeIndex, setActiveIndex] = useState(0);

	return (
		<section className="relative">
			{/* Colonne des articles */}
			<div className="">
				<StackSection index={0} onInView={setActiveIndex}>
					<DevOps />
				</StackSection>

				<StackSection index={1} onInView={setActiveIndex}>
					<Frontend />
				</StackSection>

				<StackSection index={2} onInView={setActiveIndex}>
					<ApiBackend />
				</StackSection>

				<StackSection index={3} onInView={setActiveIndex}>
					<Database />
				</StackSection>
			</div>

			{/* Pile sticky positionnée absolument */}
			<div
				className="absolute left-0 right-0 pointer-events-none"
				style={{
					top: "150px", // Limite haute (ajuste cette valeur)
					bottom: "150px", // Limite basse (ajuste cette valeur)
				}}
			>
				<PersistentStack activeIndex={activeIndex} />
			</div>
		</section>
	);
}
