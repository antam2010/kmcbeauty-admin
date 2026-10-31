# SPEC-UI-001 구현 설계

| 항목 | 내용 |
|---|---|
| 역할 | 이 SPEC의 구현 구조를 정한다: 파일 구성, 컴포넌트 작성 규약, 명령형 API, 토큰 파이프라인, 고급 입력 구조, 미리보기, 테스트 장치, 배포 가드 |
| 기준 | spec.md 0.3.1 |
| 시각 값 | 색·크기·간격·반경·그림자·모션 값은 `.moai/design/system.md`(정본)와 `design-direction.md`(근거)를 따른다. 이 문서는 값을 다시 적지 않고 절 번호만 가리킨다 |
| 관련 | `spec.md`(요구사항), `plan.md`(마일스톤, 공개 인터페이스 §A.5, 키보드 계약 §A.6-8, MX 계획 §E.5), `research.md`(라이브러리 검증 §5~§7, 추가 확인 §6.14), `acceptance.md`(인수 기준과 기대값 표) |

## 1. 설계 원칙

1. **소스 소유형 컴포넌트** — shadcn/ui 방식대로 Radix 프리미티브 + class-variance-authority(CVA) + `cn`으로 만들고, 코드는 이 저장소가 소유한다.
2. **토큰은 한 곳** — 값은 `src/styles/tokens.css` 하나에만 두고, Tailwind에는 이름만 연결하며, 컴포넌트는 토큰 유틸리티만 쓴다.
3. **도메인을 모른다** — ui-core는 예약·고객·시술을 모른다. 도메인 색과 아이콘은 `className`·`icon`·색 값으로 주입받는다.
4. **라우터·상태 관리에 기대지 않는다** — 링크는 주입받고, 상태는 제어형 props로 받는다. 전역 상태는 명령형 API 두 개(토스트, 확인 대화상자)뿐이다.
5. **검증할 수 있는 계약** — 공개 동작은 역할·접근 이름·aria 속성으로 테스트한다. 클래스 문자열은 계약에 해당할 때만 확인한다.
6. **라이브러리 기본 동작은 확인하고, 더하는 동작은 RED부터** — Radix·cmdk·react-day-picker의 기본 동작은 배포 소스에서 확인한 사실에만 기대고(research.md §6.14), 그 위에 더하는 동작은 실패하는 테스트를 먼저 쓴다.

## 2. 디렉터리 구성

```text
.
├─ index.html                    # <html lang="ko">, <head>의 테마 초기화 인라인 스크립트(data-theme-init, 모듈 스크립트보다 앞)
├─ vite.config.ts                # react(), tailwindcss(), 별칭 @ → src, Vitest 설정(test). 기존 /api 프록시는 두지 않는다
├─ tsconfig.json                 # 단일 설정: src + vite.config.ts(references·files 없음)
├─ biome.json                    # 린트·서식(.claude·.moai·.vscode·dist·coverage·node_modules 제외)
├─ deploy.sh                     # npm 빌드 + 배포 중지 가드(§13)
└─ src/
   ├─ main.tsx                   # StrictMode > ThemeProvider > PreviewPage + Toaster + ConfirmDialogHost
   ├─ vite-env.d.ts              # 그대로 유지
   ├─ styles/
   │  ├─ tokens.css              # 런타임 CSS 변수(라이트 :root·.light / 다크 .dark)
   │  ├─ index.css               # Tailwind 가져오기, @theme 정리·매핑, 기본 계층, 키프레임
   │  ├─ contrast.ts             # WCAG 대비 계산(순수 함수)
   │  ├─ tokens.contrast.test.ts
   │  ├─ tokens.sync.test.ts     # system.md 표 ↔ tokens.css·index.css
   │  └─ theme-reset.test.ts
   ├─ ui-core/
   │  ├─ index.ts                # 이름 지정 내보내기 = 공개 API 경계(런타임 이름 40개)
   │  ├─ cn.ts                   # clsx + tailwind-merge(테마 이름 등록)
   │  ├─ <component>.tsx         # 29개, kebab-case(plan.md §A.3)
   │  └─ <component>.test.tsx    # 같은 이름의 테스트(cn.test.ts 포함 30개)
   ├─ preview/
   │  ├─ PreviewPage.tsx         # 건너뛰기 링크 + 페이지 머리(PageHeader h1) + 목차 + 섹션 9개
   │  ├─ PreviewSection.tsx      # 섹션 제목(h2)·앵커 공통 틀
   │  ├─ showcase.ts             # 전시 목록(컴포넌트 → 상태) = acceptance.md AC-UI-001-14 표
   │  ├─ PreviewPage.test.tsx
   │  └─ sections/               # Tokens, Actions, Feedback, Forms, AdvancedInputs, Overlays, Data, Navigation, Verification
   └─ test/
      ├─ setup.ts                # jest-dom, 정리, 브라우저 API 대체, 스토어 초기화
      ├─ axe.ts                  # expectNoAxeViolations(container)
      ├─ design-rules.test.ts    # 금지 패턴·lucide 정식 이름·경계·공개 내보내기 목록
      ├─ theme-init.test.ts      # index.html 인라인 스크립트와 위치
      ├─ deploy-guard.test.ts    # deploy.sh 가드(임시 디렉터리, 대역 npm·scp)
      └─ dependency-pins.test.ts # package.json ↔ 고정 목록
```

## 3. 이름과 가져오기 규칙

- ui-core 파일은 kebab-case(`date-time-picker.tsx`), 컴포넌트·타입은 PascalCase, 훅은 `use*`, 명령형 함수는 camelCase(`toast`, `showConfirm`)다. 미리보기의 화면 구성 요소 파일은 PascalCase다.
- 이름 있는 내보내기만 쓰고 default export는 쓰지 않는다.
- 소비 측(미리보기, SPEC-UI-002)은 `@/ui-core`에서만 가져온다. 하위 경로(`@/ui-core/button`) 가져오기는 규칙 점검 테스트가 막는다.
- ui-core 안에서는 상대 경로(`./button`)로 서로를 가져오고 `index.ts`를 거치지 않는다(순환 참조 방지).
- 별칭: `@/*` → `src/*`(tsconfig `paths`, Vite `resolve.alias`). `@/ui-core`는 `src/ui-core/index.ts`로 풀린다. `baseUrl`은 쓰지 않는다(TypeScript 7 호환, plan.md §A.8).
- `index.ts`는 `export *`를 쓰지 않고 공개할 이름을 하나씩 다시 내보낸다(`export { Button } from "./button"`, 타입은 `export type { … }`). 공개 이름은 plan.md §A.5의 런타임 40개와 타입 목록이다. 테스트에서만 쓰는 함수(명령형 스토어 초기화)와 컴포넌트끼리 공유하는 내부 훅은 모듈 파일에서 내보내되 `index.ts`에는 넣지 않는다. 남는 이름은 공개 내보내기 목록 테스트가 잡는다(AC-UI-001-09).

