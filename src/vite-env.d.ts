/// <reference types="vite/client" />

// 앱이 읽는 env 값. 코드에서는 src/app/env.ts만 이 값을 읽는다(plan.md §B.10).
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}
