import React from "react";
import { ProductOut, CategoryPathItem } from "../lib/api";

function ProductCard({
  product,
  categoryPath,
  onEditCategory,
}: {
  product: ProductOut;
  categoryPath?: CategoryPathItem[];
  onEditCategory?: () => void;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-1">{product.name}</h2>
      <div className="flex gap-4 mb-2 text-sm">
        <span className="text-gray-500">SKU: <span className="font-mono text-gray-700">{product.sku}</span></span>
        <span className="text-gray-500">GTIN: <span className="font-mono text-gray-700">{product.gtin}</span></span>
      </div>
      <div className="mb-4 text-sm">
        <span className="text-gray-500">
          Kategoria:{" "}
          {categoryPath && categoryPath.length > 0 ? (
            <span className="text-gray-700">
              {categoryPath.map((c, i) => (
                <React.Fragment key={c.id}>
                  {i > 0 && <span className="text-gray-300"> / </span>}
                  <span>{c.name}</span>
                </React.Fragment>
              ))}
            </span>
          ) : (
            <span className="text-gray-700">{product.category}</span>
          )}
          {onEditCategory && (
            <button
              type="button"
              onClick={onEditCategory}
              className="ml-2 text-indigo-600 hover:text-indigo-800 underline"
            >
              Zmień
            </button>
          )}
        </span>
      </div>

      <p className="text-gray-600 text-sm mb-4">{product.description}</p>

      {product.images.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Zdjecia</h3>
          <div className="flex gap-2">
            {product.images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt=""
                className="w-20 h-20 object-cover rounded-lg border border-gray-200"
              />
            ))}
          </div>
        </div>
      )}

      {product.attributes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Atrybuty</h3>
          <div className="grid grid-cols-2 gap-2">
            {product.attributes.map((attr, i) => (
              <div
                key={i}
                className="flex justify-between px-3 py-2 bg-gray-50 rounded text-sm"
              >
                <span className="text-gray-500">{attr.name}</span>
                <span className="text-gray-800 font-medium">{attr.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductCard;
