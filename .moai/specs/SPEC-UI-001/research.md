# SPEC-UI-001 조사 보고서

| 항목 | 내용 |
|---|---|
| SPEC | SPEC-UI-001 — 프로젝트 기반과 디자인 시스템(디자인 토큰 · ui-core 컴포넌트 라이브러리 · 컴포넌트 미리보기) |
| 단계 | Phase 8(SPEC 계획) 조사 산출물. 짝 문서: `plan.md`(초안, 결정 지점 1 검토용) |
| 작성 | manager-spec · 2026-10-29 |
| 기준 트리 | `main` HEAD `28c87a9`, `origin/main`과 차이 `0 0`(마지막 fetch 기준). 추적하지 않는 경로는 `.moai/design/`, `.moai/specs/`뿐이다 |
| 디자인 정본 | `.moai/design/system.md` v1.1.0(토큰·규칙 SSOT). 결정 근거는 `design-direction.md`, 레퍼런스 원기록은 `design-dna.json` |

> **표기** — [검증]: 이번 조사에서 명령을 실행해 출력으로 확인했다. [전달]: 오케스트레이터가 이 세션에서 확인해 넘겨준 사실이다. [미검증]: 실행 환경이 없거나 추론에 그친 내용이다. 미검증 항목은 9.4절에 모았다.

---

## 1. 조사 범위와 방법

| 대상 | 방법 |
|---|---|
| 현재 저장소 | `git ls-files`, 설정 파일 전문, `src/` 53개 파일 중 UI 관련 파일 정독, 설치된 패키지 버전(`node_modules/*/package.json`) |
| 레퍼런스 | `reference/my-workspace.zip` 압축 해제본(읽기 전용): `src/styles.css`, `src/ui-core/{index,composites,pattern-components}.tsx`, `package.json`, `vite.config.ts`, `tsconfig.json`, `src/main.tsx`, 테스트 2개 |
| 디자인 문서 | `system.md`, `design-direction.md`(1~905행 전체), `design-dna.json` 전문 |
| 패키지 | `npm view`로 버전·엔진·피어·exports·배포일을 확인했다. 동작이 문제 될 수 있는 10개 패키지는 tarball을 스크래치 디렉터리에 받아 배포 파일을 직접 읽었다: cmdk 1.1.1, react-day-picker 10.0.2, lucide-react 1.64.0, typescript 7.0.2, tailwindcss 4.3.3, @biomejs/biome 2.6.4, @radix-ui/react-toast 1.3.1, @radix-ui/react-alert-dialog 1.2.1, @radix-ui/react-toggle-group 1.2.1, @radix-ui/react-popover 1.3.1. 프로젝트에는 아무것도 설치하지 않았다 |
| 연관 저장소 | `kmcbeauty-fastapi/app/enum/treatment_status.py`, `kmcbeauty-native/components/booking/BookingListScreen.tsx` |
| MoAI 설정 | `.git_hooks/pre-commit`·`pre-push`, `.moai/config/sections/{quality,gate,lsp,git-strategy,mx}.yaml`, `.claude/skills/moai/workflows/gate.md` |

---

## 2. 현재 저장소

### 2.1 스택과 설정

| 항목 | 현재 상태 | 근거 |
|---|---|---|
| 빌드 | Vite 6.2.6 설치(선언 `^6.2.0`), @vitejs/plugin-react 4.3.4 | package.json:50, :41 [검증] |
| UI 런타임 | React·React DOM 19.1.0(선언 `^19.0.0`) | package.json:24-25 [검증] |
| 스타일 | Tailwind 3.4.1 + PostCSS·autoprefixer, `@tailwind base/components/utilities` | tailwind.config.js:1-11, postcss.config.js:1-6, src/index.css:2-4 |
| TypeScript | 5.7.3 설치(선언 `~5.7.2`). 루트 `tsconfig.json`은 `files: []`에 참조 2개만 둔 구조 | package.json:48, tsconfig.json:1-7 |
| 린트·서식 | ESLint 9 flat 설정(ignores `dist`·`.claude`·`.moai`) + Prettier(큰따옴표, 세미콜론, trailingComma all, printWidth 100) | eslint.config.js:9-32, prettier.config.cjs:1-9 |
| 테스트 | Vitest 3.2.7, 설정 파일 없음, 테스트 1개(DOM이 필요 없는 순수 함수) | src/shared/utils/parseErrorMessage.test.ts |
| 패키지 관리 | npm(`package-lock.json`)과 2025-05-30에 멈춘 `bun.lock`이 함께 있다. 로컬에 bun이 없고, pnpm은 Windows 쪽 실행 파일(`/mnt/c/Program Files/nodejs/pnpm`)만 보인다 | `which bun pnpm` [검증] |
| Node | v24.5.0, npm 11.5.1 | [검증] |
| 경로 별칭 | `@` → `src` | vite.config.ts:7-11, tsconfig.app.json:24-27 |
| 개발 프록시 | `/api` → `http://localhost:8000`, `/api` 접두사 제거 | vite.config.ts:12-20 |
| HTML | `lang="en"`, 제목 "Vite + React + TS", `/vite.svg` 아이콘 | index.html:2, :5, :7 |
| 배포 | `.env.stage` 로드 → `bun run build --mode stage` → `scp dist/*` | deploy.sh:5, :15, :25 |
| 환경 변수 | `.env`에 `VITE_API_BASE_URL` 키 하나. 이 값의 호스트에는 DNS 레코드가 없다 | [검증: 키 이름만], [전달: DNS] |
| 문서 | README가 Vite 템플릿 문구 그대로다 | README.md:1-15 |
| 정리할 의존성 | `@types/react-router-dom@^5.3.3`은 자체 타입을 갖춘 react-router-dom 7과 맞지 않는 v5 타입이다 | package.json:36, :26 |

### 2.2 소스 구성

`git ls-files src`는 53개, TS·TSX는 2,481행이다 [검증].

| 영역 | 파일 수 | 내용 |
|---|---|---|
| `src/manager/pages` | 8 | 로그인, 고객 목록, 대시보드(자리표시), 이용약관, 개인정보처리방침, 매장 선택, 예약 캘린더(`treatment/treatmentListPage.tsx`), 시술 메뉴 |
| `src/manager/components` | 8 | GroupCombobox, ShopSelectList, Sidebar, CustomerFormModal, ReservationForm·ReservationModal, 시술 메뉴·세부 항목 폼 모달 |
| `src/manager/{stores,layout}`, `routes.tsx` | 4 + 1 + 1 | 모달 열림 상태 zustand 스토어, ManagerLayout, 라우트 |
| `src/shared/api` | 6 | axios 인스턴스와 API 함수 |
| `src/shared/components` | 5 | ConfirmModal, LoadingSpinner, Modal, NotificationContainer, RequireAuth |
| `src/shared/{hooks,stores,types,utils}` | 3 + 4 + 5 + 2 | useDebounce 등, 확인·알림·매장·토큰 스토어, 타입, parseErrorMessage와 테스트 |
| `src/shared/queryClient.ts` | 1 | TanStack Query 클라이언트 |
| `src/` 루트 | 5 | App.tsx, App.css, index.css, main.tsx, vite-env.d.ts |

- 기존 라우트에는 별도의 "시술 이력" 화면이 없다(routes.tsx:14-54: 로그인·홈·고객·시술 메뉴·예약 캘린더). SPEC-UI-002 목록의 시술 이력은 `getTreatmentList`(status·기간·검색·정렬·페이지 파라미터, src/shared/api/treatment.ts:19-37)를 쓰는 표 화면으로 보이며, 이 해석은 SPEC-UI-002에서 확정해야 한다. 이 SPEC은 그 화면에 필요한 Table·Filter·Pagination까지만 준비한다.

### 2.3 기존 화면이 쓰던 UI 패턴

