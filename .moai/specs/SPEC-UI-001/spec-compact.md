# SPEC-UI-001 발췌 (run 단계용)

> spec.md 0.3.1의 §4(요구사항), §5(변경 표시), §7(인수 기준), §8(제외 범위), §9(영향받는 파일)를 글자 그대로 옮긴 발췌다. 손으로 고치지 않고 spec.md에서 다시 뽑는다. 배경과 제약은 spec.md, 시나리오·기대값 표·경계 사례·품질 게이트는 acceptance.md, 구현 구조는 design.md에 있다.

## 4. 요구사항 (GEARS)

요구사항은 GEARS 형식으로 쓴다. 굵은 **When**·**While**·**Where**는 조건절이고 `(shall)`은 의무다. 원치 않는 상황은 "**When** <발견 조건>, <대상>은 <대응>해야 한다" 꼴로 쓴다. 요구사항 모듈은 5개, 요구사항은 25개다(Tier L 상한). 조건이 있는 의무는 그 절 앞에 조건절을 따로 표시하고, 조건절이 없는 절은 언제나 적용된다. REQ-UI-001-025는 0.2.0에서 더한 고대비 요구사항으로, 모듈 3에 속하므로 번호와 달리 그 자리(014 다음)에 둔다.

### 모듈 1 — 기반 교체

- REQ-UI-001-001: 프로젝트는 `package.json`의 `dependencies`(20개)와 `devDependencies`(17개)를 plan.md §A.8 표와 이름·버전이 정확히 같게(범위 기호 없이, 표에 없는 패키지 없이) 선언하고 npm(`package-lock.json`)으로 설치하며, `npm run typecheck`·`npm run lint`·`npm test`·`npm run build`·`npm run test:coverage` 스크립트를 제공해야 한다(**shall**).
- REQ-UI-001-002: 프로젝트는 기존 관리자 앱의 소스(`src/`의 51개 파일), 새 도구 체계로 대체되는 설정 8개(`tailwind.config.js`, `postcss.config.js`, `eslint.config.js`, `prettier.config.cjs`, `bun.lock`, `tsconfig.app.json`, `tsconfig.node.json`, `public/vite.svg`), 그리고 plan.md §A.8 표에 없는 의존성을 제거해야 한다(**shall**).
- REQ-UI-001-003: 루트 `tsconfig.json`은 프로젝트 참조 없이 `src`와 `vite.config.ts`를 직접 포함하는 단일 설정이어야 하고, 각 마일스톤 커밋은 훅을 건너뛰지 않은 pre-commit 게이트(`moai gate`)와 타입 검사·Biome 검사·`npm test`·`npm run build`를 통과해야 하며, `src/ui-core`의 커버리지는 줄·문장·함수 85% 이상, 분기 80% 이상이어야 한다(**shall**).
- REQ-UI-001-004: `deploy.sh`는 빌드에 bun 대신 `npm run build -- --mode stage`를 써야 하며(**shall**), **When** `deploy.sh`가 실행될 때 `ALLOW_PREVIEW_ONLY_DEPLOY`가 정확히 `1`이 아니면 `deploy.sh`는 `.env.stage`를 읽기 전에 그 변수 이름을 담은 배포 중지 안내를 출력하고 종료 코드 1로 끝나야 하고(**shall**), **When** 그 값이 `1`이면 가드를 지나 기존 배포 단계를 그대로 실행해야 한다(**shall**). 가드를 두는 기간은 C6(M1 커밋부터 SPEC-UI-002 완료까지)을 따른다.

### 모듈 2 — 디자인 토큰과 테마

- REQ-UI-001-005: 디자인 토큰 — 색 36개와 예약 상태 15개의 라이트·다크 값, 테마별 `color-scheme`, 그림자 2개, `--radius`와 파생 반경 4개, 글꼴 2개, 글자 크기 7개(크기·줄높이·자간), 폭 5개, 사이드바 폭 2개(`15rem`·`4rem`) — 은 `.moai/design/system.md` §2~§6의 이름과 값을 그대로 `src/styles/tokens.css`·`src/styles/index.css`에 정의하고, system.md §3의 Tailwind 4 매핑으로 유틸리티(`bg-background`, `rounded-panel`, `text-body` 등)를 만들어야 한다(**shall**).
- REQ-UI-001-006: **When** Tailwind 기본 테마의 팔레트·반경·그림자·글자 크기 클래스(`bg-rose-700`, `text-white`, `rounded-lg`, `shadow-xl`, `text-sm` 등)가 소스나 컴파일 후보에 나타나면, 컴파일된 CSS는 그 클래스의 규칙 수를 0으로 유지해야 하며, 정적 유틸리티(`rounded-full`, `rounded-none`, `bg-transparent`, `bg-current`, `shadow-none`)와 글자 크기 토큰의 줄높이·자간 하위 값은 계속 만들어야 한다(**shall**).
- REQ-UI-001-007: **When** 사용자가 테마 전환에서 라이트·다크·시스템 가운데 하나를 고르면, ThemeProvider는 `<html>`의 `.dark` 클래스를 즉시 갱신하고 선택을 `localStorage`의 `kmc-admin-theme` 키에 저장해야 하며(**shall**), **When** 저장이 실패하면 예외를 밖으로 내보내지 않고 그 세션 동안 선택을 유지해야 한다(**shall**).
- REQ-UI-001-008: `index.html`은 `<html lang="ko">` 문서의 `<head>`에서 모듈 스크립트보다 앞에 둔 인라인 스크립트로, 첫 렌더링 전에 ThemeProvider와 같은 저장 키·판정 규칙(저장값이 없거나 잘못됐거나 저장소 접근이 실패하면 시스템 판정)에 따라 `.dark`를 적용해야 하며(**shall**), **While** 테마 선택이 시스템(기본값)인 동안 ThemeProvider는 `prefers-color-scheme` 변화를 따라 `.dark`를 바꿔야 한다(**shall**).
- REQ-UI-001-009: 토큰의 색 쌍은 design-direction.md §5.5의 기준(텍스트 4.5:1, UI 경계·포커스·그래픽 3:1)을 라이트·다크 모두 충족해야 하며, 이 대비(기준 있는 52쌍 × 2테마, 예약 상태 90개 값)는 `tokens.css`를 직접 읽는 자동 회귀 테스트로 고정되어야 한다(**shall**).

