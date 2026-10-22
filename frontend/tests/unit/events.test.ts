import { describe, expect, it } from "vitest";
import { insertByStart, withRegistration, type EventDto } from "../../src/services/events";

const event: EventDto = {
  id: "1",
  title: "Fest",
  description: "",
  location: "Stockholm",
  startsAt: "2030-12-24T18:00:00.000Z",
  capacity: 2,
  seatsTaken: 1,
  seatsLeft: 1,
  isFull: false,
};

describe("withRegistration", () => {
  it("räknar upp antalet bokade platser med en", () => {
    const after = withRegistration(event);
    expect(after.seatsTaken).toBe(2);
    expect(after.seatsLeft).toBe(0);
    expect(after.isFull).toBe(true);
  });

  it("ändrar inte originalet", () => {
    withRegistration(event);
    expect(event.seatsTaken).toBe(1);
  });
});

describe("insertByStart", () => {
  it("lägger in eventet i startordning", () => {
    const later = { ...event, id: "2", startsAt: "2031-01-01T00:00:00.000Z" };
    const earlier = { ...event, id: "0", startsAt: "2029-01-01T00:00:00.000Z" };
    expect(insertByStart([later], earlier).map((e) => e.id)).toEqual(["0", "2"]);
  });
});
