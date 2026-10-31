# SPEC-UI-001 구현 계획

| 항목 | 내용 |
|---|---|
| SPEC | SPEC-UI-001 |
| 제목(제안) | 프로젝트 기반과 디자인 시스템 — 디자인 토큰 · ui-core 컴포넌트 라이브러리 · 컴포넌트 미리보기 |
| 상태 | **확정** — 결정 지점 1에서 사용자가 그대로 승인했다(2026-10-29). Phase 10 산출물: spec.md, acceptance.md, design.md, spec-compact.md, progress.md. plan-auditor 실행 전 검토(0.2.0), 1회차 감사(0.3.0), 2회차 감사(PASS) 뒤 개정(0.3.1)을 반영했다(§J) |
| 등급 | Tier L(산출물 5종, plan-auditor 통과 기준 0.85) |
| 개발 방식 | TDD(`quality.yaml` `constitution.development_mode: tdd`), 커버리지 목표 85% |
| 작업 위치 | 주 체크아웃의 `main`, 새 브랜치 없음(late-branch) |
| 근거 | `research.md`(조사·검증 기록), `.moai/design/system.md`(디자인 정본), `design-direction.md`, `design-dna.json`, 레퍼런스 `reference/my-workspace.zip` |

> 섹션은 바뀔 가능성이 큰 결정(컴포넌트 목록 → 공개 인터페이스 → 상호작용 흐름 → 의존성)부터 적고, 기계적인 스캐폴드·제거 목록은 맨 뒤 §I에 둔다. 레퍼런스 인용은 `Reference: my-workspace/<파일>:<행>`, 현재 저장소 인용은 `현재 저장소 <파일>:<행>` 형식이다.

---

## §A 맥락과 결정

### A.1 SPEC 후보 확인

- 후보는 **SPEC-UI-001** 하나다. `.moai/specs/`에는 이 디렉터리만 있어 중복이 없다.
- ID 형식 검사: `[[ "SPEC-UI-001" =~ ^SPEC(-[A-Z][A-Z0-9]*)+-[0-9]{3}$ ]] && echo PASS || echo FAIL` → `PASS`.
- 범위: 프로젝트 기반(도구 체계 교체, 기존 코드 제거) + 디자인 토큰 + `src/ui-core` 컴포넌트 라이브러리(컴포넌트당 파일 하나, shadcn/ui 소스 소유 방식: Radix + class-variance-authority + `cn` = clsx + tailwind-merge, `@/ui-core` 일괄 내보내기) + 컴포넌트 미리보기 페이지.
- 짝 SPEC: SPEC-UI-002가 기존 화면(로그인, 매장 선택, 예약 캘린더, 고객, 시술 메뉴, 시술 이력, 이용약관, 개인정보처리방침)과 API 계층·인증·라우팅을 다시 만든다. **이 SPEC이 끝나면 작업을 멈추고 사용자가 컴포넌트를 검토한다.** 기존 코드는 커밋 `28c87a9`에 남아 SPEC-UI-002의 참고 자료가 된다.
- 에픽: 관리자 웹 재구축(Epic Admin-Rebuild) — SPEC-UI-001(이 SPEC), SPEC-UI-002. 두 SPEC은 같은 에픽에서 차례로 진행하고, SPEC-UI-002는 이 SPEC의 공개 API(§A.5)와 사용자 검토 결과에 기댄다.

### A.2 결정 지점 1에서 확인할 사항

**결정 지점 1 결과(2026-10-29, 사용자가 이 계획을 그대로 승인)**

1. **운영 배포 중지(확정)** — 기존 앱을 걷어내는 M1 커밋부터 SPEC-UI-002 완료까지 운영 배포를 멈춘다. M1 커밋부터 기존 코드가 같은 자리에서 사라져 이 기간의 앱은 컴포넌트 미리보기 한 페이지뿐이기 때문이다(research §6.13). 결정 지점 1의 기록("SPEC-UI-001 완료부터")보다 시작점이 앞당겨졌으므로 착수 승인 때 사용자에게 확인받는다(progress.md §A.3). 이를 기계적으로 막기 위해 M1에서 `deploy.sh`의 bun → npm 전환과 함께 **배포 중지 가드**를 넣는다: 환경 변수 `ALLOW_PREVIEW_ONLY_DEPLOY`가 `1`이 아니면 `.env.stage`를 읽기 전에 안내 문구를 출력하고 종료 코드 1로 끝난다. 가드는 기존 앱을 걷어내는 M1 커밋에 함께 들어가 그때부터 `main`을 막고(M1 이후 `main`은 미리보기 전용 — 0.2.0에서 명확히 함), SPEC-UI-002가 업무 화면을 되살릴 때 지운다(REQ-UI-001-004, AC-UI-001-04, design.md §13).
2. **고정폭 숫자(확정)** — M6 미리보기에서 Noto Sans KR Variable의 `tnum` 지원 여부를 측정·기록만 한다. 판정은 지원·기본 고정폭·미지원·측정 불가 가운데 하나다(acceptance.md §3.2). 대체 숫자 글꼴 도입은 표 화면을 실제로 만드는 SPEC-UI-002에서 정한다. 그때까지 숫자 열은 `tabular-nums` 지정과 오른쪽 정렬을 유지한다(research §9.4-1).

**수락된 기본값** — 아래 10개 결정은 결정 지점 1에서 그대로 수락됐다.

| 결정 | 기본값 | 근거 |
|---|---|---|
| TypeScript | 5.9.3 | 7.0.2에는 `tsserver`와 컴파일러 API가 없다(research §6.1, §7.1) |
| 테스트 DOM | jsdom 29.1.1 | 최신 30.x는 로컬 Node 24.5.0과 엔진 조건이 맞지 않는다(§6.2) |
| 예약 상태 배지 | SPEC-UI-002의 도메인 모듈 | system.md §9 "ui-core는 예약 상태를 모른다"(§7.4) |
| Table | 타입 있는 열·행 + 제어형 정렬, TanStack 보류 | §7.2 |
| 상단바·앱 셸 | SPEC-UI-002에서 조립 | 앱에서 한 번만 쓰는 레이아웃, 라우팅·인증에 묶임(A.4) |
| 테마 전환 형태 | 라이트·다크·시스템 세 항목 단일 선택 묶음 | 정본 system.md §8은 형태를 정하지 않음(§7.5) |
| Combobox | 단일 선택 + 새 값 만들기, 다중 선택 칩 제외 | 기존 그룹 값은 문자열 하나(현재 저장소 src/shared/types/phonebook.ts:4) |
| 기존 화면에 직접 쓰인 곳이 없는 Tabs·Checkbox | 포함 | system.md §8이 규칙을 정해 두었고, 레퍼런스 고정값 그대로라 추가 비용이 작다 |
| 패키지 관리자 | npm(`package-lock.json`), `bun.lock` 삭제 | 로컬에 bun이 없다(§2.1) |
| Biome 서식 | 옛 Prettier 설정과 같은 모양(큰따옴표, 세미콜론, trailingComma all, 줄 폭 100) | 팀 습관 유지(§6.9) |

### A.3 컴포넌트 목록 — 포함 29개

- 경로는 모두 `src/ui-core/` 아래이고 컴포넌트당 파일 하나다(파일 이름은 shadcn/ui처럼 kebab-case).
- 소비 측은 `@/ui-core`(일괄 내보내기 파일 `src/ui-core/index.ts`)에서만 가져온다. ui-core 안에서는 상대 경로로 서로를 가져와 순환 참조를 피한다.
- "소비 화면"은 SPEC-UI-002에서 이 컴포넌트를 쓸 화면이다.

| # | 파일 | 목적 | 기반 | 변형·상태 | 소비 화면 | 근거 |
|---|---|---|---|---|---|---|
| 1 | `button.tsx` | 동작 실행, `asChild`로 링크 이동 | Radix Slot + CVA | variant `default`·`outline`·`ghost`·`destructive`·`link` / size `sm`·`default`·`lg`·`icon`·`icon-sm` / loading(`aria-busy`·`aria-disabled`, 포커스 유지) / disabled | 모든 화면(제출, 등록·수정·삭제, 대화상자 바닥, 행 동작) | Reference: my-workspace/src/ui-core/index.tsx:7-62 (R11·R16 수정), design-direction §12.2 |
| 2 | `badge.tsx` | 짧은 분류·상태 표시 | CVA | tone `neutral`·`info`·`success`·`warning`·`destructive` / 아이콘 12px 또는 점 6px / `className`으로 도메인 색 주입 | 고객 그룹, 예약 상태(도메인 StatusBadge가 감쌈) | Reference: my-workspace/src/ui-core/index.tsx:63-65 (R2), design-direction §12.5 |
| 3 | `loading.tsx` | 진행 표시 | — | size `sm`·`md` / 기본 문구 "불러오는 중…" / `role="status"` / 감속 모드에서 회전 정지 | 인증 확인, 매장 정보 불러오기 | Reference: my-workspace/src/ui-core/index.tsx:66-73, 현재 저장소 src/shared/components/LoadingSpinner.tsx:8-24 |
| 4 | `skeleton.tsx` | 내용 모양 자리표시 | — | 블록·텍스트 줄 / 묶음(`aria-busy` + 숨은 문구) / 묶음 표시 지연 `delayMs`(기본 300ms) | 고객·시술 메뉴·이력 표 로딩 | design-direction §12.5, §14.3 |
| 5 | `empty-state.tsx` | 데이터 없음·결과 없음 | — | 아이콘·제목·설명·동작 하나 | 고객·시술 메뉴·이력 목록 | design-direction §12.5, 현재 저장소 TreatmentMenuListPage.tsx:176 |
| 6 | `alert.tsx` | 화면·대화상자 안 알림 | CVA | tone `info`·`success`·`warning`·`destructive` / `live`일 때만 `role="alert"` | 로그인 실패, 목록 불러오기 실패, 확인 대화상자 안 실패 | Reference: my-workspace/src/ui-core/index.tsx:104-113 (R15) |
| 7 | `card.tsx` | 패널 면 | — | Card·CardHeader·CardTitle·CardDescription·CardContent·CardFooter, 그림자 없음 | 로그인 패널, 목록 패널, 매장 선택 | Reference: my-workspace/src/ui-core/index.tsx:90-103, my-workspace/src/styles.css:127-132 (R1) |
| 8 | `field.tsx` | 라벨·설명·오류와 컨트롤 연결 | 네이티브 `label` | `required`(`*`, `aria-hidden`) / description / error(`CircleAlert` + 문장) / 자식 컨트롤에 `id`·`aria-describedby`·`aria-invalid`·`required` 자동 연결 | 로그인, 고객, 시술 메뉴·세부 항목, 예약 폼 | Reference: my-workspace/src/ui-core/pattern-components.tsx:199-231 (R6), design-direction §12.3 |
| 9 | `input.tsx` | 한 줄 입력 | — | size `sm`·`default`·`lg` / 앞뒤 부가 표시("원", "분", 아이콘) / invalid / read-only / disabled | 로그인, 고객(이름·전화), 시술(가격·소요 시간) | Reference: my-workspace/src/ui-core/index.tsx:75-77, my-workspace/src/styles.css:107-116 (R1) |
| 10 | `textarea.tsx` | 여러 줄 입력 | — | 최소 96px, 세로로만 크기 조절, invalid | 예약·고객 메모 | design-direction §12.3, 현재 저장소 ReservationForm.tsx:63-68 |
| 11 | `checkbox.tsx` | 켬·끔, 여러 개 선택 | Radix Checkbox | checked·unchecked·indeterminate(`Minus`) / 라벨 / disabled / invalid | 예약 등록의 시술 항목 다중 선택(후보), 표 행 선택 시 필수(design-direction §13.3). 기존 화면에는 직접 쓰인 곳이 없다 | Reference: my-workspace/src/ui-core/composites.tsx:7-33 |
| 12 | `search.tsx` | 목록 검색어 입력 | Input 조합 | 앞 아이콘 / 값이 있으면 지우기 버튼("검색어 지우기") / `aria-label` 필수 | 고객·시술 메뉴 목록 | Reference: my-workspace/src/ui-core/pattern-components.tsx:48-71 |
| 13 | `select.tsx` | 값과 라벨이 다른 옵션 선택 | Radix Select | options `{ value, label, disabled? }` / 묶음 / placeholder "선택" / size / invalid | DateTimePicker 시간 칸, 시술 메뉴 선택 | Reference: my-workspace/src/ui-core/index.tsx:78-89 (R3) |
| 14 | `filter.tsx` | 선택지가 적은 단일 필터 | Radix ToggleGroup(`radiogroup`) + 방향키 선택 보강(A.6-8) | options `{ value, label, count? }` / 개수 `tabular-nums` / 선택 해제 불가 / 선택 단서(굵기·강제 색 테두리) | 시술 이력 상태 필터(`status` 파라미터, 현재 저장소 src/shared/api/treatment.ts:19-27) | Reference: my-workspace/src/ui-core/pattern-components.tsx:72-93 |
| 15 | `combobox.tsx` | 검색해서 고르기 | cmdk 1.1.1 + Radix Popover | 단일 선택 / 로컬·원격 거르기 / loading / 빈 결과 문구 + 새 값 만들기 / 결과 개수 알림 | 고객 그룹 입력(현재 저장소 GroupCombobox.tsx:20-93), 예약 등록의 고객 검색 | design-direction §12.3, D9 |
| 16 | `calendar.tsx` | 월 달력 격자 | react-day-picker 10.0.2 + `ko` 로캘 | 단일 선택 / 오늘 `ring` 테두리 / 일요일 `destructive`·토요일 `primary` / 비활성 날짜 | DateTimePicker 내부(시술 이력 기간 선택은 범위 선택이 필요해 제외 — spec.md §8) | design-direction §12.3 |
| 17 | `date-time-picker.tsx` | 예약 일시 입력 | Calendar + Radix Popover + Select | granularity `date`·`datetime` / 영업시간 범위·간격 / 비활성 날짜 / invalid / 표기 "2026. 10. 29. (목)"·`HH:mm` | 예약 등록(현재 저장소 ReservationForm.tsx:45-56의 `datetime-local` 대체) | design-direction §12.3, D4·D9 |
| 18 | `modal.tsx` | 폼 대화상자 | Radix Dialog | size `sm` 400·`md` 560·`lg` 720px / 제목 필수·설명 선택 / 닫기 버튼(DOM 순서상 본문 뒤) / 첫 입력 포커스 / 제출 중 닫기 막기 / 작성 중 닫기 확인 | 고객·시술 메뉴·세부 항목·예약 폼 | Reference: my-workspace/src/ui-core/composites.tsx:34-69 (R8·R13) |
| 19 | `confirm-dialog.tsx` | 되돌리기 어려운 동작 확인 | Radix AlertDialog | tone `default`·`destructive` / 비동기 확인(loading, 실패 시 대화상자 안 Alert) / 닫기 버튼 문구 지정 / 명령형 `showConfirm()` + `ConfirmDialogHost` | 고객 삭제, 예약 취소, 노쇼 처리 | 현재 저장소 useConfirmStore.ts:12-27·ConfirmModal.tsx:4-50 대체, design-direction §12.4 |
| 20 | `toast.tsx` | 작업 결과 알림 | Radix Toast | tone `success`·`info`·`warning`·`destructive` / 대기열(동시에 3개) / 표시 시간 5·5·7초·닫을 때까지 / 동작 하나 / 명령형 `toast` + `Toaster` | 저장·삭제 결과 | Reference: my-workspace/src/ui-core/composites.tsx:132-151 (R4), 현재 저장소 useNotificationStore.ts:17-34 대체 |
| 21 | `tooltip.tsx` | 아이콘 동작·접힌 메뉴의 이름 | Radix Tooltip 1.4.1 | side / 지연 | 접힌 사이드바, 표 행 아이콘 버튼 | design-direction §12.0, §12.7 |
| 22 | `table.tsx` | 목록 표 | 네이티브 `table` | `Column<T>` / 제어형 정렬(`aria-sort`) / 레일 색 값 / 로딩 스켈레톤 / 빈 상태 / 숨긴 `caption` / 가로 스크롤 영역 | 고객·시술 메뉴·시술 이력 | Reference: my-workspace/src/ui-core/pattern-components.tsx:4-47 |
| 23 | `tabs.tsx` | 같은 화면 안 하위 보기 전환 | Radix Tabs | items `{ value, label, content }` / 밑줄형 | PageHeader 하위 탐색 자리. 기존 화면에는 직접 쓰인 곳이 없다 | Reference: my-workspace/src/ui-core/composites.tsx:70-98 |
| 24 | `pagination.tsx` | 서버 페이지 이동 | Button 조합 | 이전·다음 / 번호와 줄임표(현재 쪽 양옆 한 쪽 고정, 8쪽 이상이면 7칸 — acceptance.md §3.1) / `aria-current="page"`와 현재 쪽 단서 | 고객·시술 메뉴·이력(응답 `{ items, total, page, size, pages }`) | Reference: my-workspace/src/ui-core/composites.tsx:99-131, 현재 저장소 CustomerList.tsx:132-134 |
| 25 | `sidebar.tsx` | 주 메뉴 | Tooltip(접힘) | 묶음·항목 `{ to, label, icon }` / 활성 `aria-current` / 펼침 240·접힘 64px / 머리·바닥 자리 / 링크 컴포넌트 주입 | 앱 셸(현재 저장소 Sidebar.tsx:118-134의 메뉴 4개) | Reference: my-workspace/src/ui-core/pattern-components.tsx:116-134 (R5) |
| 26 | `breadcrumb.tsx` | 현재 위치 | — | items `{ label, to? }` / 3단계까지 / 링크 컴포넌트 주입 | PageHeader, 앱 셸 상단바 | Reference: my-workspace/src/ui-core/pattern-components.tsx:135-167 |
| 27 | `page-header.tsx` | 화면 머리 | — | 이동 경로·제목(기본 h1, `titleAs`로 h2·h3)·배지·설명·보조/주요 동작·하위 탐색 자리 | 모든 업무 화면(현재 저장소 CustomerList.tsx:139, TreatmentMenuListPage.tsx:78의 h2 제목 대체) | design-direction §14.2 |
| 28 | `theme-provider.tsx` | 라이트·다크·시스템 테마 상태 | React context + `matchMedia` + `localStorage` | 기본 시스템 / 저장 / 시스템 변화 추종 / `<html>`의 `.dark` 전환 | 앱 루트 | design-direction §6.4, D7. Reference: my-workspace/src/main.tsx:4-7 대체 |
| 29 | `theme-toggle.tsx` | 테마 전환 | Radix ToggleGroup | `Sun`·`Moon`·`Monitor` 세 항목, 항목마다 접근 이름, 방향키 선택(A.6-8) | 앱 셸 상단바, 미리보기 | system.md §8 |