### 모듈 3 — 라이브러리 규약·접근성·미리보기

- REQ-UI-001-010: ui-core는 `src/ui-core/`에 컴포넌트당 파일 하나(plan.md §A.3의 29개)로 구성하고, plan.md §A.3 '기반' 열에 적힌 라이브러리(Radix 프리미티브, class-variance-authority, cmdk, react-day-picker)를 해당 컴포넌트 파일에서 가져와 그 위에 만들어야 하며(acceptance.md AC-UI-001-09의 기반 라이브러리 표), 클래스 병합 함수 `cn`(clsx + tailwind-merge, 이 시스템의 사용자 정의 테마 이름 등록)을 제공해야 하고, `src/ui-core/index.ts`는 `export *` 없이 이름을 지정한 내보내기로 plan.md §A.5의 런타임 공개 이름 40개만 내보내야 하며(테스트 전용 함수 제외), 소비 측은 `@/ui-core`에서만 가져와야 한다(**shall**).
- REQ-UI-001-011: **When** 디자인 규칙 점검이 `src/ui-core`(테스트 포함)·`src/preview` 소스에서 `dark:` 변형, Tailwind 기본 테마 이름을 쓴 클래스(색·반경·그림자·글자 크기·컨테이너 계열 — 금지 이름 집합은 acceptance.md AC-UI-001-10), `outline-none`, `hover:opacity-*`, box-shadow 포커스 링, 조건 없는 `animate-*`, `lucide-react` 정식 이름이 아닌 아이콘 이름(`Loader2`·`Trash2` 같은 별칭)을 발견하거나 ui-core에서 예약 상태 키(`RESERVED`·`VISITED`·`COMPLETED`·`CANCELLED`·`NO_SHOW`)·상태 토큰 클래스(`status-*`)를 발견하면, 점검 테스트는 위반마다 `경로:줄`을 보고하며 실패해야 한다(**shall**). 기본 테마 이름 규칙의 예외는 기본 테마 정리 시연 허용 구역(design.md §9) 하나뿐이다.
- REQ-UI-001-012: 모든 상호작용 컴포넌트는 plan.md §A.6-8 키보드 계약대로 키보드만으로 조작할 수 있어야 하고, 포커스를 box-shadow가 아닌 `outline`(두께 2px, 간격 2px, `ring` 색 — `focus-visible:outline-2`·`outline-offset-2`·`outline-ring`, 텍스트 입력은 테두리도 `ring`)으로 표시해야 하며, 입력·선택 컨트롤의 테두리는 장식용 `border`가 아닌 `input` 토큰(D5)으로 그리고, 장식 아이콘은 보조 기술에서 숨겨야 한다(**shall**).
- REQ-UI-001-013: **While** 사용자 환경이 `prefers-reduced-motion: reduce`인 동안, 컴포넌트는 이동·크기 변화 애니메이션 없이 즉시 표시하고 로딩 스피너 회전과 스켈레톤 깜빡임을 멈춰야 한다(**shall**).
- REQ-UI-001-014: 컴포넌트 미리보기 페이지는 h1 하나(페이지 제목)와 섹션 9개로 plan.md §A.3의 29개 컴포넌트와 그 변형·상태(acceptance.md AC-UI-001-14의 전시 목록)를 라이트와 다크에서 보여 주고, 디자인 토큰(예약 상태 토큰은 system.md §9의 임시 순서 예약됨 → 방문함 → 완료 → 취소됨 → 노쇼로 시연)과 design-direction.md §6.5 확인 항목의 결과(기본 테마 정리 시연, Noto Sans KR Variable `tnum` 판정)를 표시해야 하며, 화면 문장은 해요체로 써야 한다(**shall**).
- REQ-UI-001-025: **While** 고대비(forced-colors) 모드가 켜져 있는 동안, 배경 채움으로 구분되는 선택·현재 상태(Pagination 현재 쪽, Filter·ThemeToggle 선택 항목, Sidebar 활성 항목, Tabs 활성 탭, Calendar 선택 날짜, Select 선택 옵션(체크 아이콘), Select·Combobox 하이라이트 옵션)는 선택된 항목에만 있는 색 아닌 단서(테두리·윤곽선·밑줄·굵기 600 이상·체크 아이콘 가운데 하나 이상)로도 구분되어야 한다(**shall**).

### 모듈 4 — 입력 컴포넌트

