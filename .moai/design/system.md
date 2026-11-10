# 디자인 시스템 — kmcbeauty-admin

> **이 문서가 디자인 토큰과 UI 규칙의 정본(SSOT)이다.** 이후 모든 SPEC은 여기를 기준으로 한다.
> 결정 근거, 레퍼런스 분석, 대비 검증 전체 표: [`.moai/specs/SPEC-UI-001/design-direction.md`](../specs/SPEC-UI-001/design-direction.md)
> 레퍼런스 원본 추출 기록: [`.moai/specs/SPEC-UI-001/design-dna.json`](../specs/SPEC-UI-001/design-dna.json)
>
> 버전 1.2.0 · SPEC-UI-002 · 2026-11-10 · 상태: SPEC-UI-002 계획(plan.md §E E-1~E-9) 반영, SPEC-UI-002 구현 전. 화면 문구·상태 표·전환 문구의 정본은 [`.moai/specs/SPEC-UI-002/acceptance.md`](../specs/SPEC-UI-002/acceptance.md) §3이고, 이 문서는 그 글자를 그대로 옮긴다.

## 1. 원칙

1. **차분하고 또렷한 업무 도구** — 장식보다 고객 이름, 시간, 예약 상태가 먼저 보인다. '뷰티' 연출(핑크, 로즈골드, 파스텔)을 하지 않는다.
2. **모든 색은 토큰으로** — 팔레트 클래스(`bg-rose-700`, `text-white`)와 `dark:` 변형을 쓰지 않는다. 테마 차이는 토큰 값에만 둔다.
3. **스타일은 컴포넌트 안에서** — Tailwind 유틸리티로 지정한다. 전역 CSS는 토큰과 기본 계층(body 글꼴·색·배경, 줄바꿈, 기본 테두리 색, 감속 모드 안전망)뿐이다.
4. **색만으로 전달하지 않는다** — 상태는 아이콘 + 라벨(+ 상태 레일), 오류는 아이콘 + 문장.
5. **대비 기준** — 텍스트 4.5:1, UI 경계·포커스·그래픽 3:1을 라이트와 다크 모두에서 지킨다.

## 2. 색 토큰

### 면·중립

| 토큰 | 라이트 | 다크 | 용도 |
|---|---|---|---|
| `background` | `#f7f8fa` | `#11141e` | 페이지 바탕 |
| `foreground` | `#19212e` | `#e9edf7` | 기본 텍스트 |
| `card` | `#ffffff` | `#1a1f2c` | 패널, 사이드바, 상단바, 입력 바탕 |
| `card-foreground` | `#19212e` | `#e9edf7` | 패널 위 텍스트 |
| `popover` | `#ffffff` | `#222838` | 메뉴, 셀렉트 목록, 대화상자, 토스트 |
| `popover-foreground` | `#19212e` | `#e9edf7` | 떠 있는 레이어 위 텍스트 |
| `muted` | `#eef1f5` | `#262d3c` | 중립 채움(스켈레톤, 중립 배지, 읽기 전용 입력) |
| `muted-foreground` | `#5b6779` | `#a3aec0` | 보조 텍스트, placeholder, 표 머리글 |
| `accent` | `#eef1f5` | `#2e3648` | hover 면, 목록 하이라이트 — **브랜드색이 아니다** |
| `accent-foreground` | `#19212e` | `#e9edf7` | hover 면 위 텍스트 |
| `border` | `#e3e7ee` | `#303748` | 패널 테두리, 구분선(장식) |
| `input` | `#808b9d` | `#6b768e` | 입력·셀렉트·체크박스 테두리 |
| `ring` | `#2563eb` | `#60a5fa` | 포커스 표시 |
| `overlay` | `rgb(25 33 46 / 0.5)` | `rgb(0 0 0 / 0.6)` | 대화상자 뒤 스크림 |

### 톤

모든 톤은 같은 슬롯을 갖는다: `{tone}`(채움·그래픽·중립 면 위 텍스트), `{tone}-foreground`(채움 위 텍스트), `{tone}-subtle`(틴트 면), `{tone}-subtle-foreground`(틴트 면 위 텍스트). `primary`와 `destructive`는 `{tone}-hover`를 더 갖는다.

| 토큰 | 라이트 | 다크 |
|---|---|---|
| `primary` | `#2563eb` | `#60a5fa` |
| `primary-foreground` | `#ffffff` | `#11141e` |
| `primary-hover` | `#1d4ed8` | `#93c5fd` |
| `primary-subtle` | `#e9effd` | `#243249` |
| `primary-subtle-foreground` | `#1d4ed8` | `#93c5fd` |
| `info-*` | `primary-*`의 별칭 | `primary-*`의 별칭 |
| `success` | `#047857` | `#34d399` |
| `success-foreground` | `#ffffff` | `#11141e` |
| `success-subtle` | `#e6f2ee` | `#1e383b` |
| `success-subtle-foreground` | `#065f46` | `#6ee7b7` |
| `warning` | `#b45309` | `#fbbf24` |
| `warning-foreground` | `#ffffff` | `#11141e` |
| `warning-subtle` | `#fef3c7` | `#3a352b` |
| `warning-subtle-foreground` | `#92400e` | `#fcd34d` |
| `destructive` | `#bf2846` | `#ff9aaa` |
| `destructive-foreground` | `#ffffff` | `#11141e` |
| `destructive-hover` | `#9f1d3a` | `#ffc2cb` |
| `destructive-subtle` | `#f9eaec` | `#3a303e` |
| `destructive-subtle-foreground` | `#9f1d3a` | `#ffc2cb` |

- 톤의 뜻: `info` 정보 알림, `success` 작업 성공, `warning` 주의(확인이 필요한 상황), `destructive` 오류·되돌릴 수 없는 위험 동작, `neutral`(= `muted` + `muted-foreground`) 강조하지 않는 정보. **예약 상태는 톤이 아니라 아래 '예약 상태' 토큰을 쓴다.**
- 라이트는 진한 채움 + 흰 라벨, 다크는 밝은 채움 + 어두운 라벨(`#11141e`).
- 틴트 값은 고정 HEX다. 실행 중 `color-mix`로 만들지 않는다(검증한 대비를 그대로 쓰기 위해).
- 차트 단일 계열은 `primary`. 여러 계열 팔레트는 필요해지는 SPEC에서 정한다.

### 예약 상태

상태마다 `--status-{상태}-bg`(틴트 면), `-fg`(틴트·패널 위 글자와 아이콘), `-rail`(상태 레일·점). 상태 키 `reserved` `visited` `completed` `cancelled` `no-show`. 색 계열은 네이티브 앱의 예약 목록 배지와 같다(D2). 시맨틱 톤과 섞어 쓰지 않는다.

