export const PROJECT_STATUSES = ["InProgress", "Done", "Archived"] as const;

export type ProjectStatusValue = (typeof PROJECT_STATUSES)[number];

export const STATUS_LABELS: Record<ProjectStatusValue, string> = {
	InProgress: "en cours",
	Done: "terminé",
	Archived: "archivé",
};
