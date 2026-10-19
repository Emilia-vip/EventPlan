import { describe, expect, it } from "vitest";
import { toEventDto, type EventRow } from "../../src/services/events.js";

const row = (capacity: number, seats_taken: number): EventRow => ({
  id: "abc",
  title: "Fest",
  description: "",
  location: "",
  starts_at: new Date("2026-12-24T18:00:00Z"),
  capacity,
  seats_taken,
});

describe("toEventDto", () => {
  it("räknar ut lediga platser", () => {
    expect(toEventDto(row(10, 3))).toMatchObject({ seatsLeft: 7, isFull: false });
  });

  it("markerar fullt event", () => {
    expect(toEventDto(row(5, 5))).toMatchObject({ seatsLeft: 0, isFull: true });
  });

  it("gör om till camelCase och ISO-datum", () => {
    expect(toEventDto(row(1, 0))).toMatchObject({
      startsAt: "2026-12-24T18:00:00.000Z",
      seatsTaken: 0,
    });
  });
});