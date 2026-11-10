// 앱 전체를 감싸는 공급자: 앱 서비스 문맥 + QueryClient + 테마. 명령형 API(toast·showConfirm)의 Host는 하나씩만 둔다.
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ConfirmDialogHost, ThemeProvider, Toaster } from "@/ui-core";
import { type AppServices, ServicesContext } from "./services";

export function Providers({ services, children }: { services: AppServices; children: ReactNode }) {
  return (
    <ServicesContext value={services}>
      <QueryClientProvider client={services.queryClient}>
        <ThemeProvider>
          {children}
          <Toaster />
          <ConfirmDialogHost />
        </ThemeProvider>
      </QueryClientProvider>
    </ServicesContext>
  );
}
