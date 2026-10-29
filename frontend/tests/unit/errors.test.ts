import { describe, expect, it } from "vitest";
import { ApiError, errorMessage, friendlyMessage } from "../../src/errors";

describe("friendlyMessage", () => {
  it("översätter kända felkoder", () => {
    expect(friendlyMessage("EVENT_FULL", "x")).toBe("This event is sold out");
    expect(friendlyMessage("INVALID_CREDENTIALS", "x")).toBe("Wrong email or password");
  });

  it("använder reservtexten för okända koder", () => {
    expect(friendlyMessage("OKÄND", "reserv")).toBe("reserv");
  });
});

describe("errorMessage", () => {
  it("visar meddelandet från ett ApiError", () => {
    expect(errorMessage(new ApiError(409, "EMAIL_TAKEN", "Upptagen"))).toBe("Upptagen");
  });

  it("döljer detaljer för andra fel", () => {
    expect(errorMessage(new Error("intern stacktrace"))).toBe("Something went wrong");
  });
});
