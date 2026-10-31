# SPEC-UI-001 인수 기준

| 항목 | 내용 |
|---|---|
| SPEC | SPEC-UI-001 — 프로젝트 기반과 디자인 시스템(spec.md 0.3.1 기준) |
| 인수 기준 | 25개(`AC-UI-001-01` ~ `AC-UI-001-25`). 요구사항 25개를 모두 하나 이상의 인수 기준이 덮는다(§1.1) |
| 경계 사례·품질 게이트 | 경계 사례 30개(§3), 품질 게이트 15개(§4) |
| 형식 | 시나리오는 Given-When-Then, 판정은 통과·실패 두 가지 |
| 증거 | 실행한 명령, 출력 원문, HEAD SHA를 `.moai/state/verify/<세션>/`에 남긴다(§6) |
| 관련 | spec.md §4(요구사항), §7(인수 기준 요약) · plan.md §A.5(공개 인터페이스), §A.6-8(키보드 계약), §E(자체 검증) · design.md §10(테스트 장치) |

## 0. 읽는 법

- `(maps …)`는 그 인수 기준이 확인하는 요구사항이다.
- 명령은 저장소 루트에서 실행한다. 정규식이나 여러 줄 명령은 표 밖의 코드 블록에 둔다. 표 칸 안의 `\|`는 복사하면 글자 그대로 남아 `grep -E`가 문자 `|`를 찾게 되고, 그러면 검사가 언제나 0을 낸다.
- 기대값 표(의존성 고정 목록, 공개 이름 40개, 전시 목록, 테마 판정, 쪽 번호 배열, `tnum` 판정)는 이 문서가 정본이다. 테스트는 이 표를 옮겨 쓰고 스스로 기대값을 만들지 않는다.
- 시나리오 속 화면 문구는 system.md §11(문장은 해요체, 버튼·라벨은 명사형)을 따른다.
- jsdom에는 CSS 계산과 레이아웃이 없다. 색·크기는 토큰 테스트와 컴파일 결과 테스트로, 동작과 접근성은 컴포넌트 테스트로 판정한다.
- 라이브러리 기본 동작에 기대는 기대값은 배포 패키지 소스에서 확인했다(research.md §6.14). 이 SPEC이 라이브러리 기본 동작 위에 더하는 동작(방향키 선택, 날짜 대화상자의 첫 포커스 등)은 RED 테스트를 먼저 써서 실패를 확인한 뒤 구현한다.

## 1. 인수 기준 매트릭스

| AC | 요지 | REQ | 검증 | 마일스톤 |
|---|---|---|---|---|
| AC-UI-001-01 | 검사·빌드 명령, 의존성 정확 고정, 단일 tsconfig | 001, 003 | 네 명령 · dependency-pins 테스트 · `tsc --listFilesOnly` | M1~M6 |
| AC-UI-001-02 | 기존 앱·설정·옛 의존성 제거 | 002 | §2 AC-UI-001-02의 명령 | M1 |
| AC-UI-001-03 | 커밋 게이트와 커버리지, 게이트 실행 단계 기록 | 003 | `npm run test:coverage` → pre-commit `moai gate` | M1~M6 |
| AC-UI-001-04 | 배포 중지 가드(대역 명령, 실제 배포 없음) | 004 | deploy-guard 테스트 | M1 |
| AC-UI-001-05 | 토큰 동기화와 대비 회귀 | 005, 009 | tokens.sync·tokens.contrast 테스트 | M1 |
| AC-UI-001-06 | Tailwind 기본 테마 정리(컴파일·빌드 결과) | 006 | theme-reset 테스트 · 빌드 결과 검사 | M1·M6 |
| AC-UI-001-07 | 테마 선택(방향키 선택, 저장 실패) | 007 | theme-toggle·theme-provider 테스트 | M1 |
| AC-UI-001-08 | 첫 렌더 전 테마 적용, 시스템 추종 범위 | 008 | theme-init·theme-provider 테스트 | M1 |
| AC-UI-001-09 | 공개 내보내기 40개와 `cn` 병합 | 010 | cn·design-rules 테스트 | M1~M5 |
| AC-UI-001-10 | 금지 패턴·lucide 정식 이름·도메인 경계 | 011 | design-rules 테스트 · §4.1 경계 검사 | M1~M6 |
| AC-UI-001-11 | 키보드 계약과 포커스 표시 | 012 | 컴포넌트 테스트의 키보드 경로와 axe | M1~M5 |
| AC-UI-001-12 | 고대비 모드의 포커스·테두리·선택 단서 | 012, 025 | design-rules·theme-reset·컴포넌트 테스트 | M1~M5 |
| AC-UI-001-13 | 감속 모드 | 013 | 규칙 점검 · 해당 컴포넌트 테스트 | M1~M5 |
| AC-UI-001-14 | 미리보기 전시 목록, h1, 해요체, `tnum` 판정 | 014 | PreviewPage 테스트 | M1~M6 |
| AC-UI-001-15 | Button loading | 015 | button 테스트 | M2 |
| AC-UI-001-16 | Field 연결과 필수 표시 | 016 | field와 각 컨트롤 테스트 | M2~M4 |
| AC-UI-001-17 | 기본 입력과 선택 | 017 | select·filter·search·checkbox·input·textarea 테스트 | M2~M3 |
| AC-UI-001-18 | Combobox 하이라이트·ARIA·키보드 | 018 | combobox 테스트 | M4 |
| AC-UI-001-19 | cmdk 고정 ARIA 대응과 IME | 018 | combobox 테스트 · progress.md 기록 | M4 |
| AC-UI-001-20 | Combobox 두 거르기 모드의 알림·새 값 만들기 | 019 | combobox 테스트 | M4 |
| AC-UI-001-21 | Calendar 키 이동과 DateTimePicker 값 결합 | 020 | calendar·date-time-picker 테스트 | M4 |
| AC-UI-001-22 | Modal과 ConfirmDialog | 021 | modal·confirm-dialog 테스트 | M3 |
| AC-UI-001-23 | Toast 대기열·시간·멈춤·F8·닫기 | 022 | toast 테스트 | M3 |
| AC-UI-001-24 | 피드백·데이터 표시와 쪽 번호 배열 | 023 | table·pagination·skeleton·alert·loading·badge·empty-state·tabs·card 테스트 | M2·M5 |
| AC-UI-001-25 | 탐색과 PageHeader 제목 수준 | 024 | sidebar·breadcrumb·page-header·tooltip 테스트 | M3·M5 |

### 1.1 요구사항 → 인수 기준

| REQ | AC | 묶인 절을 따로 판정하는 곳 |
|---|---|---|
| REQ-UI-001-001 | 01 | 네 스크립트(01 Then), 정확 고정(01 And) |
| REQ-UI-001-002 | 02 | — |
| REQ-UI-001-003 | 01, 03 | 단일 tsconfig(01 And), 커밋 게이트(03), 커버리지(03) |
| REQ-UI-001-004 | 04 | npm 빌드(04 And), 가드(04 Then) |
| REQ-UI-001-005 | 05 | — |
| REQ-UI-001-006 | 06 | — |
| REQ-UI-001-007 | 07 | — |
| REQ-UI-001-008 | 08 | — |
| REQ-UI-001-009 | 05 | — |
| REQ-UI-001-010 | 09 | 구성·`cn`(09 And), 기반 라이브러리 가져오기(09 And), 공개 이름 40개(09 Then), 가져오기 경로(09 And) |
| REQ-UI-001-011 | 10 | — |
| REQ-UI-001-012 | 11, 12 | 키보드(11), 포커스 표시(11), 입력 테두리(12), 장식 아이콘(12) |
| REQ-UI-001-013 | 13 | — |
| REQ-UI-001-014 | 14 | — |
| REQ-UI-001-015 | 15 | — |
| REQ-UI-001-016 | 16 | — |
| REQ-UI-001-017 | 17 | Select·Filter·Search·Checkbox·Input·Textarea 각각(17 Then·And) |
| REQ-UI-001-018 | 18, 19 | — |
| REQ-UI-001-019 | 20 | — |
| REQ-UI-001-020 | 21 | — |
| REQ-UI-001-021 | 22 | — |
| REQ-UI-001-022 | 23 | — |
| REQ-UI-001-023 | 24 | Alert·Skeleton·Table·Pagination·나머지 계약 각각(24 Then·And) |
| REQ-UI-001-024 | 25 | — |
| REQ-UI-001-025 | 12 | — |

빠진 요구사항은 없다. 요구사항 모듈마다 인수 기준이 2개 이상이다(모듈 1: 4개, 2: 4개, 3: 6개, 4: 7개, 5: 4개).

## 2. 시나리오

### 모듈 1 — 기반 교체

#### AC-UI-001-01 — 검사·빌드 명령, 의존성 정확 고정, 단일 tsconfig (maps REQ-UI-001-001, REQ-UI-001-003)

- **Given** M1 이후의 작업 트리에서 `npm ci`로 의존성을 설치했다
- **When** `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`를 차례로 실행하고, 의존성 고정 테스트와 TypeScript 검사 대상을 확인한다
- **Then** 네 명령이 모두 종료 코드 0으로 끝난다
- **And** `src/test/dependency-pins.test.ts`가 `package.json`의 `dependencies`·`devDependencies`를 아래 고정 목록과 비교해 이름과 버전 문자열이 정확히 같고(범위 기호 없음) 어느 쪽에도 남는 항목이 없음을 확인한다. 이 목록은 plan.md §A.8 표를 옮긴 것이고, 테스트의 기대값은 이 목록을 그대로 쓴다. 비교 함수는 남는 항목·`^` 범위·다른 버전을 넣은 사본을 각각 실패로 보고한다(EC-29)
- **And** `tsconfig.json`에 `references`와 `files`가 없고, `tsc --listFilesOnly` 출력에 `src/main.tsx`와 `vite.config.ts`가 들어 있으며(검사 대상이 비어 있지 않음), 프로젝트 TypeScript는 `Version 5.9.3`이다

