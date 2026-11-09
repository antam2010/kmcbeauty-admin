# SPEC-UI-002 구현 설계

| 항목 | 내용 |
|---|---|
| 역할 | 이 SPEC의 구현 구조를 정한다: 디렉터리, 경로와 보호, 데이터·인증 흐름, 쿼리 키, 오류 정규화, 예약 상태 모듈, 폼, 캘린더, CSV, 빌드 플러그인, 배포 스크립트, 개발 프록시, 미리보기 경로, ui-core 변경, 시험 장치, MX 태그 |
| 기준 | spec.md 0.3.0, plan.md(결정 지점 1 승인본 + 0.2.0 사전 검토 반영 + 0.3.0 plan-auditor 1회차 반영), interview.md 1~4회차 |
| 시각 값 | 색·크기·간격·문구는 `.moai/design/system.md`(1.2.0으로 개정 — plan.md §E)를 따른다. 이 문서는 값을 다시 적지 않는다. 시험 기대값은 acceptance.md §3이 정본이다 |
| 관련 | `spec.md`(요구사항), `plan.md`(기술 접근 §B, 마일스톤 §F, MX 계획 §K, 운영 연결 §P), `research.md`(백엔드 계약 §2, 배포 서버 §2.9), `acceptance.md`(시나리오·기대값 표) |

## 1. 설계 원칙

1. **화면은 데이터를 모른다, 데이터 계층은 라우터를 모른다** — `src/api`는 React와 라우터를 가져오지 않는다. 이동이 필요한 사건(세션 만료, 매장 미선택)은 앱 시작 때 주입한 처리기로 알린다. 그래서 API 계층을 단독으로 시험할 수 있다.
2. **서버 상태는 한 곳** — 서버에서 온 데이터는 TanStack Query만 가진다. 토큰은 작은 외부 저장소, UI 상태(사이드바 접힘)는 `localStorage` 훅이 맡는다. zustand 같은 전역 저장소는 두지 않는다.
3. **계약은 생성 타입으로** — 요청·응답 모양은 `src/api/schema.d.ts`에서 온다. 손으로 쓴 타입은 오류 정규화처럼 OpenAPI에 없는 부분에만 쓴다.
4. **도메인 규칙은 순수 함수로** — 상태 전환, 이벤트 변환, 범위 계산, CSV, KST 날짜는 React 밖의 순수 함수로 두고 표 시험으로 고정한다.
5. **ui-core는 범용 부품만** — 새 컴포넌트 4개는 도메인을 모른다. 예약 상태는 `src/features/reservations/status.ts`에만 있다(C8).
6. **보안 경계는 좁고 명시적으로** — 쿠키 전송은 인증 요청 3개, 토큰은 메모리, env 읽기는 허용 목록, CSP 해시는 빌드가 계산한다.

## 2. 디렉터리 구성

```text
openapi/openapi.json            백엔드 스냅숏(생성물, 사람이 고치지 않음)
scripts/export-openapi.mjs      옆 폴더 백엔드 .venv로 스냅숏 내보내기(이 저장소에만 씀)
scripts/check-dist.mjs          빌드 산출물 검사(QG-17 CSP 해시, QG-18 미리보기 없음)
vite-plugins.ts                 envCheckPlugin(운영 빌드 env 검사), cspPlugin(운영 빌드 CSP)
.env.example                    DEV_API_PROXY_TARGET 개발 기본값
.env.production.example         공개 API 주소 값 VITE_API_BASE_URL=https://api-beauty.dongri.kr + SCP_* 이름만
src/
├─ main.tsx                     createRoot → <Providers><RouterProvider/></Providers>
├─ app/
│  ├─ routes.tsx                createRoutes({ devRoutes })(앱·시험 공용), createAppRouter
│  ├─ dev-routes.ts             모듈 범위 import.meta.env.DEV로 정한 개발 전용 경로 목록
│  ├─ loaders.ts                requireSession, requireShop, redirectIfSession
│  ├─ providers.tsx             QueryClientProvider + ThemeProvider + Toaster + ConfirmDialogHost(각 1개)
│  ├─ env.ts                    import.meta.env 읽기의 유일한 자리(apiBaseUrl — 개발 /api, 운영 VITE_API_BASE_URL. dev-routes.ts의 DEV 판단만 예외)
│  ├─ safe-next.ts              next 매개변수 검사
│  ├─ RouteError.tsx, NotFoundPage.tsx, PublicLayout.tsx
│  └─ shell/                    AppShell, TopBar, NavSidebar, AccountMenu, RouterLink, use-sidebar-state
├─ api/
│  ├─ schema.d.ts               openapi-typescript 생성물
│  ├─ client.ts                 createApiClient(baseUrl, fetch?, handlers)
│  ├─ session.ts                메모리 토큰 저장소, refreshSession, ensureSession, clearSession
│  ├─ errors.ts                 ApiError, normalizeError, 문구 표
│  ├─ query-client.ts           QueryClient 기본값(재시도·staleTime)
│  └─ query-keys.ts             쿼리 키 공장
├─ features/
│  ├─ auth/                     LoginPage, queries(login, logout, me)
│  ├─ shops/                    ShopSelectPage, queries(list, selected, select)
│  ├─ customers/                CustomersPage, CustomerFormModal, export-csv, queries
│  ├─ treatment-menus/          TreatmentMenusPage, MenuFormModal, DetailFormModal, queries
│  ├─ treatments/               TreatmentHistoryPage, queries
│  ├─ reservations/             status, StatusBadge, StatusChangeControl, ReservationCalendarPage,
│  │                            calendar-events, calendar-theme.css, ReservationFormModal, queries
│  └─ legal/                    TermsPage, PrivacyPage(예전 문구)
├─ lib/                         form, csv, download, kst-date, money, external-store,
│                               use-debounced-value, use-media-query, use-persisted-state
├─ ui-core/                     (SPEC-UI-001) + date-range-picker, number-input, drawer, popover,
│                               internal/{class-names, external-store, use-restore-focus}.ts
├─ preview/                     (SPEC-UI-001, 개발 전용 경로로만 열림) + route.tsx(경로 모듈)
└─ test/                        setup, msw/{server, fixtures, handlers/*}, render-route.tsx, 잠금 시험
```