| 기존 패턴 | 위치 | 이 SPEC의 대응 |
|---|---|---|
| `datetime-local` 두 개(시작·종료) | src/manager/components/reservation/ReservationForm.tsx:45-56 | DateTimePicker |
| `textarea`(메모) | ReservationForm.tsx:63-68 | Textarea |
| TanStack Table + 현재 페이지만 다시 정렬하는 클라이언트 정렬 | src/manager/pages/customers/CustomerList.tsx:122-128 | Table(제어형 정렬, TanStack 보류 — 7.2절) |
| TanStack Table(코어 행 모델만) + 메뉴마다 세부 항목 하위 표 | src/manager/pages/treatment_menu/TreatmentMenuListPage.tsx:69-73, :131-178 | 패널마다 Table 하나 |
| headlessui Combobox — 입력한 글자를 그대로 값으로 쓰는 단일 선택 | src/manager/components/common/GroupCombobox.tsx:20-93 | Combobox(단일 선택 + 새 값 만들기 동작) |
| headlessui Dialog 모달 | src/shared/components/Modal.tsx:17-18, CustomerFormModal.tsx, TreatmentMenuFormModal.tsx, TreatmentDetailFormModal.tsx | Modal |
| zustand 확인 스토어 + `Promise<boolean>` | src/shared/stores/useConfirmStore.ts:12-27, ConfirmModal.tsx:4-50, 호출 CustomerList.tsx:66-71 | ConfirmDialog + 명령형 `showConfirm()`(전역 `window.confirm`과 이름이 겹치지 않게 함) |
| zustand 알림 스토어(3초 고정, 위·오른쪽, 녹색·빨강 팔레트 하드코딩) | src/shared/stores/useNotificationStore.ts:17-34, NotificationContainer.tsx:6-38 | Toast + 명령형 `toast()` |
| LoadingSpinner(전체 화면) | src/shared/components/LoadingSpinner.tsx:8-24, RequireAuth.tsx | Loading |
| 디바운스 검색(150ms) | src/shared/hooks/useDebounce.ts:3, CustomerList.tsx:32, TreatmentMenuListPage.tsx:28 | Search. 디바운스(설계 규칙 300ms)는 소비 측(SPEC-UI-002) |
| 서버 페이지네이션(번호 5개 창) | CustomerList.tsx:132-134, :207-236 | Pagination |
| 번호를 모두 나열하는 페이지네이션 | TreatmentMenuListPage.tsx:182 | Pagination |
| 사이드바(링크 4개, lucide 아이콘, 경로가 정확히 같을 때만 활성) | src/manager/components/common/Sidebar.tsx:74-97, :118-134 | Sidebar |
| 행 동작 아이콘 버튼(수정·삭제) — 접근 가능한 이름 없음 | CustomerList.tsx:104-117(버튼 109-114) | Button `size="icon"` + `aria-label` + Tooltip |
| 매장 선택용 카드형 버튼 목록 | src/manager/components/common/ShopSelectList.tsx:37-51 | Card + Button 조합(SPEC-UI-002에서 조립) |
| FullCalendar 주간 시간표(`locale="ko"`), 이벤트 클릭 시 `alert()` | src/manager/pages/treatment/treatmentListPage.tsx:80-93, :64, :71 | SPEC-UI-002(토큰 연결 포함) |
| CSV 내보내기(file-saver) | CustomerList.tsx:46-61 | SPEC-UI-002 |

### 2.4 암묵적 계약

1. **pre-commit 품질 게이트** — `.git/hooks/pre-commit`은 `.git_hooks/pre-commit`과 같은 파일(3,245바이트)이고, 61-71행에서 `moai gate`를 실행한다 [검증]. `moai gate --help`는 "vet / lint / test"를 수행하고 단계별 시간 제한을 `gate.yaml`에서 읽는다고 밝힌다(vet 30초, lint 60초, test 120초) [검증]. 게이트는 `npm test`를 실행하며 스크립트가 없으면 실패한다 [전달]. MoAI 문서는 TypeScript 프로젝트의 단계를 `tsc --noEmit`, `eslint`, `vitest run`으로 적는다(.claude/skills/moai/workflows/gate.md:55) [검증]. 바이너리에 내장된 셸 스크립트에는 `run_step eslint c1 eslint .`(도구가 PATH에 있을 때만 실행)이 있지만, 이것이 `moai gate`와 같은 경로인지는 확인하지 못했다 [미검증]. 이로부터 네 가지가 따른다.
   - `npm test`는 언제나 존재하고 통과해야 한다. Vitest는 테스트 파일이 하나도 없으면 실패로 끝나는 것이 기본 동작이므로 [미검증: M1에서 확인], 기존 코드를 지우는 커밋에 새 테스트가 함께 들어가야 한다.
   - 루트 `tsconfig.json`이 지금처럼 `files: []` 참조형이면 `tsc --noEmit`이 아무 파일도 검사하지 않는다. 단일 `tsconfig.json`이 `src`를 직접 포함해야 게이트의 타입 검사가 의미를 갖는다.
   - 게이트의 린트 단계는 ESLint를 기준으로 하므로 Biome으로 바꾸면 게이트가 Biome을 실행하지 않을 가능성이 크다. 마일스톤 검증에서 `npm run lint`를 따로 실행해야 한다.
   - 테스트 단계 제한이 120초이므로 테스트 스위트는 실제 타이머·네트워크 없이 빠르게 끝나야 한다.
2. **pre-push** — Makefile이 없으면 ci-local을 건너뛰고(.git_hooks/pre-push:24-37), 커밋 제목 검증은 `moai hook pre-push`가 맡는다(:53-76). `enforce_on_push=false` [전달].
3. **배포** — deploy.sh는 `.env.stage`(로컬에 없음)를 읽고 bun으로 빌드한 뒤 scp로 올린다(:5, :15, :25). 로컬에 bun이 없으므로 지금 상태로는 실행되지 않는다.
4. **예약 상태 정합성** — 백엔드 enum은 5종이다: RESERVED, VISITED, CANCELLED, NO_SHOW, COMPLETED(kmcbeauty-fastapi/app/enum/treatment_status.py:4-19, 백엔드 라벨 예약됨·방문 및 시술 완료·취소됨·노쇼·시술 완료) [검증]. 네이티브 앱 라벨은 예약됨·방문함·완료·취소됨·노쇼(BookingListScreen.tsx:22-28), 배지 색은 `#4f46e5`·`#a21caf`·`#0369a1`·`#dc2626`·`#b45309`(:33-39)로 system.md §2의 라이트 상태 레일 값과 같다 [검증]. 기존 관리자 타입 `"RESERVED" | "CANCELLED" | "FINISHED"`(src/shared/types/treatment.ts:4)는 폐기 대상이다. 참고로 백엔드는 VISITED만 자동 완료 대상으로 삼는다(treatment_status.py:25-33) — 방문함 다음에 완료가 오는 흐름을 시사하지만, 두 상태의 업무 뜻은 SPEC-UI-002에서 정한다.
5. **서버 목록 응답** — `{ items, total, page, size, pages }`(src/shared/types/phonebook.ts:19-25, src/shared/api/treatment.ts:28-34). Pagination은 1부터 세는 `page`와 `pageCount`(= `pages`)를 받으면 된다.
6. **조회 파라미터** — `status`, `search`, `sort_by`, `sort_order`, `page`, `size`(src/shared/api/treatment.ts:19-27). 정렬과 필터가 서버 쪽에 있으므로 Table은 제어형 정렬을, Filter는 단일 값을 내보내면 된다.
7. **기존 경로** — `/manager/*`, `/login`, `/privacy-policy`, `/terms-of-service`, `/manager/shops/selected`(src/App.tsx:13-50, src/manager/routes.tsx:14-54). 북마크 호환은 SPEC-UI-002의 몫이다.
8. **보안 관찰** — 대시보드가 접근 토큰을 화면에 그대로 출력한다(src/manager/pages/dashboard/DashboardPage.tsx:9). 이번 재구축으로 사라지며, SPEC-UI-002가 되살리면 안 된다.
9. **git 제외 목록** — `dist`, `node_modules`, `.env*`, MoAI 런타임 디렉터리는 제외돼 있지만(.gitignore:10-43) `coverage/`는 없다. 커버리지 산출물을 쓰려면 한 줄을 더해야 한다.

---

## 3. 레퍼런스 분석

### 3.1 구성

- 컴포넌트 21개가 파일 3개에 모여 있다: `index.tsx` 7개(Button, Badge, Loading, Input, Select, Card, Alert), `composites.tsx` 6개(Checkbox, Modal, Tabs, Pagination, Toast, FileUpload), `pattern-components.tsx` 8개(Table, Search, Filter, Navbar, Sidebar, Breadcrumb, Chart, Form). `cn`은 index.tsx:7, 나머지 두 파일은 index.tsx:115-117에서 다시 내보낸다.
- 별칭 `@hub/ui-core` → `src/ui-core/index.tsx`(vite.config.ts:5, tsconfig.json:21-29). 의존성 고정값은 package.json:17-40.
- 테스트 2개(patterns.test.ts:3, workspace.test.ts:3)는 템플릿 목업 데이터만 검사한다. ui-core 테스트는 하나도 없다.

### 3.2 그대로 가져올 것

| 항목 | 근거 |
|---|---|
| 토큰 우선 구조(런타임 변수 → `@theme inline` → 유틸리티) | Reference: my-workspace/src/styles.css:8-47 |
| `.dark` 클래스 기반 다크 모드 | Reference: my-workspace/src/styles.css:7 |
| 소스 소유형 Button(Radix Slot + CVA + `cn`, `loading`과 `aria-busy`) | Reference: my-workspace/src/ui-core/index.tsx:7-62 |
| Radix Dialog·Tabs·Checkbox 사용 | Reference: my-workspace/src/ui-core/composites.tsx:7-98 |
| 한국어 접근 이름("닫기", "페이지 이동", "알림 닫기") | Reference: my-workspace/src/ui-core/composites.tsx:60, :109, :146 |
| 표 머리글 `scope="col"` | Reference: my-workspace/src/ui-core/pattern-components.tsx:26 |
| 감속 모드 전역 안전망, 글꼴 스택 | Reference: my-workspace/src/styles.css:195-200, :19-26, :202-205 |