고정 목록:

```json
{
  "dependencies": {
    "@fontsource-variable/noto-sans-kr": "5.3.1",
    "@radix-ui/react-alert-dialog": "1.2.1",
    "@radix-ui/react-checkbox": "1.4.1",
    "@radix-ui/react-dialog": "1.3.1",
    "@radix-ui/react-popover": "1.3.1",
    "@radix-ui/react-select": "2.4.1",
    "@radix-ui/react-slot": "1.5.0",
    "@radix-ui/react-tabs": "1.2.1",
    "@radix-ui/react-toast": "1.3.1",
    "@radix-ui/react-toggle-group": "1.2.1",
    "@radix-ui/react-tooltip": "1.4.1",
    "class-variance-authority": "0.7.1",
    "clsx": "2.1.1",
    "cmdk": "1.1.1",
    "date-fns": "4.4.0",
    "lucide-react": "1.64.0",
    "react": "19.3.1",
    "react-day-picker": "10.0.2",
    "react-dom": "19.3.1",
    "tailwind-merge": "3.7.0"
  },
  "devDependencies": {
    "@biomejs/biome": "2.6.4",
    "@tailwindcss/vite": "4.3.3",
    "@testing-library/dom": "10.4.2",
    "@testing-library/jest-dom": "7.0.1",
    "@testing-library/react": "16.3.3",
    "@testing-library/user-event": "14.6.8",
    "@types/node": "24.19.2",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "@vitejs/plugin-react": "6.1.2",
    "@vitest/coverage-v8": "5.0.5",
    "axe-core": "4.14.0",
    "jsdom": "29.1.1",
    "tailwindcss": "4.3.3",
    "typescript": "5.9.3",
    "vite": "8.3.5",
    "vitest": "5.0.5"
  }
}
```

- **검증**:

```bash
npm run typecheck && npm run lint && npm test && npm run build; echo "exit=$?"     # exit=0
npx vitest run src/test/dependency-pins.test.ts
npx tsc -p tsconfig.json --listFilesOnly | grep -cE '/src/main\.tsx$|/vite\.config\.ts$'   # 2
npx tsc --version                                                                  # Version 5.9.3
```

- 고정 목록을 바꾸는 일(대체 조합 포함)은 SPEC 개정이다(spec.md C5).

#### AC-UI-001-02 — 기존 앱과 대체된 설정·의존성이 제거된다 (maps REQ-UI-001-002)

- **Given** M1 커밋이 끝난 트리
- **When** 제거 대상 경로와 의존성 목록을 검사한다
- **Then** `src/manager`, `src/shared`, `src/App.tsx`, `src/App.css`, `src/index.css`와 대체된 설정 8개가 git에 없다
- **And** `package.json`에 옛 의존성이 0건이고 `src/vite-env.d.ts`는 그대로 남아 있다
- **검증**:

```bash
git ls-files src/manager src/shared src/App.tsx src/App.css src/index.css tailwind.config.js postcss.config.js eslint.config.js prettier.config.cjs bun.lock tsconfig.app.json tsconfig.node.json public/vite.svg | wc -l   # 0
node -e "const p=require('./package.json');const n=Object.keys({...p.dependencies,...p.devDependencies});console.log(n.filter(x=>/^(@eslint\/|eslint|typescript-eslint|globals$|prettier|postcss|autoprefixer|zustand|axios|file-saver|react-router|@headlessui|@tanstack|@fullcalendar|@types\/file-saver|@types\/react-router)/.test(x)).length)"   # 0
git ls-files src/vite-env.d.ts   # 한 줄
```

#### AC-UI-001-03 — 커밋 게이트와 커버리지 (maps REQ-UI-001-003)

- **Given** 마일스톤의 변경을 경로를 지정해 스테이징했다
- **When** 커밋 직전에 `npm run test:coverage`를 실행하고, 이어 훅을 건너뛰는 옵션이나 `SKIP_MOAI_PRECOMMIT` 없이 커밋한다
- **Then** `npm run test:coverage`가 종료 코드 0으로 끝나고 `src/ui-core` 커버리지가 줄·문장·함수 85% 이상, 분기 80% 이상이다(임계값은 `vite.config.ts`의 `test.coverage.thresholds`)
- **And** pre-commit 훅의 `moai gate`가 종료 코드 0으로 끝나 커밋이 만들어진다
- **And** M1과 M6에서는 게이트 출력에 나타난 실행 단계(타입·린트·테스트 명령)와 그때 쓰인 TypeScript(`command -v tsc`, `npx tsc --version`)를 진행 기록에 남긴다. `moai gate`는 언어 도구 체계를 감지하지 못해도 종료 코드 0을 낸다고 밝히고(`moai gate --help`: "Exit code 0: gate passed (or no recognized language toolchain detected)"), 이 기기의 PATH `tsc`는 프로젝트 밖 `/mnt/c/Program Files/nodejs/tsc`(Version 6.0.3)다. 그래서 실행 단계가 없거나 게이트가 프로젝트 밖 TypeScript를 썼다면 그 사실을 공백으로 기록하고, 같은 트리에서 따로 실행한 AC-UI-001-01의 네 명령과 이 기준의 커버리지 명령을 판정 근거로 삼는다
- **And** 게이트가 프로젝트 밖 도구 때문에 실패하면(예: 타입 단계가 PATH의 `tsc` 6.0.3을 씀) 커밋하지 않고, 게이트 출력과 `command -v tsc`·`tsc --version` 결과를 붙여 blocker로 보고한다. MoAI 설정 변경과 훅 우회는 하지 않는다(spec.md C3, 제외 범위)
- **검증**:

```bash
npm run test:coverage; echo "coverage exit=$?"   # 커밋 직전 실행, coverage exit=0
# 커밋: 경로 지정 스테이징 후 훅을 건너뛰지 않고 커밋한다
git log -1 --format=%H
moai gate; echo "gate exit=$?"                    # gate exit=0, 실행 단계 출력을 증거로 보존
command -v tsc; npx tsc --version                 # M1·M6 기준선 기록
```

#### AC-UI-001-04 — 배포 중지 가드 (maps REQ-UI-001-004)

- **Given** `src/test/deploy-guard.test.ts`(node 환경)가 임시 디렉터리에 저장소의 `deploy.sh`를 복사하고, 다음을 둔다
  - 더미 `.env.stage`: `SCP_USER=tester`, `SCP_HOST=example.invalid`, `SCP_DIR=/srv/none`, `SCP_PORT=2222`, 그리고 읽히면(`. .env.stage`) 표시 파일을 만드는 줄 `: > env-stage-read`
  - PATH 맨 앞의 대역 `npm`·`scp`: 받은 인자를 기록 파일에 한 줄씩 적고 종료 코드 0으로 끝난다
- **When** 그 디렉터리에서 `bash deploy.sh`를 `ALLOW_PREVIEW_ONLY_DEPLOY` 없음, `0`, `1`로 각각 실행한다
- **Then** 없음·`0`일 때 종료 코드 1이고, 출력에 `ALLOW_PREVIEW_ONLY_DEPLOY`가 들어 있으며, `env-stage-read`가 없고(가드가 `.env.stage`를 읽기 전에 멈춤) 대역 기록이 비어 있다
- **And** `1`일 때는 가드 안내가 없고 `env-stage-read`가 생기며, 대역 `npm`이 `run build -- --mode stage`로, 대역 `scp`가 `-P 2222`와 `tester@example.invalid:/srv/none`을 담아 한 번씩 호출되고 종료 코드 0이다. 저장소의 `deploy.sh`에는 `bun ` 호출이 없다
- **안전**: 실제 `npm`·`scp`는 실행되지 않는다. 저장소 작업 트리에서 `ALLOW_PREVIEW_ONLY_DEPLOY=1`로 `deploy.sh`를 실행하지 않는다
- **검증**:

```bash
npx vitest run src/test/deploy-guard.test.ts
grep -c 'bun ' deploy.sh   # 0
```

### 모듈 2 — 디자인 토큰과 테마

#### AC-UI-001-05 — 토큰 동기화와 대비 (maps REQ-UI-001-005, REQ-UI-001-009)

- **Given** `src/styles/tokens.css`, `src/styles/index.css`, git에 추적되는 `.moai/design/system.md`
- **When** 토큰 동기화 테스트와 대비 회귀 테스트를 실행한다
- **Then** `src/styles/tokens.sync.test.ts`가 system.md의 표를 직접 읽어 다음이 `tokens.css`·`index.css`와 같음을 확인한다
  - §2 면·중립 14행과 톤 19행(`info-*`는 `primary` 변수를 가리키는 별칭)의 라이트(`:root, .light`)·다크(`.dark`) 값, `overlay`의 `rgb()` 값
  - §2 예약 상태 5행 × `bg`·`fg`·`rail`의 라이트·다크 값, §2 그림자 2행의 라이트·다크 값
  - 테마별 `color-scheme`(라이트 `light`, 다크 `dark`), §3의 `--radius: 0.75rem`·`--sidebar-width: 15rem`·`--sidebar-width-collapsed: 4rem`, 파생 반경 4개의 식, 폭 5개
  - §4의 글꼴 2개와 글자 크기 7행의 크기·줄높이·자간(px 값은 16px 기준 rem 환산을 같은 값으로 본다)