- 앱 코드는 ui-core를 `@/ui-core`로만 가져온다. `@/ui-core/<파일>`과 `@/ui-core/internal/*`는 design-rules 시험이 막는다(AC-UI-002-04).
- `src/lib/external-store.ts`와 `src/ui-core/internal/external-store.ts`는 같은 패턴의 두 사본이다. 앱이 ui-core 내부를 가져올 수 없어서 생긴 의도된 중복이며, 둘 다 50줄 안쪽이다.

## 3. 경로와 보호

### 3.1 경로 트리

```text
createBrowserRouter([
  { id: "root", element: <RootLayout/>, errorElement: <RouteError/>, children: [
    { element: <PublicLayout/>, children: [
      { path: "/login", loader: redirectIfSession, element: <LoginPage/> },
      { path: "/terms-of-service", element: <TermsPage/> },
      { path: "/privacy-policy", element: <PrivacyPage/> },
      { path: "/shops", loader: requireSession, element: <ShopSelectPage/> },
    ]},
    { loader: requireSession + requireShop, element: <AppShell/>, children: [
      { index: true, loader: () => redirect("/reservations") },
      { path: "/reservations", element: <ReservationCalendarPage/>, handle: { wide: true } },
      { path: "/customers", element: <CustomersPage/> },
      { path: "/treatment-menus", element: <TreatmentMenusPage/> },
      { path: "/treatments", element: <TreatmentHistoryPage/> },
    ]},
    ...devRoutes,   // dev-routes.ts: import.meta.env.DEV ? [{ path: "/dev/preview", lazy: () => import("@/preview/route") }] : []
    { path: "*", element: <PublicLayout><NotFoundPage/></PublicLayout> },
  ]},
])
```

- 개발 전용 경로의 판단은 함수 인자가 아니라 `src/app/dev-routes.ts`의 **모듈 범위** 식 `import.meta.env.DEV ? [...] : []`에서 한다. 운영 빌드에서 상수가 `false`로 바뀌면 `import()`가 죽은 코드가 되어 청크가 생기지 않는다. 인자로 넘기면 도달 가능한 동적 가져오기가 남아 Rolldown이 미리보기 청크를 만들 수 있다 **(추론)**. 경로 함수 `createRoutes({ devRoutes })`는 목록만 받는다. 앱은 `devRoutes`를, 운영 경로 시험은 `[]`를 넘긴다(AC-UI-002-13). 빌드 결과는 QG-18의 JS 검사로 확인한다.
- 시험은 같은 경로 함수로 `createMemoryRouter`를 만든다(`src/test/render-route.tsx`).
- 데이터 모드 API 이름(`createBrowserRouter`, `RouterProvider`, `redirect`, `lazy`)은 react-router 8에서 M4 사전 점검 때 타입 검사로 확인한다. 막히면 7로 돌아가지 않고 blocker로 보고한다(C5, plan.md §C).

### 3.2 loader

| loader | 하는 일 | 결과 |
|---|---|---|
| `requireSession` | `ensureSession()` — 메모리 토큰이 없으면 쿠키 갱신을 한 번 시도 | `true` 통과 / `false` → `redirect("/login?next=" + encodeURIComponent(현재 경로 + 쿼리))` / 네트워크 오류 → throw(경로 오류 화면 "다시 시도") |
| `requireShop` | `queryClient.ensureQueryData(selectedShopQuery)` | 매장 있음 통과 / `SHOP_NOT_SELECTED` → `redirect("/shops?next=…")` |
| `redirectIfSession` | 세션이 이미 있거나 복원되면 | `redirect(safeNext(next, location.origin) ?? "/reservations")` |

- loader는 인증·매장 확인과 `ensureQueryData`만 한다. 화면 데이터는 화면의 훅이 가져온다(역할 겹침 방지).
- `safeNext(value, origin)`(`src/app/safe-next.ts`): 입력은 `URLSearchParams.get("next")`가 한 번 디코딩한 값이며 더 디코딩하지 않는다. 값이 비었거나 `\`·C0 제어 문자(U+0000~U+001F)·공백 문자(`\s`)를 담으면 `null`, `new URL(value, origin).origin !== origin`(해석 오류 포함)이면 `null`, `/`로 시작하지 않거나 `//`로 시작하면 `null`, 그 밖에는 값 그대로. 세 사용처(이 loader, 로그인 제출, 매장 선택)가 같은 함수를 쓰고 `null`이면 `/reservations`로 간다. 정본 표본은 acceptance.md §3.3.

### 3.3 링크 어댑터와 셸

- `RouterLink`는 ui-core `LinkComponentProps`(`to`, `className`, `aria-current`, `children`)를 받아 react-router `Link`를 그린다. Sidebar에는 `currentPath = useLocation().pathname`과 접두사 일치 `isActive`를 넘긴다.
- `use-sidebar-state`: `useMediaQuery("(min-width: 1024px)")`, `useMediaQuery("(min-width: 768px)")`로 세 구간을 나눈다. 1024px 이상만 `usePersistedState("kmc-admin-sidebar", "expanded")`를 읽고 쓴다. 768~1023px은 진입할 때마다 `collapsed`로 시작하는 지역 상태다. 768px 미만은 Drawer 열림 상태만 있고, 경로가 바뀌면 닫는다.
- 상단바 오늘 날짜는 `Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short" })` 결과를 "11월 9일 (월)" 꼴로 맞춘다.

## 4. 데이터·인증 흐름

### 4.1 클라이언트와 미들웨어

```text
createApiClient({ baseUrl, fetch, onSessionExpired, onShopNotSelected })
  └─ openapi-fetch createClient({ baseUrl, fetch })
       .use(authMiddleware)      onRequest: 토큰 → Authorization: Bearer, 재시도용 요청 복제 보관
                                 credentials: 인증 3개 경로만 "include", 나머지 "same-origin"
       .use(retryMiddleware)     onResponse: 401 처리(아래)
       .use(shopMiddleware)      onResponse: 404 + detail.code === "SHOP_NOT_SELECTED" → onShopNotSelected()
```

- 기준 주소: 개발 서버 `/api`(프록시), 운영 `env.apiBaseUrl`, 시험은 절대 주소 `http://api.test`(Node fetch는 상대 주소를 받지 않는다).
- openapi-fetch 미들웨어가 응답을 새 응답으로 바꿔치기할 수 있는지는 M2 사전 점검에서 확인한다. 안 되면 같은 규칙을 `fetch` 감싸개(`fetch` 옵션으로 주입)에서 구현한다. 어느 쪽이든 아래 흐름은 같다.

