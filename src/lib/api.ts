const API_BASE = "http://localhost:8000";

export interface Attribute {
  name: string;
  value: string;
}

export interface ProductOut {
  id: number;
  sku: string;
  name: string;
  images: string[];
  description: string;
  category: string;
  attributes: Attribute[];
  gtin: string;
}

export interface CategoryPathItem {
  id: number;
  name: string;
}

export async function fetchProductById(id: number): Promise<ProductOut> {
  const res = await fetch(`${API_BASE}/products/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

/** Full category breadcrumb (root first) for a category id. */
export async function fetchCategoryPath(
  category: string
): Promise<CategoryPathItem[]> {
  const res = await fetch(`${API_BASE}/categories/${category}/paths`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

/** Update a product's category. `category` is the target category id as a string. */
export async function updateProductCategory(
  id: number,
  category: string
): Promise<ProductOut> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}