- **And** 읽은 행 수가 면·중립 14, 톤 19, 예약 상태 5, 그림자 2, 글자 크기 7과 다르면 테스트가 실패한다(표를 못 읽어 빈 비교로 통과하는 일을 막음). system.md 사본의 값 하나를 바꾸면 불일치를 보고한다(EC-20)
- **And** `src/styles/tokens.contrast.test.ts`에서 design-direction.md §5.5의 기준 있는 52쌍(T01~T36 텍스트 4.5:1, U01~U16 UI 3:1)이 라이트·다크 모두 기준을 넘고, 예약 상태 90개 값(상태 5 × 테마 2 × 측정 9)도 기준을 넘으며, 기록된 최저값(라이트 텍스트 4.86·UI 3.04, 다크 텍스트 5.39·UI 3.03, 상태 라이트 텍스트 4.66·레일 3.95, 상태 다크 텍스트 5.44·레일 4.46)과 ±0.01 안에서 같다
- **검증**:

```bash
npx vitest run src/styles/tokens.sync.test.ts src/styles/tokens.contrast.test.ts
git ls-files .moai/design/system.md   # 한 줄
```

#### AC-UI-001-06 — Tailwind 기본 테마 정리 (maps REQ-UI-001-006)

- **Given** `src/styles/index.css`를 `tailwindcss`의 `compile`로 컴파일하고, `npm run build`를 마친 트리
- **When** 후보 클래스로 금지 클래스(`bg-rose-700`, `text-white`, `rounded-lg`, `shadow-xl`, `text-sm`), 토큰 클래스(`bg-background`, `rounded-panel`, `shadow-raised`, `text-body`, `text-heading`, `max-w-content`, `bg-status-reserved-bg`), 정적 유틸리티(`rounded-full`, `rounded-none`, `bg-transparent`, `bg-current`, `shadow-none`)를 넣고, 빌드 결과 CSS를 검사한다
- **Then** 금지 클래스의 규칙은 0개이고, 토큰 클래스와 정적 유틸리티의 규칙은 있다
- **And** `text-heading` 규칙에 `letter-spacing`, `text-body` 규칙에 `--text-body--line-height`(22px = 1.375rem)를 쓰는 `line-height`가 있고, `outline-hidden`은 `@media (forced-colors: active)` 블록을 만든다
- **And** M6 이후, 시연 허용 구역(`src/preview/sections/VerificationSection.tsx`)에 `bg-rose-700`이 글자 그대로 있는데도 빌드한 `dist/assets/*.css`에는 `.bg-rose-700` 선택자가 없다. 동적으로 만든 클래스 문자열은 Tailwind가 보지 못하므로 증거가 되지 않는다
- **검증**:

```bash
npx vitest run src/styles/theme-reset.test.ts
grep -c 'bg-rose-700' src/preview/sections/VerificationSection.tsx   # 1 이상(M6 이후)
grep -l '\.bg-rose-700' dist/assets/*.css                            # 출력 없음
```

#### AC-UI-001-07 — 테마 선택 (maps REQ-UI-001-007)

- **Given** 저장된 테마 선택이 없고 운영체제가 라이트인 첫 방문(기본값 시스템, D7). 테마 전환의 항목 순서는 라이트, 다크, 시스템이다
- **When** 사용자가 Tab으로 테마 전환에 들어가고(포커스는 선택된 "시스템" 항목) ←를 한 번 누른다(마우스 없이)
- **Then** 포커스와 선택이 함께 "다크"로 옮겨져 "다크"가 `role="radio"`·`aria-checked="true"`이고, `<html>`에 `dark` 클래스가 붙으며 `localStorage.getItem("kmc-admin-theme")`가 `"dark"`다
- **And** ←를 한 번 더 누르면 "라이트"가 선택되어 `dark` 클래스가 사라지고 저장값이 `"light"`가 되며, 선택된 항목에서 Space를 눌러도 선택이 해제되지 않는다
- **And** `localStorage.setItem`이 예외를 던지는 환경에서 "다크"를 고르면 `dark` 클래스는 붙고 예외가 밖으로 새지 않으며, 같은 세션의 `useTheme().preference`는 `"dark"`다
- **비고**: Radix ToggleGroup 1.2.1의 방향키는 포커스만 옮긴다(roving focus — research.md §6.14). 방향키가 선택까지 옮기는 동작은 이 SPEC이 더하는 것이므로 RED 테스트를 먼저 쓴다(plan.md §B B-19)
- **검증**: `npx vitest run src/ui-core/theme-toggle.test.tsx src/ui-core/theme-provider.test.tsx`

#### AC-UI-001-08 — 첫 렌더 전 테마 적용과 시스템 추종 (maps REQ-UI-001-008)

- **Given** `index.html`과 ThemeProvider
- **When** `index.html`에서 `data-theme-init` 표시가 있는 인라인 스크립트를 꺼내 저장값과 운영체제 설정을 바꿔 가며 jsdom에서 실행하고, ThemeProvider를 렌더링한 뒤 `matchMedia` 변경 이벤트를 보낸다
- **Then** 인라인 스크립트의 판정이 아래 표와 같고, 어느 경우에도 예외가 밖으로 새지 않는다
- **And** 문서는 `<html lang="ko">`이고, 스크립트는 `<head>` 안에서 `type="module"` 스크립트보다 앞에 있으며, 스크립트의 저장 키는 `"kmc-admin-theme"`이다(ThemeProvider 테스트와 같은 값)
- **And** 선택이 시스템이면 운영체제가 다크로 바뀔 때 `<html>`에 `dark`가 붙고, 선택이 `light`이면 같은 이벤트에도 `dark`가 붙지 않는다(**While** 범위 확인)
- **검증**: `npx vitest run src/ui-core/theme-provider.test.tsx src/test/theme-init.test.ts`

| 저장값 | 운영체제 | `<html>`의 `.dark` |
|---|---|---|
| 없음(첫 방문) | 다크 | 있음 |
| 없음(첫 방문) | 라이트 | 없음 |
| `dark` | 라이트 | 있음 |
| `light` | 다크 | 없음 |
| `system` | 다크 | 있음 |
| `blue`(잘못된 값) | 다크 | 있음(시스템 판정) |
| 저장소 접근 예외 | 라이트 | 없음(시스템 판정) |

### 모듈 3 — 라이브러리 규약·접근성·미리보기

#### AC-UI-001-09 — 공개 내보내기와 `cn` 병합 (maps REQ-UI-001-010)

- **Given** ui-core가 완성된 트리(M5 이후. M1~M4에서는 그 마일스톤에서 만든 이름을 기대 목록에 먼저 더해 RED를 본 뒤 내보낸다)
- **When** 공개 내보내기 목록 테스트와 기반 라이브러리 가져오기 검사(둘 다 `src/test/design-rules.test.ts`의 묶음), `cn` 병합 테스트를 실행한다
- **Then** `@/ui-core`를 가져온 모듈의 키를 정렬한 결과가 아래 40개와 정확히 같다(테스트 전용 초기화 함수 같은 남는 이름이 없다)
- **And** `src/ui-core/index.ts`에 `export *`가 없고, 컴포넌트 파일(테스트·`cn.ts`·`index.ts` 제외)이 29개이며, 미리보기는 `@/ui-core`에서만 가져온다
- **And** 각 컴포넌트 파일이 아래 기반 라이브러리 표의 패키지를 가져오고(plan.md §A.3 '기반' 열, REQ-UI-001-010), `react-day-picker`와 `cmdk`는 표에 적힌 파일 밖에서 가져오지 않는다
- **And** `cn("text-body text-muted-foreground")`는 두 클래스를 모두 남기고, `cn("rounded-control rounded-panel")`은 `rounded-panel`만, `cn("bg-muted bg-primary-subtle")`은 `bg-primary-subtle`만, `cn("shadow-raised shadow-overlay")`는 `shadow-overlay`만 남긴다. 상태 클래스(`status-*`)의 병합은 ui-core 밖인 미리보기 테스트에서 확인한다(AC-UI-001-14)
- **공개 이름 40개**(정렬 순서): `Alert` `Badge` `Breadcrumb` `Button` `Calendar` `Card` `CardContent` `CardDescription` `CardFooter` `CardHeader` `CardTitle` `Checkbox` `Combobox` `ConfirmDialog` `ConfirmDialogHost` `DateTimePicker` `EmptyState` `Field` `Filter` `Input` `Loading` `Modal` `PageHeader` `Pagination` `Search` `Select` `Sidebar` `Skeleton` `SkeletonGroup` `Table` `Tabs` `Textarea` `ThemeProvider` `ThemeToggle` `Toaster` `Tooltip` `cn` `showConfirm` `toast` `useTheme`
- **검증**: `npx vitest run src/ui-core/cn.test.ts src/test/design-rules.test.ts`

| 파일 | 가져와야 하는 패키지 |
|---|---|
| `button.tsx` | `@radix-ui/react-slot`, `class-variance-authority` |
| `badge.tsx`, `alert.tsx` | `class-variance-authority` |
| `checkbox.tsx` | `@radix-ui/react-checkbox` |
| `select.tsx` | `@radix-ui/react-select` |
| `filter.tsx`, `theme-toggle.tsx` | `@radix-ui/react-toggle-group` |
| `combobox.tsx` | `cmdk`, `@radix-ui/react-popover` |
| `calendar.tsx` | `react-day-picker` |
| `date-time-picker.tsx` | `@radix-ui/react-popover` |
| `modal.tsx` | `@radix-ui/react-dialog` |
| `confirm-dialog.tsx` | `@radix-ui/react-alert-dialog` |
| `toast.tsx` | `@radix-ui/react-toast` |
| `tooltip.tsx` | `@radix-ui/react-tooltip` |
| `tabs.tsx` | `@radix-ui/react-tabs` |

#### AC-UI-001-10 — 금지 패턴·lucide 정식 이름·도메인 경계 (maps REQ-UI-001-011)

