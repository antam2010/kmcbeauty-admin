# SPEC-UI-001 디자인 방향

> **문서 역할** — SPEC-UI-001(프로젝트 기반 + 디자인 시스템) 시점의 디자인 결정과 그 근거를 기록한다. 토큰과 UI 규칙의 정본(SSOT)은 [`.moai/design/system.md`](../../design/system.md)이다. 이후 값이 바뀌면 system.md를 고치고, 이 문서는 결정 당시의 근거로 남긴다.
>
> **레퍼런스** — Template Hub export `my-workspace`(보존본: `reference/my-workspace.zip`). 화면 구성은 가져오지 않고 토큰 체계와 컴포넌트 패턴만 채택한다. 레퍼런스를 있는 그대로 추출한 기록은 [`design-dna.json`](./design-dna.json)에 있다.
>
> **사용자 결정** — 강조색 파랑 `#2563eb`, 반경 soft(패널 12px), comfortable 밀도, 사이드바 탐색, 라이트·다크 테마 모두 제공, 한국어 UI.
>
> **범위** — 이 SPEC은 토큰, `src/ui-core` 컴포넌트, 컴포넌트 미리보기 페이지까지다. 실제 업무 화면(로그인, 매장 선택, 예약 캘린더, 고객, 시술 메뉴, 이력, 약관)은 SPEC-UI-002에서 이 문서의 규약으로 다시 만든다.
>
> **결정 반영(2026-10-29)** — 사용자가 D1~D9를 결정했고, 그 결과를 이 문서와 system.md에 반영했다(17절). 예약 상태 색은 네이티브 앱(kmcbeauty-native)의 예약 목록 배지와 같은 색 계열을 쓰는 전용 status 토큰으로 바뀌었다(13절).

---

## 1. 의도

### 누가 쓰는가

뷰티숍 원장과 실장(매니저)이다. 영업시간 중 카운터의 데스크톱이나 태블릿으로 화면을 연다. 시술 사이사이에 잠깐씩 들여다보고, 전화를 받으면서 예약을 잡고, 손님 응대로 작업이 수시로 끊긴다. 화면을 오래 볼 여유가 없고, 끊겼다가 돌아왔을 때 어디까지 했는지 바로 알아볼 수 있어야 한다.

### 무엇을 해야 하는가

1. **오늘 예약을 빠르게 훑는다** — 다음 손님이 누구인지, 각 예약이 지금 어떤 상태인지(예약됨·방문함·완료·취소됨·노쇼), 오지 않은 손님이 있는지를 한눈에 확인한다.
2. **고객과 예약을 빠르게 등록한다** — 통화하면서 고객 검색, 일시 선택, 시술 메뉴 선택을 한 화면에서 끝낸다. 손님 응대로 자리를 비웠다가 실수로 창을 닫아도 입력이 사라지지 않아야 한다.
3. **시술 메뉴와 가격을 정확하게 유지한다** — 메뉴, 세부 항목, 가격, 소요 시간을 틀림없이 관리한다. 숫자는 자릿수를 맞춰 정렬하고 단위를 분명히 적는다.

### 어떤 느낌이어야 하는가

**차분하고 또렷한 업무 도구.** 잘 정리된 종이 예약장부처럼 조용하지만, 필요한 표시는 분명하다. 화면 장식이 앞에 나서지 않고 고객 이름, 시간, 상태가 먼저 보인다. 매장의 브랜드 표현은 매장의 몫이므로 이 도구는 '뷰티'를 연출하지 않는다.

- 지향: 차분함, 또렷함, 신속함
- 지양: 화려함, 파스텔·로즈골드 장식, 보여 주기용 대시보드

---

## 2. 도메인 개념과 용어

### 핵심 개념

| 개념 | 화면에서의 의미 |
|---|---|
| 오늘 | 홈 화면의 기준. 시간순 예약 목록과 지금 처리할 일 |
| 예약장부(시간표) | 날짜·시간 칸 위에 놓인 예약. 캘린더 화면의 본체 |
| 예약 상태 | 백엔드 enum 5종: 예약됨, 방문함, 완료, 취소됨, 노쇼(UI 라벨). 방문함과 완료가 어떤 순서·조건으로 바뀌는지는 SPEC-UI-002에서 백엔드와 함께 확정한다 |
| 고객 카드 | 연락처, 그룹(단골·신규 등), 메모, 방문 이력 |
| 시술 메뉴판 | 메뉴 → 세부 항목 → 가격·소요 시간 |
| 매장 | 로그인 후 고르는 작업 맥락. 모든 화면에서 현재 매장이 보여야 한다 |
| 시술 이력 | 고객별·기간별로 완료된 시술과 금액의 기록 |

### 용어 통일 (UI 표기)

| 쓴다 | 쓰지 않는다 | 이유 |
|---|---|---|
| 고객 | 손님, 회원 | 기존 화면 용어. 사용자(원장·실장)를 '고객님'으로 부르지 않는다 — 이 앱에서 '고객'은 매장의 손님이다 |
| 시술 | 서비스, 트리트먼트 | 업계 용어 |
| 시술 메뉴 · 세부 항목 | 상품, 옵션 | 기존 화면 용어 유지 |
| 노쇼 | 불참 | 업계에서 널리 쓰는 말이고, 백엔드·네이티브 앱의 표기와 같다 |
| 목록 | 리스트 | '고객 리스트' 대신 '고객' 또는 '고객 목록' |
| 매장 | 샵, 지점 | |

---

## 3. 도메인에서 찾은 색

팔레트는 매장 카운터에 실제로 있는 사물에서 근거를 찾았다.

| 장면 | 색 | 시스템에 반영한 방식 |
|---|---|---|
| 종이 예약장부와 파란 볼펜 | 미색 종이, 파란 잉크 | 페이지 바탕 `#f7f8fa`, 강조색 파랑 `#2563eb`. 파랑은 '적어 둔 약속'을 다루는 이 도구 자체의 색이다(예약 상태 색은 따로 둔다) |
| 소독한 시술 도구와 스테인리스 카운터 | 차가운 회색 | 슬레이트 계열 중립 램프(`#ffffff` → `#19212e`) |
| 영업 중 표시등, 대기 번호판 | 앰버 | 주의 알림(`warning`) |
| 장부의 완료 도장, 체크 표시 | 초록 | 성공 알림(`success`) |
| 장부의 빨간 펜 정정 | 진홍 | 오류, 삭제 같은 위험 동작(`destructive`) |
| 사장님 휴대폰의 kmcbeauty 앱 | 인디고, 자홍, 하늘, 빨강, 앰버 | 예약 상태 색. 같은 사람이 앱과 웹을 오가므로 상태 색의 의미가 두 화면에서 같아야 한다(13절) |
| 장부 옆 형광펜과 인덱스 탭 | 상태별 색 띠 | 시그니처 요소 '상태 레일'(15절) |
| 매장 인테리어의 핑크·로즈골드 | 파스텔 핑크 | **장식으로 채택하지 않는다.** 매장 브랜드의 색이고, 위험 톤(진홍)과도 겹친다. 자홍은 '방문함' 상태 색으로만 쓴다 |

---

## 4. 레퍼런스에서 가져오는 것과 고치는 것

### 4.1 그대로 가져오는 것

- **토큰 우선 구조** — CSS 변수 → `@theme inline` 브리지 → 유틸리티. `@custom-variant dark (&:where(.dark, .dark *))`로 `.dark` 클래스 기반 다크 모드를 만든다.
- **중립 팔레트** — `--bg #f7f8fa`, `--panel #ffffff`, `--fg #19212e`, `--line #e3e7ee`와 각각의 다크 값, 위험색 `--danger #bf2846 / #ff9aaa`, 초록 `#047857`.
- **글꼴** — Noto Sans KR Variable 우선.
- **Button 패턴** — shadcn/ui 소스 소유 방식: Radix Slot(`asChild`) + CVA + `cn`(clsx + tailwind-merge), `loading`과 `aria-busy`.
- **치수** — 컨트롤 높이 32/40/48px, 패널 반경 12px, 패널 안쪽 여백 24px, 표 셀 세로 여백 14px(comfortable).
- **깊이 표현** — 면은 테두리로 나누고, 그림자는 떠 있는 레이어(모달·토스트)에만 쓴다.
- **접근성 습관** — Radix Dialog·Tabs·Checkbox, 한국어 `aria-label`("닫기", "페이지 이동"), 건너뛰기 링크, 표 머리글 `scope="col"`, 감속 모드 대응.

### 4.2 고치는 것 (규칙으로 고정)