| 상태 | 라이트 `bg` / `fg` / `rail` | 다크 `bg` / `fg` / `rail` |
|---|---|---|
| 예약됨 (`reserved`) | `#e0e7ff` / `#4338ca` / `#4f46e5` | `#282e49` / `#a5b4fc` / `#818cf8` |
| 방문함 (`visited`) | `#fae8ff` / `#86198f` / `#a21caf` | `#372c49` / `#f0abfc` / `#e879f9` |
| 완료 (`completed`) | `#e0f2fe` / `#075985` / `#0369a1` | `#1e3549` / `#7dd3fc` / `#38bdf8` |
| 취소됨 (`cancelled`) | `#fee2e2` / `#b91c1c` / `#dc2626` | `#392a36` / `#fca5a5` / `#f87171` |
| 노쇼 (`no-show`) | `#fef3c7` / `#92400e` / `#b45309` | `#3a352b` / `#fcd34d` / `#fbbf24` |

- 라이트: 앱의 단색 배지 색(Tailwind 인디고 600, 자홍 700, 하늘 700, 빨강 600, 앰버 700) = 레일, 같은 계열 100 단계 = 틴트, 레일보다 한 단계 진한 색 = 글자. 다크: 400 단계 = 레일, 300 단계 = 글자, 틴트 = 레일 14% + `card`.
- 대비(90개 값 모두 통과): 글자는 자기 틴트·`card`·`popover`·`background` 위 4.5:1 이상, 틴트 위 `foreground`·`muted-foreground`도 4.5:1 이상(최저 4.66:1). 레일은 `card`·`background`·자기 틴트 위 3:1 이상(최저 3.95:1).

### 그림자

| 토큰 | 라이트 | 다크 |
|---|---|---|
| `elevation-raised` | `0 4px 12px -2px rgb(25 33 46 / 0.10), 0 2px 4px -2px rgb(25 33 46 / 0.06)` | `0 4px 12px -2px rgb(0 0 0 / 0.45), 0 2px 4px -2px rgb(0 0 0 / 0.30)` |
| `elevation-overlay` | `0 20px 40px -12px rgb(25 33 46 / 0.20), 0 8px 16px -8px rgb(25 33 46 / 0.10)` | `0 20px 40px -12px rgb(0 0 0 / 0.60), 0 8px 16px -8px rgb(0 0 0 / 0.40)` |

## 3. Tailwind 4 매핑

| 분류 | 정의 | 유틸리티 |
|---|---|---|
| 런타임 변수 | `:root`(라이트)·`.dark`(다크)에 `--{토큰}`. 테마 무관 값: `--radius: 0.75rem`, `--sidebar-width: 15rem`, `--sidebar-width-collapsed: 4rem` | `w-(--sidebar-width)` |
| 색 (`@theme inline`) | `--color-{토큰}: var(--{토큰})` (2절의 색 토큰 전부) | `bg-background` `text-foreground` `bg-card` `bg-popover` `bg-muted` `text-muted-foreground` `bg-accent` `border-border` `border-input` `outline-ring` `bg-primary` `hover:bg-primary-hover` `bg-primary-subtle` `text-primary-subtle-foreground` `bg-overlay` … |
| 예약 상태 색 (`@theme inline`) | `--color-status-{상태}-bg` / `-fg` / `-rail` → 같은 이름의 런타임 변수(15개) | `bg-status-reserved-bg` `text-status-reserved-fg` `border-status-reserved-rail` `bg-status-no-show-rail`(점) |
| 반경 (`@theme inline`) | `--radius-panel: var(--radius)` · `--radius-control: calc(var(--radius) * 2 / 3)` · `--radius-badge: calc(var(--radius) / 2)` · `--radius-chip: calc(var(--radius) / 3)` | `rounded-panel` `rounded-control` `rounded-badge` `rounded-chip` `rounded-full` |
| 그림자 (`@theme inline`) | `--shadow-raised: var(--elevation-raised)` · `--shadow-overlay: var(--elevation-overlay)` | `shadow-raised` `shadow-overlay` |
| 글꼴 (`@theme`) | `--font-sans`, `--font-mono` (4절) | `font-sans` `font-mono` |
| 글자 크기 (`@theme`) | `--text-caption` … `--text-display` + `--line-height`·`--letter-spacing` 하위 값 | `text-caption` `text-body-sm` `text-body` `text-subtitle` `text-title` `text-heading` `text-display` |
| 폭 (`@theme`) | `--container-content: 80rem` · `--container-reading: 45rem` · `--container-dialog-sm/md/lg: 25/35/45rem` | `max-w-content` `max-w-reading` `max-w-dialog-md` … |
| 유지하는 기본값 | `--spacing`(4px), 브레이크포인트(`md` 768, `lg` 1024, `xl` 1280), 굵기, 줄간격, 이징 | |

- **기본 테마 정리** — `@theme`에서 `--color-*`, `--radius-*`, `--shadow-*`, `--text-*` 기본값을 `initial`로 지운다. 하드코딩한 팔레트·반경·그림자·글자 크기 클래스는 아무 스타일도 만들지 않는다. shadcn 소스를 가져올 때의 이름 변환표는 design-direction.md 6.3절.
- **다크 모드** — `<html>`의 `.dark` 클래스, `@custom-variant dark (&:where(.dark, .dark *))`. 설정은 라이트 / 다크 / 시스템(기본값), `localStorage`에 저장, 렌더링 전 인라인 스크립트로 깜빡임 방지, `color-scheme` 지정.
- 런타임 변수와 테마 변수의 이름은 겹치지 않게 한다(`--background` ↔ `--color-background`).
- 불투명도 수정자(`/25` 등)는 장식에만 쓴다. 대비가 걸린 곳에는 토큰 값을 그대로 쓴다.

## 4. 타이포그래피

- `--font-sans`: `"Noto Sans KR Variable", "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif`
- `--font-mono`: `ui-monospace, Consolas, "Noto Sans KR Variable", monospace`

| 유틸리티 | 크기 / 줄높이 | 자간 | 권장 굵기 | 쓰는 곳 |
|---|---|---|---|---|
| `text-caption` | 12 / 18px | 0 | 400, 500 | 표 머리글, 배지, 시각, 이동 경로 |
| `text-body-sm` | 13 / 20px | 0 | 400, 500 | 필드 설명·오류, 작은 버튼, 페이지 설명 |
| `text-body` | 14 / 22px | 0 | 400 (강조 500·600) | 본문, 표 셀, 입력, 버튼, 메뉴, 필드 라벨 |
| `text-subtitle` | 16 / 24px | 0 | 600 | 패널 제목, 빈 상태 제목 |
| `text-title` | 18 / 26px | -0.01em | 600 | 대화상자 제목 |
| `text-heading` | 24 / 32px | -0.02em | 700 | 페이지 제목(h1, 페이지당 하나) |
| `text-display` | 28 / 36px | -0.02em | 700 | 핵심 수치(`tabular-nums`) |

- 굵기는 글자 크기 토큰에 묶지 않고 따로 지정한다. 300 이하 굵기는 쓰지 않는다.
- 최소 12px. 영문 대문자 머리말을 쓰지 않는다. 제목 자간은 -0.02em까지.
- body: `word-break: keep-all`, `overflow-wrap: break-word`. 긴 글(약관·메모)은 14/24px, 최대 폭 `max-w-reading`.
- 시간·금액·전화번호·개수는 `tabular-nums`, 표의 금액·수량은 오른쪽 정렬.
- 숫자 열(표의 금액·수량·소요 시간)은 `tabular-nums` + 오른쪽 정렬로 맞춘다. Noto Sans KR의 `tnum` 지원은 "미검증"으로 기록해 두고, 실제 화면에서 확인하기 전까지 이 기록을 유지한다. 대체 숫자 글꼴은 넣지 않는다(SPEC-UI-002 결정 3, C7).
- 시간은 24시간제 `HH:mm`(D4, 네이티브 앱과 같음).