## 4. 컴포넌트 작성 규약

### 4.1 기본 골격

- React 19 방식으로 `forwardRef` 없이 `ref`를 일반 prop으로 받는다. props 타입은 감싸는 요소의 네이티브 props(`React.ComponentProps<"button">` 등)를 확장한다.
- Radix 기반 컴포넌트는 Radix 부품을 감싸고 스타일만 토큰 유틸리티로 입힌다. `asChild`는 Radix Slot으로 구현한다.
- 여러 부분으로 된 컴포넌트(Card 등)는 같은 파일 안의 조합형 부품으로 만든다.
- 루트 요소의 클래스는 `cn(기본, 변형, className)` 순서로 합쳐 소비 측 `className`이 마지막에 이기게 한다.

### 4.2 변형과 클래스 병합

- 변형(`variant`·`size`·`tone`)은 CVA로 정의하고 `defaultVariants`를 명시한다.
- 변형 클래스에는 system.md §3의 토큰 유틸리티만 쓴다. shadcn/ui 소스를 옮길 때의 이름 변환은 design-direction.md §6.3 표를 따른다.
- `cn`은 tailwind-merge의 `extendTailwindMerge`로 이 시스템의 테마 이름을 등록한다: 글자 크기(`caption`·`body-sm`·`body`·`subtitle`·`title`·`heading`·`display`), 반경(`panel`·`control`·`badge`·`chip`), 그림자(`raised`·`overlay`), 폭(`content`·`reading`·`dialog-sm`·`dialog-md`·`dialog-lg`). 색 이름은 기본 분류로 충분한지 `cn.test.ts`에서 확인하고, 부족하면 색 이름도 등록한다(research.md §6.8). `cn.test.ts`는 ui-core 안에 있으므로 상태 클래스(`status-*`)를 쓰지 않고 중립 토큰(`bg-muted`, `bg-primary-subtle`)으로 병합을 확인한다.

### 4.3 접근성 기본값

- **포커스**: 키보드 포커스가 닿는 요소에 `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring` 세 클래스를 모두 붙인다(텍스트 입력은 `focus-visible:border-ring`도). box-shadow 링과 `outline-none`은 쓰지 않는다(system.md §8).
- **테두리**: 입력·선택 컨트롤(Input, Textarea, Select 트리거, Checkbox, Search, Combobox 입력, DateTimePicker 트리거)은 `border-input`(D5, 3:1)을 쓴다. 장식용 `border-border`는 패널·구분선에만 쓴다.
- **선택 상태 단서**: 배경 채움(`bg-primary-subtle`, `bg-primary`, `bg-accent`)으로 구분하는 선택·현재 상태에는 강제 색 모드에서도 남는 단서를 선택된 항목에만 붙인다(REQ-UI-001-025). 메뉴형(Sidebar 활성, Filter·ThemeToggle 선택, Pagination 현재 쪽)은 `font-semibold`(system.md §8 selected)에 `forced-colors:` 변형의 테두리를 더하고, Tabs 활성은 밑줄 테두리, Calendar 선택 날짜와 Combobox 하이라이트 옵션은 `forced-colors:` 윤곽선, Select 선택 옵션은 체크 아이콘을 쓴다. Select 하이라이트 옵션은 포커스를 받는 요소이므로 위 포커스 윤곽선(`focus-visible`, AC-UI-001-11)으로 구분한다.
- **비활성**: 불투명도 50%와 `cursor-not-allowed`. 처리 중(loading)은 `disabled`가 아니라 `aria-busy` + `aria-disabled`(R16).
- **아이콘**: lucide 정식 이름만 쓴다. 접근 이름 속성이 없으면 lucide가 `aria-hidden`을 붙인다(research.md §6.5). 아이콘 전용 버튼에는 `aria-label`이 필수다. Input의 글자 부가 표시("원", "분")는 id를 붙여 입력의 `aria-describedby`에 넣고, 아이콘 부가 표시는 숨긴다.
- **누를 수 있는 영역**: 최소 32×32px(system.md §5).

### 4.4 기본 문구

컴포넌트 안의 기본 문구는 한국어이고 props로 바꿀 수 있다: "불러오는 중…", "닫기", "알림 닫기", "알림 ({hotkey})", "검색어 지우기", "선택", "날짜 선택", "결과 {n}개", "일치하는 항목이 없어요.", "작성 중인 내용이 사라져요. 닫을까요?", "계속 작성", "페이지 이동", "이전", "다음", "현재 위치", "주 메뉴", "테마", "라이트", "다크", "시스템", "취소". 문장은 해요체다(system.md §11). 미리보기 테스트가 렌더링된 문장의 종결이 해요체인지 확인한다(AC-UI-001-14).

### 4.5 Field 연결

- `Field`가 React `useId`로 컨트롤 id·설명 id·오류 id를 만들고 문맥(context)으로 내려 준다.
- 컨트롤은 내부 훅 `useFieldControl()`로 `id`, `aria-describedby`(실제로 렌더링한 설명·오류만), `aria-invalid`, 필수 여부를 받아 자신의 대상 요소에 붙인다. 대상 요소는 Input·Textarea는 입력 요소, Select는 트리거, Checkbox는 체크 버튼, Combobox는 입력, DateTimePicker는 트리거다.
- 필수 여부는 대상 요소에 따라 다르게 붙인다: 네이티브 입력(Input·Textarea·Combobox 입력)은 `required`, 버튼형 대상(Select 트리거·Checkbox·DateTimePicker 트리거)은 `aria-required="true"`. 버튼에는 `required` 속성이 유효하지 않기 때문이다.
- `aria-describedby`는 설명 → 오류 → 컨트롤 자신의 글자 부가 표시 순으로 잇는다.
- Field 밖에서 쓰면 컨트롤 자신의 props를 그대로 쓴다.
- 이 훅은 컨트롤 6개가 공유하는 계약이므로 `@MX:ANCHOR` 대상이다(plan.md §E.5).

### 4.6 Modal 구성

