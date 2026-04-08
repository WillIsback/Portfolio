import { Bot, Camera, Leaf, Map, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type FileIcon = {
  label: string;
  path: string;
  category: "logo" | "icon";
};

export type LucideIconEntry = {
  id: string;
  label: string;
  component: LucideIcon;
};

export const FILE_ICONS: FileIcon[] = [
  { label: "Abricot", path: "/logo/Abricot.svg", category: "logo" },
  { label: "AI Report Maker", path: "/logo/AiReportMaker.svg", category: "logo" },
  { label: "Booki", path: "/logo/Booki.svg", category: "logo" },
  { label: "Data", path: "/logo/Data.svg", category: "logo" },
  { label: "FishEye", path: "/logo/FishEye.svg", category: "logo" },
  { label: "Les Petits Plats", path: "/logo/LesPetitsPlats.svg", category: "logo" },
  { label: "ML", path: "/logo/ML.svg", category: "logo" },
  { label: "OhMyFood", path: "/logo/OhMyFood.svg", category: "logo" },
  { label: "Portfolio", path: "/logo/Portfolio.svg", category: "logo" },
  { label: "Riding Cities", path: "/logo/RidingCities.svg", category: "logo" },
  { label: "Sophie Bluel", path: "/logo/SophieBluel.svg", category: "logo" },
  { label: "Sportsee", path: "/logo/Sportsee.svg", category: "logo" },
  { label: "Docker", path: "/icon/Docker.svg", category: "icon" },
  { label: "Express.js", path: "/icon/Expressjs.svg", category: "icon" },
  { label: "FastAPI", path: "/icon/FastApi.svg", category: "icon" },
  { label: "Fastify", path: "/icon/Fastify.svg", category: "icon" },
  { label: "GitHub", path: "/icon/Github.svg", category: "icon" },
  { label: "Informix", path: "/icon/Informix.svg", category: "icon" },
  { label: "MongoDB", path: "/icon/Mongodb.svg", category: "icon" },
  { label: "Next.js", path: "/icon/Nextjs.svg", category: "icon" },
  { label: "PostgreSQL", path: "/icon/Postgresql.svg", category: "icon" },
  { label: "Python", path: "/icon/Python.svg", category: "icon" },
  { label: "React", path: "/icon/React.svg", category: "icon" },
  { label: "Svelte", path: "/icon/Svelte.svg", category: "icon" },
  { label: "Tanstack", path: "/icon/Tanstack.svg", category: "icon" },
  { label: "TypeScript", path: "/icon/Typescript.svg", category: "icon" },
  { label: "Vite", path: "/icon/Vite.svg", category: "icon" },
];

export const LUCIDE_ICONS: LucideIconEntry[] = [
  { id: "lucide:Bot", label: "Assistant IA", component: Bot },
  { id: "lucide:Map", label: "Géographie", component: Map },
  { id: "lucide:Camera", label: "Photo / Média", component: Camera },
  { id: "lucide:Leaf", label: "Nature / Agriculture", component: Leaf },
  { id: "lucide:Users", label: "Communauté", component: Users },
];
