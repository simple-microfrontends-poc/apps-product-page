import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ProductCard from "./ProductCard";
import { ProductOut } from "../lib/api";

function makeProduct(overrides: Partial<ProductOut> = {}): ProductOut {
  return {
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
});