- 머리(제목 + 설명) → 본문 → 바닥 순으로 두고, 닫기 버튼은 DOM 순서상 맨 뒤에 둔 채 모양만 오른쪽 위에 놓는다. Radix Dialog 1.3.1의 FocusScope는 열릴 때 DOM 순서의 첫 포커스 가능 요소에 포커스를 두므로(research.md §6.14), 본문의 첫 입력이 처음 포커스를 받는다. 입력이 없으면 첫 포커스 가능 요소가 받는다.
- 닫기 요청 세 경로(닫기 버튼, Esc = `onEscapeKeyDown`, 스크림 = `onPointerDownOutside`·`onInteractOutside`)를 한곳에서 처리하고, `closeDisabled`를 `dirty`보다 먼저 판정한다. `closeDisabled`면 `dirty`와 상관없이 모두 막고(작성 중 확인도 띄우지 않음) 닫기 버튼에 `aria-disabled="true"`를 단다. 그 밖에 `dirty`면 막은 뒤 확인 대화상자("작성 중인 내용이 사라져요. 닫을까요?", [계속 작성] [닫기])를 띄워 "닫기"일 때만 `onOpenChange(false)`를 부른다. 둘 다 아니면 바로 닫는다.
- 설명이 없으면 `aria-describedby={undefined}`를 줘 연결하지 않는다(콘솔 경고 0).

## 5. 명령형 API — 토스트와 확인 대화상자

### 5.1 공통 구조

- 모듈 수준 저장소(구독 함수 + 스냅숏)를 두고, Host 컴포넌트가 React `useSyncExternalStore`로 구독한다. 상태 관리 라이브러리는 쓰지 않는다.
- Host(`Toaster`, `ConfirmDialogHost`)는 앱 루트(`src/main.tsx`)에 하나씩 둔다. Host가 아직 없을 때의 호출은 저장소에 남았다가 Host가 붙으면 보인다.
- 테스트는 `src/test/setup.ts`에서 매 테스트 뒤 저장소를 비운다. 초기화 함수는 모듈 파일에서 내보내고 `index.ts`에는 넣지 않는다. 전역 가변 상태이므로 `@MX:WARN` 대상이다.

### 5.2 `toast`

- 저장소: 항목 배열(id, tone, 메시지, 설명, 동작).
- `toast.success`·`info`·`warning`·`error`는 항목을 끝에 넣고 id를 돌려준다. `toast.dismiss(id)`는 항목을 지운다(없는 id는 무시).
- `Toaster`는 Radix `Toast.Provider`(기본 `duration` 5000, `swipeDirection` "right", `swipeThreshold` 50)와 `Toast.Viewport`(`label="알림 ({hotkey})"`, 기본 단축키 F8)로 구성한다. 앞에서부터 3개만 `Toast.Root`로 렌더링하고 나머지는 대기시킨다. 닫히면(`onOpenChange(false)`) 항목을 지우고 다음 대기 항목이 보인다.
- 표시 시간은 success·info 5000ms, warning 7000ms, destructive는 `Infinity`(Radix가 타이머를 시작하지 않는다). destructive는 `type="foreground"`(assertive), 나머지는 background(polite)다.
- 멈춤: Radix는 알림 영역에서 포인터가 움직이거나 포커스가 들어오면 타이머를 멈추고, 포인터가 떠나거나(포커스가 안에 없을 때) 포커스가 영역 밖으로 나가면 남은 시간으로 다시 시작한다. 창이 포커스를 잃어도 멈춘다. 이 동작을 바꾸는 props를 쓰지 않는다(WCAG 2.2.1).
- 닫기: "알림 닫기" 버튼(`Toast.Close`), 포커스된 알림의 Esc, 스와이프(Radix 기본 동작 — jsdom에서 확인하지 않고 브라우저에서 수동 확인). 알림이 가장 위 레이어이면 포커스가 알림 밖에 있어도 Esc가 그 알림을 먼저 닫는다(Radix `DismissableLayer`). 대화상자가 열린 뒤 알림이 뜨면 첫 Esc는 알림을, 다음 Esc는 대화상자를 닫는다(plan.md §B B-20).
- 아이콘·위치·z 순서는 design-direction.md §12.4와 system.md §7을 따른다. 동작 버튼은 하나까지다.
- 기존 호출 `useNotificationStore.getState().show(message, type)`는 `toast.success|info|error(message)`로 바뀐다.

### 5.3 `showConfirm`

- 저장소: 요청 대기열(먼저 들어온 순서). `showConfirm(options)`는 Promise를 만들어 요청을 넣고 그 resolve를 보관한다.
- `ConfirmDialogHost`는 맨 앞 요청 하나만 `ConfirmDialog`(Radix AlertDialog)로 렌더링한다. 처음 포커스는 취소 버튼이다(Radix AlertDialog 1.2.1 기본 동작).
- 취소·Esc → `false`. 확인 → `onConfirm`이 없으면 `true`. 있으면 확인 버튼을 loading으로 두고 기다린 뒤, 성공하면 `true`로 닫고, 실패하면 대화상자 안에 destructive Alert(`live`)를 띄워 그대로 둔다(다시 확인하거나 취소할 수 있다).
- 닫히면 대기열의 다음 요청이 열린다. 선언형 `ConfirmDialog`(제어형 `open`)도 공개한다.
- 기존 호출 `useConfirmStore.getState().showConfirm(title, description)`은 `showConfirm({ title, description, confirmLabel, tone })`으로 바뀐다. 이름을 `confirm`으로 하지 않은 이유는 plan.md §A.5에 있다.

## 6. 토큰과 테마 파이프라인

### 6.1 흐름

```text
system.md §2~§6(값의 정본)
  → src/styles/tokens.css        런타임 CSS 변수: :root·.light(라이트), .dark(다크)
  → src/styles/index.css         @theme 정리(initial) → @theme inline으로 이름 연결
  → Tailwind 유틸리티            bg-card, text-muted-foreground, rounded-panel, shadow-raised, text-body …
  → 컴포넌트 클래스               CVA 변형 + cn
테마 전환 = <html>의 .dark 클래스 하나 → 변수 값만 바뀐다
값 확인 = tokens.sync.test.ts가 system.md 표를 직접 읽어 비교한다
```

### 6.2 `tokens.css`

- `:root, .light`에 라이트 값과 `color-scheme: light`, `.dark`에 다크 값과 `color-scheme: dark`를 둔다. 테마와 무관한 `--radius`·`--sidebar-width`·`--sidebar-width-collapsed`는 `:root`에 둔다.
- `info` 계열은 `primary`의 별칭(`var()`)으로 둔다. 런타임 변수 이름과 Tailwind 테마 변수 이름은 겹치지 않게 한다(system.md §3).
- `.light` 선택자는 미리보기에서 라이트와 다크를 나란히 보여 주려고 둔다.
- 값이 system.md와 다르면 토큰 동기화 테스트가, 대비가 기록값과 다르면 대비 테스트가 깨진다. 이 실패가 system.md §13 변경 절차를 강제한다.

