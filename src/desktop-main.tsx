import React from "react";
import { createRoot } from "react-dom/client";
import { KairoAgentApp } from "./components/kairo-agent-app";
import "./styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Kairo desktop root element was not found.");
}

createRoot(root).render(
  <React.StrictMode>
    <KairoAgentApp />
  </React.StrictMode>,
);