보조 파일 2개: `cn.ts`(clsx + tailwind-merge, 사용자 정의 테마 이름 등록 — Reference: my-workspace/src/ui-core/index.tsx:7), `index.ts`(일괄 내보내기 — Reference: my-workspace/src/ui-core/index.tsx:115-117, my-workspace/vite.config.ts:5).

레퍼런스 21개 대비: 유지 17(Button, Badge, Loading, Input, Select, Card, Alert, Checkbox, Modal, Tabs, Pagination, Toast, Table, Search, Filter, Sidebar, Breadcrumb), 제외 4(A.4), 새로 추가 12(Field, Textarea, Skeleton, EmptyState, Combobox, Calendar, DateTimePicker, ConfirmDialog, Tooltip, PageHeader, ThemeProvider, ThemeToggle).

### A.4 제외한 컴포넌트와 이유

| 대상 | 판단 | 이유 |
|---|---|---|
| FileUpload (Reference: my-workspace/src/ui-core/composites.tsx:152-184) | 제외 | 기존 화면에 파일 업로드가 없고 서버 전송도 범위 밖이다(design-direction §12.3) |
| Chart (Reference: my-workspace/src/ui-core/pattern-components.tsx:168-198) | 제외 | 기존 화면에 차트가 없다. 템플릿형 대시보드는 금지 사항이고(system.md §12) 여러 계열 팔레트도 정하지 않았다(system.md §2) |
| 상단 Navbar (Reference: my-workspace/src/ui-core/pattern-components.tsx:99-115) | 제외 | 사이드바 탐색을 쓰고, 상단바에는 메뉴 항목을 두지 않는다(design-direction §12.7) |
| Form 데모 (Reference: my-workspace/src/ui-core/pattern-components.tsx:199-231) | 제외 | Field 패턴으로 대체한다(R6) |
| Topbar·앱 셸 | SPEC-UI-002 | 앱에서 한 번만 쓰는 레이아웃이고 내용(이동 경로·날짜·사용자 메뉴)이 라우팅·인증에 묶여 있다. 사이드바 접힘 상태 저장, 768~1023px 자동 접힘, 768px 미만 서랍, 건너뛰기 링크도 앱 셸에서 조립한다. ui-core는 부품(Sidebar, Breadcrumb, ThemeToggle, Button, Tooltip)만 준다 |
| StatusBadge(예약 도메인) | SPEC-UI-002 | system.md §9 — ui-core는 예약 상태를 모른다(A.7) |
| 레일이 붙는 목록 항목 | 제외 | 소비 화면(오늘 예약 목록)이 SPEC-UI-002 목록에 없다. 표 행의 레일 옵션만 둔다 |
| DropdownMenu | 보류 | 테마 전환은 ToggleGroup으로 해결한다. 사용자 메뉴와 함께 SPEC-UI-002에서 판단한다 |
| Combobox 다중 선택 칩 | 제외 | 기존 그룹 값은 문자열 하나(`group_name: string \| null`)다 |
| 공개 Popover | 제외 | Combobox·DateTimePicker 안에서만 쓴다 |
| Radix Label | 제외 | 네이티브 `<label>`로 충분하다 |

### A.5 공개 인터페이스 결정

구현이 아니라 SPEC-UI-002가 기대게 될 계약이다. 이름과 모양은 run 단계에서 테스트로 고정한다. 29개 컴포넌트의 props 계약을 모두 적는다. 각 props 타입은 따로 적지 않은 네이티브 속성(`className` 등)도 받는다.

```ts
// 공통
type Tone = "neutral" | "info" | "success" | "warning" | "destructive";
type LinkComponent = React.ComponentType<{
  to: string; className?: string; "aria-current"?: "page"; children: React.ReactNode;
}>; // 기본값은 <a href={to}>. SPEC-UI-002가 라우터 링크를 넘긴다

// 1 Button
interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "link"; // 기본 "default"
  size?: "sm" | "default" | "lg" | "icon" | "icon-sm";             // 기본 "default"
  asChild?: boolean;  // Radix Slot. loading과 함께 쓰지 않는다
  loading?: boolean;  // aria-busy·aria-disabled(disabled 아님), LoaderCircle + 라벨 유지, 포커스 유지
}

// 2~7 피드백·표시
interface BadgeProps extends React.ComponentProps<"span"> {
  tone?: Tone;        // 기본 "neutral". 도메인 색은 className으로(cn 병합으로 tone 면을 덮는다)
  icon?: LucideIcon;  // 12px, 장식(aria-hidden)
  dot?: boolean;      // 6px 점. icon과 함께 쓰지 않는다
}
interface LoadingProps { size?: "sm" | "md"; label?: string } // 기본 "md", "불러오는 중…", role="status"
interface SkeletonProps extends React.ComponentProps<"div"> { variant?: "block" | "text" } // 장식(aria-hidden)
interface SkeletonGroupProps {
  children: React.ReactNode;
  label?: string;     // 숨은 문구, 기본 "불러오는 중…". 묶음은 aria-busy="true"
  delayMs?: number;   // 기본 300. 마운트된 뒤 이 시간이 지나기 전에는 아무것도 렌더링하지 않는다
}
interface EmptyStateProps {
  icon?: LucideIcon; title: string; description?: React.ReactNode;
  action?: React.ReactNode; // 동작 하나
}
interface AlertProps extends React.ComponentProps<"div"> {
  tone?: Exclude<Tone, "neutral">; // 기본 "info". tone별 아이콘은 장식
  title?: string;
  live?: boolean;     // true일 때만 role="alert"(동적 오류)
}
// Card: Card · CardHeader · CardTitle · CardDescription · CardContent · CardFooter — 각각 div props.
// CardTitle만 as?: "h2" | "h3"(기본 "h2"). 그림자 없음, 중첩 금지

// 8~14 폼
interface FieldProps {
  label: string; description?: React.ReactNode; error?: string; required?: boolean;
  children: React.ReactElement; // 컨트롤 하나. id·aria-describedby·aria-invalid·required(버튼형은 aria-required)를 문맥으로 받는다
}
interface InputProps extends Omit<React.ComponentProps<"input">, "size"> {
  size?: "sm" | "default" | "lg"; invalid?: boolean;
  startAdornment?: React.ReactNode; endAdornment?: React.ReactNode; // 글자는 aria-describedby로 연결, 아이콘은 숨김
}
interface TextareaProps extends React.ComponentProps<"textarea"> { invalid?: boolean } // 최소 96px, 세로로만 크기 조절
interface CheckboxProps {
  checked: boolean | "indeterminate"; onCheckedChange(checked: boolean): void;
  label?: React.ReactNode; disabled?: boolean; invalid?: boolean; required?: boolean; id?: string;
}
interface SearchProps extends Omit<React.ComponentProps<"input">, "type" | "value" | "onChange"> {
  value: string; onValueChange(value: string): void;
  "aria-label": string; // 필수
  clearLabel?: string;  // 기본 "검색어 지우기". 값이 있을 때만 보이고, 누르면 빈 값 + 입력 포커스
}
interface SelectOption { value: string; label: string; disabled?: boolean } // value는 빈 문자열 불가(Radix Select 제약)
interface SelectGroup { label: string; options: SelectOption[] }
interface SelectProps {
  value: string | undefined; onValueChange(value: string): void;
  options: Array<SelectOption | SelectGroup>;
  placeholder?: string; // 기본 "선택"
  size?: "sm" | "default" | "lg"; disabled?: boolean; invalid?: boolean; required?: boolean;
  "aria-label"?: string; // Field 밖에서 쓸 때
}
interface FilterOption { value: string; label: string; count?: number }
interface FilterProps {
  options: FilterOption[]; value: string; onValueChange(value: string): void; // 선택 해제 없음, 방향키로 선택 이동
  "aria-label": string;
}

// 15~17 고급 입력
interface ComboboxOption { value: string; label: string; description?: string; keywords?: string[] }
interface ComboboxProps {
  value: string | null; onValueChange(value: string | null): void;
  options: ComboboxOption[];
  valueLabel?: string; // value가 options에 없을 때(원격 모드) 입력에 보일 라벨
  inputValue?: string; onInputValueChange?(text: string): void; // 원격 검색 디바운스(300ms)는 소비 측
  filtering?: "local" | "remote"; // 기본 "local"
  loading?: boolean;
  emptyText?: React.ReactNode;    // 기본 "일치하는 항목이 없어요."
  createAction?: { label(text: string): string; onSelect(text: string): void }; // 예: "새 고객 등록"
  renderOption?(option: ComboboxOption): React.ReactNode; placeholder?: string;
  invalid?: boolean; required?: boolean; disabled?: boolean;
}
interface CalendarProps {
  value: Date | null; onValueChange(date: Date): void;
  isDateDisabled?(date: Date): boolean; // 라이브러리 matcher 타입을 공개 API에 노출하지 않는다
  defaultMonth?: Date;
}
interface DateTimePickerProps {
  value: Date | null; onValueChange(value: Date | null): void; // 날짜와 시간이 모두 정해질 때만 알린다
  granularity?: "date" | "datetime";          // 기본 "datetime". "date"면 그날 00:00으로 알린다
  timeRange?: { start: string; end: string };  // "HH:mm", 영업시간. end는 간격과 맞을 때 포함
  minuteStep?: number;                         // 기본 30
  isDateDisabled?(date: Date): boolean;
  placeholder?: string;                        // 기본 "날짜 선택"
  invalid?: boolean; required?: boolean; disabled?: boolean;
}

// 18~21 오버레이
interface ModalProps {
  open: boolean; onOpenChange(open: boolean): void;
  title: string; description?: string; // 설명이 없으면 aria-describedby 없음
  size?: "sm" | "md" | "lg";           // 400·560·720px, 기본 "md"
  dirty?: boolean;          // closeDisabled가 아닐 때 닫기 버튼·Esc·스크림으로 닫으려 하면 확인
  closeDisabled?: boolean;  // 제출 중. dirty보다 먼저 판정한다 — 닫기 요청을 모두 무시하고(작성 중 확인도 띄우지 않음) 닫기 버튼은 aria-disabled
  children: React.ReactNode; footer?: React.ReactNode;
}
interface ConfirmOptions {
  title: string; description: string; confirmLabel: string;
  cancelLabel?: string;     // 기본 "취소". 취소 동작을 묻는 대화상자는 "닫기"
  tone?: "default" | "destructive"; onConfirm?(): Promise<void>;
}
declare function showConfirm(options: ConfirmOptions): Promise<boolean>; // <ConfirmDialogHost />를 앱에 하나 둔다
interface ConfirmDialogProps extends ConfirmOptions { open: boolean; onOpenChange(open: boolean): void } // 선언형
// ConfirmDialogHost: props 없음
interface ToastOptions { description?: string; action?: { label: string; onClick(): void } }
declare const toast: {
  success(message: string, options?: ToastOptions): string;
  info(message: string, options?: ToastOptions): string;
  warning(message: string, options?: ToastOptions): string;
  error(message: string, options?: ToastOptions): string; // tone destructive, 닫을 때까지 유지
  dismiss(id: string): void;
};
// Toaster: props 없음, 앱에 하나. 알림 영역 이름 "알림 ({hotkey})", 단축키 F8
interface TooltipProps {
  content: React.ReactNode; side?: "top" | "right" | "bottom" | "left"; // 기본 "top"
  delayDuration?: number;       // 기본값은 Radix 기본
  children: React.ReactElement; // 포커스·hover로 여는 트리거
}

// 22~24 데이터
interface Column<T> {
  id: string; header: React.ReactNode; cell(row: T): React.ReactNode;
  align?: "start" | "end" | "center"; width?: string; sortable?: boolean;
}
type SortState = { columnId: string; direction: "asc" | "desc" } | null;
interface TableProps<T> {
  rows: T[]; columns: Column<T>[]; getRowKey(row: T): string | number; caption: string;
  sort?: SortState; onSortChange?(next: SortState): void; // 오름 → 내림 → 해제
  getRowRail?(row: T): string | undefined;                 // CSS 색 값(예: 상태 토큰 변수). 첫 셀 border-inline-start 3px
  loading?: boolean; empty?: React.ReactNode; inPanel?: boolean; // inPanel: 첫·마지막 셀 바깥 여백 24px
}
interface TabItem { value: string; label: string; content: React.ReactNode; disabled?: boolean }
interface TabsProps {
  items: TabItem[]; value?: string; defaultValue?: string; onValueChange?(value: string): void;
  "aria-label": string; // tablist 이름. 활성화는 자동(포커스 = 선택)
}
interface PaginationProps {
  page: number; pageCount: number; onPageChange(page: number): void; // 번호 배열은 acceptance.md §3.1(현재 쪽 양옆 한 쪽 고정, siblingCount prop 없음)
  "aria-label"?: string;  // 기본 "페이지 이동"
}

// 25~27 탐색
interface SidebarItem { to: string; label: string; icon: LucideIcon }
interface SidebarGroup { label?: string; items: SidebarItem[] }
interface SidebarProps {
  groups: SidebarGroup[]; currentPath: string; isActive?(item: SidebarItem, currentPath: string): boolean;
  collapsed?: boolean; header?: React.ReactNode; footer?: React.ReactNode;
  linkComponent?: LinkComponent; "aria-label"?: string; // 기본 "주 메뉴"
}
interface BreadcrumbItem { label: string; to?: string }
interface BreadcrumbProps { items: BreadcrumbItem[]; linkComponent?: LinkComponent } // nav 이름 "현재 위치", 3단계까지
interface PageHeaderProps {
  title: string; titleAs?: "h1" | "h2" | "h3"; // 기본 "h1"
  breadcrumb?: React.ReactNode; badge?: React.ReactNode; description?: string;
  secondaryActions?: React.ReactNode; primaryAction?: React.ReactNode; subNav?: React.ReactNode;
}

// 28~29 테마
type ThemePreference = "light" | "dark" | "system"; // 저장 키 "kmc-admin-theme"
interface ThemeProviderProps { children: React.ReactNode } // 기본 선택 "system"
declare function useTheme(): {
  preference: ThemePreference; resolved: "light" | "dark"; setPreference(next: ThemePreference): void;
};
interface ThemeToggleProps { "aria-label"?: string } // 기본 "테마". 라이트·다크·시스템, 방향키 선택
```