- **Given** `src/ui-core`(테스트 파일 포함)와 `src/preview`의 소스
- **When** 디자인 규칙 점검 테스트와 §4.1의 경계 검사를 실행한다
- **Then** `dark:` 변형, Tailwind 기본 테마 이름을 쓴 클래스(아래 금지 이름 집합), `outline-none`, `hover:opacity-`, box-shadow 포커스 링(`focus:ring-*`, `focus-visible:ring-*`, `ring-offset-*`), 조건 없는 `animate-*`가 0건이다. 기본 테마 이름 규칙에 한해 `src/preview/sections/VerificationSection.tsx`의 `design-rules:allow-start`·`design-rules:allow-end` 표시 사이(시연 허용 구역)만 예외다
- **금지 이름 집합**: 설치된 `node_modules/tailwindcss/theme.css`(4.3.3)의 변수 이름에서 만든다. 색 `--color-*` 288개(26계열 × 11단계 + `black`·`white`)는 유틸리티 접두사와 상관없는 닫힌 규칙으로 판정한다: 클래스 안에 `-<계열>-<단계>`(불투명도 수정자 `/<값>`이 붙은 꼴 포함) 또는 `-black`·`-white`가 나오면 위반이다. 계열 26개는 `red` `orange` `amber` `yellow` `lime` `green` `emerald` `teal` `cyan` `sky` `blue` `indigo` `violet` `purple` `fuchsia` `pink` `rose` `slate` `gray` `zinc` `neutral` `stone` `mauve` `olive` `mist` `taupe`, 단계 11개는 `50` `100` `200` `300` `400` `500` `600` `700` `800` `900` `950`이다. 이 규칙의 예외는 색이 아닌 글꼴 굵기 `font-black`(`--font-weight-black`) 하나다. 반경 `--radius-*` 8개는 `rounded-…`(모서리·방향 접두 포함), 그림자 `--shadow-*` 8개·`--inset-shadow-*` 3개·`--drop-shadow-*` 6개·`--text-shadow-*` 5개는 `shadow-`·`inset-shadow-`·`drop-shadow-`·`text-shadow-`, 글자 크기 `--text-*` 13개(`--…--` 하위 값과 `--text-shadow-*` 제외)는 `text-`, 컨테이너 `--container-*` 13개는 `w-`·`min-w-`·`max-w-`·`inline-`·`min-inline-`·`max-inline-`·`basis-`·`columns-` 바로 뒤의 값으로 쓸 때(예: `max-w-md`, `basis-md` — 토큰 `max-w-dialog-md`는 값이 `dialog-md`라 해당하지 않는다)와 컨테이너 쿼리 변형 `@<이름>:`·`@min-<이름>:`·`@max-<이름>:`(`/<컨테이너 이름>`이 붙은 꼴 포함)으로 쓸 때 금지다. `@`이 없는 화면 폭 변형(`md:` 등)은 대상이 아니다. 색·반경·그림자(`--shadow-*`)·글자 크기는 CSS에서도 지우고(system.md §3, AC-UI-001-06), 나머지 넷(`--inset-shadow-*`·`--drop-shadow-*`·`--text-shadow-*`·`--container-*`)은 CSS에 남지만 소스에서 쓰지 않는다. `rounded-full`·`rounded-none`·`shadow-none`·`bg-transparent`·`bg-current` 같은 정적 유틸리티와 이 시스템의 토큰 이름은 대상이 아니다
- **And** `lucide-react`에서 값으로 가져온 이름이 모두 설치된 `node_modules/lucide-react/dist/lucide-react.d.ts`의 `declare const <이름>: LucideIcon;` 정식 이름이다(1.64.0 기준 1,999개). 별칭(`Loader2`, `Trash2`, `Home`, `AlertCircle`, `AlertTriangle`, `CheckCircle` 등)과 `…Icon` 접미 별칭은 위반이다. 타입 가져오기(`LucideIcon`)는 대상이 아니다
- **And** `src/ui-core`에 예약 상태 키 5종(`RESERVED`, `VISITED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`)과 상태 토큰 클래스(`status-*`)가 테스트 파일까지 0건이다
- **And** 자기 검사: 규칙마다 위반 표본을 실제로 잡고, 허용 구역 바로 밖에 둔 `bg-rose-700` 표본, `basis-md` 표본, `Loader2` 가져오기 표본도 잡으며, 색이 아닌 `font-black`과 토큰 클래스 `max-w-dialog-md`는 잡지 않고, 각 실패 메시지에 `경로:줄`(예: `src/ui-core/button.tsx:12`)이 들어 있다(EC-18)
- **검증**: `npx vitest run src/test/design-rules.test.ts` · §4.1 QG-11 블록

#### AC-UI-001-11 — 키보드 계약과 포커스 표시 (maps REQ-UI-001-012)

- **Given** 마우스를 쓰지 않는 사용자(테스트에서는 user-event의 키보드 입력만 사용)
- **When** plan.md §A.6-8 키보드 계약의 키만으로 Button, Checkbox, Select, Filter, Search, Combobox, DateTimePicker, Modal, ConfirmDialog, Toast, Tooltip, Tabs, Table 정렬 머리글, Pagination, Sidebar, ThemeToggle을 조작한다
- **Then** 각 컴포넌트의 주요 동작(누르기, 고르기, 열기·닫기, 이동)을 모두 끝낼 수 있다. Toast는 F8로 알림 영역에 들어가 Tab으로 "알림 닫기"에 닿아 Enter로 닫히고, Table은 Tab으로 정렬 머리글 버튼에 닿아 Enter·Space로 정렬이 바뀐다. 대화상자 안에서는 Tab이 밖으로 나가지 않고 닫히면 연 요소로 포커스가 돌아온다
- **And** 키보드 포커스가 닿는 요소마다 `focus-visible:outline-2`, `focus-visible:outline-offset-2`, `focus-visible:outline-ring` 세 클래스가 모두 있고(텍스트 입력은 `focus-visible:border-ring`도), 각 컴포넌트 테스트의 axe 검사 위반이 0건이다
- **검증**: 키보드 시나리오는 아래 16개 파일에 있고, 그 테스트 이름에 `AC-UI-001-11` 표지를 단다(포커스 클래스 확인과 axe 검사 포함)

```bash
npx vitest run src/ui-core/button.test.tsx src/ui-core/checkbox.test.tsx src/ui-core/select.test.tsx src/ui-core/filter.test.tsx src/ui-core/search.test.tsx src/ui-core/combobox.test.tsx src/ui-core/date-time-picker.test.tsx src/ui-core/modal.test.tsx src/ui-core/confirm-dialog.test.tsx src/ui-core/toast.test.tsx src/ui-core/tooltip.test.tsx src/ui-core/tabs.test.tsx src/ui-core/table.test.tsx src/ui-core/pagination.test.tsx src/ui-core/sidebar.test.tsx src/ui-core/theme-toggle.test.tsx
grep -l 'AC-UI-001-11' src/ui-core/*.test.tsx | wc -l   # 16
```

#### AC-UI-001-12 — 고대비 모드의 포커스·테두리·선택 단서 (maps REQ-UI-001-012, REQ-UI-001-025)

- **Given** forced-colors(Windows 고대비) 대응 검사
- **When** 소스·컴파일 결과와 선택 상태가 있는 컴포넌트를 확인한다
- **Then** 소스에 box-shadow 포커스 링이 0건이고, 컴파일된 `outline-hidden`이 forced-colors 미디어 쿼리 안에서 윤곽선을 남긴다
- **And** Input, Textarea, Select 트리거, Checkbox, Search, Combobox 입력, DateTimePicker 트리거의 테두리 클래스는 `border-input`이고 `border-border`가 아니다
- **And** 다음 각 쌍에서 선택된 쪽에만 단서 클래스(`font-semibold`·`font-bold`·`underline`, 두께가 있는 `border-*`·`outline-*`, 또는 그 클래스의 `forced-colors:` 변형) 또는 체크 아이콘이 있다: Pagination 현재 쪽 ↔ 다른 쪽, Filter·ThemeToggle 선택 항목 ↔ 다른 항목, Sidebar 활성 ↔ 비활성 항목, Tabs 활성 ↔ 비활성 탭, Calendar 선택 날짜 ↔ 다른 날짜, Select 선택 옵션(체크 아이콘)·Combobox 하이라이트 옵션 ↔ 다른 옵션. Select 하이라이트 옵션은 `focus-visible` 윤곽선(AC-UI-001-11)으로 구분된다
- **And** 장식 아이콘(버튼 라벨 옆, Alert·Toast·Badge·EmptyState·Input 앞 아이콘)은 `aria-hidden="true"`이고, 아이콘 전용 버튼은 접근 이름을 가진다
- **검증**: `npx vitest run src/test/design-rules.test.ts src/styles/theme-reset.test.ts` · 각 컴포넌트 테스트의 선택 단서 사례 · Windows 고대비 모드 수동 확인은 선택이며, 확인했다면 결과를 진행 기록에 남긴다

#### AC-UI-001-13 — 감속 모드 (maps REQ-UI-001-013)

- **Given** `prefers-reduced-motion: reduce` 환경
- **When** Loading, Skeleton, Modal, ConfirmDialog, Toast, Tooltip, Select, Combobox, DateTimePicker를 렌더링하고 규칙 점검을 실행한다
- **Then** 회전·깜빡임·이동·크기 애니메이션 클래스가 모두 `motion-safe:` 조건 아래에만 있다(조건 없는 `animate-*` 0건)
- **And** 컴파일된 CSS의 기본 계층에 `@media (prefers-reduced-motion: reduce)` 안전망(애니메이션·전환 시간 0.01ms, 반복 1회)이 있다
- **검증**: `npx vitest run src/test/design-rules.test.ts src/styles/theme-reset.test.ts` · 해당 컴포넌트 테스트의 감속 모드 사례

#### AC-UI-001-14 — 미리보기 페이지 (maps REQ-UI-001-014)

