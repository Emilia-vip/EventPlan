import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CreateEventPanel } from "../../src/components/CreateEventPanel";
import { ApiError } from "../../src/errors";
import * as eventsService from "../../src/services/events";

vi.mock("../../src/services/events");

const created = {
  id: "1",
  title: "Julfest",
  description: "",
  location: "Stockholm",
  startsAt: "2999-12-24T18:00:00.000Z",
  capacity: 30,
  seatsTaken: 0,
  seatsLeft: 30,
  isFull: false,
};

function fill({ title = "Julfest", startsAt = "2999-12-24T18:00", capacity = "30" } = {}) {
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: title } });
  fireEvent.change(screen.getByLabelText("Date and time"), { target: { value: startsAt } });
  fireEvent.change(screen.getByLabelText("Number of spots"), { target: { value: capacity } });
}

afterEach(() => vi.resetAllMocks());

describe("CreateEventPanel", () => {
  it("skickar in formuläret och rapporterar det nya eventet", async () => {
    vi.mocked(eventsService.createEvent).mockResolvedValue(created);
    const onCreated = vi.fn();
    render(<CreateEventPanel onClose={vi.fn()} onCreated={onCreated} />);

    fill();
    await userEvent.click(screen.getByRole("button", { name: /^Create event/ }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(created));
    expect(eventsService.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Julfest", capacity: 30 }),
    );
  });

  it("kräver en titel", async () => {
    render(<CreateEventPanel onClose={vi.fn()} onCreated={vi.fn()} />);

    fill({ title: "" });
    await userEvent.click(screen.getByRole("button", { name: /^Create event/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Title is required");
    expect(eventsService.createEvent).not.toHaveBeenCalled();
  });

  it("avvisar ett datum i det förflutna", async () => {
    render(<CreateEventPanel onClose={vi.fn()} onCreated={vi.fn()} />);

    fill({ startsAt: "2000-01-01T10:00" });
    await userEvent.click(screen.getByRole("button", { name: /^Create event/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("The event must be in the future");
  });

  it("visar felet från servern och låter användaren försöka igen", async () => {
    vi.mocked(eventsService.createEvent).mockRejectedValue(new ApiError(403, "FORBIDDEN", "Only admins can do that"));
    const onCreated = vi.fn();
    render(<CreateEventPanel onClose={vi.fn()} onCreated={onCreated} />);

    fill();
    await userEvent.click(screen.getByRole("button", { name: /^Create event/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Only admins can do that");
    expect(onCreated).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /^Create event/ })).toBeEnabled();
  });

  it("stängs med Esc", async () => {
    const onClose = vi.fn();
    render(<CreateEventPanel onClose={onClose} onCreated={vi.fn()} />);

    await userEvent.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalled();
  });
});
