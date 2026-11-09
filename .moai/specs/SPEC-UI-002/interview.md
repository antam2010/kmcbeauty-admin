# 인터뷰: SPEC-UI-002 — 업무 화면·API·인증·라우팅 재구축과 배포 가드 제거

- 작성: 2026-11-09, MoAI 오케스트레이터(세션 `cd2cba80`)
- 입력: `/moai plan "SPEC-UI-002 — 업무 화면·API·인증·라우팅 재구축과 배포 가드 제거 (SPEC-UI-001 progress.md §E.4 후속 과제 반영)"`
- 프로젝트 문서 확인: `.moai/project/product.md`가 없다. 2026-11-09 SPEC-UI-001 동기화 때 사용자가 프로젝트 문서를 만들지 않기로 했으므로 다시 묻지 않고 건너뛰었다.

## 질문 전에 확인한 사실

| 항목 | 확인 내용 | 근거 |
|---|---|---|
| 예전 앱 화면 | 로그인, 매장 선택, 대시보드(예약 캘린더), 고객, 시술 메뉴, 시술 이력, 이용약관, 개인정보처리방침 | `git ls-tree -r --name-only 28c87a9 -- src/` |
| 예전 앱 구조 | axios로 직접 작성한 API 모듈 5개(`auth`·`phonebook`·`shop`·`treatment`·`treatment_menu`), zustand 저장소 7개, `RequireAuth`, `routes.tsx` | 같은 명령 |
| 예전 의존성 | react-router-dom 7, @tanstack/react-query 5, @fullcalendar/* 6, @tanstack/react-table 8, axios 1, zustand 5, file-saver | `git show 28c87a9:package.json` |
| 지금 의존성 | 라우터·서버 상태·HTTP 클라이언트 라이브러리가 없다 | `package.json` |
| Orval | 예전 앱은 쓰지 않았다. SPEC-UI-001 계획에 "Orval 생성 코드는 SPEC-UI-002로"라는 한 줄만 있다 | `.moai/specs/SPEC-UI-001/plan.md:449` |
| API 주소 | 이 저장소 `.env`는 `https://api-kmc2.daeho2.shop`이다(2026-10-29 DNS 기록 없음). 백엔드 `scripts/deploy.sh`·`deploy/nginx/api-beauty.conf`·`docs/deployment.md`·`readme.rst`와 네이티브 앱 `eas.json:25` 운영 빌드는 `https://api-beauty.dongri.kr`을 쓴다 | 두 저장소 grep |
| CORS | `allow_origins`에 `https://kmc2.daeho2.shop`, `https://bueafit.vercel.app`만 있다 | `kmcbeauty-fastapi/app/main.py:135-138` |
| 인증 헤더 | `Authorization: Bearer` 액세스 토큰과 `X-Refresh-Token` 헤더를 허용한다 | `kmcbeauty-fastapi/app/main.py:146-147` |
| API 명세 공개 | 환경에 따라 `/docs`·`/openapi.json`을 끄는 분기가 있다. 조건은 아직 확인하지 않았다 | `kmcbeauty-fastapi/app/main.py:61-65` |
| 백엔드 변화 | 2026-11-09에도 초대 가입 409, 대표원장 보호, 대시보드 기본 날짜 변경이 병합됐다. 예전 axios 모듈의 요청 형식과 지금 API가 다를 수 있다(가설, 조사 단계에서 확인) | `git -C kmcbeauty-fastapi log -3` |
| 후속 과제 | SPEC-UI-001 §E.4의 18건 중 README 1건이 닫혀 17건이 남았다 | `.moai/specs/SPEC-UI-001/progress.md:591-615` |

## Interview Round 1: 범위와 외부 사실

### 1. API 서버 주소

- 질문: SPEC-UI-002는 어느 API 서버를 기준으로 계획할까?
- 선택지: `api-beauty.dongri.kr`(권장) / 예전 주소 유지 / 로컬 백엔드로 개발
- 답: **`https://api-beauty.dongri.kr`**. `VITE_API_BASE_URL`을 이 주소로 바꾸는 작업을 계획에 넣고, 조사 단계에서 이 주소를 기준으로 API 형태를 확인한다.

### 2. 업무 화면 범위

- 질문: 다시 만들 업무 화면은 어디까지인가?
- 선택지: 예전 8개 화면(권장) / 8개와 네이티브 앱 기능(직원 관리·초대 코드·매출 대시보드) / 핵심 화면만 먼저
- 답: **예전 8개 화면**. 로그인, 매장 선택, 예약 캘린더, 고객, 시술 메뉴, 시술 이력, 이용약관, 개인정보처리방침을 SPEC-UI-001 컴포넌트로 다시 만들고, 끝나면 배포 중지 가드를 지운다. 네이티브 앱에만 있는 기능은 범위 밖이다.

### 3. 미리보기 검토 결과

- 질문: SPEC-UI-001 미리보기 검토 결과를 어떻게 반영할까?
- 선택지: 아직 검토 전(권장) / 검토함, 문제 없음 / 검토함, 고칠 것 있음
- 답: **아직 검토 전**. `tnum` 판정은 "미검증"으로 기록하고, 숫자 열은 `tabular-nums`와 오른쪽 정렬을 유지한다. 대체 숫자 글꼴은 넣지 않으며, 업무 화면이 생긴 뒤 다시 확인할 항목으로 남긴다.

### 4. SPEC-UI-001 후속 과제

- 질문: 남은 17건(결함 2·배포 전 보강 3·정리 12) 가운데 어디까지 SPEC-UI-002에 넣을까?
- 선택지: 결함 2와 보강 3(권장) / 17건 모두 / 결함 2건만
- 답: **17건 모두**. 결함 2건(Modal 버리기 확인 상태, DateTimePicker 간격 밖 시간 값), 보강 3건(`deploy.sh`의 `.env.stage` 셸 실행, DefaultLink URL 스킴 허용 목록, CSP와 인라인 스크립트 해시), 정리·일관성 12건을 모두 넣는다.

## Interview Round 2: 조사 결과를 근거로 한 결정

조사 결과는 `research.md`, 조사원별 원본은 `.moai/state/verify/cd2cba80-827f-4657-b7ea-6a07e9f25df2/research/`에 있다.

### 바로잡은 사실

- 1회차 질문의 "예약 캘린더(예전 대시보드 화면)"는 틀렸다. 예전 `/manager` 대시보드는 액세스 토큰을 화면에 출력하는 빈 페이지였고, 캘린더는 `/manager/treatments`(`treatmentListPage.tsx`)였다.
- 예전 앱에는 시술 이력 화면이 없었다.
- 예전 캘린더는 보기 전용이었고(수정·삭제는 알림창만 띄움), 시술 메뉴의 추가·수정 창은 콘솔 출력만 하는 빈 껍데기였다.

### 5. 기능 범위

- 답: **백엔드 기능까지 모두**. 예약 등록·수정·취소·상태 변경, 시술 메뉴와 세부 항목 추가·수정·삭제, 고객 등록·수정·삭제를 백엔드 API로 실제 동작하게 만든다.

### 6. 시술 이력 화면

- 답: **목록 화면으로 새로 만든다**. `GET /treatments`로 기간·상태·검색 필터, 상태 배지, 쪽 나누기를 갖춘 표를 만든다. 기간 선택 컴포넌트가 새로 필요하다.

### 7. 예약 상태 전환 규칙

- 답: **흐름대로 바꾸고, 되돌릴 때는 확인**. 예약됨 → 방문함·취소됨·노쇼, 방문함 → 완료처럼 다음 단계는 바로 고르고, 끝난 상태(완료·취소됨·노쇼)를 되돌릴 때는 확인 대화상자를 거친다. 화면에서만 지키는 규칙이다(백엔드에는 전환 규칙이 없다).

### 8. API 코드

- 첫 답: "kmcbeauty-fastapi 쓰면 되지 않아?" 확인 결과 로컬 백엔드에서 명세서를 만들 수 있었다. `kmcbeauty-fastapi/.venv`(Python 3.12.3)에 `SENTRY_DSN=`·`LOG_TO_FILE=false`·`PYTHONDONTWRITEBYTECODE=1`을 주고 `app.openapi()`를 부르자, 파일 쓰기와 네트워크 없이 OpenAPI 3.1.0 문서(경로 31, API 50, 스키마 58)가 나왔다. Firebase 서비스 계정 파일이 없다는 오류가 한 번 찍혔지만 백엔드가 잡아 넘겼다. operationId는 FastAPI 자동 이름(예: `list_treatments_api_treatments_get`)이고 태그는 한글이다.
- 답: **타입 생성 + openapi-fetch**. 명세서를 이 저장소에 스냅숏으로 두고(다시 뽑을 때는 npm 스크립트가 옆 폴더 백엔드의 `.venv`를 쓴다), openapi-typescript로 타입 파일을 만들고, 호출은 openapi-fetch로 한다. TanStack Query 훅은 필요한 것만 직접 쓴다.

### 9. 운영 주소

- 답: **dongri.kr 아래 새 주소**(예: `admin-beauty.dongri.kr`, 정확한 이름은 배포 전에 정한다). 백엔드 CORS 목록과 `tests/test_cors_production_security.py` 변경은 백엔드 저장소의 별도 작업이며 이 SPEC 범위 밖이다.

### 10. 토큰 저장

- 답: **메모리 + HttpOnly 쿠키**. 액세스 토큰은 메모리에만 두고, 갱신은 백엔드가 주는 HttpOnly 리프레시 쿠키로 한다(`credentials: "include"`). 새로고침하면 쿠키로 새 액세스 토큰을 받는다. 응답 본문의 `refresh_token`은 저장하지 않는다.

### 묻지 않고 정한 기본값 (결정 지점 1에서 바꿀 수 있다)

- 로그인 뒤 첫 화면은 예약 캘린더다. 예전 빈 대시보드는 만들지 않는다.
- 상태 이름은 예약됨·방문함·완료·취소됨·노쇼다(`system.md §9`, 네이티브 `components/booking/BookingListScreen.tsx:23-27`과 같다). 방문함은 "손님이 와서 시술 중", 완료는 "시술이 끝남(시간이 지나면 백엔드가 자동 전환)"이다. 백엔드 `status_label`은 쓰지 않는다.
- 약관·개인정보처리방침 경로는 `/terms-of-service`, `/privacy-policy`를 유지한다.
- 고객 CSV 내보내기는 유지하되 file-saver 없이 만들고 CSV 값을 제대로 이스케이프한다.
- 라이브러리는 최신 안정판(react-router 8, FullCalendar 7, MSW 3)을 쓰고 engines를 `^22.22.0 || ^24.0.0`으로 올린다(로컬 Node v24.22.2).
- 컴포넌트 미리보기 페이지는 개발 서버에서만 열리는 경로로 남기고 운영 빌드에서 뺀다.
- 개발 중 API는 Vite 프록시로 부른다(localhost는 운영 CORS에 막힌다). 프록시 대상은 환경 변수로 바꿀 수 있게 하고, 기본값은 로컬 백엔드(`http://localhost:8000`)로 둔다. 운영 API를 대상으로 개발하면 실제 매장 데이터가 바뀌기 때문이다.
- 토큰 갱신 요청은 동시에 하나만 보낸다(single-flight).
- C3는 실제 방식대로 "main 직행, 임시 작업 트리에서 만들고 fast-forward로 합친다"로 쓴다.

### 알린 위험 (이 SPEC 범위 밖)

- 예전 로그인 코드(`28c87a9`의 `src/manager/pages/auth/LoginPage.tsx:7-8`)에 이메일·비밀번호 기본값이 들어 있고 저장소가 공개되어 있다. 실제 계정이면 비밀번호를 바꾸도록 사용자에게 알렸다.
- 백엔드는 사용자당 리프레시 토큰을 하나만 저장한다(`app/utils/redis/auth.py:8-15`). 관리자 웹에 로그인하면 같은 계정의 네이티브 앱 로그인이 다음 갱신 때 풀린다(조사 결과 기준).

## Interview Round 3: 배포 환경 확인 (plan.md §O 확인 필요 항목)

### 11. 운영 관리자 주소

- 답: **`admin-beauty.dongri.kr`**. 서버 확인 결과 `admin.dongri.kr`은 이미 다른 서비스(dcard)가 쓰고 있어 이름이 겹치지 않는다. Cloudflare 원본 인증서가 `*.dongri.kr`과 `dongri.kr`을 덮으므로 HTTPS도 같은 인증서로 된다.

### 12. 배포 서버 설정 가능 여부

- 답: 사용자가 접속 방법(`ssh -i ~/.ssh/id_ed25519 -p 8022 antam2010@maria.daeho.shop`)을 알려 주고 직접 확인을 요청했다. 읽기 전용으로 확인한 결과는 다음과 같다(증거: `.moai/state/verify/cd2cba80-827f-4657-b7ea-6a07e9f25df2/deploy-server/maria-daeho-shop-readonly-check.md`).
  - 서버 `mini-server-01`에서 nginx 1.30.6이 Docker 컨테이너 `nginx`로 돈다(80·443). 같은 서버에 `kmcbeauty-api` 등 백엔드 컨테이너가 있다.
  - 설정은 `/srv/server-mini2/nginx/conf.d`(소유자 `antam2010`)에 있고, 컨테이너는 `/srv/server-mini2/compose.yaml`로 띄운다. `antam2010`은 docker 그룹이라 sudo 없이 설정 파일을 더하고 nginx를 다시 읽힐 수 있다(sudo는 비밀번호가 필요하다).
  - 다른 사이트는 서버 수준 `add_header`로 HSTS, `X-Frame-Options DENY`, `frame-ancestors 'none'`(CSP Report-Only), `nosniff`, `Referrer-Policy`를 이미 쓴다. "location 안에 `add_header`를 두지 않는다"는 규칙이 주석으로 있다.
  - 정적 파일을 내주는 마운트는 아직 없다(마운트는 conf.d·nginx.conf·logs·인증서뿐이다). 관리자 웹을 내주려면 compose 마운트를 더하거나, 정적 파일 컨테이너를 두고 nginx가 프록시해야 한다.
- 결론: **경로 방식 라우팅을 유지한다.** SPA 경로 대체(`try_files … /index.html`)와 보안 헤더는 이 서버에서 설정할 수 있다. 실제 서버 작업(새 server 블록, 정적 파일 마운트, Cloudflare DNS 레코드, nginx 다시 읽기)은 운영 연결 작업이며 이 SPEC 범위 밖이다.

### 13. 배포 대상과 빌드 모드

- 답: **운영 서버, production 모드**. `deploy.sh`는 `--mode production`으로 빌드하고 `.env.production`을 읽는다. 배포 대상은 위 서버다(SCP 값은 `.env.production`에 둔다).

### 14. 운영 로그인 확인 시점

- 답: **SPEC 완료 뒤**. SPEC-UI-002는 테스트와 로컬 확인까지로 완료한다. 운영 로그인 확인(UR-8)은 백엔드 CORS 작업 뒤에 하는 별도 확인 항목으로 둔다.

## Interview Round 4: 사전 검토 결과에 따른 결정

계획 감사 전 관점별 사전 검토(읽기 전용 3명, 85건: 심각 6·중간 37·가벼움 42, `.moai/reports/plan-audit/SPEC-UI-002-lenses-1/`)에서 사용자 판단이 필요한 항목 하나를 물었다.

### 15. 캘린더 일정의 상태 표시

- 배경: REQ-UI-002-015는 "상태가 보이는 모든 곳에 아이콘 + 상태 이름", REQ-UI-002-017과 캘린더 설계는 "색·아이콘·시간·고객 이름"이라 서로 어긋났다. 방문함과 완료는 색만으로 구분되지 않는다(system.md §9).
- 선택지: 아이콘 + 숨은 상태 이름(권장) / 일정마다 상태 이름도 글자로
- 답: **아이콘 + 숨은 상태 이름**. 일정 칸에는 색·상태별 아이콘·시간·고객 이름만 보인다. 상태 이름은 화면낭독기용 이름(`"<상태> · HH:mm · <고객 이름>"`, 예: "예약됨 · 14:30 · 김민지"), 마우스를 올리면 뜨는 설명(같은 글), 캘린더 위 범례(아이콘 ↔ 상태 이름)로 알린다. system.md §9의 "아이콘 + 라벨 필수" 규칙에 "캘린더 일정은 아이콘·범례·설명·접근 이름으로 대신한다"는 예외를 적는다.

## Clarity Score

Initial: 7/10
Final: 10/10
Rounds completed: 4
