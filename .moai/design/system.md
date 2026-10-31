# 디자인 시스템 — kmcbeauty-admin

> **이 문서가 디자인 토큰과 UI 규칙의 정본(SSOT)이다.** 이후 모든 SPEC은 여기를 기준으로 한다.
> 결정 근거, 레퍼런스 분석, 대비 검증 전체 표: [`.moai/specs/SPEC-UI-001/design-direction.md`](../specs/SPEC-UI-001/design-direction.md)
> 레퍼런스 원본 추출 기록: [`.moai/specs/SPEC-UI-001/design-dna.json`](../specs/SPEC-UI-001/design-dna.json)
>
> 버전 1.1.0 · SPEC-UI-001 · 2026-10-29 · 상태: 사용자 결정 D1~D9 반영(design-direction.md 17절), SPEC-UI-001 구현 전. D5~D8은 기본값으로 결정했으며 계획 검토 때 다시 볼 수 있다.

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

**접근성 공통** — 키보드로 모두 조작, `<html lang="ko">`, 페이지당 h1 하나, "본문으로 건너뛰기" 링크, 고대비 모드에서 사라지지 않도록 `border`·`outline` 사용.

## 9. 예약 상태 매핑

상태 집합은 백엔드 enum 5종(`kmcbeauty-fastapi/app/enum/treatment_status.py`)이 기준이다(D1). `FINISHED`를 쓰던 기존 관리자 타입은 폐기했다. UI 라벨과 색 계열은 네이티브 앱의 예약 목록과 같다(D2).

| 상태 | 백엔드 라벨 | UI 라벨 | 토큰 | 아이콘 |
|---|---|---|---|---|
| `RESERVED` | 예약됨 | 예약됨 | `status-reserved-*` (인디고) | `CalendarClock` |
| `VISITED` | 방문 및 시술 완료 | 방문함 | `status-visited-*` (자홍) | `DoorOpen` |
| `COMPLETED` | 시술 완료 | 완료 | `status-completed-*` (하늘) | `CircleCheck` |
| `CANCELLED` | 취소됨 | 취소됨 | `status-cancelled-*` (빨강) | `Ban` |
| `NO_SHOW` | 노쇼 | 노쇼 | `status-no-show-*` (앰버) | `UserX` |

- 방문함과 완료의 업무상 뜻(순서·전환 규칙)과 툴팁·범례 설명 문구는 SPEC-UI-002에서 백엔드와 함께 확정한다. 그 전까지 어느 한쪽 뜻을 전제한 문구를 쓰지 않는다.
- **아이콘 + 라벨 필수.** 방문함 ↔ 완료(제2색각 이상 근사 ΔE00 라이트 2.6, 다크 0.4)와 다크의 예약됨 ↔ 방문함(제1색각 이상 근사 0.8)은 색만으로 구분되지 않는다. 방문함 아이콘을 `DoorOpen`으로 둔 것도 완료의 체크 아이콘과 모양을 나누기 위해서다.
- 예약됨(인디고)과 `primary`(파랑), 취소됨(빨강)과 `destructive`, 노쇼(앰버)와 `warning`은 같거나 가까운 색 계열이다. 예약 상태 배지와 같은 줄·목록에 시맨틱 `destructive`·`warning` 배지를 두지 않는다.
- 표의 선택 행(`primary-subtle`) 위에서는 예약됨 배지 면이 묻힌다(1.07:1). 행 선택을 넣을 때는 체크박스를 함께 둔다.
- 표시 순서는 SPEC-UI-002에서 정한다. 그 전까지 미리보기 페이지는 예약됨 → 방문함 → 완료 → 취소됨 → 노쇼 순을 쓴다.
- 매핑 상수와 상태 배지 컴포넌트는 예약 도메인 모듈에 둔다. `ui-core`는 예약 상태를 모른다.
- 근거, 대비 전체 값, 구분성 표: design-direction.md 13절과 5.5절.

