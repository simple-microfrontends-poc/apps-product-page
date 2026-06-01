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
export declare function fetchProductBySku(sku: string): Promise<ProductOut>;
//# sourceMappingURL=api.d.ts.map