### 3.3 고칠 것 — design-direction §4.2의 R1~R16

| # | 레퍼런스의 약점(근거) | 이 SPEC의 대응 | 자동 확인 수단 |
|---|---|---|---|
| R1 | 전역 요소 스타일·전역 클래스(styles.css:48-126, :127-194) | 전역 CSS는 토큰 + 기본 계층만 | 디자인 규칙 점검 테스트(스타일 파일에 허용 밖 클래스 선택자 없음) |
| R2 | Badge 한 가지 색(index.tsx:63-65) | Badge `tone` 5종 | badge.test |
| R3 | Select·Filter가 문자열 배열(index.tsx:78-89, pattern-components.tsx:72-93) | `{ value, label, disabled? }` | select.test, filter.test |
| R4 | Toast 하나만(composites.tsx:132-151) | 대기열(최대 3) | toast.test(가짜 타이머) |
| R5 | Sidebar가 `<button>`과 문자열(pattern-components.tsx:116-134) | `{ to, label, icon }`, 링크 컴포넌트 주입, `aria-current`, 접힘 | sidebar.test |
| R6 | 입력 하나짜리 Form 데모(pattern-components.tsx:199-231) | Field | field.test |
| R7 | 강조색 다크 값 없음, `dark:text-slate-950` 라벨 3.90:1(styles.css:28-38, index.tsx:13) | 모든 토큰을 라이트·다크 쌍으로 | 대비 회귀 테스트(104쌍 + 상태 90개 값) |
| R8 | 팔레트 하드코딩 `text-white`·`bg-rose-700`·`bg-black/50`(index.tsx:13, :17, composites.tsx:50) | 기본 테마 정리 + 토큰 클래스만 | 기본 테마 정리 테스트 + 규칙 점검 테스트 |
| R9 | `--radius-lg` 덮어쓰기로 버튼 12px·입력 8px(styles.css:46, index.tsx:9, styles.css:113) | 의미 이름 반경(`panel`·`control`·`badge`·`chip`) | 기본 테마 정리 테스트(`rounded-lg` 무효) |
| R10 | `--color-muted`가 글자색(styles.css:44) | `muted`(면) / `muted-foreground`(글자) | 대비 테스트 T10·T11 |
| R11 | `outline-none` + box-shadow 링(index.tsx:9) | `outline` 포커스, `outline-none` 금지 | 규칙 점검 테스트 |
| R12 | 11px 배지, 30px·-1px 제목(styles.css:162, :170-171) | 최소 12px, 자간 -0.02em까지 | 기본 테마 정리 테스트(`text-*` 하위 값), 규칙 점검 테스트(`text-xs` 등 금지) |
| R13 | 설명이 없으면 범용 문구를 채움(composites.tsx:55-57) | 설명은 있을 때만, 그때만 `aria-describedby` | modal.test |
| R14 | 10% 틴트 위 강조 글자 4.49:1 | `*-subtle-foreground` 토큰 | 대비 테스트 T18·T24·T27·T30 |
| R15 | 정적 안내에도 `role="alert"`(index.tsx:106-107, composites.tsx:175) | Alert는 `live`일 때만 `role="alert"` | alert.test |
| R16 | `loading`이 `disabled`가 돼 포커스를 잃음(index.tsx:54) | `aria-disabled` + `aria-busy`, 포커스 유지 | button.test |

### 3.4 R 목록 밖에서 찾은 약점

| 약점 | 근거 | 대응 |
|---|---|---|
| Tabs가 라벨을 값으로 쓴다 | Reference: my-workspace/src/ui-core/composites.tsx:76, :84 | `{ value, label, content }` |
| Pagination이 "현재 / 전체"만 보여 준다 | composites.tsx:118-120 | 번호 + 줄임표 + `aria-current` |
| Search의 접근 이름이 placeholder다 | pattern-components.tsx:63 | `aria-label`을 따로 받는다 |
| Breadcrumb 이름이 "탐색 경로", 구분 기호가 "/" | pattern-components.tsx:143, :149 | "현재 위치", `ChevronRight`(`aria-hidden`) |
| 표 빈 상태 문구가 합니다체 한 줄 | pattern-components.tsx:13 | EmptyState(해요체, 동작 하나) |
| 테마 전환 버튼을 DOM에 직접 붙이고 인라인 HEX를 쓴다 | Reference: my-workspace/src/main.tsx:4-7 | ThemeProvider + ThemeToggle + 깜빡임 방지 스크립트 |
| 모달 닫기 버튼 누름 영역이 약 28px(`p-1` + 20px 아이콘) | composites.tsx:59-62 | `icon-sm`(32px) |
| 비활성 불투명도가 버튼 45%, 체크박스 40%로 제각각 | index.tsx:9, composites.tsx:21 | 50% + `cursor-not-allowed`로 통일 |

### 3.5 가져오지 않는 것

템플릿 화면(`src/Workspace.tsx` 665행, `src/model.ts`, `src/patterns/`, `src/workspace.css`)은 화면 구성과 목업 데이터이므로 채택 대상이 아니고 분석하지 않았다.

---

## 4. 디자인 입력 정리

### 4.1 문서 역할

- `system.md`가 토큰과 UI 규칙의 정본이다. 값을 바꿀 때는 이 문서를 먼저 고친다(system.md §13).
- `design-direction.md`는 결정 당시의 근거 기록이므로 고치지 않는다.
- `design-dna.json`은 레퍼런스를 있는 그대로 적은 기록이며 구현 목표가 아니다(design-dna.json:182).

### 4.2 수치

| 항목 | 값 | 근거 |
|---|---|---|
| 색 토큰 | 36개 = 면·중립 14 + 톤 22(primary 5, info 별칭 4, success 4, warning 4, destructive 5) | system.md §2, design-direction §6.2 |
| 예약 상태 토큰 | 15개(상태 5 × `bg`·`fg`·`rail`) | system.md §2 |
| 반경 | `--radius` 12px 하나에서 `panel` 12 · `control` 8 · `badge` 6 · `chip` 4 | system.md §6 |
| 글자 크기 | 7단계(`caption` 12 ~ `display` 28), 각각 줄높이·자간 하위 값 | system.md §4 |
| 대비 쌍 | 테마당 기준이 있는 52쌍(T01~T36 텍스트 4.5:1, U01~U16 UI 3:1) + 장식 2쌍(D01·D02) = 54행. system.md §13의 "54쌍"은 장식 2쌍을 포함한 수다 | design-direction §5.5 |
| 예약 상태 대비 | 90개 값(상태 5 × 테마 2 × 측정 9) | design-direction §5.5 두 번째 표 |
| 기록된 최저값 | 라이트 텍스트 4.86(T16)·UI 3.04(U04), 다크 텍스트 5.39(T11)·UI 3.03(U04), 상태 라이트 텍스트 4.66·레일 3.95, 상태 다크 텍스트 5.44·레일 4.46 | design-direction §5.5, §18 |

### 4.3 결정 D1~D9

| # | 결정 | 이 SPEC에 미치는 영향 |
|---|---|---|
| D1 | 상태 집합 = 백엔드 enum 5종 | ui-core는 상태를 모른다. 토큰만 제공 |
| D2 | 네이티브 앱과 같은 색 계열, 전용 `status-*` 토큰, 방문함 아이콘 `DoorOpen` | 토큰 15개, 미리보기 시연 |
| D3 | UI 문체 해요체 | 기본 문구("불러오는 중…", "알림 닫기" 등)와 미리보기 예문 |
| D4 | 24시간제 `HH:mm` | DateTimePicker 시간 칸 |
| D5 | 입력 테두리 `#808b9d` | `input` 토큰 |
| D6 | 사이드바 240 / 64px | `--sidebar-width`, `--sidebar-width-collapsed` |
| D7 | 테마 기본값 시스템 | ThemeProvider 기본값, 깜빡임 방지 스크립트 |
| D8 | Tailwind 기본 테마 정리 적용 | `@theme` 정리 + 자동 테스트 |
| D9 | cmdk 1.1.1 + Radix Popover 1.3.1, react-day-picker 10.0.2 + date-fns 4.4.0 `ko` | Combobox·Calendar·DateTimePicker(6.3·6.4절의 위험) |

### 4.4 구현 단계 확인 항목(design-direction §6.5)