- **런타임 공개 이름 40개**(`index.ts`가 이것만 내보낸다 — AC-UI-001-09): `Alert`, `Badge`, `Breadcrumb`, `Button`, `Calendar`, `Card`, `CardContent`, `CardDescription`, `CardFooter`, `CardHeader`, `CardTitle`, `Checkbox`, `Combobox`, `ConfirmDialog`, `ConfirmDialogHost`, `DateTimePicker`, `EmptyState`, `Field`, `Filter`, `Input`, `Loading`, `Modal`, `PageHeader`, `Pagination`, `Search`, `Select`, `Sidebar`, `Skeleton`, `SkeletonGroup`, `Table`, `Tabs`, `Textarea`, `ThemeProvider`, `ThemeToggle`, `Toaster`, `Tooltip`, `cn`, `showConfirm`, `toast`, `useTheme`.
- **공개 타입**: 위 코드 블록의 `…Props`, 옵션 타입, `Column`, `SortState`, `Tone`, `LinkComponent`, `ThemePreference`, `ConfirmOptions`, `ToastOptions`. 타입은 런타임 이름 검사 대상이 아니다.
- **공개하지 않는 것**: 명령형 스토어 초기화 함수(테스트 전용), Field 연결 훅 `useFieldControl`, Filter·ThemeToggle이 공유하는 방향키 선택 훅, `getPageItems`·`getTimeSlots` 같은 내부 순수 함수, CVA 변형 함수.
- 명령형 확인 함수를 `confirm`이 아니라 `showConfirm`으로 부르는 이유: 가져오기를 빠뜨리면 전역 `window.confirm`이 조용히 불리는 사고를 막고, 기존 호출 형태(`showConfirm(...)`, 현재 저장소 CustomerList.tsx:66-71)와 이름을 맞춘다.
- 아이콘 타입(`LucideIcon`)은 공개 API에 드러난다. 아이콘 세트는 lucide로 정해져 있으므로 받아들인다.

### A.6 상호작용 흐름 결정

1. **Combobox** — 편집형 입력(WAI-ARIA APG 목록 자동완성 패턴). cmdk 1.1.1이 입력의 `aria-expanded`(항상 `true`)·`id`·`aria-labelledby`·`aria-controls`를 고정하므로(research §6.3), 1순위 구조는 **직접 만든 `<input>` + cmdk의 목록·키보드·하이라이트**다(research §7.3 가). 입력은 Field의 `id`·라벨·설명·오류를 그대로 쓰고, `role="combobox"`, 실제 열림 상태의 `aria-expanded`, 목록 id를 가리키는 `aria-controls`, 하이라이트 항목의 `aria-activedescendant`, `aria-autocomplete="list"`를 직접 단다. 목록은 Radix Popover 안에 두되 Popover의 `role="dialog"`는 덮어쓴다(Popover는 사용자 props를 뒤에 펼친다 — research §6.6). 포커스는 입력에 머문다.
   - 흐름: 입력하면 열리고 첫 활성 옵션이 하이라이트된다(cmdk 기본 — research §6.14. 입력이 바뀔 때마다 제어형 `value`로 첫 옵션에 되돌린다). ↓/↑ 이동(끝에서 순환하지 않음), Enter 선택(입력에 라벨, 목록 닫힘), Esc 닫기(값 그대로), 닫힌 상태의 Esc는 입력과 값을 지운다(`onValueChange(null)`). Home/End는 입력 커서 이동에 남긴다. IME 조합 중 Enter는 무시한다(cmdk가 이미 처리하고, 우리 Enter 처리도 확인한다).
   - 포커스 이탈: 고르지 않고 벗어나면 입력을 선택된 라벨로 되돌린다. 값 동기화: 닫힌 동안 바뀐 `value`는 입력에 반영하고(목록에 없으면 `valueLabel`), 열린 동안에는 닫힐 때 맞춘다.
   - 두 거르기 모드 공통: `loading`이면 목록 안에 불러오는 중 표시, 아니면 결과 개수("결과 2개")나 빈 결과 문구를 `aria-live="polite"`로 알린다. 새 값 만들기는 `createAction`이 있고, 공백을 지운 입력이 비어 있지 않으며, 라벨이 똑같은 옵션이 없을 때 목록 끝에 둔다(결과가 있어도 보인다 — design-direction의 "일치하는 고객이 없으면" 예는 그 한 경우다). 원격 모드만 cmdk 거르기를 끄고 받은 결과를 그대로 보여 준다.
   - **M4 첫 RED 테스트로 1순위 구조를 확정하고, 막히면 2순위(`Command.Input` + DOM 보정)로 바꾼다. 둘 다 실패하면 D9를 뒤집는 결정이므로 blocker로 보고한다.**
2. **ConfirmDialog** — 해요체 질문 + 결과 설명 + [취소 또는 닫기(outline)] [구체 동사(default 또는 destructive)]. 열리면 취소 버튼에 포커스가 간다(Radix AlertDialog 기본 동작 — research §6.6). 비동기 `onConfirm`이면 확인 버튼이 loading이 되고 대화상자가 유지되며, 실패하면 대화상자 안에 destructive Alert(`live`)를 띄운다. 성공하면 닫고 `true`, Esc·취소는 `false`.
3. **Toast** — tone별 아이콘(`CircleCheck`·`Info`·`TriangleAlert`·`CircleAlert`). 동시에 3개까지 보이고 나머지는 대기한다. 표시 시간 success·info 5초, warning 7초, destructive는 닫을 때까지(Radix는 `Infinity`면 타이머를 시작하지 않는다). destructive는 foreground(`aria-live="assertive"`), 나머지는 background(`polite`). 알림 영역에 포인터나 포커스가 있으면 멈추고 벗어나면 남은 시간으로 다시 시작한다(Radix 기본 — research §6.14, WCAG 2.2.1). F8로 알림 영역("알림 (F8)")에 들어간다. 닫기는 "알림 닫기" 버튼, 포커스된 알림의 Esc, 스와이프(오른쪽, Radix 기본 동작 — 브라우저에서 수동 확인). 알림이 가장 위 레이어이면 포커스가 밖에 있어도 Esc가 알림을 먼저 닫는다(B-20). 동작은 하나까지. 위치는 768px 이상 오른쪽 아래, 그보다 좁으면 가운데 아래.
4. **Modal** — 열리면 본문의 첫 입력에 포커스를 둔다(닫기 버튼은 DOM 순서상 본문 뒤 — Radix FocusScope가 DOM 순서의 첫 포커스 가능 요소에 포커스를 두기 때문이다, research §6.14). 닫히면 연 버튼으로 포커스를 돌려준다. 닫기 버튼·Esc·스크림 클릭으로 닫힌다. `closeDisabled`를 `dirty`보다 먼저 판정한다. `closeDisabled`(제출 중)이면 `dirty`와 상관없이 세 경로를 모두 무시하고(작성 중 확인도 띄우지 않음) 닫기 버튼은 `aria-disabled`다. 그 밖에 `dirty`(작성 중)이면 세 경로 모두 "작성 중인 내용이 사라져요. 닫을까요?" [계속 작성] [닫기]로 묻는다. 설명이 없으면 `aria-describedby`를 연결하지 않는다.
5. **테마** — 기본값은 시스템 설정, 선택은 `localStorage`에 저장(실패하면 그 세션 동안 메모리에 유지하고 예외를 내보내지 않음), 선택이 시스템일 때만 `prefers-color-scheme` 변화를 따른다. `<html lang="ko">` 문서의 `<head>`에서 모듈 스크립트보다 앞에 둔 인라인 스크립트가 렌더링 전에 `.dark`를 적용해 깜빡임을 막는다. `color-scheme`은 CSS 토큰 파일이 지정한다. 전환 UI는 세 항목 단일 선택 묶음이다(방향키 선택 — 8번).
6. **Sidebar** — 펼침 240px, 접힘 64px. 접히면 이름은 화면에서 숨긴 텍스트로 남고 hover·포커스 때 오른쪽에 Tooltip이 뜬다. 묶음 이름은 구분선으로 바뀐다. 활성 항목은 `aria-current="page"` + `primary-subtle` 면 + `font-semibold`(고대비 모드 단서). 접힘 상태 저장·화면 폭에 따른 전환·서랍은 앱 셸(SPEC-UI-002)이 맡는다.
7. **Field 오류 표시** — 오류는 `CircleAlert` 14px + 문장(destructive) + `aria-invalid`. 검증 시점(blur·제출)과 제출 실패 시 첫 오류 필드로 포커스 이동은 폼 계층(SPEC-UI-002)이 맡는다. ui-core는 표시와 연결만 한다.
8. **키보드 계약** — 컨트롤마다 따르는 APG 패턴과 키다. "기본"은 배포 소스에서 확인한 라이브러리 동작(research §6.14)이고, "보강"은 이 SPEC이 더하는 동작이라 RED 테스트부터 쓴다.