## 5. 간격과 밀도 (comfortable)

| 항목 | 값 |
|---|---|
| 기본 단위 | 4px |
| 컨트롤 높이 sm / default / lg | 32 / 40 / 48px (`h-8` / `h-10` / `h-12`) |
| 컨트롤 좌우 여백 | 12 / 16 / 20px |
| 아이콘 버튼 | 32 / 40px 정사각 |
| 체크박스 | 20px |
| 배지 | 높이 22px, 좌우 8px |
| 표 | 머리글 높이 40px, 본문 셀 세로 14px·좌우 16px(행 약 50px), 패널 안 첫·마지막 셀 24px |
| 패널 | 안쪽 24px, 제목과 내용 사이 16px |
| 페이지 | 여백 24px(1024px 이상 32px), 섹션 간격 24px, 콘텐츠 최대 폭 1280px |
| 폼 | 필드 간격 20px, 라벨과 컨트롤 8px, 컨트롤과 설명·오류 6px |
| 앱 셸 | 사이드바 240px / 접힘 64px, 상단바 56px |
| 누를 수 있는 영역 | 최소 32×32px. 태블릿 터치에서는 주요 동작에 48px 권장 |

## 6. 반경

`--radius`(12px) 하나에서 비율로 계산한다. 반경을 바꿀 때는 `--radius`만 고친다.

| 유틸리티 | 값 | 쓰는 곳 |
|---|---|---|
| `rounded-panel` | 12px | 패널, 카드, 팝오버, 대화상자, 토스트 |
| `rounded-control` | 8px | 버튼, 입력, 셀렉트, 메뉴 항목, 사이드바 항목, 툴팁, 매장 마크 |
| `rounded-badge` | 6px | 배지 |
| `rounded-chip` | 4px | 체크박스, 개수 칩 |
| `rounded-full` | — | 고객 아바타 |

- 동심 반경: 안쪽 반경 = 바깥 반경 − 패딩(팝오버 12px + `p-1` → 항목 8px).
- 알약형 버튼은 쓰지 않는다.

## 7. 높이와 모션

| 단계 | 대상 | 표현 |
|---|---|---|
| 0 | 페이지 | `background` |
| 1 | 패널, 사이드바, 상단바 | `card` + `border`, 그림자 없음 |
| 2 | 메뉴, 셀렉트 목록, 콤보박스, 날짜 선택, 툴팁 | `popover` + `border` + `shadow-raised` |
| 3 | 대화상자, 토스트 | `popover` + `border` + `shadow-overlay` (+ `bg-overlay` 스크림) |

- 패널 안에 패널을 넣지 않는다.
- 모션: hover 150ms, 팝오버·대화상자 등장 200ms / 퇴장 150ms(`ease-out` / `ease-in`), 300ms 초과 금지, 튀는 움직임 금지.
- 감속 모드(`prefers-reduced-motion: reduce`): 이동·크기 변화 없이 즉시 표시, 스피너는 멈추고 텍스트로 의미 전달, 스켈레톤은 정지. 기본 계층에 전역 안전망(애니메이션·전환 시간 0.01ms, 반복 1회).
- z 순서: 상단바 20, 모바일 서랍 30, 스크림 40, 대화상자·팝오버 50, 토스트 60.

## 8. 컴포넌트 규칙

**구성** — 컴포넌트당 파일 하나, shadcn/ui 소스 소유 방식(Radix + CVA + `cn`), 여러 부분은 조합형. 업무 도메인 지식은 `ui-core`에 넣지 않는다(예: 상태 → tone 매핑은 도메인 계층).

**공통 상태**

| 상태 | 표현 |
|---|---|
| hover | 채움 버튼 `{tone}-hover`, 그 외 `bg-accent` |
| focus-visible | `outline-2 outline-offset-2 outline-ring` (텍스트 입력은 테두리도 `ring`). `outline-none` 금지 |
| disabled | 불투명도 50%, `cursor-not-allowed` |
| loading | 스피너(`LoaderCircle`) + 라벨 유지, `aria-busy` + `aria-disabled`, 포커스 유지 |
| invalid | `aria-invalid="true"` → 테두리·포커스 `destructive` + 아이콘·오류 문장 |
| selected | 메뉴: `bg-primary-subtle text-primary-subtle-foreground font-semibold` / 표 행: `bg-primary-subtle` |

**Button** — 변형 `default` · `outline` · `ghost` · `destructive` · `link`, 크기 `sm` · `default` · `lg` · `icon` · `icon-sm`. `default`는 페이지 머리와 대화상자 바닥마다 하나. 라벨은 구체적 동사. 아이콘 전용 버튼은 `aria-label` 필수. 이동은 `asChild` 링크.

**폼** — Field(라벨 + 컨트롤 + 설명 + 오류, `aria-describedby`·`aria-invalid`·`required`), 필수 표시 `*`. 검증은 blur·제출 시, 제출 실패 시 첫 오류 필드로 포커스. Select 옵션은 `{ value, label, disabled? }`. Combobox는 cmdk 1.1.1을 Radix Popover 1.3.1 안에 렌더링하고(D9), APG 목록 자동완성 패턴(`role="combobox"`, `aria-activedescendant`)을 만족하는지 run 단계에서 확인한다. 원격 검색은 cmdk 자체 필터를 끄고 서버 결과를 그대로 보여 준다. DateTimePicker는 react-day-picker 10.0.2 + date-fns 4.4.0 `ko` 로캘(D9, v10 API는 run 단계에서 확인 — shadcn/ui 예제는 v9 기준), APG 날짜 선택 대화상자 패턴, 일요일 시작, 일요일 `destructive`·토요일 `primary` 숫자, 시간은 `HH:mm` 칸 선택. Input은 앞뒤 부가 표시("원", "분") 자리를 둔다.

**오버레이** — Modal 크기 `sm` 400 / `md` 560 / `lg` 720px, 제목 필수·설명은 있을 때만, 작성 중 닫기 시 확인. ConfirmDialog는 해요체 질문 + 결과 설명 + 구체 동사 버튼, 위험 동작은 처음 포커스를 '취소'에. Toast는 대기열(최대 3개), 오류는 닫을 때까지 유지.

**피드백** — Alert(`{tone}-subtle` 면, 동적 오류에만 `role="alert"`), Badge(tone: neutral·info·success·warning·destructive, 틴트형, 아이콘 12px — 예약 상태 배지는 tone 대신 `status-*` 토큰), Loading(`role="status"`), Skeleton(내용과 같은 모양, 300ms 미만 로딩은 표시 안 함), EmptyState(아이콘 + 제목 + 설명 + 동작 하나).

**데이터 표시** — Table(`Column<T> { id, header, cell, align?, width? }`, 행 전체 `onClick` 금지, 행 동작은 `aria-label`이 있는 아이콘 버튼, 화면 낭독기용 `caption`), Card(그림자 없음, 중첩 금지), Tabs(`{ value, label, content }`, 밑줄형), Pagination(`aria-current="page"`).

