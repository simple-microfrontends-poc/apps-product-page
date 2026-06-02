import React, { useEffect, useState } from "react";
import "./styles/index.css";
import { fetchProductById, ProductOut } from "./lib/api";
import ProductCard from "./components/ProductCard";

export interface ProductPageProps {
  /** ID of the product to display. Provided by the host on navigation. */
  id?: number;
  /** Optional handler to return to the previous view (e.g. the product list). */
  onBack?: () => void;
}

function App({ id, onBack }: ProductPageProps) {
  const [product, setProduct] = useState<ProductOut | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id == null) {
      setProduct(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchProductById(id)
      .then((data) => {
        if (!cancelled) setProduct(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Nie udało się załadować produktu");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="max-w-3xl">
      {onBack && (
        <button
          onClick={onBack}
          className="mb-4 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          &larr; Powrot do listy
        </button>
      )}

      {id == null ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-400">
          Wybierz produkt z listy, aby zobaczyć jego kartę.
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full" />
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg border border-red-200 p-6">
          <h3 className="text-red-700 font-medium">Nie znaleziono produktu</h3>
          <p className="text-red-600 text-sm mt-1">
            ID <span className="font-mono">{id}</span> — {error}
          </p>
        </div>
      ) : product ? (
        <ProductCard product={product} />
      ) : null}
    </div>
  );
}

export default App;
