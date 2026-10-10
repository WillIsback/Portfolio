export const ALLOWED_IMAGE_TYPES = [
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/gif",
];
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const MAX_IMAGES = 3;
export const MAX_TEXT_BYTES = 100 * 1024;

export type AttachmentCheck = { ok: true } | { ok: false; reason: string };

export interface AttachmentMeta {
	mediaType: string;
	size: number;
}

export function validateAttachment(meta: AttachmentMeta): AttachmentCheck {
	if (ALLOWED_IMAGE_TYPES.includes(meta.mediaType)) {
		if (meta.size > MAX_IMAGE_BYTES)
			return { ok: false, reason: "Image trop lourde (max 2 Mo)." };
		return { ok: true };
	}
	if (
		meta.mediaType.startsWith("text/") ||
		meta.mediaType === "application/json"
	) {
		if (meta.size > MAX_TEXT_BYTES)
			return { ok: false, reason: "Fichier texte trop lourd (max 100 Ko)." };
		return { ok: true };
	}
	return { ok: false, reason: `Type non pris en charge : ${meta.mediaType}.` };
}

export function validateAttachmentSet(
	files: AttachmentMeta[],
): AttachmentCheck {
	const images = files.filter((f) => ALLOWED_IMAGE_TYPES.includes(f.mediaType));
	if (images.length > MAX_IMAGES)
		return { ok: false, reason: `Maximum ${MAX_IMAGES} images.` };
	for (const f of files) {
		const check = validateAttachment(f);
		if (!check.ok) return check;
	}
	return { ok: true };
}
