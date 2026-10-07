import { readFileSync } from "node:fs";
import path from "node:path";
import {
	createStaticModel,
	type StaticModel,
	type StaticModelMeta,
} from "./static-model";

export const CARNET_MODEL_DIR = path.join(
	process.cwd(),
	"public",
	"models",
	"carnet-static",
);

export function loadStaticModelFromDir(dir: string): StaticModel {
	const meta: StaticModelMeta = JSON.parse(
		readFileSync(path.join(dir, "meta.json"), "utf8"),
	);
	const words: string[] = JSON.parse(
		readFileSync(path.join(dir, "vocab.json"), "utf8"),
	);
	const v = readFileSync(path.join(dir, "vectors.i8"));
	const s = readFileSync(path.join(dir, "scales.f32"));
	const vectors = new Int8Array(v.buffer, v.byteOffset, v.byteLength);
	const scales = new Float32Array(
		s.buffer.slice(s.byteOffset, s.byteOffset + s.byteLength),
	);
	return createStaticModel(meta, words, vectors, scales);
}
