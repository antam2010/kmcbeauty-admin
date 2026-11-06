import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConfirmDialogHost, ThemeProvider, Toaster } from "@/ui-core";
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
      {/* 명령형 API(toast·showConfirm)의 Host는 앱에 하나씩만 둔다(design.md §5.1). */}
      <Toaster />
      <ConfirmDialogHost />
    </ThemeProvider>
  </StrictMode>,
);