- REQ-UI-001-015: Button은 변형 5종(`default`·`outline`·`ghost`·`destructive`·`link`), 크기 5종(`sm`·`default`·`lg`·`icon`·`icon-sm`), `asChild`를 제공해야 하며(**shall**), **While** `loading`인 동안에는 `disabled` 속성 없이 `aria-busy="true"`·`aria-disabled="true"`로 실행만 막고 포커스를 유지해야 하고, **When** `loading`이 끝나면 두 속성을 지우고 다시 실행을 받아야 한다(**shall**).
- REQ-UI-001-016: Field는 라벨·설명·오류를 자식 컨트롤(Input, Textarea, Select, Checkbox, Combobox, DateTimePicker)과 연결해 라벨 `htmlFor`와 컨트롤 `id`를 맞추고 실제로 렌더링한 설명·오류의 id만 `aria-describedby`에 넣어야 하며(**shall**), **While** 오류가 있는 동안에만 `aria-invalid="true"`와 아이콘 + 문장을 표시해야 하고(**shall**), **Where** 필수 항목으로 설정된 경우 네이티브 입력(Input·Textarea·Combobox 입력)에 `required`를, 버튼형 컨트롤(Select 트리거·Checkbox·DateTimePicker 트리거)에 `aria-required="true"`를 붙여야 한다(**shall**).
- REQ-UI-001-017: Input·Textarea·Select·Checkbox·Filter·Search는 system.md §8과 plan.md §A.5·§A.6-8의 계약 — 값과 라벨을 나눈 `{ value, label }` 옵션, Search의 필수 접근 이름과 지우기 버튼, Checkbox의 일부 선택 상태, Filter의 선택 해제 없는 단일 선택 라디오 묶음(방향키가 포커스와 선택을 함께 옮김), Input의 앞뒤 부가 표시(글자는 `aria-describedby`로 연결하고 아이콘은 숨김) — 을 따라야 한다(**shall**).
- REQ-UI-001-018: Combobox는 `role="combobox"` 입력에 실제 열림 상태의 `aria-expanded`, 목록을 가리키는 `aria-controls`, 하이라이트 항목의 `aria-activedescendant`를 연결하고 ↓/↑ 이동, Enter 선택(입력에 고른 라벨을 보이고 목록을 닫음), Esc 닫기를 지원해야 하며(**shall**), **When** 사용자가 입력에 글자를 입력하면 목록을 열어 첫 번째 활성 옵션을 하이라이트해야 하고(**shall**), **When** 목록이 닫힌 상태에서 Esc가 눌리면 입력과 값을 지워야 하며(**shall**), **When** 고르지 않은 채 포커스가 입력과 목록을 벗어나면 입력을 선택된 라벨로 되돌려야 하고(**shall**), **While** 목록이 닫혀 있는 동안 바뀐 `value`는 입력에 반영해야 한다(**shall**). **When** IME 조합 중 Enter가 눌리면 Combobox는 옵션을 고르지 않아야 한다(**shall not**).
- REQ-UI-001-019: Combobox는 거르기 방식과 상관없이 **While** `loading`인 동안 목록 안에 불러오는 중 표시를 보이고 **While** 목록이 열려 있고 로딩이 아닌 동안 결과 개수 또는 빈 결과 문구를 `aria-live="polite"`로 알려야 하며(**shall**), **Where** `createAction`이 지정된 경우 **While** 앞뒤 공백을 지운 입력이 비어 있지 않고 그 입력과 라벨이 똑같은 옵션이 없는 동안 목록 끝에 새 값 만들기 동작을 보여야 하고(**shall**), **Where** 원격 거르기 모드로 설정된 경우 자체 거르기를 끄고 받은 옵션을 그대로 보여 줘야 한다(**shall**).
- REQ-UI-001-020: Calendar는 한국어 월 머리("2026년 10월")와 일요일부터 시작하는 요일 머리를 보이고 APG 날짜 격자 키보드(←/→ 하루, ↑/↓ 한 주, PageUp/PageDown 한 달, Shift+PageUp/PageDown 한 해, Home/End 그 주의 일요일·토요일, Enter·Space 선택)를 지원해야 하며(**shall**), **When** 날짜와 시간이 모두 정해지면 DateTimePicker는 두 값을 로컬 시각의 `Date` 하나로 결합해 `onValueChange`로 한 번 알리고 "2026. 10. 29. (목) 14:30"(시는 두 자리 `HH:mm`)으로 표시해야 하고(**shall**), **When** 값이 있는 상태에서 날짜만 바뀌면 DateTimePicker는 시·분을 유지한 `Date`로 알려야 하며(**shall**), **Where** `granularity="date"`이면 **When** 날짜를 고를 때 DateTimePicker는 그날 00:00의 `Date`로 알리고 닫아야 한다(**shall**). DateTimePicker는 `granularity="datetime"`에서 시간이 정해지기 전에는 `onValueChange`를 부르지 않아야 한다(**shall not**).

### 모듈 5 — 표시·오버레이·탐색 컴포넌트

