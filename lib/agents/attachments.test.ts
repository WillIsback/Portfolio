import { describe, expect, it } from "vitest";
import {
	MAX_IMAGE_BYTES,
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
	});
	it("refuse une image trop lourde", () => {
		const r = validateAttachment({
			mediaType: "image/jpeg",
			size: MAX_IMAGE_BYTES + 1,
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
});