### 4.2 401 처리와 single-flight 갱신

```text
요청 → 401?
  ├─ 경로가 /auth/* → 그대로 오류(갱신 안 함)
  ├─ 이미 재시도한 요청(표시 있음) → 그대로 오류(두 번째 갱신 없음)
  └─ refreshSession()
        ├─ inflight Promise 있음 → 그것을 기다림
        └─ 없음 → inflight = (navigator.locks?.request("kmc-admin-refresh", doRefresh) ?? doRefresh())
                   doRefresh: 맨 fetch POST {base}/auth/refresh, 본문 없음, credentials "include"
                     200 → setAccessToken(body.access_token), body.refresh_token은 읽지 않고 버림 → true
                     401 → clearSession() → false
                     403·429·5xx → throw ApiError(kind "http", 그 status) — 세션 유지
                     네트워크 오류 → throw ApiError(kind "network") — 세션 유지
                   finally: inflight = null   ← @MX:WARN 대상(지우는 시점을 바꾸면 갱신이 겹친다)
        true  → 보관한 복제 요청에 새 토큰을 붙여 한 번 다시 보냄(재시도 표시)
        false → onSessionExpired() → queryClient.clear() → router.navigate("/login?next=…", 만료 표시)
        throw → 원래 요청을 그 ApiError로 끝냄(로그인 화면으로 보내지 않음)
```

- 갱신 요청은 미들웨어를 거치지 않는 맨 `fetch`라 재귀가 없다. `X-Refresh-Token` 헤더는 쓰지 않는다.
- 탭 잠금(`navigator.locks`)이 없는 환경에서는 탭 안 single-flight만 한다(acceptance.md EC-03). 뒤 탭은 앞 탭이 바꾼 쿠키로 갱신한다 **(추론 — 쿠키는 탭이 공유)**.
- 백엔드는 남은 수명이 절반 이하일 때 리프레시 토큰을 바꾸므로(research.md §2.2) 겹친 갱신 두 개는 한쪽 토큰을 무효로 만들 수 있다. single-flight가 이 경쟁을 막는다.

### 4.3 세션 저장소

```text
session.ts
  let accessToken: string | null = null
  let inflight: Promise<boolean> | null = null
  const store = createExternalStore(() => accessToken !== null)   구독용(로그인 상태)
  getAccessToken(), setAccessToken(t), clearSession(), refreshSession(), ensureSession()
  ensureSession(): accessToken 있음 → true, 없음 → refreshSession()
  __resetSessionForTest()   시험 전용(공개 내보내기 목록과 무관한 앱 모듈)
```

- 어떤 토큰도 Storage·IndexedDB·`document.cookie`에 쓰지 않는다. 로그인·갱신 응답에서 `access_token`만 꺼내고 본문 객체는 보관하지 않는다.
- 로그인: `POST /auth/login`(form-urlencoded `username`, `password`, `grant_type=password`, `credentials: "include"`) → `setAccessToken` → `GET /shops/selected`로 다음 경로 결정.
- 로그아웃: `POST /auth/logout`(`credentials: "include"`)을 보내되 기다리지 않는다(결과는 버린다) → 바로 `clearSession()` → `queryClient.clear()` → `/login`. `finally`로 기다리면 응답이 오지 않을 때 토큰이 메모리에 남으므로 쓰지 않는다(REQ-UI-002-007).
- "보관하지 않음"의 범위: `refresh_token`은 모듈 변수·쿼리 캐시·변경 캐시(`useMutation`의 `data` 포함)·React 상태 어디에도 남지 않는다. 로그인 변경의 `mutationFn`은 응답에서 `access_token`만 꺼내 `setAccessToken`에 넘기고 `undefined`를 돌려준다.

### 4.4 선택 매장

- 정본은 서버(Redis, 사용자 단위)다. 클라이언트는 `["shops","selected"]` 쿼리로 비춰 볼 뿐 따로 저장하지 않는다.
- 매장 선택: `POST /shops/selected {shop_id}` → 성공하면 `setQueryData(["shops","selected"], 고른 매장)` → `removeQueries({ queryKey: ["shop"] })` → `navigate(safeNext(next, location.origin) ?? "/reservations")`. 실패하면 캐시·경로를 그대로 두고 destructive Alert.
- `onShopNotSelected`: `removeQueries({ queryKey: ["shop"] })` → `router.navigate("/shops?next=<현재 경로>")`. 전체 새로고침을 하지 않는다.
- 다른 기기의 변경: `["shops","selected"]`는 `refetchOnWindowFocus: "always"`로 창 포커스 때 신선도와 상관없이 다시 가져온다(TanStack 기본값 `true`는 낡은 데이터만 다시 가져와 `staleTime` 30초 안의 포커스를 놓친다). 시험은 `focusManager.setFocused(false)` → `setFocused(true)`로 포커스를 준다. 셸이 이전 id와 새 id를 비교해 다르면 `removeQueries(["shop"])`와 토스트 "다른 기기에서 매장이 바뀌었어요."를 낸다.

## 5. 쿼리 키와 무효화

```text
qk.me()                                   ["me"]
qk.shops.list(page)                       ["shops", "list", { page }]
qk.shops.selected()                       ["shops", "selected"]
qk.customers.list(shopId, { q, page })    ["shop", shopId, "customers", "list", { q, page }]
qk.customers.groups(shopId)               ["shop", shopId, "customers", "groups"]
qk.menus.list(shopId, { q, page })        ["shop", shopId, "menus", "list", { q, page }]
qk.menus.details(shopId, menuId)          ["shop", shopId, "menus", menuId, "details"]
qk.treatments.range(shopId, start, end)   ["shop", shopId, "treatments", "range", start, end]
qk.treatments.list(shopId, filters)       ["shop", shopId, "treatments", "list", { from, to, status, q, page, order }]
```

