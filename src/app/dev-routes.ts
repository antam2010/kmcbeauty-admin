// 개발 서버에서만 등록하는 경로(plan.md §B.9, design.md §3.1·§14).
// 판단은 함수 인자가 아니라 이 모듈 범위의 식에서 한다. 운영 빌드에서 import.meta.env.DEV가 false로 바뀌면
// import()가 죽은 코드가 되어 미리보기 청크가 생기지 않는다(QG-18이 dist의 JS로 확인한다).
// 앱 코드에서 import.meta.env를 읽는 곳은 src/app/env.ts뿐이고, 이 DEV 판단만 예외다(design.md §2).
import type { RouteObject } from "react-router";

export const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [{ path: "/dev/preview", lazy: () => import("@/preview/route") }]
  : [];
