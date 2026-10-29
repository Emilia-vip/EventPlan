import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthPanel } from "../../src/components/AuthPanel";
import { AuthProvider } from "../../src/context/AuthContext";
import { ApiError } from "../../src/errors";
import * as authService from "../../src/services/auth";

vi.mock("../../src/services/auth");

const session = { token: "t", user: { id: "1", name: "Anna", email: "anna@example.se", role: "customer" as const } };

function renderPanel(mode: "login" | "signup", onClose = vi.fn()) {
  render(
    <AuthProvider>
      <AuthPanel mode={mode} onClose={onClose} />
    </AuthProvider>,
  );
  return { onClose, user: userEvent.setup() };
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.resetAllMocks());

describe("AuthPanel", () => {
  it("loggar in och stänger panelen", async () => {
    vi.mocked(authService.login).mockResolvedValue(session);
    const { onClose, user } = renderPanel("login");

    await user.type(screen.getByLabelText("Email"), "Anna@Example.se");
    await user.type(screen.getByLabelText("Password"), "hemligt123");
    await user.click(screen.getByRole("button", { name: /^Log in/ }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(authService.login).toHaveBeenCalledWith({ email: "anna@example.se", password: "hemligt123" });
    expect(localStorage.getItem("meeting-point.token")).toBe("t");
  });

  it("visar valideringsfel utan att anropa servern", async () => {
    const { user } = renderPanel("signup");

    await user.type(screen.getByLabelText("Name"), "Anna");
    await user.type(screen.getByLabelText("Email"), "anna@example.se");
    await user.type(screen.getByLabelText("Password"), "kort");
    await user.click(screen.getByRole("button", { name: /^Create account/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Password must be at least 8 characters");
    expect(authService.signup).not.toHaveBeenCalled();
  });

  it("visar serverns felmeddelande och lämnar panelen öppen", async () => {
    vi.mocked(authService.login).mockRejectedValue(new ApiError(401, "INVALID_CREDENTIALS", "Wrong email or password"));
    const { onClose, user } = renderPanel("login");

    await user.type(screen.getByLabelText("Email"), "anna@example.se");
    await user.type(screen.getByLabelText("Password"), "fel");
    await user.click(screen.getByRole("button", { name: /^Log in/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Wrong email or password");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("byter mellan inloggning och registrering", async () => {
    const { user } = renderPanel("login");
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Create an account" }));

    expect(screen.getByRole("heading", { name: "Create account" })).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });
});
