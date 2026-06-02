import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchProductById } from "./api";

const API_BASE = "http://localhost:8000";

function mockFetchOnce(body: unknown, init?: Partial<Response>) {
  const res = {
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    statusText: init?.statusText ?? "OK",
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
  return vi.fn().mockResolvedValue(res);
}

describe("fetchProductById", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.unstubAllGlobals());

  it("GETs /products/:id and returns the parsed body", async () => {
    const body = { id: 1, sku: "A1", name: "Widget" };
    vi.stubGlobal("fetch", mockFetchOnce(body));

    const result = await fetchProductById(1);

    expect(fetch).toHaveBeenCalledWith(`${API_BASE}/products/1`);
    expect(result).toEqual(body);
  });

  it("interpolates the numeric id into the URL", async () => {
    vi.stubGlobal("fetch", mockFetchOnce({}));

    await fetchProductById(42);

    expect(fetch).toHaveBeenCalledWith(`${API_BASE}/products/42`);
  });

  it("throws on a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchOnce(null, { ok: false, status: 404, statusText: "Not Found" }),
    );

    await expect(fetchProductById(999)).rejects.toThrow("HTTP 404: Not Found");
  });
});
