// 앱이 한 번 만들어 화면에 나눠 주는 것들(API 클라이언트·QueryClient·세션 만료 안내).
// 클라이언트는 createApp이 한 번만 만들고(감사 결함 F8), 화면은 이 문맥으로 받는다 — 화면이 클라이언트를 만들지 않는다.
import type { QueryClient } from "@tanstack/react-query";
import { createContext, useContext } from "react";
import type { ApiClient } from "@/api/client";
import { createExternalStore, type ExternalStore, useExternalStore } from "@/lib/external-store";

/**
 * 세션 만료 안내. 이 탭에서 로그인돼 있던 세션이 갱신 401로 끝났을 때만 켠다(S0 결정 — 첫 방문·새로고침에는 켜지 않는다).
 * 로그인 화면이 읽고, 새로 로그인하거나 직접 로그아웃하면 끈다.
 */
export interface SessionNotice {
  store: ExternalStore<boolean>;
  markExpired(): void;
  clear(): void;
}

export function createSessionNotice(): SessionNotice {
  let expired = false;
  const store = createExternalStore(() => expired);
  const set = (value: boolean) => {
    if (expired === value) return;
    expired = value;
    store.notify();
  };
  return { store, markExpired: () => set(true), clear: () => set(false) };
}

export interface AppServices {
  client: ApiClient;
  queryClient: QueryClient;
  sessionNotice: SessionNotice;
}

export const ServicesContext = createContext<AppServices | null>(null);

export function useServices(): AppServices {
  const services = useContext(ServicesContext);
  if (!services) throw new Error("ServicesContext가 없습니다. <Providers> 안에서 그려야 합니다.");
  return services;
}

export function useApiClient(): ApiClient {
  return useServices().client;
}

export function useSessionExpiredNotice(): boolean {
  return useExternalStore(useServices().sessionNotice.store);
}
