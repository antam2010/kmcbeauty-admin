import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { App, createApp } from "./app/create-app";
import { devRoutes } from "./app/dev-routes";
import { API_BASE_URL } from "./app/env";
import "./styles/index.css";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element #root was not found in index.html");
}

// 앱(API 클라이언트·QueryClient·라우터)은 모듈 범위에서 한 번만 만든다.
// StrictMode가 렌더링을 두 번 해도 다시 만들지 않는다(감사 결함 F8 — configureSession은 모듈 전역 설정을 덮어쓴다).
const app = createApp({
  baseUrl: API_BASE_URL,
  devRoutes,
  createRouter: (routes) => createBrowserRouter(routes),
});

createRoot(container).render(
  <StrictMode>
    <App app={app} />
  </StrictMode>,
);
