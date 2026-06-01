import "./styles/index.css";
export interface ProductPageProps {
    /** SKU of the product to display. Provided by the host on navigation. */
    sku?: string;
    /** Optional handler to return to the previous view (e.g. the product list). */
    onBack?: () => void;
}
declare function App({ sku, onBack }: ProductPageProps): import("react/jsx-runtime").JSX.Element;
export default App;
//# sourceMappingURL=App.d.ts.map