| # | 항목 | 확인 수단(plan.md §E.4) |
|---|---|---|
| 1 | `@theme inline` 안에서 `--color-*: initial`을 써도 되는가 | 정리용 `@theme`과 매핑용 `@theme inline`을 나누어 질문 자체를 피하고, Tailwind `compile` API 테스트로 결과 확인 |
| 2 | 정리 뒤에도 `rounded-full`·`rounded-none`·`bg-transparent`·`bg-current`·`shadow-none`이 남는가 | 같은 테스트 |
| 3 | `--text-*--letter-spacing`이 `text-*`에 함께 적용되는가 | 같은 테스트(`text-heading`의 `letter-spacing`) |
| 4 | `outline-hidden`이 forced-colors에서 윤곽선을 남기는가 | 같은 테스트(생성된 CSS의 `forced-colors` 블록) + 수동 확인 |
| 5 | Noto Sans KR Variable의 `tnum` 지원 | 미리보기 측정 장치 + 사용자 검토(자동화 불가, 9.4절) |
| 6 | react-day-picker 10 API | calendar·date-time-picker 테스트 |
| 7 | cmdk를 Popover 안에 넣었을 때의 ARIA | combobox 테스트(6.3절에서 고정 속성을 확인함) |

---

## 5. 라이브러리와 버전

### 5.1 채택 (모두 정확한 버전으로 고정, `^` 없음)

| 패키지 | 버전 | 엔진·피어 조건 | 확인 | 비고 |
|---|---|---|---|---|
| react, react-dom | 19.3.1 | react-dom 피어 react `^19.3.1` | [검증] | 레퍼런스와 같음 |
| vite | 8.3.5 | node `^20.19.0 \|\| >=22.12.0` | [검증] | |
| @vitejs/plugin-react | 6.1.2 | 피어 vite `^8.0.0` | [검증] | Vite 8 전용 |
| tailwindcss, @tailwindcss/vite | 4.3.3 | @tailwindcss/vite 피어 vite `^5.2.0 \|\| ^6 \|\| ^7 \|\| ^8` | [검증] | `compile` API를 내보낸다(dist/lib.d.mts) |
| typescript | 5.9.3 | node `>=14.17`, bin `tsc`·`tsserver` | [검증] | 7.0.2·6.0.3과의 비교는 7.1절 |
| vitest, @vitest/coverage-v8 | 5.0.5 | node `^22.12.0 \|\| ^24.0.0 \|\| >=26.0.0`, 피어 vite `^6.4.0 \|\| ^7.0.0 \|\| ^8.0.0`, coverage 피어 vitest `5.0.5` | [검증] | |
| jsdom | 29.1.1 | node `^20.19.0 \|\| ^22.13.0 \|\| >=24.0.0` | [검증] | 최신 30.1.3은 로컬 Node와 맞지 않음(6.2절) |
| @testing-library/react | 16.3.3 | 피어 react `^18 \|\| ^19`, **@testing-library/dom `^10.0.0`** | [검증] | dom을 직접 설치해야 한다 |
| @testing-library/dom | 10.4.2 | node `>=18` | [검증] | 새로 추가 |
| @testing-library/user-event | 14.6.8 | 피어 @testing-library/dom `>=7.21.4` | [검증] | |
| @testing-library/jest-dom | 7.0.1 | node `>=22`, 피어 vitest `>=0.32`·@testing-library/dom `>=10 <11`, `./vitest` 진입점 | [검증] | |
| axe-core | 4.14.0 | node `>=4` | [검증] | 새로 추가 — 자동 접근성 검사 |
| @biomejs/biome | 2.6.4 | node `>=14.21.3`, 설정 스키마에 `css.parser.tailwindDirectives` | [검증: tarball 스키마] | ESLint·Prettier 대체 |
| @radix-ui/react-slot · dialog · alert-dialog · popover · select · checkbox · tabs · toast | 1.5.0 · 1.3.1 · 1.2.1 · 1.3.1 · 2.4.1 · 1.4.1 · 1.2.1 · 1.3.1 | 피어 react `^19` 포함 | [전달] + popover·select [검증] | |
| @radix-ui/react-tooltip | 1.4.1 | 피어 react `^16.8 \|\| … \|\| ^19.0` | [검증] | 새로 추가 — 접힌 사이드바, 아이콘 버튼 |
| @radix-ui/react-toggle-group | 1.2.1 | 피어 react `^16.8 \|\| … \|\| ^19.0` | [검증] | 새로 추가 — Filter, ThemeToggle |
| cmdk | 1.1.1 | 피어 react `^18 \|\| ^19`, 의존 @radix-ui/react-dialog `^1.1.6` 외 | [검증] | ARIA 고정 속성(6.3절) |
| react-day-picker | 10.0.2 | 피어 react `>=16.8.0`, 의존 date-fns `^4.1.0`·@date-fns/tz `^1.4.1` | [검증] | 레거시 패키지 이름(6.4절) |
| date-fns | 4.4.0 | `./locale/ko` 진입점 있음 | [검증] | |
| lucide-react | 1.64.0 | 피어 react `^16.5.1 \|\| … \|\| ^19.0.0` | [검증: tarball d.ts] | 아이콘 이름(6.5절) |
| class-variance-authority, clsx, tailwind-merge | 0.7.1, 2.1.1, 3.7.0 | — | [검증] | tailwind-merge 테마 키 등록 필요(6.8절) |
| @fontsource-variable/noto-sans-kr | 5.3.1 | — | [검증] | `tnum` 미검증 |
| @types/react, @types/react-dom | 19.3.0 | — | [검증] | |
| @types/node | 24.19.2 | Node 24 계열 최신 | [검증] | `vite.config.ts`의 `node:url` |

### 5.2 제거

