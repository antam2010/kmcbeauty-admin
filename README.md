# kmcbeauty-admin

kmcbeauty-admin은 뷰티숍 원장·실장이 예약·고객·시술 메뉴를 관리하는 한국어 관리자 웹이다. 지금은 이 관리자 웹을 처음부터 다시 만드는 중이며, 두 SPEC으로 나누어 진행한다.

- **SPEC-UI-001(완료)** — 프로젝트 기반(Vite 8 · Tailwind CSS 4 · TypeScript 5.9 · Vitest 5 · Biome 2.6), 디자인 토큰, 컴포넌트 라이브러리 `src/ui-core`, 컴포넌트 미리보기 페이지를 만들었다.
- **SPEC-UI-002(예정)** — 업무 화면(로그인, 매장 선택, 예약 캘린더, 고객, 시술 메뉴 등)과 API·인증·라우팅을 `src/ui-core`로 다시 만든다.

## 현재 상태

`main`에는 컴포넌트 미리보기 페이지만 있다. 기존 업무 화면은 지웠고, 커밋 `28c87a9`에 참고 자료로 남아 있다. 이 상태로 배포하면 운영 관리자 화면이 미리보기로 바뀌므로 `deploy.sh`가 배포를 막는다(아래 "배포" 참고).

## 요구 사항과 설치

- Node.js `^22.13.0 || ^24.0.0`(`package.json`의 `engines`)
- npm(`package-lock.json` 기준)

```bash
npm ci
```

## npm 스크립트

| 스크립트 | 하는 일 |
|---|---|
| `npm run dev` | Vite 개발 서버를 띄운다 |
| `npm run build` | 타입 검사(`tsc --noEmit`) 뒤 `vite build`로 `dist/`를 만든다 |
| `npm run preview` | 빌드 결과를 로컬에서 띄운다 |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` / `npm run lint:fix` | Biome 검사 / 자동 수정 |
| `npm run format` | Biome 서식 적용 |
| `npm test` / `npm run test:watch` | Vitest 1회 실행 / 감시 모드 |
| `npm run test:coverage` | Vitest 커버리지 측정 |
| `npm run check` | 타입 검사 · Biome 검사 · 테스트를 차례로 실행한다 |

## 미리보기 열기

```bash
npm run dev
```

진입점 `src/main.tsx`는 `ThemeProvider` 안에 미리보기 페이지(`src/preview/PreviewPage.tsx`)와 명령형 API용 `Toaster`·`ConfirmDialogHost`를 그린다. 미리보기에서 `ui-core` 컴포넌트를 라이트·다크 테마로 검토한다.

## 배포

`deploy.sh`는 맨 앞에서 `ALLOW_PREVIEW_ONLY_DEPLOY`가 정확히 `1`인지 확인한다. 그렇지 않으면 `.env.stage`를 읽기 전에 `exit 1`로 끝난다. 지금 배포하면 운영 화면이 미리보기로 바뀌므로 **SPEC-UI-002가 업무 화면을 되살리기 전에는 배포하지 않는다.** 이 확인 단계는 SPEC-UI-002에서 지운다.

## 디렉터리 구성

| 경로 | 내용 |
|---|---|
| `src/ui-core/` | 컴포넌트 라이브러리. 공개 API는 `src/ui-core/index.ts`에서 이름별로 내보내며, 사용하는 쪽은 `@/ui-core`에서만 가져온다 |
| `src/styles/tokens.css` | 디자인 토큰(CSS 변수, 라이트·다크) |
| `.moai/design/system.md` | 토큰과 UI 규칙의 기준 문서 |
| `src/preview/` | 컴포넌트 미리보기 페이지와 섹션 |
| `src/test/` | 테스트 설정(`setup.ts`)과 디자인 규칙·배포 확인 등 저장소 단위 테스트 |
| `.moai/specs/SPEC-UI-001/` | 이 작업의 SPEC, 계획, 인수 기준, 진행 기록 |
