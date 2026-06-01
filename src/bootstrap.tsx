import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Standalone demo (port 3004) — host normally provides the sku via props.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <div className="p-6">
      <App sku="ELG-ETC-SIL-001-BLK" />
    </div>
  </React.StrictMode>
);