**탐색** — Sidebar 항목 `{ to, label, icon }`, 활성 `aria-current="page"`, 접힘 시 툴팁, 768px 미만은 서랍. Topbar는 접기 버튼·이동 경로·날짜·테마 전환·사용자 메뉴(주요 동작은 두지 않는다). Breadcrumb `aria-label="현재 위치"`, 3단계까지.

**새 컴포넌트(SPEC-UI-002)** — 업무 도메인을 모르는 범용 부품이다.

- **DateRangePicker** — Radix Popover 안에 Calendar 범위 모드(`mode: "range"`)를 렌더링한다. 열린 목록은 떠 있는 레이어 2단계(7절)다. 값은 `{ from, to } | null`이고, 앱이 넘기는 프리셋을 둘 수 있다. react-day-picker는 Calendar 밖에서 쓰지 않는다.
- **Calendar 범위 모드** — 시작·끝·사이 날짜를 색만으로 구분하지 않는다. 시작·끝 날짜는 `bg-primary text-primary-foreground` 채움에 `font-semibold`, 사이 날짜는 `bg-primary-subtle text-primary-subtle-foreground` 띠로 그리고, 띠는 시작·끝 칸의 바깥쪽 모서리만 둥글게(`rounded-control`) 해 모양으로도 범위를 알린다. 세 날짜 모두 `aria-selected`를 갖고, 시작·끝 날짜는 접근 이름으로 시작·끝임을 알린다. 채움·띠 위에서는 주말 숫자 색(일요일 `destructive`, 토요일 `primary`) 대신 채움·띠의 글자 토큰을 쓴다.
- **NumberInput** — Input 모양을 그대로 쓰고, 단위("원"·"분")는 Input의 뒤 부가 표시 자리에 둔다. 표시는 천 단위 쉼표와 `tabular-nums`, 숫자 스피너는 두지 않는다. 범위 밖 값은 고치지 않고 `invalid` 상태(공통 상태 표)와 오류 문장으로 알린다.
- **Drawer** — 768px 미만에서 사이드바를 대신하는 왼쪽 시트다. 면과 내용은 펼친 사이드바와 같고(`card`, 바깥쪽 `border`), 뒤에 `bg-overlay` 스크림을 둔다. 등장·퇴장 시간은 7절 모션을 따르며, 감속 모드에서는 이동 없이 즉시 보인다. `role="dialog"`와 제목을 갖는다.
- **Popover** — 트리거 하나와 내용 하나의 단순 구성이다. 떠 있는 레이어 2단계(`popover` + `border` + `shadow-raised`, `rounded-panel`)이고, 쓰는 곳은 사용자 메뉴(10절)다.

키보드 계약(axe 위반 0건은 네 컴포넌트 공통, 정본 acceptance.md §3.10):

| 컴포넌트 | 계약 |
|---|---|
| DateRangePicker | 트리거에서 Enter·Space로 열림 / 화살표 키로 날짜 포커스 이동(Calendar 계약) / Enter로 시작 날짜, 다시 Enter로 끝 날짜를 고르면 `onValueChange`가 `{ from, to }`로 1번 불리고 닫히며 포커스가 트리거로 돌아옴 / Esc는 값을 바꾸지 않고 닫고 포커스를 트리거로 돌림 / 시작·끝·사이 날짜에 색이 아닌 단서(`aria-selected`와 시작·끝을 알리는 접근 이름) |
| NumberInput | `inputMode="numeric"` / 숫자를 치면 천 단위 쉼표가 붙은 표시와 숫자 값 / 붙여넣기는 숫자만 남김 / 가운데 숫자를 지워도 커서가 그 자리에 남음(EC-24) / 위·아래 화살표로 값을 바꾸지 않음(숫자 스피너 없음) / 범위 밖 값은 줄이지 않고 오류로(EC-23) / 라벨과 `aria-invalid`·`aria-describedby` 연결 |
| Drawer | 열리면 포커스가 서랍 안으로 / Tab·Shift+Tab이 서랍 안에서만 돎(포커스 가두기) / Esc와 스크림 누르기로 닫힘 / 닫히면 연 트리거로 포커스가 돌아옴 / `role="dialog"`와 제목 / `prefers-reduced-motion: reduce`에서 이동 애니메이션 클래스가 없음 |
| Popover | 트리거에서 Enter·Space로 열림 / Esc로 닫히고 포커스가 트리거로 돌아옴 / 바깥을 누르면 닫힘 / 트리거에 `aria-expanded`·`aria-controls` |

**접근성 공통** — 키보드로 모두 조작, `<html lang="ko">`, 페이지당 h1 하나, "본문으로 건너뛰기" 링크, 고대비 모드에서 사라지지 않도록 `border`·`outline` 사용.

## 9. 예약 상태 매핑

상태 집합은 백엔드 enum 5종(`kmcbeauty-fastapi/app/enum/treatment_status.py`)이 기준이다(D1). `FINISHED`를 쓰던 기존 관리자 타입은 폐기했다. UI 라벨과 색 계열은 네이티브 앱의 예약 목록과 같다(D2). 상태 표·전환 표·전환 문구는 SPEC-UI-002에서 확정했고, 정본은 acceptance.md §3.1이다. 이 절은 그 글자를 그대로 옮긴다.

**상태 표**(표시 순서 = 순서 열)

| 순서 | 키 | 라벨 | 아이콘(lucide 정식 이름) | 토큰 접두사 | 뜻(툴팁·범례 보조 문구) |
|---|---|---|---|---|---|
| 1 | `RESERVED` | 예약됨 | `CalendarClock` | `status-reserved` | 예약이 잡혀 있어요. |
| 2 | `VISITED` | 방문함 | `DoorOpen` | `status-visited` | 손님이 와서 시술 중이에요. |
| 3 | `COMPLETED` | 완료 | `CircleCheck` | `status-completed` | 시술이 끝났어요. 소요 시간이 지나면 자동으로 바뀌어요. |
| 4 | `CANCELLED` | 취소됨 | `Ban` | `status-cancelled` | 예약이 취소됐어요. |
| 5 | `NO_SHOW` | 노쇼 | `UserX` | `status-no-show` | 손님이 오지 않았어요. |

- 백엔드 라벨은 위 순서대로 예약됨·방문 및 시술 완료·시술 완료·취소됨·노쇼다. 화면에는 위 표의 라벨만 쓴다.
- 색 계열: 예약됨 인디고, 방문함 자홍, 완료 하늘, 취소됨 빨강, 노쇼 앰버. 토큰은 접두사 뒤에 `-bg`·`-fg`·`-rail`을 붙인다(2절 '예약 상태').
- 표시 순서는 위 순서 열이다. 범례, 상태 필터, 미리보기 페이지가 모두 이 순서를 쓴다.
- **아이콘 + 라벨 필수.** 방문함 ↔ 완료(제2색각 이상 근사 ΔE00 라이트 2.6, 다크 0.4)와 다크의 예약됨 ↔ 방문함(제1색각 이상 근사 0.8)은 색만으로 구분되지 않는다. 방문함 아이콘을 `DoorOpen`으로 둔 것도 완료의 체크 아이콘과 모양을 나누기 위해서다.
  - 예외: 캘린더 일정은 아이콘·범례·설명·접근 이름(`"<라벨> · <HH:mm> · <고객 이름>"`)으로 대신한다(결정 15). 자세한 규칙은 아래 '캘린더 일정의 상태 표시'와 14절.
