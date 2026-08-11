import React, { useState } from "react";
import POSBilling from "./pages/modules/POSBilling";
import Inventory from "./pages/modules/Inventory";

export default function App() {
  const [page, setPage] = useState<"pos" | "inventory">("pos");

  return (
    <div style={{ padding: 20 }}>
      <h1>Nexa ERP (Phase 1)</h1>

      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setPage("pos")}>POS</button>
        <button onClick={() => setPage("inventory")}>Inventory</button>
      </div>

      {page === "pos" && <POSBilling />}
      {page === "inventory" && <Inventory />}
    </div>
  );
}