### 6.3 `index.css`

구성 순서는 plan.md §I.5와 같다. 설계상 요점은 세 가지다.

1. **정리용 `@theme`과 매핑용 `@theme inline`을 나눈다.** 정리용 블록에서 `--color-*`·`--radius-*`·`--shadow-*`·`--text-*`를 `initial`로 지우고 글꼴·글자 크기(줄높이·자간 하위 값)·폭·애니메이션 키를 다시 정의한다. 매핑용 블록에서 색 51개(색 36 + 상태 15)·반경 4개·그림자 2개를 런타임 변수에 연결한다. 이렇게 나누면 design-direction.md §6.5-1의 불확실성(`@theme inline` 안에서 `initial`을 써도 되는지)을 피한다.
2. **소스 감지 범위를 좁힌다.** `@import "tailwindcss" source("..")`로 `src/`만 훑어 `.claude/`·`.moai/` 문서의 클래스 이름이 CSS로 생성되지 않게 한다(research.md §6.7).
3. **전역 CSS는 기본 계층만** — body 글꼴·색·배경, 줄바꿈(`keep-all`·`break-word`), 기본 테두리 색, 감속 모드 안전망. 전역 클래스는 두지 않는다(R1).

### 6.4 테마 전환

- 저장 키 `kmc-admin-theme`, 값 `light`·`dark`·`system`. 판정 규칙 하나(`resolveTheme(preference, prefersDark)`)를 ThemeProvider가 쓰고, 같은 규칙을 `index.html` 인라인 스크립트가 복제한다. 두 곳에 정의되므로 `@MX:WARN` 대상이고, `theme-init.test.ts`가 스크립트의 저장 키와 판정을 acceptance.md AC-UI-001-08 표로 확인한다.
- ThemeProvider: 마운트 때 저장값을 읽고(실패하거나 잘못되면 `system`), 선택이 `system`인 동안에만 `matchMedia("(prefers-color-scheme: dark)")` 변화를 구독한다. `setPreference`는 먼저 `<html>` 클래스와 상태를 바꾼 뒤 저장을 시도하고, 저장이 예외를 던지면 삼켜 그 세션 동안 메모리의 선택을 유지한다.
- 인라인 스크립트: `<head>` 안에서 `type="module"` 스크립트보다 앞에 둔다(첫 렌더링 전 실행). 저장소 접근 예외와 잘못된 값은 시스템 판정으로 처리하고, 예외를 밖으로 던지지 않는다.
- ThemeToggle과 Filter: Radix ToggleGroup 단일 선택(`radiogroup`). Radix의 방향키는 포커스만 옮기므로(roving focus — research.md §6.14), APG 라디오 묶음처럼 방향키가 선택도 함께 옮기도록 보탠다. 루트 `onKeyDown`에서 방향키·Home·End 입력을 표시해 두고, 그 표시가 있을 때 포커스를 받은 항목을 선택한다. Tab으로 들어올 때는 선택을 바꾸지 않는다. 선택된 항목을 다시 눌러 빈 값이 오면 무시해 해제되지 않게 한다. 이 보강은 M1에서 `theme-toggle.tsx`에 두고, M3에서 Filter를 만들 때 `filter.tsx`의 내부 훅으로 옮겨 ThemeToggle이 가져다 쓴다(공개 API 아님).

### 6.5 모션·감속 모드·고대비

- 키프레임은 `@theme`의 `--animate-*`로 정의하고 Radix의 `data-state`·`data-side` 속성에 연결한다. 시간과 이징은 system.md §7을 따른다.
- 컴포넌트는 애니메이션 클래스를 `motion-safe:` 조건 아래에만 붙인다(조건 없는 `animate-*`는 규칙 점검 테스트가 막는다). 기본 계층에는 감속 모드 안전망(애니메이션·전환 시간 0.01ms, 반복 1회)을 둔다.
- 고대비 모드: 경계는 `border`, 포커스는 `outline`으로만 그린다. `outline-hidden`이 forced-colors에서 윤곽선을 남기는지는 `theme-reset.test.ts`가 확인한다. 선택 상태 단서는 §4.3을 따른다.

## 7. 고급 입력 구조

### 7.1 Combobox

cmdk 1.1.1은 입력의 `aria-expanded`(항상 `true`)·`id`·`aria-labelledby`·`aria-controls`를 고정하고 Home/End를 가로챈다(research.md §6.3). 그래서 두 구조를 준비하고, M4의 첫 RED 테스트(AC-UI-001-18·19)로 하나를 확정한다. 테스트는 두 구조에 같은 기대값을 쓴다.

**1순위 — 직접 만든 입력 + cmdk 목록**

```text
Command(cmdk 루트, shouldFilter=false, 제어형 value)  ← 키보드 처리(↓↑·Enter, IME 조합 중 무시)
├─ Popover.Root(Radix)
│  ├─ Popover.Anchor
│  │  └─ <input role="combobox"                   ← Field의 id·라벨·설명·오류·required를 그대로 사용
│  │            aria-expanded={open} aria-controls={목록 id}
│  │            aria-activedescendant={하이라이트 id} aria-autocomplete="list">
│  └─ Popover.Content(role 덮어씀, 포커스 자동 이동 막음)
│     └─ Command.List                             ← 옵션 · 불러오는 중 · 빈 결과 · 새 값 만들기
└─ 숨긴 aria-live="polite" 영역                     ← 결과 개수, 빈 결과 문구
```