- 예약됨(인디고)과 `primary`(파랑), 취소됨(빨강)과 `destructive`, 노쇼(앰버)와 `warning`은 같거나 가까운 색 계열이다. 예약 상태 배지와 같은 줄·목록에 시맨틱 `destructive`·`warning` 배지를 두지 않는다.
- 표의 선택 행(`primary-subtle`) 위에서는 예약됨 배지 면이 묻힌다(1.07:1). 행 선택을 넣을 때는 체크박스를 함께 둔다.

**캘린더 일정의 상태 표시**(결정 15, 위 "아이콘 + 라벨 필수" 규칙의 예외)

- 일정 칸에는 상태 면·레일·상태별 아이콘·시각·고객 이름만 보인다. 상태 라벨 글자는 일정 칸에 쓰지 않는다.
- 접근 이름: `"<라벨> · <HH:mm> · <고객 이름>"` — 구분자는 공백 + 가운뎃점(U+00B7) + 공백. 예: "예약됨 · 14:30 · 김민지". 직접 입력 고객이면 입력한 이름, 이름이 없으면 "이름 없음".
- 설명(마우스·포커스): 접근 이름과 같은 글.
- 범례: 캘린더 툴바 아래, 일정 영역 위에 5종을 위 순서로 아이콘 + 라벨로 보인다.

**전환 표**(25칸, 행 = 현재, 열 = 바꿀 상태). `same` = 현재 상태라 고를 수 없음(요청 없음), `direct` = 바로 요청, `confirm` = 확인 대화상자 뒤 요청

| 현재 \ 바꿀 | RESERVED | VISITED | COMPLETED | CANCELLED | NO_SHOW |
|---|---|---|---|---|---|
| RESERVED | same | direct | confirm(바꾸기) | direct | direct |
| VISITED | confirm(바꾸기) | same | direct | confirm(바꾸기) | confirm(바꾸기) |
| COMPLETED | confirm(되돌리기) | confirm(되돌리기) | same | confirm(되돌리기) | confirm(되돌리기) |
| CANCELLED | confirm(되돌리기) | confirm(되돌리기) | confirm(되돌리기) | same | confirm(되돌리기) |
| NO_SHOW | confirm(되돌리기) | confirm(되돌리기) | confirm(되돌리기) | confirm(되돌리기) | same |

- 합계: `same` 5, `direct` 4, `confirm` 16.
- **되돌리기**(현재가 끝난 상태 — 완료·취소됨·노쇼): 제목 "‘<현재 라벨>’ 예약을 ‘<바꿀 라벨><조사>’ 되돌릴까요?", 단추 [닫기] [되돌리기]. 예: "‘완료’ 예약을 ‘예약됨’으로 되돌릴까요?"
- **바꾸기**(인터뷰가 정하지 않은 그 밖의 전환 — 바로잡기로 본다): 제목 "‘<현재 라벨>’ 예약을 ‘<바꿀 라벨><조사>’ 바꿀까요?", 단추 [닫기] [바꾸기]. 예: "‘방문함’ 예약을 ‘예약됨’으로 바꿀까요?"
- 조사는 바꿀 라벨에 따라 고정이다: 예약됨으로, 방문함으로, 완료로, 취소됨으로, 노쇼로.

- 매핑 상수와 상태 배지 컴포넌트는 예약 도메인 모듈에 둔다. `ui-core`는 예약 상태를 모른다.
- 근거, 대비 전체 값, 구분성 표: design-direction.md 13절과 5.5절.

## 10. 레이아웃

- **앱 셸** — 사이드바(240 / 64px, `card`) + 상단바(56px, `card`, 위쪽 고정) + 본문(`background`, 여백 24/32px, 최대 폭 1280px). 넓을수록 유리한 화면(캘린더)은 최대 폭을 풀 수 있다.
  - 크기 클래스: 상단바 `h-14`(56px), 사이드바 펼침 `w-(--sidebar-width)`(240px)·접힘 `w-(--sidebar-width-collapsed)`(64px). 값은 3절 런타임 변수에서만 가져온다.
  - 상단바: 왼쪽에 사이드바 접기 버튼(768px 미만에서는 서랍 열기)과 이동 경로, 오른쪽에 오늘 날짜("11월 9일 (월)" 꼴)·테마 전환·사용자 메뉴.
  - 사이드바 머리: 매장 머리글자 표시 + 현재 매장명 + "매장 변경"(→ `/shops`). 메뉴 묶음은 "예약"(예약 캘린더, 시술 이력)과 "관리"(고객, 시술 메뉴)다.
  - 사용자 메뉴: Popover(8절) 안에 이름·역할·이메일, "매장 변경", "로그아웃". 항목이 둘뿐이라 메뉴 역할(roving focus) 컴포넌트를 쓰지 않는다.
- **공개 레이아웃** — 로그인·매장 선택·이용약관·개인정보처리방침·찾을 수 없음(404)은 앱 셸 없이 공개 레이아웃에 그린다. 셸은 현재 매장을 보여 주므로 매장을 고르기 전 화면(매장 선택)도 셸을 쓰지 않는다.
- **PageHeader** — 이동 경로(선택) → 제목 h1 + 배지(선택) …… 보조 동작(outline) · 주요 동작(default, 하나) → 설명(선택, 한 줄) → 하위 탐색(선택). 본문과 24px.
- **목록 페이지** — PageHeader → 목록 패널[툴바(검색·필터 …… 보조 동작) → 표 → 바닥("총 N명" …… 페이지네이션)]. 로딩은 표 모양 스켈레톤, 빈 상태는 EmptyState, 오류는 destructive Alert + 다시 시도. 필터·검색 상태는 URL 쿼리에 반영.
- **대화상자** — 머리(제목 + 설명 + 닫기) → 본문(필드 간격 20px, 짧은 필드만 2열) → 바닥(오른쪽 정렬: [취소] [주요 동작]). 필드가 여덟 개를 넘거나 구역이 여럿이면 전체 페이지 폼 + 고정 동작 막대.
- **반응형** — 1024px 이상 사이드바 펼침, 768~1023px 접힘, 768px 미만 서랍. 가로 스크롤은 표 컨테이너 안에서만.
  - 1024px 이상: 사용자가 고른 접힘 상태를 `localStorage`의 `kmc-admin-sidebar`(`"expanded"`·`"collapsed"`, 기본 펼침)에 저장하고 따른다.
  - 768~1023px: 들어올 때마다 접힌 채 시작하고, 펼치거나 접어도 저장하지 않는다.
  - 768px 미만: 사이드바 대신 Drawer(8절)를 쓰고, 서랍 안 링크로 이동하면 서랍을 닫는다.
  - 저장소 접근 예외는 테마 저장처럼 삼킨다.

## 11. UI 문구 톤

