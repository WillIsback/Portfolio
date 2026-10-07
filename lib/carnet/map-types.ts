import { z } from "zod";

export const MapItemSchema = z.object({
	id: z.string(),
	kind: z.enum(["article", "project"]),
	title: z.string(),
	href: z.string(),
	x: z.number().min(0).max(1),
	y: z.number().min(0).max(1),
	cluster: z.string(),
	keywords: z.array(z.string()),
	vector: z.array(z.number()),
});

export const MapDataSchema = z.object({
	model: z.string(),
	generatedAt: z.string(),
	clusters: z.array(z.object({ id: z.string(), label: z.string() })),
	items: z.array(MapItemSchema),
});

export type MapItem = z.infer<typeof MapItemSchema>;
export type MapData = z.infer<typeof MapDataSchema>;