| 컨트롤 | 패턴 | 키 | 근거 |
|---|---|---|---|
| Button·링크 | 네이티브 | Tab, Enter(링크·버튼), Space(버튼) | 브라우저 |
| Checkbox | APG 체크박스 | Space로 전환, Enter는 아무 일도 하지 않음 | Radix 기본(Enter를 막음) |
| Select | APG 선택 전용 콤보박스 | 닫힘: Enter·Space·↓·↑로 열기. 열림: ↓↑ 이동, Enter·Space 선택, Esc 닫기(값 그대로), 글자로 찾기 | Radix 기본 |
| Filter·ThemeToggle | APG 라디오 묶음 | Tab은 선택된 항목으로 들어감. ←→↑↓는 포커스와 선택을 함께 옮김(끝에서 처음으로 순환), Home·End는 처음·끝 항목 선택. Space·Enter는 포커스 항목 선택(선택된 항목은 해제되지 않음) | Radix 기본은 포커스만 옮김, 선택 이동은 보강 |
| Search | 네이티브 search 입력 | 글자 입력, Tab으로 지우기 버튼, Enter·Space로 지우기 | 브라우저 |
| Combobox | APG 편집형 콤보박스(목록 자동완성, 첫 항목 자동 하이라이트) | 1번 흐름 | cmdk 기본 + 보강 |
| Calendar | APG 날짜 격자 | ←→ 하루, ↑↓ 한 주, PageUp·PageDown 한 달, Shift+PageUp·PageDown 한 해, Home·End 그 주의 일·토, Enter·Space 선택, 비활성 날짜는 건너뜀 | react-day-picker 기본 |
| DateTimePicker | APG 날짜 선택 대화상자 | 트리거에서 Enter·Space로 열기, 선택 날짜(없으면 오늘)에 포커스, 날짜를 고르면 시간 칸 트리거로 포커스, 시간을 고르면 닫힘, Esc는 닫고 트리거로 복귀 | 첫 포커스·포커스 이동은 보강 |
| Modal·ConfirmDialog | APG 대화상자·경고 대화상자 | 포커스 가둠, Tab·Shift+Tab 순환, Esc 닫기(제출 중이면 작성 중이어도 확인 없이 무시, 그 밖에 작성 중이면 확인) | Radix 기본 + 4번 |
| Tooltip | APG 툴팁 | 트리거 포커스로 열림, 포커스를 잃거나 Esc로 닫힘 | Radix 기본 |
| Toast | Radix Toast | F8로 알림 영역, Tab으로 알림과 그 안 버튼, Esc로 포커스된 알림 닫기 | Radix 기본 |
| Tabs | APG 탭(자동 활성화) | ←→ 이동과 동시에 활성화, Home·End 처음·끝, Tab으로 탭 패널 | Radix 기본 |
| Table | 네이티브 표 + 정렬 버튼 | 정렬 머리글 버튼에 Tab, Enter·Space로 정렬 순환, 스크롤 영역은 Tab으로 포커스 후 방향키 스크롤 | 브라우저 |
| Pagination·Sidebar·Breadcrumb | 버튼·링크 | Tab, Enter(버튼은 Space도) | 브라우저 |

9. **기본 테마 정리 시연(허용 구역)** — 검증 섹션은 금지 클래스를 글자 그대로 담은 상수 하나를 `design-rules:allow-start`·`design-rules:allow-end` 표시 사이에 둔다. Tailwind가 이 파일을 후보로 훑으므로 빌드 CSS에 그 규칙이 없다는 것이 실제 파이프라인의 증거가 된다(AC-UI-001-06). 디자인 규칙 점검은 이 구역에서만 기본 테마 이름 규칙을 건너뛰고, 구역 바로 밖의 표본은 잡는다(EC-18). 문자열을 이어 붙여 만든 클래스는 Tailwind가 보지 못하므로 쓰지 않는다.
10. **DateTimePicker 값 규칙** — 날짜와 시간이 모두 정해질 때만 `onValueChange`를 부른다. 값이 없을 때 날짜만 고르면 대화상자 안의 진행 중 날짜로만 두고, 시간 없이 닫으면 버린다(기본 시간 없음 — 예약 시각을 잘못 정하는 일을 막기 위해). 값이 있을 때 날짜만 바꾸면 시·분을 유지해 바로 알린다. `granularity="date"`는 날짜를 고를 때 그날 00:00으로 알리고 닫는다. 시간 칸 라벨은 두 자리 시 `HH:mm`("09:00")이다.

### A.7 도메인 경계 결정

- **예약 상태 배지와 매핑 상수는 SPEC-UI-002의 도메인 모듈에 둔다**(system.md §9). ui-core가 제공하는 것은 Badge의 `icon`·`className`, Table의 `getRowRail`(색 값), 상태 토큰 15개(CSS 변수와 Tailwind 이름)뿐이다.
- 미리보기는 토큰 시연용 조합만 보여 준다. 화면에 "토큰 시연용 조합이에요. 예약 상태 배지는 SPEC-UI-002에서 만들어요."를 해요체로 밝히고, 순서는 system.md §9의 임시 순서(예약됨 → 방문함 → 완료 → 취소됨 → 노쇼)로 하며, 방문함·완료의 뜻을 전제한 설명 문구를 쓰지 않는다.
- Table은 TanStack을 쓰지 않는다. 정렬은 제어형이라 서버 파라미터(`sort_by`, `sort_order`)에 그대로 연결된다. 열 숨김·크기 조절이 필요해지면 그때 통합을 다시 검토한다(research §7.2).
- 검색 디바운스, 폼 상태, API 호출은 소비 측의 몫이다.

### A.8 의존성 고정 버전과 TypeScript

모두 정확한 버전으로 고정한다(`^` 없음). 출처: research §5.1(엔진·피어 확인 기록).

| 구분 | 패키지 | 버전 | 비고 |
|---|---|---|---|
| dependencies | react, react-dom | 19.3.1 | 레퍼런스와 같음 |
| | @radix-ui/react-slot · dialog · alert-dialog · popover · select · checkbox · tabs · toast | 1.5.0 · 1.3.1 · 1.2.1 · 1.3.1 · 2.4.1 · 1.4.1 · 1.2.1 · 1.3.1 | |
| | @radix-ui/react-tooltip | 1.4.1 | 새로 추가(접힌 사이드바, 아이콘 버튼) |
| | @radix-ui/react-toggle-group | 1.2.1 | 새로 추가(Filter, ThemeToggle) |
| | cmdk | 1.1.1 | D9 |
| | react-day-picker · date-fns | 10.0.2 · 4.4.0 | D9 |
| | lucide-react | 1.64.0 | 정식 이름만 사용 |
| | class-variance-authority · clsx · tailwind-merge | 0.7.1 · 2.1.1 · 3.7.0 | |
| | @fontsource-variable/noto-sans-kr | 5.3.1 | |
| devDependencies | vite · @vitejs/plugin-react | 8.3.5 · 6.1.2 | 대체 조합은 SPEC 개정 뒤에만(§B B-09) |
| | tailwindcss · @tailwindcss/vite | 4.3.3 · 4.3.3 | |
| | typescript | 5.9.3 | 아래 결정 |
| | @types/react · @types/react-dom · @types/node | 19.3.0 · 19.3.0 · 24.19.2 | |
| | vitest · @vitest/coverage-v8 | 5.0.5 · 5.0.5 | |
| | jsdom | 29.1.1 | 30.x 대신(§B B-10) |
| | @testing-library/react · dom · user-event · jest-dom | 16.3.3 · 10.4.2 · 14.6.8 · 7.0.1 | dom은 react의 필수 피어 |
| | axe-core | 4.14.0 | 새로 추가(자동 접근성 검사) |
| | @biomejs/biome | 2.6.4 | ESLint·Prettier 대체 |

- 합계: dependencies 20개, devDependencies 17개(acceptance.md AC-UI-001-01의 고정 목록과 같다). `engines.node`는 `^22.13.0 || ^24.0.0`으로 둔다. vite(`^20.19.0 || >=22.12.0`)·vitest(`^22.12.0 || ^24.0.0 || >=26.0.0`)·jsdom 29.1.1(`^20.19.0 || ^22.13.0 || >=24.0.0`)·jest-dom(`>=22`) 조건의 교집합은 `^22.13.0 || ^24.0.0 || >=26.0.0`이고, 이 가운데 이번에 확인하지 않은 26 이상을 빼고 LTS 줄 22·24만 남겼다(research §5.1).
- **TypeScript 결정: 5.9.3.** ① 7.0.2 패키지는 네이티브 실행 파일을 띄우는 `tsc` 하나만 제공한다(bin = `tsc`, 루트 export = `./lib/version.cjs`, `tsserver` 없음 — research §6.1). 편집기가 프로젝트의 TypeScript를 쓰지 못하고, MoAI LSP 설정이 쓰는 typescript-language-server(`.moai/config/sections/lsp.yaml:303-312`)는 tsserver를 감싸는 서버라 맞물리지 않는다. ② 이 프로젝트 규모(TS·TSX 87개 파일, 테스트 포함 — §I.3)에서는 7의 속도 이점이 작다. ③ 5.9.3은 레퍼런스가 같은 React 19.3·Tailwind 4.3과 함께 고정한 버전이다. ④ 설정은 7에서도 그대로 쓸 수 있게 쓴다(`baseUrl` 없이 `paths`, `moduleResolution: "bundler"`, `types` 명시). 편집기의 TypeScript 7 지원이 확인되면 고정값 한 줄로 올린다. 6.0.3도 tsserver가 있지만 5.9 이후 기본값 변화를 이번 조사에서 확인하지 못했다.

### A.9 기준선과 보존 목록

- 기준선: `main` HEAD `28c87a9`(계획 산출물이 커밋되면 그 HEAD), `origin/main`과 차이 `0 0`, Node 24.5.0, npm 11.5.1, `git ls-files src` 53개. `.moai/design/system.md`는 토큰 동기화 테스트가 읽으므로 계획 산출물과 함께 git에 추적되어야 한다. 이 기기의 PATH `tsc`는 `/mnt/c/Program Files/nodejs/tsc`(Version 6.0.3)로 프로젝트 TypeScript가 아니다.
- **보존(고치지 않음)**: `.claude/**`, `.moai/**`(이 SPEC의 산출물은 소유 에이전트만 갱신), `CLAUDE.md`, `.mcp.json`, `.claudeignore`, `.worktreeinclude`, `.git_hooks/**`, `.github/**`, `.env`, `src/vite-env.d.ts`(내용 유지), `README.md`(동기화 단계에서 manager-docs가 고친다).
- 저장소 밖: `kmcbeauty-fastapi`, `kmcbeauty-native`는 읽기만 한다.

---

## §B 알려진 문제와 위험

| ID | 위험 | 근거 | 대응 | 시점 |
|---|---|---|---|---|
| B-01 | cmdk가 입력의 ARIA·id를 고정하고 Home/End를 가로챈다. 첫 항목 자동 하이라이트는 cmdk 기본 동작이다 | [검증] research §6.3·§6.14 | A.6-1의 1순위 구조, 막히면 2순위, 둘 다 실패하면 D9 재검토 blocker. 하이라이트 되돌리기·포커스 이탈 되돌리기는 RED부터 | M4 |
| B-02 | react-day-picker 10은 레거시 패키지 이름이고 shadcn 예제는 v9 기준이다 | [검증] 이름·UI 요소 이름·`ko` 로캘·props·키 표·월 머리(research §6.14) / [미검증] jsdom에서의 실제 포커스 이동 | `calendar.tsx`에 의존을 가두고 v9 예제를 옮기지 않는다. 키마다 도착 날짜를 테스트로 확인(AC-UI-001-21). DateTimePicker 첫 포커스는 보강이라 RED부터 | M4 |
| B-03 | Tailwind 4 기본 테마 정리의 실제 결과(design-direction §6.5 1~4) | [검증] `compile` API / [미검증] 생성 결과 | 정리용 `@theme`과 매핑용 `@theme inline` 분리, `compile` 테스트(E.2) | M1 |
| B-04 | 자동 소스 감지가 `.claude`·`.moai` 문서를 훑어 CSS가 문서 내용에 따라 달라진다 | [추론] | `@import "tailwindcss" source("..")`로 `src/`만 감지 | M1 |
| B-05 | tailwind-merge가 `text-body`·`rounded-panel` 같은 이름을 잘못 분류해 클래스를 지운다 | [미검증] | `extendTailwindMerge`로 `text`·`radius`·`shadow`·`container` 키 등록, `cn.test.ts`로 고정 | M1 |
| B-06 | Noto Sans KR Variable의 `tnum` 지원 | [미검증] | M6 측정 장치로 측정·기록만 한다. 대체 글꼴 결정은 SPEC-UI-002(A.2-2 확정) | M6 |
| B-07 | lucide 1.x의 옛 이름은 별칭이다(`Trash2` = `Trash`, `CheckCircle` = `CircleCheckBig`) | [검증] | 정식 이름만 쓰고 규칙 점검 테스트로 별칭을 막는다 | M1~ |
| B-08 | TypeScript 7의 도구 호환 | [검증] | 5.9.3 고정 + 7 호환 설정 | M1 |
| B-09 | Vite 8 + 플러그인 실제 빌드 | [검증] 피어 / [미검증] 빌드 | M1 빌드로 확인. 막히면 구현을 멈추고 blocker로 보고한다. 대체 조합(Vite 7.3.7 + plugin-react 5.2.0)은 사용자 승인 뒤 manager-spec이 §A.8·REQ-UI-001-001·AC-UI-001-01의 고정 목록을 개정한 다음에만 쓴다(정확 고정 검사와 모순되지 않게) | M1 |
| B-10 | jsdom 30의 엔진 조건 | [검증] | jsdom 29.1.1 | M1 |
| B-11 | 기존 코드 제거와 pre-commit 게이트. 게이트는 도구 체계를 감지하지 못해도 0을 내고, PATH의 `tsc`는 프로젝트 밖 6.0.3이다 | [검증] 훅·문서·`moai gate --help`·`command -v tsc` / [전달] `npm test` 필수 / [미검증] 테스트 0개일 때 종료 코드, 게이트가 Node 도구 체계를 감지하는지 | 제거·스캐폴드·첫 테스트를 한 커밋에, 단일 tsconfig, 네 명령과 커버리지를 따로 실행, M1·M6에서 게이트 실행 단계와 `tsc` 경로 기록(AC-UI-001-03). 게이트가 프로젝트 밖 도구 때문에 실패하면 커밋하지 않고, 게이트 출력과 `command -v tsc`·`tsc --version` 결과를 붙여 blocker로 보고한다(설정 변경·훅 우회 금지) | M1 |
| B-12 | jsdom에 없는 브라우저 API(`ResizeObserver`, `scrollIntoView`, 포인터 캡처, `matchMedia`) | [추론] | `src/test/setup.ts`에서 없을 때만 대체 구현 | M1 |
| B-13 | 모듈 수준 스토어(토스트·확인)의 테스트 간 누수, Host 중복 | 설계 판단 | Host는 앱 루트에 하나, 테스트 초기화 함수, `@MX:WARN` | M3 |
| B-14 | 게이트 테스트 단계 제한 120초 | [검증] gate 설정 | 가짜 타이머, 네트워크 없음, 마일스톤마다 실행 시간 기록 | 매 마일스톤 |
| B-15 | 배포 공백 동안 운영 화면이 미리보기로 바뀔 수 있다 | [추론] | 운영 배포 중지(A.2-1 확정) + `deploy.sh` 배포 중지 가드(`ALLOW_PREVIEW_ONLY_DEPLOY`가 `1`이 아니면 종료 코드 1). SPEC-UI-002에서 가드 제거 | M1·전체 |
| B-16 | 방문함·완료의 업무 뜻이 정해지지 않았다 | [검증] 백엔드·앱 값 | ui-core는 토큰만, 미리보기는 뜻을 전제한 문구를 쓰지 않는다 | M2·M6 |
| B-17 | Radix Dialog가 설명 없을 때 개발 경고를 낸다 | [미검증] | 설명이 없으면 `aria-describedby={undefined}`, 테스트에서 콘솔 경고 0 | M3 |
| B-18 | 컴포넌트와 함수를 함께 내보내는 파일은 HMR이 전체 새로고침이 된다 | [추론, 영향 작음] | 받아들인다 | — |
| B-19 | Radix ToggleGroup 1.2.1의 방향키는 포커스만 옮긴다(roving focus). 항목이 `role="radio"`인데 선택이 따라오지 않으면 APG 라디오 묶음과 어긋난다 | [검증] research §6.14 | 방향키 선택 보강(A.6-8, design.md §6.4), RED부터. Filter는 방향키마다 `onValueChange`가 불리므로 이전 요청 취소는 SPEC-UI-002가 맡는다 | M1·M3 |
| B-20 | Radix Toast는 가장 위 레이어일 때 포커스가 밖에 있어도 Esc로 알림을 닫는다 | [검증] research §6.14 | 받아들인다. 대화상자 위에 알림이 뜨면 첫 Esc는 알림, 다음 Esc는 대화상자를 닫는다(design.md §5.2) | M3 |
| B-21 | 토큰 동기화 테스트가 system.md 표 형식에 묶인다 | 설계 판단 | 행 수 확인으로 빈 비교를 막고, 표 형식이 바뀌면 테스트가 깨지게 둔다(system.md §13 변경 절차) | M1 |

