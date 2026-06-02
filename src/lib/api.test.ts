import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchProductBySku } from "./api";

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

describe("fetchProductBySku", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.unstubAllGlobals());

  it("GETs /products/by-sku/:sku and returns the parsed body", async () => {
    const body = { sku: "A1", name: "Widget" };
    vi.stubGlobal("fetch", mockFetchOnce(body));

    const result = await fetchProductBySku("A1");

    expect(fetch).toHaveBeenCalledWith(`${API_BASE}/products/by-sku/A1`);
    expect(result).toEqual(body);
  });

  it("URL-encodes the SKU", async () => {
    vi.stubGlobal("fetch", mockFetchOnce({}));

    await fetchProductBySku("a/b c");

    expect(fetch).toHaveBeenCalledWith(`${API_BASE}/products/by-sku/a%2Fb%20c`);
  });

  it("throws on a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchOnce(null, { ok: false, status: 404, statusText: "Not Found" }),
    );

    await expect(fetchProductBySku("nope")).rejects.toThrow("HTTP 404: Not Found");
  });
});