- 목록 id는 `Command.List`의 DOM id를 ref로 읽어 `aria-controls`에 넣는다(cmdk가 id를 정한다).
- 하이라이트 id는 cmdk 루트의 하이라이트 변경 알림 뒤 `[cmdk-item][data-selected="true"]`의 id를 읽어 `aria-activedescendant`에 넣는다. 이 속성은 cmdk가 스타일용으로 공개한 것이지만 버전이 바뀌면 다시 확인해야 하므로 `@MX:WARN` 대상이다.
- **하이라이트**: cmdk 1.1.1은 항목이 등록될 때 하이라이트 값이 없으면 첫 활성 항목을 고르고, 하이라이트된 항목이 사라지면 다시 첫 항목을 고른다(research.md §6.14). 1순위 구조는 cmdk 검색어를 쓰지 않으므로, 입력 글자가 바뀔 때마다 루트의 제어형 `value`를 첫 활성 옵션 값으로 되돌린다. `loop`는 기본값(꺼짐)을 그대로 둔다.
- **선택**: Enter나 클릭으로 고르면 `onValueChange(옵션 값)`을 부르고, 입력에 옵션 라벨을 보이며, 목록을 닫는다.
- **닫기·지우기**: 열린 상태의 Esc는 목록만 닫는다(값 그대로). 닫힌 상태의 Esc는 입력을 비우고 `onValueChange(null)`을 부른다. 바깥을 누르면 닫히되 입력을 누를 때는 닫히지 않는다.
- **포커스 이탈**: 고르지 않고 포커스가 입력과 목록 밖으로 나가면 목록을 닫고 입력을 선택된 라벨(없으면 빈 문자열)로 되돌린다. `onValueChange`는 부르지 않는다.
- **값 동기화**: 닫혀 있는 동안 `value`가 바뀌면 입력을 그 옵션의 라벨로 맞춘다(옵션에 없으면 `valueLabel`). 열려 있는 동안(사용자가 입력 중)에는 입력을 덮어쓰지 않고 닫힐 때 맞춘다. `inputValue`를 제어하는 소비 측에는 되돌리기·맞추기도 `onInputValueChange`로 알린다.
- **거르기**: 로컬 모드는 라벨·키워드 부분 일치로 직접 거르고, 원격 모드는 받은 옵션을 그대로 보여 준다. 디바운스는 소비 측(SPEC-UI-002)의 몫이다.
- **알림(두 모드 공통)**: 목록이 열려 있고 로딩이 아닐 때 숨긴 `aria-live="polite"` 영역에 "결과 {n}개" 또는 빈 결과 문구를 넣는다. 로딩이면 목록 안에 `role="status"` 불러오는 중 표시를 두고 개수를 알리지 않는다.
- **새 값 만들기**: `createAction`이 있고, 앞뒤 공백을 지운 입력이 비어 있지 않으며, 그 입력과 라벨이 똑같은 옵션이 없으면 목록 끝에 `createAction.label(입력)` 항목을 둔다. 고르면 `createAction.onSelect(입력)`을 부른다. 거르기 방식과 상관없다.
- **Home/End**: 입력의 `onKeyDown`에서 전파를 멈춰 cmdk가 가로채지 않게 한다. **IME**: cmdk가 조합 중 키를 무시하고, 우리 Enter 처리도 `isComposing`과 `keyCode === 229`를 확인한다.
- Popover.Content의 `role="dialog"`는 덮어쓴다(Radix가 사용자 props를 뒤에 펼친다 — research.md §6.6). 콤보박스의 팝업 의미는 listbox가 맡는다.

**2순위 — `Command.Input` + 보정**: cmdk 입력을 그대로 쓰고, 열림 상태를 레이아웃 효과로 `aria-expanded`에 덮어쓰며, 접근 이름은 cmdk `label`로 Field 라벨과 맞춘다. 1순위가 RED 테스트를 통과하지 못할 때만 쓴다. 둘 다 실패하면 D9를 뒤집는 결정이므로 blocker로 보고한다.

### 7.2 Calendar와 DateTimePicker

- **Calendar** — react-day-picker 10.0.2의 `DayPicker`를 단일 선택(`mode="single"`)으로 감싼다.
  - 로캘은 `react-day-picker/locale`의 `ko`(DayPicker 전용 번역 포함), 주 시작은 일요일(`weekStartsOn: 0`)이다.
  - 키보드는 react-day-picker 기본 키 표를 그대로 쓴다: ←/→ 하루(Shift와 함께면 한 달), ↑/↓ 한 주(Shift와 함께면 한 해), PageUp/PageDown 한 달(Shift와 함께면 한 해), Home/End 그 주의 시작·끝(일·토). 비활성 날짜는 건너뛴다(research.md §6.14).
  - 월 머리는 react-day-picker가 `ko`를 연도 먼저 로캘로 보고 `Intl.DateTimeFormat`으로 만드는 "2026년 10월"을 그대로 쓴다.
  - `classNames`는 UI 요소 키(`root`, `month_caption`, `nav`, `button_previous`, `button_next`, `month_grid`, `weekday`, `day`, `day_button`, `selected`, `today`, `outside`, `disabled` 등 — research.md §6.4)를 모두 토큰 유틸리티로 지정한다. 패키지의 기본 CSS는 가져오지 않는다.
  - 주말은 `modifiers`(요일 0·6)와 `modifiersClassNames`로 각각 `text-destructive`·`text-primary`를 준다(design-direction.md §12.3). 선택 날짜는 `forced-colors:` 윤곽선 단서를 가진다(§4.3).
  - 공개 API는 `isDateDisabled(date)` 함수로 감싸 라이브러리의 matcher 타입을 드러내지 않는다. react-day-picker 의존은 이 파일에만 둔다.
- **DateTimePicker** — 트리거(Input 모양 버튼, 값이 없으면 "날짜 선택")를 누르면 Radix Popover(대화상자 역할, 접근 이름 "날짜 선택") 안에 Calendar와 시간 Select가 열린다.
  - **첫 포커스**: Popover의 기본 자동 포커스(DOM 순서의 첫 요소 = 이전 달 버튼)를 `onOpenAutoFocus`에서 막고, 선택 날짜 → 오늘 → 이 달의 첫 활성 날짜 순으로 찾은 날짜 버튼에 포커스를 둔다(APG 날짜 선택 대화상자).
  - **진행 중 날짜**: 값이 없을 때 날짜를 고르면 대화상자 안에서만 그 날짜를 선택 표시하고, `onValueChange`는 부르지 않으며, 포커스를 시간 칸 트리거로 옮긴다. 시간을 고르면 날짜와 합친 로컬 시각 `Date`로 `onValueChange`를 한 번 부르고 닫는다. 시간 없이 닫으면 진행 중 날짜는 버린다. 예약 시각을 잘못 정하는 일을 막기 위해 기본 시간은 두지 않는다.
  - **날짜만 바꾸기**: 값이 있을 때 날짜만 바꾸면 기존 시·분을 유지한 `Date`로 바로 알린다(대화상자는 열린 채).
  - **`granularity="date"`**: 시간 칸이 없고, 날짜를 고르면 그날 00:00의 `Date`로 알리고 닫는다.
  - **시간 칸**: 순수 함수 `getTimeSlots(start, end, stepMinutes)`(date-fns)로 만든다. 끝 시각이 간격과 맞으면 포함하고, 맞지 않으면 끝 이전의 마지막 칸까지다. 라벨은 두 자리 시 `HH:mm`("09:00")이다.
  - **표기**: date-fns `ko` 로캘로 `yyyy. M. d. (EEE) HH:mm`("2026. 10. 29. (목) 14:30"), `granularity="date"`이면 `yyyy. M. d. (EEE)`.
  - Esc로 닫으면 Radix Popover 기본 동작으로 트리거에 포커스가 돌아온다.