- 런타임: `@fullcalendar/*` 4개, `@headlessui/react`, `@tanstack/react-query`, `@tanstack/react-table`, `axios`, `file-saver`, `react-router-dom`, `zustand`. 이 SPEC은 화면·API·라우팅을 만들지 않으므로 쓰지 않는다. SPEC-UI-002가 필요한 것만 버전을 새로 확인해 다시 넣는다.
- 개발: ESLint 계열 8개(`@eslint/js`, `eslint`, `eslint-config-prettier`, `eslint-plugin-prettier`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`, `typescript-eslint`), `prettier`, `postcss`, `autoprefixer`, `@tanstack/react-query-devtools`, `@types/file-saver`, `@types/react-router-dom`.

### 5.3 보류·대체 검토

| 패키지 | 판단 | 근거 |
|---|---|---|
| @tanstack/react-table 9.3.1 | 보류 | 9.0.0이 2026-08-04에 나온 새 메이저이고 상태 모델이 `@tanstack/react-store`로 바뀌었다 [검증]. 기존 화면이 쓰던 기능은 현재 페이지만 정렬하는 클라이언트 정렬이라 서버 페이지네이션과 뜻이 맞지 않는다(7.2절) |
| @daypicker/react 10.0.2 | 쓰지 않음 | `react-day-picker@10.0.2`를 그대로 의존하는 새 이름의 껍데기 패키지다 [검증]. D9 결정대로 `react-day-picker`를 쓴다 |
| @radix-ui/react-label 2.1.17 | 쓰지 않음 | 네이티브 `<label>`로 충분하다(Simplicity 단계 4: 플랫폼 기능 우선) |
| @radix-ui/react-dropdown-menu | 보류 | 테마 전환은 ToggleGroup으로 해결. 상단바 사용자 메뉴가 생기는 SPEC-UI-002에서 다시 판단 |
| happy-dom 21.0.4 | 쓰지 않음 | 7.6절 |

---

## 6. 확인한 위험 요소

### 6.1 TypeScript 7.0.2의 패키지 구조 [검증]

- `npm view typescript@7.0.2`: `"bin": {"tsc": "bin/tsc"}`, `exports["."] = "./lib/version.cjs"`(그 밖에는 `./unstable/*`뿐). 의존성은 플랫폼별 네이티브 패키지(`@typescript/typescript-linux-x64` 등)다. tarball의 `bin/`에는 `tsc` 하나, `lib/`에는 `getExePath.js`·`tsc.js`·`version.cjs`만 있다.
- 따라서 7.0.2에는 `require("typescript")` 컴파일러 API와 `tsserver`가 없다. 편집기의 "작업 공간 TypeScript 사용"과 MoAI LSP 설정이 쓰는 typescript-language-server(.moai/config/sections/lsp.yaml:303-312)는 tsserver를 감싸는 서버이므로 7.0.2와 맞물리지 않는다.
- 이 스택의 빌드·테스트 도구(Vite 8과 plugin-react 6은 Oxc 변환, Vitest는 Vite 변환, Biome은 자체 파서)는 TS 컴파일러 API를 쓰지 않으므로 `tsc --noEmit`만 보면 7.0.2도 쓸 수 있다. 손해는 편집기와 LSP 쪽에 생긴다.
- 배포일: 5.9.3 = 2025-09-30, 6.0.3 = 2026-04-16(`tsserver` 있음), 7.0.2 = 2026-07-08. 비교와 결정은 7.1절.

### 6.2 jsdom 30의 엔진 조건 [검증]

- jsdom 30.0.0~30.1.3: node `^22.22.2 || ^24.15.0 || >=26.0.0`. 로컬 Node 24.5.0은 조건을 채우지 못한다.
- jsdom 29.1.1: node `^20.19.0 || ^22.13.0 || >=24.0.0` — 충족한다. vitest 5.0.5는 jsdom 피어를 `*`로 둔다.

### 6.3 cmdk 1.1.1의 ARIA 고정 속성 [검증]

`dist/index.mjs`의 입력 요소는 사용자 속성을 먼저 펼친 뒤 고정 속성을 덮어쓴다.

```text
createElement(D.input,{ref:o,...u,"cmdk-input":"",autoComplete:"off",autoCorrect:"off",spellCheck:!1,
 "aria-autocomplete":"list",role:"combobox","aria-expanded":!0,"aria-controls":b.listId,
 "aria-labelledby":b.labelId,"aria-activedescendant":p,id:b.inputId,type:"text",...})
```

- `aria-expanded`가 언제나 `true`이고, `id`·`aria-labelledby`·`aria-controls`도 cmdk 내부 값으로 고정된다. props로 바꿀 수 없다. 반면 `aria-describedby`, `aria-invalid`, `aria-required`처럼 고정 목록에 없는 속성은 그대로 전달된다.
- 루트 `Command`는 시각적으로 숨긴 `<label cmdk-label htmlFor={inputId} id={labelId}>`를 항상 렌더링한다. 목록은 `role:"listbox"`·`id:b.listId`·`tabIndex:-1`을, 항목은 생성된 `id`·`role:"option"`·`aria-selected`·`data-selected`를 고정으로 갖는다. 목록은 `ResizeObserver`를 쓴다.
- 키보드는 루트의 `onKeyDown`이 처리한다(↓↑, Home/End, Enter, Ctrl+N/J/P/K). 사용자 `onKeyDown`을 먼저 부르고 `defaultPrevented`를 존중하며, **IME 조합 중(`isComposing` 또는 `keyCode === 229`)에는 처리하지 않는다** — 한글 입력에 안전하다. 다만 Home/End를 가로채 `preventDefault`하므로 편집형 입력에서는 글자 커서 이동이 막힌다.
- `shouldFilter`가 `false`이면 내부 필터를 건너뛴다.
- 결과: 입력이 닫힌 상태에서도 보이는 편집형 콤보박스(설계 문서가 요구하는 APG 목록 자동완성 패턴)에 `Command.Input`을 그대로 쓰면 ① 닫힌 상태의 `aria-expanded`가 틀리고 ② Field가 주는 `id`로 라벨을 연결할 수 없다. 해결 방향은 7.3절.

### 6.4 react-day-picker 10 [검증]

- README 5행: "`react-day-picker`는 레거시 패키지 이름이며 v10에서도 같은 DayPicker API를 제공하지만 새 프로젝트는 `@daypicker/react`를 쓰라"는 안내가 있다. `@daypicker/react@10.0.2`는 `react-day-picker@10.0.2` 하나만 의존한다. D9대로 `react-day-picker`를 써도 코드는 같다.
- `UI` 요소 이름(classNames 키)은 v9과 같다: `root`, `months`, `month`, `month_caption`, `caption_label`, `nav`, `button_previous`, `button_next`, `month_grid`, `weekdays`, `weekday`, `weeks`, `week`, `day`, `day_button`, `footer` 등. 상태 이름은 `selected`·`disabled`·`hidden`·`outside`·`focused`·`today`.
- props: `locale?: Partial<DayPickerLocale>`, `weekStartsOn`, `classNames`, `modifiers`, `modifiersClassNames`, `components`, `navLayout`, `captionLayout`, `animate`, `timeZone`, `noonSafe`, `disabled`, `mode`·`selected`·`onSelect`가 있다.
- `react-day-picker/locale`의 `ko`는 "DayPicker 전용 번역을 더한 한국어 로캘"(`dist/esm/locale/ko.d.ts`)이며 date-fns `Locale`을 확장한다.
- 이 패키지는 기본 CSS를 `./style.css`로 따로 내보낸다. 이 SPEC은 그 CSS를 가져오지 않고 classNames를 모두 토큰 유틸리티로 지정한다.
- 확인하지 못한 것: 키보드 이동·포커스 관리가 jsdom에서 기대대로 동작하는지 [미검증]. shadcn/ui Calendar 예제는 v9 기준이므로 옮기지 않는다.

### 6.5 lucide-react 1.64.0 [검증]

- 설계 문서가 쓰는 정식 이름이 모두 `declare const <이름>: LucideIcon;`으로 있다: `LoaderCircle`, `CircleAlert`, `CalendarClock`, `DoorOpen`, `CircleCheck`, `Ban`, `UserX`, `Info`, `TriangleAlert`, `Check`, `Minus`, `ChevronDown`·`Up`·`Left`·`Right`, `ChevronsUpDown`, `PanelLeftClose`, `PanelLeftOpen`, `Sun`, `Moon`, `Monitor`, `Search`, `X`, `Calendar`, `CalendarDays`, `Clock`, `Ellipsis`, `Inbox`, `SearchX`, `House`, `Users`, `Settings`, `LogOut`, `Plus`, `Pencil`, `ArrowUp`·`ArrowDown`·`ArrowUpDown`, `Menu`, `Store`(40개 확인).
- 옛 이름은 별칭으로만 남아 있다: `LoaderCircle as Loader2`, `CircleAlert as AlertCircle`, `House as Home`, `TriangleAlert as AlertTriangle`, `Trash as Trash2`, **`CircleCheckBig as CheckCircle`**(설계의 `CircleCheck`와 다른 아이콘). 기존 코드가 쓰던 `Loader2`·`Trash2`는 별칭이다.
- 접근 가능한 이름 속성이 없으면 `aria-hidden="true"`를 자동으로 붙인다(`shared/src/build/buildLucideIconNode.mjs`의 `hasA11yProp === false` 분기). 장식 아이콘은 따로 숨기지 않아도 된다.

### 6.6 Radix 동작 [검증]

- Toast 1.3.1: `startTimer`가 `duration === Infinity`이면 타이머를 시작하지 않는다 — 오류 토스트를 닫을 때까지 유지할 수 있다. `type`이 foreground면 `aria-live="assertive"`, 아니면 `polite`.
- AlertDialog 1.2.1: 열릴 때 `onOpenAutoFocus`에서 취소 버튼(`cancelRef`)에 포커스한다 — 위험 동작의 첫 포커스를 '취소'에 두는 규칙을 기본 동작으로 충족한다.
- ToggleGroup 1.2.1: `type="single"`이면 루트 `role="radiogroup"`, 항목 `role="radio"` + `aria-checked`, 방향키 이동(`rovingFocus`·`loop` 기본 `true`).
- Popover 1.3.1: Content가 `role: "dialog"`를 먼저 주고 사용자 props를 뒤에 펼친다 — 콤보박스 목록 팝업처럼 대화상자 의미가 맞지 않는 곳에서는 `role`을 덮어쓸 수 있다.
- Dialog는 설명이 없을 때 `aria-describedby={undefined}`를 주지 않으면 개발 경고를 낸다 [미검증: 일반적으로 알려진 동작, 테스트에서 확인].

### 6.7 Tailwind 4.3.3

- [검증] `tailwindcss` 패키지가 `compile`, `compileAst`, `__unstable__loadDesignSystem`을 내보낸다(dist/lib.d.mts). 기본 테마(`theme.css`)의 네임스페이스 정의 수: `--color-*` 288, `--radius-*` 8, `--shadow-*` 8, `--text-*` 31, `--font-*` 12, `--container-*` 13. `--text-sm--line-height` 같은 하위 값 구조가 있다.
- [미검증] 정리(`initial`) 뒤의 실제 생성 결과. 그래서 정리용 `@theme` 블록과 매핑용 `@theme inline` 블록을 나누고, `compile` API로 생성 CSS를 검사하는 테스트를 M1에 둔다.
- [추론] Tailwind 4의 자동 소스 감지는 `.gitignore`에 없는 파일을 훑는다. `.claude/`·`.moai/`의 문서는 git에 들어가므로 문서에 적힌 클래스 이름이 CSS로 생성될 수 있고, 생성 결과가 문서 내용에 따라 달라진다. `@import "tailwindcss" source("..")`(src/styles/index.css 기준 → `src/`)로 감지 범위를 좁힌다. 레퍼런스도 `@source "./"`로 범위를 지정했다(Reference: my-workspace/src/styles.css:207).

### 6.8 tailwind-merge 3과 사용자 정의 테마 이름 [미검증 — 테스트로 확인]

tailwind-merge는 기본 설정에서 `text-body` 같은 사용자 정의 글자 크기 이름을 크기 단계로 알아보지 못하고 글자색으로 분류하는 것으로 알려져 있다. 그러면 `cn("text-body text-muted-foreground")`에서 `text-body`가 지워진다. `rounded-panel`, `shadow-raised`, `max-w-content`도 같은 문제를 가질 수 있다. `extendTailwindMerge`로 테마 키(`text`, `radius`, `shadow`, `container`)에 이 SPEC의 이름을 등록하고, 병합 결과를 `cn.test.ts`로 고정한다.

### 6.9 품질 게이트와 Biome

- [검증] Biome 2.6.4 설정 스키마의 `CssParserConfiguration`에 `tailwindDirectives`가 있다. Tailwind 4 지시어(`@theme`, `@custom-variant`, `@source`)를 읽으려면 켜야 한다.
- [추론] `moai gate`의 린트 단계는 ESLint 기준이라(2.4절) Biome을 실행하지 않을 가능성이 크다. `npm run lint`를 마일스톤 검증에 넣고, M1에서 `moai gate`를 실제로 돌려 어떤 단계가 실행되는지 기록한다.
- [검증] 옛 Prettier 설정(큰따옴표, 세미콜론, trailingComma all, printWidth 100)을 Biome 서식 설정으로 옮기면 팀의 기존 습관을 유지할 수 있다.

### 6.10 Vite 8과 플러그인 [검증: 피어만]

- plugin-react 6.1.2(피어 vite `^8.0.0`), @tailwindcss/vite 4.3.3(`^8` 포함), vitest 5.0.5(`^8` 포함) — 피어 조건은 모두 맞는다. 실제 빌드는 M1에서 확인한다.
- 막힐 때의 대체 조합: Vite 7.3.7 + @vitejs/plugin-react 5.2.0(피어 vite `^4.2.0 … ^7.0.0 || ^8.0.0`, 레퍼런스가 쓰던 조합) + vitest 5.0.5(`^7` 포함). 다만 의존성은 정확히 고정하므로(REQ-UI-001-001), 이 조합은 사용자 승인 뒤 SPEC을 개정해야 쓸 수 있다(plan.md §B B-09, spec.md C5).

### 6.11 jsdom에서 Radix·cmdk 실행 [추론]

jsdom에는 `ResizeObserver`, `Element.prototype.scrollIntoView`, 포인터 캡처(`hasPointerCapture` 등), `window.matchMedia`가 없거나 불완전하다. cmdk 목록은 `ResizeObserver`를 쓰고(6.3절), Radix Select는 포인터 이벤트를, 테마는 `matchMedia`를 쓴다. 테스트 설정 파일에서 없을 때만 대체 구현을 넣는다.

### 6.12 HMR [추론, 영향 작음]

컴포넌트와 일반 함수(`toast`, `showConfirm()`)를 한 파일에서 함께 내보내면 Vite가 그 파일을 Fast Refresh 대신 전체 새로고침으로 처리할 수 있다. 개발 편의 문제일 뿐이라 받아들인다.

### 6.13 운영 배포 공백 [추론]

기존 코드를 같은 자리에서 걷어내므로 M1 커밋부터(SPEC-UI-001이 끝난 뒤에도) `main`의 앱은 컴포넌트 미리보기 한 페이지뿐이다. 이때 `deploy.sh`를 실행하면 운영 관리자 화면이 미리보기로 바뀐다. 배포는 수동이므로 SPEC-UI-002가 끝날 때까지 배포를 멈추기로 결정 지점 1에서 확정했고, `deploy.sh`에 opt-in 변수 없이는 종료하는 배포 중지 가드를 M1 커밋에 넣는다(plan.md §A.2, REQ-UI-001-004).

### 6.14 검토 반영 때 추가로 확인한 동작 [검증] (2026-10-29)

plan-auditor 실행 전 검토에서, 인수 기준이 라이브러리 기본 동작에 기대는 부분을 배포 패키지에서 다시 확인했다. 패키지는 npm 레지스트리 tarball(`npm pack <패키지>@<버전>`)을 풀어 읽었고, date-fns는 unpkg 배포 파일(`https://unpkg.com/date-fns@4.4.0/locale/ko.js`)을 읽었다.

- **cmdk 1.1.1**(`dist/index.mjs`): 항목이 등록될 때 하이라이트 값이 비어 있으면 첫 활성 항목을 고르는 함수를 부른다(`n.current.value||W()`). 하이라이트된 항목이 사라질 때와 검색어가 바뀔 때도 같은 함수를 부른다. `loop`는 기본 꺼짐이고, 루트 `value`·`onValueChange`로 하이라이트를 제어할 수 있다. → 첫 항목 자동 하이라이트(AC-UI-001-18), 제어형 되돌리기(design.md §7.1)
- **Radix Toast 1.3.1**(`dist/index.mjs`): `VIEWPORT_DEFAULT_HOTKEY = ["F8"]`(문서 keydown에서 `event.code`로 확인해 알림 영역에 포커스), 영역 이름 기본값 "Notifications ({hotkey})". Provider 기본 `duration` 5000, `swipeDirection` "right", `swipeThreshold` 50. 알림 영역 감싸개의 `focusin`·`pointermove` → 멈춤, `focusout`(영역 밖으로)·`pointerleave`(포커스가 안에 없을 때) → 남은 시간으로 다시 시작, 창의 blur·focus도 멈춤·재개. 알림 `li`의 `onKeyDown`에서 Esc → 닫기. `DismissableLayer.Root`의 `onEscapeKeyDown`은 포커스가 어느 알림에도 없으면 그 알림을 닫는다(가장 위 레이어일 때만 불림). → AC-UI-001-23, plan.md §B B-20
- **Radix ToggleGroup 1.2.1** → `@radix-ui/react-roving-focus` 1.2.1: 키 → 이동 표는 화살표 prev·next, Home·PageUp first, End·PageDown last이며 포커스만 옮긴다. 선택은 Toggle 1.2.1의 누르기(Space·Enter)로만 바뀐다. → 방향키 선택 보강(plan.md §B B-19, AC-UI-001-07·17)
- **Radix Dialog 1.3.1 + FocusScope 1.3.1**: 열릴 때 `focusFirst(removeLinks(getTabbableCandidates(container)))` — DOM 순서의 첫 포커스 가능 요소에 포커스를 둔다. 닫힐 때 트리거로 포커스를 돌린다. 바깥 포인터 누르기로 닫힌다(오른쪽 클릭·Ctrl+왼쪽 클릭 제외). → Modal 닫기 버튼 위치(design.md §4.6, AC-UI-001-22)
- **Radix Checkbox 1.4.1**: 버튼 keydown에서 `event.key === "Enter"`이면 `preventDefault` → Enter로는 바뀌지 않는다. → AC-UI-001-17
- **Radix Tabs 1.2.1**: `activationMode` 기본값 automatic(포커스 = 활성화). → plan.md §A.6-8
- **Radix Tooltip 1.4.1**: 포인터를 누르고 있지 않을 때 포커스로 열리고 blur로 닫힌다. 열려 있으면 트리거에 `aria-describedby`가 붙는다. Esc는 DismissableLayer로 닫는다. → AC-UI-001-25
- **Radix Select 2.4.1**: `OPEN_KEYS = [" ", "Enter", "ArrowUp", "ArrowDown"]`, `SELECTION_KEYS = [" ", "Enter"]`. → plan.md §A.6-8, AC-UI-001-17
- **react-day-picker 10.0.2**: `dist/esm/DayPicker.js`의 키 표 — `ArrowLeft`·`ArrowRight`는 `day`(Shift면 `month`), `ArrowUp`·`ArrowDown`은 `week`(Shift면 `year`), `PageUp`·`PageDown`은 `month`(Shift면 `year`), `Home`은 `startOfWeek`, `End`는 `endOfWeek`. `helpers/getFocusableDate.js`는 ISO·방송 주가 아니면 DateLib의 `startOfWeek`·`endOfWeek`를 쓰고(`classes/DateLib.js`가 로캘 옵션을 넘김), `helpers/getNextFocus.js`는 비활성·숨김 날짜를 건너뛰며 365번까지 다시 찾는다. `classes/DateLib.js`의 `formatMonthYear`는 `ko`를 연도 먼저 로캘(`yearFirstLocales`)로 보고 `Intl.DateTimeFormat(locale, { month: "long", year: "numeric" })`을 쓴다. Node 24.5.0에서 `new Intl.DateTimeFormat("ko", { month: "long", year: "numeric" }).format(new Date(2026, 9, 29))`의 출력은 "2026년 10월"이다. → AC-UI-001-21
- **date-fns 4.4.0**(`locale/ko.js`): `weekStartsOn: 0`(일요일), `firstWeekContainsDate: 1`. 2026-10-29는 목요일이다(`date(2026, 10, 29).strftime("%a")` → `Thu`). 따라서 그 날에서 Home·End는 10-25(일)·10-31(토), PageDown은 11-29(일)이다.
- **lucide-react 1.64.0**(`dist/lucide-react.d.ts`): `declare const <이름>: LucideIcon;`이 1,999개다. 별칭은 `export { … }` 목록에만 있다(`LoaderCircle as Loader2`, `CircleAlert as AlertCircle`, `TriangleAlert as AlertTriangle`, `…Icon` 접미 등). → 정식 이름 검사(AC-UI-001-10)
- **tailwindcss 4.3.3**(`theme.css`): 기본 테마 변수 수는 `--color-*` 288개(26계열 × 11단계 + `black`·`white` — 계열에 `mauve`·`olive`·`mist`·`taupe` 포함), `--radius-*` 8개, `--shadow-*` 8개, `--inset-shadow-*` 3개, `--drop-shadow-*` 6개, `--text-shadow-*` 5개, `--text-*` 단계 13개(xs~9xl), `--container-*` 13개(3xs~7xl)다. → 금지 이름 집합(AC-UI-001-10)
- **moai gate**: `moai gate --help` — "Exit code 0: gate passed (or no recognized language toolchain detected)". → 게이트 종료 코드 0만으로는 실행 증거가 되지 않는다(AC-UI-001-03, plan.md §B B-11)
- **이 기기의 `tsc`**: `command -v tsc` → `/mnt/c/Program Files/nodejs/tsc`, `tsc --version` → `Version 6.0.3`. 프로젝트 TypeScript(5.9.3)가 아니다. → AC-UI-001-01·03
- **deploy.sh**: 5행 `. .env.stage`(`set -a` 안)로 읽고, 15행에서 빌드, 25행에서 `scp`로 보낸다. → 가드는 5행 앞에 두고, 읽기 여부는 더미 `.env.stage`가 만드는 표시 파일로 확인한다(AC-UI-001-04)
- 확인하지 못한 것: Radix ToggleGroup에 Tab으로 들어올 때 선택된 항목에 포커스가 가는지, Radix Select를 값 없이 열 때 처음 포커스 위치, Radix Checkbox가 `required`를 `aria-required`로 옮기는지, jsdom에서 react-day-picker 포커스가 실제로 옮겨지는지. 모두 RED 테스트로 먼저 확인하고, 아니면 보강한다.

---

## 7. 대안 비교

판단 기준은 각 표의 첫 열에 적고, 기준의 무게(높음·중간·낮음)를 함께 적었다.

### 7.1 TypeScript 버전

| 기준(무게) | 5.9.3 | 6.0.3 | 7.0.2 |
|---|---|---|---|
| 도구 호환 — tsserver·컴파일러 API(높음) | 있음 | 있음 | 없음(`tsc` 실행 파일만) |
| 편집기·MoAI LSP(높음) | 그대로 동작 | 그대로 동작할 것으로 보임 [미검증] | 작업 공간 버전을 쓸 수 없음 |
| 검사 속도(낮음 — TS·TSX 87개 파일, 테스트 포함) | 기준 | 비슷 | 가장 빠름 |
| 검증된 조합(중간) | 레퍼런스가 React 19.3·Tailwind 4.3과 함께 고정 | 5.9 이후 기본값 변화를 이번에 확인하지 못함 | 이 스택에서 실행해 보지 못함 |
| 나중에 올리기(중간) | 7과 호환되게 설정을 쓰면 고정값 한 줄 | 같음 | — |

결정: **5.9.3**. 설정은 7에서도 그대로 쓸 수 있게 쓴다(`baseUrl` 없이 `paths`, `moduleResolution: "bundler"`, `types` 명시). 편집기가 TypeScript 7을 지원하는 것이 확인되면 별도 작업으로 올린다.

### 7.2 Table 구현

| 안 | 장점 | 단점 | 판단 |
|---|---|---|---|
| (가) 타입이 있는 열·행 컴포넌트 + 제어형 정렬 | 서버 정렬·페이지 파라미터(2.4절 6)에 바로 연결, 의존성 없음 | 열 숨김·크기 조절 같은 고급 기능 없음(기존 화면에 필요 없음) | 채택 |
| (나) @tanstack/react-table 9.3.1 통합 | 고급 기능 | 출시 3개월 남짓한 새 메이저, 상태 모델 변경, 기존 사용처는 클라이언트 정렬뿐 | 보류 |
| (다) 8.21.3 유지 | 기존 코드와 같은 API | 곧 낡을 메이저, (나)와 같은 뜻 불일치 | 기각 |

### 7.3 Combobox 구조

| 안 | 장점 | 단점 | 판단 |
|---|---|---|---|
| (가) 직접 만든 `<input>`(Field의 id·라벨·설명 그대로) + cmdk는 목록·키보드·하이라이트만, `shouldFilter={false}`로 거르기는 직접 | ARIA와 Field 연결을 모두 직접 제어. cmdk의 IME 보호·키보드 처리를 그대로 씀 | 목록 id·활성 항목 id를 cmdk가 렌더링한 DOM(`[cmdk-list]`, `[cmdk-item][data-selected]` — 스타일용으로 공개된 속성)에서 읽어야 함. 로컬 검색의 퍼지 점수를 잃음(부분 일치로 충분) | 1순위 |
| (나) `Command.Input` 그대로 + 열림 상태·id를 DOM에서 보정 | cmdk 기본 구조 | 라이브러리가 관리하는 속성을 덮어써야 하고 Field 라벨의 `htmlFor`를 맞추기 어려움 | 2순위 |
| (다) 트리거 버튼 + Popover 안 검색 입력(shadcn 예제 구조) | cmdk 기본 동작 그대로 | 통화하며 바로 입력하는 흐름에 단계가 하나 늘고, 버튼과 입력 두 곳에 combobox 역할이 생김 | 기각 |

M4 첫 RED 테스트(역할·`aria-expanded`·`aria-controls`·`aria-activedescendant`·Field 연결·IME 중 Enter)로 (가)와 (나) 가운데 하나를 확정한다. 둘 다 통과하지 못하면 D9를 뒤집는 결정(직접 만든 listbox)이 되므로 blocker로 보고한다. Home/End는 입력 커서 이동에 남긴다(6.3절).

### 7.4 예약 상태 배지 위치

| 안 | 장점 | 단점 | 판단 |
|---|---|---|---|
| (가) ui-core에 둔다 | 미리보기에서 바로 검토 | system.md §9 위반("ui-core는 예약 상태를 모른다") | 기각 |
| (나) 지금 도메인 모듈을 만든다 | 중복 없음 | 도메인 폴더 구조와 상태의 뜻·순서가 SPEC-UI-002에서 정해지므로 다시 고칠 가능성이 큼 | 기각 |
| (다) SPEC-UI-002로 미루고 미리보기에는 토큰 시연용 조합만 둔다 | 범위가 깨끗함. 토큰·대비는 이 SPEC에서 검증 | 시연용 조합이 SPEC-UI-002에서 대체될 때까지 잠시 중복 | 채택 |

### 7.5 테마 전환 형태

| 안 | 장점 | 단점 | 판단 |
|---|---|---|---|
| (가) 라이트·다크·시스템 세 항목 단일 선택 묶음(ToggleGroup) | 한 번에 전환, Filter와 같은 기반, 의존성 추가 없음 | design-direction §12.7의 "메뉴" 표현과 다름. 정본 system.md §8은 형태를 정하지 않음 | 채택 |
| (나) DropdownMenu | 설계 문구와 일치 | 의존성 추가, 이번 범위에 다른 소비처 없음 | SPEC-UI-002에서 사용자 메뉴와 함께 재검토 |
| (다) Select | 의존성 추가 없음 | 아이콘 전환으로는 어색함 | 기각 |

### 7.6 테스트 DOM 환경

| 안 | 장점 | 단점 | 판단 |
|---|---|---|---|
| (가) jsdom 29.1.1 | 로컬 Node 24.5.0 엔진 조건 충족 | 최신보다 한 메이저 낮음 | 채택 |
| (나) Node 24.15 이상 + jsdom 30.1.3 | 최신 | 개발 환경 변경 필요 | 대안 |
| (다) happy-dom 21.0.4 | 빠름 | Radix·cmdk와 함께 쓴 사례가 jsdom보다 적음 [미검증] | 기각 |

### 7.7 Field API

| 안 | 장점 | 단점 | 판단 |
|---|---|---|---|
| (가) 속성형 `Field`(label·description·error·required) + 자식 컨트롤에 문맥으로 연결 | `aria-describedby`를 실제로 렌더링한 부분만으로 확정적으로 계산, 잘못 조합할 여지가 적음 | 배치 자유도가 낮음 | 채택 |
| (나) 조합형(FieldLabel·FieldDescription·FieldError) | 배치 자유 | 부품의 렌더 여부를 추적해야 `aria-describedby`가 정확해짐 | 기각 |

---

## 8. 권고

1. TypeScript 5.9.3, jsdom 29.1.1을 고정하고 나머지는 5.1절 버전 그대로 쓴다. 고정값에는 `^`를 붙이지 않고 `package-lock.json`을 새로 만든다.
2. 단일 `tsconfig.json`이 `src`와 `vite.config.ts`를 직접 포함하게 한다(게이트의 `tsc --noEmit`이 실제로 검사하도록).
3. 기존 코드 제거, 새 스캐폴드, 첫 테스트를 한 커밋에 넣는다.
4. 정리용 `@theme`과 매핑용 `@theme inline`을 나누고, Tailwind `compile` API 테스트로 기본 테마 정리를 자동 검증한다. 소스 감지는 `src/`로 좁힌다.
5. `cn`은 `extendTailwindMerge`로 사용자 정의 테마 이름을 등록한다.
6. 대비 회귀 테스트가 `tokens.css`를 직접 읽어 104쌍과 상태 90개 값을 기준과 기록값(±0.01)으로 검사한다.
7. Combobox는 7.3절 (가)를 1순위로 M4 첫 테스트에서 확정한다.
8. StatusBadge는 SPEC-UI-002로 미루고, ui-core는 Badge의 `icon`·`className`과 Table의 레일 색 값 옵션만 제공한다.
9. lucide는 정식 이름만 쓴다. 별칭(`Loader2`, `Trash2`, `Home`, `AlertCircle`, `AlertTriangle`, `CheckCircle`) 가져오기를 규칙 점검 테스트로 막는다.
10. `moai gate`가 Biome을 실행하지 않을 수 있으므로 마일스톤 검증에 `npm run lint`를 따로 넣고, M1에서 게이트를 실제로 돌려 기록한다.
11. SPEC-UI-002가 끝날 때까지 배포하지 않는다(결정 지점 1에서 확정 — `deploy.sh`에 배포 중지 가드를 넣는다, plan.md §A.2).

---

## 9. 검증 기록

### 9.1 주장

(1) 5.1절의 버전·엔진·피어 조건은 레지스트리 값과 같다. (2) 6.1~6.7절의 패키지 동작은 배포 파일에서 읽은 것이다. (3) 2절의 현재 저장소 사실은 HEAD `28c87a9`의 파일에서 읽은 것이다.

### 9.2 증거(실행한 명령과 출력 발췌)

| 명령 | 출력 발췌 |
|---|---|
| `[[ "SPEC-UI-001" =~ ^SPEC(-[A-Z][A-Z0-9]*)+-[0-9]{3}$ ]] && echo PASS` | `PASS` |
| `ls -1 .moai/specs/` | `SPEC-UI-001`(유일) |
| `git ls-files src \| wc -l` | `53` |
| `node -p "require('./node_modules/vite/package.json').version"` 외 | `vite=6.2.6`, `typescript=5.7.3`, `tailwindcss=3.4.1`, `react=19.1.0`, `vitest=3.2.7` |
| `node --version` | `v24.5.0` |
| `npm view typescript@7.0.2 version bin exports` | `"bin": {"tsc": "bin/tsc"}`, `".": "./lib/version.cjs"` |
| `npm view typescript dist-tags` | `"latest": "7.0.2"`, 6.x는 `6.0.2`·`6.0.3` |
| `npm view jsdom@30.1.3 engines` / `jsdom@29.1.1` | `^22.22.2 \|\| ^24.15.0 \|\| >=26.0.0` / `^20.19.0 \|\| ^22.13.0 \|\| >=24.0.0` |
| `npm view vitest@5.0.5 engines peerDependencies` | `^22.12.0 \|\| ^24.0.0 \|\| >=26.0.0`, `"vite": "^6.4.0 \|\| ^7.0.0 \|\| ^8.0.0"`, `"jsdom": "*"` |
| `npm view @testing-library/react@16.3.3 peerDependencies` | `"@testing-library/dom": "^10.0.0"` |
| `npm view @testing-library/jest-dom@7.0.1 exports engines` | `"./vitest"` 진입점, `"node": ">=22"` |
| `npm view @radix-ui/react-tooltip version` / `react-toggle-group` | `1.4.1` / `1.2.1`, 피어 react `… \|\| ^19.0` |
| `npm view @daypicker/react@10.0.2 dependencies` | `{"react-day-picker": "10.0.2"}` |
| `npm view @tanstack/react-table time` | `"9.0.0": "2026-08-04…"`, `"9.3.1": "2026-10-12…"` |
| cmdk 1.1.1 `dist/index.mjs` 발췌 | 6.3절 코드 블록, `onKeyDown … isComposing\|\|e.keyCode===229` |
| react-day-picker 10.0.2 `README.md` 5행, `dist/esm/UI.d.ts`, `dist/esm/locale/ko.d.ts` | 6.4절 |
| lucide-react 1.64.0 `dist/lucide-react.d.ts` | 정식 이름 40개 `declare const … : LucideIcon;`, 별칭 `Trash as Trash2`, `CircleCheckBig as CheckCircle` |
| @radix-ui/react-toast 1.3.1 | `if (!duration2 \|\| duration2 === Infinity) return;` |
| @radix-ui/react-alert-dialog 1.2.1 | `onOpenAutoFocus … cancelRef.current?.focus({ preventScroll: true })` |
| @radix-ui/react-toggle-group 1.2.1 | `role: "radiogroup"`, `{ role: "radio", "aria-checked": props.pressed }` |
| @radix-ui/react-popover 1.3.1 | `role: "dialog", … ...contentProps` |
| tailwindcss 4.3.3 `dist/lib.d.mts` | `export { … compile, compileAst … }` |
| @biomejs/biome 2.6.4 `configuration_schema.json` | `CssParserConfiguration ['allowWrongLineComments', 'cssModules', 'tailwindDirectives']` |
| `cat -n kmcbeauty-fastapi/app/enum/treatment_status.py` | 4-19행 enum과 라벨, 25-33행 자동 완료 대상 VISITED |
| `sed -n '20,40p' kmcbeauty-native/…/BookingListScreen.tsx` | 22-28행 라벨, 33-39행 색 |

### 9.3 기준선 귀속

모든 명령은 2026-10-29 이 세션에서 실행했다. 저장소 사실은 HEAD `28c87a9`의 작업 트리 기준이고, 패키지 사실은 같은 날 npm 레지스트리 응답과 스크래치 디렉터리(`/tmp/claude-1000/…/scratchpad/`)에 받은 tarball 기준이다. 설계 문서의 대비 수치는 design-direction §18의 스크립트 출력을 인용한 것이며 이번에 다시 계산하지 않았다.

### 9.4 공백(미검증)

1. Noto Sans KR Variable의 `tnum` 지원 — 글꼴 파일(woff2)을 해석할 도구(fontTools, Brotli)가 없다.
2. Tailwind 4 기본 테마 정리의 실제 생성 결과, `source("..")`의 감지 범위 — 패키지를 설치하지 않았다.
3. tailwind-merge 3의 사용자 정의 이름 분류 — 기억에 근거한 추론이다.
4. react-day-picker 10의 키보드·포커스 동작, cmdk + Radix Popover의 실제 결합 동작.
5. `moai gate`가 TypeScript 프로젝트에서 실행하는 정확한 단계, Vitest가 테스트 파일 0개일 때의 종료 코드.
6. Vite 8.3.5 + plugin-react 6.1.2 + @tailwindcss/vite 4.3.3의 실제 빌드, Node 24.5.0에서의 Vitest 5 실행.
7. TypeScript 6.0.3의 기본값 변화.
8. `.env`의 `VITE_API_BASE_URL` DNS 상태 — 오케스트레이터 확인 사실을 인용했다.

### 9.5 잔여 위험

- 방문함 ↔ 완료(D형 색각), 예약됨 ↔ 방문함(다크·P형)은 색만으로 구분되지 않는다. 아이콘 + 라벨 필수 규칙에 의존한다(design-direction §13.2).
- cmdk의 고정 속성은 패키지를 올리면 바뀔 수 있다. 버전을 고정하고 테스트로 감시한다.
- `tnum`이 지원되지 않으면 표의 숫자 열이 자릿수 정렬을 잃는다. 오른쪽 정렬로 일부 보완된다.
- 배포 공백 동안 누군가 배포 중지 가드를 opt-in 변수로 우회해 `deploy.sh`를 실행하면 운영 화면이 미리보기로 바뀐다.
