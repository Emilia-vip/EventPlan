import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EventDetailPanel } from "../../src/components/EventDetailPanel";
import * as authContext from "../../src/context/AuthContext";
import { ApiError } from "../../src/errors";
import * as eventsService from "../../src/services/events";

vi.mock("../../src/services/events");
vi.mock("../../src/context/AuthContext");

const event = {
  id: "1",
  title: "Julfest",
  description: "Glögg",
  location: "Stockholm",
  startsAt: "2999-12-24T18:00:00.000Z",
  capacity: 2,
  seatsTaken: 1,
  seatsLeft: 1,
  isFull: false,
};

const loggedIn = { user: { id: "u", name: "Anna", email: "anna@example.se", role: "customer" as const } };

function renderPanel(auth: { user: typeof loggedIn.user | null }, overrides = {}) {
  vi.mocked(authContext.useAuth).mockReturnValue(auth as ReturnType<typeof authContext.useAuth>);
  const props = { event, onClose: vi.fn(), onRegistered: vi.fn(), onRequestAuth: vi.fn(), ...overrides };
  render(<EventDetailPanel {...props} />);
  return props;
}

afterEach(() => vi.resetAllMocks());

describe("EventDetailPanel", () => {
  it("ber en utloggad användare logga in", async () => {
    const props = renderPanel({ user: null });

    await userEvent.click(screen.getByRole("button", { name: /^Log in/ }));

    expect(props.onRequestAuth).toHaveBeenCalledWith("login");
    expect(screen.queryByRole("button", { name: /Get ticket/ })).not.toBeInTheDocument();
  });

  it("bokar en plats för inloggad användare", async () => {
    vi.mocked(eventsService.buyTicket).mockResolvedValue({ id: "t", eventId: "1", name: "Anna", email: "anna@example.se" });
    const props = renderPanel(loggedIn);

    await userEvent.click(screen.getByRole("button", { name: /Get ticket/ }));

    expect(await screen.findByText("You've got a ticket!")).toBeInTheDocument();
    expect(eventsService.buyTicket).toHaveBeenCalledWith("1");
    expect(props.onRegistered).toHaveBeenCalledWith("1");
  });

  it("visar felet när bokningen misslyckas", async () => {
    vi.mocked(eventsService.buyTicket).mockRejectedValue(new ApiError(409, "ALREADY_REGISTERED", "You already have a ticket for this event"));
    const props = renderPanel(loggedIn);

    await userEvent.click(screen.getByRole("button", { name: /Get ticket/ }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("You already have a ticket for this event"));
    expect(props.onRegistered).not.toHaveBeenCalled();
  });

  it("visar slutsålt och ingen bokningsknapp när eventet är fullt", () => {
    renderPanel(loggedIn, { event: { ...event, seatsTaken: 2, seatsLeft: 0, isFull: true } });

    expect(screen.getByText("This event is sold out")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Get ticket/ })).not.toBeInTheDocument();
  });
});
