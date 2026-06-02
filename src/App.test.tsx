import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductOut } from "./lib/api";

vi.mock("./lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./lib/api")>();
  return { ...actual, fetchProductById: vi.fn() };
});

import App from "./App";
import { fetchProductById } from "./lib/api";

const mockFetch = vi.mocked(fetchProductById);

function makeProduct(overrides: Partial<ProductOut> = {}): ProductOut {
  return {
    id: 1,
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
  it("shows the placeholder and does not fetch when no id is given", () => {
    render(<App />);

    expect(
      screen.getByText("Wybierz produkt z listy, aby zobaczyć jego kartę."),
    ).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("fetches by id and renders the product card", async () => {
    mockFetch.mockResolvedValue(makeProduct({ name: "Super Widget" }));

    render(<App id={1} />);

    expect(await screen.findByText("Super Widget")).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledWith(1);
  });

  it("shows a spinner while loading", async () => {
    let resolve!: (v: ProductOut) => void;
    mockFetch.mockReturnValue(new Promise((r) => (resolve = r)));

    const { container } = render(<App id={1} />);
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();

    resolve(makeProduct());
    expect(await screen.findByText("Widget")).toBeInTheDocument();
  });

  it("shows an error with the id when the fetch fails", async () => {
    mockFetch.mockRejectedValue(new Error("HTTP 404: Not Found"));

    render(<App id={999} />);

    expect(await screen.findByText("Nie znaleziono produktu")).toBeInTheDocument();
    expect(screen.getByText("999")).toBeInTheDocument();
    expect(screen.getByText(/HTTP 404: Not Found/)).toBeInTheDocument();
  });

  it("renders a back button only when onBack is given and calls it", async () => {
    mockFetch.mockResolvedValue(makeProduct());
    const onBack = vi.fn();
    const user = userEvent.setup();

    render(<App id={1} onBack={onBack} />);
    await screen.findByText("Widget");

    await user.click(screen.getByRole("button", { name: /Powrot do listy/ }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("refetches when the id prop changes", async () => {
    mockFetch.mockImplementation(async (id: number) =>
      makeProduct({ id, name: `Product ${id}` }),
    );

    const { rerender } = render(<App id={1} />);
    expect(await screen.findByText("Product 1")).toBeInTheDocument();

    rerender(<App id={2} />);
    expect(await screen.findByText("Product 2")).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledWith(2);
  });
});