## 8. 데이터·탐색 구조

### 8.1 Table

- 네이티브 `table` 위에 `Column<T>`(plan.md §A.5)로 열을 정의한다. `caption`은 화면에서 숨기고, 머리글은 `th scope="col"`이다.
- `sortable` 열의 머리글에는 포커스 클래스 세 개를 가진 `<button>`을 두고 `aria-sort`를 단다. 정렬은 제어형이라 오름 → 내림 → 해제 순환을 `onSortChange`로 알리기만 하고, 실제 정렬은 소비 측(서버의 `sort_by`·`sort_order`)이 한다.
- `align: "end"` 열은 오른쪽 정렬과 `tabular-nums`를 준다.
- 레일: `getRowRail(row)`가 돌려준 색 값(예: 상태 토큰 변수)을 첫 셀의 `border-inline-start: 3px solid <값>` 인라인 스타일로 그린다. 상태와 색의 연결은 도메인 계층이 한다(design-direction.md §15).
- `loading`이면 같은 열 구조의 Skeleton 6행을 `aria-busy` 영역 안에 그리고(300ms 지연은 SkeletonGroup이 처리), 행이 0이면 `empty` 자리를 렌더링한다.
- 가로 스크롤 영역은 `tabIndex=0`과 `aria-label`을 가진다. `inPanel`이면 첫·마지막 셀의 바깥 여백을 패널 여백에 맞춘다(system.md §5).

### 8.2 Sidebar·Breadcrumb

- 링크 컴포넌트 계약은 `{ to, className, "aria-current", children }`이고 기본값은 `<a href={to}>`다. SPEC-UI-002가 라우터 링크를 넘긴다.
- 활성 판정 기본값은 경로 완전 일치다. 접두사 일치로 하면 `/manager` 같은 상위 경로가 하위 화면에서도 활성으로 보이기 때문이다. 접두사 판정이 필요하면 `isActive`를 주입한다.
- 접힘: 아이콘만 보이고 이름은 숨긴 텍스트로 남으며, 포커스·hover 때 오른쪽 Tooltip이 이름을 보인다. 묶음 이름은 구분선으로 바뀐다. 접힘 상태 저장과 화면 폭에 따른 전환은 앱 셸(SPEC-UI-002)이 맡는다.
- 활성 항목은 `bg-primary-subtle` 면에 `font-semibold`와 `forced-colors:` 테두리 단서를 더한다(§4.3).
- 값(폭, 높이, 아이콘 크기)은 system.md §5·§8과 design-direction.md §12.7을 따른다.

### 8.3 PageHeader와 Pagination

- PageHeader의 제목 요소는 `titleAs`로 정한다(기본 `"h1"`, `"h2"`·`"h3"` 허용). 화면당 h1 하나라는 규칙은 기본값이 지키고, 한 화면에 PageHeader를 여럿 보이는 미리보기는 페이지 머리만 기본값을 쓰고 시연용은 `titleAs="h3"`를 쓴다.
- Pagination의 번호 배열은 순수 함수 `getPageItems(page, pageCount)`이 만든다. 현재 쪽 양옆은 한 쪽으로 고정하고 prop으로 열지 않는다(`siblingCount` 없음). `pageCount`가 7 이하이면 모든 쪽 번호를 줄임표 없이 보이고, 8 이상이면 줄임표를 포함해 언제나 7칸이다: 현재 쪽 `p`가 4 이하이면 `1 2 3 4 5 … 끝`, `p`가 `pageCount`−3 이상이면 `1 … 끝−4 끝−3 끝−2 끝−1 끝`, 그 사이면 `1 … p−1 p p+1 … 끝`. 정본은 acceptance.md §3.1 표이고, spec.md REQ-UI-001-023과 같은 규칙이다. 현재 쪽 단서는 §4.3을 따른다.

## 9. 미리보기 페이지

- 단일 페이지이고 라우터가 없다. `src/main.tsx`가 바로 렌더링한다.
- 구성: "본문으로 건너뛰기" 링크(미리보기 전용 — 앱 셸의 건너뛰기 링크는 SPEC-UI-002) → 페이지 머리(PageHeader 기본 h1 "컴포넌트 미리보기", ThemeToggle) → 같은 페이지 앵커 목차 → `<main>` 안 섹션 9개(제목 h2): 토큰, 동작, 피드백, 폼, 고급 입력, 오버레이, 데이터, 탐색, 검증.
- **전시 목록**: `showcase.ts`가 컴포넌트별 전시 상태(acceptance.md AC-UI-001-14 표)를 정의하고, 섹션은 상태마다 시연 요소에 `data-showcase="<컴포넌트>:<상태>"`를 단다. 오버레이(Modal, ConfirmDialog, Toast)는 여는 버튼에 단다. 마일스톤마다 그 마일스톤의 컴포넌트를 목록과 화면에 함께 더한다.
- **라이트·다크**: 전역 ThemeToggle이 페이지 전체(포털 포함)를 바꾸고, 토큰 섹션은 `.light`·`.dark` 래퍼로 두 테마를 나란히 보여 준다.
- **예약 상태 시연**: 미리보기 안에서만 Badge + 상태 토큰 클래스 + 아이콘(`CalendarClock`·`DoorOpen`·`CircleCheck`·`Ban`·`UserX`)을 조합한다. 순서는 system.md §9의 임시 순서(예약됨 → 방문함 → 완료 → 취소됨 → 노쇼)이고, 화면에 "토큰 시연용 조합이에요. 예약 상태 배지는 SPEC-UI-002에서 만들어요."를 보인다. 방문함·완료의 뜻을 전제한 설명은 쓰지 않는다.
- **검증 섹션**(`sections/VerificationSection.tsx`)
  - 기본 테마 정리 시연: 금지 클래스(`bg-rose-700`, `text-white`, `rounded-lg`, `shadow-xl`, `text-sm`)를 글자 그대로 담은 상수 하나를 `// design-rules:allow-start`와 `// design-rules:allow-end` 사이에 두고, 그 클래스를 붙인 상자가 아무 스타일 없이 보이게 한다. Tailwind가 이 파일을 후보로 훑으므로 빌드 CSS에 규칙이 없다는 것이 실제 파이프라인의 증거가 된다(AC-UI-001-06). 문자열을 이어 붙여 만든 클래스는 Tailwind가 보지 못해 증거가 되지 않으므로 쓰지 않는다. 디자인 규칙 점검은 이 표시 사이에서만, 기본 테마 이름 규칙만 건너뛴다. 이것이 이 SPEC의 유일한 허용 구역이다.
  - 자간·포커스 윤곽선 확인.
  - `tnum` 판정: "1111"과 "0000"을 기본 숫자와 `tabular-nums` 두 방식으로 렌더링해 너비를 재고, 같은 파일의 순수 함수 `classifyTnum`이 acceptance.md §3.2 표대로 "지원·기본 고정폭·미지원·측정 불가"를 고른다. 측정값은 브라우저에서 읽어 기록만 하고, 대체 글꼴 결정은 SPEC-UI-002가 한다.