## 10. 레이아웃

- **앱 셸** — 사이드바(240 / 64px, `card`) + 상단바(56px, `card`, 위쪽 고정) + 본문(`background`, 여백 24/32px, 최대 폭 1280px). 넓을수록 유리한 화면(캘린더)은 최대 폭을 풀 수 있다.
- **PageHeader** — 이동 경로(선택) → 제목 h1 + 배지(선택) …… 보조 동작(outline) · 주요 동작(default, 하나) → 설명(선택, 한 줄) → 하위 탐색(선택). 본문과 24px.
- **목록 페이지** — PageHeader → 목록 패널[툴바(검색·필터 …… 보조 동작) → 표 → 바닥("총 N명" …… 페이지네이션)]. 로딩은 표 모양 스켈레톤, 빈 상태는 EmptyState, 오류는 destructive Alert + 다시 시도. 필터·검색 상태는 URL 쿼리에 반영.
- **대화상자** — 머리(제목 + 설명 + 닫기) → 본문(필드 간격 20px, 짧은 필드만 2열) → 바닥(오른쪽 정렬: [취소] [주요 동작]). 필드가 여덟 개를 넘거나 구역이 여럿이면 전체 페이지 폼 + 고정 동작 막대.
- **반응형** — 1024px 이상 사이드바 펼침, 768~1023px 접힘, 768px 미만 서랍. 가로 스크롤은 표 컨테이너 안에서만.

## 11. UI 문구 톤

- 문장(토스트, 오류, 빈 상태, 확인 대화상자)은 **해요체**(D3 결정): "예약을 저장했어요.", "이 예약을 취소할까요?"
- 버튼·메뉴·라벨·표 머리글은 어미 없는 명사형: "저장", "예약 추가", "고객 등록".
- 과한 존칭 금지("저장할까요?"), 사용자를 "고객님"으로 부르지 않는다(이 앱에서 '고객'은 매장의 손님).
- 오류는 원인 + 해결 방법, 사용자를 탓하지 않는다.
- '확인'은 결과 없는 안내에만. 취소 동작을 묻는 대화상자의 닫기 버튼은 "닫기"("취소 / 예약 취소" 중복 방지).
- 표기: 날짜 "2026. 10. 29.", 날짜 머리 "10월 29일 (목)", 시간 "14:30"(24시간제 `HH:mm`, D4 결정), 금액 "35,000원", 소요 시간 "60분", 전화 "010-1234-5678".
- 용어: 고객, 시술, 시술 메뉴, 세부 항목, 노쇼, 목록, 매장. 예약 상태 라벨은 예약됨·방문함·완료·취소됨·노쇼(9절).
- 이용약관·개인정보처리방침은 원문 문체(합니다체) 유지. 느낌표·이모지 금지.

## 12. 시그니처 요소와 금지 사항

**시그니처 — 상태 레일.** 예약이 나타나는 모든 곳(캘린더 이벤트, 오늘의 예약 목록, 이력 표의 행, 고객 방문 이력)의 왼쪽 가장자리에 3px 상태 색 띠(`status-{상태}-rail`)를 `border-inline-start`로 그린다. 항상 상태 배지와 함께 쓰고, 예약 상태 외의 용도로는 쓰지 않는다. `ui-core`는 레일 색 값을 받는 옵션만 제공하고, 상태 → 레일 색 연결은 도메인 계층이 맡는다. 캘린더 이벤트는 `status-*-bg` 면 + 레일 + 아이콘·시간(`status-*-fg`) + 고객명(`foreground`).

**금지**

1. '뷰티' 장식 — 핑크·로즈골드·파스텔 그라데이션, 장식 일러스트. 예약 상태 색(자홍 등)을 장식에 가져다 쓰는 것도 금지
2. 템플릿형 대시보드 — 큰 지표 카드·차트로 채운 홈(홈은 오늘 예약 목록)
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
