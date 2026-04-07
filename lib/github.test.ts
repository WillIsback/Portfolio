import { describe, it, expect } from "vitest";
import { detectTechStack } from "./github";

describe("detectTechStack", () => {
  it("maps TypeScript primary language to enum", () => {
    const result = detectTechStack([], "TypeScript");
    expect(result.languages).toEqual(["TypeScript"]);
  });

  it("maps Python primary language to enum", () => {
    const result = detectTechStack([], "Python");
    expect(result.languages).toEqual(["Python"]);
  });

  it("ignores unknown primary languages", () => {
    const result = detectTechStack([], "Go");
    expect(result.languages).toEqual([]);
  });

  it("ignores null primary language", () => {
    const result = detectTechStack([], null);
    expect(result.languages).toEqual([]);
  });

  it("detects Docker from root Dockerfile", () => {
    const result = detectTechStack(["Dockerfile", "src/main.ts"], "TypeScript");
    expect(result.devops).toContain("Docker");
  });

  it("detects Docker from nested Dockerfile", () => {
    const result = detectTechStack(["docker/Dockerfile"], null);
    expect(result.devops).toContain("Docker");
  });

  it("detects GithubActions from .github/workflows", () => {
    const result = detectTechStack([".github/workflows/ci.yml"], null);
    expect(result.devops).toContain("GithubActions");
  });

  it("returns empty arrays when nothing detected", () => {
    const result = detectTechStack(["README.md"], null);
    expect(result).toEqual({
      languages: [],
      databases: [],
      backends: [],
      frontends: [],
      devops: [],
    });
  });
});