- **Given** `src/main.tsx`가 렌더링하는 미리보기 페이지(M6 이후. M1~M5에서는 그때까지 만든 컴포넌트의 전시 목록 기준)
- **When** 미리보기 테스트를 라이트에서 실행하고, ThemeToggle로 "다크"를 고른 뒤 다시 확인한다
- **Then** h1은 페이지 머리(PageHeader 기본 h1) 하나이고, 섹션 제목(h2) 9개(토큰, 동작, 피드백, 폼, 고급 입력, 오버레이, 데이터, 탐색, 검증)와 "본문으로 건너뛰기" 링크가 있으며, 라이트·다크 모두 axe 위반이 0건이다
- **And** `src/preview/showcase.ts`의 전시 목록이 아래 표와 같고, 목록의 항목마다 `data-showcase="<컴포넌트>:<상태>"` 요소가 라이트와 다크에서 모두 렌더링되며(오버레이는 여는 버튼에 표시), 전시 목록의 컴포넌트 이름 29개가 plan.md §A.3의 29개와 같다
- **And** 예약 상태 시연이 예약됨 → 방문함 → 완료 → 취소됨 → 노쇼 순이고, 각 배지는 상태 클래스(`bg-status-<상태>-bg` 등)를 갖되 Badge tone 기본 면(`bg-muted`)은 없으며(`cn` 병합), "토큰 시연용 조합이에요. 예약 상태 배지는 SPEC-UI-002에서 만들어요." 문구가 있다
- **And** 검증 섹션에 `tnum` 판정 문구("고정폭 숫자: 지원", "고정폭 숫자: 기본 고정폭", "고정폭 숫자: 미지원", "고정폭 숫자: 측정 불가" 가운데 하나 — jsdom에서는 너비가 0이라 "측정 불가")가 있고, 판정 함수는 EC-28의 표대로 동작한다
- **And** 렌더링된 텍스트(`document.body.textContent`)를 문장 단위(마침표·물음표 뒤)로 나눴을 때, 마지막 글자가 한글인 문장은 모두 `요.` 또는 `요?`로 끝난다(해요체 양성 검사 — 합니다체 `니다.`·`니까?`·`십시오`와 해라체 `다.`가 모두 걸린다). 날짜(`2026. 10. 29.`)처럼 숫자로 끝나는 조각과 마침표가 없는 라벨은 대상이 아니다
- **검증**: `npx vitest run src/preview/PreviewPage.test.tsx` · 실제 `tnum` 판정은 `npm run dev`로 띄운 브라우저에서 읽어 진행 기록에 남긴다

| # | 컴포넌트 | 전시 상태(`data-showcase`의 상태 부분) |
|---|---|---|
| 1 | Button | `default` `outline` `ghost` `destructive` `link` `sm` `lg` `icon` `icon-sm` `loading` `disabled` `as-child` |
| 2 | Badge | `neutral` `info` `success` `warning` `destructive` `icon` `dot` |
| 3 | Loading | `sm` `md` |
| 4 | Skeleton | `block` `text` `group` |
| 5 | EmptyState | `with-action` |
| 6 | Alert | `info` `success` `warning` `destructive` `live` |
| 7 | Card | `parts` |
| 8 | Field | `description` `error` `required` |
| 9 | Input | `sm` `default` `lg` `start-adornment` `end-adornment` `invalid` `read-only` `disabled` |
| 10 | Textarea | `default` `invalid` `disabled` |
| 11 | Checkbox | `unchecked` `checked` `indeterminate` `disabled` `invalid` |
| 12 | Search | `empty` `filled` |
| 13 | Select | `default` `grouped` `invalid` `disabled` |
| 14 | Filter | `default` `count` |
| 15 | Combobox | `local` `remote` `create` |
| 16 | Calendar | `default` `disabled-dates` |
| 17 | DateTimePicker | `datetime` `date` `invalid` |
| 18 | Modal | `sm` `md` `lg` `dirty` `submitting` |
| 19 | ConfirmDialog | `default` `destructive` `async-failure` |
| 20 | Toast | `success` `info` `warning` `destructive` `queue` `action` |
| 21 | Tooltip | `default` |
| 22 | Table | `default` `sorted` `rail` `loading` `empty` |
| 23 | Tabs | `default` `disabled` |
| 24 | Pagination | `first` `middle` `last` |
| 25 | Sidebar | `expanded` `collapsed` |
| 26 | Breadcrumb | `default` |
| 27 | PageHeader | `page-title` `sub-nav` |
| 28 | ThemeProvider | `root` |
| 29 | ThemeToggle | `default` |

### 모듈 4 — 입력 컴포넌트

#### AC-UI-001-15 — Button loading (maps REQ-UI-001-015)

- **Given** `loading` 상태이고 포커스가 있는 Button(`onClick` 감시)
- **When** 클릭하고 Enter를 누른 뒤, `loading`을 `false`로 다시 렌더링하고 한 번 더 누른다
- **Then** `loading`인 동안 `onClick`이 한 번도 호출되지 않고, `aria-busy="true"`, `aria-disabled="true"`이며 `disabled` 속성이 없고 포커스가 그대로 Button에 있다
- **And** `loading`이 끝나면 `aria-busy`·`aria-disabled`가 사라지고 다음 누르기에서 `onClick`이 한 번 호출된다. 변형 5종·크기 5종이 렌더링되고, `asChild`로 감싼 링크는 `<a>`로 렌더링되며, 아이콘 전용 Button은 접근 이름을 가진다
- **검증**: `npx vitest run src/ui-core/button.test.tsx`

#### AC-UI-001-16 — Field 연결과 필수 표시 (maps REQ-UI-001-016)

- **Given** 설명, 오류, 필수 표시가 있는 Field가 Input을 감싼다. 같은 Field로 Textarea, Select, Checkbox, Combobox, DateTimePicker도 감싼다
- **When** 오류를 표시했다가 지운다
- **Then** 오류가 있을 때 라벨 `htmlFor`와 컨트롤 `id`가 같고, `aria-describedby`가 설명 id와 오류 id 두 개이며, `aria-invalid="true"`가 있고, `*` 표시는 `aria-hidden`이며, 오류 문구 앞에 아이콘이 있다
- **And** 오류를 지우면 `aria-describedby`에 설명 id 하나만 남고 `aria-invalid`가 사라진다
- **And** 필수 표시는 Input·Textarea·Combobox 입력에 `required` 속성으로, Select 트리거·Checkbox·DateTimePicker 트리거에 `aria-required="true"`로 나타난다(버튼 요소에는 `required` 속성이 유효하지 않다)
- **검증**: `npx vitest run src/ui-core/field.test.tsx` · 각 컨트롤 테스트의 Field 연결 사례

#### AC-UI-001-17 — 기본 입력과 선택 (maps REQ-UI-001-017)

- **Given** `{ value: "1", label: "젤 네일" }`·`{ value: "2", label: "속눈썹 연장" }` 옵션의 Select, `{ value: "all", label: "전체" }`·`{ value: "today", label: "오늘" }`·`{ value: "week", label: "이번 주" }` 옵션의 Filter(값 `all`), `aria-label="고객 검색"`인 Search, 일부 선택 상태의 Checkbox, 앞 아이콘과 뒤 부가 표시 "원"이 있는 Input, Textarea
- **When** Select 트리거에서 Enter로 목록을 열고 ↓·↑로 "젤 네일"에 포커스를 둔 뒤 Enter를 누르고, Filter의 선택된 "전체"에서 →를 누른 뒤 Space를 누르고, Search에 글자를 넣고 지우기 버튼을 누르고, Checkbox에서 Enter를 누른 뒤 Space를 누른다
- **Then** Select의 `onValueChange`가 라벨이 아닌 `"1"`을 받고 트리거에 "젤 네일"이 보이며, 다시 열면 선택된 옵션에 체크 아이콘이 있다
- **And** Filter는 `role="radiogroup"` 안에서 →로 포커스와 선택(`aria-checked="true"`)이 함께 "오늘"로 옮겨지고 `onValueChange("today")`가 한 번 불리며, Space는 선택을 해제하지 않는다
- **And** Search는 접근 이름 "고객 검색"을 갖고, 값이 있을 때만 "검색어 지우기" 버튼이 보이며, 누르면 빈 값을 알리고 포커스가 입력으로 돌아간다
- **And** Checkbox는 Enter로는 바뀌지 않고(Radix Checkbox 1.4.1은 Enter를 막는다) Space로 `aria-checked`가 `mixed`에서 `true`로 바뀐다
- **And** Input의 "원"은 id를 갖고 입력의 `aria-describedby`에 들어가며 앞 아이콘은 `aria-hidden`이고, Textarea는 최소 높이 클래스를 가진다
- **검증**: `npx vitest run src/ui-core/select.test.tsx src/ui-core/filter.test.tsx src/ui-core/search.test.tsx src/ui-core/checkbox.test.tsx src/ui-core/input.test.tsx src/ui-core/textarea.test.tsx`

#### AC-UI-001-18 — Combobox 하이라이트·ARIA·키보드 (maps REQ-UI-001-018)

- **Given** 로컬 옵션 "김민지", "김민수", "박서연"이 이 순서로 있는 닫힌 Combobox(값 없음)
- **When** "김"을 입력하고 ↓와 Enter를 누른 뒤, 입력을 모두 지우고 "박"을 입력해 Esc를 두 번 누른다
- **Then** 입력의 `aria-expanded`가 입력 전 `"false"`, "김" 입력 뒤 `"true"`이고, 이때 첫 옵션 "김민지"가 하이라이트되어 `aria-activedescendant`가 그 옵션 id를 가리키며, `aria-controls`가 `role="listbox"` 요소의 id와 같다
- **And** ↓ 뒤 `aria-activedescendant`가 "김민수"를 가리키고, Enter로 `onValueChange`가 "김민수"의 값을 받으며 입력이 "김민수"를 보이고 `aria-expanded`가 `"false"`가 된다
- **And** "박"을 입력하면 다시 열려 "박서연"이 하이라이트되고, 첫 Esc는 목록만 닫으며(값은 "김민수" 그대로), 두 번째 Esc는 입력을 비우고 `onValueChange(null)`을 한 번 부른다
- **비고**: 첫 옵션 자동 하이라이트는 cmdk 1.1.1의 기본 동작이다(항목이 등록될 때 하이라이트 값이 없으면 첫 활성 항목을 고른다 — research.md §6.14). 입력 글자가 바뀔 때 하이라이트를 첫 옵션으로 되돌리는 것은 제어형 `value`로 맞춘다. 포커스 이탈 되돌리기와 값 동기화는 EC-22·EC-23
- **검증**: `npx vitest run src/ui-core/combobox.test.tsx`