- 문장(토스트, 오류, 빈 상태, 확인 대화상자)은 **해요체**(D3 결정): "예약을 저장했어요.", "이 예약을 취소할까요?"
- 버튼·메뉴·라벨·표 머리글은 어미 없는 명사형: "저장", "예약 추가", "고객 등록".
- 과한 존칭 금지("저장할까요?"), 사용자를 "고객님"으로 부르지 않는다(이 앱에서 '고객'은 매장의 손님).
- 오류는 원인 + 해결 방법, 사용자를 탓하지 않는다.
- '확인'은 결과 없는 안내에만. 취소 동작을 묻는 대화상자의 닫기 버튼은 "닫기"("취소 / 예약 취소" 중복 방지).
- 표기: 날짜 "2026. 10. 29.", 날짜 머리 "10월 29일 (목)", 시간 "14:30"(24시간제 `HH:mm`, D4 결정), 금액 "35,000원", 소요 시간 "60분", 전화 "010-1234-5678".
- 시간대: 화면 표시와 입력은 브라우저 시간대를 쓰고, 한국 시간대(KST) 브라우저를 가정한다. 날짜 필터는 KST 날짜(`YYYY-MM-DD`)로, 보내는 일시는 UTC 오프셋이 있는 ISO 문자열로 보낸다(SPEC-UI-002 plan.md §J R10, research.md 2.7).
- 용어: 고객, 시술, 시술 메뉴, 세부 항목, 노쇼, 목록, 매장. 예약 상태 라벨은 예약됨·방문함·완료·취소됨·노쇼(9절).
- 이용약관·개인정보처리방침은 원문 문체(합니다체) 유지. 느낌표·이모지 금지.

아래 문구의 정본은 acceptance.md §3.2이고, 이 절은 그 글자를 그대로 옮긴다. 백엔드 `detail.detail`을 그대로 보이는 경우는 해요체 규칙의 예외다(C4).

### 문구 결정 순서와 상태 코드별 문구

**문구 결정 순서**: ① 앱 코드 표에 있는 `code`면 앱 문구 → ② 백엔드 봉투의 `detail.detail`이 있으면 그 문구를 그대로(해요체 규칙의 예외, C4) → ③ 상태 코드별 앱 문구. 422는 언제나 ③이다.

| 받은 응답 | `status` | `kind` | `code` | `message` | `hint` | `fieldErrors` | 부수 효과 |
|---|---|---|---|---|---|---|---|
| 404 `{"detail":{"code":"PHONEBOOK_NOT_FOUND","detail":"전화번호부를 찾을 수 없습니다.","hint":"목록을 새로고침해 주세요."}}` | 404 | `http` | `PHONEBOOK_NOT_FOUND` | 전화번호부를 찾을 수 없습니다. | 목록을 새로고침해 주세요. | 없음 | — |
| 404 `{"detail":{"code":"SHOP_NOT_SELECTED","detail":"상점을 먼저 선택해주세요.","hint":null}}` | 404 | `http` | `SHOP_NOT_SELECTED` | 매장을 먼저 골라 주세요. | 없음 | 없음 | 매장 미선택 처리기 1회 |
| 422 `{"detail":[{"loc":["body","phone_number"],"msg":"String should have at most 20 characters","type":"string_too_long"},{"loc":["body","treatment_items",0,"base_price"],"msg":"Input should be greater than or equal to 0","type":"greater_than_equal"}]}` | 422 | `validation` | 없음 | 입력한 값을 확인해 주세요. | 없음 | `{"phone_number": "String should have at most 20 characters", "treatment_items.0.base_price": "Input should be greater than or equal to 0"}` | — |
| 409 `{"detail":{"code":"PHONEBOOK_DUPLICATE","detail":"이미 등록된 전화번호입니다.","hint":null}}` | 409 | `http` | `PHONEBOOK_DUPLICATE` | 이미 등록된 전화번호입니다. | 없음 | 없음 | 폼이 필드 오류로 바꾼다(아래) |
| 409 봉투 없음(`{"error":"x"}`) | 409 | `http` | 없음 | 이미 있는 값이에요. 입력을 확인해 주세요. | 없음 | 없음 | — |
| 400 본문 없음 | 400 | `http` | 없음 | 요청을 처리하지 못했어요. 입력을 확인해 주세요. | 없음 | 없음 | — |
| 401 봉투 없음(재전송 뒤 다시 401) | 401 | `http` | 없음 | 로그인이 필요해요. 다시 로그인해 주세요. | 없음 | 없음 | — |
| 403 본문 없음 | 403 | `http` | 없음 | 이 작업을 할 권한이 없어요. | 없음 | 없음 | — |
| 404 봉투 없음(`{"error":"x"}`) | 404 | `http` | 없음 | 찾는 정보가 없어요. | 없음 | 없음 | — |
| 429 본문 `Too Many Requests`(JSON 아님) | 429 | `http` | 없음 | 요청이 많아요. 잠시 뒤 다시 시도해 주세요. | 없음 | 없음 | — |
| 500 HTML 본문 | 500 | `http` | 없음 | 서버에 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요. | 없음 | 없음 | — |
| 502·503·504 본문 없음 | 그 값 | `http` | 없음 | 서버에 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요. | 없음 | 없음 | — |
| 네트워크 오류(`HttpResponse.error()`) | 0 | `network` | 없음 | 서버에 연결하지 못했어요. 연결을 확인하고 다시 시도해 주세요. | 없음 | 없음 | — |
| 요청 취소(`AbortError`) | 0 | `aborted` | 없음 | (빈 문자열) | 없음 | 없음 | 화면에 알리지 않음 |

- 422 `fieldErrors` 키는 `body`를 뺀 `loc` 조각을 `.`으로 이은 경로다(`body`가 아니면 접두사를 남김 — EC-10). 값은 백엔드 `msg`이고, 폼은 필드별 앱 문구가 있으면 그것으로 보인다(아래 "필드별 앱 문구").
- 앱 코드 표(처음 값): `SHOP_NOT_SELECTED` → "매장을 먼저 골라 주세요." 코드 이름 `PHONEBOOK_*`는 시험 표본이며, run 단계에서 스냅숏·백엔드 코드로 실제 이름을 확인해 표본을 맞춘다.
- **이메일 형식 규칙**: 앞뒤 공백을 자른 값이 정규식 `^[^\s@]+@[^\s@]+\.[^\s@]+$`에 맞으면 형식이 맞다. `abc`는 틀리고 `a@b.co`는 맞다.
- 쿼리·변경의 재시도 횟수는 화면 문구가 아니므로 acceptance.md §3.2의 재시도 규칙을 따른다.

### 필드별 앱 문구

| 필드 | 조건 | 문구 |
|---|---|---|
| 로그인 이메일·비밀번호 | 빈 값 | 이메일을 입력해 주세요. / 비밀번호를 입력해 주세요. |
| 로그인 이메일 | 형식 | 이메일 형식을 확인해 주세요. |
| 고객 전화번호 | 409 | 이미 등록된 전화번호예요. |
| 메뉴 이름 | 409 | 이미 있는 메뉴 이름이에요. |
| 세부 항목 소요 시간·가격 | 1 미만 | 1 이상 입력해 주세요. |
| 예약 항목 가격·소요 시간 | 0 미만, 또는 422 `greater_than_equal` | 0 이상 입력해 주세요. |
| 필수 필드(고객·일시·항목 등) | 빈 값 | <필드 라벨>을(를) 입력해 주세요. — 받침에 따라 "을"·"를"을 고른다(예: "고객을 입력해 주세요.", "일시를 입력해 주세요.") |

