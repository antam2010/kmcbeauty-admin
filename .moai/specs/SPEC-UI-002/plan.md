# SPEC-UI-002 구현 계획

| 항목 | 내용 |
|---|---|
| SPEC | SPEC-UI-002 |
| 제목(제안) | 업무 화면·API·인증·라우팅 재구축과 배포 가드 제거 |
| 상태 | **승인** — 결정 지점 1(2026-11-09)에서 사용자가 "SPEC 문서 만들기"를 골랐다. 3회차 인터뷰 답(§O)을 반영했고, Phase 10에서 spec.md, acceptance.md, design.md, spec-compact.md, progress.md를 만들었다. 0.2.0(2026-11-09): 계획 감사 전 사전 검토 85건과 결정 15(4회차 인터뷰)를 반영했다(progress.md §A.7). §G·§H는 결정 지점 1 당시의 초안 기록이며, 정본은 spec.md §4·§7과 acceptance.md다 |
| 등급 | Tier L(산출물 5종, plan-auditor 통과 기준 0.85). 요구사항 25개·인수 기준 25개 상한 안에서 설계했다 |
| 개발 방식 | TDD(`quality.yaml` `constitution.development_mode: tdd`), 커버리지 목표 85%(앱 코드까지 넓힘). 기준값은 `vite.config.ts` 하나 — M1~M7 커밋 80/80/80/80, M8 마지막 커밋 85/85/85/80(C2) |
| 작업 위치 | 주 체크아웃의 `main` 직행. 실제 작업은 임시 작업 트리에서 하고 fast-forward로 합친다(C3 개정안, §M) |
| 근거 | `interview.md`(사용자 결정 — 조사와 다르면 이것이 우선), `research.md`(조사·검증 기록), `.moai/design/system.md`(디자인 정본), SPEC-UI-001 기록 |
| 기준 트리 | 관리자 `b84b92b`, 백엔드 `eb8b06d`(OpenAPI 3.1.0, 경로 31·API 50·스키마 58) |

> 기술 접근(§B)은 바뀔 가능성이 큰 결정(데이터·인증 모델, 경로 구성, 예약 도메인 규칙, 폼)부터 적고 기계적인 설정은 뒤로 미뤘다. 마일스톤(§F)은 의존 순서를 따른다. 인용은 `Reference: 파일:행` 형식이고, 예전 앱 파일은 커밋 `28c87a9` 기준, 백엔드 파일은 `kmcbeauty-fastapi/` 기준 경로다. 초안에서 확인이 필요했던 4개 항목은 3회차 인터뷰로 모두 풀었고 결과를 §O에 적었다. 운영 연결 작업(이 SPEC 범위 밖)은 §P 점검표로 남겼다.

---

## 요약

**무엇을 만드는가.** SPEC-UI-001의 디자인 토큰과 `src/ui-core` 위에 관리자 웹의 업무 화면 8개를 다시 만든다. 로그인, 매장 선택, 예약 캘린더(로그인 뒤 첫 화면), 고객, 시술 메뉴(세부 항목 포함), 시술 이력(새 목록 화면), 이용약관, 개인정보처리방침이다. 백엔드가 지원하는 예약 등록·수정·상태 변경, 메뉴·세부 항목·고객의 추가·수정·삭제, 고객 CSV 내보내기가 실제로 동작한다. 데이터 계층은 커밋된 OpenAPI 스냅숏 → openapi-typescript 타입 → openapi-fetch 호출 → 직접 작성한 TanStack Query 훅이다. 액세스 토큰은 메모리에만 두고 갱신은 백엔드의 HttpOnly 쿠키로 한다. SPEC-UI-001 후속 과제 17건을 모두 처리하고, 운영 빌드에 CSP를 넣고, `deploy.sh`가 운영 서버용으로 `--mode production` 빌드를 하고 `.env.production`을 실행하지 않고 읽게 바꾼 뒤, M8의 마지막 run 단계 커밋에서 배포 중지 가드를 지운다. 운영 연결(서버 블록·DNS·백엔드 CORS)과 운영 로그인 확인은 SPEC 완료 뒤의 작업이다(§P).

**마일스톤**(의존 순서)

| M | 이름 | 우선순위 |
|---|---|---|
| M1 | 설계 정본 개정·의존성·설정·API 스냅숏과 타입 | 높음 |
| M2 | API 클라이언트·인증 세션·오류 계층 | 높음 |
| M3 | ui-core 후속 과제 15건과 새 공개 컴포넌트 4개 | 높음 |
| M4 | 라우터·앱 셸·로그인·매장 선택·약관·404·미리보기 개발 전용 경로 | 높음 |
| M5 | 고객 화면과 CSV 내보내기 | 중간 |
| M6 | 예약 상태 모듈·시술 메뉴·시술 이력 | 중간 |
| M7 | 예약 캘린더와 예약 등록·수정 | 높음(기술 위험이 가장 큼) |
| M8 | CSP·배포 스크립트·최종 게이트·배포 가드 제거 | 높음 |

**새 패키지 7개**(정확한 버전, §C): 의존성 `react-router` 8.5.1, `@tanstack/react-query` 5.107.1, `@fullcalendar/react` 7.1.4, `temporal-polyfill` 1.0.8, `openapi-fetch` 0.17.0 / 개발 의존성 `openapi-typescript` 7.13.0, `msw` 3.0.4. zustand·file-saver·폼 라이브러리·Playwright는 넣지 않는다. engines는 `^22.22.0 || ^24.0.0`.

**규모**: 요구사항 25개(모듈 5개: 기반·계약 4, 데이터·인증 5, 셸·공개 화면 5, 업무 화면 8, 품질·보안·배포 3), 인수 기준 25개. ui-core 공개 이름 40 → 44, 컴포넌트 파일 29 → 33. 새 파일 약 110개, 수정 약 45개, 테스트 포함 7천~9천 줄 **(추정)**.

**확인 필요 항목 4개는 모두 해결**(§O, 3회차 인터뷰): 운영 관리자 주소는 `admin-beauty.dongri.kr`, 경로 방식 라우팅 유지(배포 서버에서 SPA 경로 대체와 보안 헤더 설정 가능), `deploy.sh`는 운영 서버에 `--mode production`으로 빌드해 올림, 운영 로그인 확인(UR-8)은 SPEC 완료 뒤. 운영 연결 작업은 §P 점검표(범위 밖).

**권고**: SPEC 하나(SPEC-UI-002)로 진행한다. 분할안은 §N에 대안으로 둔다.

---

## §A 결정 추적표

인터뷰 결정과 기본값이 계획의 어디에 들어갔는지 적는다. 마일스톤 표기는 spec.md §10 추적성 표와 같다.

| 출처 | 결정 | 계획의 위치 |
|---|---|---|
| 결정 1 | API 주소 `https://api-beauty.dongri.kr`. 브라우저 번들에 들어가는 공개 값이라 `.env.production.example`에 그대로 적는다 | §B.10(예시 env 파일), §P-8, M1(예시 env 파일, 운영 빌드 검사), QG-04·QG-17·AC-24의 빌드 값, REQ-UI-002-003 |
| 결정 2 | 예전 8개 화면만, 네이티브 전용 기능 제외 | §B.2 경로 표, §M.2 제외 범위 |
| 결정 3 | 미리보기 검토 전, tnum "미검증", 숫자 열 `tabular-nums` + 오른쪽 정렬, 대체 글꼴 없음 | §M C7, §E E-7, UR-4 |
| 결정 4 | 후속 과제 17건 모두 | M3(15건), M8(2건: deploy.sh, CSP), REQ-UI-002-023·024·025 |
| 결정 5 | 백엔드 기능까지 모두(예약·메뉴·세부·고객 CRUD) | M5·M6·M7, REQ-UI-002-017~020 |
| 결정 6 | 시술 이력 목록 새로 만듦, 기간 선택 신규 | §B.7, §D.1 DateRangePicker(M3), M6, REQ-UI-002-021 |
| 결정 7 | 다음 단계는 바로, 끝난 상태 되돌리기는 확인(화면 전용 규칙) | §B.4 전환 표, M6, REQ-UI-002-016 |
| 결정 8 | 스냅숏 + openapi-typescript + openapi-fetch, 필요한 훅만 직접 작성 | §B.1, M1(스냅숏·생성), M2(클라이언트), REQ-UI-002-002 |
| 결정 9 | `dongri.kr` 아래 새 운영 주소, 백엔드 CORS는 범위 밖 | §J R7, §O 항목 1·4, §M.2 제외 범위 |
| 결정 10 | 메모리 액세스 토큰 + HttpOnly 쿠키 갱신, 본문 `refresh_token` 저장 안 함, 로그아웃은 쿠키 기반 | §B.1, M2·M4, REQ-UI-002-005·006·007 |
| 결정 11 | 운영 관리자 주소 `admin-beauty.dongri.kr`(`admin.dongri.kr`은 다른 서비스, 와일드카드 원본 인증서가 덮음) | §O 항목 1, §P |
| 결정 12 | 경로 방식 라우팅 유지. 배포 서버(nginx 1.30.6 컨테이너)에서 SPA 경로 대체·서버 수준 보안 헤더 가능. 서버 작업은 범위 밖 | §B.11, §J R9, §M.2, §O 항목 2, §P |
| 결정 13 | 배포 대상은 운영 서버, `deploy.sh`는 `--mode production`으로 빌드하고 `.env.production`을 안전한 KEY=VALUE 읽기로 읽음 | §B.10, §B.12, M8, REQ-UI-002-025, §O 항목 3 |
| 결정 14 | 운영 로그인 확인(UR-8)은 SPEC 완료 뒤 — M8 완료 기준과 SPEC 완료 조건에서 뺌 | acceptance.md §5, §J R7, M8, §O 항목 4, §P |
| 결정 15 | 캘린더 일정은 색·상태별 아이콘·시각·고객 이름만 보이고, 상태 이름은 접근 이름 `"<상태> · HH:mm · <고객 이름>"`, 같은 글의 설명, 캘린더 위 범례로 알린다. system.md §9 "아이콘 + 라벨 필수"에 예외를 적는다 | §B.4, §B.6, §E E-2·E-3, M7, REQ-UI-002-015·017, AC-UI-002-14·16 |
| 기본값 | 로그인 뒤 첫 화면 = 예약 캘린더, 빈 대시보드 없음 | §B.2(`/` → `/reservations`), §E E-1(system.md §12 문구) |
| 기본값 | 상태 라벨 예약됨·방문함·완료·취소됨·노쇼, `status_label` 안 씀 | §B.4, §E E-2, REQ-UI-002-015 |
| 기본값 | `/terms-of-service`, `/privacy-policy` 유지 | §B.2, acceptance.md §3.9 |
| 기본값 | CSV 유지, file-saver 없이, 올바른 이스케이프 | §B.8, M5, REQ-UI-002-019 |
| 기본값 | 최신 안정판, engines `^22.22.0 \|\| ^24.0.0`. 이전 줄은 참고 정보이고 전환은 언제나 blocker(C5) | §C, M1, REQ-UI-002-001 |
| 기본값 | 미리보기는 개발 서버 전용 경로, 운영 빌드에서 뺌 | §B.9, M4, REQ-UI-002-014 |
| 기본값 | 개발 API는 Vite 프록시, 대상은 환경 변수(기본 `http://localhost:8000`) | §B.10, M1, REQ-UI-002-003 |
| 기본값 | 갱신 요청은 동시에 하나만(single-flight) | §B.1, M2, REQ-UI-002-006 |
| 기본값 | C3 = main 직행, 임시 작업 트리, fast-forward | §M C3 |
| 알린 위험 | 예전 로그인 코드의 기본 계정 정보 | 옮기지 않음(§B.13 로그인), §J R14 |
| 알린 위험 | 사용자당 리프레시 토큰 하나 → 네이티브 세션이 풀림 | §J R4(README 안내는 동기화 단계), UR-6 |
| SPEC-UI-001 §8 | 라우터와 경로 구성 | §B.2, M4 |
| SPEC-UI-001 §8 | 앱 셸(상단바 56px, 사이드바 240/64 접힘 저장, 768~1023px 자동 접힘, 768px 미만 서랍, 건너뛰기 링크, 사용자 메뉴, 현재 매장) | §B.13, M4, REQ-UI-002-011 |
| SPEC-UI-001 §8 | 검색 디바운스, 빠른 필터 변경 때 이전 요청 취소 | §B.7, M2(signal), M5·M6·M7(화면별 취소), REQ-UI-002-009·019 |
| SPEC-UI-001 §8 | 폼 상태·검증 시점, 제출 실패 시 첫 오류 필드 포커스, 천 단위 쉼표 입력 | §B.5, §D.1 NumberInput, M3(NumberInput)·M4(폼 훅)~M7, REQ-UI-002-022 |
| SPEC-UI-001 §8 | StatusBadge + 상태 → {라벨, 아이콘, 토큰} 도메인 모듈(ui-core 밖) | §B.4, M6, REQ-UI-002-015 |
| SPEC-UI-001 §8 | FullCalendar 연결(토큰, 상태 레일) | §B.6, §E E-3, M7, REQ-UI-002-017 |
| SPEC-UI-001 §8 | CSP(테마 스크립트 해시, Radix·FullCalendar 스타일 정책, `frame-ancestors`는 서버 헤더) | §B.11, M8, REQ-UI-002-024 |
| SPEC-UI-001 §8 | `deploy.sh` 안전한 KEY=VALUE 읽기, 마지막에 가드 제거(C6) | §B.12, M8, REQ-UI-002-025 |
| 갱신할 게이트 | QG-12 재정의, 의존성 고정 목록, ui-core 공개 API 잠금(40·29), 커버리지 범위 확대와 단계 기준 | §D.3, M1·M3·M8, REQ-UI-002-001·004·023 |
| 사전 검토(0.2.0) | 관점 3개 85건 반영, 결정 15 | progress.md §A.7(항목별 대응표) |

---

## §B 기술 접근

### B.1 데이터·인증 계층

**구성**(모두 `src/api/`)

| 파일 | 역할 |
|---|---|
| `openapi/openapi.json`(저장소 루트) | 백엔드 OpenAPI 스냅숏. 사람이 고치지 않는다 |
| `src/api/schema.d.ts` | `openapi-typescript`가 만든 타입. 사람이 고치지 않는다 |
| `src/api/client.ts` | `createApiClient({ baseUrl, fetch? })` — openapi-fetch 클라이언트 + 미들웨어 등록 |
| `src/api/session.ts` | 메모리 액세스 토큰 저장소, `refreshSession()`(single-flight), `ensureSession()`, `clearSession()` |
| `src/api/errors.ts` | `ApiError`와 응답 정규화, 한국어 문구 |
| `src/api/query-client.ts` | `QueryClient` 기본값(재시도·staleTime) |
| `src/api/query-keys.ts` | 쿼리 키 공장(매장 범위 키에 매장 id 포함) |

**요청 미들웨어**(openapi-fetch `client.use`)
- 기준 주소: 개발 서버에서는 `/api`(Vite 프록시), 운영 빌드에서는 `VITE_API_BASE_URL`(§B.10). 테스트는 절대 주소(예: `http://api.test`)를 넘긴다. Node의 fetch는 상대 주소를 받지 않는다.
- `onRequest`: 메모리 토큰이 있으면 `Authorization: Bearer`를 붙이고, 재시도에 쓰도록 요청 복제본을 보관한다(본문이 이미 읽힌 뒤에는 다시 보낼 수 없기 때문이다).
- 쿠키 전송 범위: `credentials: "include"`는 `/auth/login`·`/auth/refresh`·`/auth/logout`에만 준다. 나머지 요청은 Bearer만 쓴다. 리프레시 쿠키가 모든 API 요청에 실려 다니지 않게 하려는 것이다. 교차 출처 응답의 `Set-Cookie`는 `credentials: "include"`일 때만 저장되므로 로그인·갱신에는 반드시 필요하다.
- `onResponse`:
  - 401이고 `/auth/*`가 아니며 아직 재시도하지 않은 요청이면 → `refreshSession()` → 성공하면 새 토큰으로 **한 번만** 다시 보낸다. 실패하면 `onSessionExpired()`.
  - 404이고 본문 `detail.code === "SHOP_NOT_SELECTED"`이면 → `onShopNotSelected()`.
  - 처리기(`onSessionExpired`, `onShopNotSelected`)는 앱 시작 때 주입한다. API 계층이 라우터를 직접 가져오지 않아 단독 시험이 쉽다. 예전 앱처럼 `window.location`으로 전체 새로고침 이동하지 않는다. Reference: `28c87a9:src/shared/api/axios.ts:14-103`(예전 방식, 버리는 선례).
- openapi-fetch 미들웨어로 응답을 새 응답으로 바꿔치기할 수 있는지는 M2 사전 점검에서 확인한다(research.md 9절). 안 되면 `fetch`를 감싸는 래퍼에서 같은 규칙을 구현한다.

**세션(토큰) 저장**
- 액세스 토큰은 모듈 변수에만 둔다. `localStorage`·`sessionStorage`·IndexedDB·JS가 읽을 수 있는 쿠키에 **어떤 토큰도 쓰지 않는다**(OWASP Session Management Cheat Sheet, 결정 10). 로그인·갱신 응답 본문의 `refresh_token`은 읽자마자 버린다.
- 구독이 필요한 곳(로그인 상태 표시)은 `useSyncExternalStore`로 읽는다. Reference: `src/ui-core/toast.tsx:42-58`, `src/ui-core/confirm-dialog.tsx:155-171`(외부 저장소 선례). 앱은 ui-core 내부 파일을 가져올 수 없으므로(§D.3 가져오기 규칙) `src/lib/external-store.ts`에 작은 같은 패턴을 둔다.
- zustand는 필요 없다. 서버 상태는 TanStack Query가, 토큰은 위 외부 저장소가, 사이드바 접힘은 `localStorage` 훅이 맡는다.

**갱신(single-flight)**
- `refreshSession()`은 진행 중인 Promise가 있으면 그것을 돌려준다. 동시에 난 401 여러 개가 갱신 요청 하나를 함께 기다리고, 각자 한 번씩 다시 보낸다. 백엔드는 남은 수명이 절반 이하일 때 토큰을 바꾸므로(`app/services/auth_service.py:243-263`) 동시 갱신 두 개는 한쪽 토큰을 무효로 만들 수 있다. single-flight가 이 경쟁을 막는다.
- 갱신 요청은 미들웨어를 거치지 않는 맨 `fetch`(`POST {base}/auth/refresh`, 본문 없음, `credentials: "include"`)로 보낸다. 미들웨어 재귀를 피한다. `X-Refresh-Token` 헤더는 쓰지 않는다(결정 10, research.md 6절 모순 6).
- 결과: 200이면 토큰 저장 → `true`. 401이면 세션 삭제 → `false`. 그 밖의 실패(403·429·5xx·네트워크)는 세션을 지우지 않고 그 종류의 `ApiError`를 던진다 — 오프라인이나 요청 제한(갱신은 IP당 분당 30회)을 로그아웃으로 오인하지 않고, 원래 요청이 그 오류로 끝나 화면이 해당 문구 + 다시 시도를 보인다(REQ-UI-002-006).
- 여러 탭: 브라우저가 지원하면 `navigator.locks.request("kmc-admin-refresh", …)`로 탭 사이 갱신을 줄 세운다(새 패키지 없음, 권장 보강). 쿠키는 탭이 공유하므로 뒤 탭은 앞 탭이 바꾼 쿠키로 갱신한다 **(추론)**.

**새로고침과 로그아웃**
- 새로고침 뒤에는 토큰이 없으므로 보호 경로 loader가 `ensureSession()`으로 쿠키 갱신을 한 번 시도한 뒤 판단한다. Reference: `28c87a9:src/shared/components/RequireAuth.tsx:15-40`(같은 순서의 선례, 로딩 문구 포함).
- 로그아웃: `POST /auth/logout`(쿠키 기반, `credentials: "include"`)을 보내되 응답을 기다리지 않고 바로 토큰 삭제 → `queryClient.clear()` → `/login`(REQ-UI-002-007). 응답이 오지 않아도 토큰이 메모리에 남지 않는다. 백엔드는 쿠키만 읽어 Redis 키를 지우고 쿠키를 삭제한다(`app/api/auth.py:100-109`). 액세스 토큰은 만료(운영 예시 900초)까지 살아 있지만 메모리에서 지웠으므로 이 탭에서는 쓸 수 없다.