| # | 레퍼런스의 약점 | 이 시스템의 규칙 |
|---|---|---|
| R1 | 전역 유틸리티 클래스(`.panel` `.stack` `.row` `.badge` `.grid`)와 전역 요소 스타일(`table` `th` `td` `input` `select` `label` `small`)이 섞여 있다 | 모든 스타일은 컴포넌트 안에서 Tailwind 유틸리티로 지정한다. 전역 CSS는 토큰 정의와 기본 계층(body의 글꼴·색·배경, 줄바꿈 규칙, 기본 테두리 색, 감속 모드 안전망)으로 한정한다 |
| R2 | Badge가 한 가지 색이라 상태를 구분하지 못한다 | Badge에 `tone`(neutral·info·success·warning·destructive)을 두고, 예약 상태는 전용 status 토큰과 아이콘으로 칠한다(13절) |
| R3 | Select가 문자열 배열만 받아 저장 값과 표시 이름이 같다 | 옵션은 `{ value, label, disabled? }`. 저장은 키, 화면에는 라벨 |
| R4 | Toast가 메시지 하나만 보여 준다 | 대기열을 둔다. 동시에 최대 3개, 톤별 표시 시간, 오류는 사용자가 닫을 때까지 유지 |
| R5 | Sidebar가 `<button>`과 문자열 배열이라 라우팅·아이콘·활성 상태가 없다 | 항목은 `{ to, label, icon }`. `asChild`로 라우터 링크를 감싸고, 활성 항목은 `aria-current="page"`로 표시한다. 접힘 모드와 툴팁을 지원한다 |
| R6 | Form이 입력 하나짜리 데모다 | Field 패턴: 라벨 + 컨트롤 + 설명 + 오류. `aria-describedby`·`aria-invalid`·`aria-required`를 연결한다 |
| R7 | 강조색 팔레트(`--wt-*`)에 다크 값이 없다. 다크에서 파랑 텍스트는 패널 위 3.18:1, 기본 버튼 라벨(`dark:text-slate-950` on `#2563eb`)은 3.90:1로 기준 미달 | 모든 토큰은 라이트·다크 쌍으로 정의하고 두 테마 모두 대비를 검증한다 |
| R8 | 컴포넌트에 팔레트 색이 하드코딩돼 있다(`bg-rose-700`, `text-white`, `dark:text-slate-950`, `bg-black/50`) | 시맨틱 토큰만 쓴다. Tailwind 기본 팔레트를 테마에서 제거해 하드코딩한 클래스가 아무 스타일도 만들지 못하게 한다(6.3절) |
| R9 | `--radius-lg`를 12px로 덮어써서 Button은 12px, 입력은 8px로 어긋난다 | 반경은 의미 이름(`panel` `control` `badge` `chip`)으로만 쓴다(9절) |
| R10 | `--color-muted`가 텍스트 색(#637083)에 연결돼 `bg-muted`가 텍스트 색으로 칠해질 수 있다 | shadcn 의미를 따른다. `muted`는 면, `muted-foreground`는 텍스트 |
| R11 | Button이 `outline-none` + box-shadow 링으로 포커스를 표시한다. Windows 고대비 모드에서 box-shadow는 사라진다 | 포커스는 `outline`(두께 2px, 간격 2px)으로 표시한다. `outline-none`은 쓰지 않는다 |
| R12 | 8~11px 글자, 영문 대문자 머리말(`WORKSPACE`, `CRM / OVERVIEW`), 제목 자간 -1px | 최소 12px, 한글 라벨, 제목 자간은 -0.02em까지 |
| R13 | Modal에 설명이 없으면 범용 문구("입력 내용을 확인하고 작업을 완료하세요.")를 채운다 | 설명은 있을 때만 렌더링하고, `aria-describedby`도 그때만 연결한다 |
| R14 | 강조색 텍스트를 10% 틴트 위에 올리면 4.49:1로 기준에 못 미친다 | 틴트 면 위 텍스트는 전용 `*-subtle-foreground` 토큰을 쓴다 |
| R15 | `role="alert"`를 정적인 안내에도 쓴다 | 동적으로 나타나는 오류에만 `role="alert"`. 정적 안내는 role 없이, 진행 알림은 `role="status"` |
| R16 | `loading` 중인 버튼이 `disabled`가 되어 키보드 포커스를 잃는다 | 처리 중에는 `aria-disabled` + `aria-busy`로 클릭만 막고 포커스는 유지한다 |

### 4.3 값 조정 내역

| 항목 | 레퍼런스 | 이 시스템 | 근거(측정값) |
|---|---|---|---|
| 보조 텍스트(라이트) | `#637083` | `#5b6779` | 기존 값은 틴트·muted 면 위에서 4.31~4.44:1로 미달. 조정 후 모든 라이트 면에서 4.92:1 이상 |
| 입력 테두리 | `--line #e3e7ee`(패널 대비 1.24:1) | `--input #808b9d` | UI 컴포넌트 경계 3:1 기준. 패널 3.44, 바탕 3.24, muted 3.04:1 |
| 틴트 위 강조 텍스트 | `#2563eb` on 10% 틴트 = 4.49:1 | `#1d4ed8` | 5.82:1 |
| 주의 톤 | `#c2410c`(주황) | 앰버 `#b45309`, 틴트 `#fef3c7` | 주황 10% 틴트(`#f8eee6`)와 위험 틴트(`#f9eaec`)의 대비가 1.02:1로 사실상 같은 색이다 |
| 다크 강조색 | 없음(`#2563eb` 그대로) | `#60a5fa`, 라벨 `#11141e` | 라벨 7.23:1, 패널 위 텍스트 6.47:1 |
| 버튼 반경 | 12px | 8px | 입력(8px)과 통일. 컨트롤 높이(40px) 대비 0.2 |
| 배지 반경 | 5px | 6px | 반경 기준값(12px)의 1/2, 2px 격자 |
| 사이드바 폭 | 190 / 70px | 240 / 64px | 본문 크기(14px)를 키운 한글 메뉴명과 매장명이 들어갈 공간. 4px 격자 |
| 콘텐츠 최대 폭 | 1250 / 1400px | 1280px | Tailwind 80rem과 일치 |
| 페이지 제목 | 26~30px, 자간 -0.8~-1px | 24px, -0.02em | 업무 화면에서 제목이 표·캘린더 공간을 덜 차지하도록 |
| 최소 글자 크기 | 8~11px | 12px | 한글 가독성 |
| UI 문체 | 합니다체와 '-하세요' 혼용 | 해요체로 통일 | 12.9절 |

---

## 5. 색 토큰

### 5.1 토큰 모델

토큰은 **면·중립 토큰**, **톤 토큰**(시맨틱), **예약 상태 토큰**(13절) 세 무리로 나눈다. 톤(`primary` `info` `success` `warning` `destructive`)은 모두 같은 슬롯 구조를 갖는다. 예약 상태 토큰은 시맨틱 톤과 분리한 별도 무리로, 상태마다 `bg`·`fg`·`rail` 세 값을 갖는다. 예약 상태를 시맨틱 톤에 묶지 않는 이유는 상태 색이 네이티브 앱과 맞춰져 있어 의미 체계가 다르기 때문이다(예: 완료는 하늘색, 취소됨은 빨강).

| 슬롯 | 쓰는 곳 | 대비 조건 |
|---|---|---|
| `{tone}` | 채움(버튼·체크박스), 그래픽(레일·점·아이콘), 중립 면 위의 톤 텍스트(링크, 오류 문구) | 중립 면(background·card·popover) 위 텍스트 4.5:1, 그래픽 3:1 |
| `{tone}-foreground` | 채움 위 텍스트·아이콘 | 4.5:1 |
| `{tone}-subtle` | 틴트 면(배지, 알림, 선택된 행, 활성 메뉴) | — |
| `{tone}-subtle-foreground` | 틴트 면 위 텍스트·아이콘 | 4.5:1 |
| `{tone}-hover` | 채움 버튼의 hover (`primary`·`destructive`만) | 그 위 라벨 4.5:1 |

- 라이트는 **진한 채움 + 흰 라벨**, 다크는 **밝은 채움 + 어두운 라벨**(`#11141e`)이다. 레퍼런스의 다크 방식(밝은 강조색 + `slate-950` 라벨)을 따랐다.
- 틴트 값은 레퍼런스의 `color-mix(강조색 10%, 패널)` 방식을 고정 HEX로 바꾼 것이다(다크는 14%). 실행 중 `color-mix`로 계산하지 않고 고정값을 쓰는 이유는 대비를 검증한 값이 그대로 화면에 나가게 하기 위해서다. 주의 톤의 틴트만 예외로 앰버 계열 값을 쓴다(4.3절).
- `info`는 `primary`의 별칭이다. 정보 알림이 브랜드 파랑을 함께 쓴다.
- `accent`는 shadcn 의미 그대로 **hover·하이라이트 면**이다. 브랜드색이 아니다. 브랜드색은 `primary`다. 레퍼런스에서는 `--accent`가 브랜드색이었으므로 이름이 같아도 뜻이 다르다는 점에 주의한다.
- 위험 계열 이름은 shadcn과 같은 `destructive`로 둔다(레퍼런스의 `--danger`). shadcn 컴포넌트를 가져올 때 `aria-invalid:border-destructive` 같은 클래스를 고치지 않아도 된다.
- shadcn의 `secondary`, `sidebar-*`, `chart-*` 토큰은 두지 않는다. 보조 버튼은 `outline`, 사이드바는 `card`·`accent`·`primary-subtle`로 충분하다. 차트는 단일 계열만 `primary`로 그리고, 여러 계열 팔레트는 필요해지는 SPEC에서 정의한다.

### 5.2 면·중립 토큰

| 토큰 | 라이트 | 다크 | 쓰는 곳 | 출처 |
|---|---|---|---|---|
| `background` | `#f7f8fa` | `#11141e` | 페이지 바탕 | 레퍼런스 `--bg` |
| `foreground` | `#19212e` | `#e9edf7` | 기본 텍스트 | 레퍼런스 `--fg` |
| `card` | `#ffffff` | `#1a1f2c` | 패널, 사이드바, 상단바, 입력 바탕 | 레퍼런스 `--panel` |
| `card-foreground` | `#19212e` | `#e9edf7` | 패널 위 텍스트 | `foreground`와 같은 값 |
| `popover` | `#ffffff` | `#222838` | 메뉴, 셀렉트 목록, 대화상자, 토스트 | 신규. 다크는 패널보다 한 단계 밝게 해서 떠 있음을 표현 |
| `popover-foreground` | `#19212e` | `#e9edf7` | 떠 있는 레이어 위 텍스트 | `foreground`와 같은 값 |
| `muted` | `#eef1f5` | `#262d3c` | 중립 채움 면(스켈레톤, 중립 배지, 읽기 전용 입력) | 신규 |
| `muted-foreground` | `#5b6779` | `#a3aec0` | 보조 텍스트, placeholder, 표 머리글 | 라이트 조정(`#637083`에서), 다크는 레퍼런스 |
| `accent` | `#eef1f5` | `#2e3648` | hover 면, 메뉴·목록의 키보드 하이라이트 | 신규. 다크는 popover 위에서도 보이도록 1.22:1 |
| `accent-foreground` | `#19212e` | `#e9edf7` | hover 면 위 텍스트 | `foreground`와 같은 값 |
| `border` | `#e3e7ee` | `#303748` | 패널 테두리, 구분선(장식) | 레퍼런스 `--line` |
| `input` | `#808b9d` | `#6b768e` | 입력·셀렉트·체크박스 테두리(3:1 이상) | 신규 |
| `ring` | `#2563eb` | `#60a5fa` | 포커스 표시 | `primary`와 같은 값 |
| `overlay` | `rgb(25 33 46 / 0.5)` | `rgb(0 0 0 / 0.6)` | 대화상자 뒤 스크림 | 레퍼런스 `bg-black/50` 대체. 라이트는 `foreground` 색 기반 |

### 5.3 톤 토큰

| 토큰 | 라이트 | 다크 | 비고 |
|---|---|---|---|
| `primary` | `#2563eb` | `#60a5fa` | 사용자 선택 파랑 / 다크는 같은 계열의 밝은 단계 |
| `primary-foreground` | `#ffffff` | `#11141e` | |
| `primary-hover` | `#1d4ed8` | `#93c5fd` | |
| `primary-subtle` | `#e9effd` | `#243249` | 라이트 = primary 10% + card, 다크 = 14% + card |
| `primary-subtle-foreground` | `#1d4ed8` | `#93c5fd` | |
| `info` · `info-foreground` · `info-subtle` · `info-subtle-foreground` | `primary` 계열 | `primary` 계열 | 별칭(값을 따로 두지 않음) |
| `success` | `#047857` | `#34d399` | 레퍼런스 `--wt-green` / 다크는 같은 계열 밝은 단계 |
| `success-foreground` | `#ffffff` | `#11141e` | |
| `success-subtle` | `#e6f2ee` | `#1e383b` | 라이트 10%, 다크 14% 혼합 |
| `success-subtle-foreground` | `#065f46` | `#6ee7b7` | |
| `warning` | `#b45309` | `#fbbf24` | 앰버. 레퍼런스 주황(`#c2410c`)에서 조정 |
| `warning-foreground` | `#ffffff` | `#11141e` | |
| `warning-subtle` | `#fef3c7` | `#3a352b` | 라이트는 앰버 100 단계, 다크 14% 혼합 |
| `warning-subtle-foreground` | `#92400e` | `#fcd34d` | |
| `destructive` | `#bf2846` | `#ff9aaa` | 레퍼런스 `--danger` |
| `destructive-foreground` | `#ffffff` | `#11141e` | |
| `destructive-hover` | `#9f1d3a` | `#ffc2cb` | |
| `destructive-subtle` | `#f9eaec` | `#3a303e` | 라이트 10%, 다크 14% 혼합 |
| `destructive-subtle-foreground` | `#9f1d3a` | `#ffc2cb` | |

### 5.4 그림자 토큰

| 토큰 | 라이트 | 다크 | 쓰는 곳 |
|---|---|---|---|
| `elevation-raised` | `0 4px 12px -2px rgb(25 33 46 / 0.10), 0 2px 4px -2px rgb(25 33 46 / 0.06)` | `0 4px 12px -2px rgb(0 0 0 / 0.45), 0 2px 4px -2px rgb(0 0 0 / 0.30)` | 메뉴, 셀렉트 목록, 콤보박스, 날짜 선택 |
| `elevation-overlay` | `0 20px 40px -12px rgb(25 33 46 / 0.20), 0 8px 16px -8px rgb(25 33 46 / 0.10)` | `0 20px 40px -12px rgb(0 0 0 / 0.60), 0 8px 16px -8px rgb(0 0 0 / 0.40)` | 대화상자, 토스트 |

그림자 색은 검정이 아니라 `foreground`(`#19212e`)에서 가져와 푸른 회색 톤을 유지한다.

### 5.5 대비 검증

- **방법** — WCAG 2.x 상대 휘도 공식으로 각 쌍의 대비를 계산했다(python3 스크립트, 2026-10-29 실행). 기준은 일반 텍스트 4.5:1, UI 컴포넌트 경계·포커스 표시·의미 있는 그래픽 3:1이다. 장식용 테두리(`border`)는 기준 적용 대상이 아니므로 값만 기록한다.
- **결과(면·톤 토큰)** — 라이트 52쌍, 다크 52쌍, 합계 104쌍이 모두 기준을 통과했다(실패 0). 조정한 값은 4.3절에 정리했다.
- **결과(예약 상태 토큰, D2 반영 후 재계산)** — 상태 5종 × 테마 2종 × 측정 9종, 합계 90개 값이 모두 기준을 통과했다(실패 0). 아래 두 번째 표.
- **최저값** — 면·톤 텍스트: 라이트 4.86:1(T16, `primary` on `background`), 다크 5.39:1(T11, `muted-foreground` on `accent`). 면·톤 UI: 라이트 3.04:1(U04, `input` on `muted`), 다크 3.03:1(U04). 상태 텍스트: 라이트 4.66:1(예약됨 틴트 위 `muted-foreground`), 다크 5.44:1(노쇼 틴트 위 `muted-foreground`). 상태 레일: 라이트 3.95:1(취소됨 레일 on 취소됨 틴트), 다크 4.46:1(예약됨 레일 on 예약됨 틴트).
- 첫 번째 표의 각 칸은 `전경 / 배경 — 대비`이다.

| ID | 전경 토큰 | 배경 토큰 | 라이트 | 다크 | 기준 | 용도 |
|---|---|---|---|---|---|---|
| T01 | `foreground` | `background` | `#19212e` / `#f7f8fa` — 15.22:1 | `#e9edf7` / `#11141e` — 15.68:1 | 4.5:1 | 본문 / 페이지 배경 |
| T02 | `foreground` | `card` | `#19212e` / `#ffffff` — 16.17:1 | `#e9edf7` / `#1a1f2c` — 14.04:1 | 4.5:1 | 본문 / 패널 |
| T03 | `foreground` | `popover` | `#19212e` / `#ffffff` — 16.17:1 | `#e9edf7` / `#222838` — 12.54:1 | 4.5:1 | 본문 / 팝오버·대화상자 |
| T04 | `foreground` | `muted` | `#19212e` / `#eef1f5` — 14.28:1 | `#e9edf7` / `#262d3c` — 11.77:1 | 4.5:1 | 본문 / muted 면 |
| T05 | `foreground` | `accent` | `#19212e` / `#eef1f5` — 14.28:1 | `#e9edf7` / `#2e3648` — 10.32:1 | 4.5:1 | 본문 / hover 면 |
| T06 | `foreground` | `primary-subtle` | `#19212e` / `#e9effd` — 14.04:1 | `#e9edf7` / `#243249` — 11.01:1 | 4.5:1 | 선택된 행 본문 |
| T07 | `muted-foreground` | `background` | `#5b6779` / `#f7f8fa` — 5.40:1 | `#a3aec0` / `#11141e` — 8.20:1 | 4.5:1 | 보조 텍스트 / 페이지 배경 |
| T08 | `muted-foreground` | `card` | `#5b6779` / `#ffffff` — 5.74:1 | `#a3aec0` / `#1a1f2c` — 7.34:1 | 4.5:1 | 보조 텍스트·placeholder / 패널 |
| T09 | `muted-foreground` | `popover` | `#5b6779` / `#ffffff` — 5.74:1 | `#a3aec0` / `#222838` — 6.56:1 | 4.5:1 | 보조 텍스트 / 팝오버 |
| T10 | `muted-foreground` | `muted` | `#5b6779` / `#eef1f5` — 5.06:1 | `#a3aec0` / `#262d3c` — 6.15:1 | 4.5:1 | 중립 배지 텍스트 |
| T11 | `muted-foreground` | `accent` | `#5b6779` / `#eef1f5` — 5.06:1 | `#a3aec0` / `#2e3648` — 5.39:1 | 4.5:1 | hover 행의 보조 텍스트 |
| T12 | `muted-foreground` | `primary-subtle` | `#5b6779` / `#e9effd` — 4.98:1 | `#a3aec0` / `#243249` — 5.76:1 | 4.5:1 | 선택된 행의 보조 텍스트 |
| T13 | `primary-foreground` | `primary` | `#ffffff` / `#2563eb` — 5.17:1 | `#11141e` / `#60a5fa` — 7.23:1 | 4.5:1 | 기본 버튼 라벨 |
| T14 | `primary-foreground` | `primary-hover` | `#ffffff` / `#1d4ed8` — 6.70:1 | `#11141e` / `#93c5fd` — 10.19:1 | 4.5:1 | 기본 버튼 라벨(hover) |
| T15 | `primary` | `card` | `#2563eb` / `#ffffff` — 5.17:1 | `#60a5fa` / `#1a1f2c` — 6.47:1 | 4.5:1 | 링크·활성 탭 텍스트 / 패널 |
| T16 | `primary` | `background` | `#2563eb` / `#f7f8fa` — 4.86:1 | `#60a5fa` / `#11141e` — 7.23:1 | 4.5:1 | 링크 / 페이지 배경 |
| T17 | `primary` | `popover` | `#2563eb` / `#ffffff` — 5.17:1 | `#60a5fa` / `#222838` — 5.78:1 | 4.5:1 | 링크 / 팝오버 |
| T18 | `primary-subtle-foreground` | `primary-subtle` | `#1d4ed8` / `#e9effd` — 5.82:1 | `#93c5fd` / `#243249` — 7.16:1 | 4.5:1 | info 배지·활성 메뉴·info 알림 |
| T19 | `destructive-foreground` | `destructive` | `#ffffff` / `#bf2846` — 5.82:1 | `#11141e` / `#ff9aaa` — 9.15:1 | 4.5:1 | 위험 버튼 라벨 |
| T20 | `destructive-foreground` | `destructive-hover` | `#ffffff` / `#9f1d3a` — 7.75:1 | `#11141e` / `#ffc2cb` — 12.10:1 | 4.5:1 | 위험 버튼 라벨(hover) |
| T21 | `destructive` | `card` | `#bf2846` / `#ffffff` — 5.82:1 | `#ff9aaa` / `#1a1f2c` — 8.19:1 | 4.5:1 | 오류 메시지 / 패널 |
| T22 | `destructive` | `background` | `#bf2846` / `#f7f8fa` — 5.48:1 | `#ff9aaa` / `#11141e` — 9.15:1 | 4.5:1 | 오류 메시지 / 페이지 배경 |
| T23 | `destructive` | `popover` | `#bf2846` / `#ffffff` — 5.82:1 | `#ff9aaa` / `#222838` — 7.32:1 | 4.5:1 | 오류 메시지 / 대화상자 |
| T24 | `destructive-subtle-foreground` | `destructive-subtle` | `#9f1d3a` / `#f9eaec` — 6.64:1 | `#ffc2cb` / `#3a303e` — 8.27:1 | 4.5:1 | destructive 배지·위험 알림 |
| T25 | `success-foreground` | `success` | `#ffffff` / `#047857` — 5.48:1 | `#11141e` / `#34d399` — 9.56:1 | 4.5:1 | 성공 채움 라벨 |
| T26 | `success` | `card` | `#047857` / `#ffffff` — 5.48:1 | `#34d399` / `#1a1f2c` — 8.56:1 | 4.5:1 | 성공 텍스트 / 패널 |
| T27 | `success-subtle-foreground` | `success-subtle` | `#065f46` / `#e6f2ee` — 6.70:1 | `#6ee7b7` / `#1e383b` — 8.18:1 | 4.5:1 | success 배지·성공 알림 |
| T28 | `warning-foreground` | `warning` | `#ffffff` / `#b45309` — 5.02:1 | `#11141e` / `#fbbf24` — 11.01:1 | 4.5:1 | 주의 채움 라벨 |
| T29 | `warning` | `card` | `#b45309` / `#ffffff` — 5.02:1 | `#fbbf24` / `#1a1f2c` — 9.86:1 | 4.5:1 | 주의 텍스트 / 패널 |
| T30 | `warning-subtle-foreground` | `warning-subtle` | `#92400e` / `#fef3c7` — 6.37:1 | `#fcd34d` / `#3a352b` — 8.45:1 | 4.5:1 | warning 배지·주의 알림 |
| T31 | `foreground` | `success-subtle` | `#19212e` / `#e6f2ee` — 14.10:1 | `#e9edf7` / `#1e383b` — 10.64:1 | 4.5:1 | 성공 알림 본문 |
| T32 | `foreground` | `warning-subtle` | `#19212e` / `#fef3c7` — 14.53:1 | `#e9edf7` / `#3a352b` — 10.40:1 | 4.5:1 | 주의 알림 본문 |
| T33 | `foreground` | `destructive-subtle` | `#19212e` / `#f9eaec` — 13.87:1 | `#e9edf7` / `#3a303e` — 10.72:1 | 4.5:1 | 위험 알림 본문 |
| T34 | `muted-foreground` | `success-subtle` | `#5b6779` / `#e6f2ee` — 5.00:1 | `#a3aec0` / `#1e383b` — 5.57:1 | 4.5:1 | 성공 알림 보조 텍스트 |
| T35 | `muted-foreground` | `warning-subtle` | `#5b6779` / `#fef3c7` — 5.15:1 | `#a3aec0` / `#3a352b` — 5.44:1 | 4.5:1 | 주의 알림 보조 텍스트 |
| T36 | `muted-foreground` | `destructive-subtle` | `#5b6779` / `#f9eaec` — 4.92:1 | `#a3aec0` / `#3a303e` — 5.60:1 | 4.5:1 | 위험 알림 보조 텍스트 |
| U01 | `input` | `card` | `#808b9d` / `#ffffff` — 3.44:1 | `#6b768e` / `#1a1f2c` — 3.61:1 | 3.0:1 | 입력·체크박스 테두리 / 패널 |
| U02 | `input` | `background` | `#808b9d` / `#f7f8fa` — 3.24:1 | `#6b768e` / `#11141e` — 4.03:1 | 3.0:1 | 입력 테두리 / 페이지 배경 |
| U03 | `input` | `popover` | `#808b9d` / `#ffffff` — 3.44:1 | `#6b768e` / `#222838` — 3.22:1 | 3.0:1 | 입력 테두리 / 대화상자 |
| U04 | `input` | `muted` | `#808b9d` / `#eef1f5` — 3.04:1 | `#6b768e` / `#262d3c` — 3.03:1 | 3.0:1 | 입력 테두리 / muted 면 |
| U05 | `ring` | `card` | `#2563eb` / `#ffffff` — 5.17:1 | `#60a5fa` / `#1a1f2c` — 6.47:1 | 3.0:1 | 포커스 링 / 패널 |
| U06 | `ring` | `background` | `#2563eb` / `#f7f8fa` — 4.86:1 | `#60a5fa` / `#11141e` — 7.23:1 | 3.0:1 | 포커스 링 / 페이지 배경 |
| U07 | `ring` | `popover` | `#2563eb` / `#ffffff` — 5.17:1 | `#60a5fa` / `#222838` — 5.78:1 | 3.0:1 | 포커스 링 / 대화상자 |
| U08 | `ring` | `primary-subtle` | `#2563eb` / `#e9effd` — 4.49:1 | `#60a5fa` / `#243249` — 5.08:1 | 3.0:1 | 포커스 링 / 활성 메뉴 |
| U09 | `primary` | `card` | `#2563eb` / `#ffffff` — 5.17:1 | `#60a5fa` / `#1a1f2c` — 6.47:1 | 3.0:1 | 체크된 체크박스·주색 그래픽 |
| U10 | `primary-foreground` | `primary` | `#ffffff` / `#2563eb` — 5.17:1 | `#11141e` / `#60a5fa` — 7.23:1 | 3.0:1 | 체크 표시 / 체크박스 채움 |
| U11 | `warning` | `card` | `#b45309` / `#ffffff` — 5.02:1 | `#fbbf24` / `#1a1f2c` — 9.86:1 | 3.0:1 | 주의 아이콘·그래픽 / 패널 |
| U12 | `success` | `card` | `#047857` / `#ffffff` — 5.48:1 | `#34d399` / `#1a1f2c` — 8.56:1 | 3.0:1 | 성공 아이콘·그래픽 / 패널 |
| U13 | `muted-foreground` | `card` | `#5b6779` / `#ffffff` — 5.74:1 | `#a3aec0` / `#1a1f2c` — 7.34:1 | 3.0:1 | 중립 점·아이콘 / 패널 |
| U14 | `destructive` | `card` | `#bf2846` / `#ffffff` — 5.82:1 | `#ff9aaa` / `#1a1f2c` — 8.19:1 | 3.0:1 | 위험 아이콘·그래픽 / 패널 |
| U15 | `warning` | `background` | `#b45309` / `#f7f8fa` — 4.73:1 | `#fbbf24` / `#11141e` — 11.01:1 | 3.0:1 | 주의 그래픽 / 페이지 배경 |
| U16 | `success` | `background` | `#047857` / `#f7f8fa` — 5.16:1 | `#34d399` / `#11141e` — 9.56:1 | 3.0:1 | 성공 그래픽 / 페이지 배경 |
| D01 | `border` | `card` | `#e3e7ee` / `#ffffff` — 1.24:1 | `#303748` / `#1a1f2c` — 1.38:1 | 장식(기준 없음) | 패널 테두리·구분선(장식) |
| D02 | `border` | `background` | `#e3e7ee` / `#f7f8fa` — 1.17:1 | `#303748` / `#11141e` — 1.55:1 | 장식(기준 없음) | 패널 외곽(장식) |

**예약 상태 토큰** — 각 칸은 대비 값(`:1` 생략)이다. 텍스트 열(`fg/*`, `foreground/bg`, `muted-fg/bg`)의 기준은 4.5:1, 레일 열(`rail/*`)의 기준은 3:1이다. 아이콘은 `fg` 색을 쓰므로 `fg/card`·`fg/background` 값이 아이콘의 3:1 기준도 함께 보여 준다.

| 상태 | 테마 | `bg` / `fg` / `rail` | fg/bg | fg/card | fg/popover | fg/background | foreground/bg | muted-fg/bg | rail/card | rail/background | rail/bg |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 예약됨 | 라이트 | `#e0e7ff` / `#4338ca` / `#4f46e5` | 6.41 | 7.90 | 7.90 | 7.44 | 13.13 | 4.66 | 6.29 | 5.92 | 5.10 |
| 방문함 | 라이트 | `#fae8ff` / `#86198f` / `#a21caf` | 7.08 | 8.24 | 8.24 | 7.75 | 13.90 | 4.93 | 6.32 | 5.95 | 5.43 |
| 완료 | 라이트 | `#e0f2fe` / `#075985` / `#0369a1` | 6.59 | 7.56 | 7.56 | 7.12 | 14.10 | 5.00 | 5.93 | 5.58 | 5.17 |
| 취소됨 | 라이트 | `#fee2e2` / `#b91c1c` / `#dc2626` | 5.30 | 6.47 | 6.47 | 6.09 | 13.24 | 4.70 | 4.83 | 4.54 | 3.95 |
| 노쇼 | 라이트 | `#fef3c7` / `#92400e` / `#b45309` | 6.37 | 7.09 | 7.09 | 6.67 | 14.53 | 5.15 | 5.02 | 4.73 | 4.51 |
| 예약됨 | 다크 | `#282e49` / `#a5b4fc` / `#818cf8` | 6.68 | 8.25 | 7.37 | 9.22 | 11.36 | 5.94 | 5.52 | 6.16 | 4.46 |
| 방문함 | 다크 | `#372c49` / `#f0abfc` / `#e879f9` | 7.37 | 9.35 | 8.35 | 10.45 | 11.07 | 5.79 | 6.69 | 7.47 | 5.27 |
| 완료 | 다크 | `#1e3549` / `#7dd3fc` / `#38bdf8` | 7.58 | 9.87 | 8.82 | 11.02 | 10.79 | 5.64 | 7.68 | 8.58 | 5.90 |
| 취소됨 | 다크 | `#392a36` / `#fca5a5` / `#f87171` | 7.10 | 8.67 | 7.74 | 9.68 | 11.50 | 6.01 | 5.95 | 6.64 | 4.87 |
| 노쇼 | 다크 | `#3a352b` / `#fcd34d` / `#fbbf24` | 8.45 | 11.41 | 10.19 | 12.75 | 10.40 | 5.44 | 9.86 | 11.01 | 7.30 |

---

## 6. Tailwind 4 매핑

### 6.1 런타임 CSS 변수

`:root`(라이트)와 `.dark`(다크)에 5절과 13절의 토큰을 `--{토큰}` 이름으로 정의한다. 예: `--background`, `--primary-subtle-foreground`, `--status-reserved-bg`, `--elevation-raised`, `--overlay`. `info` 계열은 `--info: var(--primary)`처럼 별칭으로 둔다.

테마와 무관한 런타임 변수는 `:root`에만 둔다.

| 변수 | 값 | 쓰는 곳 |
|---|---|---|
| `--radius` | `0.75rem` (12px) | 반경 기준값. 9절의 반경은 모두 이 값에서 계산한다 |
| `--sidebar-width` | `15rem` (240px) | 펼친 사이드바 |
| `--sidebar-width-collapsed` | `4rem` (64px) | 접은 사이드바 |

### 6.2 `@theme` 이름과 유틸리티

| 분류 | 테마 변수 → 값 | 유틸리티 |
|---|---|---|
| 색 (`@theme inline`) | `--color-{토큰}: var(--{토큰})`. 5.2·5.3절의 색 토큰 36개 전부 | `bg-background` `text-foreground` `bg-card` `bg-popover` `bg-muted` `text-muted-foreground` `bg-accent` `border-border` `border-input` `outline-ring` `bg-primary` `text-primary-foreground` `hover:bg-primary-hover` `bg-primary-subtle` `text-primary-subtle-foreground` `bg-info-subtle` `bg-success-subtle` `text-warning-subtle-foreground` `bg-destructive` `bg-overlay` 등 |
| 예약 상태 색 (`@theme inline`) | `--color-status-{상태}-bg` / `-fg` / `-rail` → 같은 이름의 런타임 변수. 상태 키는 `reserved` `visited` `completed` `cancelled` `no-show`(토큰 15개, 13절) | `bg-status-reserved-bg` `text-status-reserved-fg` `border-status-reserved-rail` `bg-status-no-show-rail`(점) |
| 반경 (`@theme inline`) | `--radius-panel: var(--radius)` · `--radius-control: calc(var(--radius) * 2 / 3)` · `--radius-badge: calc(var(--radius) / 2)` · `--radius-chip: calc(var(--radius) / 3)` | `rounded-panel` `rounded-control` `rounded-badge` `rounded-chip` (+ 정적 `rounded-full`) |
| 그림자 (`@theme inline`) | `--shadow-raised: var(--elevation-raised)` · `--shadow-overlay: var(--elevation-overlay)` | `shadow-raised` `shadow-overlay` |
| 글꼴 (`@theme`) | `--font-sans`, `--font-mono` (7.1절) | `font-sans` `font-mono` |
| 글자 크기 (`@theme`) | `--text-caption` … `--text-display`, 각각 `--line-height`·`--letter-spacing` 하위 값 포함(7.2절) | `text-caption` `text-body-sm` `text-body` `text-subtitle` `text-title` `text-heading` `text-display` |
| 폭 (`@theme`) | `--container-content: 80rem` · `--container-reading: 45rem` · `--container-dialog-sm: 25rem` · `--container-dialog-md: 35rem` · `--container-dialog-lg: 45rem` | `max-w-content` `max-w-reading` `max-w-dialog-sm` `max-w-dialog-md` `max-w-dialog-lg` |
| 유지하는 기본값 | `--spacing`(4px), 브레이크포인트(`md` 768 · `lg` 1024 · `xl` 1280), 굵기(`font-medium` 등), 줄간격(`leading-*`), 이징(`ease-out` `ease-in`) | |

- 런타임 변수와 테마 변수의 이름은 겹치지 않게 한다(`--background` ↔ `--color-background`, `--elevation-raised` ↔ `--shadow-raised`). 같은 이름을 쓰면 자기 자신을 참조하게 된다.
- 불투명도 수정자(`border-success/25` 등)는 장식(알림 테두리, 구분선)에만 쓴다. 텍스트나 텍스트 뒤 면처럼 대비가 걸린 곳에는 검증한 토큰 값을 그대로 쓴다.

### 6.3 기본 테마 정리

`@theme`에서 Tailwind 기본값 중 `--color-*`, `--radius-*`, `--shadow-*`, `--text-*` 네임스페이스를 `initial`로 지운 뒤 5~9절의 이름만 다시 정의한다.

- **효과** — `bg-rose-700`, `text-white`, `rounded-lg`, `shadow-xl`, `text-sm` 같은 클래스가 아무 스타일도 만들지 않는다. 토큰 밖의 값은 화면에서 바로 드러나고, R8·R9 위반이 구조적으로 막힌다.
- **shadcn 소스를 가져올 때 바꿀 이름**

| shadcn 기본 | 이 시스템 |
|---|---|
| `rounded-md`, `rounded-lg` | `rounded-control` |
| `rounded-xl` | `rounded-panel` |
| `rounded-sm`, `rounded`(체크박스) | `rounded-chip` |
| `shadow-xs`, `shadow-sm` | 지운다(면은 테두리만) |
| `shadow-md`, `shadow-lg` | `shadow-raised` |
| `shadow-xl`, `shadow-2xl` | `shadow-overlay` |
| `text-xs` / `text-sm` / `text-base` / `text-lg` / `text-2xl` | `text-caption` / `text-body` / `text-subtitle` / `text-title` / `text-heading` |
| `bg-black/50` | `bg-overlay` |
| `text-white` | `text-{tone}-foreground` |
| `bg-secondary` | `bg-muted` (버튼이면 `outline` 변형) |
| `outline-none` | `outline-hidden` (Tailwind 4에서 고대비 모드의 윤곽선을 남기는 쪽) |

### 6.4 다크 모드

- `<html>`의 `.dark` 클래스로 전환한다. `@custom-variant dark (&:where(.dark, .dark *))`는 레퍼런스와 같다.
- 테마 설정은 라이트 / 다크 / 시스템 세 가지이고 기본값은 **시스템**이다. 설정은 `localStorage`에 저장하고, 시스템 모드에서는 `prefers-color-scheme` 변화를 따라간다.
- 첫 화면 깜빡임을 막기 위해 `index.html`에서 렌더링 전에 클래스를 적용하는 짧은 인라인 스크립트를 둔다.
- `color-scheme`을 `:root`(light)와 `.dark`(dark)에 지정해 스크롤바와 네이티브 컨트롤도 테마를 따르게 한다.
- **컴포넌트는 `dark:` 변형을 쓰지 않는다.** 테마 차이는 토큰 값에만 둔다. 토큰으로 표현할 수 없는 예외가 생기면 토큰을 추가하는 쪽을 먼저 검토한다.

### 6.5 구현 단계에서 확인할 항목 (이 문서 작성 시 미검증)

이 문서를 쓰는 동안 패키지를 설치하지 않았으므로 아래 동작은 확인하지 못했다. SPEC-UI-001 구현 때 미리보기 페이지에서 확인한다. 기본 테마 정리(6.3절)는 D8에서 적용하기로 결정했으므로 1·2번은 적용 전제를 확인하는 항목이다.

1. `@theme inline` 블록 안에서 `--color-*: initial`을 함께 써도 되는지, 별도 `@theme` 블록이 필요한지
2. 네임스페이스를 지운 뒤에도 `rounded-full`, `rounded-none`, `bg-transparent`, `bg-current`, `shadow-none`이 정적 유틸리티로 남는지
3. `--text-*--letter-spacing` 하위 값이 `text-*` 유틸리티에 함께 적용되는지
4. `outline-hidden`이 Windows 고대비(forced-colors) 모드에서 윤곽선을 남기는지
5. Noto Sans KR Variable이 `tnum`(고정폭 숫자) 기능을 지원하는지(7.3절)
6. react-day-picker 10.0.2의 API — shadcn/ui 예제는 v9 기준이므로 v10에서 바뀐 부분(구성 요소 이름, 스타일 지정 방식, 로캘·주 시작 요일 지정)을 run 단계에서 확인한다
7. cmdk 1.1.1을 Radix Popover 1.3.1 안에 넣었을 때 입력 요소에 `role="combobox"`·`aria-expanded`·`aria-activedescendant`가 붙는지, 포커스가 입력에 남는지

---

## 7. 타이포그래피

### 7.1 글꼴

| 용도 | 스택 | 비고 |
|---|---|---|
| `--font-sans` | `"Noto Sans KR Variable", "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif` | `@fontsource-variable/noto-sans-kr`. 웹폰트를 못 불러오면 운영체제의 한글 글꼴로 넘어간다. 레퍼런스 스택의 Inter·Pretendard는 Noto Sans KR이 라틴 글자까지 덮기 때문에 실제로 쓰이지 않아 뺐다 |
| `--font-mono` | `ui-monospace, Consolas, "Noto Sans KR Variable", monospace` | 레퍼런스 그대로. 코드 안의 한글도 Noto로 렌더링 |

### 7.2 크기 체계

본문 14px을 기준으로 한다. 레퍼런스의 제목:본문 비율(약 2.0)은 1.71로 낮추고, 패널 제목 비율(1.15)과 핵심 수치 비율(2.08)은 거의 그대로 유지했다.

| 유틸리티 | 크기 / 줄높이 | 자간 | 권장 굵기 | 본문 대비 | 쓰는 곳 |
|---|---|---|---|---|---|
| `text-caption` | 12 / 18px | 0 | 400, 500 | 0.86 | 표 머리글, 배지, 시각·개수, 이동 경로 |
| `text-body-sm` | 13 / 20px | 0 | 400, 500 | 0.93 | 필드 설명·오류, 작은 버튼, 페이지 설명 |
| `text-body` | 14 / 22px | 0 | 400 (강조 500·600) | 1.00 | 본문, 표 셀, 입력값, 버튼, 메뉴, 필드 라벨 |
| `text-subtitle` | 16 / 24px | 0 | 600 | 1.14 | 패널 제목, 빈 상태 제목 |
| `text-title` | 18 / 26px | -0.01em | 600 | 1.29 | 대화상자 제목 |
| `text-heading` | 24 / 32px | -0.02em | 700 | 1.71 | 페이지 제목(h1) |
| `text-display` | 28 / 36px | -0.02em | 700 | 2.00 | 핵심 수치(오늘 예약 수 등), `tabular-nums`와 함께 |

굵기는 글자 크기 토큰에 묶지 않고 컴포넌트에서 `font-medium` 등으로 따로 지정한다. 묶으면 같은 요소에 두 굵기 값이 겹칠 때 적용 순서를 예측하기 어렵다.

### 7.3 한글 가독성 규칙

- **줄간격** — 본문 1.57(14/22). 약관·메모 같은 긴 글은 14/24px(1.71)에 최대 폭 `max-w-reading`(720px).
- **줄바꿈** — body에 `word-break: keep-all`(어절 단위)과 `overflow-wrap: break-word`(긴 이메일·URL 대비)를 둔다.
- **굵기** — 300 이하는 쓰지 않는다. Windows 렌더링에서 한글 획이 흐려진다.
- **자간** — 본문은 0. 제목은 -0.02em까지. 레퍼런스의 -0.033em(30px에서 -1px)은 한글 글자 사이를 지나치게 좁힌다.
- **머리말** — 영문 대문자 머리말을 쓰지 않는다. 한글에는 대소문자가 없고, 한국어 UI에서 영문 머리말은 정보가 되지 못한다.
- **숫자** — 시간, 금액, 전화번호, 개수에는 `tabular-nums`를 지정하고, 표에서 금액·수량은 오른쪽 정렬한다. 시간은 24시간제 `HH:mm`으로 쓴다(D4 결정, 네이티브 앱의 `hour12: false`와 같음). Noto Sans KR Variable의 `tnum` 지원 여부는 확인하지 못했다(6.5절). 지원하지 않으면 숫자 열만 다른 숫자 글꼴을 쓸지 SPEC에서 정한다.
- **말줄임** — 고객명·메뉴명은 한 줄 말줄임을 하고, 전체 이름은 툴팁이나 상세 화면에서 보여 준다.
- **최소 크기** — 12px. 배지·표 머리글도 12px 아래로 내리지 않는다.

---

## 8. 간격과 밀도 (comfortable)

기본 단위는 4px(Tailwind 기본 `--spacing: 0.25rem`)이다. 레퍼런스의 9·14·22·30px 같은 비정형 간격은 4px 격자로 맞췄다.

| 항목 | 값 | Tailwind | 레퍼런스 |
|---|---|---|---|
| 컨트롤 높이 sm / default / lg | 32 / 40 / 48px | `h-8` / `h-10` / `h-12` | 같음 |
| 컨트롤 좌우 여백 sm / default / lg | 12 / 16 / 20px | `px-3` / `px-4` / `px-5` | 12 / 16 / 24px |
| 아이콘과 라벨 간격 | 6px(sm) / 8px | `gap-1.5` / `gap-2` | 8px |
| 아이콘 버튼 | 32 / 40px 정사각 | `size-8` / `size-10` | — |
| 체크박스 | 20px | `size-5` | 20px |
| 배지 | 높이 22px, 좌우 8px | `h-5.5 px-2` | 약 24px, 좌우 8px |
| 표 머리글 행 | 높이 40px, 좌우 16px | `h-10 px-4` | 14 × 10px |
| 표 본문 행 | 세로 14px, 좌우 16px (행 높이 약 50px) | `py-3.5 px-4` | 14 × 10px |
| 패널 안쪽 여백 | 24px | `p-6` | 22~24px |
| 패널 제목과 내용 사이 | 16px | `gap-4` | 10~16px |
| 페이지 여백 | 24px, 1024px 이상 32px | `p-6 lg:p-8` | 30px |
| 섹션 간격 | 24px | `gap-6` | 22px |
| 폼 필드 간격 | 20px | `gap-5` | 16px |
| 라벨과 컨트롤 사이 | 8px | `gap-2` | 8px |
| 컨트롤과 설명·오류 사이 | 6px | `gap-1.5` | — |
| 콘텐츠 최대 폭 | 1280px | `max-w-content` | 1250 / 1400px |
| 사이드바 | 240px / 접힘 64px | `w-(--sidebar-width)` | 190 / 70px |
| 상단바 | 56px | `h-14` | 62px |

- **누를 수 있는 영역** — 최소 32×32px(WCAG 2.5.8 AA 기준 24px보다 여유 있게). 표 행의 아이콘 버튼도 32px.
- **태블릿** — 터치 입력(coarse pointer)에서는 대화상자의 주요 동작에 `lg`(48px) 버튼을 권장한다.
- compact 밀도는 이번 범위에 넣지 않는다. 표 셀 여백과 패널 여백만 바꾸면 되도록 값을 컴포넌트 한곳에 모아 둔다.

---

## 9. 반경

`--radius` 하나(12px)에서 비율로 계산한다. 반경을 바꿀 때는 `--radius`만 고치면 비율이 유지된다(레퍼런스의 `.wt-sharp`처럼 5~6px로 줄여도 같은 관계가 남는다).

| 유틸리티 | 계산 | 값 | 높이 대비 | 쓰는 곳 |
|---|---|---|---|---|
| `rounded-panel` | `--radius` | 12px | 패널 여백 24px의 1/2 | 패널, 카드, 팝오버, 대화상자, 토스트 |
| `rounded-control` | × 2/3 | 8px | 40px 컨트롤의 0.2 | 버튼, 입력, 셀렉트, 메뉴 항목, 사이드바 항목, 툴팁, 매장 마크 |
| `rounded-badge` | × 1/2 | 6px | 22px 배지의 0.27 | 배지 |
| `rounded-chip` | × 1/3 | 4px | — | 체크박스, 개수 칩, 단축키 표시 |
| `rounded-full` | 정적 | — | — | 고객 아바타(원형) |

- **동심 반경** — 패딩 안에 들어간 요소의 반경은 `바깥 반경 − 패딩`으로 맞춘다. 예: 팝오버(12px)에 패딩 4px(`p-1`)이면 안쪽 메뉴 항목은 8px(`rounded-control`). 패딩이 반경보다 큰 경우(대화상자 `p-6`)에는 안쪽 컨트롤이 자기 반경을 그대로 쓴다.
- 레퍼런스에서는 아바타가 8px 모서리 사각형이었지만, 사람을 나타내는 아바타는 원형으로 바꾸고 매장 마크만 사각형으로 남겨 둘을 구분한다.
- 알약형(pill) 버튼은 쓰지 않는다.

---

## 10. 높이(elevation)와 그림자

| 단계 | 대상 | 표현 |
|---|---|---|
| 0 | 페이지 | `background` |
| 1 | 패널, 사이드바, 상단바 | `card` + 1px `border`, 그림자 없음 |
| 2 | 메뉴, 셀렉트 목록, 콤보박스, 날짜 선택, 툴팁 | `popover` + 1px `border` + `shadow-raised` |
| 3 | 대화상자, 토스트 | `popover` + 1px `border` + `shadow-overlay`. 대화상자는 뒤에 `bg-overlay` 스크림 |

- 다크에서는 그림자가 잘 보이지 않으므로 면 자체를 단계마다 밝게 한다(`#11141e` → `#1a1f2c` → `#222838`).
- 패널 안에 패널을 넣지 않는다. 패널 안은 간격과 구분선으로 나눈다.
- z 순서: 상단바 20, 모바일 사이드바 서랍 30, 스크림 40, 대화상자·팝오버 50, 토스트 60(레퍼런스와 같은 순서).

---

## 11. 모션

철학은 **기능적 최소 모션**이다. 움직임은 상태 변화를 알리는 데만 쓰고, 300ms를 넘기지 않으며, 튀는(bounce) 움직임과 시차 스크롤은 쓰지 않는다.

| 움직임 | 시간 | 이징 | 감속 모드(`prefers-reduced-motion: reduce`) |
|---|---|---|---|
| hover·누름의 색 변화 | 150ms | `ease-out` | 즉시 바뀜 |
| 메뉴·팝오버·툴팁 등장 / 퇴장 | 200ms / 150ms, 페이드 + 트리거 쪽에서 4px 이동 | `ease-out` / `ease-in` | 이동 없이 즉시 표시 |
| 대화상자 등장 / 퇴장 | 200ms / 150ms, 페이드 + 크기 98% → 100% | `ease-out` / `ease-in` | 즉시 표시 |
| 토스트 | 200ms, 오른쪽에서 8px 이동 + 페이드 | `ease-out` | 즉시 표시 |
| 사이드바 접기·펼치기 | 200ms 폭 전환 | `ease-out` | 즉시 바뀜 |
| 로딩 스피너 | 회전 | linear | 회전을 멈추고 "불러오는 중…" 텍스트로 의미 전달 |
| 스켈레톤 | 은은한 깜빡임(pulse) | — | 정지된 회색 블록 |

- 진입·퇴장 애니메이션은 Radix의 `data-state`·`data-side` 속성에 연결하고, 키프레임은 `@theme`의 `--animate-*`로 정의한다(추가 의존성 없이).
- 컴포넌트마다 `motion-safe:` / `motion-reduce:` 변형으로 감속 모드 동작을 직접 정의한다. 그와 별개로 기본 계층에 전역 안전망을 둔다: 감속 모드에서 모든 애니메이션·전환 시간을 사실상 0(0.01ms)으로, 반복을 1회로 제한한다.

---

## 12. 컴포넌트 규약

### 12.0 구성 원칙

- 컴포넌트당 파일 하나, shadcn/ui 소스 소유 방식(Radix 프리미티브 + CVA + `cn`).
- 변형(variant)과 크기(size)는 CVA로 정의하고, `className`으로 덮어쓸 수 있게 `cn`으로 합친다.
- 여러 부분으로 된 컴포넌트는 조합형(compound)으로 만든다. 예: `Card` / `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` / `CardFooter`.
- 예약 같은 업무 도메인 지식은 `ui-core`에 넣지 않는다. 예: 상태→톤 매핑(13절)은 도메인 계층에 두고 `Badge`는 `tone`만 안다.

| 묶음 | 컴포넌트 | 기반 |
|---|---|---|
| 동작 | Button | Radix Slot |
| 폼 | Field, Input, Textarea, Select, Checkbox, Combobox, DateTimePicker, Search, Filter, FileUpload | Radix Label · Select · Checkbox · Popover 1.3.1 (+ 필요 시 ToggleGroup), cmdk 1.1.1(Combobox), react-day-picker 10.0.2 + date-fns 4.4.0 `ko` 로캘(DateTimePicker) |
| 오버레이 | Modal, ConfirmDialog, Toast | Radix Dialog · AlertDialog · Toast |
| 피드백 | Alert, Badge, Loading, Skeleton, EmptyState | — |
| 데이터 표시 | Card, Table, Tabs, Pagination, Chart | Radix Tabs |
| 탐색 | Sidebar, Topbar(레퍼런스 Navbar 대체), Breadcrumb, PageHeader | Radix Tooltip(접힌 사이드바) |

레퍼런스의 `Form` 데모는 Field 패턴으로 대체한다.

### 12.1 공통 상태

| 상태 | 표현 |
|---|---|
| hover | 채움 버튼: `{tone}-hover`. outline·ghost 버튼, 메뉴 항목, 클릭 가능한 행: `bg-accent` |
| focus-visible | `outline-2 outline-offset-2 outline-ring`. 텍스트 입력은 테두리도 `ring` 색으로 바꾼다 |
| 눌림(active) | hover와 같은 색. 크기 변화 같은 추가 효과는 없다 |
| disabled | 불투명도 50%, `cursor-not-allowed`, 네이티브 `disabled`. 대비 기준 적용 대상이 아니다(WCAG 예외) |
| loading | 스피너(lucide `LoaderCircle`) + 라벨 유지, `aria-busy="true"`, `aria-disabled="true"`, 클릭 무시, 포커스 유지 |
| invalid | `aria-invalid="true"` → 테두리와 포커스 링을 `destructive`로. 아래에 오류 문구(아이콘 + 텍스트) |
| selected | 메뉴·목록: `bg-primary-subtle text-primary-subtle-foreground font-semibold`. 표의 선택 행: `bg-primary-subtle`, 텍스트는 기본색 유지 |
| read-only | `bg-muted`, 테두리 유지, 텍스트는 `foreground` |

### 12.2 Button

| 변형 | 모양 | 쓰는 곳 |
|---|---|---|
| `default` | `bg-primary text-primary-foreground`, hover `bg-primary-hover` | 화면의 주요 동작. **페이지 머리와 대화상자 바닥마다 하나** |
| `outline` | `bg-card border border-border text-foreground`, hover `bg-accent` | 보조 동작, 대화상자의 '취소' |
| `ghost` | 배경 없음, `text-muted-foreground`, hover `bg-accent text-foreground` | 표 행의 아이콘 동작, 툴바의 가벼운 동작 |
| `destructive` | `bg-destructive text-destructive-foreground`, hover `bg-destructive-hover` | 삭제, 예약 취소, 노쇼 처리의 최종 확인 |
| `link` | `text-primary`, 밑줄 간격 4px, hover 밑줄 | 문장 안 이동 |

- 크기: `sm` 32px, `default` 40px, `lg` 48px, `icon` 40×40, `icon-sm` 32×32.
- 아이콘 크기 16px(`lg`는 18px), 라벨 앞에 둔다.
- 아이콘만 있는 버튼은 `aria-label`이 필수이고 툴팁을 권장한다.
- 페이지 이동은 `asChild`로 라우터 링크를 렌더링한다. 링크는 이동, 버튼은 동작이다.
- 라벨은 구체적인 동사로 쓴다("저장", "예약 추가", "노쇼로 표시"). '확인'은 결과가 따르지 않는 안내 대화상자에만 쓴다.
- 레퍼런스의 `hover:opacity-90`은 쓰지 않는다. 라벨 대비가 함께 떨어진다.

### 12.3 폼

**Field** — 라벨, 컨트롤, 설명, 오류를 묶는 패턴이다.

- 구조: `Field` → `FieldLabel`(Radix Label) → 컨트롤 → `FieldDescription` → `FieldError`.
- id 연결: 컨트롤 `id` ↔ 라벨 `htmlFor`. `aria-describedby`에는 설명 id와 오류 id 가운데 실제로 렌더링된 것만 넣는다. 오류가 있으면 `aria-invalid="true"`.
- 필수 항목: 라벨 뒤에 `*`(`text-destructive`, `aria-hidden`)를 붙이고 컨트롤에 `required`를 준다.
- 오류 문구: 컨트롤 아래 `text-body-sm text-destructive`, 앞에 `CircleAlert` 14px. 색, 아이콘, 문장을 함께 써서 색만으로 전달하지 않는다.
- 검증 시점: 입력 중에는 검사하지 않고 포커스를 벗어날 때와 제출할 때 검사한다. 오류가 난 필드는 고치는 즉시 오류를 지운다. 제출에 실패하면 첫 번째 오류 필드로 포커스를 옮긴다.

**Input** — 40px, `px-3`, `text-body`, `bg-card`, `border-input`, `rounded-control`, placeholder는 `muted-foreground`.

- 앞뒤 부가 표시(prefix·suffix) 자리를 둔다: 가격 "원", 소요 시간 "분", 검색 아이콘.
- 전화번호는 `inputMode="tel"`, 금액·시간 같은 숫자는 `inputMode="numeric"`과 천 단위 쉼표 표시.
- placeholder는 형식 예시로만 쓰고("010-1234-5678") 라벨을 대신하지 않는다.

**Textarea** — 최소 높이 96px, 세로로만 크기 조절, 글자 수 제한이 있으면 설명 자리에 "120/500"을 둔다.

**Select** (Radix Select)

- 옵션은 `{ value, label, disabled? }`, 필요하면 묶음 이름을 둔다. 폼 안에서 `name`을 주면 네이티브 제출과 연결된다.
- 트리거는 Input과 같은 모양에 `ChevronDown` 아이콘. placeholder는 "선택".
- 목록은 `bg-popover`, `p-1`, `rounded-panel`, `shadow-raised`, 최대 높이 320px 스크롤.
- 항목은 높이 36px, `rounded-control`, 하이라이트 `bg-accent`, 선택된 항목은 오른쪽 `Check` 아이콘 + `font-medium`.

**Checkbox** (Radix Checkbox) — 20px, `rounded-chip`, `border-input`. 체크 시 `bg-primary` + `Check` 14px(`primary-foreground`), 일부 선택은 `Minus`. 라벨 전체를 눌러도 체크되고, 여러 개는 `fieldset` + `legend`로 묶는다.

**Combobox** (고객·고객 그룹 검색)

- WAI-ARIA APG의 목록 자동완성 콤보박스 패턴: 입력에 `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-autocomplete="list"`, `aria-activedescendant`. 목록은 `role="listbox"`, 항목은 `role="option"` + `aria-selected`.
- 키보드: ↓/↑ 이동, Enter 선택, Esc 닫기(한 번 더 누르면 입력 지우기).
- 원격 검색: 입력이 멈춘 뒤 300ms 후 요청, 목록 안에 로딩 표시, 결과 개수는 `aria-live="polite"`로 알린다. cmdk의 자체 필터는 끄고(`shouldFilter={false}`) 서버가 돌려준 결과를 그대로 보여 준다.
- 항목 표시: 고객명(`font-medium`) + 전화번호 뒷자리 + 그룹 배지. 일치하는 고객이 없으면 "‘김민’과 일치하는 고객이 없어요."와 함께 "새 고객 등록" 동작을 목록 끝에 둔다.
- 여러 개 선택(그룹 지정)은 선택 항목을 입력 앞에 칩으로 보여 주고, 칩마다 제거 버튼(`aria-label="VIP 그룹 제거"`)을 둔다.
- **구현 기반(D9 결정)**: cmdk 1.1.1을 Radix Popover 1.3.1 안에 렌더링한다. 목록 모양(`bg-popover`, `p-1`, `rounded-panel`, `shadow-raised`)과 항목 모양(높이 36px, `rounded-control`, 하이라이트 `bg-accent`)은 Select와 같게 맞춘다. 위 ARIA 속성이 실제로 붙는지는 run 단계에서 확인한다(6.5절 7번).

**DateTimePicker** (예약 일시)

- 날짜: 입력 모양의 트리거("2026. 10. 29. (목)")를 누르면 Popover 안에 월 달력이 열린다. APG 날짜 선택 대화상자 패턴을 따른다: 달력 격자 `role="grid"`, 방향키(하루·한 주), PageUp/PageDown(한 달), Home/End(주의 처음·끝), Enter 선택, Esc 닫기.
- 달력 머리는 "2026년 10월", 요일은 "일 월 화 수 목 금 토"(일요일 시작). 오늘은 `ring` 색 테두리, 선택일은 `bg-primary text-primary-foreground`.
- 한국 달력 관례에 따라 일요일 숫자는 `destructive`, 토요일 숫자는 `primary` 색으로 쓴다. 요일 머리가 함께 있으므로 색만으로 전달하는 정보는 아니다.
- 시간: 영업시간 범위(`min`~`max`) 안에서 `step` 간격의 칸을 Select로 고른다. 표기는 24시간제 `HH:mm`(D4 결정, 네이티브 앱과 같음). 시간 칸 목록과 표시 문자열은 date-fns로 만든다.
- 과거 날짜·휴무일 비활성은 옵션으로 둔다.
- **구현 기반(D9 결정)**: 달력 격자는 react-day-picker 10.0.2, 날짜 계산·서식은 date-fns 4.4.0의 `ko` 로캘을 쓴다(일요일 시작, 요일·월 이름 한국어). shadcn/ui의 Calendar 예제는 react-day-picker v9 기준이므로 그대로 옮기지 않고, v10 API를 run 단계에서 확인한 뒤 맞춘다(6.5절 6번). 위의 키보드 동작과 주말 색은 react-day-picker의 기본 동작·수정자(modifier)로 충족되는지 함께 확인한다.

**Search** — 입력 안 왼쪽에 `Search` 아이콘(16px), 값이 있으면 오른쪽에 지우기 버튼(`aria-label="검색어 지우기"`). `type="search"`, 접근 가능한 이름은 `aria-label`로 따로 준다(placeholder로 대신하지 않는다). 원격 검색은 300ms 디바운스.

**Filter** — 선택지가 많으면 Select. 예약 상태처럼 선택지가 적고 개수가 의미 있으면 단일 선택 토글 묶음(Radix ToggleGroup)으로 "전체 42 · 예약됨 12 · 방문함 3 · 완료 20 · 취소됨 4 · 노쇼 3"처럼 보여 준다. 적용된 필터가 있으면 "필터 초기화"(ghost) 버튼을 둔다.

**FileUpload** — 점선 테두리(`border-input`) 영역 + "파일 선택" 버튼, 허용 형식·최대 용량을 설명에 적는다. 고른 파일은 이름·크기·제거 버튼으로 나열하고, 오류는 Field 오류로 보여 준다. 서버 전송은 이 SPEC의 범위가 아니다.

### 12.4 오버레이

**Modal** (Radix Dialog)

- 크기: `sm` 400px(확인), `md` 560px(기본 폼), `lg` 720px(예약 등록처럼 항목이 많은 폼). 최대 높이는 화면의 90%이고 본문만 스크롤한다.
- 제목(`Dialog.Title`)은 필수, 설명은 있을 때만 렌더링한다(R13).
- 오른쪽 위 닫기 버튼(`icon-sm`, `ghost`, `aria-label="닫기"`).
- 열리면 첫 입력 필드로 포커스, 닫히면 연 버튼으로 포커스를 돌려준다.
- Esc와 스크림 클릭으로 닫는다. 단, 제출 중에는 닫히지 않는다.
- **작성 중인 폼을 닫으려 하면 확인한다**: "작성 중인 내용이 사라져요. 닫을까요?" [계속 작성] [닫기]. 응대로 자리를 자주 비우는 사용자를 위한 장치다.

**ConfirmDialog** (Radix AlertDialog)

- 크기 `sm`. 제목은 해요체 질문, 설명은 결과(되돌릴 수 있는지).
- 버튼은 [취소(outline)] [구체 동사(default 또는 destructive)]. 위험 동작이면 처음 포커스를 '취소'에 둔다.
- 확인 동작이 비동기면 확인 버튼에 loading을 걸고, 끝날 때까지 대화상자를 유지한다. 실패하면 대화상자 안에 destructive Alert를 띄운다.
- 확인하려는 동작이 '취소'인 경우(예약 취소) 닫기 버튼은 "닫기"로 쓴다. "취소 / 예약 취소"처럼 같은 말이 두 버튼에 겹치지 않게 한다.

**Toast** (Radix Toast)

- 위치: 768px 이상은 오른쪽 아래, 그보다 좁으면 가운데 아래. 가장자리에서 16px.
- 동시에 최대 3개, 나머지는 대기열.
- 톤과 아이콘: success `CircleCheck`, info `Info`, warning `TriangleAlert`, destructive `CircleAlert`.
- 표시 시간: success·info 5초, warning 7초, destructive는 사용자가 닫을 때까지. 마우스를 올리거나 포커스가 있으면 멈춘다.
- 오류는 즉시 읽히게(foreground), 나머지는 차례를 기다려 읽히게(background) 알린다.
- 동작은 하나까지("다시 시도", "되돌리기"). 닫기 버튼은 `aria-label="알림 닫기"`.

### 12.5 피드백

**Alert** — 톤 info·success·warning·destructive. `{tone}-subtle` 면 + 1px 테두리(`{tone}`의 25%, 장식) + `rounded-panel` + `p-4`. 아이콘(16px)과 제목은 `{tone}-subtle-foreground`, 본문은 `foreground`. 동적으로 나타나는 오류에만 `role="alert"`(R15).

**Badge** — 톤 neutral·info·success·warning·destructive. 틴트 모양 하나만 둔다(채움형은 필요해질 때 추가). 높이 22px, `px-2`, `text-caption font-medium`, `rounded-badge`, 앞에 아이콘 12px 또는 점 6px. neutral은 `bg-muted text-muted-foreground`. 라벨은 짧게(여섯 글자 이내), 숫자는 `tabular-nums`. **예약 상태 배지는 tone이 아니라 예약 상태 토큰(`status-*`)으로 칠한다**(13절). 도메인 계층의 상태 배지가 `Badge`에 상태 토큰 클래스와 아이콘을 넘기는 방식이다.

**Loading** — `LoaderCircle`(16/20px) + "불러오는 중…", `role="status"`. 버튼 안 스피너에는 role을 주지 않는다(버튼의 `aria-busy`로 충분).

**Skeleton** — `bg-muted`, 텍스트 줄은 높이 16px `rounded-chip`, 블록은 `rounded-control`. 실제 내용과 같은 모양(표라면 행·열 구조 그대로)으로 그린다. 감싸는 영역에 `aria-busy="true"`와 화면에는 보이지 않는 "불러오는 중" 텍스트, 블록 자체는 `aria-hidden`. 300ms 안에 끝나는 로딩에서는 깜빡임을 막기 위해 표시하지 않는다.

**EmptyState** — 패널 안 가운데, 세로 여백 48px. 48px 원(`bg-muted`) 안에 아이콘 24px(`muted-foreground`), 제목 `text-subtitle font-semibold`, 설명 `text-body-sm text-muted-foreground`(두 줄, 최대 폭 360px), 동작 버튼 하나.

- 첫 사용(데이터 없음): "아직 등록된 고객이 없어요." + [고객 등록](default)
- 검색·필터 결과 없음: "조건에 맞는 예약이 없어요." + [필터 초기화](outline)

### 12.6 데이터 표시

**Card** — 조합형, `bg-card border border-border rounded-panel p-6`, 그림자 없음. 카드 안에 카드를 넣지 않는다.

**Table**

- 열 정의 `Column<T>`: `{ id, header, cell, align?: "start" | "end" | "center", width? }`. 금액·수량·시간은 `align: "end"` + `tabular-nums`.
- 머리글: 높이 40px, `text-caption font-medium text-muted-foreground`, `scope="col"`. 세로 스크롤 컨테이너 안에서는 머리글을 고정한다.
- 본문: `text-body`, 행 사이 `border-b border-border`. 첫 열은 대표 식별자(고객명 등)로 `font-medium`.
- 패널 안 표는 첫 셀과 마지막 셀의 바깥 여백을 24px로 해서 패널 여백과 맞춘다.
- 행 전체 `onClick`은 쓰지 않는다. 상세로 가는 이동은 첫 열의 실제 링크로, 동작은 행 끝의 아이콘 버튼(`aria-label="김민지 고객 수정"`)으로 둔다.
- 화면 낭독기를 위한 `caption`(시각적으로 숨김)을 둔다. 가로 스크롤 컨테이너는 `tabIndex={0}`과 `aria-label`로 키보드 스크롤을 허용한다.
- 정렬 가능한 열은 머리글 버튼 + `aria-sort`.
- 로딩·빈 상태·오류 자리를 표 안에 둔다(14.3절).

**Tabs** (Radix Tabs) — 항목은 `{ value, label, content }`(레퍼런스는 라벨을 값으로 썼다). 밑줄형: 목록 아래 `border-b`, 탭은 높이 40px `text-body font-medium text-muted-foreground`, 활성 탭은 `text-foreground` + 2px `primary` 밑줄. 목록에 `aria-label`.

**Pagination** — `nav aria-label="페이지 이동"`. [이전] 1 … 4 **5** 6 … 20 [다음], 버튼 `sm`. 현재 페이지는 `aria-current="page"` + `bg-primary-subtle text-primary-subtle-foreground`. 전체 개수("총 128명")는 표 바닥 왼쪽에 따로 둔다.

**Chart** — 단일 계열은 `primary`, 축·격자선은 `border`. `role="img"` + 수치를 요약한 `aria-label`, 그리고 데이터 표를 펼쳐 볼 수 있는 대체 수단(details)을 둔다. 여러 계열 팔레트는 필요해지는 SPEC에서 정한다.

### 12.7 탐색

**Sidebar**

- 머리(높이 56px): 매장 마크(32px, `rounded-control`, `bg-primary text-primary-foreground`, 매장명 첫 글자) + 매장명(말줄임) + 매장 변경 버튼.
- 메뉴 묶음: 묶음 이름 `text-caption font-medium text-muted-foreground`(한글, 예: "운영", "고객", "매장 관리").
- 항목: `{ to, label, icon }`. 높이 40px, `px-3 gap-3`, 아이콘 18px, `text-body font-medium`, `rounded-control`. 기본 `text-muted-foreground`, hover `bg-accent text-foreground`, 활성 `bg-primary-subtle text-primary-subtle-foreground font-semibold` + `aria-current="page"`.
- 바닥: 사용자 이름·역할, 로그아웃.
- 접힘(64px): 아이콘만 보이고 이름은 화면에서 숨긴 텍스트로 남겨 접근 가능한 이름을 유지한다. hover·포커스 시 오른쪽에 툴팁. 묶음 이름 대신 구분선.
- 접기 버튼은 상단바에(`PanelLeftClose` / `PanelLeftOpen`, `aria-label="사이드바 접기"`, `aria-expanded`). 접힘 상태는 저장해 둔다.
- 768px보다 좁으면 사이드바를 숨기고 메뉴 버튼으로 서랍(Dialog 기반, 포커스 가둠, Esc 닫기)을 연다.

**Topbar** (레퍼런스 Navbar 대체) — 높이 56px, `bg-card border-b border-border`, 위쪽 고정. 왼쪽에 사이드바 접기 버튼과 이동 경로, 오른쪽에 오늘 날짜("10월 29일 (목)", `text-caption text-muted-foreground`), 테마 전환(`Sun`/`Moon`/`Monitor` 메뉴), 사용자 메뉴. 주요 동작 버튼은 상단바에 두지 않고 PageHeader에 둔다. 사이드바 탐색을 쓰므로 상단바에는 메뉴 항목을 두지 않는다.

**Breadcrumb** — `nav aria-label="현재 위치"` + `ol`. 구분 기호 `ChevronRight` 14px(`aria-hidden`). 링크는 `text-muted-foreground`, hover 시 `text-foreground` + 밑줄. 마지막 항목은 `text-foreground`, `aria-current="page"`. 최대 3단계.

**PageHeader** — 14.2절.

### 12.8 접근성 공통 규칙

- 모든 상호작용 요소는 키보드로 조작할 수 있고, 포커스 순서는 화면 순서와 같다.
- 색만으로 정보를 전달하지 않는다. 상태는 아이콘 + 라벨로, 오류는 아이콘 + 문장으로 전달한다.
- 아이콘은 장식이면 `aria-hidden`, 단독으로 의미를 가지면 접근 가능한 이름을 준다.
- 라이브 영역: 토스트, 검색 결과 개수, 페이지네이션의 현재 페이지.
- 페이지마다 h1은 하나(PageHeader 제목). `<html lang="ko">`.
- 본문 첫머리에 "본문으로 건너뛰기" 링크.
- 고대비(forced-colors) 모드에서 경계와 포커스가 사라지지 않도록 box-shadow가 아닌 `border`·`outline`으로 그린다.
- 누를 수 있는 영역은 최소 32×32px.

### 12.9 UI 문구 톤: 해요체

**결정(D3): 해요체로 통일한다.** 사용자가 2026-10-29에 확정했다.

- 사용자는 하루 종일 이 화면을 쓰는 원장·실장이다. 합니다체는 정중하지만 거리감이 있어 짧은 알림이나 오류에서 딱딱하게 읽힌다("삭제하시겠습니까?").
- 해요체는 공손함을 지키면서 짧고 부드럽다. 국내 소상공인 대상 서비스에서 널리 쓰는 말투라 사용자에게 낯설지 않다.
- 한 가지로 통일해야 화면마다 말투가 달라지는 어색함(레퍼런스의 "등록했습니다." / "선택하세요." 혼용)이 없어진다.

| 상황 | 문구 |
|---|---|
| 저장 완료(토스트) | 예약을 저장했어요. |
| 삭제 확인 | **김민지 고객을 삭제할까요?** 고객 정보와 시술 이력이 모두 삭제되고 되돌릴 수 없어요. [취소] [삭제] |
| 예약 취소 확인 | **이 예약을 취소할까요?** 예약 상태가 '취소됨'으로 바뀌어요. [닫기] [예약 취소] |
| 노쇼 처리 | **노쇼로 표시할까요?** 예약 상태가 '노쇼'로 바뀌어요. [닫기] [노쇼로 표시] |
| 필드 오류 | 전화번호를 입력해 주세요. / 010-1234-5678 형식으로 입력해 주세요. |
| 불러오기 실패 | 예약을 불러오지 못했어요. 잠시 후 다시 시도해 주세요. [다시 시도] |
| 빈 상태 | 아직 등록된 고객이 없어요. 첫 고객을 등록하면 바로 예약을 잡을 수 있어요. [고객 등록] |
| 검색 결과 없음 | ‘김민’과 일치하는 고객이 없어요. [새 고객 등록] |
| 로딩 | 불러오는 중… |
| 작성 중 닫기 | 작성 중인 내용이 사라져요. 닫을까요? [계속 작성] [닫기] |

- **문장**(토스트, 오류, 빈 상태, 확인 대화상자)은 해요체로 쓴다.
- **버튼·메뉴·라벨·표 머리글**은 어미 없는 명사형으로 쓴다: "저장", "예약 추가", "고객 등록", "전화번호".
- 존칭은 과하게 붙이지 않는다: "저장하시겠어요?"가 아니라 "저장할까요?". 사용자를 "고객님"으로 부르지 않는다.
- 오류는 무엇이 잘못됐는지와 어떻게 고치는지를 함께 쓰고, 사용자를 탓하는 표현("잘못 입력하셨습니다")은 쓰지 않는다.
- 숫자·날짜 표기: 표의 날짜 "2026. 10. 29.", 날짜 머리 "10월 29일 (목)", 시간 "14:30"(24시간제 `HH:mm`, D4), 금액 "35,000원", 소요 시간 "60분", 전화번호 "010-1234-5678".
- 이용약관·개인정보처리방침 같은 법적 문서는 원문의 문체(합니다체)를 유지한다.
- 느낌표와 이모지는 쓰지 않는다.

---

## 13. 예약 상태 → 배지 매핑

**결정(D1·D2)** — 상태 집합은 백엔드 enum(`kmcbeauty-fastapi/app/enum/treatment_status.py`)의 5종이 기준이다. 기존 관리자 화면의 `"RESERVED" | "CANCELLED" | "FINISHED"` 타입은 폐기한다. UI 라벨과 색 계열은 네이티브 앱(`kmcbeauty-native/components/booking/BookingListScreen.tsx`)의 예약 목록 배지와 맞춘다. 사장님이 휴대폰 앱과 웹을 오가므로 같은 상태는 두 화면에서 같은 이름, 같은 색 계열로 보여야 한다.

| 상태 | 백엔드 라벨 | UI 라벨(배지) | 앱 배지 색 | 아이콘(lucide) |
|---|---|---|---|---|
| `RESERVED` | 예약됨 | 예약됨 | 인디고 `#4f46e5` | `CalendarClock` |
| `VISITED` | 방문 및 시술 완료 | 방문함 | 자홍 `#a21caf` | `DoorOpen` |
| `COMPLETED` | 시술 완료 | 완료 | 하늘 `#0369a1` | `CircleCheck` |
| `CANCELLED` | 취소됨 | 취소됨 | 빨강 `#dc2626` | `Ban` |
| `NO_SHOW` | 노쇼 | 노쇼 | 앰버 `#b45309` | `UserX` |

- **방문함과 완료의 뜻은 정하지 않았다** — 백엔드 라벨(방문 및 시술 완료 / 시술 완료)만으로는 두 상태의 업무상 차이(이어지는 단계인지, 서로 다른 종료인지)를 정할 수 없다. 이 문서는 두 상태의 뜻을 해석하지 않는다. 툴팁·범례의 설명 문구와 상태 전환 규칙은 SPEC-UI-002에서 백엔드와 함께 확정한다.
- **아이콘** — 기존 아이콘을 유지하되 방문함만 `UserCheck`에서 `DoorOpen`으로 바꿨다. 방문함(자홍)과 완료(하늘)는 제2색각 이상(D형)에서 색이 거의 같아지는데(13.2절: 라이트 ΔE 2.6, 다크 0.4), 두 아이콘이 모두 체크 표시(`UserCheck`·`CircleCheck`)면 모양으로도 구분되지 않는다. `DoorOpen`은 '매장에 들어옴'을 나타내면서 시술 완료 여부는 함축하지 않는다.

### 13.1 예약 상태 토큰

상태마다 `--status-{상태}-bg`(틴트 면), `--status-{상태}-fg`(틴트·패널 위 글자와 아이콘), `--status-{상태}-rail`(상태 레일과 점) 세 값을 둔다. 상태 키는 `reserved` `visited` `completed` `cancelled` `no-show`이고, 시맨틱 톤(`info` `success` `warning` `destructive`)과는 별개다.

| 상태 | 라이트 `bg` / `fg` / `rail` | 다크 `bg` / `fg` / `rail` |
|---|---|---|
| 예약됨 | `#e0e7ff` / `#4338ca` / `#4f46e5` | `#282e49` / `#a5b4fc` / `#818cf8` |
| 방문함 | `#fae8ff` / `#86198f` / `#a21caf` | `#372c49` / `#f0abfc` / `#e879f9` |
| 완료 | `#e0f2fe` / `#075985` / `#0369a1` | `#1e3549` / `#7dd3fc` / `#38bdf8` |
| 취소됨 | `#fee2e2` / `#b91c1c` / `#dc2626` | `#392a36` / `#fca5a5` / `#f87171` |
| 노쇼 | `#fef3c7` / `#92400e` / `#b45309` | `#3a352b` / `#fcd34d` / `#fbbf24` |

- **만든 방법** — 앱의 단색 배지 색은 Tailwind 팔레트 값(인디고 600, 자홍 700, 하늘 700, 빨강 600, 앰버 700)이다. 라이트는 이 색을 그대로 레일로 쓰고, 같은 계열의 100 단계를 틴트로, 레일보다 한 단계 진한 색(인디고 700, 자홍 800, 하늘 800, 빨강 700, 앰버 800)을 글자로 쓴다. 다크는 같은 계열의 400 단계를 레일, 300 단계를 글자로 쓰고, 틴트는 레일 14%를 `card`에 섞어 고정한 값이다(시맨틱 톤의 다크 틴트와 같은 방식).
- **앱과 웹의 차이** — 앱은 단색 배지에 흰 글자를 쓰고, 웹은 이 시스템의 틴트 배지(틴트 면 + 진한 글자 + 아이콘)와 3px 상태 레일을 쓴다. 색 계열은 같고 칠하는 방식만 다르다.
- **대비** — 5.5절의 두 번째 표. 90개 값이 모두 기준을 통과했다. 최저값은 상태 텍스트 라이트 4.66:1 / 다크 5.44:1, 레일 라이트 3.95:1 / 다크 4.46:1이다.

### 13.2 구분성 점검

ΔE00(CIEDE2000)은 두 색이 사람 눈에 얼마나 달라 보이는지를 나타내는 값이다. 경험적으로 2 이하는 나란히 놓아도 구분이 어렵고, 10 이상이면 한눈에 다른 색으로 보인다. P형·D형 값은 제1·제2색각 이상을 Machado et al.(2009, 심도 1.0) 행렬로 근사한 뒤 계산한 값이다. 계산 스크립트는 공개된 CIEDE2000 기준 쌍(Sharma et al. 2005, 기대값 2.0425)으로 먼저 검증했다.

| 비교 | 라이트 색 | 라이트 ΔE00 (정상 / P형 / D형) | 다크 색 | 다크 ΔE00 (정상 / P형 / D형) |
|---|---|---|---|---|
| 예약됨 레일 ↔ `primary` | `#4f46e5` · `#2563eb` | 10.1 / 5.8 / 3.9 | `#818cf8` · `#60a5fa` | 12.1 / 5.4 / 3.7 |
| 예약됨 틴트 ↔ `primary-subtle` | `#e0e7ff` · `#e9effd` | 4.2 / 3.5 / 3.9 | `#282e49` · `#243249` | 4.4 / 1.4 / 0.9 |
| 완료 레일 ↔ `primary` | `#0369a1` · `#2563eb` | 11.3 / 10.1 / 8.5 | `#38bdf8` · `#60a5fa` | 11.7 / 5.9 / 4.7 |
| 취소됨 레일 ↔ `destructive` | `#dc2626` · `#bf2846` | 12.1 / 13.7 / 10.8 | `#f87171` · `#ff9aaa` | 12.1 / 15.1 / 11.7 |
| 취소됨 틴트 ↔ `destructive-subtle` | `#fee2e2` · `#f9eaec` | 4.7 / 2.3 / 2.9 | `#392a36` · `#3a303e` | 3.0 / 2.2 / 2.4 |
| 취소됨 레일 ↔ 노쇼 레일 | `#dc2626` · `#b45309` | 16.1 / 6.6 / 3.3 | `#f87171` · `#fbbf24` | 41.1 / 26.0 / 17.0 |
| 취소됨 틴트 ↔ 노쇼 틴트 | `#fee2e2` · `#fef3c7` | 21.4 / 13.8 / 11.5 | `#392a36` · `#3a352b` | 15.8 / 12.5 / 10.8 |
| 노쇼 레일 ↔ `destructive` | `#b45309` · `#bf2846` | 24.3 / 19.4 / 10.1 | `#fbbf24` · `#ff9aaa` | 42.8 / 28.6 / 21.7 |
| 노쇼 레일 ↔ `warning` | `#b45309` · `#b45309` | 0.0 / 0.0 / 0.0 | `#fbbf24` · `#fbbf24` | 0.0 / 0.0 / 0.0 |
| 방문함 레일 ↔ 완료 레일 | `#a21caf` · `#0369a1` | 36.9 / 8.6 / 2.6 | `#e879f9` · `#38bdf8` | 45.2 / 10.4 / 0.4 |
| 예약됨 레일 ↔ 방문함 레일 | `#4f46e5` · `#a21caf` | 16.9 / 8.7 / 7.1 | `#818cf8` · `#e879f9` | 21.0 / 0.8 / 8.5 |

- **예약됨 인디고 ↔ 주색 파랑** — 레일끼리는 ΔE 10.1(라이트)·12.1(다크)로 구분되지만 틴트끼리는 4.2·4.4로 가깝다. 표의 선택 행(`primary-subtle`)에 예약됨 배지가 놓이면 배지 면이 거의 사라진다(면끼리 대비 1.07:1 / 1.03:1). 배지 글자 대비는 6.86:1 / 6.47:1로 유지되므로 정보는 남는다.
- **취소됨 빨강 ↔ 위험(`destructive`)** — 레일은 ΔE 12.1로 다른 색이지만 같은 붉은 계열이고, 틴트끼리는 4.7(라이트)·3.0(다크)으로 가깝다.
- **취소됨 빨강 ↔ 노쇼 앰버** — 정상 시각에서는 ΔE 16.1(라이트)·41.1(다크)로 구분된다. 라이트 레일은 D형 근사에서 3.3으로 가까워지지만, 틴트끼리는 11.5 이상을 유지한다.
- **노쇼 앰버 = 주의(`warning`)** — 같은 앰버 값이다(ΔE 0). 앱의 노쇼 색과 이 시스템의 주의 톤이 같은 계열이기 때문이다.
- **색각 이상 근사에서 겹치는 쌍** — 상태 레일 10쌍 가운데 최솟값은 D형의 방문함 ↔ 완료(라이트 2.6, 다크 0.4)와 P형 다크의 예약됨 ↔ 방문함(0.8)이다. 이 쌍들은 색만으로는 구분되지 않는다. 라이트 레일의 상대 휘도도 0.116~0.167로 비슷해 흑백에서도 밝기로 구분하기 어렵다.

### 13.3 규칙

- **아이콘 + 라벨 필수** — 모든 상태 배지는 아이콘과 라벨을 함께 보여 준다. 캘린더 이벤트는 상태 아이콘 + 시간 + 고객명을 보여 준다. 13.2절대로 일부 쌍은 색만으로 구분되지 않는다.
- **시맨틱 배지와 섞지 않는다** — 예약 상태 배지와 같은 줄, 같은 목록에 시맨틱 `destructive`·`warning` 배지를 함께 두지 않는다. 취소됨과 위험, 노쇼와 주의가 같은 색 계열이라 의미가 섞인다.
- **선택 행** — 표에서 행을 선택할 수 있게 할 때는 `primary-subtle` 면과 함께 체크박스를 둔다. 예약됨 배지 면이 선택 행에 묻혀도 선택 상태와 예약 상태가 모두 읽힌다.
- **표시 순서** — 필터·범례·선택 목록의 순서는 SPEC-UI-002에서 상태 흐름과 함께 정한다. 그 전까지 미리보기 페이지는 예약됨 → 방문함 → 완료 → 취소됨 → 노쇼 순을 임시로 쓴다.
- **매핑 위치** — 상태 → {UI 라벨, 아이콘, 상태 토큰} 상수와 상태 배지 컴포넌트는 예약 도메인 모듈에 둔다. `ui-core`는 예약 상태를 모른다. `Badge`는 색 클래스와 아이콘을 받고, 레일 옵션은 색 값을 받는다.
- **자홍은 상태 전용** — 방문함의 자홍은 상태 색으로만 쓰고 장식에는 쓰지 않는다(16절).

---

## 14. 레이아웃 규약

### 14.1 앱 셸

```text
앱 셸
├─ 사이드바: 240px, 접힘 64px / card 면, 오른쪽 border
│  ├─ 머리(56px): 매장 마크 32px + 매장명 + 매장 변경
│  ├─ 메뉴 묶음: 묶음 이름 12px + 항목 40px(아이콘 18px + 이름 14px)
│  └─ 바닥: 사용자 이름·역할, 로그아웃
├─ 상단바: 56px / card 면, 아래 border, 위쪽 고정
│  ├─ 왼쪽: 사이드바 접기 버튼, 이동 경로
│  └─ 오른쪽: 오늘 날짜, 테마 전환, 사용자 메뉴
└─ 본문: background 면 / 여백 24px(1024px 이상 32px) / 최대 폭 1280px / 섹션 간격 24px
```

캘린더 화면처럼 폭이 넓을수록 유리한 화면은 최대 폭 제한을 풀 수 있다.

### 14.2 PageHeader

```text
PageHeader
├─ 이동 경로(선택): 3단계까지, 12px
├─ 제목 줄: 제목 h1(24/32px, 700) + 개수·상태 배지(선택) …… 보조 동작(outline) · 주요 동작(default, 하나)
├─ 설명(선택): 13px, muted, 한 줄
└─ 하위 탐색(선택): Tabs 또는 기간 선택
간격: 제목 줄과 설명 4px, PageHeader와 본문 24px
```

- 주요 동작은 오른쪽 끝에 하나만 둔다.
- 좁은 화면에서는 동작 버튼이 제목 아래로 내려간다.

### 14.3 목록·테이블 페이지

```text
목록·테이블 페이지
├─ PageHeader
└─ 목록 패널: card 면, border, rounded-panel, 넘침 숨김
   ├─ 툴바(px-6 py-4): 검색(288px) · 필터 …… 보조 동작(ghost 또는 outline)
   ├─ 표: 머리글 40px(12px muted) / 행 약 50px / 첫·마지막 셀 여백 24px
   ├─ 바닥(border-t, px-6 py-3): "총 128명"(12px muted) …… 페이지네이션
   └─ 상태
      ├─ 로딩: 표와 같은 열 구조의 스켈레톤 6행
      ├─ 비어 있음: EmptyState
      └─ 오류: destructive Alert + [다시 시도]
```

- 한 페이지에 목록이 하나면 패널에 제목을 따로 달지 않는다(PageHeader 제목과 겹친다). 목록이 둘 이상일 때만 패널 머리에 `text-subtitle` 제목을 둔다.
- 필터·검색 상태는 URL 쿼리에 반영해 새로고침과 뒤로 가기에도 유지되게 한다.

### 14.4 폼과 대화상자

```text
대화상자: popover 면, rounded-panel, shadow-overlay, 뒤에 overlay 스크림
├─ 머리(p-6 pb-4): 제목(18/26px, 600) + 설명(13px, muted, 선택) + 닫기 버튼(32px, 오른쪽 위)
├─ 본문(px-6, 스크롤): 필드 세로 간격 20px / 768px 이상에서 짧은 필드는 2열
└─ 바닥(p-6 pt-4, 오른쪽 정렬, 버튼 간격 8px): [취소(outline)] [주요 동작(default)]

Field
├─ 라벨: 14/22px, 500, 필수면 *
├─ 컨트롤: 40px
├─ 설명(선택): 13/20px, muted
└─ 오류(aria-invalid일 때): 13/20px, destructive, 아이콘 14px
간격: 라벨과 컨트롤 8px, 컨트롤과 설명·오류 6px
```

- 대화상자 크기: `sm` 400px(확인), `md` 560px(기본 폼: 고객 등록·수정, 시술 메뉴 등록), `lg` 720px(예약 등록: 고객·일시·시술 항목).
- 필드가 여덟 개를 넘거나 구역이 여럿인 폼은 대화상자 대신 전체 페이지 폼으로 만들고, 아래에 고정된 동작 막대를 둔다.
- 함께 입력하는 짧은 필드(이름 + 전화번호, 가격 + 소요 시간)만 2열로 놓는다. 긴 입력(메모)은 한 줄 전체를 쓴다.

### 14.5 반응형

| 폭 | 사이드바 | 본문 여백 | 표 |
|---|---|---|---|
| 1024px 이상(데스크톱, 태블릿 가로) | 펼침이 기본, 사용자가 접을 수 있음 | 32px | 그대로 |
| 768~1023px(태블릿 세로) | 접힘(64px)이 기본 | 24px | 표 컨테이너만 가로 스크롤, 필요하면 첫 열 고정 |
| 768px 미만(휴대폰, 보조 지원) | 숨김, 메뉴 버튼으로 서랍 | 16px | 표 컨테이너만 가로 스크롤 |

페이지 전체가 가로로 스크롤되는 일은 없어야 한다. 가로 스크롤은 표 컨테이너 안에서만 허용한다.

---

## 15. 시그니처 요소: 상태 레일

예약이 화면에 나타나는 모든 곳 — 캘린더 이벤트, 오늘의 예약 목록, 예약·시술 이력 표의 행, 고객 상세의 방문 이력 — 의 앞쪽(왼쪽) 가장자리에 **3px 상태 색 띠**를 붙인다. 종이 예약장부에 형광펜과 인덱스 탭으로 상태를 표시하던 습관을 화면으로 옮긴 것이다. 화면을 훑을 때는 레일이 먼저 보이고, 확인할 때는 배지의 아이콘과 라벨을 읽는다.

- **색** — 13.1절의 `status-{상태}-rail`(예약됨 인디고, 방문함 자홍, 완료 하늘, 취소됨 빨강, 노쇼 앰버). 라이트·다크 모두 패널·바탕·자기 틴트 위에서 3:1 이상이다(5.5절 두 번째 표의 `rail/*` 열, 최저 3.95:1).
- **모양** — 폭 3px, 항목 높이 전체. 바깥 모서리는 항목의 반경을 따르고 항목 밖으로 튀어나오지 않는다.
- **그리는 방식** — `border-inline-start`로 그린다. 고대비 모드에서도 형태가 남는다. 표에서는 첫 셀에 그린다.
- **함께 쓰기** — 레일은 언제나 상태 배지(아이콘 + 라벨)와 함께 쓴다. 레일만으로 상태를 전달하지 않는다.
- **예약 상태 전용** — 알림, 카드, 메뉴 같은 다른 요소에는 레일을 쓰지 않는다. 다른 곳에 쓰면 '왼쪽 색 띠 = 예약 상태'라는 약속이 흐려진다.
- **ui-core와 도메인의 경계** — `ui-core`는 레일 색 값을 받는 옵션(목록 항목과 표 행)만 제공하고, 상태 → `status-*-rail` 연결은 도메인 계층이 맡는다.
- **캘린더 이벤트** — `status-{상태}-bg` 면 + `status-{상태}-rail` 레일 + 상태 아이콘과 시간(`status-{상태}-fg`, `tabular-nums`) + 고객명(`foreground`). 보조 텍스트가 필요하면 `muted-foreground`를 쓴다(틴트 위 4.66:1 이상). FullCalendar의 `--fc-*` 변수를 토큰에 연결하는 일은 SPEC-UI-002에서 한다.

---

## 16. 피해야 할 기본값

1. **'뷰티' 장식** — 핑크·로즈골드·파스텔 그라데이션, 장식용 일러스트. 매장 브랜드의 색이고 위험 톤(진홍)과 충돌한다. 이 도구는 중립색과 파랑 하나로 물러나 있는다. 예약 상태 색(자홍 등)은 상태 표시에만 쓰고 장식에 가져다 쓰지 않는다.
2. **템플릿형 대시보드** — 큰 지표 카드, 스파크라인, 차트로 홈을 채우는 구성(레퍼런스의 지표·차트 영역). 홈은 '오늘 예약', 곧 시간순 예약 목록과 지금 처리할 일이다. 수치는 그 목록을 돕는 보조 정보로만 둔다.
3. **카드 남발** — 모든 영역을 테두리 + 그림자 카드로 감싸고 카드 안에 카드를 넣는 구성. 패널은 한 단계만 쓰고, 패널 안은 간격과 구분선으로 나누며, 그림자는 떠 있는 레이어에만 쓴다.
4. **투명도 hover와 팔레트 하드코딩** — `hover:opacity-90`(라벨 대비가 함께 떨어진다), `bg-rose-700`, `text-white`, `dark:text-*`. 모든 색은 토큰으로 쓰고, 테마 차이는 토큰 값으로만 낸다.
5. **초소형 글자와 영문 머리말** — 8~11px 글자, `WORKSPACE`·`OVERVIEW` 같은 영문 대문자 머리말, 한글 제목의 과한 음수 자간.
6. **모호한 '확인 / 취소'** — 이 앱에서 '취소'는 '예약 취소'와 뜻이 겹친다. 주요 버튼은 구체적인 동사로 쓰고, 취소 동작을 묻는 대화상자의 닫기 버튼은 "닫기"로 쓴다.

---

## 17. 결정 사항 (D1~D9)

2026-10-29에 사용자가 결정했다(오케스트레이터가 AskUserQuestion으로 수집). D5~D8은 이 문서가 제안한 기본값으로 결정했으며, 계획 검토 때 다시 바꿀 수 있다.

| # | 결정할 내용 | 결정 | 근거·후속 |
|---|---|---|---|
| D1 | 예약 상태 집합과 뜻 | **결정** — 백엔드 enum 5종(`RESERVED` `VISITED` `CANCELLED` `NO_SHOW` `COMPLETED`)이 기준이다. `FINISHED`를 포함한 기존 관리자 타입은 폐기한다 | 근거: `kmcbeauty-fastapi/app/enum/treatment_status.py`(백엔드 라벨: 예약됨 / 방문 및 시술 완료 / 취소됨 / 노쇼 / 시술 완료). 방문함과 완료의 업무상 차이는 SPEC-UI-002에서 확정한다(13절) |
| D2 | 상태 라벨과 색 | **결정** — 네이티브 앱과 맞춘다: 예약됨(인디고), 방문함(자홍), 완료(하늘), 취소됨(빨강), 노쇼(앰버). 웹은 전용 status 토큰의 틴트 배지 + 상태 레일로 칠한다 | 근거: `kmcbeauty-native/components/booking/BookingListScreen.tsx` 22~39행. 대비 90개 값 통과(5.5절), 구분성 점검(13.2절). 방문함 아이콘은 `DoorOpen`으로 바꿨다 |
| D3 | UI 문체 | **결정** — 해요체 | 12.9절 |
| D4 | 시간 표기 | **결정** — 24시간제 `HH:mm` | 네이티브 앱이 `hour12: false`, `HH:mm`을 쓴다 |
| D5 | 입력 테두리 강도 | **기본값으로 결정** — `#808b9d`(3:1 충족) | 계획 검토 때 다시 볼 수 있다 |
| D6 | 사이드바 폭 | **기본값으로 결정** — 240px / 접힘 64px | 계획 검토 때 다시 볼 수 있다 |
| D7 | 테마 기본값 | **기본값으로 결정** — 시스템 설정을 따른다 | 계획 검토 때 다시 볼 수 있다 |
| D8 | Tailwind 기본 테마 정리(6.3절) | **기본값으로 결정** — 적용한다. 동작은 미리보기 페이지에서 확인한다(6.5절 1·2번) | 계획 검토 때 다시 볼 수 있다 |
| D9 | Combobox·DateTimePicker 구현 기반 | **결정** — 라이브러리를 쓴다: cmdk 1.1.1(Radix Popover 1.3.1 안에 렌더링), react-day-picker 10.0.2 + date-fns 4.4.0 `ko` 로캘 | react-day-picker v10 API는 run 단계에서 확인한다(shadcn/ui 예제는 v9 기준, 6.5절 6번). cmdk의 ARIA 속성도 확인한다(6.5절 7번) |

---

## 18. 검증 기록

| 구분 | 내용 |
|---|---|
| 주장 | (1) 5절 면·톤 토큰의 대비 104쌍(라이트 52, 다크 52)이 모두 WCAG 기준을 충족한다. (2) 13.1절 예약 상태 토큰의 대비 90개 값(상태 5 × 테마 2 × 측정 9)이 모두 기준을 충족한다. (3) 13.2절의 구분성 값은 아래 방법으로 계산했다 |
| 증거 | (1) `python3 -I verify_tokens.py` 출력: `FAILS 0`, 최저 `light text 4.86 (T16)`, `light ui 3.04 (U04)`, `dark text 5.39 (T11)`, `dark ui 3.03 (U04)`. (2) `python3 -I verify_status.py` 출력: `FAILS 0`, 최저 `light text 4.66 (reserved muted-fg/bg)`, `light ui 3.95 (cancelled rail/bg)`, `dark text 5.44 (no-show muted-fg/bg)`, `dark ui 4.46 (reserved rail/bg)`. (3) 같은 스크립트의 CIEDE2000 자체 검증값 `2.0425`(Sharma et al. 2005 기준 쌍과 일치). 5.5절과 13.2절의 표는 스크립트가 문서에 직접 써 넣었다(세션 임시 디렉터리, 2026-10-29 실행) |
| 기준 | WCAG 2.x 상대 휘도 공식(일반 텍스트 4.5:1, UI 컴포넌트·그래픽 3:1), CIEDE2000, Machado et al. 2009 색각 이상 근사(심도 1.0, 선형 RGB에 적용) |
| 미검증 | (1) 6.5절의 7개 항목(Tailwind 4 동작, `tnum`, react-day-picker v10 API, cmdk ARIA) — 패키지를 설치하지 않았다. (2) 실제 렌더링 화면 — 이 SPEC 단계에서는 화면을 만들지 않았다. (3) 색각 이상 값은 행렬 근사이며 실제 사용자 검증이 아니다. (4) 불투명도 수정자를 쓴 장식 테두리의 대비 — 장식이라 계산하지 않았다. (5) 백엔드 enum·라벨과 네이티브 앱의 색 값은 오케스트레이터가 확인해 전달한 값이며, 이 문서를 쓰면서 두 저장소의 소스를 직접 읽지는 않았다 |
| 남은 위험 | 방문함 ↔ 완료(D형), 예약됨 ↔ 방문함(다크, P형)은 색만으로 구분되지 않으므로 아이콘·라벨 필수 규칙에 의존한다. 예약됨 배지 면은 선택 행 위에서 묻힌다. 취소됨과 위험, 노쇼와 주의가 같은 색 계열이라 함께 쓰면 의미가 섞일 수 있다(13.3절 규칙으로 관리). 다크의 위험색(`#ff9aaa`)은 파스텔에 가까워 경고성이 약하게 보일 수 있다. 방문함·완료의 업무 의미가 SPEC-UI-002에서 확정되면 방문함 아이콘(`DoorOpen`)을 다시 검토할 수 있다 |