---

## §C 사전 점검 (M1 착수 전, manager-develop)

```bash
git branch --show-current                     # main
git rev-parse --short HEAD                    # 계획 산출물 커밋 이후의 HEAD
git status --short                            # 계획한 경로 외 변경 없음
git fetch origin main && git rev-list --count --left-right origin/main...HEAD   # "0 N" 또는 "0 0"
node --version && npm --version               # v24.x, 11.x
git ls-files src | wc -l                      # 53 — 제거 대상 확인
git ls-files .moai/design/system.md           # 한 줄 — 토큰 동기화 테스트가 읽는다
command -v tsc; tsc --version                 # PATH의 tsc(이 기기: /mnt/c/Program Files/nodejs/tsc, 6.0.3) — 프로젝트 TypeScript가 아님
moai gate; echo "gate exit=$?"                # 선택: 기존 트리에서 게이트가 실행하는 단계 기록
```

---

## §D 제약과 제외 범위

### D.1 제약

1. **위치·브랜치** — 주 체크아웃의 `main`에서 작업하고 새 브랜치를 만들지 않는다(git-strategy `auto_enabled: false`, late-branch). 브랜치 상태를 바꾸는 명령(`git switch`, `git checkout -b`, `git stash`, `git reset --hard`, `git rebase`)을 쓰지 않는다. 푸시와 PR 경로(Tier L)는 오케스트레이터가 정하며, manager-develop은 지시 없이 `origin/main`에 푸시하지 않는다.
2. **커밋** — Conventional Commits, 한국어 메시지(`git_commit_messages: ko`), 제목 `feat(SPEC-UI-001): M{n} …`, 마지막 줄 `🗿 MoAI`. 경로를 명시해 스테이징하고 `git add -A`·`git add .`·`git commit -a`를 쓰지 않는다. `--no-verify`·`--amend` 금지. 커밋마다 pre-commit 게이트를 통과해야 한다.
3. **TDD** — 컴포넌트마다 RED(실패하는 테스트와 그 출력 원문) → GREEN → REFACTOR.
4. **언어** — 코드 주석과 테스트 이름은 한국어(`code_comments: ko`), 식별자는 영어.
5. **UI 문구** — 문장은 해요체, 버튼·라벨·표 머리글은 명사형, 시간은 `HH:mm`, '확인'은 결과가 없는 안내에만, 느낌표·이모지 금지(system.md §11).
6. **스타일** — 토큰 유틸리티만 쓴다. `dark:` 변형, 팔레트 클래스(`bg-rose-700`, `text-white` 등), `outline-none`, `hover:opacity-*`, Tailwind 기본 크기 이름(`text-sm`, `rounded-lg`, `shadow-xl`)을 쓰지 않는다(금지 이름 집합은 acceptance.md AC-UI-001-10 — 색·반경·그림자·글자 크기·컨테이너의 Tailwind 기본 테마 이름). 전역 CSS는 토큰과 기본 계층(body 글꼴·색·배경, 줄바꿈, 기본 테두리 색, 감속 모드 안전망)만 둔다.
7. **디자인 값** — 토큰과 규칙의 정본은 system.md다. 구현 중 값이나 규칙을 바꿔야 하면 코드에서 먼저 바꾸지 말고 blocker로 보고한다(system.md §13: 정본을 먼저 고친다). design-direction.md는 고치지 않는다.
8. **경계** — ui-core는 예약 상태(상태 키·라벨·아이콘·상태 토큰 클래스)를 참조하지 않는다. ui-core에 상태 관리 라이브러리·라우터·API 클라이언트를 넣지 않는다.
9. **아이콘** — lucide 정식 이름만 쓴다(research §6.5).
10. **패키지** — A.8 고정값 그대로, npm만 사용, `package-lock.json` 커밋. 표에 없는 패키지가 필요하면 `npm view <pkg> version peerDependencies engines` 결과를 붙여 blocker로 보고한다.
11. **배포** — SPEC-UI-002 완료 전까지 운영 배포를 하지 않는다(A.2-1 확정). 가드는 `src/test/deploy-guard.test.ts`(임시 디렉터리, 더미 `.env.stage`, 대역 `npm`·`scp`)로만 확인하고, 저장소 작업 트리에서 `ALLOW_PREVIEW_ONLY_DEPLOY=1`로 `deploy.sh`를 실행하지 않는다.
12. **사용자 상호작용** — 하위 에이전트는 사용자에게 묻지 않고 구조화된 blocker 보고를 돌려준다.
13. **보존 목록** — A.9의 경로를 고치지 않는다.

### D.2 제외 범위

spec.md §8을 그대로 옮긴 것이다(spec.md 0.3.1).

### Out of Scope — 업무 화면·라우팅·앱 셸
- 로그인, 매장 선택, 예약 캘린더, 고객, 시술 메뉴, 시술 이력, 이용약관, 개인정보처리방침 화면 → SPEC-UI-002
- 라우터 도입과 경로 구성 → SPEC-UI-002
- 앱 셸 조립(상단바, 사이드바 접힘 상태 저장, 768~1023px 자동 접힘, 768px 미만 서랍, 앱 셸의 건너뛰기 링크, 사용자 메뉴, 현재 매장 표시) → SPEC-UI-002. 미리보기 페이지 자체의 건너뛰기 링크는 이 SPEC에서 만든다

### Out of Scope — 데이터·인증 계층
- API 클라이언트, Orval 생성 코드, TanStack Query → SPEC-UI-002
- 인증(토큰 저장·갱신, 접근 제어)과 매장 상태 저장 → SPEC-UI-002
- `VITE_API_BASE_URL` 정리와 API 프록시 재구성 → SPEC-UI-002. 기존 Vite `/api` 프록시 설정은 M1의 `vite.config.ts` 재작성에서 빠진다(미리보기는 API를 쓰지 않는다)
- 검색 디바운스, Filter 빠른 연속 선택 때 이전 요청 취소, 폼 상태·검증 시점, 제출 실패 시 첫 오류 필드 포커스, 숫자 입력 마스킹(천 단위 쉼표)

### Out of Scope — 예약 도메인
- 예약 상태 배지(StatusBadge)와 상태 → {라벨, 아이콘, 토큰} 매핑 상수 → SPEC-UI-002의 예약 도메인 모듈
- 방문함·완료의 업무 뜻, 상태 전환 규칙, 툴팁·범례 문구, 업무 화면의 상태 표시 순서 확정 → SPEC-UI-002. 미리보기는 system.md §9의 임시 순서(예약됨 → 방문함 → 완료 → 취소됨 → 노쇼)를 쓴다
- 상태별 개수를 보여 주는 필터 연결(백엔드 집계 지원 미확인)

### Out of Scope — FullCalendar
- FullCalendar 설치와 토큰 연결(`--fc-*` 변수), 캘린더 이벤트의 상태 레일 표시 → SPEC-UI-002(design-direction.md §15)

### Out of Scope — 레퍼런스에서 뺀 컴포넌트와 기능 확장
- FileUpload, Chart, 상단 Navbar, Form 데모
- Combobox 다중 선택 칩, 날짜 범위(기간) 선택, DropdownMenu, 레일이 붙는 목록 항목, 공개 Popover
- TanStack Table 통합, compact 밀도, 여러 계열 차트 팔레트, CSV 내보내기

### Out of Scope — 배포와 검증 범위
- 운영 배포 — M1 커밋부터 SPEC-UI-002 완료까지 중지한다(`deploy.sh` 배포 중지 가드). 가드 확인은 대역 `npm`·`scp`를 쓰는 테스트로만 하고 실제 전송은 하지 않는다
- Noto Sans KR Variable `tnum` 미지원 시 대체 숫자 글꼴 도입 → SPEC-UI-002
- ΔE00 구분성 자동 검사, 브라우저 E2E 테스트, 시각 회귀 테스트, 실제 고대비 화면의 자동 확인(Windows 고대비 수동 확인은 선택)

### Out of Scope — 저장소 밖과 문서
- kmcbeauty-fastapi, kmcbeauty-native 변경
- README 재작성 — 이 SPEC의 동기화 단계에서 manager-docs가 한다(run 단계 범위 밖)
- 프로젝트 문서(product·structure·tech.md — 사용자 결정으로 재구축 뒤로 미룸), `.github/` 변경, MoAI 훅·설정 변경

---

## §E 자체 검증과 테스트 전략

### E.1 마일스톤 게이트

모든 마일스톤의 마지막 커밋은 아래를 모두 통과한다(커밋을 나누면 각 커밋이 pre-commit 게이트를 통과). 커버리지는 커밋 직전에 재고, 게이트는 커밋할 때 훅이 실행한다. 정규식 검사는 표 밖 코드 블록에 둔다(표 칸 안의 `\|`는 복사하면 글자 그대로 남아 검사가 언제나 0을 낸다).

| 확인 | 명령 | 통과 조건 |
|---|---|---|
| 타입 | `npm run typecheck` | 종료 코드 0(프로젝트 TypeScript 5.9.3) |
| 린트·서식 | `npm run lint` | 종료 코드 0(게이트가 Biome을 실행하지 않을 수 있어 따로 실행) |
| 테스트 | `npm test` | 종료 코드 0 |
| 커버리지(커밋 직전) | `npm run test:coverage` | `src/ui-core` 줄·문장·함수 85%, 분기 80% 이상 |
| 빌드 | `npm run build` | 종료 코드 0 |
| 게이트 실측(커밋 때) | pre-commit `moai gate` | 종료 코드 0. M1·M6에서는 실행된 단계와 쓰인 `tsc` 경로·버전을 기록한다. 게이트는 도구 체계를 감지하지 못해도 0을 내므로(`moai gate --help`) 위 명령들이 판정 근거다 |
| 배포 중지 가드 | `npx vitest run src/test/deploy-guard.test.ts` | 통과(대역 명령만 쓰고 실제 배포 없음) |
| 경계·옛 의존성 | 아래 코드 블록 | 경계 출력 없음, 패턴 자체 확인 `2`, 옛 의존성 출력 없음 |
| 작업 트리 | `git status --short` | 계획한 경로만 변경 |

```bash
grep -rnE 'RESERVED|VISITED|COMPLETED|CANCELLED|NO_SHOW|status-(reserved|visited|completed|cancelled|no-show)' src/ui-core   # 출력 없음
printf '%s\n' 'NO_SHOW' 'bg-status-no-show-rail' | grep -cE 'RESERVED|VISITED|COMPLETED|CANCELLED|NO_SHOW|status-(reserved|visited|completed|cancelled|no-show)'   # 2
grep -rnE --exclude='*.test.*' 'zustand|@headlessui|axios|react-router|@fullcalendar|file-saver' package.json src          # 출력 없음
```

### E.2 테스트 전략

