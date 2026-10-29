import { describe, expect, it } from "vitest";
import { IMAGES, formatDate, imageFor } from "../../src/format";

describe("imageFor", () => {
  it("ger samma bild för samma id", () => {
    expect(imageFor("abc")).toBe(imageFor("abc"));
  });

  it("ger alltid en av de kända bilderna", () => {
    for (const id of ["1", "2", "abc", "00000000-0000-0000-0000-000000000001"]) {
      expect(IMAGES).toContain(imageFor(id));
    }
  });
});

describe("formatDate", () => {
  it("delar upp datumet i dag, månad, långt datum och tid", () => {
    const d = formatDate("2030-12-24T12:00:00.000Z");
    expect(d.day).toBe("24");
    expect(d.month).toBe("DEC");
    expect(d.long).toContain("2030");
    expect(d.time).toMatch(/^\d{2}:\d{2}$/);
  });
});