**오류 정규화**(`ApiError { status, kind, code?, message, hint?, fieldErrors? }`)
- `{"detail":{"code","detail","hint"}}` → `code`, `message = detail`, `hint`. Reference: `app/exceptions.py:96-108`.
- 422 `{"detail":[{loc,msg,type}]}` → `fieldErrors`(`body` 접두사를 뺀 `loc` 조각을 `.`으로 이은 경로가 키 — 예: `phone_number`, `treatment_items.0.base_price`. 예약 항목처럼 같은 이름의 필드가 여러 개인 폼에서도 어느 칸의 오류인지 가리기 위해서다), `message` "입력한 값을 확인해 주세요."
- 409(고객 전화번호·메뉴 이름 중복)·429·5xx·네트워크·취소(`AbortError` → `kind: "aborted"`, 화면에 알리지 않음)는 상태별 해요체 문구를 쓴다(system.md §11). 백엔드 문서 예시의 `detail.message`는 따르지 않는다(`app/docs/common_responses.py:11`, research.md 2.3).
- 문구 결정 순서는 acceptance.md §3.2가 정본이다: 앱 코드 표 → 백엔드 봉투의 `detail.detail` → 상태 코드 문구. 백엔드 문구는 합니다체일 수 있으며, 앱 문구가 없는 코드일 때 그대로 보이는 것을 해요체 규칙의 예외로 둔다(REQ-UI-002-009, C4).

**쿼리 기본값**
- `queries.retry`: `ApiError`의 4xx와 `aborted`는 재시도하지 않고, 5xx·네트워크는 최대 2회. `mutations.retry: 0`. `staleTime` 30초. 401 뒤 갱신하고 한 번 다시 보내는 것은 미들웨어의 일이며 이 재시도 정책 밖이다. `["shops","selected"]`는 `refetchOnWindowFocus: "always"`로 두어 포커스 때 신선도와 상관없이 다시 가져온다.
- 모든 `queryFn`은 TanStack이 주는 `signal`을 openapi-fetch 호출에 넘긴다. 검색어·필터가 바뀌어 이전 쿼리가 관찰자를 잃으면 그 요청이 취소된다(TanStack query-cancellation 안내, research.md 4.3).
- 훅은 화면이 쓰는 API에만 직접 작성한다(결정 8): 인증 3, 내 정보 1, 매장 3, 고객 6, 메뉴·세부 항목 8, 예약 3(목록·생성·수정) — 24개. `DELETE /treatments`와 `DELETE /shops/selected`, 메뉴 복원은 쓰지 않는다.

**쿼리 키**(`src/api/query-keys.ts`)

```text
["me"]
["shops", "list", { page }]          ["shops", "selected"]
["shop", shopId, "customers", "list", { q, page }]    ["shop", shopId, "customers", "groups"]
["shop", shopId, "menus", "list", { q, page }]        ["shop", shopId, "menus", menuId, "details"]
["shop", shopId, "treatments", "range", startKst, endKst]
["shop", shopId, "treatments", "list", { from, to, status, q, page, order }]
```

매장 범위 데이터는 모두 `["shop", shopId, …]` 아래에 둔다. 매장을 바꾸면 `removeQueries({ queryKey: ["shop"] })` 한 번으로 이전 매장 데이터를 버린다. 변경 뒤 무효화는 접두사로 한다(`invalidateQueries`는 접두사 일치, research.md 4.3).

### B.2 라우팅

**모드 선택 — 데이터 모드(`createBrowserRouter` + `RouterProvider`)**

| 대안 | 장점 | 단점 | 판단 |
|---|---|---|---|
| 선언형(`<BrowserRouter>`) | 개념이 가장 적다 | 보호·매장 검사를 컴포넌트 효과로 해야 해 화면이 한 번 그려진 뒤 튄다. API 계층(React 밖)에서 이동하려면 별도 다리가 필요하다 | 탈락 |
| **데이터 모드** | loader에서 `throw redirect()`로 화면을 그리기 전에 막는다. `router.navigate`를 React 밖에서 쓸 수 있다. `lazy`로 개발 전용 경로를 운영 빌드에서 뺄 수 있다. 시험은 `createMemoryRouter`로 같은 경로 객체를 쓴다. 경로별 `errorElement` | loader와 TanStack Query 역할이 겹칠 수 있다 → loader는 **인증·매장 확인과 `ensureQueryData`만** 하고 화면 데이터는 훅이 맡는다 | **채택** |
| 프레임워크 모드(Vite 플러그인) | 파일 기반 경로, SSR | 정적 배포 SPA에 과하다. 빌드 구성이 바뀐다 | 탈락 |