- REQ-UI-001-021: **When** Modal이나 ConfirmDialog가 열리면, 대화상자는 포커스를 안에 가두고 처음 포커스를 Modal은 본문의 첫 입력 요소에, ConfirmDialog는 취소 버튼에 두어야 하며(**shall**), **When** 대화상자가 닫히면 포커스를 연 요소로 되돌려야 하고(**shall**), **When** 사용자가 ConfirmDialog에서 확인·취소·Esc를 고르면 `showConfirm()`의 Promise를 확인이면(비동기 `onConfirm`이 있으면 성공한 뒤) `true`, 취소·Esc면 `false`로 끝내야 하며(**shall**), **When** 사용자가 닫기 버튼·Esc·스크림으로 Modal을 닫으려 하면, 제출 중(`closeDisabled`)인 Modal은 `dirty`와 상관없이 그 요청을 무시하고(작성 중 확인도 띄우지 않음), 그 밖에 작성 중(`dirty`)인 Modal은 확인을 거쳐야 한다(**shall**).
- REQ-UI-001-022: **When** `toast`가 호출되면, Toast는 동시에 최대 3개를 보이고 나머지를 순서대로 대기시키며 success·info는 5초, warning은 7초 뒤 닫고 destructive는 사용자가 닫을 때까지 유지해야 하고(**shall**), **While** 포인터나 포커스가 알림 영역 안에 있는 동안 닫힘 타이머를 멈춰야 하며(**shall**), **When** 사용자가 F8을 누르면 알림 영역("알림 (F8)")으로 포커스를 옮겨야 하고(**shall**), **When** 사용자가 "알림 닫기" 버튼을 누르거나 포커스된 알림에서 Esc를 누르거나 알림을 스와이프하면 그 알림을 닫아야 한다(**shall** — 스와이프는 Radix 기본 동작이며 jsdom에서 확인하지 않고 브라우저에서 수동 확인한다).
- REQ-UI-001-023: 피드백·데이터 표시 컴포넌트(Alert, Badge, Loading, Skeleton, EmptyState, Card, Table, Tabs, Pagination)는 system.md §8과 plan.md §A.5의 계약을 따라야 하고(**shall**), **Where** Alert에 `live`가 설정된 경우에만 Alert는 `role="alert"`를 써야 하며(**shall**), Table은 제어형 정렬(`aria-sort`)·레일 색 값·로딩·빈 상태를 제공해야 하고(**shall**), Pagination은 쪽 번호 배열을 acceptance.md §3.1 표(정본)와 같게 만들어야 한다(**shall**) — 현재 쪽 양옆은 한 쪽으로 고정하고, `pageCount`가 7 이하이면 모든 쪽 번호를 줄임표 없이 보이며, 8 이상이면 줄임표를 포함해 언제나 7칸으로 현재 쪽 `p`가 4 이하일 때 `1 2 3 4 5 … 끝`, `p`가 `pageCount`−3 이상일 때 `1 … 끝−4 끝−3 끝−2 끝−1 끝`, 그 사이일 때 `1 … p−1 p p+1 … 끝`을 보인다. **While** SkeletonGroup이 마운트된 뒤 `delayMs`(기본 300ms)가 지나지 않은 동안 SkeletonGroup은 아무것도 렌더링하지 않아야 한다(**shall not**).
- REQ-UI-001-024: 탐색 컴포넌트(Sidebar, Breadcrumb, PageHeader, Tooltip)는 라우터에 의존하지 않고 주입된 링크 컴포넌트에 `to`를 전달하며 활성 항목과 마지막 위치에 `aria-current="page"`를 붙여야 하고(**shall**), **While** Sidebar가 접힘(64px) 상태인 동안 Sidebar는 이름을 숨긴 텍스트로 남기고 **When** 항목이 포커스나 hover를 받으면 Tooltip으로 그 이름을 보여 줘야 하며(**shall**), PageHeader는 제목을 기본 h1로 렌더링하고 **Where** `titleAs`가 주어지면 그 수준(h2·h3)으로 렌더링해야 한다(**shall**).

### 4.6 GEARS 유형 분포

| 유형 | 요구사항 |
|---|---|
| Ubiquitous(항상) | 001, 002, 003, 005, 009, 010, 012, 014, 017 |
| Event-driven(**When**) | 007, 021 |
| State-driven(**While**) | 013, 025 |
| Unwanted(**When** 발견 → 대응) | 006, 011 |
| 복합(조건절 유형이 둘 이상이거나 항상 절과 섞임) | 004(**When**), 008(**While**), 015(**While**·**When**), 016(**While**·**Where**), 018(**When**·**While**, **shall not**), 019(**While**·**Where**), 020(**When**·**Where**, **shall not**), 022(**When**·**While**), 023(**Where**·**While**, **shall not**), 024(**While**·**When**·**Where**) |

- 여러 절을 묶은 요구사항(003, 010, 017, 023)은 나누면 Tier L 상한(25개)을 넘으므로 나누지 않았다. 각 절은 인수 기준의 개별 확인 항목으로 따로 판정한다(acceptance.md §1.1).
- 0.2.0에서 응답 안에 표시 없이 들어 있던 조건(004·007·016·018·019·021·022·023·024)은 0.3.0에서 조건절로 따로 표시하고 위 분류를 그에 맞췄다.

## 5. 기존 앱 교체 변경 표시

### [DELTA] 기존 관리자 앱 → 새 기반