- 매장 범위 데이터는 모두 `["shop", shopId, …]` 아래다. 매장을 바꾸면 `["shop"]` 접두사 하나로 지운다(`@MX:ANCHOR` — 모양을 바꾸면 다른 매장 데이터가 남는다).
- 변경 뒤 무효화는 접두사로 한다: 고객 변경 → `["shop", id, "customers"]`, 메뉴·세부 변경 → `["shop", id, "menus"]`, 예약 변경 → `["shop", id, "treatments"]`(캘린더 범위와 이력 목록을 함께 무효화).
- 모든 `queryFn`은 TanStack이 주는 `signal`을 openapi-fetch 호출의 `signal`로 넘긴다. 키가 바뀌어 이전 쿼리가 관찰자를 잃으면 요청이 취소된다. 목록 화면은 `placeholderData: keepPreviousData`로 깜빡임을 줄인다.
- 기본값: `staleTime` 30초. `queries.retry(count, error)`: `ApiError`의 400~499와 `aborted`는 `false`, 그 밖은 `count < 2`. `mutations.retry: 0`. 401 뒤 한 번 재전송은 미들웨어(§4.2)의 일이라 이 정책 밖이다. 매장 범위 키 공장 6개의 정본 표는 acceptance.md §3.11.

## 6. 오류 정규화

```text
ApiError extends Error {
  status: number            0이면 응답 없음(네트워크·취소)
  kind: "http" | "validation" | "network" | "aborted"
  code?: string             detail.code
  message: string           화면 문구(결정 순서: 앱 코드 표 → detail.detail → 상태 코드 문구)
  hint?: string             detail.hint
  fieldErrors?: Record<string, string>   422만, 키 = body를 뺀 loc을 "."으로 이은 경로
}
normalizeError(input: Response | unknown, body?: unknown): ApiError
```

- 응답 본문은 JSON 파싱이 실패하면(HTML, 글자) 본문 없음으로 본다.
- 상태 코드 문구와 앱 코드 표는 `errors.ts`의 상수 하나에 모으고 acceptance.md §3.2와 같은 글자로 둔다(정본 순서: acceptance.md §3.2 → system.md §11 → 코드). 앱 문구가 없는 코드의 봉투 `detail.detail`은 백엔드 문구를 그대로 쓴다(해요체 규칙의 예외, REQ-UI-002-009).
- 화면 처리 규칙: `aborted`는 알리지 않는다. 폼은 `fieldErrors`와 409를 필드 오류로 바꾼다(§8). 그 밖의 쿼리 오류는 destructive Alert + "다시 시도", 변경 오류는 토스트(`error`).

## 7. 예약 상태 모듈과 전환

```text
features/reservations/status.ts
  STATUS_ORDER = ["RESERVED","VISITED","COMPLETED","CANCELLED","NO_SHOW"] as const   @MX:ANCHOR
  STATUS_META: Record<Status, { label, icon, className: { badge, rail, event }, description }>
  isTerminal(s) = s ∈ { COMPLETED, CANCELLED, NO_SHOW }
  transitionKind(from, to): "same" | "direct" | "confirm"                            @MX:NOTE(화면 전용 규칙)
    from === to                                 → "same"
    from RESERVED, to ∈ {VISITED, CANCELLED, NO_SHOW} → "direct"
    from VISITED, to COMPLETED                  → "direct"
    그 밖                                        → "confirm"
  confirmCopy(from, to): { title, confirmLabel }   끝난 상태에서 → "되돌리기", 그 밖 → "바꾸기"
```

- 상태 타입은 생성 타입(`components["schemas"]["TreatmentStatus"]`)에서 가져온다. 백엔드에 새 상태가 생기면 `Record` 타입이 빈칸을 드러낸다.
- `StatusBadge`는 ui-core `Badge`에 `icon`과 상태 클래스를 넘긴다. 레일은 `Table.getRowRail`과 캘린더 이벤트 클래스가 같은 `STATUS_META` 값을 쓴다.
- `StatusChangeControl`: 현재 상태는 고를 수 없는(비활성 또는 목록에 없는) 메뉴(ui-core `Select` 또는 `Popover` 안 버튼 목록). `confirm`이면 `showConfirm(confirmCopy(…))`의 결과가 참일 때만 변경을 보낸다. "닫기"와 Esc는 거짓이다.
- 상태 라벨 글자는 이 모듈에만 있다. 배지·이력 필터 선택지·캘린더 범례·확인 문구는 모두 `STATUS_ORDER`·`STATUS_META`에서 만든다(QG-11 라벨 검사).
- 상태 변경 요청: `PUT /treatments/{id}` 본문 `{ reserved_at, status }`. `finished_at`과 `treatment_items`는 보내지 않는다. 취소도 같은 경로를 쓴다(`DELETE /treatments/{id}`는 쓰지 않는다).

## 8. 폼(`src/lib/form.ts`)

```text
useForm<V>({ initialValues, validate(values) → Partial<Record<keyof V | string, string>>, onSubmit })
  상태: values, touched(필드별), submitted(한 번이라도 제출), serverErrors, submitting
  register(name) → { id, value, onChange, onBlur, ref, error, invalid }   Field·제어 컴포넌트에 연결
  setServerErrors(map)    422 fieldErrors·409를 필드 오류로
  handleSubmit(event)     submitted = true → 검증 → 오류가 있으면 등록 순서상 첫 오류 필드 ref.focus()
                          → 없으면 submitting = true → onSubmit → 실패 시 서버 오류를 넣고 같은 포커스 규칙
  보이는 오류 = (touched[name] || submitted) ? (serverErrors[name] ?? clientErrors[name]) : undefined
  값이 바뀌면 그 필드의 serverError를 지우고 clientErrors를 다시 계산한다
```

- 필드 이름은 경로 문자열을 허용한다(`treatment_items.0.base_price`). 422 `fieldErrors` 키와 그대로 맞는다.
- 대화상자 연결: 값이 처음 값과 다르면 `Modal dirty`, `submitting`이면 `closeDisabled`(SPEC-UI-001 REQ-021 판정 순서 그대로).
- 숫자 필드는 ui-core `NumberInput`의 `value: number | null`을 그대로 폼 값으로 쓴다.
- 라이브러리를 쓰지 않는 이유: 폼 다섯 개가 대부분 ui-core 제어 컴포넌트라 범용 폼 라이브러리를 써도 연결 코드가 필요하고, 새 의존성(C5)보다 이 훅이 작다(plan.md §B.5).

## 9. 예약 캘린더

