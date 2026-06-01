const API_BASE = "http://localhost:8000";

export interface Attribute {
  name: string;
  value: string;
}

export interface ProductOut {
  sku: string;
  name: string;
  images: string[];
  description: string;
  category: string;
  attributes: Attribute[];
  gtin: string;
}

export async function fetchProductBySku(sku: string): Promise<ProductOut> {
  const res = await fetch(`${API_BASE}/products/by-sku/${encodeURIComponent(sku)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}
