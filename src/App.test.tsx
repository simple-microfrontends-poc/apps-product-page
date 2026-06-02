import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductOut } from "./lib/api";

vi.mock("./lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./lib/api")>();
  return { ...actual, fetchProductBySku: vi.fn() };
});

import App from "./App";
import { fetchProductBySku } from "./lib/api";

const mockFetch = vi.mocked(fetchProductBySku);

function makeProduct(overrides: Partial<ProductOut> = {}): ProductOut {
  return {
    sku: "A1",
    name: "Widget",
    gtin: "111",
    category: "Tools",
    description: "desc",
    images: [],
    attributes: [],
    ...overrides,
  };
}

beforeEach(() => mockFetch.mockReset());

describe("product-page App", () => {
  it("shows the placeholder and does not fetch when no sku is given", () => {
    render(<App />);

    expect(
      screen.getByText("Wybierz produkt z listy, aby zobaczyć jego kartę."),
    ).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("fetches by sku and renders the product card", async () => {
    mockFetch.mockResolvedValue(makeProduct({ name: "Super Widget" }));

    render(<App sku="A1" />);

    expect(await screen.findByText("Super Widget")).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledWith("A1");
  });

  it("shows a spinner while loading", async () => {
    let resolve!: (v: ProductOut) => void;
    mockFetch.mockReturnValue(new Promise((r) => (resolve = r)));

    const { container } = render(<App sku="A1" />);
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();

    resolve(makeProduct());
    expect(await screen.findByText("Widget")).toBeInTheDocument();
  });

  it("shows an error with the sku when the fetch fails", async () => {
    mockFetch.mockRejectedValue(new Error("HTTP 404: Not Found"));

    render(<App sku="MISSING" />);

    expect(await screen.findByText("Nie znaleziono produktu")).toBeInTheDocument();
    expect(screen.getByText("MISSING")).toBeInTheDocument();
    expect(screen.getByText(/HTTP 404: Not Found/)).toBeInTheDocument();
  });

  it("renders a back button only when onBack is given and calls it", async () => {
    mockFetch.mockResolvedValue(makeProduct());
    const onBack = vi.fn();
    const user = userEvent.setup();

    render(<App sku="A1" onBack={onBack} />);
    await screen.findByText("Widget");

    await user.click(screen.getByRole("button", { name: /Powrot do listy/ }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("refetches when the sku prop changes", async () => {
    mockFetch.mockImplementation(async (sku: string) =>
      makeProduct({ sku, name: `Product ${sku}` }),
    );

    const { rerender } = render(<App sku="A1" />);
    expect(await screen.findByText("Product A1")).toBeInTheDocument();

    rerender(<App sku="B2" />);
    expect(await screen.findByText("Product B2")).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledWith("B2");
  });
});