- 예문은 해요체와 실제 업무 예를 쓴다(고객 "김민지", 전화 "010-1234-5678", 시술 "젤 네일 60분 35,000원"). 원격 검색은 지연 응답 목업으로 흉내 내고 네트워크를 쓰지 않는다.

## 10. 테스트 장치

### 10.1 Vitest 설정(`vite.config.ts`의 `test`)

| 항목 | 값 |
|---|---|
| 환경 | `jsdom`. 대비·토큰 동기화·기본 테마 정리·배포 가드·의존성 고정 테스트는 파일 머리의 `@vitest-environment node` |
| 설정 파일 | `src/test/setup.ts` |
| 대상 | `src/**/*.test.{ts,tsx}` |
| 커버리지 | provider `v8`, 대상 `src/ui-core/**/*.{ts,tsx}`, 제외 `src/ui-core/index.ts`·테스트 파일, 임계값 줄·문장·함수 85, 분기 80 |
| 기타 | `restoreMocks: true`. CSS는 처리하지 않는다(컴포넌트 테스트에 필요 없음) |

### 10.2 `setup.ts`

- `@testing-library/jest-dom/vitest` 매처를 불러온다.
- 테스트마다 `cleanup`, `localStorage` 비우기, `<html>` 클래스 초기화, 토스트·확인 저장소 초기화를 한다.
- jsdom에 없는 API는 없을 때만 대체한다: `ResizeObserver`(cmdk 목록·Radix Popper), `Element.prototype.scrollIntoView`(cmdk·Radix Select), 포인터 캡처 함수들(Radix Select), `window.matchMedia`(테마).

### 10.3 횡단 테스트의 구현 방식

- **토큰 동기화** — `tokens.sync.test.ts`가 `.moai/design/system.md`를 읽어 §2 표 4개(면·중립, 톤, 예약 상태, 그림자), §3의 테마 무관 값·반경 식·폭, §4의 글꼴과 글자 크기 표를 파싱하고, `tokens.css` 선택자 블록(`:root, .light` / `.dark`)과 `index.css`의 `@theme` 값과 비교한다. 행 수(14·19·5·2·7)를 먼저 확인해 표를 못 읽으면 실패한다. system.md 표 형식이 바뀌면 이 테스트가 깨지는 것은 의도한 동작이다(system.md §13).
- **대비 회귀** — `contrast.ts`(HEX → 상대 휘도 → 대비)와 `tokens.css` 파서(선택자 블록별 `--이름: 값;` 추출, `var()` 별칭 해석)를 쓴다. 쌍 목록(T01~T36, U01~U16, 상태 9측정)과 기대 HEX·기록 최저값은 테스트 파일 안의 표로 둔다. design-direction.md §5.5의 실행 가능한 사본이며, `@MX:NOTE`로 정본 위치를 밝힌다.
- **기본 테마 정리** — `tailwindcss`가 내보내는 `compile(css, { base, loadStylesheet })`로 `index.css`를 컴파일한다. `@import "tailwindcss"`는 `node_modules`의 CSS 파일을 읽어 주고, 글꼴 패키지 가져오기는 빈 문자열로 바꾼다. `build(후보 클래스)`의 결과 CSS에서 선택자 유무와 하위 값(자간, 줄높이)을 확인한다. 빌드 결과 검사는 acceptance.md §4.1의 명령이 맡는다.
- **디자인 규칙 점검** — node `fs`로 `src/ui-core`(테스트 포함)·`src/preview` 소스와 `src/styles/index.css`를 읽어 정규식 목록으로 검사한다. 규칙: `dark:` 변형, Tailwind 기본 테마 이름 클래스(설치된 `node_modules/tailwindcss/theme.css`의 `--color-*`·`--radius-*`·`--shadow-*`·`--inset-shadow-*`·`--drop-shadow-*`·`--text-shadow-*`·`--text-*`·`--container-*` 변수 이름으로 만든 금지 집합 — acceptance.md AC-UI-001-10), `outline-none`, `hover:opacity-`, box-shadow 포커스 링, 조건 없는 `animate-*`, ui-core의 예약 상태 키 5종·상태 토큰 클래스, 일괄 내보내기 완전성(컴포넌트 파일 29개), 미리보기의 `@/ui-core` 외 경로 가져오기, `index.css`의 허용 밖 클래스 선택자. 허용 구역 표시 사이에서는 기본 테마 이름 규칙만 건너뛴다. 위반은 하나마다 `경로:줄`로 보고한다.
  - lucide 정식 이름: `node_modules/lucide-react/dist/lucide-react.d.ts`에서 `declare const <이름>: LucideIcon;`의 이름 집합(1.64.0 기준 1,999개)을 만들고, 소스가 `lucide-react`에서 값으로 가져오는 이름이 모두 그 집합에 있는지 본다. 별칭은 `export { … 정식 as 별칭 … }`에만 있으므로 집합에 들어가지 않는다.
  - 공개 내보내기 목록: `@/ui-core`를 가져와 키를 정렬해 acceptance.md AC-UI-001-09의 40개와 비교하고, `index.ts`에 `export *`가 없는지 본다.
  - 기반 라이브러리 가져오기: acceptance.md AC-UI-001-09의 표대로 각 컴포넌트 파일이 그 패키지를 가져오는지, `react-day-picker`·`cmdk`가 표에 적힌 파일 밖에서 쓰이지 않는지 본다(REQ-UI-001-010).
  - 자기 검사: 규칙마다 위반 표본을 실제로 잡는지 확인하고, 허용 구역 바로 밖에 둔 표본도 잡는지 확인한다.
