import { Bot, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { LUCIDE_ICONS } from "@/lib/icon-bank";

const LUCIDE_ICON_MAP = Object.fromEntries(
	LUCIDE_ICONS.map((e) => [e.id, e.component]),
) as Record<string, React.ComponentType<{ className?: string }>>;

type ProjectProps = {
	id: number;
	name: string;
	description: string;
	image_path?: string;
	type: string;
	github: string;
	lastUpdate?: string;
	isPrivate?: boolean;
	isAiGenerated?: boolean;
	isML?: boolean;
	isIAG?: boolean;
	languages?: string[];
	databases?: string[];
	backends?: string[];
	frontends?: string[];
	devops?: string[];
};

export default function ProjectCard({
	name,
	description,
	image_path,
	type,
	github,
	lastUpdate,
	isPrivate = false,
	isAiGenerated = false,
	isML = false,
	isIAG = false,
	languages = [],
	databases = [],
	backends = [],
	frontends = [],
	devops = [],
}: Readonly<ProjectProps>) {
	const allTags = [
		...languages.map((l) => ({
			label: l,
			color: "bg-yellow-100 text-yellow-800",
		})),
		...databases.map((d) => ({ label: d, color: "bg-blue-100 text-blue-800" })),
		...backends.map((b) => ({
			label: b,
			color: "bg-green-100 text-green-800",
		})),
		...frontends.map((f) => ({
			label: f,
			color: "bg-purple-100 text-purple-800",
		})),
		...devops.map((d) => ({
			label: d,
			color: "bg-orange-100 text-orange-800",
		})),
	];

	const formattedDate = lastUpdate
		? new Date(lastUpdate).toLocaleDateString("fr-FR", {
				year: "numeric",
				month: "short",
			})
		: null;

	function renderCardMedia() {
		const effectivePath =
			image_path && image_path.length > 0 ? image_path : "/icon/Github.svg";

		let mediaContent: React.ReactNode;

		if (effectivePath.startsWith("lucide:")) {
			const LucideComponent = LUCIDE_ICON_MAP[effectivePath];
			mediaContent = LucideComponent ? (
				<LucideComponent className="h-24 w-24 text-gray-500 dark:text-gray-400" />
			) : (
				<Image
					src="/icon/Github.svg"
					alt={`Image du projet ${name}`}
					width={100}
					height={100}
					className="h-24 w-24 object-contain"
				/>
			);
		} else {
			const src = effectivePath.startsWith("/")
				? effectivePath
				: `/${effectivePath}`;
			mediaContent = (
				<Image
					src={src}
					alt={`Image du projet ${name}`}
					width={100}
					height={100}
					className="h-24 w-24 object-contain"
				/>
			);
		}

		return (
			<div
				className="flex h-32 w-full items-center justify-center rounded-lg bg-linear-to-br
         from-gray-50 to-gray-100 p-2 dark:from-gray-800 dark:to-gray-900"
			>
				{mediaContent}
			</div>
		);
	}

	return (
		<Card className={`relative overflow-hidden ${isPrivate ? "group" : ""}`}>
			{isPrivate && (
				<div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[2px] transition-all duration-300 group-hover:bg-white/40 dark:bg-black/60 dark:group-hover:bg-black/40">
					<div className="flex flex-col items-center gap-2 text-gray-600 dark:text-gray-400">
						<Lock className="h-8 w-8" />
						<span className="text-sm font-medium">Projet privé</span>
					</div>
				</div>
			)}

			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle>{name}</CardTitle>
					<div className="flex gap-1">
						{isAiGenerated && (
							<Badge
								variant="secondary"
								className="bg-linear-to-r from-violet-500 to-fuchsia-500 text-white"
							>
								<Bot className="mr-1 h-3 w-3" />
								AI
							</Badge>
						)}
						{isML && (
							<Badge variant="secondary" className="bg-blue-600 text-white">
								ML
							</Badge>
						)}
						{isIAG && (
							<Badge
								variant="secondary"
								className="bg-linear-to-r from-indigo-500 to-violet-500 text-white"
							>
								IAG
							</Badge>
						)}
						{isPrivate && (
							<Badge variant="outline">
								<Lock className="mr-1 h-3 w-3" />
								Privé
							</Badge>
						)}
					</div>
				</div>
				<CardDescription className="line-clamp-2">
					{description}
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<CardAction>
					{isPrivate ? (
						<div className="cursor-not-allowed">{renderCardMedia()}</div>
					) : (
						<Link
							href={github || "#"}
							target="_blank"
							rel="noopener noreferrer"
						>
							{renderCardMedia()}
						</Link>
					)}
				</CardAction>
				{allTags.length > 0 && (
					<div className="flex flex-wrap gap-1">
						{allTags.slice(0, 5).map((tag) => (
							<Badge key={tag.label} variant="secondary" className={tag.color}>
								{tag.label}
							</Badge>
						))}
						{allTags.length > 5 && (
							<Badge variant="outline">+{allTags.length - 5}</Badge>
						)}
					</div>
				)}
			</CardContent>
			<CardFooter className="flex justify-between">
				<p className="text-sm text-gray-500">{type}</p>
				{formattedDate && (
					<p className="text-xs text-gray-400">Màj : {formattedDate}</p>
				)}
			</CardFooter>
		</Card>
	);
}