### 9.1 구성

- 가져오기: `@fullcalendar/react`와 하위 경로(`daygrid`, `timegrid`, `interaction`, `locales/ko`, `skeleton.css`, Monarch 테마). 플러그인 패키지는 따로 설치하지 않는다. 정확한 하위 경로 이름과 `temporal-polyfill` 적용 방식은 M7 사전 점검에서 패키지 `exports`로 확인한다.
- CSS 순서: `skeleton.css` → Monarch 테마 CSS → `features/reservations/calendar-theme.css`(토큰 매핑). 매핑 CSS의 선택자는 모두 `.kmc-calendar` 아래에 두고, design-rules 시험이 이 파일의 선택자 범위를 따로 고정한다(전역 `index.css` 규칙과 분리).
- 토큰 매핑: `--fc-monarch-*` 변수를 system.md 토큰(background·foreground·primary·muted·popover 등)에 연결하고, `--fc-event-color`·`--fc-event-contrast-color`는 상태 클래스에서 채운다. 포커스 링은 box-shadow 대신 `outline`으로 덮어쓴다(고대비 모드). 대응표는 system.md 1.2.0의 새 절(plan.md §E E-3)이 정본이다.
- 툴바: v7은 `headerToolbar`가 기본으로 꺼져 있으므로 ui-core `Button`(이전·오늘·다음)과 `Filter`(월·주·일), 제목으로 직접 만든다. PageHeader 주요 동작이 "예약 추가"다(빈 칸 선택의 키보드 대체 경로).
- 보기: `timeGridWeek`(기본), `dayGridMonth`, `timeGridDay`. 하루 전체(00:00~24:00)를 보이고 처음 스크롤 위치는 09:00. 주 시작 요일은 일요일이고 캘린더 옵션에 `firstDay: 0`을 명시한다(ko 로캘 기본값에 기대지 않는다, plan.md §B.6).

### 9.2 데이터

```text
datesSet({ start, end })          end는 배타
  → toKstRange(start, end) = { startDate: kstDate(start), endDate: kstDate(end − 1일) }
  → useQuery(qk.treatments.range(shopId, startDate, endDate), fetchAllPages)
fetchAllPages(signal): page = 1..min(pages, 20), size = 100, 같은 signal
  → { items, truncated: pages > 20 }      truncated면 경고 Alert
toEvent(t): { id, start: t.reserved_at, end: start + Σ duration_min(0이면 30분),
              classNames: [STATUS_META[t.status].className.event], extendedProps: { status, customer } }
eventContent: 상태 아이콘(aria-hidden) + 시각(HH:mm, tabular-nums, status-*-fg) + 고객명(foreground)
              상태 라벨 글자 없음. 요소의 aria-label = "<라벨> · HH:mm · <고객 이름>"
              같은 글을 ui-core Tooltip으로(마우스·포커스)
legend: 툴바 아래 STATUS_ORDER 순서로 아이콘 + 라벨 5개(결정 15)
```

- 범위가 바뀌면 키가 바뀌어 이전 조회가 `signal`로 취소된다. 쪽 하나라도 실패하면 결과 전체를 오류로 본다(acceptance.md EC-12).
- 이벤트 클릭 → `ReservationFormModal`(수정), 빈 칸 선택(`select`) → 그 시각으로 채운 등록 대화상자. 끌어 놓기(`editable`)는 끈다.

### 9.3 예약 대화상자(`ReservationFormModal`, `lg`)

- 필드: 고객(전화번호부 원격 검색 Combobox + "직접 입력" 전환 시 이름·전화번호), 일시(DateTimePicker), 시술 항목 목록(세부 항목 선택 → 가격·소요 시간 자동 채움 → NumberInput으로 수정, 회차, 추가·삭제), 결제 수단(Select: 카드·현금·미결제, 새 예약 기본 카드), 메모(Textarea), 상태(등록 때 예약됨 고정, 수정 때 `StatusChangeControl`).
- 저장 변환(`toCreateBody`, `toUpdateBody`): 일시는 `Date#toISOString()`. 수정은 언제나 `reserved_at`·`status`를 넣고, 항목 배열이 처음 값과 같으면(순서·값 비교) `treatment_items`를 빼고, 다르면 전체 배열을 보낸다(기존 항목은 `TreatmentItemUpdate`의 `id`를 담고, 새 항목은 `id` 없이). 전화번호부에서 고른 고객은 `phonebook_id`만, 직접 입력은 `customer_name`·`customer_phone`만 넣는다. 예약 항목 가격·소요 시간은 0 이상(백엔드 스키마, research.md 모순 19)이다.
- 시험은 Asia/Seoul로 돈다. 화면 표시와 입력은 브라우저 시간대를 쓴다(한국 시간대 가정 — plan.md R10).

## 10. CSV 내보내기

```text
lib/csv.ts
  toCsv(header: string[], rows: string[][]): string     "﻿" + 줄들.join("\r\n") + "\r\n"
  escapeCell(v): 1) v ?? "" 2) /^[=+\-@\t\r]/ → "'" + v   @MX:NOTE(수식 주입 방지 이유)
                 3) /[",\r\n]/ → '"' + v.replaceAll('"','""') + '"'
lib/download.ts
  downloadBlob(blob, fileName): createObjectURL → <a download> 클릭 → revokeObjectURL(같은 URL)
features/customers/export-csv.ts
  모든 쪽을 size=100으로 모음(현재 search 유지) → 열 이름·연락처·그룹·메모·등록일(KST YYYY-MM-DD)
  → downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `고객목록_${kstToday}.csv`)
```

- 쪽 수 상한은 없다(첫 응답의 `pages`만큼). 중간 쪽이 실패하면 파일을 만들지 않는다(acceptance.md EC-19, EC-36).
- 앞 공백이 있는 값과 전각 `＝`로 시작하는 값은 `'`를 붙이지 않는다(정한 정책, acceptance.md §3.5).

## 11. 빌드 플러그인(`vite-plugins.ts`)

