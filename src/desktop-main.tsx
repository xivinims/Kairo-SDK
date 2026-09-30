import React from "react";
import { createRoot } from "react-dom/client";
import { ZenoAgentApp } from "./components/zeno-agent-app";
import "./styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Zeno desktop root element was not found.");
}

createRoot(root).render(
  <React.StrictMode>
    <ZenoAgentApp />
  </React.StrictMode>,
);