#### AC-UI-001-19 — cmdk 고정 ARIA 대응과 IME (maps REQ-UI-001-018)

- **Given** cmdk 1.1.1이 자체 입력 요소의 `aria-expanded`를 `true`로 고정한다(research.md §6.3)
- **When** Combobox를 닫힌 상태로 렌더링해 확인하고, "김"을 입력해 "김민지"가 하이라이트된 목록을 연 다음, 한글 조합 중인 Enter 키 이벤트(`isComposing: true`, 그리고 `keyCode: 229`)를 보내고, 이어 조합이 끝난 Enter를 보낸다
- **Then** Combobox 안의 `role="combobox"` 요소가 정확히 하나이고, 닫혀 있을 때 그 `aria-expanded`가 `"false"`다
- **And** 조합 중 Enter로는 `onValueChange`가 불리지 않고 목록이 열린 채이며, 조합이 끝난 Enter는 하이라이트된 "김민지"를 고른다
- **And** 채택한 구조(1순위: 직접 만든 입력, 2순위: `Command.Input` + 보정)와 그 근거가 progress.md §E.2에 "Combobox 구조" 항목으로 기록된다(manager-develop). 두 구조 모두 이 기준을 통과하지 못하면 구현을 멈추고 blocker로 보고한다
- **검증**: `npx vitest run src/ui-core/combobox.test.tsx` · `grep -n "Combobox 구조" .moai/specs/SPEC-UI-001/progress.md` → 1줄 이상

#### AC-UI-001-20 — Combobox 두 거르기 모드의 알림과 새 값 만들기 (maps REQ-UI-001-019)

- **Given** 로컬 모드 Combobox(옵션 "김민지"·"김민수"·"박서연", 빈 결과 문구 기본값 "일치하는 항목이 없어요.", `createAction`의 라벨 "새 고객 등록")와 원격 모드 Combobox(`filtering="remote"`, 빈 결과 문구 "‘김민’과 일치하는 고객이 없어요.", 같은 `createAction`)
- **When** 로컬 모드에서 "박", "최", "김민지"를 차례로 입력하고, 원격 모드에서 "김민"을 입력한 뒤 `loading=true` → `loading=false`와 빈 배열 → 검색어와 맞지 않는 옵션 "박서연" 순으로 다시 렌더링한다
- **Then** 로컬 모드: "박"에서는 `aria-live="polite"` 영역에 "결과 1개"가 알려지고 목록 끝에 "새 고객 등록"이 있으며, "최"에서는 빈 결과 문구가 알려지고 "새 고객 등록"을 고르면 `createAction.onSelect("최")`가 불리고, "김민지"에서는 라벨이 똑같은 옵션이 있어 "새 고객 등록"이 없다
- **And** 원격 모드: 로딩 중에는 목록 안에 `role="status"` 불러오는 중 표시가 있고 결과 개수를 알리지 않으며, 빈 배열에서는 지정한 빈 결과 문구가 알려지고 "새 고객 등록"이 있고, "박서연"은 검색어와 맞지 않아도 걸러지지 않고 표시되며 "결과 1개"가 알려진다
- **검증**: `npx vitest run src/ui-core/combobox.test.tsx`

#### AC-UI-001-21 — Calendar 키 이동과 DateTimePicker 값 결합 (maps REQ-UI-001-020)

- **Given** 가짜 타이머로 오늘을 2026-10-29(목) 10:00으로 고정하고, 값이 없는 DateTimePicker(영업시간 09:00~21:00, 간격 30분)
- **When** 트리거에서 Enter로 대화상자를 열고 →, ←, ↓, ↑, PageDown, PageUp, Shift+PageDown, Shift+PageUp, Home, End를 차례로 누른 뒤, ←·←로 10월 29일에 돌아와 Enter를 누르고, 시간 칸에서 "14:30"을 고른다
- **Then** 열자마자 포커스가 2026년 10월 29일 날짜 버튼에 있고, 달력 머리가 "2026년 10월", 요일 머리가 "일"부터 시작하며, 격자는 `role="grid"`다
- **And** 키를 누를 때마다 포커스된 날짜가 다음과 같다: → 10-30, ← 10-29, ↓ 11-05(머리 "2026년 11월"), ↑ 10-29, PageDown 11-29, PageUp 10-29, Shift+PageDown 2027-10-29, Shift+PageUp 2026-10-29, Home 10-25(일), End 10-31(토)
- **And** 10월 29일을 Enter로 고르면 `onValueChange`는 아직 불리지 않고 포커스가 시간 칸 트리거로 옮겨지며, 시간 칸은 "09:00"부터 "21:00"까지 두 자리 시로 25개다
- **And** "14:30"을 고르면 `onValueChange`가 2026-10-29 14:30(로컬 시각)의 `Date`로 한 번 불리고 대화상자가 닫혀 포커스가 트리거로 돌아오며 트리거가 "2026. 10. 29. (목) 14:30"을 보인다. 다시 열어 Esc로 닫아도 포커스가 트리거로 돌아온다. 일요일·토요일 날짜는 각각 destructive·primary 수정자 클래스를 가진다
- **비고**: 이동 단위는 react-day-picker 10.0.2 `dist/esm/DayPicker.js`의 키 표와 date-fns `ko`의 `weekStartsOn: 0`, 월 머리는 `ko`를 연도 먼저 로캘로 보고 `Intl.DateTimeFormat`으로 만드는 `DateLib.formatMonthYear`에서 확인했다(research.md §6.14). 열 때 첫 포커스를 날짜에 두는 것, 날짜 선택 뒤 시간 칸으로 포커스를 옮기는 것은 이 SPEC이 정한 동작이므로 RED 테스트를 먼저 쓴다
- **검증**: `npx vitest run src/ui-core/calendar.test.tsx src/ui-core/date-time-picker.test.tsx`

### 모듈 5 — 표시·오버레이·탐색 컴포넌트

#### AC-UI-001-22 — Modal과 ConfirmDialog (maps REQ-UI-001-021)

- **Given** (가) 입력 두 개가 있고 입력이 바뀐(`dirty`) Modal, (나) 같은 Modal에 `closeDisabled`(제출 중), (다) `showConfirm({ title: "김민지 고객을 삭제할까요?", description: "고객 정보와 시술 이력이 모두 삭제되고 되돌릴 수 없어요.", confirmLabel: "삭제", tone: "destructive" })` 호출
- **When** (가)를 버튼으로 열고 닫기 버튼·Esc·스크림 누르기로 각각 닫기를 시도해 확인에서 "계속 작성"과 "닫기"를 고르고, (나)에서 같은 세 방법을 시도하며, (다)에서 Esc, 다시 호출해 취소, 다시 호출해 확인, `onConfirm`이 실패하는 호출에서 확인을 누른다
- **Then** (가) 열리면 포커스가 첫 입력에 있고(닫기 버튼이 아님), 세 방법 모두 "작성 중인 내용이 사라져요. 닫을까요?" 확인을 띄우며, "계속 작성"이면 열린 채, "닫기"면 닫히고 포커스가 연 버튼으로 돌아온다
- **And** (나) `dirty`와 `closeDisabled`가 함께 참이어도 세 방법 모두 닫히지 않고, 작성 중 확인 대화상자가 뜨지 않는다. 닫기 버튼은 `aria-disabled="true"`다
- **And** (다) 대화상자는 `role="alertdialog"`이고 처음 포커스는 취소 버튼이며, Esc·취소는 `false`, 확인은 `true`로 Promise가 끝나고, `onConfirm` 실패 때는 확인 버튼이 loading을 거쳐 대화상자가 남고 안에 `role="alert"` 알림이 보인다. 설명이 없는 Modal에는 `aria-describedby`가 없고 콘솔 경고가 0건이다
- **비고**: Radix Dialog 1.3.1의 FocusScope는 열릴 때 DOM 순서의 첫 포커스 가능 요소에 포커스를 두고, AlertDialog 1.2.1은 취소 버튼에 포커스를 둔다(research.md §6.6·§6.14). 그래서 Modal의 닫기 버튼은 DOM 순서상 본문 뒤에 둔다(design.md §4.6)
- **검증**: `npx vitest run src/ui-core/confirm-dialog.test.tsx src/ui-core/modal.test.tsx`

#### AC-UI-001-23 — Toast 대기열·시간·멈춤·F8·닫기 (maps REQ-UI-001-022)