| 플러그인 | 훅 | 동작 |
|---|---|---|
| `envCheckPlugin()` | `configResolved` | `config.mode !== "development"`이고 `config.command === "build"`일 때 `config.env.VITE_API_BASE_URL`이 없거나, `new URL(값)`이 던지거나, `protocol !== "https:"`이거나, `hostname`이 비면 변수 이름을 담은 오류를 던진다 |
| `cspPlugin({ apiOrigin })` | `transformIndexHtml`(`order: "post"`, 빌드 전용 `apply: "build"`) | 최종 HTML의 인라인 `<script>`(속성 `src` 없음) 본문마다 sha256 base64를 계산해 acceptance.md §3.8 정책을 만들고 `<meta charset>` 바로 뒤에 meta를 넣는다 |

- `apiOrigin`은 `new URL(VITE_API_BASE_URL).origin`이다. 해시는 직렬화된 최종 HTML에서 다시 찾아 계산하므로, 테마 스크립트(`index.html`)를 고쳐도 손으로 바꿀 값이 없다(후속 과제 5의 위험 제거).
- 개발 서버는 HMR·React Refresh 인라인 스크립트를 쓰므로 CSP를 넣지 않는다(`apply: "build"`).
- `scripts/check-dist.mjs`: `dist/index.html`을 읽어 meta 위치와 해시를 다시 계산해 비교하고, `connect-src`의 API origin이 실행 환경의 `VITE_API_BASE_URL` origin과 같은지 확인한다(QG-17, M8부터). `dist`의 JS 파일 전체에서 "컴포넌트 미리보기"와 `bg-rose-700`이 없음을 확인한다(QG-18, M4부터 — CSS는 테마 정리로 원래 규칙이 없어 판정에 쓰지 않는다). 하나라도 어긋나면 0이 아닌 코드로 끝난다. 자식 프로세스로 실행되므로 커버리지 측정에는 들지 않는다.
- `@MX:WARN` 대상: `cspPlugin` — 정책을 넓히거나 개발 모드에 적용하면 보호가 사라지거나 개발 서버가 깨진다.

## 12. 배포 스크립트(`deploy.sh`)

```text
#!/bin/bash
set -u
ENV_FILE=.env.production
[ -f "$ENV_FILE" ] || { echo "[deploy] .env.production 파일이 없습니다." >&2; exit 1; }
# @MX:WARN … (보안 경계 — 이 주석은 자기 줄에 둔다)
while IFS= read -r line || [ -n "$line" ]; do
  line=${line%$'\r'}                                    CRLF 정리
  case "$line" in ''|'#'*) continue ;; esac
  key=${line%%=*}; value=${line#*=}
  case "$key" in SCP_USER|SCP_HOST|SCP_DIR|SCP_PORT) ;; *) continue ;; esac
  양끝이 같은 따옴표(" 또는 ')일 때만 한 겹 벗긴다
  printf -v "$key" '%s' "$value"                        값은 글자 그대로(확장·치환 없음), 같은 이름이면 뒤가 이김
done < "$ENV_FILE"
필수 4개 비었으면 변수 이름을 담아 exit 1; SCP_PORT가 [0-9]+가 아니면 exit 1
SCP_USER·SCP_HOST·SCP_DIR가 '-'로 시작하면 변수 이름을 담아 exit 1(scp 옵션으로 읽히는 것 방지)
npm run build -- --mode production || exit 1
scp -P "$SCP_PORT" -r ./dist/* "$SCP_USER@$SCP_HOST:$SCP_DIR" || exit 1
```

- 위는 구조 설명이다. 출력 문구는 지금 스크립트처럼 합니다체를 유지한다(운영자용 셸 출력).
- 주석 줄은 QG-13 주석 제외 검사에서 빠지므로 금지 낱말(`eval`·`source`)을 담아도 되지만, 코드 줄 뒤에 붙인 주석은 빠지지 않는다. 그래서 `@MX:WARN`은 자기 줄에 둔다.
- M8 읽기 커밋은 맨 앞의 가드(`ALLOW_PREVIEW_ONLY_DEPLOY`)를 남긴 채 읽기 방식을 바꾸고 `git mv src/test/deploy-guard.test.ts src/test/deploy-script.test.ts`로 시험 파일 이름을 바꾼다(필수). M8의 마지막 run 단계 커밋에서 가드 분기와 가드 안내를 지우고, 시험도 그 커밋에서 "가드 없음 + 안전한 읽기"로 바꾼다(C6).
- 시험 장치: PATH에는 대역 디렉터리만 두므로 주입 표본은 내장 명령(`:`·`echo`와 재지정)만 쓰고, 일부러 `source`하는 대조 사본이 표시 파일을 만드는 것으로 표본이 살아 있음을 보인다. 대역은 인자를 `printf '%s\n' "$@"`로 한 줄에 하나씩 기록한다(acceptance.md AC-UI-002-25). 스크립트는 bash 내장 명령과 `npm`·`scp`만 쓰고, 대역 `npm`이 고정 산출물 `dist/index.html`·`dist/assets/a.js`를 만들어 `./dist/*`가 그 두 경로로 펼쳐진다.
- `VITE_API_BASE_URL`은 스크립트가 읽지 않고 건너뛴다. Vite가 `--mode production`에서 같은 파일을 읽는다. `SCP_*`는 `VITE_` 접두사가 없어 번들에 들어가지 않는다.
- 운영 서버 쪽 준비(`SCP_DIR`이 가리킬 정적 파일 디렉터리, server 블록, DNS)는 plan.md §P이며 이 스크립트의 책임이 아니다.

## 13. 개발 프록시와 env

- `vite.config.ts`는 `defineConfig(({ mode }) => …)` 꼴로 바꾸고 `loadEnv(mode, process.cwd(), "")`로 `DEV_API_PROXY_TARGET`을 읽는다.

```text
server.proxy = {
  "/api": { target: DEV_API_PROXY_TARGET ?? "http://localhost:8000", changeOrigin: true,
            rewrite: (p) => p.replace(/^\/api/, "") },
}
대상 호스트가 localhost·127.0.0.1이 아니면 console.warn 한 줄(운영 데이터 변경 경고)
```

