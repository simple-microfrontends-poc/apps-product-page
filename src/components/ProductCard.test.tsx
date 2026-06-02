import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProductCard from "./ProductCard";
import { ProductOut } from "../lib/api";

function makeProduct(overrides: Partial<ProductOut> = {}): ProductOut {
  return {
    id: 1,
    sku: "A1",
    name: "Widget",
    gtin: "111",
    category: "Tools",
    description: "A handy widget",
    images: [],
    attributes: [],
    ...overrides,
  };
}

describe("ProductCard", () => {
  it("renders the core fields", () => {
    render(<ProductCard product={makeProduct()} />);

    expect(screen.getByText("Widget")).toBeInTheDocument();
    expect(screen.getByText("A1")).toBeInTheDocument();
    expect(screen.getByText("111")).toBeInTheDocument();
    expect(screen.getByText("Tools")).toBeInTheDocument();
    expect(screen.getByText("A handy widget")).toBeInTheDocument();
  });

  it("renders one img per image and shows the Zdjecia section", () => {
    // alt="" makes images presentational (no "img" role), so query by tag.
    const { container } = render(
      <ProductCard
        product={makeProduct({ images: ["/a.jpg", "/b.jpg"] })}
      />,
    );

    expect(screen.getByText("Zdjecia")).toBeInTheDocument();
    const imgs = Array.from(container.querySelectorAll("img"));
    expect(imgs).toHaveLength(2);
    expect(imgs.map((i) => i.getAttribute("src"))).toEqual(["/a.jpg", "/b.jpg"]);
  });

  it("omits the Zdjecia section when there are no images", () => {
    const { container } = render(
      <ProductCard product={makeProduct({ images: [] })} />,
    );

    expect(screen.queryByText("Zdjecia")).not.toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });

  it("renders attributes as name/value pairs", () => {
    render(
      <ProductCard
        product={makeProduct({
          attributes: [
            { name: "Kolor", value: "Czerwony" },
            { name: "Waga", value: "1kg" },
          ],
        })}
      />,
    );

    expect(screen.getByText("Atrybuty")).toBeInTheDocument();
    expect(screen.getByText("Kolor")).toBeInTheDocument();
    expect(screen.getByText("Czerwony")).toBeInTheDocument();
    expect(screen.getByText("Waga")).toBeInTheDocument();
    expect(screen.getByText("1kg")).toBeInTheDocument();
  });

  it("omits the Atrybuty section when there are no attributes", () => {
    render(<ProductCard product={makeProduct({ attributes: [] })} />);

    expect(screen.queryByText("Atrybuty")).not.toBeInTheDocument();
  });

  it("renders the category breadcrumb when categoryPath is provided", () => {
    render(
      <ProductCard
        product={makeProduct({ category: "1111" })}
        categoryPath={[
          { id: 1, name: "Elektronika" },
          { id: 11, name: "Smartfony i akcesoria" },
        ]}
      />,
    );

    expect(screen.getByText("Elektronika")).toBeInTheDocument();
    expect(screen.getByText("Smartfony i akcesoria")).toBeInTheDocument();
    // raw id is not shown when the breadcrumb is available
    expect(screen.queryByText("1111")).not.toBeInTheDocument();
  });

  it("falls back to the raw category id when no breadcrumb is given", () => {
    render(<ProductCard product={makeProduct({ category: "1111" })} />);

    expect(screen.getByText("1111")).toBeInTheDocument();
  });

  it("renders a 'Zmień' button when onEditCategory is given and calls it", async () => {
    const onEditCategory = vi.fn();
    const user = userEvent.setup();
    render(<ProductCard product={makeProduct()} onEditCategory={onEditCategory} />);

    await user.click(screen.getByRole("button", { name: "Zmień" }));
    expect(onEditCategory).toHaveBeenCalledTimes(1);
  });

  it("omits the 'Zmień' button when onEditCategory is absent", () => {
    render(<ProductCard product={makeProduct()} />);

    expect(screen.queryByRole("button", { name: "Zmień" })).not.toBeInTheDocument();
  });
});