- **Given** 가짜 타이머(`Date` 포함)와 앱 루트에 하나 있는 `Toaster`(알림 영역 이름 "알림 ({hotkey})" → "알림 (F8)")
- **When** (1) `toast.success("예약을 저장했어요.")`, `toast.info(…)`, `toast.warning(…)`, `toast.error("예약을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.")`를 차례로 부르고 시간을 흘린다. (2) success 하나를 띄우고 4초 뒤 알림 영역에 포인터를 올려 10초를 흘린 뒤 포인터를 내리고 1초를 흘린다. (3) F8을 누른다. (4) error 알림에 포커스를 두고 Esc를 누르고, 다른 error 알림은 "알림 닫기" 버튼으로 닫는다
- **Then** (1) 처음에는 3개만 보이고 네 번째(error)는 대기하다가 앞의 알림이 닫히면 나타나며, success·info는 5초, warning은 7초 뒤 사라지고 error는 60초가 지나도 남는다
- **And** (2) 포인터가 올라가 있는 10초 동안 success가 남고, 내린 뒤 남은 1초가 지나면 닫힌다. 포커스가 알림 영역 안에 있을 때도 타이머가 멈춘다
- **And** (3) F8은 포커스를 이름이 "알림 (F8)"인 영역으로 옮기고, (4) Esc와 "알림 닫기" 버튼은 각각 error 알림을 닫는다. 스와이프 닫기는 Radix 기본값(오른쪽, 50px)을 그대로 두며 jsdom에서는 확인하지 않고 브라우저에서 수동으로 확인한다(§6 공백, REQ-UI-001-022)
- **And** error 알림은 `assertive`, 나머지는 `polite`로 알려지고, 동작 버튼은 알림당 하나까지다
- **비고**: Radix Toast 1.3.1에서 확인한 기본 동작 — 단축키 `["F8"]`, 영역 이름 기본값 "Notifications ({hotkey})", 포인터 이동·포커스 진입 때 멈추고 벗어나면 남은 시간으로 다시 시작, 포커스된 알림의 Esc 닫기, `duration`이 `Infinity`면 타이머를 시작하지 않음(research.md §6.6·§6.14)
- **검증**: `npx vitest run src/ui-core/toast.test.tsx`

#### AC-UI-001-24 — 피드백·데이터 표시와 쪽 번호 배열 (maps REQ-UI-001-023)

- **Given** 행이 있는 Table(정렬 가능한 열, `getRowRail`, `align: "end"` 금액 열)과 Pagination, 그리고 `loading` Table, 빈 행 Table, Alert, Loading, Badge, EmptyState, Tabs, Card
- **When** 정렬 머리글 버튼을 세 번 누르고, `loading` Table을 가짜 타이머로 SkeletonGroup 기본 `delayMs`(300ms) 전후에 확인하고, 빈 행 Table을 렌더링하며, Pagination을 EC-04·EC-05 표의 `pageCount`·`page` 조합으로 다시 렌더링한다
- **Then** `onSortChange`가 오름 → 내림 → 해제 순으로 불리고 머리글 `aria-sort`가 `ascending` → `descending` → `none`이며, 레일 색 값이 첫 셀의 `border-inline-start`(3px)로 그려지고, 금액 열에 오른쪽 정렬과 `tabular-nums`가 있다
- **And** 300ms 전에는 스켈레톤이 없고 이후 같은 열 구조의 6행이 `aria-busy="true"` 영역에 보이며, 빈 행에서는 `empty` 자리가 렌더링된다
- **And** Pagination의 번호 배열(줄임표 포함)이 EC-04·EC-05 기대값 표와 같고, `nav` 이름은 "페이지 이동", 현재 쪽은 `aria-current="page"`다
- **And** Alert는 `live`일 때만 `role="alert"`, Loading은 `role="status"`와 기본 문구 "불러오는 중…", EmptyState는 동작 하나, Badge는 tone별 토큰 클래스, Tabs는 `tablist`와 방향키 이동(자동 활성화), Card는 조합 부품을 가진다
- **검증**: `npx vitest run src/ui-core/table.test.tsx src/ui-core/pagination.test.tsx src/ui-core/skeleton.test.tsx src/ui-core/alert.test.tsx src/ui-core/loading.test.tsx src/ui-core/badge.test.tsx src/ui-core/empty-state.test.tsx src/ui-core/tabs.test.tsx src/ui-core/card.test.tsx`

#### AC-UI-001-25 — 탐색과 PageHeader 제목 수준 (maps REQ-UI-001-024)

- **Given** 가짜 라우터 링크 컴포넌트(받은 `to`를 기록)를 주입한 Sidebar(묶음 2개, 항목 4개)와 Breadcrumb(3단계), 그리고 PageHeader
- **When** `currentPath`를 `/manager/customers`로 바꾸고, Sidebar를 접은(`collapsed`) 뒤 "고객" 항목에 Tab으로 포커스를 주고 Esc를 누르며, PageHeader를 기본값과 `titleAs="h2"`로 각각 렌더링한다
- **Then** 링크 컴포넌트가 각 항목의 `to`를 받고, "고객" 항목과 Breadcrumb 마지막 항목에 `aria-current="page"`가 붙으며, Breadcrumb은 `nav` "현재 위치"와 `ol`, `aria-hidden` 구분 기호를 가진다
- **And** 접힌 항목의 이름은 숨긴 텍스트로 남아 접근 이름이 유지되고, 포커스 때 Tooltip이 이름을 보이며 Esc로 닫힌다
- **And** PageHeader 제목은 기본 렌더링에서 h1 하나이고, `titleAs="h2"`면 h1 없이 h2로 렌더링된다
- **검증**: `npx vitest run src/ui-core/sidebar.test.tsx src/ui-core/breadcrumb.test.tsx src/ui-core/page-header.test.tsx src/ui-core/tooltip.test.tsx`

## 3. 경계 사례

인수 기준을 늘리지 않고, 해당 인수 기준의 테스트 파일 안에서 함께 확인한다.

| ID | 속한 AC | 경계 사례 | 기대 결과 |
|---|---|---|---|
| EC-01 | AC-UI-001-08 | `localStorage` 접근이 예외를 던진다(사생활 보호 모드 등) | 시스템 판정, 예외가 밖으로 새지 않음 |
| EC-02 | AC-UI-001-08 | 저장값이 `"blue"`처럼 잘못됐다 | 시스템 판정 |
| EC-03 | AC-UI-001-07 | 다크에서 시스템으로 바꾼다 | 저장값 `system`, 운영체제 설정에 따라 `.dark` 결정 |
| EC-04 | AC-UI-001-24 | Pagination `pageCount`가 0 또는 1 | 0이면 번호 없음, 1이면 "1" 하나. 이전·다음 모두 비활성, 줄임표 없음 |
| EC-05 | AC-UI-001-24 | `page`가 첫 쪽·끝 쪽·가운데·줄임표 경계 | 아래 기대값 표와 같음 |
| EC-06 | AC-UI-001-21 | 영업시간 끝이 간격과 맞지 않는다(09:00~20:50, 30분) | 마지막 칸 20:30 |
| EC-07 | AC-UI-001-21 | `isDateDisabled`가 참인 날 | 고를 수 없고 비활성으로 표시, 방향키 이동은 비활성 날짜를 건너뜀(react-day-picker 기본) |
| EC-08 | AC-UI-001-22 | `showConfirm()`을 연달아 두 번 부른다 | 두 번째는 첫 번째가 닫힌 뒤 열림(호출 순서 보장) |
| EC-09 | AC-UI-001-23 | 없는 id로 `toast.dismiss`를 부른다 | 오류 없이 무시 |
| EC-10 | AC-UI-001-24 | 로딩이 SkeletonGroup 기본 `delayMs`(300ms) 안에 끝난다 | 스켈레톤이 한 번도 보이지 않음 |
| EC-11 | AC-UI-001-18 | 옵션이 없는 상태에서 ↓를 누른다 | 오류 없음, `aria-activedescendant` 없음 |
| EC-12 | AC-UI-001-18 | 열린 상태에서 Home/End를 누른다 | 입력 커서만 움직이고 하이라이트는 그대로(cmdk가 Home/End를 가로채지 않게 막음) |
| EC-13 | AC-UI-001-16 | 설명만 있고 오류가 없다 | `aria-describedby`에 설명 id 하나, `aria-invalid` 없음 |
| EC-14 | AC-UI-001-25 | 접힌 Sidebar를 다시 편다 | 숨긴 텍스트가 보이는 이름으로 바뀌고 Tooltip이 뜨지 않음 |
| EC-15 | AC-UI-001-13 | 감속 모드가 꺼진 환경 | 스피너가 `motion-safe:` 회전 클래스를 가짐 |
| EC-16 | AC-UI-001-11 | Modal 안에서 마지막 요소 다음으로 Tab | 포커스가 대화상자 첫 요소로 돌아옴(밖으로 나가지 않음) |
| EC-17 | AC-UI-001-04 | `ALLOW_PREVIEW_ONLY_DEPLOY=true`처럼 `1`이 아닌 값 | 가드가 막고 종료 코드 1, 표시 파일·대역 기록 없음 |
| EC-18 | AC-UI-001-10 | 규칙 점검 테스트에 위반 표본을 넣는다(허용 구역 바로 밖의 `bg-rose-700`, `basis-md`, `Loader2` 가져오기 포함) | 각 규칙이 표본을 잡아내고 실패 메시지에 `경로:줄`이 있음(거짓 통과 방지). `font-black`·`max-w-dialog-md`는 잡지 않음(거짓 실패 방지) |
| EC-19 | AC-UI-001-05 | 테스트 안에서 토큰 하나를 기준 미달 값으로 바꾼 사본 | 대비 검사가 실패를 보고함 |
| EC-20 | AC-UI-001-05 | system.md 사본의 토큰 값 하나를 바꾼다 | 토큰 동기화 검사가 그 토큰 이름과 두 값을 보고하며 실패함 |
| EC-21 | AC-UI-001-07 | 마운트 때 `localStorage.getItem`이 예외를 던진다 | 선택 `system`, 예외 없음 |
| EC-22 | AC-UI-001-18 | 값이 "김민수"일 때 다른 글자를 입력하다가 Tab으로 벗어난다 | 입력이 "김민수"로 되돌아가고 `onValueChange` 호출 없음 |
| EC-23 | AC-UI-001-18 | 닫힌 상태에서 부모가 `value`를 바꾼다 / 입력 중(열림)에 바꾼다 / 목록에 없는 값을 `valueLabel`과 함께 준다 | 닫힘: 입력이 새 라벨로 바뀜. 열림: 입력을 덮어쓰지 않고 닫힐 때 맞춤. 목록에 없음: `valueLabel`을 보임 |
| EC-24 | AC-UI-001-21 | 값이 없을 때 날짜만 고르고 Esc로 닫는다 | `onValueChange` 호출 0회, 값 `null` 그대로, 트리거는 placeholder |
| EC-25 | AC-UI-001-21 | `granularity="date"` | 시간 칸이 없고, 날짜를 고르면 그날 00:00의 `Date`로 한 번 알린 뒤 닫힘 |
| EC-26 | AC-UI-001-21 | 값(2026-10-29 14:30)이 있을 때 날짜만 10월 30일로 바꾼다 | 2026-10-30 14:30으로 한 번 알림 |
| EC-27 | AC-UI-001-22 | `dirty`도 `closeDisabled`도 아닌 Modal에서 스크림을 누르거나 Esc를 누른다 | 확인 없이 닫히고 포커스가 연 버튼으로 돌아옴 |
| EC-28 | AC-UI-001-14 | `tnum` 판정 함수에 아래 표의 너비 조합을 넣는다 | 아래 표의 판정과 같음 |
| EC-29 | AC-UI-001-01 | 의존성 비교 함수에 남는 항목, `^19.3.1` 같은 범위, 다른 버전을 넣은 사본 | 각각 실패를 보고함 |
| EC-30 | AC-UI-001-20 | 입력이 공백뿐이다(`"  "`) | 새 값 만들기가 보이지 않음(앞뒤 공백을 지운 값으로 판단) |

