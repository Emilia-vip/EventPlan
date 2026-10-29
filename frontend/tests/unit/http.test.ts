import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../src/errors";
import { request } from "../../src/http";

// Node saknar localStorage, så sessionen ersätts med en enkel minnesversion
const store = new Map<string, string>();
const fetchMock = vi.fn();

beforeEach(() => {
  store.clear();
  fetchMock.mockReset();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  });
  vi.stubGlobal("window", { dispatchEvent: vi.fn() });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

describe("request", () => {
  it("returnerar svaret som JSON", async () => {
    fetchMock.mockResolvedValue(json(200, [{ id: "1" }]));
    await expect(request("/events")).resolves.toEqual([{ id: "1" }]);
  });

  it("skickar med token som Authorization-header", async () => {
    store.set("meeting-point.token", "abc");
    fetchMock.mockResolvedValue(json(200, {}));
    await request("/auth/me");
    expect(fetchMock.mock.calls[0]![1].headers.Authorization).toBe("Bearer abc");
  });

  it("kastar ApiError med vänligt meddelande vid felsvar", async () => {
    fetchMock.mockResolvedValue(json(409, { error: "EMAIL_TAKEN", message: "x" }));
    await expect(request("/auth/signup")).rejects.toMatchObject({
      status: 409,
      code: "EMAIL_TAKEN",
      message: "An account with this email already exists",
    });
  });

  it("kastar NETWORK-fel när servern inte går att nå", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    const err = await request("/events").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 0, code: "NETWORK" });
  });

  it("glömmer en token som servern inte godkänner", async () => {
    store.set("meeting-point.token", "gammal");
    fetchMock.mockResolvedValue(json(401, { error: "UNAUTHORIZED", message: "x" }));
    await expect(request("/auth/me")).rejects.toMatchObject({ status: 401 });
    expect(store.has("meeting-point.token")).toBe(false);
  });
});