보호는 문서가 권하는 두 방식(middleware, loader `redirect`) 가운데 loader `redirect`를 쓴다(https://reactrouter.com/start/data/route-object). v8에서 middleware 사용법은 확인하지 않았다. v8의 데이터 모드 API 이름은 M4 사전 점검에서 타입으로 확인한다. 막히면 7로 돌아가지 않고 blocker로 보고한다(C5, §C).

**경로 표**(설계 요약 — 판정 기준은 acceptance.md §3.3 경로 표)

| 경로 | 화면 | 접근 | 레이아웃 |
|---|---|---|---|
| `/login` | 로그인 | 공개. 세션이 복원되면 `next` 또는 `/`로 보낸다 | 공개 레이아웃 |
| `/terms-of-service` | 이용약관 | 공개(경로 유지) | 공개 레이아웃 |
| `/privacy-policy` | 개인정보처리방침 | 공개(경로 유지) | 공개 레이아웃 |
| `/shops` | 매장 선택 | 로그인 필요, 매장 불필요 | 공개 레이아웃(셸은 현재 매장을 보여 주므로 매장 선택 전에는 쓰지 않는다) |
| `/` | → `/reservations` | 로그인 + 매장 | — |
| `/reservations` | 예약 캘린더(첫 화면) | 로그인 + 매장 | 앱 셸, 최대 폭 해제 |
| `/customers` | 고객 | 로그인 + 매장 | 앱 셸 |
| `/treatment-menus` | 시술 메뉴(`?menu=<id>`로 세부 항목) | 로그인 + 매장 | 앱 셸 |
| `/treatments` | 시술 이력 | 로그인 + 매장 | 앱 셸 |
| `/dev/preview` | 컴포넌트 미리보기 | 개발 서버에서만 등록 | 미리보기 자체 레이아웃 |
| `*` | 찾을 수 없음(404) | 공개 | 공개 레이아웃, 첫 화면 링크 |

- `/manager` 접두사와 중복 `/login`은 없앤다. 관리자 웹이 새 호스트를 쓰고 예전 호스트는 DNS가 없어(research.md 2.6) 옛 북마크 호환이 필요 없다 **(이번에 정한 기본값)**.
- `next` 매개변수는 acceptance.md §3.3 `next` 규칙(한 번 디코딩한 값에 `\`·C0 제어 문자·공백 없음, `new URL(값, location.origin).origin`이 같음, `/`로 시작하고 `//`로 시작하지 않음)을 통과한 앱 내부 경로만 받는다(열린 리디렉트 방지). 세 사용처(로그인 화면 loader, 로그인 제출, 매장 선택)가 같은 `src/app/safe-next.ts`를 쓴다. WHATWG URL은 `\`를 `/`처럼 다루고 TAB·LF·CR을 지우므로 `/\evil.example`·`/%09/evil.example`이 외부 주소가 될 수 있어 이 규칙을 둔다.
- 경로 객체는 `src/app/routes.tsx` 한 곳에 둔다. 앱과 시험이 같은 객체를 쓴다. M4에서 모든 경로를 등록하고, 업무 화면 4개는 h1만 있는 빈 화면으로 두었다가 M5~M7에서 채운다.

**loader**
- `requireSession`(`/shops`, 앱 셸 경로): `ensureSession()`이 `false`면 `redirect("/login?next=<현재 경로>")`. 네트워크 오류는 경로 오류 화면(다시 시도)으로 보낸다.
- `requireShop`(앱 셸 경로): `queryClient.ensureQueryData(selectedShopQuery)`. `SHOP_NOT_SELECTED`면 `redirect("/shops?next=…")`.
- 루트 경로는 `ThemeProvider` 아래에서 `Toaster`·`ConfirmDialogHost`를 한 번만 마운트한다. Reference: `src/main.tsx:12-20`(Host를 하나씩만 둔다는 주석 :16).

**링크 어댑터**: `src/app/shell/RouterLink.tsx`가 ui-core `LinkComponentProps`(`to`, `className`, `aria-current`, `children`)를 받아 react-router `Link`를 그린다. Sidebar에는 `currentPath = useLocation().pathname`과 접두사 일치 `isActive`를 넘긴다(`/treatment-menus?menu=3`도 시술 메뉴가 활성). Reference: `src/ui-core/breadcrumb.tsx:5-22`, `src/ui-core/sidebar.tsx:18-42`, `:149-155`.

### B.3 선택 매장 처리

- 선택 매장의 정본은 서버 Redis다(`app/utils/redis/shop.py:3-15`, 사용자 단위 키). 클라이언트는 `["shops","selected"]` 쿼리로 **비춰 볼 뿐** 따로 저장하지 않는다.
- 매장 선택: `POST /shops/selected` → 성공하면 `setQueryData(["shops","selected"], 고른 매장)` → `removeQueries(["shop"])` → 규칙을 통과한 `next` 또는 `/reservations`. 실패하면 캐시와 경로를 그대로 두고 destructive Alert를 보인다(REQ-UI-002-013).
- 어디서든 `SHOP_NOT_SELECTED`를 받으면 라우터로 `/shops`에 보내고 매장 범위 캐시를 버린다(REQ-UI-002-008). Reference: `app/dependencies/shop.py:19-39`.
- **다른 기기에서 매장이 바뀌는 경우**: 같은 계정이 네이티브 앱에서 매장을 바꾸면 서버의 선택 매장도 바뀐다 **(추론, research.md 2.1)**. 대응: `["shops","selected"]`는 창 포커스 때 신선도와 상관없이 다시 가져오고(`refetchOnWindowFocus: "always"` — TanStack 기본값은 낡은 데이터만 다시 가져오므로 `staleTime` 30초 안의 포커스를 놓친다), 돌아온 매장 id가 화면의 매장 id와 다르면 매장 범위 캐시를 버리고 "다른 기기에서 매장이 바뀌었어요" 안내 토스트를 띄운다. 매장 범위 키에 매장 id를 넣었으므로 다른 매장 데이터가 섞여 보이지 않는다.
- 현재 매장은 사이드바 머리에 매장명 + "매장 변경"(→ `/shops`)으로 보여 준다(design-direction.md §14.1 사이드바 머리).
- 매장 생성·수정은 범위 밖이다(네이티브 기능). 매장이 하나뿐이어도 자동 선택하지 않고 목록을 보여 준다 **(기본값)**.

### B.4 예약 도메인 — 상태 모듈과 요청 계약

**상태 모듈**(`src/features/reservations/status.ts`, ui-core 밖 — C8, system.md §9)

| 상태 | 라벨 | 아이콘(lucide) | 토큰 | 뜻(acceptance.md §3.1 정본 — §E E-2에서 system.md에 같은 글자로 옮김) |
|---|---|---|---|---|
| `RESERVED` | 예약됨 | `CalendarClock` | `status-reserved-*` | 예약이 잡혀 있어요. |
| `VISITED` | 방문함 | `DoorOpen` | `status-visited-*` | 손님이 와서 시술 중이에요. |
| `COMPLETED` | 완료 | `CircleCheck` | `status-completed-*` | 시술이 끝났어요. 소요 시간이 지나면 자동으로 바뀌어요. |
| `CANCELLED` | 취소됨 | `Ban` | `status-cancelled-*` | 예약이 취소됐어요. |
| `NO_SHOW` | 노쇼 | `UserX` | `status-no-show-*` | 손님이 오지 않았어요. |

- 표시 순서는 예약됨 → 방문함 → 완료 → 취소됨 → 노쇼로 확정한다(system.md §9 임시 순서를 그대로 확정).
- `StatusBadge`(앱 계층 `src/features/reservations/StatusBadge.tsx`)는 ui-core `Badge`에 상태 클래스를 덧입혀 **아이콘 + 라벨**을 함께 그린다. 레일 색은 `Table.getRowRail`과 캘린더 이벤트 클래스에 같은 모듈 값을 쓴다. 목록·표·폼·대화상자에서 레일은 항상 배지와 함께 쓴다(system.md §12).
- **캘린더 일정의 상태 표시(결정 15)**: 일정 칸에는 상태 면·레일·상태별 아이콘·시각·고객 이름만 보이고 상태 라벨 글자는 쓰지 않는다. 상태 이름은 접근 이름 `"<라벨> · HH:mm · <고객 이름>"`(예: "예약됨 · 14:30 · 김민지"), 같은 글의 마우스·포커스 설명, 캘린더 위 범례(아이콘 ↔ 라벨 5종)로 알린다. system.md §9 "아이콘 + 라벨 필수" 규칙의 예외로 E-2·E-3에 적는다. 라벨·아이콘은 모두 `STATUS_META`에서 오고, 상태 라벨 글자는 `status.ts` 밖의 앱 코드에 다시 적지 않는다(QG-11 라벨 검사).
- 백엔드 `status_label`("방문 및 시술 완료" 등)은 쓰지 않는다. Reference: `app/enum/treatment_status.py:4-18`, 네이티브 `components/booking/BookingListScreen.tsx:22-28`(같은 라벨).

**전환 규칙(화면 전용, 결정 7)**

| 현재 → 바꿀 상태 | 동작 |
|---|---|
| 예약됨 → 방문함·취소됨·노쇼 | 바로 바꾼다 |
| 방문함 → 완료 | 바로 바꾼다 |
| 완료·취소됨·노쇼 → 다른 상태(되돌리기) | 확인 대화상자("‘완료’ 예약을 ‘예약됨’으로 되돌릴까요?", [닫기] [되돌리기]) |
| 그 밖의 전환(예: 방문함 → 예약됨·취소됨·노쇼) | 확인 대화상자를 거친다 **(이번에 정한 기본값 — 인터뷰가 정하지 않은 전환을 모두 '바로잡기'로 보고 확인을 받는다)** |

- `transitionKind(from, to): "same" | "direct" | "confirm"` 순수 함수 하나와 25칸 표 시험으로 고정한다(대각선 5칸은 `same` — 현재 상태는 고를 수 없고 요청도 없다. 정본 표는 acceptance.md §3.1). 확인 대화상자를 "닫기"나 Esc로 끝내면 요청을 보내지 않는다.
- 백엔드에는 규칙이 없어 네이티브 앱 등은 아무 전환이나 만들 수 있다(`app/services/treatment_service.py:231-264`). 화면은 어떤 상태든 표시할 수 있어야 한다.
- 완료로 바꿀 때 `finished_at`을 보내지 않는다. 캘린더 종료 시각은 `reserved_at + 항목 소요 시간 합`으로 계산한다(합이 0이면 30분) **(기본값)**.

**요청 계약**
- 일시는 항상 `Date.prototype.toISOString()`(UTC 오프셋 포함)으로 보낸다. 오프셋 없는 값은 UTC 벽시계 값으로 저장된다(research.md 2.7, `app/schemas/mixin/base.py:8-14`, `app/database.py:24`).
- 날짜 필터(`start_date`·`end_date`)는 KST 날짜 문자열(`YYYY-MM-DD`)로 보낸다. 백엔드가 KST 하루 경계로 바꾼다(`app/utils/query.py:16-37`). 변환은 `src/lib/kst-date.ts`가 `Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" })`로 한다.
- 화면 표시와 입력은 브라우저 시간대를 쓴다. 사용자가 한국 시간대 브라우저를 쓴다고 가정한다(§J R10). 시험은 `Asia/Seoul`로 고정해 돌린다(§I).
- `PUT /treatments/{id}`는 매번 `reserved_at`과 `status`를 함께 보낸다. 항목을 바꾸지 않았으면 `treatment_items`를 생략하고(유지), 바꿨으면 전체 배열을 보낸다(교체 — 기존 항목은 `TreatmentItemUpdate`의 `id`를 담고, 새 항목은 `id` 없이). 상태만 바꿀 때도 같은 규칙이다. Reference: `app/schemas/treatment.py:76`, `app/schemas/treatment_item.py:63-75`.
- 취소도 상태 변경(`CANCELLED`)으로 `PUT`을 쓴다. `DELETE /treatments/{id}`는 쓰지 않는다(경로 하나로 통일) **(기본값)**.
- 결제 수단 라벨은 카드·현금·미결제로 앱이 정한다. 새 예약의 기본값은 백엔드와 같은 카드다(`app/schemas/treatment.py:41-44`).

### B.5 폼

- 라이브러리를 넣지 않고 `src/lib/form.ts`에 작은 `useForm` 훅을 둔다. 폼이 다섯 개(로그인 2필드, 고객 4, 메뉴 1, 세부 항목 3, 예약 7 + 항목 목록)이고 대부분 ui-core의 제어 컴포넌트(Combobox, DateTimePicker, Select, NumberInput)라서, 범용 폼 라이브러리를 써도 컴포넌트마다 연결 코드가 필요하다. 새 의존성(C5)보다 100~150줄 훅이 싸다 **(이번에 정한 기본값)**.
- **검증 시점**: 처음에는 오류를 숨긴다. 필드를 떠나거나(blur) 한 번 제출하면 그 필드의 오류를 보이고, 이후로는 값이 바뀔 때마다 다시 검사한다.
- **제출 실패**: 오류가 있으면 등록 순서상 첫 오류 필드로 포커스를 옮긴다. ui-core `Field`가 `aria-invalid`·`aria-describedby`를 맡는다. Reference: `src/ui-core/field.tsx:45`(ANCHOR).
- **서버 오류**: 422 `fieldErrors`와 409(전화번호·메뉴 이름 중복)를 해당 필드 오류로 바꿔 같은 포커스 규칙을 적용한다. 필드로 못 옮기는 오류는 대화상자 안 `Alert`로 보여 준다.
- **대화상자 닫기**: 입력이 바뀌면 `Modal`의 `dirty`, 제출 중이면 `closeDisabled`를 켠다. Reference: `src/ui-core/modal.tsx:57,61-68,127-129`(후속 과제 1을 M3에서 고친 뒤 쓴다).
- **숫자 입력**: 가격·소요 시간은 ui-core 새 `NumberInput`(천 단위 쉼표 표시, 숫자 값 반환, 단위 부가 표시 "원"·"분")을 쓴다. 숫자 표시는 `tabular-nums` + 오른쪽 정렬(C7).

### B.6 예약 캘린더(FullCalendar 7)

- 가져오기: `@fullcalendar/react`와 하위 경로 `./daygrid`, `./timegrid`, `./interaction`, `./locales/ko`, `./skeleton.css`, 테마(Monarch 권장 — §E E-3). 플러그인 패키지는 따로 설치하지 않는다(research.md 4.1).
- 보기: 주(`timeGridWeek`, 기본)·월(`dayGridMonth`)·일(`timeGridDay`). v7은 `headerToolbar`가 기본으로 꺼져 있으므로(research.md 4.5) 툴바를 ui-core `Button`·`Filter`로 직접 만든다(이전·오늘·다음, 제목, 월·주·일). 하루 전체(00:00~24:00)를 보이고 처음 위치만 09:00으로 둔다(이른 예약이 숨지 않게) **(기본값)**. 주 시작 요일은 일요일이며, 캘린더 컴포넌트 옵션에 `firstDay: 0`을 명시한다(`src/features/reservations`의 캘린더 설정 한곳). ko 로캘의 기본값에 기대지 않는다 — 로캘 파일이 바뀌어도 주간 범위(예: 2026-11-08(일)~11-14, acceptance.md AC-UI-002-16)가 그대로이게 하기 위해서다.
- 데이터: `datesSet`에서 보이는 범위를 받아 KST 시작일·종료일(v7 `end`는 배타라 하루 뺀다)로 `GET /treatments`를 부른다. `size=100`으로 `pages`까지 쪽을 돌고, `pages`가 20을 넘으면 20쪽(2,000건)에서 멈춘 뒤 "일부 예약만 보여요" 경고를 띄운다(20쪽 정확히는 경고 없음). Reference: 네이티브 `src/api/services/treatment.ts:6-7`(MAX_PAGES 선례), 예전 `28c87a9:src/manager/pages/treatment/treatmentListPage.tsx:23-135`(100건 한도, 버리는 선례). 범위가 바뀌면 이전 조회는 `signal`로 취소된다.
- 이벤트: `eventContent`로 상태 아이콘(`aria-hidden`) + 시각(`HH:mm`, `tabular-nums`, `status-*-fg`) + 고객명(`foreground`)을 그리고, 상태 라벨 글자는 쓰지 않는다(결정 15). 일정 요소의 접근 이름은 `"<라벨> · HH:mm · <고객 이름>"`이고, ui-core `Tooltip`으로 같은 글을 마우스·포커스 설명으로 보인다. 캘린더 툴바 아래에 범례(아이콘 + 라벨 5종, `STATUS_ORDER` 순서)를 둔다. `className`으로 `status-*-bg` 면과 3px `border-inline-start` 레일(system.md §12 캘린더 이벤트 규칙). 이벤트 색 변수(`--fc-event-color`, `--fc-event-contrast-color`)도 상태 클래스에서 채운다.
- 동작: 이벤트를 누르면 예약 대화상자(수정, `lg`). 빈 칸을 누르거나 끌어서 고르면 그 시각으로 채운 등록 대화상자. 빈 칸은 키보드로 고를 수 없으므로 PageHeader의 주요 동작 "예약 추가"를 키보드 경로로 둔다. 끌어 놓기 일정 변경(`editable`)은 범위 밖이다(§M).
- 예약 대화상자(`ReservationFormModal`, `lg` 720px): 고객(전화번호부 원격 검색 Combobox, 없으면 "직접 입력"으로 이름·전화번호), 일시(DateTimePicker), 시술 항목 목록(세부 항목 선택 → 가격·소요 시간 자동 채움 후 NumberInput으로 수정, 회차, 추가·삭제), 결제 수단(Select), 메모(Textarea), 상태(등록 때 예약됨 고정, 수정 때 전환 컨트롤). 필드 7개라 대화상자에 담는다(system.md §10 "8개 초과면 전체 페이지").
- 시험: FullCalendar가 jsdom에서 그려지는지 확인되지 않았다(research.md 9절). 범위 계산·쪽 반복·이벤트 변환·상태 클래스는 순수 함수 단위 시험으로, 화면은 렌더링 연기(smoke) 시험 하나로 확인한다. jsdom에서 그려지지 않으면 FullCalendar를 시험 대역으로 바꾸고 실제 렌더링은 사용자 검토 UR-5에서 본다.

### B.7 목록 화면 공통(고객·메뉴·이력)

- 구성: PageHeader → 목록 패널[툴바(검색 288px·필터 …… 보조 동작) → Table → 바닥("총 N명" …… Pagination)] → 로딩(SkeletonGroup)·빈 상태(EmptyState)·오류(destructive Alert + "다시 시도"). Reference: design-direction.md §14.3, system.md §10.
- **URL 상태**: 검색어 `q`, 쪽 `page`, 필터(`status`, `from`, `to`, `order`, `menu`)를 URL 쿼리에 둔다. 새로고침·뒤로 가기에도 유지된다(system.md §10). `useSearchParams`, 쓰기는 `replace`.
- **검색 디바운스**: 입력은 바로 보이고, 300ms 동안 입력이 멈추면 URL의 `q`를 바꾸고 1쪽으로 돌아간다(`src/lib/use-debounced-value.ts`). 예전 150ms보다 길게 잡아 한글 조합 중 요청을 줄인다 **(기본값)**.
- **이전 요청 취소**: 필터를 빠르게 바꾸면 TanStack이 이전 쿼리의 `signal`을 끊는다(§B.1). 화면에는 마지막 결과만 보이고 `placeholderData`로 이전 결과를 유지해 깜빡임을 줄인다.
- **고객**: 열 이름·연락처·그룹·메모·등록일·동작(수정·삭제 아이콘 버튼, `aria-label`). 쪽 크기 20. 서버에 정렬 매개변수가 없으므로 정렬하지 않는다(예전의 '현재 쪽만 정렬'은 오해를 부르므로 버린다) **(기본값)**. 등록·수정은 `md` 대화상자(이름·전화번호 2열, 그룹 Combobox `createAction`, 메모). 전화번호는 하이픈을 뺀 숫자 9~11자리를 받고 정규화는 백엔드에 맡긴다. 삭제는 destructive `showConfirm` 뒤 토스트.
- **시술 메뉴**: 한 화면에 메뉴 표와 선택한 메뉴의 세부 항목 표를 함께 둔다(`?menu=<id>`). 행 전체 클릭이 금지라(system.md §8) 메뉴 이름 옆 "세부 항목 보기" 버튼으로 고른다. 백엔드에 메뉴 단건 조회가 없어 이름을 목록에서 가져와야 하므로 별도 상세 경로보다 이 구성이 단순하다. 메뉴 대화상자(이름), 세부 항목 대화상자(이름, 소요 시간 분, 가격 원 — 2열, 둘 다 1 이상: `app/schemas/treatment_menu.py:10-21`).
- **시술 이력**: 툴바에 DateRangePicker(기본 이번 달 1일~말일), 상태 Filter(전체·예약됨·방문함·완료·취소됨·노쇼, 글자만), 검색(고객명·전화번호·시술 항목 — 백엔드 검색 대상, `app/crud/treatment_crud.py:79-99`). 열: 예약 일시, 고객, 연락처, 시술 항목, 금액(항목 가격 합, 오른쪽·`tabular-nums`·"원"), 결제, 상태(StatusBadge) + 행 레일. 예약 일시 머리글로 오름·내림 정렬(`sort_by=reserved_at`, `sort_order`). 쪽 크기 20. 행 동작 "예약 보기"는 M7에서 예약 대화상자가 생긴 뒤 붙인다.

### B.8 고객 CSV 내보내기

- 범위: 현재 검색어에 맞는 **전체 고객**(예전은 현재 쪽만). `size=100`으로 첫 응답의 `pages`까지 쪽을 돌며 모은다. 쪽 수 상한은 두지 않는다(매장 고객 수가 수천 명 이하라는 판단 **(추론)**, 캘린더의 20쪽 상한과 다름). 한 쪽이라도 실패하면 파일을 만들지 않는다. 버튼은 진행 중 `loading`.
- 형식(`src/lib/csv.ts`): RFC 4180 — 쉼표·큰따옴표·CR·LF가 든 값은 큰따옴표로 감싸고 안의 큰따옴표는 두 번 쓴다. 줄 끝 CRLF, UTF-8 BOM(엑셀 한글). 열: 이름, 연락처, 그룹, 메모, 등록일(KST `YYYY-MM-DD`).
- **수식 주입 방지**: 값이 `=`, `+`, `-`, `@`, 탭, CR로 시작하면 앞에 `'`를 붙인다(OWASP CSV Injection 권고) **(추론에 기댄 기본값 — 메모가 `-`로 시작하면 `'`가 보인다)**. 앞 공백이 있는 값과 전각 `＝`로 시작하는 값은 바꾸지 않는다(정한 정책, acceptance.md §3.5).
- 내려받기: `Blob` + `URL.createObjectURL` + `<a download="고객목록_YYYY-MM-DD.csv">` 클릭 + `revokeObjectURL`. file-saver를 쓰지 않는다. Reference: `28c87a9:src/manager/pages/customers/CustomerList.tsx:46-62`(버리는 선례).

### B.9 미리보기 개발 전용 경로

- `src/app/dev-routes.ts`가 **모듈 범위에서** `export const devRoutes = import.meta.env.DEV ? [{ path: "/dev/preview", lazy: () => import("@/preview/route") }] : []`를 정하고, `createRoutes({ devRoutes })`가 그 목록을 받는다. 앱은 `devRoutes`를, 운영 경로 시험은 빈 목록을 넘긴다. 운영 빌드에서 상수가 `false`로 바뀌면 `import()` 자체가 죽은 코드가 되어 청크가 생기지 않는다 **(추론, Vite 상수 치환 + 죽은 코드 제거)**. 함수 인자로 판단을 넘기면 도달 가능한 동적 가져오기가 남아 Rolldown이 청크를 만들 수 있으므로 쓰지 않는다.
- 확인은 빌드 산출물 검사로 한다: `dist`의 JS 파일에 미리보기 제목 "컴포넌트 미리보기"(src/preview/PreviewPage.tsx:47)와 시연 클래스 `bg-rose-700`이 없어야 한다(QG-18, acceptance.md §4.1 블록). CSS는 테마 정리로 원래 그 규칙이 없어 판정에 쓰지 않는다.
- 미리보기 소스·시험·QG-07(시연 허용 구역)은 그대로 둔다. 새 ui-core 컴포넌트 4개도 전시 목록에 더한다.

### B.10 환경 변수 타입과 개발 프록시

- `src/vite-env.d.ts`에 `interface ImportMetaEnv { readonly VITE_API_BASE_URL?: string }`를 더한다. 코드에서는 `src/app/env.ts`만 이 값을 읽는다.
- 운영 빌드 검사: `vite build`(모드가 `development`가 아닐 때)에서 `VITE_API_BASE_URL`이 없거나, `new URL(값)`으로 해석되지 않거나, 프로토콜이 `https:`가 아니거나, 호스트가 비면 변수 이름을 담은 오류로 빌드를 실패시킨다(Vite 플러그인, §B.11과 같은 파일). 접두사 검사만으로는 `https://`·`https://a b`가 통과해 뒤의 CSP 플러그인에서 늦게 깨지기 때문이다.
- 앱 기준 주소: `src/app/env.ts`가 개발 서버이면 `/api`, 운영 빌드이면 `VITE_API_BASE_URL`을 돌려준다. 시험할 수 있게 env 객체를 받는 순수 함수로 둔다(AC-UI-002-03).
- 개발 프록시(`vite.config.ts` `server.proxy`): `/api` → 대상 `DEV_API_PROXY_TARGET`(기본 `http://localhost:8000`), `changeOrigin: true`, 접두사 `/api` 제거(백엔드 경로는 루트에서 시작 — research.md 2.5). 대상 변수는 `VITE_` 접두사를 쓰지 않아 브라우저 코드에 노출되지 않는다. `loadEnv(mode, cwd, "")`로 읽는다.
- 운영 API를 대상으로 개발하면 실제 매장 데이터가 바뀐다(인터뷰 기본값의 이유). 대상이 `localhost`가 아니면 개발 서버 시작 때 경고를 한 줄 찍는다 **(기본값)**.
- 프록시 경유 시 쿠키는 개발 서버 호스트(`localhost`) 전용이 되고, `Secure` 쿠키를 `http://localhost`에서 저장하는지는 브라우저 정책에 달려 있다 **(추론, 사용자 검토 UR-1)**.
- 예시 파일 두 개를 저장소에 커밋한다. 비밀과 접속 정보는 담지 않는다.
  - `.env.example`(개발용): `DEV_API_PROXY_TARGET=http://localhost:8000` 한 줄과 설명 주석. 이 값은 비밀이 아닌 개발 기본값이다.
  - `.env.production.example`(운영 배포용): `VITE_API_BASE_URL=https://api-beauty.dongri.kr`(결정 1 — 브라우저 번들에 그대로 들어가는 공개 값이라 예시 파일에 적는다)와 `SCP_USER=`, `SCP_HOST=`, `SCP_DIR=`, `SCP_PORT=`(이름만 — 접속 정보는 각자의 `.env.production`에만 둔다). 주석으로 `VITE_API_BASE_URL`은 Vite가, `SCP_*`는 `deploy.sh`가 읽는다는 것과 `VITE_` 접두사가 없는 값은 브라우저 번들에 들어가지 않는다는 것을 적는다. §P-8은 이 파일을 복사해 `SCP_*`만 채운다.
  - `.gitignore`가 `.env.*`를 막으므로 `!.env.example`, `!.env.production.example` 예외를 더한다(`.gitignore:27-28`). 실제 `.env.production`은 계속 무시 목록에 남는다. 로컬 `.env`의 죽은 주소는 각자 고친다(저장소 밖 파일).
- **임시 작업 트리의 빌드**: 구현은 `.env`가 없는 임시 작업 트리에서 이루어진다(C3). 운영 빌드 검사가 들어간 뒤로 그곳의 `npm run build`는 `VITE_API_BASE_URL`이 없어 실패하는 것이 맞는 동작이다. 그래서 검증용 빌드(QG-04·QG-17·QG-18)는 환경 변수로 값을 넘겨 실행한다: `VITE_API_BASE_URL=https://api-beauty.dongri.kr npm run build`, 그 뒤 같은 값으로 `VITE_API_BASE_URL=https://api-beauty.dongri.kr npm run check:dist`(`check:dist`는 이 값과 `connect-src`를 비교한다). 주 체크아웃의 로컬 `.env`에 예전 주소가 남아 있어도 명령 앞에 넘긴 값이 우선한다. 빌드 산출물 검사 시험은 시험용 값(예: `https://api.test`)을 스스로 넘긴다. pre-commit `moai gate`가 빌드 단계를 실행해 커밋을 막는지는 M1 사전 점검에서 확인하고, 막으면 blocker로 보고한다(게이트를 건너뛰지 않는다, §J R18).

### B.11 CSP

- 운영 빌드 HTML에만 넣는다. 개발 서버는 HMR·React Refresh 인라인 스크립트를 쓰므로 같은 정책이면 깨진다 **(추론)**.
- 방식: 루트 `vite-plugins.ts`의 `cspPlugin()`이 `transformIndexHtml`(빌드 전용, 마지막 순서)에서 최종 HTML의 **인라인 스크립트를 모두 찾아 sha256을 계산**하고 `<meta http-equiv="Content-Security-Policy">`를 `<meta charset>` 바로 뒤에 넣는다. 테마 스크립트를 고쳐도 해시를 손으로 바꿀 필요가 없다(후속 과제 5의 위험 "스크립트를 고치면 해시가 바뀐다"를 없앤다). Reference: `index.html:7-30`, research.md 3.5(현재 해시 `sha256-S1F25ficNeSo4lM6NGm6yDuu5D/Lrale0TY4wbYWbbs=`).
- 정책 초안:

  ```text
  default-src 'self';
  script-src 'self' 'sha256-<빌드 때 계산>';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  font-src 'self';
  connect-src 'self' <VITE_API_BASE_URL의 origin>;
  object-src 'none';
  base-uri 'self';
  form-action 'self'
  ```

- **스타일 정책을 보수적으로 두는 이유**: Radix Dialog 아래 `react-style-singleton`이 런타임에 `<style>`을 만들고(research.md 3.5), 정적 호스팅이라 요청마다 nonce를 줄 수 없다. FullCalendar 7은 런타임 `<style>`을 넣지 않지만 그것만으로 `'unsafe-inline'`을 뺄 수 없다(모순 7). 스크립트 정책이 엄격하므로 남는 위험은 CSS 주입 수준이다. 더 엄격한 정책(`style-src-elem`·`style-src-attr` 분리)은 사용자 검토 UR-3의 브라우저 시험 결과로 후속 과제에서 정한다.
- meta CSP로는 `frame-ancestors`를 줄 수 없다(research.md 4.6). 클릭재킹 방지는 배포 서버 헤더(`Content-Security-Policy: frame-ancestors 'none'` 또는 `X-Frame-Options: DENY`)로 해야 하며 이 저장소 밖 설정이다. 배포 서버(nginx 1.30.6 컨테이너)의 다른 사이트가 이미 서버 수준 `add_header`로 HSTS, `X-Frame-Options DENY`, `frame-ancestors 'none'`(Report-Only), `nosniff`, `Referrer-Policy`를 쓰므로 같은 방식으로 설정할 수 있다(결정 12, research.md 2.9). 설정 작업은 §P 점검표에 있고 이 SPEC 범위 밖이다.
- 시험: 고정 HTML로 플러그인 단위 시험(메타 위치·해시·`connect-src`), 빌드 뒤 `scripts/check-dist.mjs`가 `dist/index.html`의 해시와 실제 인라인 스크립트 해시가 같은지 확인(QG-17).

### B.12 배포

- **배포 대상과 빌드 모드**(결정 13): `deploy.sh`는 운영 서버에 올린다. 빌드는 `npm run build -- --mode production`, 배포 값 파일은 `.env.production`이다(`.env.stage`를 쓰지 않는다).
- **안전한 `.env.production` 읽기**(후속 과제 3): `.`(source)를 없애고 한 줄씩 읽는다. 줄 끝 CR을 지우고, 빈 줄·`#` 주석을 건너뛰고, 첫 `=`로 나눠 이름이 `SCP_USER|SCP_HOST|SCP_DIR|SCP_PORT`일 때만 `printf -v`로 값을 넣는다(같은 이름이 또 나오면 뒤의 값이 이긴다). 양끝이 같은 따옴표일 때만 한 겹 벗기고 그 밖의 값은 글자 그대로 둔다(명령 치환·변수 확장 없음). 허용 목록 밖의 이름(`VITE_API_BASE_URL`, `export SCP_USER` 같은 줄 포함)은 조용히 건너뛴다. `deploy.sh`는 bash 내장 명령과 `npm`·`scp`만 쓴다(시험의 PATH에는 대역 `npm`·`scp`만 있으므로 `tr`·`sed`·`dirname` 같은 바깥 명령을 쓰면 시험에서 찾지 못한다). `SCP_PORT`는 숫자만 받는다. 파일이 없거나 필수 값이 없거나 `SCP_PORT`가 숫자가 아니거나 `SCP_USER`·`SCP_HOST`·`SCP_DIR` 값이 `-`로 시작하면(`scp` 옵션으로 읽히는 것을 막는 보강) 원인 이름을 출력하고 빌드 전에 멈춘다. `@MX:WARN` 주석은 코드 뒤가 아니라 자기 줄에 둔다(주석 제외 검사가 주석 줄만 뺀다). Reference: `deploy.sh:12-20`.
- `VITE_API_BASE_URL`은 deploy.sh가 읽지 않는다. `--mode production`일 때 Vite가 `.env.production`에서 직접 읽는다(Vite 모드별 env 파일 규칙). 같은 파일의 `SCP_*`는 `VITE_` 접두사가 없어 브라우저 번들에 들어가지 않는다. 값이 없거나 `https://`가 아니면 운영 빌드 검사(§B.10)가 빌드를 멈춘다.
- 시험: 지금의 임시 디렉터리 + 대역 `npm`·`scp` 방식을 유지한다(PATH에는 대역 디렉터리만). 그래서 주입 표본은 바깥 명령(`touch`) 대신 내장 명령만 쓴다 — `$(: > pwned)`, `` `echo x > pwned2` ``, 값 안의 `$(: > pwned3)`. 바깥 명령을 쓰면 취약한 스크립트에서도 "명령을 찾을 수 없음"으로 표시 파일이 안 생겨 시험이 실패할 수 없다. 양성 대조로 일부러 `source`하는 사본을 표본마다 따로 실행해, 그 표본이 담은 표시 파일을 만드는지 확인한다(첫 표본 → `pwned`·`pwned2`, `SCP_DIR` 줄만 바꾼 둘째 표본 → `pwned`·`pwned2`·`pwned3`, acceptance.md AC-UI-002-25 (나)). 대역 `npm`은 인자를 기록한 뒤 고정 산출물 `dist/index.html`·`dist/assets/a.js`를 만들고, 대역 `scp`의 기대 인자는 `-P`·`2222`·`-r`·`./dist/assets`·`./dist/index.html`·대상이다. 대역은 인자를 `printf '%s\n' "$@"`로 한 줄에 하나씩 적어 띄어쓰기 경계를 판정한다. 허용 목록 밖 `EVIL=1`, `VITE_API_BASE_URL=https://api.test`, 따옴표 값, 공백 든 값, CRLF 줄, 같은 이름 두 번, `export ` 줄을 넣는다. 필수 값 4개 표·파일 없음·숫자가 아닌 포트·`-` 값은 각각 대역 호출 없이 0이 아닌 코드로 끝나야 한다. 시험은 작업 트리의 `deploy.sh`를 복사한다. Reference: `src/test/deploy-guard.test.ts:31-74`(대역 구성 선례, `:60` PATH 구성).
- **시험 파일 이름 변경**(필수): M8 읽기 커밋에서 `git mv src/test/deploy-guard.test.ts src/test/deploy-script.test.ts`로 바꾼다. 이 커밋부터 QG-13은 새 이름으로 판정한다.
- **가드 제거**(C6): M8의 마지막 run 단계 커밋에서 `deploy.sh:3-9`의 `ALLOW_PREVIEW_ONLY_DEPLOY` 분기를 지우고 시험을 "가드 없음 + 안전한 읽기"로 바꾼다. 앞선 모든 인수 기준과 품질 게이트가 통과한 뒤에만 하며, 이 커밋 자체가 AC-UI-002-25와 QG-01~QG-18을 통과해야 한다. `git log -S ALLOW_PREVIEW_ONLY_DEPLOY -- deploy.sh`로 이 커밋을 확인한다.
- 실제 배포(scp 전송)는 이 SPEC의 검증 범위가 아니다. 운영에 올리기 전에 §P 점검표(서버 블록·정적 파일 마운트·DNS·백엔드 CORS)를 먼저 끝내야 한다. 가드를 지운 뒤 점검표 전에 `deploy.sh`를 실행하면 파일은 올라가지만 아무도 그 파일을 내주지 않는다.

### B.13 앱 셸과 공개 화면

- **셸**(`src/app/shell/`): 사이드바(240/64px, `card`) + 상단바(56px, 위쪽 고정) + 본문(여백 24/32px, 최대 폭 1280px, 캘린더는 해제). Reference: system.md §10, design-direction.md §14.1.
  - 상단바 왼쪽: 사이드바 접기 버튼(768px 미만에서는 서랍 열기), 이동 경로(Breadcrumb). 오른쪽: 오늘 날짜(예: 2026-11-09이면 "11월 9일 (월)"), ThemeToggle, 사용자 메뉴.
  - **사용자 메뉴**: 새 ui-core `Popover` 안에 이름·역할(`role_name`)·이메일, "매장 변경", "로그아웃" 버튼. 항목이 둘뿐이라 메뉴 역할(roving focus) 컴포넌트나 `@radix-ui/react-dropdown-menu`를 들이지 않는다 **(기본값)**.
  - 사이드바 머리: 매장 머리글자 표시 + 매장명 + "매장 변경". 메뉴 묶음 "예약"(예약 캘린더, 시술 이력), "관리"(고객, 시술 메뉴).
  - **반응형**: 1024px 이상은 사용자 선택(펼침 기본)을 `localStorage` `kmc-admin-sidebar`에 저장하고 따른다. 768~1023px은 들어올 때마다 접힘으로 시작하고 바꿔도 저장하지 않는다. 768px 미만은 사이드바를 숨기고 메뉴 버튼으로 새 ui-core `Drawer`를 열며, 이동하면 서랍을 닫는다. 저장소 접근 예외는 테마 저장처럼 삼킨다. Reference: `index.html:12-18`(저장소 예외 처리 선례).
  - "본문으로 건너뛰기" 링크 → `#main`. 페이지마다 h1 하나(PageHeader 기본값).
- **로그인**: 가운데 카드, 이메일(`autocomplete="username"`)·비밀번호(`current-password`), 제출 `loading`. 401 "이메일이나 비밀번호가 맞지 않아요.", 429 "로그인 시도가 많아요. 1분 뒤 다시 시도해 주세요."(로그인 분당 5회 — `app/api/auth.py:35`), 네트워크 오류 문구. 성공하면 `GET /shops/selected` 결과에 따라 규칙을 통과한 `next` 또는 `/reservations`(매장 있음), `next`를 그대로 실은 `/shops`(매장 없음)로 간다. 빈 칸·형식 오류(acceptance.md §3.2 이메일 규칙)는 요청 없이 첫 오류 필드로 포커스. 기본 계정 값을 넣지 않는다(`28c87a9:src/manager/pages/auth/LoginPage.tsx:7-8`의 문제를 옮기지 않음). 약관·개인정보 링크.
- **매장 선택**: 카드 버튼 목록(이름, 주소 + 상세 주소, 등록일), 현재 선택 매장 표시, 로딩·빈 상태("등록된 매장이 없어요. 매장은 kmcbeauty 앱에서 만들 수 있어요.")·오류. 100개가 넘으면 Pagination.
- **약관·개인정보**: 예전 문구(`28c87a9:src/manager/pages/policy/TermsOfServicePage.tsx`, `PrivacyPolicyPage.tsx`)를 그대로 옮기고 PageHeader + 본문 서식으로 그린다. 문구 수정은 범위 밖이다.
- **404**: "찾을 수 없는 페이지예요." + 첫 화면 링크. 예전 앱에 없던 화면이지만 경로 표의 빈칸을 막는 최소 화면이다 **(기본값)**.

---

## §C 새 패키지(고정 버전)

`npm view`로 2026-11-09에 확인한 버전이다(research.md 4.1). 모두 범위 기호 없이 고정한다. 정본 목록은 acceptance.md §3.4다.

| 구분 | 패키지 | 버전 | 이유 | 참고: 이전 메이저 줄(정보) |
|---|---|---|---|---|
| dependencies | `react-router` | 8.5.1 | 경로·loader 보호·`lazy`. v8은 `react-router-dom`이 없다 | 7.18.5(v7 줄) |
| dependencies | `@tanstack/react-query` | 5.107.1 | 서버 상태, 취소 signal, 무효화 | — |
| dependencies | `@fullcalendar/react` | 7.1.4 | 예약 캘린더. 플러그인·로케일·테마가 하위 경로로 들어 있다 | 6.1.22 + `@fullcalendar/{core,daygrid,timegrid,interaction}` 6.1.22(v6 줄 — 런타임 `<style>` 주입, 테마 변수 이름이 v7과 다름) |
| dependencies | `temporal-polyfill` | 1.0.8 | FullCalendar 7 필수 peer(`^1.0.7`) | v7 전용 |
| dependencies | `openapi-fetch` | 0.17.0 | 스키마 타입 기반 fetch 클라이언트, 미들웨어. 1.0 전 버전이라 정확히 고정한다 | — |
| devDependencies | `openapi-typescript` | 7.13.0 | 스냅숏 → `schema.d.ts` 생성(peer typescript ^5.x — 5.9.3 충족) | — |
| devDependencies | `msw` | 3.0.4 | 시험의 HTTP 대역(`msw/node`). node ≥22.12.0 | 2.15.0(v2 줄) |

- 결과: dependencies 20 → 25, devDependencies 17 → 19. `engines.node`를 `^22.22.0 || ^24.0.0`으로 올린다(react-router 8의 `node >=22.22.0`).
- peer 확인: react-router 8은 react·react-dom ≥19.2.7(현재 19.3.1), @types/react·react-dom ≥19.2.0(현재 19.3.0). FullCalendar 7은 react ^19 허용. MSW의 vite·graphql·typescript peer는 선택이다. 막힘은 찾지 못했다.
- **이전 줄 전환 규칙(C5)**: 위 표의 "참고: 이전 메이저 줄" 열은 조사 기록일 뿐 미리 승인된 대안이 아니다. 사전 점검에서 새 줄로 막히면 바꾸지 말고 그 마일스톤을 멈춰 blocker로 보고한다 → 사용자 승인 → manager-spec이 REQ-UI-002-001, acceptance.md §3.4, QG-12, §E E-3(FullCalendar라면 테마 변수 대응표)을 함께 개정한 뒤에만 이어 간다. FullCalendar 6으로 바꾸면 E-3의 `--fc-monarch-*` 대응표와 CSP 스타일 판단이 모두 달라지므로 개정 없이는 진행할 수 없다.
- **넣지 않는 것**: zustand(위 §B.1 — 필요한 상태가 없다), file-saver(§B.8), axios, @headlessui, `@tanstack/react-table`(ui-core Table로 충분), react-hook-form·zod(§B.5), 시간대 라이브러리(§B.4 — Intl로 충분), `@radix-ui/react-dropdown-menu`(§B.13), Orval(결정 8), TanStack Query Devtools, Playwright(§I).
- 이 밖의 패키지가 필요해지면 같은 C5 절차(blocker → 사용자 승인 → manager-spec 개정)를 거친다.

---

## §D ui-core와 앱 계층의 경계, 잠금 시험·게이트 변경

### D.1 ui-core에 더하는 공개 컴포넌트(도메인을 모르는 범용 부품)

| 컴포넌트 | 파일 | 기반 | 쓰는 곳 | 비고 |
|---|---|---|---|---|
| `DateRangePicker` | `date-range-picker.tsx` | `@radix-ui/react-popover` + `Calendar` 범위 모드 | 시술 이력 | react-day-picker는 `calendar.tsx` 밖에서 못 쓰므로(`design-rules.test.ts:441-444`) `Calendar`에 `mode: "range"`를 더하고 이 컴포넌트는 `Calendar`를 쓴다. 값 `{ from, to } \| null`, 선택 프리셋(앱이 넘김), Esc로 닫기, 닫힌 뒤 트리거로 포커스 |
| `NumberInput` | `number-input.tsx` | `Input` | 세부 항목·예약 항목 가격·소요 시간 | 천 단위 쉼표 표시, 숫자 값(`number \| null`) 반환, `min`·`max`, 단위 부가 표시, `inputMode="numeric"`, 붙여넣기 숫자만, 커서 위치 유지 |
| `Drawer` | `drawer.tsx` | `@radix-ui/react-dialog` | 768px 미만 사이드바 | 왼쪽 시트, 포커스 가두기, Esc·스크림으로 닫기, 감속 모드 존중 |
| `Popover` | `popover.tsx` | `@radix-ui/react-popover` | 사용자 메뉴 | `trigger` + 내용 하나의 단순 API. SPEC-UI-001에서 뺀 "공개 Popover"를 이번에 연다 |

- `Calendar`는 공개 이름을 늘리지 않고 prop을 넓힌다(`mode` 판별 유니언). 새 타입 `DateRange`를 내보낸다.
- 결과: 공개 런타임 이름 40 → **44**, 컴포넌트 파일 29 → **33**. 새 패키지는 없다(기존 Radix 패키지 재사용).
- 후속 과제 7·8·9의 공용 코드는 `src/ui-core/internal/*.ts`(비공개, `.ts`라 파일 수 검사 밖 — research.md 3.8)에 둔다.

### D.2 앱 계층에 두는 것

```text
src/
├─ app/            진입 조립: routes.tsx, dev-routes.ts, safe-next.ts, loaders.ts, providers.tsx, env.ts, RouteError.tsx,
│                  NotFoundPage.tsx, PublicLayout.tsx
│  └─ shell/       AppShell.tsx, TopBar.tsx, NavSidebar.tsx, AccountMenu.tsx, RouterLink.tsx, use-sidebar-state.ts
├─ api/            client.ts, session.ts, errors.ts, query-client.ts, query-keys.ts, schema.d.ts(생성)
├─ features/
│  ├─ auth/        LoginPage.tsx, queries.ts
│  ├─ shops/       ShopSelectPage.tsx, queries.ts
│  ├─ customers/   CustomersPage.tsx, CustomerFormModal.tsx, export-csv.ts, queries.ts
│  ├─ treatment-menus/ TreatmentMenusPage.tsx, MenuFormModal.tsx, DetailFormModal.tsx, queries.ts
│  ├─ treatments/  TreatmentHistoryPage.tsx, queries.ts
│  ├─ reservations/ status.ts, StatusBadge.tsx, StatusChangeControl.tsx, ReservationCalendarPage.tsx,
│  │               calendar-events.ts, calendar-theme.css, ReservationFormModal.tsx, queries.ts
│  └─ legal/       TermsPage.tsx, PrivacyPage.tsx
├─ preview/route.tsx  미리보기 경로 모듈(dev-routes.ts가 개발 서버에서만 lazy로 가져옴)
└─ lib/            form.ts, csv.ts, download.ts, kst-date.ts, use-debounced-value.ts, use-media-query.ts,
                   use-persisted-state.ts, external-store.ts, money.ts
```

- 예약 상태 키·라벨·아이콘·토큰은 `features/reservations/status.ts`에만 있다(C8). StatusBadge·전환 규칙·캘린더 이벤트 변환이 이 모듈을 쓴다.
- 앱 코드는 ui-core를 `@/ui-core`로만 가져온다(하위 경로·`internal` 금지).

### D.3 잠금 시험과 품질 게이트 변경

게이트의 정본 명령·통과 조건·적용 시점은 acceptance.md §4와 §4.1 블록이다. 이 표는 무엇이 언제 바뀌는지만 적는다.

| 대상 | 지금 | 바꾼 뒤 | 마일스톤 |
|---|---|---|---|
| `dependency-pins.test.ts` 고정 목록(:13-55)과 개수(:95-98) | 20 + 17 | 25 + 19(acceptance.md §3.4), `engines.node` 단언 추가 | M1 |
| `design-rules.test.ts` `PUBLIC_NAMES`(:14-55, :412-417) | 40 | 44(+DateRangePicker, Drawer, NumberInput, Popover) | M3 |
| `COMPONENT_FILES`(:58-88, :423-428) | 29 | 33(+4 파일) | M3 |
| `BASE_LIBRARIES`(:91-107) | 15행 | +`drawer.tsx`→`@radix-ui/react-dialog`, `popover.tsx`·`date-range-picker.tsx`→`@radix-ui/react-popover` | M3 |
| 금지 패턴 검사 대상(:359-361) | ui-core, preview | + `src/app`, `src/api`(생성 파일 제외), `src/features`, `src/lib` | M1(규칙 확장), 이후 자동 |
| 가져오기 규칙(:446-449 `checkPreviewImports`) | 미리보기만 | 앱 코드 전체에 같은 규칙(`@/ui-core`만 — 하위 경로·`internal`·상대 경로·재내보내기·동적 가져오기 금지, AC-UI-002-04 표본 7개) | M1 |
| 전역 CSS 클래스 선택자(:404) | index.css만 | 그대로. 캘린더 테마는 `features/reservations/calendar-theme.css`에 두고 `calendar-theme.test.ts`가 선택자 범위(`.kmc-calendar`)와 토큰 사용을 따로 고정 | M7 |
| QG-05 커버리지(`vite.config.ts:20-28`) | `src/ui-core/**`, 85/85/85/80 | 포함 `src/**/*.{ts,tsx}` + `vite-plugins.ts`, 제외는 AC-UI-002-04 목록(`scripts/*.mjs`는 자식 프로세스라 포함하지 않음), 보고 형식 `text`·`json`·`json-summary`. 기준값은 `vite.config.ts` 하나: M1~M7 커밋 80/80/80/80, M8 마지막 커밋 85/85/85/80. `coverage-config.test.ts`가 단계별 값을 단언 | M1, M8 |
| QG-06 토큰·대비 | 두 시험 | M7부터 `calendar-theme.test.ts`를 함께 실행 | M7 |
| QG-07 시연 허용 구역 | 유지 | 유지 + QG-18과 함께 빌드 검사 | M8 |
| QG-11 도메인 경계 | ui-core에 상태 키 0건 | 그대로 + 도메인 모듈 양성 확인 5종 + 라벨 글자가 `status.ts`에만 있는지 검사 | M1(경계), M6(양성·라벨) |
| **QG-12 옛 의존성** | 글자 검색으로 `react-router`·`@fullcalendar` 전체 금지 | 모듈 지정자(`from`·`import`·`import()`·`require()`) 검사 + `package.json` 의존성 키 검사(acceptance.md §4.1 QG-12 블록이 정본 명령). 주석·문서의 낱말은 판정하지 않는다. react-router 8과 `@fullcalendar/react`(v7 하위 경로)는 허용 | M1 |
| QG-13 배포 스크립트 | `deploy-guard.test.ts` | M8 읽기 커밋에서 `git mv src/test/deploy-guard.test.ts src/test/deploy-script.test.ts`(필수 — 이 커밋이 옛 파일을 지운다)와 가드 + 안전한 읽기 시험 → 마지막 커밋에서 가드 없음 + 안전한 읽기 시험, 주석 제외 검사, 가드 제거 커밋 확인 | M8 |
| QG-08·QG-15 잠금 수 | 40·29 / 29개 | M3부터 44·33 / 33개(M1~M2는 그대로) | M3 |
| **QG-16(신규) 스키마 동기** | — | `openapi-typescript` CLI를 `api:types`와 같은 옵션으로 다시 실행한 결과가 커밋된 `schema.d.ts`와 같다. 스냅숏 머리 값(3.1.0, 경로 31, API 50, 스키마 58)도 확인 | M1 |
| **QG-17(신규) CSP** | — | `VITE_API_BASE_URL=https://api-beauty.dongri.kr npm run build` 뒤 같은 env로 `npm run check:dist` — `dist/index.html`의 CSP 해시가 실제 인라인 스크립트 해시와 같고 `connect-src` origin이 env 값과 같다 | M8 |
| **QG-18(신규) 개발 전용 경로** | — | 같은 빌드 뒤 `check:dist`(미리보기 부분)와 JS 파일 검사 — `dist`의 JS에 "컴포넌트 미리보기"·`bg-rose-700`이 없다(CSS 검사는 쓰지 않는다: 테마 정리로 CSS에는 원래 그 규칙이 없다) | M4(검사 도입), M8(최종) |
| 시간대 고정 | 없음 | `vite.config.ts` `test.env.TZ = "Asia/Seoul"` + `timezone.test.ts`(`TZ=UTC`로 실행해도 통과) | M1 |
| `api:check`(선택, 로컬 전용) | — | 백엔드에서 임시 파일로 다시 내보내 스냅숏과 비교한다(드리프트 감지 전용 — 스냅숏을 고치지 않는다). CI에는 백엔드가 없어 넣지 않는다 | M1 |
| biome 제외(`biome.json` `files.includes`) | — | `!openapi`, `!src/api/schema.d.ts` 추가(생성 파일) | M1 |

npm 스크립트 추가: `api:export`(`node scripts/export-openapi.mjs [--out <경로>]` — 기본 출력은 `openapi/openapi.json`, 백엔드 폴더는 `KMC_BACKEND_DIR`, 기본 `../kmcbeauty-fastapi`), `api:types`(`openapi-typescript openapi/openapi.json -o src/api/schema.d.ts`), `api:sync`(둘을 차례로 — 스냅숏을 바꾸는 유일한 명령이며 §J R3의 blocker 절차 뒤에만 쓴다), `api:check`(`--out`으로 임시 파일에 내보내 비교), `check:dist`(`VITE_API_BASE_URL`을 읽어 비교 — M4~M7은 미리보기 부분만, M8부터 CSP 포함). 내보내기 스크립트는 research.md 2.5의 검증된 명령과 같은 환경 변수(`PYTHONDONTWRITEBYTECODE=1`, `SENTRY_DSN=`, `LOG_TO_FILE=false`, 60초 제한)로 `spawnSync`를 `cwd: KMC_BACKEND_DIR`와 함께 부르고, 표준 출력이 OpenAPI 3.1 문서인지 확인한 뒤 들여쓰기 2칸으로 `--out` 경로 한 곳에만 쓴다. 3.1이 아니면 아무것도 쓰지 않고 0이 아닌 코드로 끝난다. 백엔드 폴더에는 아무것도 쓰지 않는다(C9).

---

## §E 코드보다 먼저 고칠 설계 정본(C1)

정본 순서는 acceptance.md §3 표 → system.md → 코드다(C1). M1의 첫 커밋(문서만)에서 `.moai/design/system.md`를 1.1.0 → 1.2.0으로 고치고, 화면 문구·상태 표·전환 문구는 acceptance.md §3의 글자를 그대로 옮긴다(손으로 다시 쓰지 않는다). design-direction.md는 결정 당시의 기록이라 고치지 않는다.

| # | system.md 위치 | 바꿀 내용 | 이유 |
|---|---|---|---|
| E-1 | §12 금지 2(`:252`) | "홈은 오늘 예약 목록" → "홈은 예약 캘린더(주간 보기)" | 인터뷰 기본값(로그인 뒤 첫 화면 = 캘린더) |
| E-2 | §9(`:206-224`) | acceptance.md §3.1의 상태 표(라벨·아이콘·토큰·뜻 문구, 마침표까지)와 표시 순서, 25칸 전환 표, 되돌리기·바꾸기 제목과 단추 이름, 조사 규칙을 같은 글자로 옮긴다. "아이콘 + 라벨 필수" 규칙(`:219`)에 예외 한 줄을 더한다: "캘린더 일정은 아이콘·범례·설명·접근 이름(`"<라벨> · HH:mm · <고객 이름>"`)으로 대신한다"(결정 15) | §9가 "SPEC-UI-002에서 확정"이라고 적어 둠, 결정 15 |
| E-3 | 새 절(예: §14 캘린더)과 §12 시그니처(`:247`) | FullCalendar 7 테마 선택(Monarch 권장 — 변수 이름 background·foreground·primary·muted·popover가 이 시스템 토큰과 거의 1:1), `--fc-monarch-*` 변수 → 토큰 대응표, `--fc-event-color`·`--fc-event-contrast-color`를 상태 토큰에서 채우는 규칙, 이벤트 레일은 `className`으로, 포커스 링을 box-shadow 대신 `outline`으로 덮어쓰기(고대비 모드), `skeleton.css` → 테마 CSS → 매핑 CSS 가져오기 순서, 매핑 CSS는 `.kmc-calendar` 범위. 일정 내용(아이콘·시각·고객 이름, 상태 라벨 글자 없음), 접근 이름·설명 형식, 범례 위치(툴바 아래, 일정 영역 위). §12의 "항상 상태 배지와 함께 쓰고"를 "목록·표에서는 상태 배지와 함께 쓰고, 캘린더 일정은 §9 예외를 따른다"로 고친다 | research.md 4.5(v6 `--fc-*` 이름은 v7에 없다 — 모순 8), 결정 15 |
| E-4 | §8 컴포넌트 규칙 | DateRangePicker·NumberInput·Drawer·Popover의 모양·키보드·aria 규칙(acceptance.md §3.10 키보드 계약을 옮김), Calendar 범위 모드 표시(시작·끝·사이 날짜의 색 아닌 단서) | 새 공개 컴포넌트 |
| E-5 | §10 레이아웃 | 공개 레이아웃(로그인·매장 선택·약관·404, 셸 없음), 셸 크기 클래스(상단바 `h-14`, 사이드바 `w-(--sidebar-width)`·`w-(--sidebar-width-collapsed)`), 사이드바 접힘 저장 키 `kmc-admin-sidebar`와 768~1023px의 비저장 규칙, 사용자 메뉴 내용, 사이드바 머리의 현재 매장 표시 | 셸 조립 |
| E-6 | §11 문구 | acceptance.md §3.2의 문구 결정 순서(백엔드 `detail.detail` 그대로 보이는 예외 포함), 상태 코드별 문구 전부, "필드별 앱 문구" 표와 "화면별 문구" 표 전부(확인 대화상자 단추 되돌리기·바꾸기·삭제·닫기, 성공 토스트, CSV 실패, 다시 시도 포함), 이메일 형식 규칙을 같은 글자로 옮긴다 | 오류 정규화(§B.1), C1 |
| E-7 | §4 타이포그래피(숫자) | tnum "미검증" 기록 유지, 숫자 열 `tabular-nums` + 오른쪽 정렬, 대체 숫자 글꼴 없음 | 결정 3, C7 |
| E-9 | §11 표기(`:241` 근처) | 시간대 가정 한 줄: 화면 표시와 입력은 브라우저 시간대를 쓰고 한국 시간대 브라우저를 가정한다. 날짜 필터는 KST 날짜(`YYYY-MM-DD`), 보내는 일시는 UTC 오프셋이 있는 ISO 문자열 | §J R10, research.md 2.7 |
| E-8 | §13 변경 기록 | 1.2.0 한 줄(E-1~E-7, E-9를 요약, 이 줄을 마지막에 쓴다) | §13 절차 |

토큰 색 값은 바꾸지 않는다. 따라서 대비 재계산(§13-2)은 필요 없다. E-3의 대응표가 기존 토큰만 쓰는지는 M7의 `calendar-theme.test.ts`(QG-06)로 확인한다. system.md와 acceptance.md §3의 글자가 다르면 acceptance.md를 따르고, 차이는 blocker로 보고해 manager-spec이 맞춘다.

---

## §F 마일스톤

각 마일스톤은 TDD(RED → GREEN → REFACTOR)로 한다. 마일스톤 커밋마다 acceptance.md §4의 **적용 시점**이 그 마일스톤까지 온 게이트를 모두 통과하고(중간 조건 포함), pre-commit 게이트가 돌리지 않는 게이트는 acceptance.md §4.2대로 직접 실행해 증거를 남긴다. 커버리지 기준은 C2의 단계 값(M1~M7 80/80/80/80, M8 마지막 커밋 85/85/85/80)이다. **완료 기준**의 인수 기준은 acceptance.md §1 "판정 시점" 열에서 그 마일스톤에 놓인 부분만 뜻한다. 사전 점검에서 고정한 라이브러리 줄로 막히면 이전 줄로 바꾸지 않고 blocker로 보고한다(C5). 파일 수는 추정이다.

### M1 — 설계 정본 개정·의존성·설정·API 스냅숏과 타입 (우선순위 높음)

- **범위**: §E E-1~E-9(첫 커밋, 문서만 — acceptance.md §3 글자를 옮김), §C 7개 패키지 설치와 engines, QG-12 재정의, 의존성 고정 시험 갱신, 커버리지 범위 확대(기준 80/80/80/80), design-rules 검사 대상·가져오기 규칙 확장, `ImportMetaEnv`, 앱 기준 주소(`src/app/env.ts`), Vite 프록시(`buildDevProxy`), 운영 빌드 env 검사, vitest 시간대 고정(`test.env.TZ`), OpenAPI 스냅숏·내보내기 스크립트(`--out`)·타입 생성(CLI)·동기 시험, MSW 시험 장치와 `indexedDB` 대역, biome 제외, 예시 env 파일 두 개(§B.10).
- **새 파일**: `openapi/openapi.json`, `scripts/export-openapi.mjs`, `src/api/schema.d.ts`(생성), `src/api/schema-sync.test.ts`, `src/test/export-openapi.test.ts`, `src/test/timezone.test.ts`, `src/test/coverage-config.test.ts`, `vite-plugins.ts`(env 검사 — CSP는 M8에서 같은 파일에 더함), `src/test/vite-plugins.test.ts`, `src/app/env.ts`·`src/app/env.test.ts`, `src/test/msw/server.ts`, `src/test/msw/fixtures.ts`, `.env.example`, `.env.production.example`(API 주소 + `SCP_*` 이름).
- **수정**: `.moai/design/system.md`, `package.json`, `package-lock.json`, `vite.config.ts`(`defineConfig(({ mode }) => …)`, `loadEnv`, 프록시, 커버리지, `test.env.TZ`), `tsconfig.json`(`include`에 `vite-plugins.ts`, `scripts` 제외), `biome.json`, `.gitignore`, `src/vite-env.d.ts`, `src/test/dependency-pins.test.ts`, `src/test/design-rules.test.ts`, `src/test/setup.ts`(MSW 수명 주기, `indexedDB` 대역).
- **시험**: 고정 목록 25+19와 engines, QG-12 두 검사, 스냅숏 머리 값과 CLI 재생성 동일성, 내보내기 스크립트(가짜 백엔드 폴더, `--out`, 3.1 아님 → 실패), env 검사 플러그인(없음·http·`https://`·`https://a b`·https), 기준 주소(개발·운영), 프록시 설정 값(명시한 env 객체), 커버리지 설정 값, `TZ=UTC`에서도 통과하는 시간대 시험, MSW가 처리하지 않은 요청을 실패로 보고하는지.
- **완료 기준**: AC-UI-002-01·02·03·04(가)(다) 통과, M1 적용 게이트 통과(QG-01~QG-10, QG-11 경계·자체 확인, QG-12, QG-13 지금 시험, QG-14, QG-15 29개, QG-16), `npm view` 기록과 고정 버전 일치, 백엔드 출처 커밋(`eb8b06d`)을 커밋 메시지와 진행 기록에 적음.
- **사전 점검**: `test.env.TZ`가 vitest 작업자의 `Intl`·`Date`까지 닿는지(닿지 않으면 `src/test/setup.ts` 맨 앞에서 `process.env.TZ`를 정하고, 어느 쪽이든 `TZ=UTC npx vitest run src/test/timezone.test.ts`로 증명). `.env`가 없는 임시 작업 트리에서 운영 빌드 검사가 들어간 뒤 pre-commit `moai gate`가 빌드 단계 때문에 커밋을 막는지(§B.10, R18).

### M2 — API 클라이언트·인증 세션·오류 계층 (우선순위 높음)

- **범위**: §B.1 전부 — 클라이언트와 미들웨어, 세션 저장소, single-flight 갱신(+ Web Locks 선택 보강), 갱신 실패 종류별 처리, 응답을 기다리지 않는 로그아웃, 오류 정규화(문구 결정 순서와 백엔드 문구 예외), 쿼리 기본값(`["shops","selected"]`의 `refetchOnWindowFocus: "always"` 포함), 쿼리 키 공장, 인증·내 정보·매장 쿼리 훅.
- **새 파일**: `src/api/{client,session,errors,query-client,query-keys}.ts`와 각 시험, `src/lib/external-store.ts`(+시험), `src/features/auth/queries.ts`, `src/features/shops/queries.ts`, `src/test/msw/handlers/{auth,shops}.ts`.
- **시험**(MSW 통합 중심): 401 세 건 동시 → 갱신 요청 1회 → 세 요청 각 1회 재시도; 갱신 401 → 세션 삭제 + `onSessionExpired` 1회; 갱신 네트워크·429·503 → 그 종류의 오류, 세션 유지; 재시도한 요청이 또 401이면 다시 갱신하지 않음; `/auth/*` 401은 갱신 안 함; `SHOP_NOT_SELECTED` → `onShopNotSelected`; 저장소 쓰기·뒤 검사·`indexedDB.open` 0회·쿼리와 변경 캐시에 토큰 없음; 로그아웃 500·네트워크·응답 없음에서 바로 비움; `credentials: "include"`가 인증 3개 요청에만 있음; §3.2 표 전부 정규화; 재시도 횟수; 시험 훅의 키 변경 → 앞 요청 취소.
- **완료 기준**: AC-UI-002-05(가)~(다), AC-UI-002-06(가)~(사)의 API 부분, AC-UI-002-07(다)와 처리기 호출 부분, AC-UI-002-08 통과, `client.ts`·`session.ts`·`query-keys.ts`에 MX 태그(§K).
- **사전 점검**: openapi-fetch 미들웨어의 응답 교체·재시도 방식, `credentials` 요청별 지정 방법(research.md 9절).

### M3 — ui-core 후속 과제 15건과 새 공개 컴포넌트 4개 (우선순위 높음)

- **범위**: M3 첫 커밋 전에 기준선을 기록한다(`npx vitest run --reporter=json --outputFile=<증거>/m3-baseline.json`, 포커스 링·선택 상태 클래스 문자열과 개수, Pagination 맨 숫자 줄 — acceptance.md §3.10 "M3 시작 기록"). 그다음 후속 과제 1·2(결함) → 4(링크 스킴 허용 목록: `new URL(to, location.origin).protocol` 기준으로 상대 경로와 `http:`·`https:`만, 그 밖은 `#`로 바꾸고 개발 경고) → 6~17(정리 12건, 동작 변화 없음) → 새 컴포넌트 4개(§D.1)와 Calendar 범위 모드 → 미리보기 전시 항목 추가 → 공개 API 잠금 갱신(44·33). 의도적으로 바꾼 시험은 `<증거>/m3-intentional-changes.txt`에 한 줄씩 적는다.
- **후속 과제별 처리**: 1 `open`이 false가 되면 확인 상태 초기화 + "밖에서 닫고 다시 열기" 시험 / 2 간격 밖 값은 그 시각을 옵션에 더해 트리거와 시간 칸에 보이게(값을 몰래 바꾸지 않는다) / 6 `canCreate()` / 7 `internal/class-names.ts`의 포커스 링 상수, 시험은 상수 값 대신 렌더링 결과 클래스를 단언 / 8 선택 상태 상수 / 9 `internal/external-store.ts` + `internal/use-restore-focus.ts`, 기존 `@MX:WARN`(toast.tsx:40, confirm-dialog.tsx:153)을 새 위치로 옮김 / 10 병합 ref 메모 / 11 상수 이름 / 12 조건부 빈 `getContext` / 13 `cva` / 14 명령형 저장소 초기화를 setup.ts의 `act` 안으로 / 15 `ToastTone = Exclude<Tone, "neutral">` / 16 `Modal` `size="md"` → `"default"`(공개 prop 변경, 토큰 `dialog-md`는 그대로, 미리보기·시험 호출부 수정) / 17 describe 제목. 항목별 증거는 acceptance.md §3.10 표다.
- **새 파일**: `src/ui-core/{date-range-picker,number-input,drawer,popover}.tsx`와 시험, `src/ui-core/internal/{class-names,external-store,use-restore-focus}.ts`.
- **수정**: ui-core 약 20개 파일과 시험, `src/ui-core/index.ts`, `src/preview/showcase.ts`·섹션·`PreviewPage.test.tsx`, `src/test/design-rules.test.ts`, `src/test/setup.ts`.
- **시험**: 결함 재현 시험을 먼저 실패시킨 뒤 고친다(Rule 4). 새 컴포넌트는 acceptance.md §3.10 키보드 계약·axe 0건·감속 모드·고대비 단서(SPEC-UI-001 AC-11~13 방식). NumberInput: 입력 "1234567" → 표시 "1,234,567", 값 1234567, 붙여넣기 "₩12,000" → 12000, 빈 값 → null.
- **완료 기준**: AC-UI-002-23 통과(기준선 비교 종료 코드 0), AC-UI-002-22(마)~(사)의 NumberInput 부분 통과, QG-08·QG-15가 44·33으로 바뀌어 통과. 이 뒤 사용자 검토 UR-9를 권할 수 있다.

### M4 — 라우터·앱 셸·로그인·매장 선택·약관·404·미리보기 개발 전용 경로 (우선순위 높음)

- **범위**: §B.2, §B.3, §B.9, §B.13, 폼 훅(§B.5 — 첫 사용처가 로그인), `main.tsx`를 `RouterProvider`로 교체. 경로 표(acceptance.md §3.3)의 모든 경로를 이 마일스톤에 등록하고, 업무 화면 4개(`/reservations`, `/customers`, `/treatment-menus`, `/treatments`)는 PageHeader의 h1만 있는 빈 화면으로 두었다가 M5~M7에서 채운다.
- **새 파일**: `src/app/*`(`routes.tsx`, `dev-routes.ts`, `safe-next.ts`, `loaders.ts`, `providers.tsx`, `RouteError.tsx`, `NotFoundPage.tsx`, `PublicLayout.tsx`)과 시험(`routes.test.tsx`, `safe-next.test.ts`, `auth-flow.test.tsx`), `src/app/shell/*`, `src/features/auth/LoginPage.tsx`, `src/features/shops/ShopSelectPage.tsx`, `src/features/legal/*`, 업무 화면 빈 페이지 4개, `src/preview/route.tsx`, `src/lib/{form,use-media-query,use-persisted-state}.ts`, `src/test/render-route.tsx`(메모리 라우터 + QueryClient + MSW 도우미), `scripts/check-dist.mjs`(QG-18 부분).
- **수정**: `src/main.tsx`, `package.json`(`check:dist`).
- **시험**: 경로 표 전부; 비로그인 보호 경로 → `/login?next=…`(보호 화면 h1 0회); 새로고침(토큰 없음 + 쿠키 갱신 성공) → 화면 유지; 갱신 401 → 만료 문구; 매장 없음 → `/shops`; `next` 표본 표를 로그인 loader·로그인 제출·매장 선택 세 사용처에서 각각; 로그인 오류 문구 3종·형식 규칙·이동 4경우; 매장 선택 성공·실패·빈 상태·오류·스켈레톤; 셸 1280/900/375px과 경계 폭 — 펼침·접힘·서랍, 저장 키, 크기 클래스, 건너뛰기 링크; 사용자 메뉴 로그아웃; 404; 개발 경로 목록과 빈 목록; 약관·개인정보 문단(acceptance.md §3.9).
- **완료 기준**: AC-UI-002-09·10·11·12 통과, AC-UI-002-13의 M4 판정 통과, AC-UI-002-05(라)·AC-UI-002-06(나)의 화면 부분, AC-UI-002-04(나) 보고 검사, AC-UI-002-22(나)의 폼 단위 시험 통과, QG-18(acceptance.md §4.1 블록 — `VITE_API_BASE_URL`을 넘긴 빌드 뒤 `check:dist`와 JS 검사) 통과.
- **사전 점검**: react-router 8 데이터 모드 API 이름·`createMemoryRouter`·`Link`가 `LinkComponent`를 만족하는지(타입 검사). 막히면 blocker(C5).

### M5 — 고객 화면과 CSV 내보내기 (우선순위 중간)

- **범위**: §B.7 공통 목록 장치(URL 상태, 디바운스, 취소, 쪽 나누기, 상태 3종), 고객 목록·등록·수정·삭제, 그룹 Combobox, 중복 전화번호 409, CSV(§B.8), 셸의 매장 범위 처리 화면 시험.
- **새 파일**: `src/features/customers/*`, `src/lib/{csv,download,use-debounced-value,kst-date}.ts`와 시험, `src/test/msw/handlers/phonebooks.ts`, `src/app/shell/shop-scope.test.tsx`.
- **시험**: 자동 진행 없는 가짜 타이머로 "김" → "김민" → 300ms → 요청 1회(`search=김민`), 앞선 요청의 signal 취소와 화면 비표시; URL `q`·`page` 복원; 로딩이 300ms 이상 이어지면 스켈레톤(300ms 시점부터 보이고 299ms까지는 없음, REQ-UI-002-013과 같은 경계)·빈 상태·오류 + 다시 시도; 등록 성공·수정·422·409; 무효화 접두사와 토스트; 삭제 확인 취소 시 요청 없음; CSV 이스케이프 표(acceptance.md §3.5 전부), 여러 쪽 모으기와 상한 없음, 중간 실패, 내려받기 `revokeObjectURL` 호출; `SHOP_NOT_SELECTED` 화면 이동과 포커스 재요청.
- **완료 기준**: AC-UI-002-18·19 통과, AC-UI-002-07(가)(나)의 화면 부분 통과.

### M6 — 예약 상태 모듈·시술 메뉴·시술 이력 (우선순위 중간)

- **범위**: §B.4 상태 모듈·StatusBadge·전환 규칙(StatusChangeControl), §B.7 시술 메뉴(목록·세부 항목·CRUD, NumberInput), 시술 이력(DateRangePicker·상태 Filter·검색·정렬·쪽, 배지 + 레일).
- **새 파일**: `src/features/reservations/{status.ts,StatusBadge.tsx,StatusChangeControl.tsx}`, `src/features/treatment-menus/*`, `src/features/treatments/*`, `src/test/msw/handlers/{menus,treatments}.ts`, `src/lib/money.ts`.
- **시험**: 전환 25칸 표, 현재 상태 선택 불가, 확인을 닫기·Esc로 끝내면 요청 없음, PUT 본문 키가 정확히 `reserved_at`·`status`이고 같은 순간; 배지 아이콘 + 라벨, 행 레일이 원본 `status`와 같음; QG-11 양성·라벨 검사; 메뉴·세부 항목 CRUD 전부(본문·무효화·토스트), 가격·소요 시간 0 거부·1 허용; 이력 기본 기간 = 이번 달(KST, 달 경계 포함), URL 키, 상태 필터 → `status=VISITED`, 정렬 머리글 → `sort_order=asc`, 쪽, 필터 변경 시 취소, URL 복원.
- **완료 기준**: AC-UI-002-14의 배지·행·QG-11 부분, AC-UI-002-15·20·21 통과.

### M7 — 예약 캘린더와 예약 등록·수정 (우선순위 높음, 기술 위험이 가장 큼)

- **범위**: §B.6 전부(일정 내용·접근 이름·설명·범례 포함), 캘린더 테마 매핑 CSS(§E E-3), 예약 대화상자(고객 검색·직접 입력, 일시, 항목 목록, 결제, 메모, 상태), 이력 행 "예약 보기" 연결.
- **새 파일**: `src/features/reservations/{ReservationCalendarPage.tsx,calendar-events.ts,calendar-theme.css,calendar-theme.test.ts,ReservationFormModal.tsx,queries.ts}`와 시험.
- **수정**: `src/features/treatments/TreatmentHistoryPage.tsx`, `src/test/design-rules.test.ts`(캘린더 CSS 선택자 범위).
- **시험**: 처음 보기 `timeGridWeek`; 주·월·일 범위 → KST `start_date`·`end_date`(배타 끝 처리); 3쪽 응답 모으기, 20쪽 경고 없음·21쪽 20번에서 멈춤과 경고, 범위 변경 시 이전 조회 취소와 화면 비표시; 일정 변환(상태 클래스·종료 시각 = 시작 + 소요 합, 0이면 30분); 일정 내용 렌더링(아이콘·시각·고객 이름·접근 이름·설명)과 범례; 등록 본문의 `reserved_at`이 `Z`로 끝남(Asia/Seoul 14:30 → `05:30:00.000Z`); 수정 본문 규칙과 항목 전체 배열(`id` 포함); 빈 칸 선택 → 시각 채운 등록 대화상자; "예약 추가" 키보드 경로; 캘린더 렌더링 연기 시험(acceptance.md AC-16 (라)의 두 갈래 판정); `calendar-theme.test.ts`.
- **완료 기준**: AC-UI-002-14의 일정·범례 부분, AC-UI-002-16·17 통과, AC-UI-002-22의 대화상자 부분 통과, QG-06에 `calendar-theme.test.ts` 포함.
- **사전 점검**: FullCalendar 7 React 가져오기·테마 적용 방식, `temporal-polyfill` 자동 적용, jsdom 렌더링 가능성, `eventContent`에 접근 이름을 다는 방법. FullCalendar 7로 막히면 v6로 바꾸지 않고 blocker(C5).

### M8 — CSP·배포 스크립트·최종 게이트·배포 가드 제거 (우선순위 높음)

커밋 순서를 지킨다.

1. **CSP 커밋**: §B.11 CSP 플러그인, `scripts/check-dist.mjs`(QG-17 — `VITE_API_BASE_URL`과 `connect-src` 비교). 이 커밋부터 QG-17을 판정한다.
2. **읽기 커밋**: §B.12 운영 모드 빌드와 안전한 `.env.production` 읽기(가드는 남김). `git mv src/test/deploy-guard.test.ts src/test/deploy-script.test.ts`(필수 — 이 커밋이 옛 시험 파일을 지운다)로 바꾼 뒤 시험을 acceptance.md AC-25(가드 변수를 주는 형태)로 다시 쓴다. QG-13은 이 커밋부터 새 시험으로 판정한다.
3. **전체 게이트 실행**: 다른 모든 인수 기준과 QG-01~QG-18(적용된 것 전부)을 이 시점 HEAD에서 실행해 증거를 남기고, 사용자 검토 항목 목록을 정리한다(§I).
4. **마지막 run 단계 커밋(가드 제거)**: `deploy.sh`의 `ALLOW_PREVIEW_ONLY_DEPLOY` 분기와 안내를 지우고, `deploy-script.test.ts`를 가드 변수 없는 형태로 바꾸고, `vite.config.ts` 커버리지 기준을 85/85/85/80으로 올리고 `coverage-config.test.ts`의 기대값을 함께 바꾼다. 이 커밋 자체가 AC-UI-002-25와 QG-01~QG-18을 통과해야 한다(C6). "M8의 마지막 run 단계 커밋"은 run 단계 커밋 가운데 `.moai/` 밖의 파일을 바꾸는 마지막 커밋이다. 이 커밋 뒤에 오는 `.moai/specs/SPEC-UI-002/progress.md`만 바꾸는 진행 기록 커밋(§E.2·§E.3 기록, run_commit_sha 채우기, 오케스트레이터 재검증 기록)은 세지 않는다(spec.md C6). 동기화 단계 커밋은 이 커밋이 아니다.

- **수정**: `vite-plugins.ts`, `vite.config.ts`, `src/test/vite-plugins.test.ts`, `scripts/check-dist.mjs`, `deploy.sh`, `src/test/deploy-guard.test.ts` → `src/test/deploy-script.test.ts`, `src/test/coverage-config.test.ts`, `src/test/theme-init.test.ts`(CSP 메타가 인라인 스크립트보다 앞인지 — 빌드 산출물 기준은 check-dist).
- **시험**: CSP 메타 위치·해시·§3.8 정책·`connect-src` origin(포트·경로 포함 EC-34)·`object-src 'none'`; 개발 모드에서는 CSP를 넣지 않음; 내장 명령 주입 표본에서 표시 파일 없음·값 글자 그대로·허용 목록 밖 이름 무시, 양성 대조 사본은 표시 파일을 만듦; 대역 `npm`·`scp` 인자를 한 줄에 하나씩 기록; 필수 값 4개 표, 파일 없음, 숫자 아닌 포트, `-` 값, 같은 이름 두 번, `export ` 줄; 가드 제거 뒤 `ALLOW_PREVIEW_ONLY_DEPLOY` 없이 대역 `npm`·`scp`가 한 번씩 호출됨.
- **완료 기준**: AC-UI-002-24·25 통과, AC-UI-002-13 다시 판정 통과, AC-UI-002-04(나) 보고 검사 통과, 마지막 커밋에서 QG-01~QG-18 모두 통과, 주석을 뺀 `deploy.sh`에 금지 토큰이 없고 `git log -S ALLOW_PREVIEW_ONLY_DEPLOY -- deploy.sh`의 가장 최근 커밋이 마지막 run 단계 커밋. 운영 서버 전송과 SPEC 완료 뒤 사용자 검토(UR-2·UR-3·UR-8)는 완료 기준이 아니다(결정 14, §P).

### F.9 마일스톤과 요구사항 대응

spec.md §10 추적성 표와 같은 대응이다. 괄호는 그 마일스톤에서 판정하는 부분이다.

| M | REQ | 후속 과제 |
|---|---|---|
| M1 | 001, 002, 003, 004(설정·규칙) | — |
| M2 | 005·007(API 부분), 006(API 부분), 008(API 부분), 009(정규화·재시도·훅 수준 취소) | — |
| M3 | 023, 022(NumberInput) | 1, 2, 4, 6~17 |
| M4 | 004(보고), 005·007(화면 흐름), 006(만료 화면), 010, 011, 012, 013, 014, 022(폼 훅) | — |
| M5 | 008(화면), 009(고객 화면 취소), 019, 022(고객 폼) | — |
| M6 | 009(이력 취소), 015(배지·행), 016, 020, 021, 022(메뉴·세부 항목 폼) | — |
| M7 | 009(캘린더 취소), 015·017(일정·범례), 017, 018, 022(예약 대화상자) | — |
| M8 | 004(보고, 85 기준), 014(다시 판정), 024, 025, 전체 게이트 | 3, 5 |

마일스톤 사이 의존이 강하다(M2 → M4 → M5~M7). 오케스트레이터의 Phase 4 모드 판단에는 순차 실행(serial)이 맞는다고 본다. 마일스톤이 셋 이상이고 파일이 10개 넘으므로 `manager-lead` 경로도 조건에 들지만, 병렬로 나눌 독립 작업이 M3(ui-core) 정도뿐이다 **(판단은 오케스트레이터 몫)**.

---

## §G 요구사항 초안(GEARS) — 초안 기록

> **대체됨**: 이 절은 결정 지점 1 검토용 초안을 그대로 남긴 기록이다. 정본은 spec.md §4(0.2.0)이고, 문장·절 수·금지 절이 다르면 spec.md를 따른다. 초안 뒤 바뀐 것: 금지 절이 있는 요구사항 6개 → 10개, REQ-003·006·007·009·010·012·013·014·015·017·018·019·022·024·025의 절 추가·분리.

결정 지점 1 검토용 요약이다. 승인 뒤 spec.md에서 문장을 다듬는다. 25개, 모듈 5개.

### 모듈 1 — 기반·계약

- **REQ-UI-002-001**: 프로젝트는 §C의 새 패키지 7개를 포함한 dependencies 25개·devDependencies 19개를 정확한 버전으로 고정하고 `engines.node`를 `^22.22.0 || ^24.0.0`으로 선언해야 하며(**shall**), 옛 의존성(zustand, @headlessui, axios, file-saver, react-router-dom, FullCalendar v6 패키지)은 `package.json`과 `src`에 나타나지 않아야 한다(**shall not**).
- **REQ-UI-002-002**: 저장소는 로컬 백엔드에서 내보낸 OpenAPI 스냅숏과 그것으로 만든 타입 파일을 가져야 하고, **When** 타입 생성 명령을 스냅숏에 다시 실행하면 그 결과는 커밋된 타입 파일과 같아야 한다(**shall**). 내보내기 명령은 이 저장소 밖에 파일을 쓰지 않아야 한다(**shall not**).
- **REQ-UI-002-003**: **Where** 빌드 모드가 development가 아니면, 빌드는 `VITE_API_BASE_URL`이 없거나 `https://`로 시작하지 않을 때 실패해야 하고(**shall**), **While** 개발 서버가 실행 중이면 앱의 API 요청은 `/api` 프록시를 거쳐 기본값 `http://localhost:8000`(환경 변수로 변경 가능)으로 가야 한다(**shall**).
- **REQ-UI-002-004**: 커버리지 측정과 디자인 규칙 검사는 ui-core뿐 아니라 앱 코드(`src/app`, `src/api`, `src/features`, `src/lib`, 생성 파일 제외)를 포함해야 하고(**shall**), 앱 코드는 ui-core를 `@/ui-core`로만 가져와야 한다(**shall**).

### 모듈 2 — 데이터·인증

- **REQ-UI-002-005**: API 클라이언트는 액세스 토큰을 메모리에만 두고 Bearer로 붙여야 하며(**shall**), 어떤 토큰도 `localStorage`·`sessionStorage`·IndexedDB·스크립트가 읽을 수 있는 쿠키에 쓰지 않고 응답 본문의 `refresh_token`을 보관하지 않아야 한다(**shall not**).
- **REQ-UI-002-006**: **When** 인증 경로가 아닌 요청이 401을 받으면, 클라이언트는 진행 중인 갱신이 있으면 그것을 함께 기다리고 없으면 HttpOnly 쿠키(`credentials: "include"`)로 갱신을 한 번만 보낸 뒤 원래 요청을 한 번 다시 보내야 하며(**shall**), **When** 갱신이 401로 실패하면 세션과 쿼리 캐시를 지우고 돌아올 경로를 담아 로그인 화면으로 보내야 한다(**shall**).
- **REQ-UI-002-007**: **When** 토큰 없이 보호 경로를 열면 앱은 판단 전에 쿠키 갱신을 한 번 시도해야 하고(**shall**), **When** 사용자가 로그아웃하면 `POST /auth/logout`을 쿠키와 함께 보내고 응답과 상관없이 토큰과 쿼리 캐시를 지운 뒤 로그인 화면으로 가야 한다(**shall**).
- **REQ-UI-002-008**: **When** 응답이 `SHOP_NOT_SELECTED`이면 앱은 전체 새로고침 없이 매장 선택 화면으로 이동하고 매장 범위 캐시를 버려야 하며(**shall**), 매장 범위 쿼리 키는 선택 매장 id를 포함해야 한다(**shall**).
- **REQ-UI-002-009**: 클라이언트는 백엔드 오류 봉투, 422 배열, 409, 429, 5xx, 네트워크 오류, 취소를 한 오류 형식과 해요체 문구로 정규화해야 하고(**shall**), 4xx와 취소는 재시도하지 않아야 하며(**shall not**), **When** 쿼리 입력이 응답 전에 바뀌면 이전 요청을 취소해야 한다(**shall**).

### 모듈 3 — 셸·탐색·공개 화면

- **REQ-UI-002-010**: 라우터는 §B.2 경로 표대로 공개·로그인 필요·로그인 + 매장 필요 경로와 404를 제공해야 하고(**shall**), **While** 세션이 없으면 보호 경로는 화면을 그리기 전에 `/login?next=<경로>`로 보내야 하며(**shall**), `next`는 앱 내부 경로만 받아야 한다(**shall**).
- **REQ-UI-002-011**: 앱 셸은 56px 상단바(접기 버튼·이동 경로·오늘 날짜·테마 전환·사용자 메뉴), 사이드바(현재 매장과 매장 변경, 240/64px), "본문으로 건너뛰기" 링크를 제공해야 하고(**shall**), **While** 화면 폭이 1024px 이상이면 저장된 접힘 상태를, 768~1023px이면 접힘을, 768px 미만이면 서랍을 써야 한다(**shall**).
- **REQ-UI-002-012**: **When** 사용자가 로그인을 제출하면 화면은 필수·형식 오류를 첫 오류 필드 포커스와 함께 보이거나 로그인 뒤 선택 매장 유무에 따라 돌아올 경로·첫 화면 또는 매장 선택으로 가야 하며(**shall**), 401·429·네트워크 오류는 서로 다른 문구로 알려야 한다(**shall**).
- **REQ-UI-002-013**: **When** 사용자가 매장 선택 화면에서 매장을 고르면 앱은 `POST /shops/selected` 뒤 선택 매장 캐시를 바꾸고 첫 화면(또는 돌아올 경로)으로 가야 하며(**shall**), 화면은 로딩·빈·오류 상태를 보여야 한다(**shall**).
- **REQ-UI-002-014**: **Where** 개발 서버이면 컴포넌트 미리보기가 `/dev/preview`에서 열려야 하고 운영 빌드 산출물에는 미리보기 코드가 없어야 하며(**shall**), 이용약관·개인정보처리방침은 로그인 없이 기존 경로에서 예전 문구로 보여야 한다(**shall**).

### 모듈 4 — 업무 화면

- **REQ-UI-002-015**: 예약 도메인 모듈은 상태 5종의 라벨·아이콘·토큰·표시 순서를 system.md §9대로 한곳에 정의해야 하고(**shall**), 상태가 보이는 모든 곳은 아이콘 + 라벨 배지를 쓰며 레일은 배지와 함께만 써야 한다(**shall**). ui-core는 상태 키를 갖지 않아야 한다(**shall not**).
- **REQ-UI-002-016**: **When** 사용자가 예약 상태를 바꾸면 화면은 예약됨 → 방문함·취소됨·노쇼, 방문함 → 완료는 바로 요청하고 그 밖의 전환은 확인 대화상자를 거쳐야 하며(**shall**), **When** 확인을 취소하면 요청을 보내지 않아야 한다(**shall not**).
- **REQ-UI-002-017**: 예약 캘린더는 주(기본)·월·일 보기로 보이는 범위의 예약을 쪽을 돌아 모두(상한 2,000건, 넘으면 경고) 가져와 상태 면·레일·아이콘·시각·고객명으로 그려야 하고(**shall**), **When** 이벤트를 누르면 수정, 빈 칸을 고르면 그 시각으로 채운 등록 대화상자를 열어야 한다(**shall**).
- **REQ-UI-002-018**: **When** 예약을 저장하면 앱은 일시를 UTC 오프셋이 있는 ISO 문자열로, 수정 때는 `reserved_at`·`status`를 항상 함께, 항목을 바꾸지 않았으면 `treatment_items`를 빼고 보내야 한다(**shall**).
- **REQ-UI-002-019**: 고객 화면은 300ms 디바운스 검색과 쪽 번호를 URL에 두고 고객 등록·수정·삭제(확인)를 제공해야 하며(**shall**), **When** CSV 내보내기를 누르면 현재 검색에 맞는 전체 고객을 RFC 4180 이스케이프·수식 주입 방지·UTF-8 BOM으로 file-saver 없이 내려받게 해야 한다(**shall**).
- **REQ-UI-002-020**: 시술 메뉴 화면은 메뉴와 선택한 메뉴의 세부 항목을 한 화면에서 보여 주고 둘 다 추가·수정·삭제할 수 있어야 하며(**shall**), 세부 항목의 소요 시간과 가격은 1 이상만 받아야 한다(**shall**).
- **REQ-UI-002-021**: 시술 이력 화면은 기간(기본 이번 달)·상태·검색 필터, 예약 일시 정렬, 쪽 나누기를 URL에 두고 상태 배지와 레일이 있는 표로 보여야 한다(**shall**).
- **REQ-UI-002-022**: 업무 폼은 필드를 떠나거나 제출한 뒤에 오류를 보이고 이후 값이 바뀔 때마다 다시 검사해야 하며(**shall**), **When** 제출이 실패하면(클라이언트 검증·422·409) 첫 오류 필드로 포커스를 옮겨야 하고(**shall**), 금액·소요 시간 입력은 천 단위 쉼표를 보이며 숫자 값을 넘겨야 한다(**shall**).

### 모듈 5 — 품질·보안·배포

- **REQ-UI-002-023**: ui-core는 SPEC-UI-001 후속 과제 가운데 ui-core 15건(결함 2, DefaultLink 허용 목록, 정리 12)을 반영하고 기존 동작 시험을 모두 통과해야 하며(**shall**), 새 공개 컴포넌트 4개를 키보드 계약·axe 0건과 함께 제공하고 공개 이름 44개·컴포넌트 파일 33개로 잠가야 한다(**shall**).
- **REQ-UI-002-024**: **Where** 운영 빌드이면 `index.html`은 빌드 때 계산한 인라인 스크립트 해시만 허용하는 CSP 메타를 인라인 스크립트보다 앞에 담아야 하고(**shall**), `connect-src`는 자기 출처와 API 출처로 제한해야 한다(**shall**).
- **REQ-UI-002-025**: `deploy.sh`는 `--mode production`으로 빌드하고 `.env.production`을 셸로 실행하지 않고 허용된 `SCP_*` 이름만 글자 그대로 읽어야 하며(**shall**), SPEC의 마지막 커밋에서 배포 중지 가드를 없애야 한다(**shall**).

GEARS 유형 분포(초안, 주된 유형 기준): 보편형 8, 사건형(When) 12, 상태형(While) 2(010·011), 조건형(Where) 3(003은 Where·While 복합, 014, 024). 금지(shall not)를 담은 요구사항 6개(001, 002, 005, 009, 015, 016).

---

## §H 인수 기준 초안 — 초안 기록

> **대체됨**: 정본은 acceptance.md(시나리오·판정 시점)와 spec.md §7(요약)이다. 아래 표는 결정 지점 1 당시의 초안이다.

Given-When-Then 한 줄 요약이다. 기대값 표·경계 사례·품질 게이트는 승인 뒤 acceptance.md에서 쓴다.

| AC | 요약 | REQ |
|---|---|---|
| AC-UI-002-01 | Given `npm ci` 뒤 트리, When 고정 목록 시험과 QG-12 명령을 실행하면, Then 25 + 19개가 이름·버전까지 같고 engines가 `^22.22.0 \|\| ^24.0.0`이며 QG-12 출력이 없다 | 001 |
| AC-UI-002-02 | Given 커밋된 스냅숏, When 시험이 타입을 다시 생성하고 머리 값을 읽으면, Then 생성 결과가 `schema.d.ts`와 같고 3.1.0·경로 31·API 50·스키마 58이며, 내보내기 스크립트 시험에서 백엔드 폴더 쓰기가 0건이다 | 002 |
| AC-UI-002-03 | Given 플러그인과 Vite 설정, When `VITE_API_BASE_URL` 없음·`http://…`·`https://…`로 운영 빌드 검사를 돌리고 프록시 설정을 읽으면, Then 앞의 둘은 실패, 뒤는 통과이고 프록시는 `/api` → 기본 `http://localhost:8000`, 접두사 제거다 | 003 |
| AC-UI-002-04 | Given 넓힌 설정, When 커버리지와 디자인 규칙 시험을 돌리면, Then 측정 대상에 앱 코드가 들어 85/85/85/80을 넘고, 앱 코드의 금지 패턴과 `@/ui-core` 밖 가져오기 표본이 잡힌다 | 004 |
| AC-UI-002-05 | Given 저장소 쓰기를 감시하는 시험, When 로그인·새로고침(쿠키 갱신)·로그아웃을 차례로 하면, Then 어떤 Storage에도 토큰이 없고, 새로고침 때 갱신 1회 뒤 화면이 유지되며, 로그아웃 요청이 실패해도 토큰·캐시가 비고 `/login`이다 | 005, 007 |
| AC-UI-002-06 | Given 만료된 토큰과 세 쿼리, When 세 요청이 동시에 401을 받으면, Then 갱신 요청은 1회, 각 요청은 1회만 다시 가며, 갱신이 401이면 `/login?next=<경로>`이고 캐시가 비어 있다 | 006 |
| AC-UI-002-07 | Given 매장 범위 화면, When 응답이 404 `SHOP_NOT_SELECTED`이면, Then 문서 새로고침 없이 `/shops`로 가고 `["shop"]` 아래 캐시가 없다 | 008 |
| AC-UI-002-08 | Given MSW 응답 표, When 봉투·422 배열·409·429·500·네트워크·취소를 받으면, Then 정규화 결과(`status`·`code`·`fieldErrors`·문구)가 표와 같고 4xx·취소는 재시도 0회, 입력 변경 시 이전 signal이 취소된다 | 009 |
| AC-UI-002-09 | Given 메모리 라우터, When 비로그인·로그인 무매장·로그인 + 매장 상태로 경로 표를 열고 `next=//evil.example`을 넣으면, Then 경로 표대로 보내지고 외부 `next`는 무시되며 없는 경로는 404다 | 010 |
| AC-UI-002-10 | Given 1280·900·375px 폭, When 셸을 그리고 접기·서랍·건너뛰기 링크를 키보드로 쓰면, Then 펼침(저장)·접힘(비저장)·서랍(이동 시 닫힘)이 표와 같고 상단바 요소 5개와 현재 매장이 보이며 axe 0건이다 | 011 |
| AC-UI-002-11 | Given 로그인 화면, When 빈 제출·401·429·성공(매장 있음/없음)을 차례로 하면, Then 첫 빈 필드에 포커스, 문구 3종이 다르고, 성공 뒤 `next`·`/` 또는 `/shops`로 간다 | 012 |
| AC-UI-002-12 | Given 매장 2개, When 하나를 고르면, Then `POST /shops/selected {shop_id}` 1회, 선택 매장 캐시 교체, 첫 화면 이동이며 0개면 빈 상태 문구다 | 013 |
| AC-UI-002-13 | Given 개발·운영 경로 객체와 빌드 산출물, When 경로 목록과 `check:dist`를 확인하고 약관·개인정보를 비로그인으로 열면, Then `/dev/preview`는 개발에만 있고 `dist`에 미리보기 문구가 없으며 두 문서가 예전 문구로 보인다 | 014 |
| AC-UI-002-14 | Given 상태 5종, When 배지·이력 행·캘린더 이벤트를 그리고 QG-11을 실행하면, Then 순서·라벨·아이콘·토큰이 system.md §9와 같고 레일과 배지가 같은 상태이며 ui-core 0건·도메인 모듈 5종이다 | 015 |
| AC-UI-002-15 | Given 25칸 전환 표, When 각 전환을 시도하고 확인 대화상자에서 닫기·되돌리기를 고르면, Then 바로/확인 구분이 표와 같고 닫기면 요청 0건, 되돌리기면 `PUT`에 `reserved_at`·`status`가 있다 | 016 |
| AC-UI-002-16 | Given 주간 보기와 3쪽짜리 응답, When 캘린더를 열고 다음 주로 넘기고 빈 칸을 고르면, Then KST 범위로 3번 요청해 모두 그리고 이전 범위 요청은 취소되며 빈 칸 시각이 등록 대화상자에 채워진다(20쪽 초과 시 경고) | 017 |
| AC-UI-002-17 | Given Asia/Seoul 시험 시간대, When 2026-11-10 14:30 예약을 등록하고 메모만 고쳐 저장하면, Then 등록 본문 `reserved_at`이 `2026-11-10T05:30:00.000Z`이고 수정 본문에 `reserved_at`·`status`가 있으며 `treatment_items`가 없다 | 018 |
| AC-UI-002-18 | Given 가짜 타이머와 고객 목록, When "김", "김민"을 입력하고 300ms를 흘리고 쪽을 바꾸고 새로고침하면, Then 요청은 `search=김민` 1회(앞 요청 취소), URL에 `q`·`page`가 남아 복원되며 등록 409는 전화번호 필드 오류다 | 019, 022 |
| AC-UI-002-19 | Given 쉼표·따옴표·줄바꿈·`=SUM(1)`·`-3`이 든 고객 3쪽, When CSV를 내보내면, Then 모든 쪽의 행이 들어 있고 이스케이프·`'` 접두·BOM·CRLF가 기대값과 같으며 `revokeObjectURL`이 호출된다 | 019 |
| AC-UI-002-20 | Given 메뉴 2개(세부 항목 포함), When 메뉴를 고르고 세부 항목을 가격 0·1로 저장하고 메뉴를 삭제하면, Then `?menu=<id>`로 세부 표가 보이고 0은 필드 오류, 1은 `POST` 성공, 삭제는 확인 뒤 요청된다 | 020 |
| AC-UI-002-21 | Given 오늘 2026-11-09, When 이력 화면을 열고 상태·기간·정렬을 바꾸면, Then 첫 요청이 `start_date=2026-11-01&end_date=2026-11-30`이고 각 변경이 매개변수와 URL에 반영되며 행마다 배지 + 레일이 있다 | 021 |
| AC-UI-002-22 | Given 예약 대화상자, When 빈 제출 뒤 값을 고치고, 422(`loc` 항목 가격)를 받고, 가격 칸에 "1234567"을 치면, Then 처음엔 첫 오류 필드 포커스, 고치면 오류가 바로 사라지고, 422 필드에 포커스, 표시는 "1,234,567"·값 1234567이다 | 022 |
| AC-UI-002-23 | Given M3 이후 트리, When ui-core 시험·결함 재현 시험·잠금 시험을 돌리면, Then 기존 시험이 모두 통과하고 Modal 재열기·간격 밖 시각·DefaultLink `javascript:` 표본이 기대대로 동작하며 공개 이름 44·파일 33·새 컴포넌트 axe 0건이다 | 023 |
| AC-UI-002-24 | Given 운영 빌드, When `check:dist`와 플러그인 시험을 돌리면, Then CSP 메타가 인라인 스크립트보다 앞에 있고 해시가 실제와 같으며 `connect-src`가 API 출처만 더하고, 개발 모드 HTML에는 CSP가 없다 | 024 |
| AC-UI-002-25 | Given 주입 표본이 든 `.env.production`과 대역 `npm`·`scp`, When 마지막 커밋의 `deploy.sh`를 실행하면, Then 표시 파일이 생기지 않고 값이 글자 그대로이며 허용 목록 밖 이름은 무시되고, 가드 변수 없이 `run build -- --mode production` 1회·전송 1회가 호출된다 | 025 |

---

## §I 시험 전략

`moai-ref-testing-pyramid` 기준으로 단위 > 통합 > 브라우저 순으로 둔다.

| 층 | 도구 | 대상 | 대략의 비중 |
|---|---|---|---|
| 단위 | Vitest(node·jsdom) | 상태 전환 표, CSV, 오류 정규화, 쿼리 키, KST 날짜, 디바운스(가짜 타이머), 폼 훅, 이벤트 변환·범위 계산, CSP·env 플러그인, 스냅숏 동기, deploy.sh(대역 실행) | 약 60% |
| 컴포넌트 | Testing Library + axe | 새 ui-core 4개, StatusBadge·StatusChangeControl, 폼 대화상자, 셸(matchMedia 대역) | 약 25% |
| 통합 | MSW 3(`msw/node` `setupServer`) + 메모리 라우터 + 실제 QueryClient | 화면 흐름(로그인 → 매장 → 캘린더, 401 single-flight, SHOP_NOT_SELECTED, 목록 검색·취소, CRUD 무효화, CSV, 이력 필터) | 약 15% |
| 실제 브라우저 | 사용자 검토(수동) | 아래 UR 목록 | — |

- **MSW 운용**: 처리기는 `schema.d.ts` 타입으로 응답을 만든다(백엔드가 바뀌면 타입 오류로 드러난다). 처리하지 않은 요청은 실패로 본다(MSW 3 `onUnhandledFrame`). 쿠키는 Node fetch가 다루지 않으므로 "쿠키가 실제로 저장·전송되는가"는 시험하지 않고, "`credentials: "include"`를 어느 요청에 주는가"만 시험한다.
- **시간대**: 시험은 `vite.config.ts`의 `test.env.TZ = "Asia/Seoul"`로 돈다. npm 스크립트에 두지 않는다 — 인수 기준 명령이 `npx vitest`로 npm 스크립트를 건너뛰고, 이 기기는 이미 Asia/Seoul이라 고정이 없어도 통과해 버리기 때문이다. 증명은 `TZ=UTC npx vitest run src/test/timezone.test.ts`다. 작업자에 닿지 않으면 `src/test/setup.ts` 맨 앞에서 정한다(M1 사전 점검).
- **가짜 시계·타이머**: 오늘은 정확한 순간(`2026-11-09T10:00:00+09:00`)으로 고정하고, 시간 간격을 판정하는 시험은 자동 진행이 없는 가짜 타이머와 `vi.advanceTimersByTimeAsync`로만 시간을 보낸다(acceptance.md §0). 부하가 큰 기기에서 실제 시간이 흘러 디바운스가 먼저 터지는 일을 막는다.
- **기존 시험 보존**: M3의 정리 12건은 동작 보존이 목적이라 기존 시험 551개가 기준선이다. 시험이 클래스 문자열을 직접 단언하는 곳(후속 과제 7)은 결과 클래스 단언으로 바꾸되 기대값은 유지한다.
- **실행 시간**: `npm test` 전체가 게이트의 시험 단계 제한(120초) 안에 들어야 한다. 화면 통합 시험이 늘어나므로 마일스톤마다 실행 시간을 기록하고, 넘을 것 같으면 통합 시험을 화면당 핵심 흐름으로 줄인다.
- **커버리지**: 앱 코드와 `vite-plugins.ts` 포함. 기준은 C2의 단계 값(M1~M7 커밋 80/80/80/80, M8 마지막 커밋 85/85/85/80 — 줄·문장·함수·분기). 생성 파일·진입점·미리보기·`scripts/*.mjs`(자식 프로세스라 측정되지 않음)는 제외.

**실제 브라우저가 필요한 항목 — 권고: 사용자 검토 목록(수동)**

정본 목록과 시점은 acceptance.md §5(UR-1~UR-9)다. 요점만 적는다.

- run 단계 안에서 볼 수 있는 것: UR-1(쿠키, 로컬 백엔드 + `npm run dev`), UR-4(tnum, M6 뒤), UR-5(셸·캘린더 실제 렌더링·범례·일정 설명, M7 뒤), UR-6(네이티브와 동시 사용), UR-7(고대비, 선택), UR-9(새 ui-core 컴포넌트 4개 모양, M3 뒤 `/dev/preview`).
- SPEC 완료 뒤에만 볼 수 있는 것: UR-2(운영 빌드 CSP 위반 0건), UR-3(엄격한 스타일 정책, 선택), UR-8(운영 로그인). 셋 다 운영 API에 붙어야 하는데, 로컬 미리보기 서버(`localhost:4173`)는 운영 CORS에 막히고 로컬 백엔드는 `http`라 운영 빌드 env 검사를 통과하지 못한다. 그래서 §P-1(백엔드 CORS) 뒤로 옮겼고, 완료 전에는 AC-UI-002-24·QG-17의 빌드 산출물 정책 시험으로 대신한다(§J R2 잔여 위험).

- **권고 이유**: 쿠키 갱신은 실제 백엔드(Redis·Postgres)가 있어야 의미가 있고, CSP 확인은 한 번의 관찰로 정책을 정하는 일이라 자동화 이득이 작다. 최소 브라우저 연기 시험(Playwright)은 새 개발 의존성과 브라우저 바이너리 내려받기, 백엔드 기동 절차가 함께 필요해 이 SPEC의 범위를 넓힌다.
- **대안**: Playwright 연기 시험 1개(로그인 → 캘린더 → 대화상자 열기, CSP 위반 0건)를 후속 SPEC에서 `e2e-tester`로 만든다. 이번 SPEC에는 넣지 않는다.

---

## §J 위험과 대응

| # | 위험 | 영향 | 대응 |
|---|---|---|---|
| R1 | 새 메이저(react-router 8, FullCalendar 7 — 7.0.0이 2026-06-19 출시, MSW 3, openapi-fetch 0.x) | API 차이·문서 부족으로 마일스톤 지연 | 정확한 버전 고정, 각 마일스톤 사전 점검에서 타입으로 확인. 막히면 이전 줄로 바꾸지 않고 blocker로 보고 → 사용자 승인 → manager-spec이 REQ-UI-002-001·acceptance.md §3.4·QG-12·§E E-3을 개정한 뒤 이어 간다(C5) |
| R2 | CSP가 SPEC 완료 전에는 실제 브라우저에서 확인되지 않음(잔여 위험) | 엄격하게 두면 대화상자·캘린더가 깨진다. 놓친 인라인 스크립트가 있으면 운영에서 막힌다 | `style-src 'self' 'unsafe-inline'`로 출시(알려진 동작), 스크립트는 해시로 엄격. 완료 전 대체: 빌드 산출물의 정책·해시·위치를 자동 시험(AC-UI-002-24, QG-17)으로 판정. 브라우저 확인(UR-2·UR-3)은 §P-1 뒤 SPEC 완료 뒤 |
| R3 | 백엔드 변경과 스냅숏 노후화(2026-11-09에도 백엔드 병합이 있었다) | 타입은 맞는데 실제 응답이 다름 | 출처 커밋(`eb8b06d`)을 M1 커밋 메시지와 진행 기록에 적는다. 마일스톤 시작 때 `api:check`(로컬)로 드리프트를 감지만 한다. 드리프트가 보이면 스냅숏을 다시 내보내지 않고 blocker로 보고 → manager-spec이 REQ-UI-002-002·AC-UI-002-02·QG-16의 머리 값(3.1.0·31·50·58)을 개정한 뒤 `api:sync`를 쓴다. 타입 기반 MSW 처리기 |
| R4 | 사용자당 리프레시 토큰 하나 | 관리자 웹에 로그인하면 같은 계정의 네이티브 앱이 다음 갱신 때 로그아웃된다(반대도 같다) | 백엔드 변경은 범위 밖. 안내는 README에만 둔다(동기화 단계 manager-docs 산출물, spec.md §8). 로그인 화면에는 넣지 않는다. UR-6 |
| R5 | 선택 매장이 사용자 단위 서버 상태 | 네이티브에서 매장을 바꾸면 관리자 웹이 보는 매장도 바뀐다 | 매장 id를 키에 포함, 창 포커스 때 선택 매장 재확인 + 바뀌면 캐시 폐기·안내(§B.3), UR-6 |
| R6 | 개발 중 운영 데이터 변경 | 실제 매장 예약·고객이 바뀐다 | 프록시 기본값 로컬, 대상이 로컬이 아니면 경고, `.env.example`에 설명 |
| R7 | 운영 CORS가 새 주소를 허용하지 않음(외부 의존) | 운영에서 로그인이 막힌다 | 백엔드 저장소 작업으로 넘김(결정 9). 운영 확인(UR-8)은 그 작업 뒤, SPEC 완료 뒤에 한다(결정 14). 이 SPEC의 완료는 백엔드 작업에 묶이지 않는다 |
| R8 | 관리자 주소가 다른 사이트가 되면 제3자 쿠키 | 갱신 쿠키가 막혀 새로고침마다 로그아웃 | `dongri.kr` 아래 주소 유지(결정 9). 주소를 바꾸는 결정은 이 위험을 다시 검토해야 한다 |
| R9 | 배포 서버가 SPA 경로를 `index.html`로 돌려주지 않음 | 깊은 경로 새로고침이 404 | 해결(결정 12): 배포 서버 nginx에서 `try_files $uri /index.html`을 설정할 수 있다. 경로 방식 라우팅을 유지하고 해시 라우터는 쓰지 않는다. 설정은 §P 점검표(범위 밖)에서 하고 UR-8에서 깊은 경로 새로고침으로 확인한다 |
| R10 | 브라우저 시간대가 한국이 아닐 때 | 일시 표시·날짜 범위가 어긋난다 | 한국 시간대 가정을 system.md(§E E-9, M1)와 README(동기화 단계)에 기록, 시험은 Asia/Seoul 고정. 시간대 고정 표시는 범위 밖 |
| R11 | 캘린더 범위당 2,000건 초과 | 일부 예약이 안 보인다 | 상한 경고 표시. 월 보기에서 현실적 위험은 낮다 **(추론)** |
| R12 | 시험 실행 시간 증가 | 게이트 120초 초과 | 마일스톤마다 측정, 통합 시험 범위 조절 |
| R13 | FullCalendar Monarch의 box-shadow 포커스 링 | 고대비 모드에서 포커스가 안 보인다 | §E E-3에서 `outline`으로 덮어쓰기, UR-7 |
| R14 | 예전 로그인 코드의 계정 정보(공개 저장소 이력) | 실제 계정이면 노출 | 이미 사용자에게 알림. 새 코드에 기본값을 넣지 않는다. 이력 정리는 범위 밖 |
| R15 | 로그인 분당 5회(IP 기준) | 같은 사무실 IP에서 여럿이 실패하면 막힌다 | 429 전용 문구 |
| R16 | 네이티브 앱의 오프셋 없는 예약 일시(research.md 2.7, 추론) | 네이티브에서 만든 일부 예약이 관리자 웹에서 9시간 밀려 보일 수 있다 | 관리자 웹은 서버 값을 그대로 표시(고치지 않음). 사용자에게 관찰로 보고, 네이티브 수정은 범위 밖 |
| R17 | 탭 사이 갱신 경쟁 | 한 탭이 로그아웃될 수 있다 | Web Locks 보강(§B.1), 백엔드가 절반 수명 이후에만 토큰을 바꿔 경쟁 구간이 짧다 |
| R18 | `.env`가 없는 임시 작업 트리에서 운영 빌드 검사가 빌드를 실패시킴 | pre-commit 게이트가 빌드를 돌린다면 커밋이 막힌다 | 검증 빌드는 `VITE_API_BASE_URL`을 환경 변수로 넘긴다(§B.10). 게이트 동작은 M1 사전 점검에서 확인하고, 막히면 blocker 보고(게이트를 건너뛰지 않는다) |
| R19 | 가드 제거 뒤 운영 연결 전에 `deploy.sh`를 실행 | 파일은 올라가지만 서버가 내주지 않거나, 다른 사이트 디렉터리를 덮을 수 있다 | §P 점검표를 먼저 끝낸다. `SCP_DIR`은 관리자 웹 전용 디렉터리로만 둔다(§P-2) |

---

## §K MX 태그 계획

| 태그 | 대상 | 이유 |
|---|---|---|
| `@MX:ANCHOR` | `src/api/client.ts` `createApiClient` | 모든 쿼리 훅이 쓰는 경계(호출자 다수) |
| `@MX:ANCHOR` | `src/api/query-keys.ts` | 무효화·캐시 폐기가 이 구조에 기댄다. 모양을 바꾸면 매장 전환이 다른 매장 데이터를 남긴다 |
| `@MX:ANCHOR` | `src/features/reservations/status.ts` `STATUS_META`·`STATUS_ORDER` | 배지·이력·캘린더·전환이 모두 쓴다 |
| `@MX:ANCHOR` | `src/app/routes.tsx` | 앱과 시험이 같은 경로 객체를 쓴다 |
| `@MX:WARN` | `src/api/session.ts` `refreshSession` | 동시성(single-flight·탭 잠금). 진행 중 Promise를 지우는 시점을 바꾸면 갱신이 겹친다 |
| `@MX:WARN` | `src/api/client.ts` 401 재시도 미들웨어 | 요청 복제·1회 재시도 표시. 바꾸면 무한 재시도나 본문 소실 |
| `@MX:WARN` | `deploy.sh` `.env.production` 읽기 반복문 | 보안 경계. `eval`·`source`로 되돌리면 명령 주입. 주석은 자기 줄에 둔다(QG-13 주석 제외 검사) |
| `@MX:WARN` | `vite-plugins.ts` `cspPlugin` | 인라인 스크립트 해시. 정책을 넓히거나 개발 모드에 적용하면 보호가 사라지거나 개발 서버가 깨진다 |
| `@MX:NOTE` | `transitionKind` | 화면 전용 규칙 — 백엔드는 강제하지 않는다(결정 7) |
| `@MX:NOTE` | `src/lib/kst-date.ts`, 예약 저장 변환 | 날짜 필터는 KST, 일시는 UTC 오프셋 ISO — 이유(research.md 2.7) |
| `@MX:NOTE` | `src/lib/csv.ts` 수식 주입 방지 | `'` 접두의 이유 |
| `@MX:NOTE` | `onShopNotSelected` 처리 | 선택 매장은 서버 사용자 단위 상태 |
| 갱신 | `toast.tsx:40`, `confirm-dialog.tsx:153`의 `@MX:WARN` | 후속 과제 9로 외부 저장소가 `internal/external-store.ts`로 옮겨 가면 태그도 옮긴다 |

---

## §L 별도 설계 패스(manager-design) 권고

- **D1~D5 전체 파이프라인은 권하지 않는다.** system.md가 토큰·컴포넌트·레이아웃·문구의 정본으로 이미 있고, 이번에 바꿀 것은 §E의 8개 항목이다. 색 값 변경이 없어 대비 재계산도 필요 없다.
- **권고: §E 범위만 다루는 짧은 설계 패스를 M1 전에 한 번.** 특히 E-3(FullCalendar 7 테마 변수 대응표와 포커스 덮어쓰기)과 E-4(새 컴포넌트 4개의 모양)는 시각 판단이 들어가므로 설계 담당이 정하는 편이 낫다. 결과는 system.md 1.2.0 커밋 하나다.
- 설계 패스를 하지 않으면 M1 첫 커밋에서 manager-develop이 §E 표대로 system.md를 고치고, E-4(새 컴포넌트 4개)의 시각 판단은 M3 뒤 사용자 검토 UR-9(`/dev/preview`)에서, E-3(캘린더)은 M7 뒤 UR-5에서 확인한다.

---

## §M 제약과 제외 범위

### M.1 제약

spec.md §6이 정본이고, 아래는 같은 글자의 사본이다.

- **C1** — 정본 순서는 acceptance.md §3 표 → `.moai/design/system.md`(M1 첫 커밋에서 §3 표를 같은 글자로 옮김) → 코드다. 화면 문구·상태 표·전환 문구는 acceptance.md §3이 정본이고, 디자인 값(토큰·크기·간격)은 system.md가 정본이다. system.md는 코드보다 먼저 고친다(§E). design-direction.md는 고치지 않는다.
- **C2** — TDD. 커버리지 목표는 줄·문장·함수 85%, 분기 80%이며 앱 코드까지 적용한다. `vite.config.ts`의 기준값을 하나의 출처로 두고, M1~M7 커밋에서는 80/80/80/80, M8의 마지막 run 단계 커밋에서는 85/85/85/80으로 둔다.
- **C3** — 작업은 `main`에 직접 쌓는다. 실제 변경은 임시 작업 트리(로컬 임시 브랜치)에서 만들고 주 체크아웃에서 `git merge --ff-only`로 합친 뒤 `origin/main`에 푸시한다. 원격 기능 브랜치와 PR은 만들지 않는다. 커밋은 Conventional Commits, 한국어 메시지, 경로 지정 스테이징이며 훅을 건너뛰지 않는다. (SPEC-UI-001 progress.md:110의 실제 방식)
- **C4** — 코드 주석과 시험 이름은 한국어, 식별자는 영어. UI 문장은 해요체, 버튼·라벨은 명사형, 시간은 24시간제 `HH:mm`(system.md §11). 예외는 예전 약관 문구(acceptance.md §3.9)와 REQ-UI-002-009가 허용한 백엔드 `detail.detail` 문구.
- **C5** — 의존성은 acceptance.md §3.4의 정확한 버전으로 고정한다. 이전 메이저 줄(react-router 7, FullCalendar 6, MSW 2)로 바꾸거나 다른 새 패키지를 들이는 일은 어떤 경우든 blocker다: 작업을 멈추고 blocker로 보고 → 사용자 승인 → manager-spec이 REQ-UI-002-001, acceptance.md §3.4, QG-12, §E E-3을 개정한 뒤에만 이어 간다. §C의 이전 줄 버전은 참고 정보일 뿐 미리 승인된 대안이 아니다.
- **C6** — 배포 중지 가드는 다른 모든 인수 기준과 품질 게이트가 통과한 뒤 M8의 마지막 run 단계 커밋에서 지운다. 그 커밋 자체가 AC-UI-002-25와 QG-01~QG-18을 통과해야 한다. 동기화 단계 커밋은 run 단계 커밋이 아니다. 실제 운영 전송은 이 SPEC에서 하지 않는다.
- **C7** — tnum은 "미검증"으로 기록한다. 숫자 열은 `tabular-nums` + 오른쪽 정렬, 대체 숫자 글꼴은 넣지 않는다.
- **C8** — ui-core는 예약 도메인을 모른다. 앱 코드는 ui-core를 `@/ui-core`로만 가져온다.
- **C9** — 형제 저장소(`kmcbeauty-fastapi`, `kmcbeauty-native`)는 읽기만 한다. OpenAPI 내보내기도 백엔드 폴더에는 아무것도 쓰지 않는다.

### M.2 제외 범위

### Out of Scope — 네이티브 전용 기능과 계정 관리
- 직원 관리, 초대 코드, 매출 대시보드(`GET /summary/dashboard`), 매장 생성·수정, 회원 가입·정보 수정·탈퇴, 푸시 토큰
- 예약 담당 직원 지정(`staff_user_id`)과 직원 필터 — 직원 목록이 직원 관리 기능에 속한다 **(이번에 정한 기본값)**

### Out of Scope — 예약 기능 확장
- 캘린더 끌어 놓기 일정 변경, 반복 예약, 영업시간·휴무 설정, 상태별 개수 필터, 시간대 고정 표시
- 시술 메뉴 복원(`POST /treatment-menus/{id}/restore`) 화면
- 예전 대시보드(`/manager`)와 예전 `/manager/*` 경로 호환 리디렉트

### Out of Scope — 백엔드 변경
- 운영 CORS 허용 목록과 `tests/test_cors_production_security.py` 변경(백엔드 저장소 별도 작업)
- 서버 쪽 상태 전환 규칙, 사용자당 여러 리프레시 세션, 오류 문구 통일, 429 본문 형식

### Out of Scope — 배포 서버와 운영
- 운영 연결 작업 전부 — §P 점검표에 적었다: 새 conf.d server 블록(`admin-beauty.dongri.kr`, SPA 경로 대체, 서버 수준 보안 헤더), 정적 파일 마운트(`/srv/server-mini2/compose.yaml`) 또는 정적 파일 컨테이너, Cloudflare DNS 레코드, nginx 다시 읽기
- 실제 운영 배포 실행(이 SPEC은 배포 스크립트를 고치고 가드를 지울 뿐 전송하지 않는다)
- 운영 로그인 확인(UR-8) — SPEC 완료 뒤 사용자 검토 항목

### Out of Scope — 검증 자동화와 디자인 확장
- 브라우저 E2E·시각 회귀 자동화(후속 SPEC 후보), 엄격한 `style-src` 정책
- 대체 숫자 글꼴, 새 토큰 색, 여러 계열 차트 팔레트

### Out of Scope — 문서
- README 정비(동기화 단계에서 manager-docs) — 넘기는 항목: 사용자당 리프레시 토큰 하나 안내(R4), 한국 시간대 브라우저 가정(R10), 로컬 `.env`의 예전 API 주소를 고치라는 안내(§B.10). 로그인 화면 안내 문구는 만들지 않는다
- 프로젝트 문서(product·structure·tech.md — 사용자 결정으로 미룸), CHANGELOG

### Out of Scope — SPEC 완료 뒤 브라우저 확인
- UR-2(운영 빌드 CSP 위반 관찰), UR-3(엄격한 스타일 정책 실험), UR-8(운영 로그인) — 모두 §P-1 뒤

---

## §N 대안 — 두 SPEC으로 나누는 안

| 안 | 구성 | 장점 | 단점 |
|---|---|---|---|
| **A. 하나(권고)** | SPEC-UI-002 = M1~M8, REQ 25·AC 25 | 사용자 요청과 같다. 상태 모듈·폼·오류 규칙을 한 번에 정해 SPEC 사이 경계 문서가 필요 없다. 가드 제거 시점이 분명하다 | 상한(25·25)을 꽉 채운다. plan-auditor가 한 번에 볼 범위가 넓다. 마일스톤별 위임으로 크기를 나눈다 |
| B. 둘 | SPEC-UI-002(기반: M1~M4 + CSP·deploy 읽기, REQ 약 14) → SPEC-UI-003(채택하지 않은 안의 가상 ID — 만들지 않음. 업무 화면: M5~M7 + 가드 제거, REQ 약 11) | 감사 범위가 작고 기반(인증·셸)을 먼저 검토받는다 | 계획·감사·동기화가 두 번. 폼·상태 규칙이 두 SPEC에 걸친다. 가드가 더 오래 남는다. SPEC-UI-001 C6 문구("SPEC-UI-002 완료 때 제거")를 고쳐야 한다 |

ID 형식 확인: `SPEC-UI-002`, `SPEC-UI-003` 모두 정규식 검사 PASS. `SPEC-UI-003`은 채택하지 않은 B안 안에서만 쓰는 가상 ID이고 `.moai/specs/`에 만들지 않는다.

---

## §O 확인 필요 항목 — 해결 기록

초안의 확인 필요 항목 4개는 3회차 인터뷰(interview.md "Interview Round 3", 2026-11-09)로 모두 풀었다. 남은 확인 필요 표시는 없다.

| # | 초안의 질문 | 답(결정) | 계획에 반영한 곳 |
|---|---|---|---|
| 1 | 운영 관리자 주소의 정확한 이름 | **`admin-beauty.dongri.kr`**(결정 11). 서버 확인 결과 `admin.dongri.kr`은 다른 서비스(dcard)가 쓰고 있어 겹치지 않는다. Cloudflare 원본 인증서가 `*.dongri.kr`과 `dongri.kr`을 덮는다. `dongri.kr` 아래이므로 갱신 쿠키가 같은 사이트로 남는다(R8). CSP `connect-src`는 API 출처만 쓰므로 이 값과 상관없다 | §A, §P, UR-8 |
| 2 | 배포 서버에서 보안 헤더와 SPA 경로 대체를 설정할 수 있는지 | **설정할 수 있다 — 경로 방식 라우팅 유지**(결정 12). 배포 서버(`maria.daeho.shop`, 호스트 `mini-server-01`)는 nginx 1.30.6을 Docker 컨테이너 `nginx`로 돌린다. 설정 폴더 `/srv/server-mini2/nginx/conf.d`의 소유자가 `antam2010`이고 docker 그룹이라 sudo 없이 설정을 더하고 다시 읽힐 수 있다. 다른 사이트가 이미 서버 수준 보안 헤더를 쓰고 "`add_header`는 server 수준에만, location 안에는 두지 않는다" 규칙을 따른다. 정적 파일 마운트는 아직 없다. 서버 작업은 이 SPEC 밖이다. 증거: `.moai/state/verify/cd2cba80-827f-4657-b7ea-6a07e9f25df2/deploy-server/maria-daeho-shop-readonly-check.md`(읽기 전용 확인) | §B.11, §J R9, §M.2, §P |
| 3 | `deploy.sh`가 올리는 서버와 빌드 모드 | **운영 서버, `--mode production`**(결정 13). `deploy.sh`는 `npm run build -- --mode production`으로 빌드하고 `.env.production`에서 `SCP_*`를 안전한 KEY=VALUE 읽기로 읽는다. Vite는 같은 파일에서 `VITE_API_BASE_URL`을 읽는다. `.env.production.example`에는 변수 이름만 둔다 | §B.10, §B.12, M1, M8, REQ-UI-002-025, AC-UI-002-25, §K |
| 4 | 백엔드 CORS 작업과 운영 확인 시점 | **SPEC 완료 뒤**(결정 14). SPEC-UI-002는 시험과 로컬 확인까지로 완료한다. 운영 로그인 확인(UR-8)은 백엔드 CORS 작업 뒤의 별도 확인 항목이며 M8 완료 기준과 SPEC 완료 조건에 들지 않는다 | §I UR-8, §J R7, M8, §P |

**0.2.0 사전 검토 반영(2026-11-09)**: 계획 감사 전 읽기 전용 관점 3개가 낸 85건을 모두 처리했고, 그 가운데 사용자 판단이 필요했던 캘린더 일정의 상태 표시는 4회차 인터뷰 결정 15로 정했다. 오케스트레이터가 정한 방향(라이브러리 줄 전환은 언제나 blocker, `next` 규칙, 배포 시험 표본, 주석 제외 검사, 게이트 적용 시점, 문구 정본 순서, `VITE_API_BASE_URL`을 예시 파일에, 브라우저 확인 시점, 스냅숏 드리프트 절차, 커버리지 단계 기준, 시험 파일 이름 변경 필수 등)을 반영했다. 항목별 대응은 progress.md §A.7이다. 남은 확인 필요 표시는 없다.

**결정 지점 1에서 바꿀 수 있었던, 이번에 새로 정한 기본값**(인터뷰가 정하지 않은 것 — 결정 지점 1에서 사용자가 바꾸지 않았으므로 그대로 확정): 인터뷰에 없는 상태 전환은 모두 확인(§B.4), 완료 때 `finished_at` 미전송, 취소는 `PUT`으로 통일, 폼 라이브러리 없이 자체 훅(§B.5), 고객 목록 정렬 없음·쪽 크기 20, 검색 디바운스 300ms, 이력 기본 기간 이번 달, 메뉴는 한 화면 마스터·디테일, 캘린더 하루 전체 + 09:00 위치, FullCalendar 테마 Monarch, 사용자 메뉴는 Popover, `/manager` 접두사 폐지, 매장 자동 선택 없음, 404 화면 추가, 직원 지정 제외, 앱 문구 우선·백엔드 문구 보조, CSV 수식 주입 방지.

---

## §P 운영 연결 점검표(이 SPEC 범위 밖)

SPEC-UI-002가 완료된 뒤 사용자가 실행할 작업이다. 이 SPEC의 마일스톤·인수 기준·완료 조건에 들지 않는다(결정 12·14). 서버 사실은 2026-11-09 읽기 전용 확인 기록(`.moai/state/verify/cd2cba80-827f-4657-b7ea-6a07e9f25df2/deploy-server/maria-daeho-shop-readonly-check.md`)을 따르고, 접속 방법은 interview.md 12번에 있다. 접속 정보(사용자, 호스트, 경로, 포트)는 이 저장소의 파일에 적지 않고 각자의 `.env.production`에만 둔다. 공개 API 주소는 예외로 `.env.production.example`에 있다(§B.10).

| 순서 | 작업 | 위치 | 확인 |
|---|---|---|---|
| P-1 | 백엔드 CORS: `allow_origins`에 `https://admin-beauty.dongri.kr`를 더하고 `tests/test_cors_production_security.py`의 고정 목록을 함께 고친 뒤 백엔드를 배포한다 | `kmcbeauty-fastapi` 저장소(별도 작업) | 백엔드 테스트 통과, 운영 API의 사전 요청(OPTIONS) 응답에 `Access-Control-Allow-Origin: https://admin-beauty.dongri.kr`와 `Access-Control-Allow-Credentials: true` |
| P-2 | 정적 파일 위치 정하기: (가) 호스트의 관리자 웹 전용 디렉터리를 `/srv/server-mini2/compose.yaml`의 `nginx` 서비스에 읽기 전용으로 마운트하거나, (나) 정적 파일 컨테이너를 따로 두고 앞단 nginx가 프록시한다. (가)는 nginx 컨테이너를 다시 만들어야 하므로 같은 서버의 다른 사이트가 잠깐 끊긴다 | 배포 서버 | 디렉터리가 다른 사이트와 겹치지 않는다. `.env.production`의 `SCP_DIR`이 이 디렉터리를 가리킨다 |
| P-3 | 새 server 블록: `server_name admin-beauty.dongri.kr`, 443 ssl + `dongri` 원본 인증서, 정적 파일 루트(또는 P-2 (나)의 프록시), `location / { try_files $uri /index.html; }` | `/srv/server-mini2/nginx/conf.d/`의 새 파일 | `docker exec nginx nginx -t` 통과 |
| P-4 | 보안 헤더를 **server 수준** `add_header`로 둔다(location 안에 두지 않는 기존 규칙): HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Content-Security-Policy: frame-ancestors 'none'`(다른 사이트처럼 처음에는 Report-Only로 시작할 수 있다). 스크립트·스타일 정책은 빌드가 넣는 meta CSP가 맡는다(§B.11) | P-3의 파일 | `curl -sI https://admin-beauty.dongri.kr/`에 헤더가 보인다 |
| P-5 | 캐시: `index.html`은 매번 다시 확인하게, 해시가 붙은 `/assets/*`는 오래 캐시하게 둔다. location 안 `add_header`는 server 수준 헤더를 지우므로 `expires`나 server 수준 `map` 변수로 준다 **(추론 — nginx 상속 규칙, 적용 때 `curl -sI`로 확인)** | P-3의 파일 | 두 경로의 `Cache-Control`이 다르고 보안 헤더가 둘 다 남는다 |
| P-6 | Cloudflare DNS: `admin-beauty.dongri.kr` 레코드를 `api-beauty.dongri.kr`과 같은 방식(프록시 사용)으로 더한다 | Cloudflare | 이름이 풀린다 |
| P-7 | nginx 다시 읽기: `docker exec nginx nginx -t && docker exec nginx nginx -s reload` | 배포 서버 | 다른 사이트(`api-beauty`, `dongri.kr`) 응답이 그대로다 |
| P-8 | 로컬 `.env.production` 작성: `.env.production.example`을 복사한다(`VITE_API_BASE_URL=https://api-beauty.dongri.kr`이 이미 들어 있다). `SCP_*`만 P-2 디렉터리 기준으로 채운다 | 이 저장소 작업 트리(커밋하지 않음) | `git status`에 나타나지 않는다 |
| P-9 | `./deploy.sh` 실행 | 이 저장소 | 빌드·전송 성공, 서버 디렉터리에 `index.html`과 `assets/` |
| P-10 | 사용자 검토 UR-8·UR-2(·UR-3 선택): 로그인, 새로고침(쿠키 갱신), `/customers` 같은 깊은 경로에서 새로고침, 로그아웃, 8개 화면·대화상자·캘린더에서 브라우저 콘솔의 CSP 위반 0건 | 브라우저 | acceptance.md §5 UR-2·UR-3·UR-8 |
| 되돌리기 | P-3 파일을 지우거나 이름을 바꾸고 P-7을 다시 실행한다. DNS 레코드는 남겨도 다른 사이트에 영향이 없다 | 배포 서버 | 다른 사이트 응답이 그대로다 |