- **테마 초기화** — `index.html`에서 `data-theme-init` 표시가 있는 `<script>` 본문을 꺼내 jsdom에서 실행한다(저장소·`matchMedia` 대역 사용). 같은 파일을 파싱해 `<html lang="ko">`인지, 스크립트가 `<head>` 안에서 `type="module"` 스크립트보다 앞인지 확인한다.
- **배포 가드** — `deploy-guard.test.ts`가 `node:child_process`로 임시 디렉터리에서 `bash deploy.sh`를 실행한다. 대역 `npm`·`scp`는 받은 인자를 기록 파일에 적는 셸 스크립트이고 PATH 맨 앞에 둔다. 더미 `.env.stage`는 `example.invalid` 호스트와, 읽히면 표시 파일을 만드는 줄을 담는다. 실제 빌드·네트워크는 일어나지 않는다.
- **의존성 고정** — `dependency-pins.test.ts`가 `package.json`을 읽어 acceptance.md AC-UI-001-01의 고정 목록과 깊게 비교한다(남는 키 없음, 문자열 같음). 비교 함수는 사본으로 자기 검사를 한다(EC-29).
- **미리보기** — `PreviewPage`를 렌더링하고 h1 개수, 섹션 제목 9개, 전시 목록과 `data-showcase` 요소(라이트·다크), axe 결과, 상태 시연 순서와 클래스, `tnum` 판정 문구와 `classifyTnum` 표, 해요체 종결(한글로 끝나는 문장은 `요.`·`요?`)을 확인한다.

### 10.4 컴포넌트 테스트 규칙

- 역할과 접근 이름으로 요소를 찾고(`getByRole`), 입력은 user-event로 흉내 낸다.
- Toast·Skeleton·Combobox 원격 흐름·DateTimePicker는 가짜 타이머를 쓴다. 실제 타이머와 네트워크는 쓰지 않는다.
- 주요 상태마다 `expectNoAxeViolations(container)`를 부른다(`color-contrast` 규칙은 끈다 — 대비는 토큰 테스트가 맡는다).
- 키보드 포커스가 닿는 요소의 포커스 클래스 세 개와, 선택 상태가 있는 컴포넌트의 선택 단서를 확인한다(AC-UI-001-11·12). 키보드 시나리오 테스트의 이름에는 `AC-UI-001-11` 표지를 단다(16개 파일).
- 라이브러리 기본 동작 위에 더하는 동작(ThemeToggle·Filter 방향키 선택, DateTimePicker 첫 포커스와 시간 칸 포커스 이동, Combobox 하이라이트 되돌리기·포커스 이탈 되돌리기)은 RED 실패를 먼저 본다.
- 스냅숏 테스트를 쓰지 않는다. 테스트 이름은 한국어 문장이다.
- TDD 순서를 지키고, 컴포넌트마다 첫 RED 실패 출력 원문을 보존한다(plan.md §E.6).

## 11. 의존 방향

```text
src/main.tsx ──▶ src/preview ──▶ @/ui-core(index.ts) ──▶ 컴포넌트 파일 ──▶ Radix · cmdk · react-day-picker · date-fns · lucide-react · CVA · cn
     │
     └────────▶ src/styles/index.css ──▶ tokens.css
```

- ui-core는 `src/preview`, `src/styles`, 도메인 모듈을 가져오지 않는다.
- ui-core는 라우터, 상태 관리 라이브러리, API 클라이언트를 가져오지 않는다.
- 테스트 장치(`src/test`)는 ui-core를 가져오지만 ui-core는 테스트 장치를 가져오지 않는다(`setup.ts`가 쓰는 초기화 함수는 각 모듈 파일이 내보낸다).

## 12. SPEC-UI-002로 넘기는 연결점

| 연결점 | 이 SPEC이 주는 것 | SPEC-UI-002가 할 일 |
|---|---|---|
| 라우팅 | Sidebar·Breadcrumb의 `linkComponent` | 라우터 링크를 주입하고 앱 셸(상단바, 접힘 저장, 서랍, 앱 셸 건너뛰기 링크)을 조립 |
| 화면 머리 | PageHeader(기본 h1, `titleAs`) | 화면마다 기본값으로 h1 하나 |
| 서버 목록 | Table의 `sort`·`onSortChange`, Pagination의 `page`·`pageCount` | `sort_by`·`sort_order`, `page`·`pages`와 연결 |
| 필터 | Filter의 방향키 선택(선택이 바뀔 때마다 `onValueChange`) | 빠른 연속 선택 때 이전 요청 취소 |
| 예약 상태 | Badge의 `icon`·`className`, Table의 `getRowRail`, 상태 토큰 15개 | 도메인 StatusBadge와 상태 매핑 상수, 방문함·완료의 뜻과 표시 순서 |
| 기존 스토어 | `showConfirm`, `toast` | 옛 `useConfirmStore`·`useNotificationStore` 호출을 옮김 |
| 검색 | Search·Combobox의 즉시 입력 알림 | 300ms 디바운스와 원격 조회 |
| API 프록시 | (M1에서 기존 `/api` 프록시 제거) | `VITE_API_BASE_URL`과 프록시를 다시 정함 |
| FullCalendar | 상태 토큰과 레일 규칙 | `--fc-*` 변수 연결과 이벤트 렌더링 |
| 배포 | `deploy.sh` 배포 중지 가드 | 업무 화면을 되살린 뒤 가드 제거, 미리보기 페이지의 위치(개발 전용 여부) 결정 |
| 숫자 글꼴 | `tnum` 판정 결과 | 대체 숫자 글꼴 도입 여부 결정 |

## 13. 배포 중지 가드

- 위치: `deploy.sh`의 맨 앞, `. .env.stage`(현재 5행)보다 앞.
- 조건: 환경 변수 `ALLOW_PREVIEW_ONLY_DEPLOY`가 정확히 `1`이 아니면 막는다(없음, `0`, `true`, 그 밖의 값 모두).
- 동작: 안내 문구를 출력하고 종료 코드 1로 끝난다. 안내 문구는 기존 스크립트와 같은 합니다체로, 중지 이유(SPEC-UI-002 완료 전까지 앱이 미리보기 전용)와 우회 변수 이름 `ALLOW_PREVIEW_ONLY_DEPLOY`를 담는다. `1`이면 아무것도 출력하지 않고 기존 단계(`.env.stage` 읽기 → 필수 변수 확인 → 빌드 → 전송)를 그대로 실행한다.
- 빌드 명령은 15행 `bun run build --mode stage`를 `npm run build -- --mode stage`로 바꾸고, 나머지 줄은 그대로 둔다.
- 수명: 기존 앱을 걷어내는 M1 커밋부터 SPEC-UI-002가 업무 화면을 되살릴 때까지(결정 지점 1, 2026-10-29).
- 검증: `src/test/deploy-guard.test.ts`(AC-UI-001-04, EC-17)가 임시 디렉터리·더미 `.env.stage`·대역 `npm`·`scp`로 두 경로를 모두 확인한다. 저장소 작업 트리에서 `ALLOW_PREVIEW_ONLY_DEPLOY=1`로 실행하지 않는다.
