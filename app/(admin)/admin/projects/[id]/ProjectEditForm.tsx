// app/(admin)/projects/[id]/ProjectEditForm.tsx
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateProject } from "@/app/actions/admin.action";
import { IconPickerModal } from "@/components/admin/IconPickerModal";
import { PITCH_MAX } from "@/lib/admin/project-form";
import { AI_DOMAINS, DOMAIN_LABELS } from "@/lib/domains";
import { LUCIDE_ICONS } from "@/lib/icon-bank";
import { PROJECT_STATUSES, STATUS_LABELS } from "@/lib/status";
import {
	BACKEND_LABELS,
	DATABASE_LABELS,
	DEVOPS_LABELS,
	FRONTEND_LABELS,
	LANGUAGE_LABELS,
	ML_STACK_LABELS,
} from "@/lib/tech-labels";
import {
	type AdminProject,
	BackendApiEnum,
	DatabaseEnum,
	DevOpsEnum,
	FrontendEnum,
	LanguageEnum,
	MlStackEnum,
} from "@/schemas";
import { ImagePicker } from "./ImagePicker";
import { ProjectPreview } from "./ProjectPreview";

const FIELD =
	"w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600";

const LUCIDE_COMPONENT_MAP = Object.fromEntries(
	LUCIDE_ICONS.map((e) => [e.id, e.component]),
) as Record<string, React.ComponentType<{ className?: string }>>;

