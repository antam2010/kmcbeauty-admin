import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/ui-core";
import { PreviewPage } from "./preview/PreviewPage";
import "./styles/index.css";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element #root was not found in index.html");
}

createRoot(container).render(
  <StrictMode>
    <ThemeProvider>
      <PreviewPage />
    </ThemeProvider>
  </StrictMode>,
);