- [REMOVE] `src/manager/**`(22개), `src/shared/**`(26개), `src/App.tsx`, `src/App.css`, `src/index.css` — 기존 화면·API·스토어. 커밋 `28c87a9`에 남는다(REQ-UI-001-002)
- [REMOVE] `tailwind.config.js`, `postcss.config.js`, `eslint.config.js`, `prettier.config.cjs`, `bun.lock`, `tsconfig.app.json`, `tsconfig.node.json`, `public/vite.svg`(REQ-UI-001-002)
- [REMOVE] 옛 의존성: `@fullcalendar/*`, `@headlessui/react`, `@tanstack/react-query`, `@tanstack/react-query-devtools`, `@tanstack/react-table`, `axios`, `file-saver`, `react-router-dom`, `zustand`, ESLint·Prettier·PostCSS 계열과 그 타입 패키지(REQ-UI-001-002)
- [MODIFY] `package.json`(plan.md §A.8 고정값과 정확히 같은 의존성), `package-lock.json`(다시 생성), `index.html`(`lang="ko"`, `<head>`의 테마 초기화 스크립트), `vite.config.ts`(기존 `/api` 프록시 제거), `tsconfig.json`(참조형 → 단일 설정), `deploy.sh`(npm 빌드 + 배포 중지 가드), `.gitignore`(`coverage`), `.vscode/extensions.json`(Biome·Tailwind 추천, 주석 유지 — Biome 검사에서 제외), `src/main.tsx`(미리보기 진입)(REQ-UI-001-001·003·004·008)
- [NEW] `biome.json`, `src/styles/`(토큰·Tailwind 연결·대비 계산·토큰 동기화 검사), `src/ui-core/`(컴포넌트 29개 + `cn.ts` + `index.ts`), `src/preview/`(미리보기와 전시 목록 `showcase.ts`), `src/test/`(테스트 설정·규칙 점검·배포 가드·의존성 고정 검사). 파일 목록은 plan.md §I.3(REQ-UI-001-004·005~025)
- [EXISTING] `src/vite-env.d.ts`, `.env`, `.git_hooks/**`, `.github/**`, `.claude/**`, `.moai/**`, `CLAUDE.md`, `.mcp.json`, `.claudeignore`, `.worktreeinclude`, `README.md` — run 단계에서는 바꾸지 않는다(`README.md`는 이 SPEC의 동기화 단계에서 manager-docs가 고친다)(`.moai/specs/SPEC-UI-001/progress.md`와 `.moai/state/verify/`의 증거 파일은 run 단계 소유 에이전트가 쓴다)

## 7. 인수 기준 (Acceptance Criteria)

인수 기준 25개의 요약이다. 시나리오 전체, 기대값 표, 경계 사례, 품질 게이트는 acceptance.md에 있다.