export function ProjectEditForm({
	id,
	initial,
	articles = [],
}: {
	id: number;
	initial: AdminProject;
	articles?: { slug: string; title: string }[];
}) {
	const router = useRouter();
	const [form, setForm] = useState<AdminProject>(initial);
	const [isPending, startTransition] = useTransition();
	const [modalOpen, setModalOpen] = useState(false);

	function setField<K extends keyof AdminProject>(
		key: K,
		value: AdminProject[K],
	) {
		setForm((prev) => ({ ...prev, [key]: value }));
	}

	function toggleArrayValue<T extends string>(
		key: keyof AdminProject,
		value: T,
	) {
		const current = (form[key] as T[]) ?? [];
		setField(
			key,
			(current.includes(value)
				? current.filter((v) => v !== value)
				: [...current, value]) as AdminProject[typeof key],
		);
	}

	function handleSave() {
		startTransition(async () => {
			try {
				await updateProject(id, form);
				toast.success("Project updated");
				router.push("/admin/projects");
			} catch {
				toast.error("Update failed");
			}
		});
	}

	function renderCurrentIcon() {
		const path = form.imagePath;
		if (!path) {
			return (
				<div className="w-10 h-10 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-600 text-xs">
					?
				</div>
			);
		}
		if (path.startsWith("lucide:")) {
			const LucideComponent = LUCIDE_COMPONENT_MAP[path];
			return LucideComponent ? (
				<LucideComponent className="w-10 h-10 text-zinc-300" />
			) : (
				<div className="w-10 h-10 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-600 text-xs">
					?
				</div>
			);
		}
		const src = path.startsWith("/") ? path : `/${path}`;
		return (
			<Image
				src={src}
				alt="Icône du projet"
				width={40}
				height={40}
				className="object-contain w-10 h-10"
			/>
		);
	}

	return (
		<div className="space-y-6 max-w-2xl">
			<div className="grid grid-cols-2 gap-4">
				<div>
					<label htmlFor="title" className="text-xs text-zinc-500 block mb-1">
						Title
					</label>
					<input
						id="title"
						className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
						value={form.title}
						onChange={(e) => setField("title", e.target.value)}
					/>
				</div>
				<div>
					<p className="text-xs text-zinc-500 block mb-1">Icône</p>
					<div className="flex items-center gap-3">
						{renderCurrentIcon()}
						<button
							type="button"
							onClick={() => setModalOpen(true)}
							className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
						>
							Choisir une icône
						</button>
					</div>
				</div>
			</div>

			<div>
				<label
					htmlFor="description"
					className="text-xs text-zinc-500 block mb-1"
				>
					Description
				</label>
				<textarea
					id="description"
					className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600 min-h-[100px]"
					value={form.description}
					onChange={(e) => setField("description", e.target.value)}
				/>
			</div>

			<div>
				<label htmlFor="pitch" className="text-xs text-zinc-500 block mb-1">
					Accroche
				</label>
				<input
					id="pitch"
					className={FIELD}
					maxLength={PITCH_MAX}
					aria-describedby="pitch-count"
					value={form.pitch ?? ""}
					onChange={(e) => setField("pitch", e.target.value || undefined)}
				/>
				<p id="pitch-count" className="mt-1 text-xs text-zinc-500">
					{(form.pitch ?? "").length} / {PITCH_MAX}
				</p>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div>
					<label htmlFor="status" className="text-xs text-zinc-500 block mb-1">
						Statut
					</label>
					<select
						id="status"
						className={FIELD}
						value={form.status ?? ""}
						onChange={(e) =>
							setField(
								"status",
								(e.target.value || undefined) as AdminProject["status"],
							)
						}
					>
						<option value="">Non renseigné</option>
						{PROJECT_STATUSES.map((s) => (
							<option key={s} value={s}>
								{STATUS_LABELS[s]}
							</option>
						))}
					</select>
				</div>
				<div>
					<label htmlFor="period" className="text-xs text-zinc-500 block mb-1">
						Période
					</label>
					<input
						id="period"
						className={FIELD}
						placeholder="2025 – 2026"
						value={form.period ?? ""}
						onChange={(e) => setField("period", e.target.value || undefined)}
					/>
				</div>
			</div>

			<ImagePicker
				projectId={id}
				isPrivate={form.isPrivate}
				value={form.imagePath ?? ""}
				onChange={(v) => setField("imagePath", v || undefined)}
			/>

			<div>
				<label htmlFor="github" className="text-xs text-zinc-500 block mb-1">
					GitHub URL
				</label>
				<input
					id="github"
					className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
					value={form.github ?? ""}
					onChange={(e) => setField("github", e.target.value)}
				/>
			</div>

			<TechStackCheckboxes
				label="Languages"
				options={LanguageEnum.options}
				labels={LANGUAGE_LABELS}
				selected={form.languages}
				onChange={(v) => toggleArrayValue("languages", v)}
			/>
			<TechStackCheckboxes
				label="Databases"
				options={DatabaseEnum.options}
				labels={DATABASE_LABELS}
				selected={form.databases}
				onChange={(v) => toggleArrayValue("databases", v)}
			/>
			<TechStackCheckboxes
				label="Backend APIs"
				options={BackendApiEnum.options}
				labels={BACKEND_LABELS}
				selected={form.backends}
				onChange={(v) => toggleArrayValue("backends", v)}
			/>
			<TechStackCheckboxes
				label="Frontend"
				options={FrontendEnum.options}
				labels={FRONTEND_LABELS}
				selected={form.frontends}
				onChange={(v) => toggleArrayValue("frontends", v)}
			/>
			<TechStackCheckboxes
				label="DevOps"
				options={DevOpsEnum.options}
				labels={DEVOPS_LABELS}
				selected={form.devops}
				onChange={(v) => toggleArrayValue("devops", v)}
			/>

			<TechStackCheckboxes
				label="ML & Data"
				options={MlStackEnum.options}
				labels={ML_STACK_LABELS}
				selected={form.mlStack}
				onChange={(v) => toggleArrayValue("mlStack", v)}
			/>

			<fieldset>
				<legend className="text-xs text-zinc-500 mb-1.5">
					Domaines IA/Data
				</legend>
				<div className="flex flex-wrap gap-2">
					{AI_DOMAINS.map((domain) => (
						<label
							key={domain}
							className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-zinc-400 ${
								form.domains.includes(domain)
									? "border-zinc-400 text-zinc-200 bg-zinc-800"
									: "border-zinc-700 text-zinc-400"
							}`}
						>
							<input
								type="checkbox"
								className="sr-only"
								checked={form.domains.includes(domain)}
								onChange={() => toggleArrayValue("domains", domain)}
							/>
							{DOMAIN_LABELS[domain]}
						</label>
					))}
				</div>
			</fieldset>

			<div className="flex gap-4 flex-wrap">
				<label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
					<input
						type="checkbox"
						checked={form.isPrivate}
						onChange={(e) => setField("isPrivate", e.target.checked)}
						className="accent-zinc-400"
					/>
					Private
				</label>
				<label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
					<input
						type="checkbox"
						checked={form.featuredRank !== undefined}
						onChange={(e) =>
							setField("featuredRank", e.target.checked ? 1 : undefined)
						}
						className="accent-zinc-400"
					/>
					Mettre en avant
				</label>
				<label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
					<input
						type="checkbox"
						checked={form.isAiGenerated}
						onChange={(e) => setField("isAiGenerated", e.target.checked)}
						className="accent-zinc-400"
					/>
					AI Generated
				</label>
			</div>

			{form.featuredRank !== undefined ? (
				<div>
					<label htmlFor="rank" className="text-xs text-zinc-500 block mb-1">
						Rang du projet phare
					</label>
					<input
						id="rank"
						type="number"
						min={1}
						step={1}
						className={`${FIELD} w-28`}
						value={form.featuredRank}
						onChange={(e) => {
							const n = Math.floor(Number(e.target.value));
							setField("featuredRank", Number.isFinite(n) && n >= 1 ? n : 1);
						}}
					/>
				</div>
			) : null}

			<section aria-labelledby="articles-title">
				<h2 id="articles-title" className="text-xs text-zinc-500 mb-1.5">
					Articles qui citent ce projet
				</h2>
				{articles.length === 0 ? (
					<p className="text-xs text-zinc-600">Aucun article.</p>
				) : (
					<ul className="list-disc pl-5 text-sm text-zinc-300">
						{articles.map((a) => (
							<li key={a.slug}>{a.title}</li>
						))}
					</ul>
				)}
			</section>

			<ProjectPreview id={id} form={form} />

			<div className="flex gap-3 pt-2">
				<button
					type="button"
					onClick={handleSave}
					disabled={isPending}
					className="bg-zinc-100 text-zinc-900 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-white transition-colors disabled:opacity-50"
				>
					{isPending ? "Saving…" : "Save changes"}
				</button>
				<button
					type="button"
					onClick={() => router.push("/admin/projects")}
					className="border border-zinc-700 text-zinc-400 px-5 py-2.5 rounded-lg text-sm hover:border-zinc-500 transition-colors"
				>
					Cancel
				</button>
			</div>

			<IconPickerModal
				open={modalOpen}
				current={form.imagePath}
				onSelect={(value) => setField("imagePath", value)}
				onClose={() => setModalOpen(false)}
			/>
		</div>
	);
}

function TechStackCheckboxes({
	label,
	options,
	labels = {},
	selected,
	onChange,
}: {
	label: string;
	options: readonly string[];
	labels?: Record<string, string>;
	selected: string[];
	onChange: (value: string) => void;
}) {
	return (
		<div>
			<p className="text-xs text-zinc-500 mb-1.5">{label}</p>
			<div className="flex flex-wrap gap-2">
				{options.map((opt) => (
					<label
						key={opt}
						className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${
							selected.includes(opt)
								? "border-zinc-400 text-zinc-200 bg-zinc-800"
								: "border-zinc-700 text-zinc-500"
						}`}
					>
						<input
							type="checkbox"
							className="sr-only"
							checked={selected.includes(opt)}
							onChange={() => onChange(opt)}
						/>
						{labels[opt] ?? opt}
					</label>
				))}
			</div>
		</div>
	);
}