- 설정 함수의 프록시 부분은 순수 함수(`buildDevProxy(env)`)로 빼서 단위 시험한다(AC-UI-002-03).
- `src/vite-env.d.ts`에 `interface ImportMetaEnv { readonly VITE_API_BASE_URL?: string }`. 코드는 `src/app/env.ts`에서만 읽는다.
- 프록시 경유 시 쿠키는 개발 서버 호스트(`localhost`) 전용이 된다. `Secure` 쿠키가 `http://localhost`에서 저장되는지는 UR-1로 확인한다.
- 예시 파일: `.env.example`(개발 기본값), `.env.production.example`(공개 API 주소 `VITE_API_BASE_URL=https://api-beauty.dongri.kr`와 `SCP_*` 이름만). 접속 정보와 비밀은 커밋하지 않는다.
- `src/app/env.ts`의 기준 주소 함수는 env 객체를 받는 순수 함수로 두어 `{ DEV: true }` → `/api`, `{ DEV: false, VITE_API_BASE_URL }` → 그 값을 시험한다(AC-UI-002-03).

## 14. 미리보기 개발 전용 경로

- `src/preview/route.tsx`(새 파일, 미리보기 폴더 안)가 `{ Component: PreviewPage }`를 내보내고, `src/app/dev-routes.ts`가 모듈 범위의 `import.meta.env.DEV`일 때만 `lazy`로 가져온다(§3.1).
- 미리보기 소스·시험·시연 허용 구역(QG-07의 `bg-rose-700`)은 그대로 둔다. 새 ui-core 컴포넌트 4개를 전시 목록(`showcase.ts`)과 섹션에 더한다(QG-15, 33개).

## 15. ui-core 변경

### 15.1 새 공개 컴포넌트

| 컴포넌트 | 기반 | 공개 API 요지 | 키보드·접근성 |
|---|---|---|---|
| `DateRangePicker` | `@radix-ui/react-popover` + `Calendar`(`mode: "range"`) | `value: DateRange \| null`, `onValueChange`, `presets?`, `placeholder?` | 트리거 Enter·Space로 열기, Calendar 키 이동(SPEC-UI-001 계약), 시작·끝을 고르면 한 번 알리고 닫기, Esc 닫기 + 트리거로 포커스 복귀. 시작·끝·사이 날짜에 색이 아닌 단서(system.md 1.2.0 §8) |
| `NumberInput` | `Input` | `value: number \| null`, `onValueChange`, `min?`, `max?`, `suffix?`("원"·"분") | `inputMode="numeric"`, 천 단위 쉼표 표시, 붙여넣기에서 숫자만, 커서 위치 유지(EC-24), 범위 밖 값은 바꾸지 않고 오류로 |
| `Drawer` | `@radix-ui/react-dialog` | `open`, `onOpenChange`, `title`, `side: "left"`, `children` | 포커스 가두기, Esc·스크림으로 닫기, 감속 모드에서 이동 애니메이션 없음 |
| `Popover` | `@radix-ui/react-popover` | `trigger`, `children`, `align?` | 트리거로 열기, Esc 닫기 + 트리거로 포커스 복귀 |

- `Calendar`는 공개 이름을 늘리지 않고 `mode` 판별 유니언(`"single"` 기본, `"range"`)으로 넓힌다. 타입 `DateRange`(`{ from: Date; to: Date }`)를 내보낸다.
- react-day-picker는 `calendar.tsx` 밖에서 쓸 수 없으므로(design-rules 규칙) DateRangePicker는 Calendar를 쓴다.

### 15.2 후속 과제 15건(ui-core)

항목별 판정 증거의 정본은 acceptance.md §3.10이다. 아래 표는 처리 방법 요약이다.

| # | 처리 | 시험 |
|---|---|---|
| 1 | Modal: `open`이 거짓이 되면 버리기 확인 상태 초기화 | 밖에서 닫고 다시 열기 재현 시험(먼저 실패) |
| 2 | DateTimePicker: 간격 밖 값의 시각을 옵션에 더해 트리거·시간 칸에 보임(값을 몰래 바꾸지 않음) | 14:10 재현 시험 |
| 4 | DefaultLink: `new URL(to, location.origin).protocol`로 판정해 상대 경로와 `http:`·`https:`만 허용, 그 밖은 `#` + 개발 경고(대소문자·앞 공백·TAB 섞기에도 안전) | acceptance.md §3.10 표본(대소문자·앞 공백·TAB·`data:`·`mailto:` 포함) |
| 6 | Combobox `canCreate()` 도우미 | 기존 시험 |
| 7 | `internal/class-names.ts`의 포커스 링 상수, 시험은 렌더링 결과 클래스 단언 | 기존 시험(기대값 유지) |
| 8 | 선택 상태 클래스 상수 | 기존 시험 |
| 9 | `internal/external-store.ts` + `internal/use-restore-focus.ts`, `@MX:WARN`(toast.tsx:40, confirm-dialog.tsx:153)을 새 위치로 옮김 | 기존 시험 |
| 10 | Search 병합 ref 메모 | 기존 시험 |
| 11 | Pagination 맨 숫자에 이름 붙은 상수 | 기존 시험 |
| 12 | setup.ts에 조건부 빈 `getContext`(canvas 경고 제거) | 시험 출력에 "Not implemented" 없음 |
| 13 | Loading·Skeleton `cva` | 기존 시험 |
| 14 | 명령형 저장소 초기화를 setup.ts의 `act` 안으로 | 기존 시험 |
| 15 | `ToastTone = Exclude<Tone, "neutral">` | 타입 검사 |
| 16 | `Modal` `size="md"` → `size="default"`(공개 prop 변경, 토큰 `dialog-md`는 그대로, 호출부 수정) | 기존 시험 + 크기 값 확인 |
| 17 | describe 제목 표지를 `AC-UI-001-06·AC-UI-001-14`로 풀어 씀 | — |

- 3(`deploy.sh`)과 5(CSP)는 M8에서 처리한다(§11, §12).
- 정리 12건(6~17)은 동작을 바꾸지 않는다. 기존 시험 551개가 기준선이며 M3 앞뒤로 모두 통과해야 한다.

### 15.3 잠금 시험 변경

- `design-rules.test.ts`: `PUBLIC_NAMES` 44(acceptance.md §3.6), `COMPONENT_FILES` 33, `BASE_LIBRARIES`에 새 3행, 금지 패턴 검사 대상에 `src/app`·`src/api`(생성 파일 제외)·`src/features`·`src/lib`, 가져오기 규칙을 앱 코드 전체로, 캘린더 CSS 선택자 범위 검사.
- `dependency-pins.test.ts`: 25 + 19(acceptance.md §3.4).

## 16. 시험 장치

