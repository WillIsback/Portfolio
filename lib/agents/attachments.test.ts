import { describe, expect, it } from "vitest";
import {
	MAX_IMAGE_BYTES,
	MAX_TEXT_BYTES,
	validateAttachment,
	validateAttachmentSet,
} from "./attachments";

describe("validateAttachment", () => {
	it("accepte une image autorisée sous la limite", () => {
		expect(validateAttachment({ mediaType: "image/png", size: 10 })).toEqual({
			ok: true,
		});
	});
	it("refuse un type non autorisé", () => {
		const r = validateAttachment({ mediaType: "application/pdf", size: 10 });
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.reason).toContain("application/pdf");
	});
	it("refuse une image trop lourde", () => {
		const r = validateAttachment({
			mediaType: "image/jpeg",
			size: MAX_IMAGE_BYTES + 1,
		});
		expect(r.ok).toBe(false);
	});
	it("accepte un petit fichier texte", () => {
		expect(validateAttachment({ mediaType: "text/plain", size: 10 })).toEqual({
			ok: true,
		});
	});
	it("accepte un petit fichier JSON", () => {
		expect(
			validateAttachment({ mediaType: "application/json", size: 10 }),
		).toEqual({ ok: true });
	});
	it("refuse un fichier texte trop lourd", () => {
		const r = validateAttachment({
			mediaType: "text/plain",
			size: MAX_TEXT_BYTES + 1,
		});
		expect(r.ok).toBe(false);
	});
});

describe("validateAttachmentSet", () => {
	it("refuse plus de 3 images", () => {
		const files = Array.from({ length: 4 }, () => ({
			mediaType: "image/png",
			size: 10,
		}));
		expect(validateAttachmentSet(files).ok).toBe(false);
	});
	it("accepte 3 images valides", () => {
		const files = Array.from({ length: 3 }, () => ({
			mediaType: "image/png",
			size: 10,
		}));
		expect(validateAttachmentSet(files)).toEqual({ ok: true });
	});
	it("refuse un type d'image non pris en charge sous la limite de nombre", () => {
		const files = [{ mediaType: "image/svg+xml", size: 10 }];
		const r = validateAttachmentSet(files);
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.reason).toContain("image/svg+xml");
	});
});
