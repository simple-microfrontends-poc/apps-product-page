import React, { useEffect, useState } from "react";
import "./styles/index.css";
import {
  fetchProductById,
  fetchCategoryPath,
  updateProductCategory,
  ProductOut,
  CategoryPathItem,
} from "./lib/api";
import type {
  CategorySelection,
  CategoryPickerProps,
} from "categoryPicker/CategoryPicker";
import ProductCard from "./components/ProductCard";

export interface ProductPageProps {
  /** ID of the product to display. Provided by the host on navigation. */
  id?: number;
  /** Optional handler to return to the previous view (e.g. the product list). */
  onBack?: () => void;
}

const CategoryPicker = React.lazy(
  () => import("categoryPicker/CategoryPicker")
) as React.LazyExoticComponent<React.ComponentType<CategoryPickerProps>>;

class PickerErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="bg-white rounded-lg border border-red-200 p-6">
          <h3 className="text-red-700 font-medium">Picker kategorii niedostępny</h3>
          <p className="text-red-600 text-sm mt-1">{this.state.error.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function CategoryPickerModal({
  onSelect,
  onClose,
}: {
  onSelect: (selection: CategorySelection) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <PickerErrorBoundary>
          <React.Suspense
            fallback={
              <div className="bg-white rounded-lg border border-gray-200 p-12 flex justify-center">
                <div className="animate-spin w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full" />
              </div>
            }
          >
            <CategoryPicker
              selectionMode="leaf"
              confirmLabel="Zmień kategorię"
              title="Wybierz nową kategorię"
              onSelect={onSelect}
              onCancel={onClose}
            />
          </React.Suspense>
        </PickerErrorBoundary>
      </div>
    </div>
  );
}

function App({ id, onBack }: ProductPageProps) {
  const [product, setProduct] = useState<ProductOut | null>(null);
  const [categoryPath, setCategoryPath] = useState<CategoryPathItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

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

  // Breadcrumb follows the product's current category — refetches on change
  // (incl. the optimistic update / revert below).
  useEffect(() => {
    const category = product?.category;
    if (!category) {
      setCategoryPath([]);
      return;
    }
    let cancelled = false;
    fetchCategoryPath(category)
      .then((path) => {
        if (!cancelled) setCategoryPath(path);
      })
      .catch(() => {
        if (!cancelled) setCategoryPath([]);
      });
    return () => {
      cancelled = true;
    };
  }, [product?.category]);

  const handleCategorySelect = async (selection: CategorySelection) => {
    setPickerOpen(false);
    if (id == null || !product) return;

    const previous = product;
    const nextCategory = String(selection.id);
    if (nextCategory === previous.category) return;

    // Optimistic: show the new category immediately.
    setProduct({ ...previous, category: nextCategory });
    try {
      await updateProductCategory(id, nextCategory);
      // Reconcile with the server's truth (corrects the optimistic guess).
      const fresh = await fetchProductById(id);
      setProduct(fresh);
    } catch (e) {
      // Revert on failure.
      setProduct(previous);
      console.error("Nie udało się zmienić kategorii:", e);
    }
  };

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
        <ProductCard
          product={product}
          categoryPath={categoryPath}
          onEditCategory={() => setPickerOpen(true)}
        />
      ) : null}

      {pickerOpen && (
        <CategoryPickerModal
          onSelect={handleCategorySelect}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