### 화면별 문구

| 경우 | 문구 |
|---|---|
| 로그인 401 | 이메일이나 비밀번호가 맞지 않아요. |
| 로그인 429 | 로그인 시도가 많아요. 1분 뒤 다시 시도해 주세요. |
| 네트워크 오류(로그인 포함 공통) | 서버에 연결하지 못했어요. 연결을 확인하고 다시 시도해 주세요. |
| 세션 만료(갱신 401 뒤 로그인 화면) | 로그인이 만료됐어요. 다시 로그인해 주세요. |
| 다른 기기의 매장 변경 | 다른 기기에서 매장이 바뀌었어요. |
| 캘린더 상한 | 일부 예약만 보여요. 기간을 좁혀 주세요. |
| 매장 0개 | 등록된 매장이 없어요. 매장은 kmcbeauty 앱에서 만들 수 있어요. |
| 404 화면 | 찾을 수 없는 페이지예요. |
| 고객 삭제 확인 | 제목 "‘<이름>’ 고객을 삭제할까요?", 단추 [닫기] [삭제] |
| 메뉴 삭제 확인 | 제목 "‘<이름>’ 메뉴를 삭제할까요?", 단추 [닫기] [삭제] |
| 세부 항목 삭제 확인 | 제목 "‘<이름>’ 세부 항목을 삭제할까요?", 단추 [닫기] [삭제] |
| 상태 전환 확인 | §3.1 되돌리기·바꾸기 문구, 단추 [닫기] [되돌리기] 또는 [닫기] [바꾸기] |
| 고객 등록·수정·삭제 성공 | 고객을 등록했어요. / 고객 정보를 고쳤어요. / 고객을 삭제했어요. |
| 메뉴 추가·수정·삭제 성공 | 메뉴를 추가했어요. / 메뉴 이름을 고쳤어요. / 메뉴를 삭제했어요. |
| 세부 항목 추가·수정·삭제 성공 | 세부 항목을 추가했어요. / 세부 항목을 고쳤어요. / 세부 항목을 삭제했어요. |
| 예약 등록·수정·상태 변경 성공 | 예약을 등록했어요. / 예약을 고쳤어요. / 예약 상태를 바꿨어요. |
| CSV 내보내기 실패 | 고객 목록을 내보내지 못했어요. 다시 시도해 주세요. |
| 목록 오류 Alert의 단추 | 다시 시도 |

- 세션 만료 문구 "로그인이 만료됐어요. 다시 로그인해 주세요."의 표시 조건: 이 탭에서 로그인돼 있던 세션이 갱신 401로 끝났을 때만 보인다. 첫 방문(S0)이나 새로고침 때 부트스트랩 쿠키 갱신이 401이면 이 문구 없이 로그인 화면을 보인다(SPEC-UI-002 run 착수 결정, progress.md §A.10).
- "상태 전환 확인" 행의 §3.1은 acceptance.md §3.1이며, 같은 문구가 9절 전환 표 아래에 있다.

## 12. 시그니처 요소와 금지 사항

**시그니처 — 상태 레일.** 예약이 나타나는 모든 곳(캘린더 이벤트, 오늘의 예약 목록, 이력 표의 행, 고객 방문 이력)의 왼쪽 가장자리에 3px 상태 색 띠(`status-{상태}-rail`)를 `border-inline-start`로 그린다. 목록·표에서는 상태 배지와 함께 쓰고, 캘린더 일정은 §9 예외를 따른다. 예약 상태 외의 용도로는 쓰지 않는다. `ui-core`는 레일 색 값을 받는 옵션만 제공하고, 상태 → 레일 색 연결은 도메인 계층이 맡는다. 캘린더 이벤트는 `status-*-bg` 면 + 레일 + 아이콘·시간(`status-*-fg`) + 고객명(`foreground`)이고, FullCalendar에 붙이는 방법은 14절에 둔다.

**금지**

1. '뷰티' 장식 — 핑크·로즈골드·파스텔 그라데이션, 장식 일러스트. 예약 상태 색(자홍 등)을 장식에 가져다 쓰는 것도 금지
2. 템플릿형 대시보드 — 큰 지표 카드·차트로 채운 홈(홈은 예약 캘린더(주간 보기))
3. 카드 남발 — 카드 안 카드, 모든 면의 그림자
4. 투명도 hover(`hover:opacity-*`)와 팔레트·`dark:` 하드코딩
5. 12px 미만 글자, 영문 대문자 머리말, -0.02em보다 좁은 제목 자간
6. 모호한 '확인 / 취소' 버튼 문구

## 13. 변경 절차

1. 토큰이나 규칙을 바꿀 때는 **이 문서를 먼저 고친다.** SPEC 문서의 표는 결정 당시의 기록이므로 고치지 않는다.
2. 색을 바꾸면 design-direction.md 5.5절의 면·톤 54쌍(라이트·다크 각각)과 예약 상태 90개 값을 다시 계산한다. 텍스트 4.5:1, UI 3:1 미만이면 반영하지 않는다. 예약 상태 색을 바꿀 때는 13.2절의 구분성(ΔE00)도 다시 확인한다. SPEC-UI-001 구현 때 이 계산을 테스트로 고정해 두기를 권장한다.
3. 새 톤이나 면이 필요하면 2절의 슬롯 구조(`{tone}`, `-foreground`, `-subtle`, `-subtle-foreground`)를 그대로 따른다. 예약 상태는 `bg`·`fg`·`rail` 구조를 따르고, 네이티브 앱의 색 계열과 맞춘다.
4. 바뀐 내용과 이유를 아래 기록에 한 줄로 남긴다.

| 날짜 | 버전 | 내용 |
|---|---|---|
| 2026-10-29 | 1.0.0 | SPEC-UI-001 디자인 방향에서 최초 작성 |
| 2026-10-29 | 1.1.0 | 사용자 결정 D1~D9 반영: 백엔드 상태 5종, 네이티브 앱과 맞춘 전용 예약 상태 토큰(`status-*`), 방문함 아이콘 `DoorOpen`, 해요체·`HH:mm` 확정, cmdk·react-day-picker·date-fns 채택, D5~D8 기본값 확정 |
| 2026-11-10 | 1.2.0 | SPEC-UI-002 계획(plan.md §E) 반영: 홈을 예약 캘린더(주간 보기)로(12절 금지 2), 예약 상태 표·표시 순서·뜻 문구·25칸 전환 표·되돌리기와 바꾸기 문구 확정과 캘린더 일정 예외(9절), FullCalendar 7 Monarch 테마 변수 대응·일정 모양·포커스 `outline` 덮어쓰기(14절 신설, 12절 시그니처), DateRangePicker·NumberInput·Drawer·Popover 모양과 키보드 계약, Calendar 범위 모드(8절), 공개 레이아웃·셸 크기 클래스·사이드바 저장 규칙·사용자 메뉴(10절), 문구 결정 순서·상태 코드별·필드별·화면별 문구, 이메일 형식 규칙, 세션 만료 문구 표시 조건, 시간대 가정(11절), `tnum` 미검증 기록과 숫자 열 규칙(4절). 토큰 값 변화 없음 |

