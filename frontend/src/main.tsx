import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import App from "./App";
import { ApplicationProvider } from "./hooks/app/hook";

const container = document.getElementById("root");

const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <ApplicationProvider>
      <App />
    </ApplicationProvider>
  </React.StrictMode>,
);
