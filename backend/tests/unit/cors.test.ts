import { describe, expect, it } from "vitest";
import { parseCorsOrigins } from "../../src/app.js";

describe("parseCorsOrigins", () => {
  it("delar upp en kommaseparerad lista och trimmar", () => {
    expect(parseCorsOrigins(" https://cdn.example.se , https://example.se/ ")).toEqual([
      "https://cdn.example.se",
      "https://example.se",
    ]);
  });

  it("ger tom lista när variabeln saknas", () => {
    expect(parseCorsOrigins(undefined)).toEqual([]);
    expect(parseCorsOrigins("")).toEqual([]);
  });
});
