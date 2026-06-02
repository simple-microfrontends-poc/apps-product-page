import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductOut } from "./lib/api";

vi.mock("./lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./lib/api")>();
  return {
    ...actual,
    fetchProductById: vi.fn(),
    fetchCategoryPath: vi.fn(),
    updateProductCategory: vi.fn(),
  };
});

import App from "./App";
import {
  fetchProductById,
  fetchCategoryPath,
  updateProductCategory,
} from "./lib/api";

const mockFetch = vi.mocked(fetchProductById);
const mockCategoryPath = vi.mocked(fetchCategoryPath);
const mockUpdate = vi.mocked(updateProductCategory);

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

beforeEach(() => {
  mockFetch.mockReset();
  mockUpdate.mockReset();
  mockCategoryPath.mockReset();
  mockCategoryPath.mockResolvedValue([]);
});

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

describe("product-page App — category breadcrumb", () => {
  it("fetches and renders the breadcrumb for the product's category", async () => {
    mockFetch.mockResolvedValue(makeProduct({ category: "1111" }));
    mockCategoryPath.mockResolvedValue([
      { id: 1, name: "Elektronika" },
      { id: 11, name: "Smartfony i akcesoria" },
      { id: 111, name: "Etui na telefony" },
      { id: 1111, name: "Etui silikonowe" },
    ]);

    render(<App id={1} />);

    expect(await screen.findByText("Etui silikonowe")).toBeInTheDocument();
    expect(screen.getByText("Elektronika")).toBeInTheDocument();
    expect(mockCategoryPath).toHaveBeenCalledWith("1111");
  });
});

describe("product-page App — change category", () => {
  it("opens the category picker when 'Zmień' is clicked", async () => {
    mockFetch.mockResolvedValue(makeProduct());
    const user = userEvent.setup();

    render(<App id={1} />);
    await screen.findByText("Widget");

    await user.click(screen.getByRole("button", { name: "Zmień" }));

    expect(await screen.findByTestId("category-picker-stub")).toBeInTheDocument();
  });

  it("passes the product's category to the picker as categoryId", async () => {
    mockFetch.mockResolvedValue(makeProduct({ category: "1151" }));
    const user = userEvent.setup();

    render(<App id={1} />);
    await screen.findByText("Widget");

    await user.click(screen.getByRole("button", { name: "Zmień" }));
    const picker = await screen.findByTestId("category-picker-stub");

    expect(within(picker).getByText("cat:1151")).toBeInTheDocument();
  });

  it("optimistically applies the new category, PATCHes, then reconciles via GET", async () => {
    // Initial load, then the reconcile GET after the PATCH (STUB_SELECTION.id = 5).
    mockFetch
      .mockResolvedValueOnce(makeProduct({ category: "Tools" }))
      .mockResolvedValueOnce(makeProduct({ category: "5" }));
    mockUpdate.mockResolvedValue(makeProduct({ category: "5" }));
    const user = userEvent.setup();

    render(<App id={1} />);
    expect(await screen.findByText("Tools")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Zmień" }));
    const picker = await screen.findByTestId("category-picker-stub");
    await user.click(within(picker).getByRole("button", { name: "Zmień kategorię" }));

    expect(await screen.findByText("5")).toBeInTheDocument();
    expect(mockUpdate).toHaveBeenCalledWith(1, "5");
    // fetchProductById fired twice: initial load + reconcile after the PATCH.
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("reverts the optimistic category when the PATCH fails", async () => {
    mockFetch.mockResolvedValue(makeProduct({ category: "Tools" }));
    mockUpdate.mockRejectedValue(new Error("HTTP 422: Unprocessable Entity"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();

    render(<App id={1} />);
    await screen.findByText("Tools");

    await user.click(screen.getByRole("button", { name: "Zmień" }));
    const picker = await screen.findByTestId("category-picker-stub");
    await user.click(within(picker).getByRole("button", { name: "Zmień kategorię" }));

    // Optimistic flips to "5", then reverts to the original after the failure.
    await waitFor(() => expect(screen.getByText("Tools")).toBeInTheDocument());
    expect(screen.queryByText("5")).not.toBeInTheDocument();
    // No reconcile GET on failure — only the initial load.
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("closes the picker on Escape", async () => {
    mockFetch.mockResolvedValue(makeProduct());
    const user = userEvent.setup();

    render(<App id={1} />);
    await screen.findByText("Widget");

    await user.click(screen.getByRole("button", { name: "Zmień" }));
    expect(await screen.findByTestId("category-picker-stub")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("category-picker-stub")).not.toBeInTheDocument();
  });
});