- **피라미드(E2E 없음)** — 순수 함수 단위 테스트 약 25%(cn 병합, 대비 계산, 토큰 파싱, 페이지 번호 계산, 시간 칸 생성, 테마 판정), 컴포넌트 테스트 약 70%(Testing Library + jsdom, 행동과 접근성), 결합 테스트 약 5%(미리보기 기본 렌더, `index.html` 테마 스크립트). 테스트 파일은 38개(M1 11, M2 12, M3 6, M4 3, M5 6)다.
- **도구** — Vitest 5 + jsdom 29.1.1, @testing-library/react·user-event·jest-dom(`@testing-library/jest-dom/vitest`), axe-core, @vitest/coverage-v8. 대비·기본 테마 정리 테스트는 파일 머리에 `@vitest-environment node`를 둔다.
- **설정 파일 `src/test/setup.ts`** — jest-dom 매처, 테스트 뒤 정리, 없을 때만 `ResizeObserver`·`scrollIntoView`·포인터 캡처·`matchMedia` 대체, 명령형 스토어(토스트·확인) 초기화.
- **작성 규칙** — 역할과 접근 이름으로 찾는다(`getByRole`). 입력은 user-event로 흉내 낸다. 타이머는 가짜 타이머를 쓴다. 스냅숏 테스트는 쓰지 않는다. Tailwind 클래스 문자열은 계약에 해당할 때만 확인한다(오른쪽 정렬·`tabular-nums`, 레일 인라인 스타일 등). 테스트 하나에 행동 하나(준비·실행·확인). 테스트 이름은 한국어 문장.
- **자동 접근성** — 컴포넌트의 주요 상태마다 axe-core 검사(위반 0, 도우미 `src/test/axe.ts`). jsdom은 색을 계산하지 못하므로 `color-contrast` 규칙은 끄고 대비는 토큰 대비 테스트가 맡는다.
- **횡단 테스트 8개**
  1. `src/styles/tokens.contrast.test.ts` — `tokens.css`의 라이트(`:root, .light`)·다크(`.dark`) 블록을 읽어 design-direction §5.5의 기준 있는 52쌍 × 2테마(텍스트 4.5:1, UI 3:1)와 상태 90개 값을 검사한다. 각 쌍의 HEX 값과 기록된 최저값(라이트 텍스트 4.86·UI 3.04, 다크 텍스트 5.39·UI 3.03, 상태 라이트 4.66·3.95, 상태 다크 5.44·4.46)을 ±0.01 허용 오차로 비교해 문서에 없는 값 변경을 잡는다.
  2. `src/styles/theme-reset.test.ts` — `tailwindcss`의 `compile`로 `src/styles/index.css`를 컴파일한다. 금지 클래스(`bg-rose-700`, `text-white`, `rounded-lg`, `shadow-xl`, `text-sm`)는 CSS를 만들지 않고, 토큰 클래스(`bg-background`, `rounded-panel`, `shadow-raised`, `text-body`, `max-w-content`, `bg-status-reserved-bg`)와 정적 유틸리티(`rounded-full`, `rounded-none`, `bg-transparent`, `bg-current`, `shadow-none`)는 CSS를 만든다. `text-heading`에 `letter-spacing`이 함께 들어가는지, `outline-hidden`이 `forced-colors` 블록을 만드는지 확인한다.
  3. `src/test/design-rules.test.ts` — `src/ui-core`(테스트 포함)·`src/preview` 소스에 금지 패턴(`dark:`, 설치된 `theme.css`에서 만든 Tailwind 기본 테마 이름 클래스 — 색·반경·그림자·글자 크기·컨테이너, `outline-none`, `hover:opacity-`)이 허용 구역(A.6-9) 밖에 없는지(위반은 `경로:줄`로 보고), `lucide-react` 가져오기가 모두 정식 이름인지(`lucide-react.d.ts`의 `declare const` 이름 집합), `src/ui-core`에 예약 상태 키 5종·상태 토큰 클래스가 없는지, `src/styles/index.css`에 허용 밖 클래스 선택자(R1)가 없는지, 조건 없는 `animate-*`와 box-shadow 포커스 링이 없는지, 컴포넌트 파일이 29개이고 각 파일이 §A.3 '기반' 열의 라이브러리를 가져오는지(acceptance.md AC-UI-001-09 표), `@/ui-core`의 런타임 내보내기가 공개 이름 40개와 같고 `index.ts`에 `export *`가 없는지, 미리보기가 `@/ui-core`에서만 가져오는지 확인한다. 일부러 넣은 위반 표본(허용 구역 바로 밖의 표본 포함)을 실제로 잡아내는지 보는 자기 검사도 둔다.
  4. `src/test/theme-init.test.ts` — `index.html`의 인라인 스크립트를 jsdom에서 실행해 저장값과 시스템 설정에 따라 `.dark`가 붙는지(acceptance.md AC-UI-001-08 표), 저장 키가 `kmc-admin-theme`인지 확인하고, `<html lang="ko">`와 스크립트 위치(`<head>` 안, 모듈 스크립트 앞)를 확인한다.
  5. `src/preview/PreviewPage.test.tsx` — 미리보기가 오류 없이 렌더링되고 h1이 하나이며, 전시 목록의 모든 항목이 라이트·다크에서 렌더링되고, axe 위반이 없으며, 상태 시연 순서·`tnum` 판정·해요체 종결(양성 검사)을 확인한다(AC-UI-001-14).
  6. `src/styles/tokens.sync.test.ts` — system.md 표를 직접 읽어 토큰 값(색·상태·`color-scheme`·그림자·반경·글꼴·글자 크기·폭·사이드바 폭)을 `tokens.css`·`index.css`와 비교하고, 읽은 행 수로 빈 비교를 막는다(AC-UI-001-05).
  7. `src/test/deploy-guard.test.ts` — 임시 디렉터리의 `deploy.sh`를 더미 `.env.stage`·대역 `npm`·`scp`로 실행해 가드의 두 경로를 확인한다(AC-UI-001-04).
  8. `src/test/dependency-pins.test.ts` — `package.json` 의존성을 고정 목록과 정확히 비교한다(AC-UI-001-01).
- **커버리지** — 대상 `src/ui-core/**/*.{ts,tsx}`(테스트·`index.ts` 제외), 줄·문장·함수 85%, 분기 80%(quality.yaml `test_coverage_target: 85`, 커밋당 최소 80%는 `tdd_settings.min_coverage_per_commit`). 임계값은 M1부터 설정에 둔다.
- **실행 시간** — 전체 스위트가 게이트 제한(120초)보다 충분히 짧아야 한다. 마일스톤마다 실행 시간을 기록한다.

### E.3 컴포넌트별 검증 항목

| 컴포넌트 | 행동 | 접근성·키보드 |
|---|---|---|
| Button | 변형·크기, `asChild` 링크, loading 중 클릭 무시 | loading 때 `aria-busy`·`aria-disabled`이고 `disabled`가 아니며 포커스 유지, 아이콘 전용 버튼의 접근 이름 |
| Badge | tone별 토큰 클래스, `className`으로 면 덮어쓰기(`cn` 병합 — ui-core 테스트는 중립 토큰, 상태 클래스는 미리보기 테스트) | 아이콘 `aria-hidden` |
| Loading | 문구 표시 | `role="status"`, 감속 모드 회전 정지 클래스 |
| Skeleton | SkeletonGroup은 `delayMs`(기본 300ms)가 지나기 전에는 렌더링하지 않음(가짜 타이머) | 묶음 `aria-busy` + 숨은 문구, 블록 `aria-hidden` |
| EmptyState | 제목·설명·동작 하나 | 아이콘 `aria-hidden` |
| Alert | tone별 면·아이콘 | `live`일 때만 `role="alert"` |
| Card | 조합 부품 | 제목의 제목 수준 지정 |
| Field | 라벨·설명·오류 표시, 필수 `*` | `htmlFor`↔`id`, `aria-describedby`에 실제로 렌더링한 id만, `aria-invalid`, `required`(버튼형 대상은 `aria-required`), `*`는 `aria-hidden` |
| Input·Textarea | 부가 표시(글자는 `aria-describedby`, 아이콘은 숨김), read-only 면, 최소 높이 | Field 연결, `aria-invalid`, `required`, `border-input` |
| Checkbox | 체크·해제·indeterminate | `role="checkbox"`, `aria-checked` true·false·mixed, Space로 전환·Enter는 무시, 라벨 클릭, 필수면 `aria-required` |
| Search | 값이 있을 때만 지우기 버튼 | `type="search"`, `aria-label` 필수, 지운 뒤 입력에 포커스 |
| Select | 저장은 `value`, 표시는 `label`, 비활성 옵션, 선택 옵션 체크 아이콘 | 트리거 `role="combobox"`, Enter·Space·↓·↑로 열기, Enter·Space로 선택, `role="option"`, Esc 닫기, 필수면 트리거에 `aria-required` |
| Filter | 단일 선택, 선택 해제 불가, 개수 표시, 선택 단서 | `role="radiogroup"`·`radio`, `aria-checked`, 방향키가 포커스와 선택을 함께 옮김(보강, RED부터) |
| Combobox | 로컬 거르기, 원격 무필터, loading, 빈 결과, 새 값 만들기(라벨이 똑같은 옵션이 없을 때), 포커스 이탈 되돌리기, 값 동기화 | `role="combobox"`, `aria-expanded`가 열림 상태와 일치, `aria-controls`→`listbox`, 첫 옵션 자동 하이라이트와 `aria-activedescendant`, ↓↑·Enter·Esc 두 번, Home/End는 입력에, IME 조합 중 Enter 무시, 두 모드의 결과 개수·빈 결과 `aria-live` |
| Calendar | 한국어 월 머리·요일, 일요일 시작, 주말 색 수정자, 비활성 날짜, 선택 날짜 단서 | `role="grid"`, 키마다 도착 날짜(AC-UI-001-21), Enter·Space 선택, 비활성 날짜 건너뛰기 |
| DateTimePicker | 날짜·시간이 모두 정해질 때만 알림, 날짜만 바꾸면 시간 유지, `granularity="date"`, 영업시간·간격 칸(두 자리 시, 경계값 표), 표기 "2026. 10. 29. (목) 14:30" | 팝업 `role="dialog"`, 열 때 날짜에 포커스, 날짜 뒤 시간 칸으로 포커스, Esc로 닫으면 트리거로 복귀, 필수면 트리거에 `aria-required` |
| Modal | 크기, 제출 중 닫기 막기(세 경로, 작성 중이어도 확인 없음), 작성 중 닫기 확인(세 경로), 스크림 닫기 | `role="dialog"`, `aria-labelledby`, 설명이 있을 때만 `aria-describedby`, 첫 입력 포커스, 닫기 버튼 "닫기"(제출 중 `aria-disabled`), Esc, 포커스 복귀, 콘솔 경고 0 |
| ConfirmDialog | `showConfirm()`이 `true`·`false`로 끝남, 비동기 loading·실패 Alert, 닫기 문구 지정 | `role="alertdialog"`, 처음 포커스는 취소 버튼 |
| Toast | 대기열 최대 3, tone별 시간(가짜 타이머), 포인터·포커스로 멈춤, 오류 유지, 동작 하나 | `aria-live` polite·assertive, F8로 "알림 (F8)" 영역, 닫기 "알림 닫기"·Esc |
| Tooltip | 내용 표시 | 포커스로 열림, Esc로 닫힘, 트리거와 연결 |
| Table | 정렬 순환(오름 → 내림 → 해제), 오른쪽 정렬·`tabular-nums`, 레일 색, 로딩 스켈레톤, 빈 상태 | 숨긴 `caption`, `th scope="col"`, `aria-sort`, 정렬 버튼(포커스 클래스, Enter·Space), 스크롤 영역 `tabIndex=0` + `aria-label` |
| Tabs | 항목 전환(자동 활성화) | `tablist` 이름, 방향키·Home·End, `aria-selected`, 활성 탭 밑줄 단서 |
| Pagination | 페이지 번호 계산(acceptance.md §3.1 표가 정본, 규칙은 REQ-UI-001-023), 이전·다음 비활성 | `nav` "페이지 이동", `aria-current="page"`, 현재 쪽 단서 |
| Sidebar | 활성 판정, 링크 컴포넌트에 `to` 전달(가짜 라우터 링크로 확인), 접힘 렌더링 | `nav` 이름, `aria-current`, 활성 단서(굵기·강제 색 테두리), 접힘 때 숨은 이름 + Tooltip |
| Breadcrumb | 항목·링크 | `nav` "현재 위치", `ol`, 마지막 항목 `aria-current`, 구분 기호 `aria-hidden` |
| PageHeader | 자리 배치 | 제목 기본 h1, `titleAs`로 h2·h3 |
| ThemeProvider | 기본 시스템, 저장(실패해도 세션 동안 유지), 시스템일 때만 변화 추종, `.dark` 전환 | — |
| ThemeToggle | 선택하면 테마가 바뀜 | `radiogroup` "테마", 항목마다 접근 이름, 방향키가 포커스와 선택을 함께 옮김(보강, RED부터), 선택 단서 |

### E.4 디자인 검증 항목 대응(design-direction §6.5)

| # | 항목 | 확인 수단 | 시점 | 자동 |
|---|---|---|---|---|
| 1 | `@theme inline`과 `--color-*: initial` | 정리용 `@theme` 분리 + `theme-reset.test.ts` | M1 | 예 |
| 2 | 정리 뒤 정적 유틸리티 유지 | `theme-reset.test.ts` | M1 | 예 |
| 3 | `--text-*--letter-spacing` 적용 | `theme-reset.test.ts`(`text-heading`) | M1 | 예 |
| 4 | `outline-hidden`과 forced-colors | `theme-reset.test.ts`(생성 CSS) + Windows 고대비 모드 수동 확인(선택) | M1·M6 | 일부 |
| 5 | Noto Sans KR Variable `tnum` | 미리보기 판정 장치: "1111"과 "0000"을 기본 숫자와 `tabular-nums`로 각각 재어 지원·기본 고정폭·미지원·측정 불가로 판정(acceptance.md §3.2, 판정 함수는 자동 테스트) + 브라우저 판정 기록. 대체 글꼴 결정은 SPEC-UI-002 | M6 | 일부 |
| 6 | react-day-picker 10 API | calendar·date-time-picker 테스트 | M4 | 예 |
| 7 | cmdk + Popover의 ARIA | combobox 테스트 | M4 | 예 |

### E.5 MX 태그 계획 (mx_plan)

MX 대상은 계획 단계(Phase 14)에서 정하고, 태그는 run 단계에서 각 파일을 만들 때 쓰며, 동기화 단계는 태그가 있는지 확인만 한다. 태그 문구는 한국어(`code_comments: ko`)이고, WARN·ANCHOR에는 `@MX:REASON`을 붙인다. 파일당 한도(ANCHOR 3, WARN 5, NOTE 10) 안이다.

| 파일 | 태그 | 내용 요지 |
|---|---|---|
| `src/ui-core/cn.ts` | ANCHOR | 모든 컴포넌트의 클래스 병합 진입점. 테마 키 등록을 바꾸면 모든 `className` 덮어쓰기 결과가 바뀐다 |
| `src/ui-core/index.ts` | ANCHOR | 공개 API 경계. 소비 측은 `@/ui-core`만 가져온다. 내보내기를 지우거나 이름을 바꾸면 SPEC-UI-002 화면이 깨진다 |
| `src/ui-core/field.tsx`(컨트롤 연결 훅) | ANCHOR | Input·Textarea·Select·Checkbox·Combobox·DateTimePicker가 쓰는 aria 연결 규약 |
| `src/ui-core/button.tsx` | ANCHOR | Modal·ConfirmDialog·Pagination·Search 등이 쓰는 기본 동작 요소. loading은 `disabled`가 아니라 `aria-disabled`(R16) |
| `src/ui-core/toast.tsx` | WARN | 모듈 수준 대기열. `Toaster`는 앱에 하나, 테스트마다 초기화 |
| `src/ui-core/confirm-dialog.tsx` | WARN | 모듈 수준 상태와 비동기 `onConfirm` 실패 처리. Host는 하나 |
| `src/ui-core/combobox.tsx` | WARN | cmdk가 고정하는 ARIA를 피하려고 cmdk가 렌더링한 DOM 속성(`[cmdk-list]`의 id, `[cmdk-item][data-selected]`)을 읽는다. cmdk 버전을 바꾸면 테스트로 다시 확인 |
| `src/ui-core/theme-provider.tsx` | WARN | 저장 키와 클래스 이름이 `index.html` 인라인 스크립트와 같아야 한다(두 곳에 정의) |
| `src/ui-core/filter.tsx`(방향키 선택 훅) | NOTE | Radix ToggleGroup은 방향키로 포커스만 옮긴다. APG 라디오 묶음처럼 선택도 옮기려고 보탠 훅이며 ThemeToggle도 쓴다 |
| `src/preview/sections/VerificationSection.tsx` | NOTE | 디자인 규칙 점검의 유일한 허용 구역. 금지 클래스는 시연용으로 표시 사이에만 둔다 |
| `src/ui-core/badge.tsx` | NOTE | 예약 상태 → 색 연결은 도메인 계층의 몫. Badge는 `tone`·`className`·`icon`만 안다 |
| `src/ui-core/table.tsx` | NOTE | 레일은 색 값만 받는다. 정렬은 제어형이라 서버 정렬 파라미터에 그대로 연결된다 |
| `src/ui-core/calendar.tsx` | NOTE | react-day-picker 10 API 의존을 이 파일에 가둔다. 일요일 destructive·토요일 primary는 한국 달력 관례 |
| `src/ui-core/date-time-picker.tsx` | NOTE | 시간 표기는 24시간제 `HH:mm`(D4) |
| `src/styles/tokens.contrast.test.ts` | NOTE | 토큰 값의 정본은 system.md §2. 값을 바꿀 때는 system.md를 먼저 고치고 기록값을 갱신 |