## 14. 예약 캘린더(FullCalendar 7)

정본 근거: SPEC-UI-002 research.md 4.5(v6의 `:root` `--fc-*` 변수 이름은 v7에 없다 — 모순 8), design.md 9.1, 결정 15.

- **테마** — `@fullcalendar/react` 7의 Monarch 테마를 쓴다. 테마가 읽는 변수 이름(background·foreground·primary·muted·popover 등)이 이 시스템의 토큰과 거의 1:1로 맞는다.
- **가져오기 순서** — `skeleton.css` → Monarch 테마 CSS → 매핑 CSS(`features/reservations/calendar-theme.css`). 정확한 하위 경로 이름은 M7 사전 점검에서 패키지 `exports`로 확인한다.
- **범위** — 캘린더를 `.kmc-calendar` 요소로 감싸고, 매핑 CSS의 선택자는 모두 `.kmc-calendar` 아래에 둔다. Monarch는 `:root` 블록 없이 해시된 클래스에 범위를 묶으므로, 아래 변수는 `.kmc-calendar`에 정의해 물려준다. 매핑 CSS는 `tokens.css`에 있는 토큰 변수(`var(--…)`)만 쓰고 색 값을 직접 적지 않는다(M7 `calendar-theme.test.ts`, QG-06).
- **면** — 캘린더 영역은 패널(7절 1단계) 면 위에 놓이므로 `--fc-monarch-background`를 `card`에 연결한다.

**변수 → 토큰 대응표**(변수 이름은 research.md 4.5에 기록된 것만 쓴다)

| Monarch 변수 | 연결 | 근거 |
|---|---|---|
| `--fc-monarch-background` | `var(--card)` | research.md:388 |
| `--fc-monarch-foreground` | `var(--foreground)` | research.md:388 |
| `--fc-monarch-border` | `var(--border)` | research.md:388 |
| `--fc-monarch-muted` | `var(--muted)` | research.md:388 |
| `--fc-monarch-muted-foreground` | `var(--muted-foreground)` | research.md:388 |
| `--fc-monarch-popover` | `var(--popover)` | research.md:388 |
| `--fc-monarch-popover-foreground` | `var(--popover-foreground)` | research.md:388 |
| `--fc-monarch-primary` | `var(--primary)` | research.md:388 |
| `--fc-monarch-primary-foreground` | `var(--primary-foreground)` | research.md:388 |
| `--fc-monarch-ring-color` | `var(--ring)` | research.md:387(테마가 정의하는 변수를 덮어씀) |
| `--fc-monarch-border-style` | 덮어쓰지 않음 | research.md:387(테마가 정의) |
| `--fc-event-color` | 상태별 일정 클래스에서 `var(--status-{상태}-bg)` | research.md:388 |
| `--fc-event-contrast-color` | 상태별 일정 클래스에서 `var(--status-{상태}-fg)` | research.md:388 |

아래 변수는 이름만 기록돼 있고 테마 안의 역할은 확인하지 않았다. 후보 토큰을 적어 두되, M7 사전 점검에서 실제 이름과 역할을 테마 CSS로 확인한 뒤 연결한다. 역할이 기존 토큰 어디에도 맞지 않으면 새 토큰을 만들지 않고 blocker로 보고한다(13절).

| Monarch 변수(research.md:388) | 후보 | 상태 |
|---|---|---|
| `--fc-monarch-primary-over` · `--fc-monarch-primary-down` | `var(--primary-hover)` | M7 사전 점검에서 실제 이름 확인 |
| `--fc-monarch-faint` · `--fc-monarch-faint-foreground` | `var(--muted)` · `var(--muted-foreground)` | M7 사전 점검에서 실제 이름 확인 |
| `--fc-monarch-highlight` | `var(--accent)` | M7 사전 점검에서 실제 이름 확인 |
| `--fc-monarch-now` | `var(--primary)` | M7 사전 점검에서 실제 이름 확인 |
| `--fc-monarch-outline` | `var(--input)` | M7 사전 점검에서 실제 이름 확인 |
| `--fc-monarch-selected` · `-selected-down` · `-selected-over` · `-selected-foreground` | `var(--primary-subtle)` · `var(--primary-subtle-foreground)` | M7 사전 점검에서 실제 이름 확인 |
| `--fc-monarch-secondary` · `-secondary-down` · `-secondary-over` · `-secondary-foreground` | `var(--accent)` · `var(--accent-foreground)` | M7 사전 점검에서 실제 이름 확인 |
| `--fc-monarch-tertiary` · `-tertiary-down` · `-tertiary-over` · `-tertiary-foreground` | `var(--muted)` · `var(--foreground)` | M7 사전 점검에서 실제 이름 확인 |
| `--fc-monarch-strong` · `-strong-border` · `-strong-foreground` · `-stronger` · `-strongest` | `var(--input)` · `var(--foreground)` | M7 사전 점검에서 실제 이름 확인 |

**일정 모양**

- 면은 `status-{상태}-bg`, 왼쪽 가장자리에 3px 레일(`border-inline-start`, `status-{상태}-rail`). v7은 `.fc-event` 클래스 스타일링을 지원하지 않으므로 이벤트의 `className` 필드로 상태별 클래스를 붙이고, 같은 클래스에서 위 `--fc-event-color`·`--fc-event-contrast-color`를 채운다. 클래스 이름은 예약 도메인 모듈이 정한다.
- 내용은 상태 아이콘(`aria-hidden`) + 시각(`HH:mm`, `tabular-nums`, `status-*-fg`) + 고객 이름(`foreground`)이다. 상태 라벨 글자는 일정 칸에 쓰지 않는다(9절 예외).
- 접근 이름은 `"<라벨> · <HH:mm> · <고객 이름>"`이고, 설명(마우스·포커스)은 ui-core Tooltip으로 같은 글을 보인다(9절 '캘린더 일정의 상태 표시').
- 범례는 캘린더 툴바 아래, 일정 영역 위에 9절 순서로 아이콘 + 라벨 5종을 둔다.
- **포커스** — Monarch는 포커스 링을 `box-shadow`(`--fc-monarch-ring-color`)로 그리는데, 고대비 모드에서는 box-shadow가 사라진다. 매핑 CSS에서 그 `box-shadow`를 끄고 8절 공통 규칙과 같은 `outline`(2px, `outline-offset` 2px, `ring`)으로 덮어쓴다. 덮어쓸 선택자(테마의 포커스 규칙이 붙는 해시 클래스)는 M7 사전 점검에서 실제 이름 확인.
- **툴바** — v7은 `headerToolbar`가 기본으로 꺼져 있으므로 ui-core Button(이전·오늘·다음)·Filter(월·주·일)와 제목으로 직접 만든다. 기본 보기는 주간(`timeGridWeek`), 처음 스크롤 위치는 09:00, 주 시작은 일요일이다.