- AC-UI-001-01: Given M1 이후 `npm ci`로 설치한 작업 트리에서, When `npm run typecheck`·`npm run lint`·`npm test`·`npm run build`와 의존성 고정 테스트를 실행하고 TypeScript 검사 대상을 확인하면, Then 네 명령이 종료 코드 0으로 끝나고 `package.json`의 의존성 20개·개발 의존성 17개가 acceptance.md의 고정 목록과 이름·버전 문자열까지 같아 남는 항목이 없으며, `tsc --listFilesOnly`가 `src/main.tsx`와 `vite.config.ts`를 포함하고 프로젝트 TypeScript가 5.9.3이다 (maps REQ-UI-001-001, REQ-UI-001-003)
- AC-UI-001-02: Given M1 커밋 이후, When 제거 대상 경로와 의존성 목록을 검사하면, Then `src/manager`·`src/shared`·`src/App.tsx`·`src/App.css`·`src/index.css`와 대체된 설정 8개가 git에 없고 옛 의존성이 0건이며 `src/vite-env.d.ts`는 남아 있다 (maps REQ-UI-001-002)
- AC-UI-001-03: Given 마일스톤 변경을 경로 지정으로 스테이징한 상태에서, When 커밋 직전에 `npm run test:coverage`를 실행한 뒤 훅을 건너뛰지 않고 커밋하면, Then 커버리지가 `src/ui-core` 줄·문장·함수 85% 이상·분기 80% 이상으로 종료 코드 0이고 pre-commit `moai gate`가 종료 코드 0이며, M1에서 게이트가 실제로 실행한 단계와 도구가 기록되고 실행한 단계가 없으면 공백으로 남으며, 게이트가 프로젝트 밖 도구 때문에 실패하면 커밋하지 않고 blocker로 보고한다 (maps REQ-UI-001-003)
- AC-UI-001-04: Given 임시 디렉터리에 복사한 `deploy.sh`, 읽히면 표시 파일을 만드는 더미 `.env.stage`, PATH 맨 앞의 대역 `npm`·`scp`가 있을 때, When `ALLOW_PREVIEW_ONLY_DEPLOY`를 없음·`0`·`1`로 바꿔 `bash deploy.sh`를 실행하면, Then `1`이 아닐 때는 종료 코드 1과 변수 이름을 담은 안내가 나오고 표시 파일과 대역 호출 기록이 없으며, `1`일 때는 `.env.stage`를 읽은 뒤 대역 `npm`이 `run build -- --mode stage`로, 대역 `scp`가 한 번 호출되어 종료 코드 0이다 (maps REQ-UI-001-004)
- AC-UI-001-05: Given `tokens.css`·`index.css`와 git에 추적되는 `.moai/design/system.md`가 있을 때, When 토큰 동기화 테스트와 대비 회귀 테스트를 실행하면, Then system.md 표에서 읽은 색 36개·상태 15개의 라이트·다크 값, `color-scheme`, 그림자, 반경, 글꼴, 글자 크기 7개의 크기·줄높이·자간, 폭 5개, 사이드바 폭 2개가 모두 같고 읽은 행 수가 기대값(14·19·5·2·7)과 같으며, 기준 있는 52쌍 × 2테마와 예약 상태 90개 값이 기준을 넘고 기록된 최저값과 ±0.01 안에서 같다 (maps REQ-UI-001-005, REQ-UI-001-009)
- AC-UI-001-06: Given `index.css`를 Tailwind `compile`로 컴파일하고 `npm run build`를 마친 트리에서, When 금지 클래스·토큰 클래스·정적 유틸리티를 후보로 넣고 빌드 결과 CSS를 검사하면, Then 금지 클래스의 규칙이 0개, 토큰·정적 클래스의 규칙이 있고, `text-heading`에 자간, `text-body`에 줄높이 하위 값, `outline-hidden`에 forced-colors 블록이 있으며, 시연 허용 구역에 `bg-rose-700`이 글자 그대로 있는데도 `dist/assets/*.css`에는 `.bg-rose-700`이 없다 (maps REQ-UI-001-006)
- AC-UI-001-07: Given 저장된 테마 선택이 없고 운영체제가 라이트인 첫 방문에서, When 키보드로 테마 전환에 들어가 선택된 "시스템" 항목에서 ←를 누르면, Then 방향키만으로 포커스와 선택이 "다크"로 함께 옮겨져 `aria-checked="true"`가 되고 `<html>`에 `.dark`가 붙으며 `kmc-admin-theme` 저장값이 `dark`이고, 저장이 예외를 던져도 클래스는 바뀌고 예외가 밖으로 새지 않는다 (maps REQ-UI-001-007)
- AC-UI-001-08: Given `index.html`과 ThemeProvider에서, When 저장값 없음(운영체제 다크·라이트)·`dark`·`light`·`system`·잘못된 값·저장소 예외로 인라인 스크립트를 실행하고 선택이 시스템일 때와 `light`일 때 운영체제 설정을 바꾸면, Then 렌더링 전 `.dark` 판정이 acceptance.md 기대값 표와 같고 예외가 새지 않으며, 스크립트는 `<html lang="ko">` 문서의 `<head>`에서 모듈 스크립트보다 앞에 있고, 운영체제 변경은 선택이 시스템일 때만 `.dark`를 바꾼다 (maps REQ-UI-001-008)
- AC-UI-001-09: Given ui-core가 완성된 트리(M5 이후)에서, When 공개 내보내기 목록 테스트, 기반 라이브러리 가져오기 검사, `cn` 병합 테스트를 실행하면, Then `@/ui-core`의 런타임 내보내기가 acceptance.md의 40개 이름과 정확히 같고(테스트 전용 함수 없음) `index.ts`에 `export *`가 없으며 컴포넌트 파일이 29개이고, 각 파일이 acceptance.md 기반 라이브러리 표의 패키지를 가져오며, `cn("text-body text-muted-foreground")`은 두 클래스를, `cn("rounded-control rounded-panel")`은 `rounded-panel`만, `cn("bg-muted bg-primary-subtle")`은 `bg-primary-subtle`만 남긴다 (maps REQ-UI-001-010)
- AC-UI-001-10: Given `src/ui-core`(테스트 포함)와 `src/preview` 소스에서, When 디자인 규칙 점검 테스트와 경계 검사를 실행하면, Then `dark:`, 설치된 Tailwind `theme.css`에서 만든 기본 테마 이름(색·반경·그림자·글자 크기·컨테이너) 클래스, `outline-none`, `hover:opacity-`, box-shadow 포커스 링, 조건 없는 `animate-*`가 시연 허용 구역 밖에서 0건이고 `lucide-react`에서 가져온 이름이 모두 `lucide-react.d.ts`의 정식 이름이며, ui-core에 예약 상태 키 5종과 상태 토큰 클래스가 0건이고, 허용 구역 바로 밖의 표본을 포함한 자기 검사 표본을 모두 잡아내며 실패 메시지마다 `경로:줄`이 들어 있다 (maps REQ-UI-001-011)
- AC-UI-001-11: Given 마우스를 쓰지 않는 사용자가, When plan.md §A.6-8 키보드 계약의 키만으로 Button, Checkbox, Select, Filter, Search, Combobox, DateTimePicker, Modal, ConfirmDialog, Toast, Tooltip, Tabs, Table 정렬 머리글, Pagination, Sidebar, ThemeToggle을 조작하면, Then 모든 동작을 끝낼 수 있고(키보드 시나리오는 16개 컴포넌트 테스트 파일에 `AC-UI-001-11` 표지를 단 테스트로 있다) 포커스 대상마다 `focus-visible:outline-2`·`focus-visible:outline-offset-2`·`focus-visible:outline-ring`이 있으며 컴포넌트 테스트의 axe 위반이 0건이다 (maps REQ-UI-001-012)
- AC-UI-001-12: Given 고대비(forced-colors) 모드 대응을 검사할 때, When 소스·컴파일 결과와 선택 상태가 있는 컴포넌트를 확인하면, Then box-shadow 포커스 링이 0건이고 `outline-hidden`이 forced-colors 블록에서 윤곽선을 남기며 입력·선택 컨트롤 7종의 테두리는 `border-input`이고, Pagination 현재 쪽, Filter·ThemeToggle 선택 항목, Sidebar 활성 항목, Tabs 활성 탭, Calendar 선택 날짜, Select 선택 옵션(체크 아이콘), Select·Combobox 하이라이트 옵션은 다른 항목에 없는 색 아닌 단서를 가지며 장식 아이콘은 `aria-hidden`이다 (maps REQ-UI-001-012, REQ-UI-001-025)
- AC-UI-001-13: Given `prefers-reduced-motion: reduce` 환경에서, When Loading·Skeleton·Modal·ConfirmDialog·Toast·Tooltip·Select·Combobox·DateTimePicker를 렌더링하고 소스를 점검하면, Then 회전·깜빡임·이동·크기 애니메이션 클래스가 `motion-safe:` 조건 안에만 있고 컴파일된 기본 계층에 감속 모드 안전망(애니메이션·전환 0.01ms, 반복 1회)이 있다 (maps REQ-UI-001-013)
- AC-UI-001-14: Given 미리보기 페이지를 렌더링했을 때, When 미리보기 테스트를 라이트와 다크에서 실행하면, Then h1이 페이지 제목 하나이고 섹션 9개가 있으며 전시 목록(29개 컴포넌트의 변형·상태)의 모든 항목이 렌더링되고 axe 위반이 0건이며, 예약 상태 시연이 예약됨 → 방문함 → 완료 → 취소됨 → 노쇼 순에 상태 클래스가 tone 기본 면을 대신하고, `tnum` 판정 문구가 있으며 렌더링된 문장 가운데 한글로 끝나는 문장은 모두 `요.`·`요?`로 끝난다 (maps REQ-UI-001-014)
- AC-UI-001-15: Given `loading` 상태이고 포커스가 있는 Button에서, When 클릭하고 Enter를 누른 뒤 `loading`을 끝내고 다시 누르면, Then 처음에는 `onClick`이 호출되지 않고 `aria-busy="true"`·`aria-disabled="true"`이며 `disabled` 속성이 없고 포커스가 남으며, `loading`이 끝난 뒤에는 두 속성이 사라지고 `onClick`이 한 번 호출된다 (maps REQ-UI-001-015)
- AC-UI-001-16: Given 설명·오류·필수 표시가 있는 Field가 각 컨트롤을 감쌀 때, When 오류를 표시했다가 지우면, Then 라벨 `htmlFor`와 컨트롤 `id`가 같고 `aria-describedby`에는 렌더링된 설명·오류 id만 들어가며 오류가 있을 때만 `aria-invalid="true"`가 붙고, 필수 표시는 Input·Textarea·Combobox 입력에 `required`, Select 트리거·Checkbox·DateTimePicker 트리거에 `aria-required="true"`로 나타난다 (maps REQ-UI-001-016)
- AC-UI-001-17: Given `{ value, label }` 옵션의 Select·Filter, 접근 이름이 있는 Search, 일부 선택 Checkbox, 부가 표시가 있는 Input이 있을 때, When Select를 Enter로 열어 옵션을 키보드로 고르고 Filter에서 →와 Space를 누르고 Search 지우기를 누르고 Checkbox에서 Enter와 Space를 누르면, Then Select는 라벨이 아닌 값을 알리고 Filter는 →로 포커스와 선택이 함께 옮겨지며 Space로 해제되지 않고, Search는 빈 값과 입력 포커스로 돌아가며 Checkbox는 Space로만 `mixed` → `true`가 되고 Input의 글자 부가 표시는 `aria-describedby`로 연결된다 (maps REQ-UI-001-017)
- AC-UI-001-18: Given 로컬 옵션 "김민지"·"김민수"·"박서연"이 있는 닫힌 Combobox에서, When "김"을 입력하고 ↓·Enter로 고른 뒤 입력을 비우고 "박"을 입력해 Esc를 두 번 누르면, Then 입력 직후 첫 옵션 "김민지"가 하이라이트되고 ↓ 뒤 "김민수"가 `aria-activedescendant`가 되며 Enter로 값과 입력 라벨이 "김민수"가 되고 목록이 닫히며, 열려 있는 동안 `aria-controls`가 목록 id를 가리키고 첫 Esc는 닫기만, 두 번째 Esc는 입력을 비우고 `onValueChange(null)`을 부른다 (maps REQ-UI-001-018)
- AC-UI-001-19: Given cmdk 1.1.1이 자체 입력의 `aria-expanded`를 `true`로 고정하는 조건에서, When 닫힌 Combobox를 확인한 뒤 "김"을 입력해 하이라이트가 있는 목록을 열고 IME 조합 중 Enter와 조합이 끝난 뒤 Enter를 차례로 보내면, Then `role="combobox"` 요소는 하나이고 닫혀 있을 때 `aria-expanded="false"`이며, 조합 중 Enter로는 선택되지 않고 목록이 열린 채이며 조합이 끝난 뒤 Enter는 하이라이트 항목을 고르고, 채택한 구조가 진행 기록에 남는다 (maps REQ-UI-001-018)
- AC-UI-001-20: Given 로컬·원격 거르기 모드의 Combobox(빈 결과 문구와 `createAction` 지정)에서, When 일치하는 항목이 있는 글자·없는 글자·옵션 라벨과 똑같은 글자를 입력하고 원격 모드에서 불러오는 중 → 빈 배열 → 검색어와 맞지 않는 결과 순으로 다시 렌더링하면, Then 두 모드 모두 결과 개수와 빈 결과 문구가 `aria-live="polite"`로 알려지고 새 값 만들기는 라벨이 똑같은 옵션이 없을 때만 목록 끝에 보여 고르면 입력 문자열로 `onSelect`가 불리며, 원격 모드는 불러오는 중 표시를 먼저 보이고 맞지 않는 결과도 거르지 않는다 (maps REQ-UI-001-019)
- AC-UI-001-21: Given 오늘을 2026-10-29(목)로 고정하고 값이 없는 DateTimePicker(09:00~21:00, 30분)에서, When Enter로 열어 →·←·↓·↑·PageDown·PageUp·Shift+PageDown·Shift+PageUp·Home·End로 옮긴 뒤 10월 29일과 "14:30"을 고르면, Then 열자마자 포커스가 10월 29일이고 키마다 10-30·10-29·11-05·10-29·11-29·10-29·2027-10-29·2026-10-29·10-25·10-31로 옮겨지며, 시간을 고르기 전에는 `onValueChange`가 불리지 않고 고른 뒤 2026-10-29 14:30의 `Date`로 한 번 불리며, 시간 칸은 "09:00"부터 25개이고 트리거는 "2026. 10. 29. (목) 14:30"이며 닫힌 뒤 포커스가 트리거로 온다 (maps REQ-UI-001-020)
- AC-UI-001-22: Given 입력이 바뀐(`dirty`) Modal, 같은 Modal이 제출 중(`closeDisabled`)인 경우, `tone: "destructive"`인 `showConfirm()` 호출에서, When Modal을 열고 닫기 버튼·Esc·스크림으로 닫기를 시도하고 확인 대화상자에서 Esc·취소·확인(비동기 실패 포함)을 수행하면, Then Modal은 첫 입력에 포커스를 두고, `closeDisabled`면 `dirty`여도 어떤 방법으로도 닫히지 않고 작성 중 확인 대화상자도 뜨지 않으며, 그 밖에 `dirty`면 확인을 거친 뒤에만 닫히고 닫힌 뒤 포커스가 연 버튼으로 돌아오며, 확인 대화상자는 처음 포커스가 취소 버튼이고 Esc·취소는 `false`, 확인은 `true`로 끝나며 비동기 실패 때는 대화상자가 남고 안에 `role="alert"`가 보인다 (maps REQ-UI-001-021)
- AC-UI-001-23: Given 가짜 타이머와 `Toaster`가 있을 때, When `toast.success`·`info`·`warning`·`error`를 차례로 부르고 시간을 흘리며 포인터를 알림 영역에 올렸다 내리고 F8과 Esc를 누르면, Then 처음에 3개만 보이고 네 번째는 대기하며 success·info는 5초, warning은 7초 뒤 닫히고 포인터가 올라가 있는 동안은 닫히지 않으며, error는 60초 뒤에도 남았다가 "알림 닫기" 버튼이나 포커스된 상태의 Esc로 닫히고, F8은 포커스를 "알림 (F8)" 영역으로 옮기며 error는 `assertive`, 나머지는 `polite`로 알려진다 (maps REQ-UI-001-022)
- AC-UI-001-24: Given 행이 있는 Table·Pagination과 로딩·빈 상태의 Table, Alert, Loading, Badge, EmptyState, Tabs, Card에서, When 정렬 머리글을 세 번 누르고 로딩을 SkeletonGroup 기본 `delayMs`(300ms) 전후로 확인하고 빈 행을 넣고 Pagination의 쪽 수·현재 쪽을 바꾸면, Then `aria-sort`가 ascending → descending → none으로 바뀌고 레일 색 값이 첫 셀의 `border-inline-start`로 그려지며 300ms 전에는 스켈레톤이 없다가 이후 6행이 `aria-busy`로 보이고 빈 행에서는 빈 상태가 보이며, Pagination 번호 배열이 acceptance.md EC-05 기대값 표와 같고 현재 쪽은 `aria-current="page"`, Alert는 `live`일 때만 `role="alert"`, Loading은 `role="status"`와 "불러오는 중…"이다 (maps REQ-UI-001-023)
- AC-UI-001-25: Given 가짜 라우터 링크를 주입한 Sidebar·Breadcrumb와 PageHeader가 있을 때, When 현재 경로를 바꾸고 Sidebar를 접은 뒤 항목에 키보드 포커스를 주고 Esc를 누르며 PageHeader를 기본값과 `titleAs="h2"`로 렌더링하면, Then 링크 컴포넌트가 `to`를 받고 활성 항목과 마지막 이동 경로에 `aria-current="page"`가 붙으며 접힌 항목의 이름은 숨긴 텍스트로 남아 Tooltip으로 보이고 Esc로 닫히며, PageHeader 제목은 기본 h1, `titleAs="h2"`면 h2다 (maps REQ-UI-001-024)

## 8. 제외 범위 (Exclusions — What NOT to Build)

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

## 9. 영향받는 파일

| 구분 | 경로 | 개수 |
|---|---|---|
| 삭제 | `src/`의 51개(`src/main.tsx`·`src/vite-env.d.ts`를 뺀 전부), 루트·설정 8개(§5) | 59 |
| 수정 | `package.json`, `package-lock.json`, `index.html`, `vite.config.ts`, `tsconfig.json`, `deploy.sh`, `.gitignore`, `.vscode/extensions.json`, `src/main.tsx` | 9 |
| 새로 | `biome.json`(1); `src/styles/`의 `tokens.css`·`index.css`·`contrast.ts`와 테스트 3개(6); `src/ui-core/`의 컴포넌트 29개·`cn.ts`·`index.ts`와 테스트 30개(61); `src/test/`의 `setup.ts`·`axe.ts`와 테스트 4개(6); `src/preview/`의 `PreviewPage.tsx`·`PreviewSection.tsx`·`showcase.ts`·섹션 9개와 테스트 1개(13) | 87 |

경로별 목록은 plan.md §I.1~§I.3에 있다.