### 3.1 EC-04·EC-05 기대값 — Pagination 번호 배열(정본)

이 표가 Pagination 번호 배열의 정본이다. 규칙은 spec.md REQ-UI-001-023·design.md §8.3과 같다: 현재 쪽 양옆은 한 쪽으로 고정한다(`siblingCount` prop 없음). `pageCount`가 7 이하이면 모든 쪽 번호를 줄임표 없이 보인다. 8 이상이면 줄임표를 포함해 언제나 7칸이고, 현재 쪽 `p`가 4 이하이면 `1 2 3 4 5 … 끝`, `p`가 `pageCount`−3 이상이면 `1 … 끝−4 끝−3 끝−2 끝−1 끝`, 그 사이면 `1 … p−1 p p+1 … 끝`이다.

| `pageCount` | `page` | 번호 배열(`…`는 줄임표) |
|---|---|---|
| 0 | — | (번호 없음) |
| 1 | 1 | 1 |
| 6 | 3 | 1 2 3 4 5 6 |
| 7 | 4 | 1 2 3 4 5 6 7 |
| 8 | 4 | 1 2 3 4 5 … 8 |
| 8 | 5 | 1 … 4 5 6 7 8 |
| 20 | 1 | 1 2 3 4 5 … 20 |
| 20 | 4 | 1 2 3 4 5 … 20 |
| 20 | 5 | 1 … 4 5 6 … 20 |
| 20 | 16 | 1 … 15 16 17 … 20 |
| 20 | 17 | 1 … 16 17 18 19 20 |
| 20 | 20 | 1 … 16 17 18 19 20 |

- `page` 5 / 20의 배열은 design-direction.md §12의 예("1 … 4 5 6 … 20")와 같다. `pageCount` 8의 두 행은 앞쪽·뒤쪽 경우가 바로 만나는 경계다.

### 3.2 EC-28 기대값 — `tnum` 판정

"1111"과 "0000"을 같은 글꼴로 두 번 잰다: 기본 숫자(`font-variant-numeric: normal`)와 `tabular-nums` 적용.

| 기본 숫자 너비 | `tabular-nums` 적용 너비 | 판정 문구 |
|---|---|---|
| 네 너비 가운데 하나라도 0 | (앞 칸과 함께 판단) | 고정폭 숫자: 측정 불가 |
| "1111" ≠ "0000" | "1111" = "0000" | 고정폭 숫자: 지원 |
| "1111" = "0000" | "1111" = "0000" | 고정폭 숫자: 기본 고정폭 |
| 상관없음 | "1111" ≠ "0000" | 고정폭 숫자: 미지원 |

- 너비 비교는 0.5px 허용 오차로 한다. 0 검사를 가장 먼저 한다.

## 4. 품질 게이트

마일스톤마다 아래를 모두 통과해야 한다. 명령은 저장소 루트에서 실행한다.

| ID | 확인 | 명령 | 통과 조건 |
|---|---|---|---|
| QG-01 | 타입 검사 | `npm run typecheck`(= 프로젝트 TypeScript 5.9.3의 `tsc --noEmit`) | 종료 코드 0 |
| QG-02 | 린트·서식(Biome) | `npm run lint`(= `biome check .`) | 종료 코드 0. 게이트가 Biome을 실행하지 않을 수 있으므로 따로 실행한다 |
| QG-03 | 테스트 | `npm test`(= `vitest run`) | 종료 코드 0 |
| QG-04 | 빌드 | `npm run build`(= `tsc --noEmit && vite build`) | 종료 코드 0 |
| QG-05 | 커버리지 | `npm run test:coverage`(커밋 직전) | `src/ui-core` 줄·문장·함수 ≥ 85%, 분기 ≥ 80%(미달이면 Vitest가 0이 아닌 코드로 끝남) |
| QG-06 | 토큰 동기화·대비 회귀 | `npx vitest run src/styles/tokens.sync.test.ts src/styles/tokens.contrast.test.ts` | 통과 |
| QG-07 | 기본 테마 정리 | `npx vitest run src/styles/theme-reset.test.ts`와 §4.1 QG-07 블록(M6 이후) | 통과, 빌드 CSS에 금지 선택자 없음 |
| QG-08 | 디자인 규칙·공개 내보내기·lucide 정식 이름 | `npx vitest run src/test/design-rules.test.ts` | 통과 |
| QG-09 | 커밋 게이트 | 마일스톤 커밋 시 pre-commit 훅의 `moai gate`(직접 확인: `moai gate; echo "gate exit=$?"`) | `gate exit=0`, 훅 우회 없음. M1·M6에서 실행 단계 기록(AC-UI-001-03) |
| QG-10 | SPEC 형식 | `moai spec lint .moai/specs/SPEC-UI-001/spec.md` | 오류 0건 |
| QG-11 | 도메인 경계 | §4.1 QG-11 블록 | 경계 검사 출력 없음, 패턴 자체 확인 `2` |
| QG-12 | 옛 의존성 | §4.1 QG-12 블록 | 출력 없음 |
| QG-13 | 배포 중지 가드 | `npx vitest run src/test/deploy-guard.test.ts` | 통과(대역 명령만 쓰고 실제 배포 없음) |
| QG-14 | 의존성 정확 고정 | `npx vitest run src/test/dependency-pins.test.ts` | 통과 |
| QG-15 | 미리보기 전시 | `npx vitest run src/preview/PreviewPage.test.tsx` | 통과 |

### 4.1 정규식 검사 명령

```bash
# QG-11 도메인 경계: 출력이 없어야 한다(ui-core 테스트 파일 포함)
grep -rnE 'RESERVED|VISITED|COMPLETED|CANCELLED|NO_SHOW|status-(reserved|visited|completed|cancelled|no-show)' src/ui-core
# QG-11 패턴 자체 확인: 2가 나와야 한다(패턴이 표본을 실제로 잡는지)
printf '%s\n' 'NO_SHOW' 'bg-status-no-show-rail' | grep -cE 'RESERVED|VISITED|COMPLETED|CANCELLED|NO_SHOW|status-(reserved|visited|completed|cancelled|no-show)'

# QG-12 옛 의존성: 출력이 없어야 한다(규칙 점검 테스트의 패턴 문자열은 제외)
grep -rnE --exclude='*.test.*' 'zustand|@headlessui|axios|react-router|@fullcalendar|file-saver' package.json src

# QG-07 보강(M6 이후): 원본에는 시연용 금지 클래스가 있고 빌드 CSS에는 그 선택자가 없어야 한다
grep -c 'bg-rose-700' src/preview/sections/VerificationSection.tsx   # 1 이상
grep -l '\.bg-rose-700' dist/assets/*.css                            # 출력 없음
```

- 실행 시간: `npm test` 전체가 게이트의 테스트 단계 제한(120초)보다 충분히 짧아야 한다. 마일스톤마다 실행 시간을 기록한다.

## 5. 완료 정의

- 인수 기준 25개가 모두 통과했고, 각 판정의 명령·출력·HEAD SHA가 기록됐다.
- 품질 게이트 QG-01 ~ QG-15가 마지막 마일스톤(M6) 커밋에서 모두 통과했다.
- 마일스톤 M1 ~ M6의 커밋이 각각 pre-commit 게이트를 통과했고, 컴포넌트마다 RED 실패 출력이 보존됐다.
- progress.md §E.2·§E.3이 manager-develop에 의해 기록됐고(Combobox 구조 결정, `moai gate` 실행 단계와 TypeScript 경로, `tnum` 판정), MX 태그(plan.md §E.5)가 반영됐다.
- 운영 배포는 실행되지 않았다. 배포 가드는 대역 명령을 쓰는 테스트로만 확인했다.
- 사용자가 미리보기 페이지(`npm run dev`)로 컴포넌트를 검토할 준비가 됐다.

## 6. 증거 기록

- 판정 하나마다 주장, 증거(명령과 출력 원문), 기준선 귀속(HEAD SHA, 이 트리), 공백(확인하지 못한 것), 잔여 위험을 적는다.
- 출력이 길면 `.moai/state/verify/<세션>/`에 파일로 남기고, 보고에는 종료 코드와 끝부분만 인용한다.
- 브라우저에서만 확인할 수 있는 항목(Noto Sans KR Variable `tnum` 실측 판정, Windows 고대비 수동 확인, Toast 스와이프 닫기)은 공백으로 분명히 표시하고, 확인했다면 그 결과를 진행 기록에 적는다.