### E.6 보고 형식

- 마일스톤 보고는 주장·증거·기준선 귀속·공백·잔여 위험의 다섯 부분으로 쓴다(verification-claim-integrity §3).
- 자체 검증 항목: E1 인수 기준 표(Phase 10의 acceptance.md 기준), E2 빌드, E3 커버리지, E4 경계 grep, E5 린트, E6 커밋 SHA·푸시 상태, E7 blocker, E8 RED 출력(컴포넌트별 첫 실패 출력 원문). 각 항목은 실행한 명령, 출력 원문, HEAD SHA를 함께 적는다.
- 증거 파일은 `.moai/state/verify/<세션>/`(git 제외 경로)에 남긴다.

---

## §F 마일스톤

순서는 의존 관계를 따른다. 다만 기술 위험이 가장 큰 고급 입력(M4)을 위험이 낮은 데이터·탐색(M5)보다 앞에 두어, 구조를 바꿔야 하는 문제를 일찍 드러낸다. 마일스톤마다 미리보기와 전시 목록(`showcase.ts`)에 해당 컴포넌트를 더하므로, 어느 마일스톤이 끝나도 그때까지의 컴포넌트를 라이트·다크로 볼 수 있다. 파일 경로는 §I.3에, 요구사항·인수 기준과의 대응은 §J.1에 있다.

### M1 — 기반: 스캐폴드·제거·토큰·테마·테스트 장치·배포 가드 (우선순위 높음)

- **목표**: 기존 코드를 걷어내고 새 도구 체계(Vite 8, Tailwind 4, TypeScript 5.9.3, Vitest 5, Biome 2.6) 위에 디자인 토큰, 테마 전환, 검증 장치, 배포 중지 가드를 세운다. 이후 모든 마일스톤이 기대는 규약(토큰 이름, `cn` 병합 규칙, 테스트 환경, 규칙 점검 테스트, 공개 내보내기 방식)을 여기서 고정한다.
- **작업**
  1. §C 사전 점검 결과를 기록한다(`.moai/design/system.md` 추적 여부와 PATH `tsc` 포함).
  2. §I.1의 59개 파일을 지우고 §I.2의 9개 파일을 고친다. `node_modules/`와 `package-lock.json`을 지운 뒤 `npm install`로 잠금 파일을 새로 만든다(대상 경로를 명시해 지운다). `package.json` 의존성은 §A.8 표와 정확히 같아야 한다.
  3. RED: `cn.test.ts`, `tokens.contrast.test.ts`, `tokens.sync.test.ts`, `theme-reset.test.ts`, `theme-provider.test.tsx`, `theme-toggle.test.tsx`, `theme-init.test.ts`, `design-rules.test.ts`, `deploy-guard.test.ts`, `dependency-pins.test.ts`, `PreviewPage.test.tsx`를 먼저 쓰고 실패 출력을 남긴다. ThemeToggle의 방향키 선택(Radix 기본이 아님)도 RED부터 본다.
  4. GREEN: `tokens.css`(system.md 값 그대로), `index.css`(§I.5 구성), `contrast.ts`, `cn.ts`, `theme-provider.tsx`, `theme-toggle.tsx`, `index.ts`(이름 지정 내보내기), `index.html`(`lang="ko"`, `<head>` 인라인 스크립트), 테스트 설정, 미리보기 뼈대(건너뛰기 링크, 임시 h1 — M5에서 PageHeader로 바꿈), `showcase.ts`(ThemeProvider·ThemeToggle 항목), 토큰 섹션(색 36 + 상태 15, 글자 크기, 반경, 높이를 라이트·다크로 나란히), `deploy.sh` 가드와 npm 빌드, `biome.json`(`.vscode` 제외).
  5. `moai gate`를 실제로 실행해 어떤 단계가 돌았는지, 어떤 `tsc`를 썼는지 기록한다(AC-UI-001-03).
  6. 배포 중지 가드는 `deploy-guard.test.ts`로만 확인한다. 저장소 작업 트리에서 `ALLOW_PREVIEW_ONLY_DEPLOY=1`로 실행하지 않는다.
- **커밋**: 나눠도 되지만 각 커밋이 게이트를 통과해야 한다. **기존 코드 제거와 첫 테스트는 같은 커밋에 둔다**(테스트 파일이 0개면 `vitest run`이 실패로 끝난다). 배포 중지 가드도 기존 앱을 지우는 커밋에 함께 넣는다.
- **파일**: 새 25, 수정 9, 삭제 59.
- **완료 조건**: E.1 전부 통과. 토큰 동기화 통과, 대비 104쌍과 상태 90개 값 통과. 기본 테마 정리 테스트 통과(E.4 1~4). `moai gate` 실행 단계 기록. 배포 가드 테스트 통과.

### M2 — 기본 동작·피드백·폼 컨트롤 12개 (우선순위 높음)

- **컴포넌트**(의존 순): Button → Field → Input → Textarea → Checkbox → Search → Alert → Badge → Loading → Skeleton → EmptyState → Card.
- **미리보기**: 동작(Button 변형·크기·상태), 피드백(Alert·Badge·Loading·Skeleton·EmptyState, 예약 상태 토큰 시연 — A.7), 폼(Field와 입력 컨트롤, 해요체 오류 문구 예시), 데이터 섹션의 첫 모습(Card 조합 부품 — M5에서 표와 쪽 이동을 더한다). 전시 목록에 12개 컴포넌트의 상태를 더한다.
- **파일**: 새 28(컴포넌트 12 + 테스트 12 + 미리보기 섹션 4: Actions·Feedback·Forms·Data), 수정 3(`index.ts`, `PreviewPage.tsx`, `showcase.ts`).
- **완료 조건**: E.1 전부 통과, 컴포넌트마다 RED 출력과 axe 위반 0, 포커스 클래스와 선택 단서 확인.

### M3 — 선택과 오버레이 6개 (우선순위 높음)

- **컴포넌트**: Select, Filter, Tooltip, Modal, ConfirmDialog(+ `showConfirm`, `ConfirmDialogHost`), Toast(+ `toast`, `Toaster`).
- `src/main.tsx`에 `Toaster`와 `ConfirmDialogHost`를 한 번씩 둔다. REFACTOR 단계에서 ThemeToggle의 방향키 선택 보강을 `filter.tsx`의 내부 훅으로 옮겨 Filter와 함께 쓰고, 같은 단일 선택 항목 스타일을 쓰도록 정리한다.
- **미리보기**: 오버레이 섹션 새로(Modal 크기·작성 중·제출 중, ConfirmDialog 기본·위험·비동기 실패, Toast 네 가지 tone·대기열·동작, Tooltip), 폼 섹션에 Select·Filter 추가.
- **파일**: 새 13, 수정 6(`index.ts`, `PreviewPage.tsx`, `FormsSection.tsx`, `main.tsx`, `theme-toggle.tsx`, `showcase.ts`).
- **완료 조건**: E.1 전부 통과, 토스트·확인 테스트가 가짜 타이머로 결정적으로 끝남.

### M4 — 고급 입력 3개 (우선순위 높음 — 기술 위험이 가장 큼)

- **컴포넌트**: Combobox, Calendar, DateTimePicker.
- **첫 RED 테스트로 결정할 것**: Combobox 구조(A.6-1의 1순위·2순위), react-day-picker 10의 classNames·로캘·수정자 사용법, DateTimePicker의 첫 포커스와 진행 중 날짜 규칙(A.6-10). 구조를 D9 밖으로 바꿔야 하면 멈추고 blocker로 보고한다.
- **미리보기**: 고급 입력 섹션(로컬 거르기, 지연 응답 목업으로 원격 검색, 빈 결과와 "새 고객 등록", 예약 일시 선택, 날짜만 선택).
- **파일**: 새 7(컴포넌트 3 + 테스트 3 + 섹션 1), 수정 3(`index.ts`, `PreviewPage.tsx`, `showcase.ts`).
- **완료 조건**: E.1 전부 통과, E.4 6·7 확인.

### M5 — 데이터 표시와 탐색 6개 (우선순위 중간)

- **컴포넌트**: Table, Tabs, Pagination, Sidebar, Breadcrumb, PageHeader.
- **미리보기**: 데이터 섹션에 목록 패널을 더한다(툴바[Search·Filter] → 표[레일 시연·정렬·오른쪽 정렬 숫자] → 바닥["총 128명" · Pagination], 로딩·빈 상태·오류 상태). 탐색 섹션 새로(사이드바 펼침·접힘, Breadcrumb, 하위 탐색으로 Tabs를 둔 시연용 PageHeader `titleAs="h3"`). 페이지 머리의 임시 h1을 PageHeader(기본 h1)로 바꾼다.
- **파일**: 새 13(컴포넌트 6 + 테스트 6 + 섹션 1: Navigation), 수정 4(`index.ts`, `PreviewPage.tsx`, `DataSection.tsx`, `showcase.ts`).
- **완료 조건**: E.1 전부 통과, 공개 이름 40개 완성(AC-UI-001-09).

### M6 — 미리보기 완성과 디자인 검증 (우선순위 중간)

- **작업**: 검증 섹션 새로(기본 테마 정리 시연 — 허용 구역의 금지 클래스가 아무 스타일도 만들지 않는 모습, 자간 확인, 포커스 윤곽선, `tnum` 판정 장치와 `classifyTnum`), 목차, 미리보기 전체 axe 검사(라이트·다크), 전시 목록 29개 완성, 빌드 결과 CSS 검사(acceptance.md §4.1 QG-07), 커버리지 85% 최종 확인, `moai gate` 실측, E.4 결과 정리(progress.md 기록은 run 단계 소유 에이전트가 한다).
- **파일**: 새 1(`VerificationSection.tsx`), 수정 4(`PreviewPage.tsx`, `PreviewPage.test.tsx`, `design-rules.test.ts`(허용 구역 규칙), `showcase.ts`).
- **완료 조건**: E.1 전부 통과, E.4 1~7의 결과가 모두 기록됨(5번은 판정만 기록하고 대체 글꼴 결정은 SPEC-UI-002로 넘김).

### F.7 합계

| 마일스톤 | 새 파일 | 수정 | 삭제 | 컴포넌트 |
|---|---|---|---|---|
| M1 기반 | 25 | 9 | 59 | ThemeProvider, ThemeToggle(+ `cn`, `index.ts`) |
| M2 기본 | 28 | 3 | 0 | 12 |
| M3 선택·오버레이 | 13 | 6 | 0 | 6 |
| M4 고급 입력 | 7 | 3 | 0 | 3 |
| M5 데이터·탐색 | 13 | 4 | 0 | 6 |
| M6 미리보기·검증 | 1 | 4 | 0 | 0 |
| **합계** | **87** | 기존 파일 9 + 앞 마일스톤에서 만든 파일의 갱신 | **59** | **29** |

- 추정 규모: 추가 약 6,500~8,000행(컴포넌트 약 2,700, 테스트 약 3,400, 미리보기 약 900, 스타일·설정 약 500), 제거 약 2,600행(TS·TSX 2,481행 + CSS·설정) + `bun.lock`.
- Tier L 기준(1,000행 초과 또는 15개 파일 초과)에 해당한다.

---

## §G 안티패턴

- 레퍼런스의 Workspace 화면이나 템플릿 목업 데이터를 옮긴다.
- shadcn/ui Calendar(react-day-picker v9 기준) 예제를 그대로 옮긴다.
- cmdk `Command.Input`의 고정 ARIA를 확인하지 않고 쓴다.
- 토큰 값을 코드에서 먼저 바꾸고 문서를 나중에 맞춘다.
- ui-core에 예약 상태 매핑, 상태 관리 라이브러리, 라우터, API 클라이언트를 넣는다.
- `moai gate` 통과만 보고 `npm run lint`(Biome)를 건너뛴다.
- 기존 코드를 지운 커밋에 테스트가 하나도 없다.
- 테스트에서 실제 타이머를 기다리거나 스냅숏으로 클래스 문자열을 고정한다.
- RED 없이 구현부터 쓴다.
- lucide 정식 이름이 아닌 별칭(`Loader2`, `Trash2`, `Home`, `AlertCircle`, `AlertTriangle`, `CheckCircle`, `…Icon` 접미)을 쓴다.
- 정규식 검사 명령을 표 칸 안에 `\|`로 적는다(복사하면 검사가 언제나 0을 낸다).
- 라이브러리 기본 동작이라고 짐작하고 RED 없이 보강 동작을 구현한다.
- 저장소 작업 트리에서 `ALLOW_PREVIEW_ONLY_DEPLOY=1`로 `deploy.sh`를 실행한다.
- `git add -A`로 무관한 파일까지 커밋한다.
- 하위 에이전트가 사용자에게 직접 묻는다.

---

## §H 교차 참조