- **MSW 3**: `src/test/msw/server.ts`의 `setupServer`를 `setup.ts`에서 `beforeAll(listen)`·`afterEach(resetHandlers)`·`afterAll(close)`로 돌린다. 처리하지 않은 요청은 실패로 본다(MSW 3의 `onUnhandledFrame` 설정). 처리기는 `schema.d.ts` 타입으로 응답을 만든다. 쿠키는 `cookies` 인자로 읽는다(`request.headers.get("cookie")`는 null).
- **경로 렌더링 도우미**: `src/test/render-route.tsx` — `createMemoryRouter(createRoutes({ devRoutes }), { initialEntries })` + 새 `QueryClient`(재시도 규칙 유지, `gcTime: Infinity`) + 세션 초기화 + Providers. 운영 경로 시험은 `devRoutes: []`를 넘긴다.
- **IndexedDB·위치 대역**: jsdom에는 IndexedDB가 없으므로 `setup.ts`가 앱 모듈을 가져오기 전에 `globalThis.indexedDB = { open: vi.fn() }` 꼴의 대역을 설치한다(AC-UI-002-05가 호출 0회를 판정). `window.location`의 메서드는 jsdom에서 감시할 수 없으므로 "문서 새로고침 없음"은 `location.href`가 그대로이고 "Not implemented: navigation" 오류가 없는 것으로 판정한다.
- **시간대**: 시험은 `vite.config.ts`의 `test.env.TZ = "Asia/Seoul"`로 돈다(npm 스크립트에 두지 않는다 — 인수 기준 명령이 `npx vitest`로 스크립트를 건너뛴다). `src/test/timezone.test.ts`가 `new Date(2026, 10, 10, 14, 30).toISOString() === "2026-11-10T05:30:00.000Z"`로 확인하고, `TZ=UTC npx vitest run src/test/timezone.test.ts`로도 통과해야 한다. 작업자에 닿지 않으면 `setup.ts` 맨 앞에서 `process.env.TZ`를 정한다(M1 사전 점검).
- **가짜 시계와 타이머**: 오늘이 필요한 시험은 `vi.setSystemTime(new Date("2026-11-09T10:00:00+09:00"))`로 정확한 순간에 고정한다. 시간 간격을 판정하는 시험(디바운스, 300ms 스켈레톤, 응답 지연, 로그아웃 지연)은 자동 진행이 없는 가짜 타이머(`vi.useFakeTimers()`)를 쓰고 `await vi.advanceTimersByTimeAsync(n)`으로만 시간을 보낸다. MSW 처리기의 `delay(n)`도 같은 가짜 시계로 흐르고, `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`로 입력 도구를 맞춘다. 실제 시간이 흐르는 자동 진행(`shouldAdvanceTime`)은 부하가 큰 기기에서 디바운스를 먼저 터뜨릴 수 있어 쓰지 않는다.
- **폭**: 기존 `matchMedia` 대역을 폭 값으로 판정하도록 넓힌다.
- **피라미드**: 단위(순수 함수·플러그인·스크립트) 약 60%, 컴포넌트(ui-core 4개·배지·폼·셸) 약 25%, 통합(MSW + 메모리 라우터 + 실제 QueryClient로 화면 흐름) 약 15%. 실제 브라우저 확인은 acceptance.md §5 사용자 검토로 넘긴다.
- **실행 시간**: `npm test` 전체가 게이트의 시험 단계 제한(120초) 안에 들어야 한다. 마일스톤마다 시간을 기록하고, 넘을 것 같으면 통합 시험을 화면당 핵심 흐름으로 줄인다.

## 17. 의존 방향

```text
features/* ──▶ api/* ──▶ (openapi-fetch, schema.d.ts)
    │            ▲
    ├──▶ lib/*   │ (handlers 주입)
    ├──▶ @/ui-core
    └──▶ app/env
app/* ──▶ features/*, api/*, lib/*, @/ui-core
ui-core ──▶ (Radix, cmdk, react-day-picker …)   앱 계층을 가져오지 않는다
api/* ──✕ react-router, features/*            라우터를 모른다
```

## 18. MX 태그 대상

| 태그 | 대상 | 이유 |
|---|---|---|
| `@MX:ANCHOR` | `src/api/client.ts` `createApiClient` | 모든 쿼리 훅이 쓰는 경계 |
| `@MX:ANCHOR` | `src/api/query-keys.ts` | 무효화·매장 전환 캐시 폐기가 이 모양에 기댄다 |
| `@MX:ANCHOR` | `src/features/reservations/status.ts` `STATUS_META`·`STATUS_ORDER` | 배지·이력·캘린더·전환이 모두 쓴다 |
| `@MX:ANCHOR` | `src/app/routes.tsx` | 앱과 시험이 같은 경로 객체를 쓴다 |
| `@MX:WARN` | `src/api/session.ts` `refreshSession` | single-flight·탭 잠금. 진행 중 Promise를 지우는 시점을 바꾸면 갱신이 겹친다 |
| `@MX:WARN` | `src/api/client.ts` 401 재시도 | 요청 복제·1회 재시도 표시. 바꾸면 무한 재시도나 본문 소실 |
| `@MX:WARN` | `deploy.sh` `.env.production` 읽기 반복문 | 보안 경계. `eval`·`source`로 되돌리면 명령 주입 |
| `@MX:WARN` | `vite-plugins.ts` `cspPlugin` | 정책을 넓히거나 개발 모드에 적용하면 보호가 사라지거나 개발 서버가 깨진다 |
| `@MX:NOTE` | `transitionKind` | 화면 전용 규칙 — 백엔드는 강제하지 않는다 |
| `@MX:NOTE` | `src/lib/kst-date.ts`, 예약 저장 변환 | 날짜 필터는 KST, 일시는 UTC 오프셋 ISO(research.md §2.7) |
| `@MX:NOTE` | `src/lib/csv.ts` `escapeCell` | `'` 접두의 이유(수식 주입 방지) |
| `@MX:NOTE` | `onShopNotSelected` 처리 | 선택 매장은 서버의 사용자 단위 상태 |
| 옮김 | `toast.tsx:40`, `confirm-dialog.tsx:153`의 `@MX:WARN` | 외부 저장소가 `internal/external-store.ts`로 옮겨 가면 태그도 옮긴다 |