- `.moai/specs/SPEC-UI-001/spec.md`(요구사항 `REQ-UI-001-001` ~ `025`), `acceptance.md`(인수 기준 `AC-UI-001-01` ~ `25`, 기대값 표, 경계 사례, 품질 게이트), `design.md`(구현 구조), `spec-compact.md`(run 단계용 요약), `progress.md`(진행 기록)
- `.moai/specs/SPEC-UI-001/research.md` — 조사·검증 기록, 대안 비교(§7)
- `.moai/design/system.md` — 토큰·규칙 정본(§2 토큰, §3 Tailwind 매핑, §8 컴포넌트 규칙, §9 예약 상태, §11 문구, §13 변경 절차)
- `.moai/specs/SPEC-UI-001/design-direction.md` — 결정 근거(§4.2 R1~R16, §5.5 대비 표, §6.3 이름 변환표, §6.5 확인 항목, §12 컴포넌트 규약, §17 D1~D9)
- `.moai/specs/SPEC-UI-001/design-dna.json` — 레퍼런스 원기록(구현 목표 아님)
- `.moai/specs/SPEC-UI-001/reference/my-workspace.zip` — 레퍼런스 보존본
- `.moai/config/sections/quality.yaml`(TDD, 커버리지), `gate.yaml`(게이트 시간 제한), `lsp.yaml`(TypeScript LSP), `git-strategy.yaml`(late-branch)
- `.claude/rules/moai/development/manager-develop-prompt-template.md` — run 단계 위임 형식(Tier L은 A~E 전체)

---

## §I 부록 — 스캐폴드·제거 상세

### I.1 삭제 59개

- `src/` 51개: `git ls-files src`의 53개에서 `src/main.tsx`(재작성)와 `src/vite-env.d.ts`(유지)를 뺀 전부 — `src/App.tsx`, `src/App.css`, `src/index.css`, `src/manager/**`(22개), `src/shared/**`(26개).
- 루트·설정 8개: `tailwind.config.js`, `postcss.config.js`, `eslint.config.js`, `prettier.config.cjs`, `bun.lock`, `tsconfig.app.json`, `tsconfig.node.json`, `public/vite.svg`.
- 추적하지 않는 `node_modules/`는 지우고 다시 설치한다.

### I.2 수정 9개

| 파일 | 바꾸는 내용 |
|---|---|
| `package.json` | 스크립트(§I.4), 의존성(A.8), `engines.node`. 이름·`private`·`type: "module"`·`version`은 그대로 |
| `package-lock.json` | 지우고 다시 생성 |
| `index.html` | `lang="ko"`, 제목 "kmcbeauty 관리자", `vite.svg` 아이콘 제거, `<head>` 안 모듈 스크립트보다 앞에 테마 초기화 인라인 스크립트(§I.5), `src/main.tsx` 진입 |
| `vite.config.ts` | `vitest/config`의 `defineConfig`, 플러그인 `react()`·`tailwindcss()`, 별칭 `@` → `src`, `test`(jsdom, setupFiles, include, 커버리지 대상·임계값). `/api` 프록시는 SPEC-UI-002가 다시 정하므로 뺀다 |
| `tsconfig.json` | 참조형을 단일 설정으로: `target` ES2022, `lib` ES2023·DOM·DOM.Iterable, `module` ESNext, `moduleResolution` bundler, `jsx` react-jsx, `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`, `isolatedModules`, `skipLibCheck`, `noEmit`, `types: ["vite/client"]`, `paths: { "@/*": ["./src/*"] }`(`baseUrl` 없이), `include: ["src", "vite.config.ts"]` |
| `deploy.sh` | ① 15행 `bun run build --mode stage` → `npm run build -- --mode stage`. ② 배포 중지 가드: `.env.stage`를 읽기 전에 `ALLOW_PREVIEW_ONLY_DEPLOY`가 `1`이 아니면 중지 이유(SPEC-UI-002 완료 전까지 미리보기 전용)와 우회 변수 이름을 합니다체로 출력하고 `exit 1`(design.md §13). 가드는 M1 커밋부터 적용되고 SPEC-UI-002가 업무 화면을 되살릴 때 지운다. 다른 줄은 그대로다. 검증은 `src/test/deploy-guard.test.ts` |
| `.gitignore` | `coverage` 한 줄 추가 |
| `.vscode/extensions.json` | `esbenp.prettier-vscode`·`dbaeumer.vscode-eslint`를 `biomejs.biome`으로 바꾸고 `bradlc.vscode-tailwindcss`를 더한다. 나머지 추천 항목과 주석은 그대로 둔다. 주석이 있는 JSONC라 `biome.json`에서 `.vscode`를 검사 대상에서 뺀다(§I.5) |
| `src/main.tsx` | `StrictMode` + `ThemeProvider` + `PreviewPage`(M3부터 `Toaster`·`ConfirmDialogHost`), `./styles/index.css` 가져오기 |

### I.3 새 파일 87개

| 마일스톤 | 경로 |
|---|---|
| M1 (25) | `biome.json`, `src/styles/{tokens.css, index.css, contrast.ts, tokens.contrast.test.ts, tokens.sync.test.ts, theme-reset.test.ts}`, `src/ui-core/{cn.ts, cn.test.ts, theme-provider.tsx, theme-provider.test.tsx, theme-toggle.tsx, theme-toggle.test.tsx, index.ts}`, `src/test/{setup.ts, axe.ts, design-rules.test.ts, theme-init.test.ts, deploy-guard.test.ts, dependency-pins.test.ts}`, `src/preview/{PreviewPage.tsx, PreviewPage.test.tsx, PreviewSection.tsx, showcase.ts}`, `src/preview/sections/TokensSection.tsx` |
| M2 (28) | `src/ui-core/{button, badge, loading, skeleton, empty-state, alert, card, field, input, textarea, checkbox, search}.tsx`와 같은 이름의 `.test.tsx` 12개, `src/preview/sections/{ActionsSection, FeedbackSection, FormsSection, DataSection}.tsx` |
| M3 (13) | `src/ui-core/{select, filter, tooltip, modal, confirm-dialog, toast}.tsx`와 `.test.tsx` 6개, `src/preview/sections/OverlaysSection.tsx` |
| M4 (7) | `src/ui-core/{combobox, calendar, date-time-picker}.tsx`와 `.test.tsx` 3개, `src/preview/sections/AdvancedInputsSection.tsx` |
| M5 (13) | `src/ui-core/{table, tabs, pagination, sidebar, breadcrumb, page-header}.tsx`와 `.test.tsx` 6개, `src/preview/sections/NavigationSection.tsx` |
| M6 (1) | `src/preview/sections/VerificationSection.tsx` |

- 이름 규칙: ui-core는 kebab-case(shadcn/ui 관례), 미리보기 화면 구성 요소는 PascalCase이고, 미리보기의 데이터 모듈은 `showcase.ts`다.
- TS·TSX 파일은 모두 87개다: 새 파일 87개 가운데 TS·TSX가 아닌 `biome.json`·`tokens.css`·`index.css`를 뺀 84개에, 고쳐서 남기는 `src/main.tsx`·`src/vite-env.d.ts`·`vite.config.ts`를 더한 수다.

### I.4 package.json 스크립트

| 스크립트 | 명령 |
|---|---|
| `dev` | `vite` |
| `build` | `tsc --noEmit && vite build` |
| `preview` | `vite preview` |
| `typecheck` | `tsc --noEmit` |
| `lint` | `biome check .` |
| `lint:fix` | `biome check --write .` |
| `format` | `biome format --write .` |
| `test` | `vitest run` |
| `test:watch` | `vitest` |
| `test:coverage` | `vitest run --coverage` |
| `check` | `tsc --noEmit && biome check . && vitest run` |

### I.5 설정 핵심값

- **`biome.json`** — VCS 연동(`useIgnoreFile: true`), 검사 대상에서 `.claude`·`.moai`·`.vscode`(주석이 있는 JSONC)·`dist`·`coverage`·`node_modules` 제외, `css.parser.tailwindDirectives: true`, 서식(공백 2칸, 줄 폭 100, 큰따옴표, 세미콜론 항상, trailing comma 전부, 화살표 함수 괄호 항상), 린터 recommended, import 정리 켜기.
- **`src/styles/index.css` 구성 순서** — `@import "tailwindcss" source("..")` → `@import "@fontsource-variable/noto-sans-kr"` → `@import "./tokens.css"` → `@custom-variant dark (&:where(.dark, .dark *))` → 정리용 `@theme`(`--color-*`·`--radius-*`·`--shadow-*`·`--text-*` = `initial`, 이어서 글꼴·글자 크기(줄높이·자간 하위 값)·폭·애니메이션 값) → 매핑용 `@theme inline`(색 36 + 상태 15, 반경 4, 그림자 2) → `@layer base`(body 글꼴·색·배경, `word-break: keep-all`·`overflow-wrap: break-word`, 기본 테두리 색, 감속 모드 안전망) → 키프레임.
- **`src/styles/tokens.css`** — `:root, .light`(라이트 값 + `color-scheme: light`), `.dark`(다크 값 + `color-scheme: dark`), 테마 무관 `--radius`·`--sidebar-width`·`--sidebar-width-collapsed`. 값은 system.md §2를 그대로 옮긴다. `.light` 선택자는 미리보기에서 라이트와 다크를 나란히 보여 주려고 둔다.
- **`index.html` 테마 스크립트** — `<head>` 안, `type="module"` 스크립트보다 앞에 둔다. 저장 키 `kmc-admin-theme`(값 `light`·`dark`·`system`, 없거나 잘못되면 `system`). `system`이면 `prefers-color-scheme`으로 판정해 `<html>`에 `.dark`를 붙이거나 뗀다. 저장소 접근이 실패하면(사생활 보호 모드 등) 조용히 시스템 값을 쓴다.

---

## §J 부록 — Phase 10 반영 결과, 0.2.0 검토 반영, 추적

- **산출물(작성됨)**: spec.md(필수 frontmatter 12개 + `tier: L`, GEARS 요구사항 25개), acceptance.md(Given-When-Then 25개, 기대값 표, 경계 사례 30개, 품질 게이트 15개), design.md(구현 구조 — 시각 값은 system.md·design-direction.md를 가리킴), spec-compact.md(spec.md에서 기계적으로 뽑은 발췌), progress.md(계획 단계 기록 + §E 뼈대).
- **frontmatter(spec.md에 작성됨)**: `id: SPEC-UI-001`, `title`(A.1 제목), `version: "0.3.1"`, `status: draft`, `created: 2026-10-29`, `updated: 2026-10-30`, `author: antam2010`, `priority: P1`, `phase: "v0.1.0 target"`, `module: "src/ui-core"`, `lifecycle: spec-anchored`, `tags: "ui, design-system, design-tokens, tailwind4, radix, react19"`, `tier: L`.
- **요구사항 구성**: 요구사항 모듈 5개, 요구사항 25개(`REQ-UI-001-001` ~ `REQ-UI-001-025`, 025는 모듈 3), 인수 기준 25개(`AC-UI-001-01` ~ `AC-UI-001-25`) — Tier L 상한(각 25)과 같다. 형식과 대응(모든 요구사항이 인수 기준에 연결됨)은 `moai spec lint`로 확인한다.
- **제외 범위**: §D.2는 spec.md §8을 그대로 옮긴 것이다.
- **열린 질문**: A.2의 두 항목은 결정 지점 1에서 확정됐고 spec.md(제약 C6·C7, REQ-UI-001-004)에 결정으로 적었다. 어느 산출물에도 확인 요청 표시가 남아 있지 않다.
- **0.2.0 검토 반영(2026-10-29)**: plan-auditor 실행 전 세 관점 검토(주요 19건·경미 26건)를 반영했다. 판별력이 없던 검사(표 칸 안의 `grep`, 닫힌 Combobox에서의 IME 검사, 범위 기호만 보던 버전 검사, 출력만 보던 배포 가드 검사, 일부 색만 보던 토큰 검사)를 판별력 있는 테스트로 바꾸고, 공개 인터페이스(A.5)와 키보드 계약(A.6-8)을 완성했으며, REQ-UI-001-025(고대비 모드의 선택 상태 단서)를 더했다. 라이브러리 동작 근거는 research.md §6.14에 있다.
- **0.3.0 감사 반영(2026-10-29)**: plan-auditor 1회차 FAIL(0.83, 기준 0.85)을 반영했다. 막는 결함 D1(REQ-023 Pagination 규칙 ↔ acceptance.md §3.1 표)은 현재 쪽 양옆을 한 쪽으로 고정하고 표를 정본으로 삼아 세 문서를 같은 규칙으로 맞췄고, D2(REQ-020 조건 범위)는 의무마다 조건절을 달았다. 선택 결함 D3~D9·D11·D12도 반영했다(D10은 오케스트레이터가 처리, D13은 할 일 없음).
- **0.3.1 개정(2026-10-30)**: plan-auditor 2회차 PASS(0.88, 기준 0.85, `.moai/reports/plan-audit/SPEC-UI-001-review-2.md`) 뒤 남은 결함을 반영했다. 막는 결함 D14는 Modal 닫기 판정에서 `closeDisabled`를 `dirty`보다 먼저 보게 했다(A.5 `ModalProps`, A.6-4, A.6-8 표, E.3). 선택 결함 D15~D19도 반영했고(A.5 `SkeletonGroupProps`·E.3 Skeleton 행은 D18), E.5에 `mx_plan` 표시를 달고 MX 단계 설명을 바로잡았다.

### J.1 요구사항 → 마일스톤 → 인수 기준

| 요구사항 모듈 | 요구사항 | 마일스톤 | 인수 기준 |
|---|---|---|---|
| 1 기반 교체 | `REQ-UI-001-001` ~ `004` | M1(커밋 게이트는 M1~M6) | `AC-UI-001-01` ~ `04` |
| 2 디자인 토큰과 테마 | `REQ-UI-001-005` ~ `009` | M1(기본 테마 정리의 빌드 결과 확인은 M6) | `AC-UI-001-05` ~ `08` |
| 3 라이브러리 규약·접근성·미리보기 | `REQ-UI-001-010` ~ `014`, `REQ-UI-001-025` | M1(규약·규칙 점검·감속 모드 안전망), M2~M5(컴포넌트별 적용, 감속 모드·선택 단서 포함), M6(미리보기 완성) | `AC-UI-001-09` ~ `14` |
| 4 입력 컴포넌트 | `REQ-UI-001-015` ~ `020` | M2(Button·Field·Input·Textarea·Checkbox·Search), M3(Select·Filter), M4(Combobox·Calendar·DateTimePicker) | `AC-UI-001-15` ~ `21` |
| 5 표시·오버레이·탐색 컴포넌트 | `REQ-UI-001-021` ~ `024` | M2(피드백·Card), M3(Modal·ConfirmDialog·Toast·Tooltip), M5(Table·Tabs·Pagination·Sidebar·Breadcrumb·PageHeader) | `AC-UI-001-22` ~ `25` |

요구사항별 대응은 spec.md §10에 있다.
