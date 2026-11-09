# SPEC-UI-002 발췌 (run 단계용)

> spec.md 0.3.0의 §4 요구사항(모듈 1~5), §7 인수 기준, §8 제외 범위, §9 영향받는 파일을 글자 그대로 옮긴 발췌다. 손으로 고치지 않고 spec.md에서 다시 뽑는다. 배경·제약·GEARS 유형 분포·추적성은 spec.md, 시나리오·판정 시점·기대값 표·경계 사례·품질 게이트는 acceptance.md에 있다.

## 4. 요구사항 (GEARS)

요구사항은 GEARS 형식으로 쓴다. 굵은 **When**·**While**·**Where**는 조건절이고 `(shall)`은 의무, `(shall not)`은 금지다. 원치 않는 상황은 "**When** <발견 조건>, <대상>은 <대응>해야 한다" 꼴로 쓴다. 조건이 있는 의무는 그 절 앞에 조건절을 따로 표시하고, 조건절이 없는 절은 언제나 적용된다. 정본 표(경로·상태·문구·의존성·CSV·CSP·약관 문구)는 acceptance.md §3에 있고, 요구사항은 그 표를 가리킨다. 요구사항 모듈은 5개, 요구사항은 25개다(Tier L 상한).

### 모듈 1 — 기반·계약

- REQ-UI-002-001: 프로젝트는 `package.json`의 `dependencies` 25개와 `devDependencies` 19개를 acceptance.md §3.4 고정 목록과 이름·버전이 정확히 같게(범위 기호 없이, 목록에 없는 패키지 없이) 선언하고 `engines.node`를 `^22.22.0 || ^24.0.0`으로 선언해야 하며(**shall**), 옛 의존성(zustand, `@headlessui/*`, axios, file-saver, react-router-dom, FullCalendar v6 개별 패키지 `@fullcalendar/core`·`daygrid`·`timegrid`·`interaction`·`list`)은 `package.json`의 의존성 키와 시험 파일 밖 `src`의 모듈 지정자(`from`·`import`·`import()`·`require()`)로 나타나지 않아야 한다(**shall not**).
- REQ-UI-002-002: 저장소는 로컬 백엔드(`kmcbeauty-fastapi`)에서 내보낸 OpenAPI 3.1 스냅숏 `openapi/openapi.json`과 그것으로 생성한 `src/api/schema.d.ts`를 가져야 하고(**shall**), **When** 타입 생성 명령(`api:types`와 같은 `openapi-typescript` CLI·옵션)을 스냅숏에 다시 실행하면, 그 결과는 커밋된 타입 파일과 글자 단위로 같아야 하며(**shall**), 스냅숏 내보내기 명령은 `KMC_BACKEND_DIR` 아래에 어떤 파일도 만들거나 바꾸지 않아야 하고(**shall not**) 지정한 출력 경로(기본 `openapi/openapi.json`) 한 곳에만 써야 하며(**shall**), **When** 백엔드가 OpenAPI 3.1이 아닌 문서를 내면, 내보내기 명령은 출력 파일을 만들지 않고 0이 아닌 코드로 끝나야 한다(**shall**).
- REQ-UI-002-003: **Where** 빌드(`vite build`)가 `development`가 아닌 모드로 실행되면, 빌드는 `VITE_API_BASE_URL`이 없거나 `new URL(값)`으로 해석되지 않거나 프로토콜이 `https:`가 아니거나 호스트가 비었을 때 변수 이름을 담은 오류로 실패해야 하고(**shall**), **While** 개발 서버가 실행 중이면, 앱의 API 기준 주소는 `/api`이고 이 요청은 프록시를 거쳐 `DEV_API_PROXY_TARGET`(기본 `http://localhost:8000`)으로 가야 하며(**shall**), **Where** 운영 빌드이면, 앱의 API 기준 주소는 `VITE_API_BASE_URL` 값이어야 하고(**shall**), 프록시 대상 값과 그 변수 이름은 브라우저 번들에 들어가지 않아야 한다(**shall not**).
- REQ-UI-002-004: 커버리지 측정은 `src/app`·`src/api`·`src/features`·`src/lib`·`src/ui-core`와 `vite-plugins.ts`를 포함하고 생성 파일·타입 선언·진입점·미리보기·시험 장치·ui-core 진입점·시험 파일을 빼야 하며(**shall**), 디자인 규칙 검사(금지 클래스·가져오기 규칙)는 같은 앱 코드에 적용되어야 하고(**shall**), 앱 코드는 ui-core를 공개 진입점 `@/ui-core`로만 가져와야 한다(**shall** — 하위 경로·`internal`·상대 경로·재내보내기·동적 가져오기 금지).

### 모듈 2 — 데이터·인증

- REQ-UI-002-005: API 클라이언트는 액세스 토큰을 모듈 메모리에만 두고 보호 요청에 `Authorization: Bearer <토큰>`으로 붙여야 하며(**shall**), 어떤 토큰도 `localStorage`·`sessionStorage`·IndexedDB·`document.cookie`에 쓰지 않아야 하고(**shall not**), 로그인·갱신 응답 본문의 `refresh_token`을 스크립트가 닿는 어떤 앱 상태(모듈 변수, 쿼리·변경 캐시, React 상태, 전역 객체)에도 남기지 않아야 한다(**shall not**).
- REQ-UI-002-006: **When** 인증 경로(`/auth/*`)가 아닌 요청이 처음 401을 받으면, 클라이언트는 진행 중인 갱신이 있으면 그것을 함께 기다리고 없으면 HttpOnly 쿠키로 갱신 요청을 하나만 보낸 뒤 원래 요청을 새 토큰으로 정확히 한 번 다시 보내야 하고(**shall** — 이 재전송은 REQ-UI-002-009 재시도 정책 밖의 예외다), **When** 다시 보낸 요청이 또 401을 받으면, 클라이언트는 다시 갱신하지 않고 그 요청을 401 오류로 끝내야 하며(**shall**), **When** 갱신이 401로 실패하면, 앱은 세션과 쿼리 캐시를 지우고 `/login?next=<인코딩한 현재 경로>`로 보내 세션 만료 문구(acceptance.md §3.2)를 보여야 하고(**shall**), **When** 갱신이 401이 아닌 오류(403·429·5xx·네트워크)로 실패하면, 앱은 세션을 지우거나 로그인 화면으로 보내지 않고 원래 요청을 그 오류 종류의 오류로 끝내야 한다(**shall**).
- REQ-UI-002-007: **When** 토큰 없이 보호 경로를 열면, 앱은 판단하기 전에 쿠키 갱신을 한 번 시도해야 하고(**shall**), **When** 사용자가 로그아웃하면, 앱은 `POST /auth/logout`을 쿠키와 함께 보내되 응답을 기다리지 않고 바로 토큰과 쿼리 캐시를 지운 뒤 로그인 화면으로 가야 하며(**shall**), 그 결과는 로그아웃 요청의 성공·실패·지연에 따라 달라지지 않아야 한다(**shall not**).
- REQ-UI-002-008: **When** 응답이 404 `SHOP_NOT_SELECTED`이면, 앱은 문서를 새로고침하지 않고 `/shops?next=<인코딩한 현재 경로>`로 이동하며 매장 범위 캐시(`["shop"]` 아래)를 모두 버려야 하고(**shall**), **When** 창이 다시 포커스를 받으면, 앱은 선택 매장을 캐시 신선도와 상관없이 다시 가져와야 하며(**shall**), **When** 다시 가져온 선택 매장 id가 화면의 매장 id와 다르면, 앱은 매장 범위 캐시를 버리고 안내 토스트를 한 번 띄워야 하고(**shall**), 매장 범위 쿼리 키는 모두 `["shop", <선택 매장 id>, …]`로 시작해야 한다(**shall**).
- REQ-UI-002-009: 클라이언트는 백엔드 오류 봉투, 422 배열, 4xx, 429, 5xx, 네트워크 오류, 취소를 하나의 오류 형식으로 정규화하고 acceptance.md §3.2의 문구 결정 순서를 따라야 하며(**shall** — 앱 코드 표와 상태 코드 문구는 해요체이고, 앱 문구가 없는 코드의 봉투 `detail.detail`은 백엔드 문구를 그대로 보이는 것을 예외로 둔다), 쿼리 재시도 정책은 4xx 응답과 취소된 요청을 다시 시도하지 않고 5xx와 네트워크 오류만 최대 2회 다시 시도해야 하며(**shall**), 변경 요청은 어떤 오류든 다시 시도하지 않아야 하고(**shall not**), **When** 쿼리 입력(검색어·필터·보이는 범위)이 응답 전에 바뀌면, 이전 요청을 취소하고 그 취소를 화면에 알리지 않아야 한다(**shall**).

### 모듈 3 — 셸·탐색·공개 화면

- REQ-UI-002-010: 라우터는 acceptance.md §3.3 경로 표대로 공개 경로, 로그인 필요 경로, 로그인 + 매장 필요 경로와 404 화면을 제공해야 하고(**shall**), **While** 세션이 없으면, 보호 경로는 화면을 그리기 전에 `/login?next=<인코딩한 현재 경로>`로 보내야 하며(**shall**), 돌아올 경로(`next`)를 쓰는 세 곳(로그인 화면 loader, 로그인 제출, 매장 선택)은 acceptance.md §3.3의 `next` 규칙 — 한 번 디코딩한 값에 `\`·C0 제어 문자·공백이 없고, `new URL(값, location.origin).origin`이 `location.origin`과 같으며, `/`로 시작하고 `//`로 시작하지 않음 — 을 통과한 값만 쓰고, 그 밖의 값은 버리고 `/reservations`로 가야 한다(**shall**).
- REQ-UI-002-011: 앱 셸은 56px 상단바(사이드바 접기·이동 경로·오늘 날짜·테마 전환·사용자 메뉴), 현재 매장과 "매장 변경"을 담은 사이드바(240px / 접힘 64px), "본문으로 건너뛰기" 링크를 제공해야 하고(**shall**), **While** 화면 폭이 1024px 이상이면 저장된 접힘 상태(기본 펼침, 저장 키 `kmc-admin-sidebar`)를, **While** 768~1023px이면 들어올 때마다 접힌 채 시작하고 저장하지 않는 상태를, **While** 768px 미만이면 사이드바 대신 서랍을 써야 하며(**shall**), **When** 사용자가 서랍 안 링크로 이동하면, 서랍을 닫아야 한다(**shall**).
- REQ-UI-002-012: **When** 사용자가 빈 칸이나 acceptance.md §3.2 이메일 형식 규칙에 맞지 않는 이메일로 로그인을 제출하면, 화면은 요청을 보내지 않고 필드 오류와 함께 첫 오류 필드로 포커스를 옮겨야 하고(**shall**), **When** 로그인이 성공하고 선택 매장이 있으면, 규칙을 통과한 `next` 또는 `/reservations`로 가야 하며(**shall**), **When** 로그인이 성공했으나 선택 매장이 없으면, 규칙을 통과한 `next`를 그대로 실은 `/shops`로 가야 하고(**shall**), **When** 로그인이 401·429·네트워크 오류로 실패하면, 각각 다른 acceptance.md §3.2 문구를 보여야 한다(**shall**).
- REQ-UI-002-013: **When** 사용자가 매장 선택 화면에서 매장을 고르고 `POST /shops/selected`가 성공하면, 앱은 선택 매장 캐시를 고른 매장으로 바꾸고 이전 매장 범위 캐시를 버린 뒤 규칙을 통과한 `next` 또는 `/reservations`로 가야 하며(**shall**), **When** 그 요청이 실패하면, 앱은 캐시와 경로를 바꾸지 않고 오류를 알려야 하고(**shall**), 매장 선택 화면은 로딩(300ms 이상 이어지면 스켈레톤 — 300ms 시점부터 보이고 299ms까지는 보이지 않음)·빈 상태·오류 상태를 보여야 한다(**shall**).
- REQ-UI-002-014: **Where** 개발 서버이면, 컴포넌트 미리보기가 `/dev/preview`에서 열려야 하고(**shall**), **Where** 운영 빌드이면, 빌드 산출물에 미리보기 코드(미리보기 화면 문구와 시연 클래스)가 없어야 하며(**shall not**), 이용약관과 개인정보처리방침은 로그인 없이 `/terms-of-service`·`/privacy-policy`에서 acceptance.md §3.9 문구 그대로 보여야 한다(**shall**).

### 모듈 4 — 업무 화면

- REQ-UI-002-015: 예약 도메인 모듈은 상태 5종의 키·라벨·아이콘·토큰·뜻·표시 순서를 acceptance.md §3.1 상태 표대로 한곳(`src/features/reservations/status.ts`)에 정의해야 하고(**shall**), 목록·표·폼·대화상자에서 상태를 보이는 곳은 아이콘 + 라벨 배지를 쓰고 상태 레일은 그 배지와 함께만 써야 하며(**shall** — 캘린더 일정의 상태 표시는 REQ-UI-002-017이 정한다), ui-core는 예약 상태 키와 상태 토큰을 갖지 않아야 하고(**shall not**), 상태 라벨 글자는 도메인 모듈 밖의 앱 코드에 다시 적지 않아야 한다(**shall not**).
- REQ-UI-002-016: **When** 사용자가 예약 상태 전환 컨트롤을 열면, 현재 상태는 고를 수 없어야 하고(**shall**), **When** 사용자가 다른 상태를 고르면, 화면은 예약됨 → 방문함·취소됨·노쇼와 방문함 → 완료는 바로 요청하고 그 밖의 전환은 acceptance.md §3.1 문구의 확인 대화상자를 거쳐야 하며(**shall**), **When** 사용자가 확인 대화상자를 "닫기"나 Esc로 닫으면, 상태 변경 요청을 보내지 않아야 한다(**shall not**).
- REQ-UI-002-017: 예약 캘린더는 주(기본)·월·일 보기에서 보이는 범위의 예약을 `size=100`으로 쪽을 돌아 모두 가져와야 하고(최대 20쪽, 응답의 `pages`가 20을 넘으면 20쪽에서 멈추고 경고)(**shall**), 일정마다 상태 면·레일·상태별 아이콘·시각(`HH:mm`)·고객 이름을 그리고 상태 이름은 접근 이름 `"<상태 라벨> · HH:mm · <고객 이름>"`, 같은 글의 마우스·포커스 설명, 캘린더 위 범례(아이콘 ↔ 상태 라벨 5종)로 알려야 하며(**shall**), **When** 사용자가 일정을 누르면 그 예약의 수정 대화상자를, **When** 빈 칸을 고르면 그 시각으로 채운 등록 대화상자를, **When** "예약 추가"를 누르면 등록 대화상자를 열어야 한다(**shall**).
- REQ-UI-002-018: **When** 사용자가 예약을 저장하면, 앱은 일시를 UTC 오프셋이 있는 ISO 문자열로 보내고, 수정 때는 `reserved_at`과 `status`를 항상 함께 보내며, 시술 항목을 바꾸지 않았으면 `treatment_items`를 빼고, 바꿨으면 전체 배열(기존 항목은 `id` 포함, 새 항목은 `id` 없이)을 보내야 한다(**shall**).
- REQ-UI-002-019: 고객 화면은 300ms 디바운스 검색어(`q`)와 쪽 번호(`page`)를 URL에 두고 고객 등록·수정·삭제(삭제는 확인 뒤)를 제공해야 하며(**shall**), **When** 사용자가 CSV 내보내기를 누르면, 현재 검색에 맞는 고객을 쪽 수 상한 없이 모두 모아 acceptance.md §3.5대로 RFC 4180 이스케이프·수식 주입 방지·UTF-8 BOM·CRLF를 갖춘 파일로 file-saver 없이 내려받게 해야 하고(**shall**), **When** 모으는 중 한 쪽이라도 실패하면, 파일을 만들지 않고 오류를 알려야 한다(**shall**).
- REQ-UI-002-020: 시술 메뉴 화면은 메뉴 목록과 고른 메뉴의 세부 항목을 한 화면에서 보여 주고 둘 다 추가·수정·삭제(삭제는 확인 뒤)할 수 있어야 하며(**shall**), 세부 항목의 소요 시간과 가격은 1 이상만 받아야 한다(**shall**).
- REQ-UI-002-021: 시술 이력 화면은 기간(`from`·`to`, 기본은 오늘이 속한 KST 달의 1일~말일)·상태(`status`)·검색(`q`) 필터, 예약 일시 정렬(`order`), 쪽(`page`)을 URL에 두고 예약을 상태 배지와 같은 상태의 레일이 있는 표로 보여야 한다(**shall**).
- REQ-UI-002-022: 업무 폼(고객·메뉴·세부 항목·예약 대화상자와, 같은 폼 훅을 쓰는 로그인)은 필드를 떠나거나 한 번 제출한 뒤부터 그 필드의 오류를 보이고 이후 값이 바뀔 때마다 다시 검사해야 하며(**shall**), **When** 제출이 실패하면(클라이언트 검증, 422, 409), 첫 오류 필드로 포커스를 옮기고 필드별 앱 문구가 있으면 그 문구를, 없으면 백엔드 `msg`를 보여야 하고(**shall**), 금액·소요 시간 입력은 천 단위 쉼표를 보이며 숫자 값을 넘겨야 한다(**shall**).

### 모듈 5 — 품질·보안·배포

- REQ-UI-002-023: ui-core는 SPEC-UI-001 후속 과제 가운데 ui-core와 그 시험 장치에 속한 15건(1·2·4·6~17: 결함 2, 링크 스킴 허용 목록, 정리 12)을 acceptance.md §3.10 항목별 증거대로 반영하면서 M3 시작 때 기록한 기존 시험을 모두 통과해야 하고(**shall** — 의도적으로 바꾼 시험은 목록에 적은 것만 예외), 새 공개 컴포넌트 4개(DateRangePicker, NumberInput, Drawer, Popover)를 §3.10 키보드 계약과 axe 위반 0건으로 제공하며 공개 이름 44개·컴포넌트 파일 33개로 잠가야 한다(**shall**).
- REQ-UI-002-024: **Where** 운영 빌드이면, `index.html`은 `<meta charset>` 바로 뒤, 모든 인라인 스크립트보다 앞에 acceptance.md §3.8 정책의 CSP meta를 담아야 하고(**shall** — `script-src`의 예외는 빌드 때 최종 HTML의 인라인 스크립트마다 계산한 sha256뿐이고, `connect-src`는 `'self'`와 `VITE_API_BASE_URL`의 origin뿐이다), **Where** 개발 서버이면, HTML에 CSP meta를 넣지 않아야 한다(**shall not**).
- REQ-UI-002-025: `deploy.sh`는 `npm run build -- --mode production`으로 빌드하고, `.env.production`을 셸로 실행하지 않고 한 줄씩 읽어 허용된 이름(`SCP_USER`·`SCP_HOST`·`SCP_DIR`·`SCP_PORT`)의 값만 받되, 값의 양끝이 같은 따옴표(`"` 또는 `'`)이면 그 한 겹만 벗기고 그 밖의 값(짝이 맞지 않는 따옴표 포함)은 확장·치환 없이 글자 그대로 받아야 하며(**shall** — 같은 이름이 여러 번 나오면 마지막 값), **When** 그 파일이 없거나 필수 값이 비었거나 `SCP_PORT`가 숫자가 아니거나 `SCP_USER`·`SCP_HOST`·`SCP_DIR` 값이 `-`로 시작하면, 빌드 전에 원인 이름을 출력하고 0이 아닌 코드로 멈춰야 하고(**shall**), 배포 중지 가드(`ALLOW_PREVIEW_ONLY_DEPLOY`)는 M8의 마지막 run 단계 커밋(C6 정의: `.moai/` 밖의 파일을 바꾸는 마지막 run 단계 커밋)에서 없애야 한다(**shall**).

## 7. 인수 기준 (Acceptance Criteria)

인수 기준 25개의 요약이다. 시나리오 전체, 판정 시점, 기대값 표, 경계 사례, 품질 게이트, 사용자 검토 항목은 acceptance.md에 있다.

- AC-UI-002-01: Given `npm ci`로 설치한 작업 트리에서, When 의존성 고정 시험과 QG-12 검사를 실행하면, Then `dependencies` 25개·`devDependencies` 19개가 acceptance.md §3.4 목록과 이름·버전 문자열까지 같고 남는 항목이 없으며, `engines.node`가 `^22.22.0 || ^24.0.0`이고 QG-12 두 검사가 통과한다 (maps REQ-UI-002-001)
- AC-UI-002-02: Given 커밋된 스냅숏과 타입 파일, 가짜 백엔드 폴더에서, When 스냅숏 동기 시험과 내보내기 스크립트 시험(`--out`으로 임시 출력 경로)을 실행하면, Then 같은 CLI로 다시 생성한 타입이 커밋된 `src/api/schema.d.ts`와 같고 스냅숏이 OpenAPI 3.1.0·경로 31·API 50·스키마 58이며, 가짜 백엔드 폴더가 실행 전후로 같고 출력은 지정 경로에만 생기며 3.1이 아닌 출력이면 쓰지 않고 실패한다 (maps REQ-UI-002-002)
- AC-UI-002-03: Given env 검사 플러그인, 앱 env 모듈, 프록시 설정 함수에서, When 운영 모드 검사를 값 없음·`http://…`·`https://`·`https://a b`·`https://…`로, 개발 모드 검사를 값 없음으로 돌리고 기준 주소와 프록시 설정을 확인하면, Then 앞의 넷은 변수 이름을 담은 오류로 실패하고 마지막과 개발 모드는 통과하며, 기준 주소가 개발 `/api`·운영 `VITE_API_BASE_URL`이고, 프록시는 `/api` → 기본 `http://localhost:8000`이며 대상 값이 빌드 산출물에 없다 (maps REQ-UI-002-003)
- AC-UI-002-04: Given 넓힌 커버리지 설정과 디자인 규칙 시험에서, When (가) M1에 설정 값을 확인하고 (나) M4·M8에 커버리지 보고 파일을 검사하고 (다) 앱 코드 위치에 위반 표본을 넣어 규칙 시험을 돌리면, Then 포함·제외 목록과 단계별 기준값이 맞고, 보고에 필요한 경로가 모두 있고 제외 경로가 없으며, 금지 클래스와 `@/ui-core` 밖 가져오기 표본이 `경로:줄`과 함께 잡힌다 (maps REQ-UI-002-004)
- AC-UI-002-05: Given 저장소 쓰기·IndexedDB·쿠키를 감시하는 시험에서, When 로그인 → 새로고침(쿠키 갱신) → 로그아웃(응답 500·네트워크 오류·응답 없음)을 하면, Then 토큰 문자열이 어떤 저장소 쓰기·뒤 검사·쿼리와 변경 캐시에도 없고 `refresh_token`이 앱 상태에 남지 않으며, 새로고침 때 갱신 1회 뒤 보호 화면이 유지되고, 로그아웃은 응답을 기다리지 않고 바로 토큰과 캐시를 비우고 `/login`으로 간다 (maps REQ-UI-002-005, REQ-UI-002-007)
- AC-UI-002-06: Given 만료된 토큰과 동시에 보낸 보호 요청 3개에서, When 갱신이 성공·401·네트워크 오류·429·503인 경우와 재시도가 다시 401인 경우, 로그인 401인 경우를 실행하면, Then 갱신 요청은 1회이고 원래 요청은 각각 정확히 2회이며, 갱신 401이면 만료 처리 1회·캐시 0개·`/login?next=%2Fcustomers`와 만료 문구, 401이 아닌 갱신 실패는 세션을 지우지 않고 그 종류의 오류로 끝나며, `credentials: "include"`는 인증 요청 3개에만 있다 (maps REQ-UI-002-006)
- AC-UI-002-07: Given 매장 7이 선택된 상태에서, When 매장 범위 요청이 404 `SHOP_NOT_SELECTED`를 받고, 다른 시험에서 창 포커스를 다시 얻어 선택 매장이 8로 돌아오면, Then 앞의 경우 문서 새로고침 없이 `/shops?next=%2Fcustomers`로 가고 `["shop"]` 아래 캐시가 0개이며, 뒤의 경우 신선한 캐시여도 선택 매장을 다시 요청하고 `["shop", 7, …]` 캐시가 사라지며 안내 토스트가 1번 뜨고, 키 공장 6개가 모두 `["shop", <id>, …]`로 시작한다 (maps REQ-UI-002-008)
- AC-UI-002-08: Given acceptance.md §3.2 응답 표의 MSW 처리기에서, When 각 응답을 정규화하고 쿼리·변경으로 받아 요청 횟수를 세고, 시험 훅의 키를 응답 전에 바꾸면, Then 정규화 결과가 표와 같고, 4xx와 취소는 쿼리 요청 1회, 5xx·네트워크는 3회, 변경은 언제나 1회이며, 앞 요청의 signal이 취소되고 오류 상태가 남지 않는다 (maps REQ-UI-002-009)
- AC-UI-002-09: Given 메모리 라우터와 세 세션 상태에서, When acceptance.md §3.3 경로 표의 경로를 열고, `next` 표본 표의 값마다 로그인 화면 loader 경로와 로그인 제출 경로를 따로 실행하면, Then 결과가 경로 표와 같고 보호 화면의 h1이 한 번도 그려지지 않으며, 두 경로 모두 거부 표본은 `/reservations`로, 허용 표본은 그 경로로 간다 (maps REQ-UI-002-010)
- AC-UI-002-10: Given 1280·900·375px과 경계 폭 767·768·1023·1024px(matchMedia 대역), 매장 "강남점"에서, When 셸을 그리고 접기·서랍·건너뛰기 링크를 키보드로 쓰면, Then 1024px 이상은 접힘이 저장·복원되고, 768~1023px은 접힌 채 시작하며 저장값을 바꾸지 않고, 768px 미만은 서랍이 열리고 이동하면 닫히며, 상단바 높이·사이드바 폭 클래스와 상단바 요소 5개·매장명·"매장 변경"이 있고 axe 위반이 0건이다 (maps REQ-UI-002-011)
- AC-UI-002-11: Given 로그인 화면에서, When 빈 제출, 형식이 틀린 이메일과 맞는 이메일, 401, 429, 네트워크 오류, 성공(매장 있음·없음 × `next` 있음·없음)을 실행하면, Then 빈 제출과 형식 오류는 요청 없이 첫 오류 필드에 포커스를 주고, 세 오류 문구가 acceptance.md §3.2와 같고 서로 다르며, 성공 뒤 `/customers`·`/reservations`·`/shops?next=%2Fcustomers`·`/shops`로 각각 가고 입력 칸의 처음 값은 비어 있다 (maps REQ-UI-002-012)
- AC-UI-002-12: Given 매장 1이 선택된 로그인 상태에서 "매장 변경"으로 연 매장 선택 화면과 매장 1의 범위 캐시가 있을 때, When "홍대점"을 `next` 없음·`next=%2Fcustomers`·거부 표본으로 고르고, 다른 시험에서 선택 요청 500, 매장 0개, 목록 오류를 주면, Then 성공 때 `POST /shops/selected` 본문 `{"shop_id":2}` 1회·선택 매장 캐시 id 2·`["shop", 1, …]` 0개·각각 `/reservations`·`/customers`·`/reservations`이고, 선택 실패면 캐시·경로가 그대로이고 오류가 보이며, 0개면 빈 상태 문구, 목록 오류면 destructive Alert와 "다시 시도"가 보인다 (maps REQ-UI-002-013, REQ-UI-002-010)
- AC-UI-002-13: Given 개발 경로 목록과 빈 개발 경로 목록으로 만든 두 라우터, `VITE_API_BASE_URL`을 넘긴 운영 빌드 산출물에서, When `/dev/preview`를 열고 `check:dist`와 QG-18 검사를 실행하고 비로그인으로 약관·개인정보를 열면, Then 개발 라우터는 h1 "컴포넌트 미리보기"를, 운영 라우터는 404를 그리고, `dist`의 JS에 미리보기 문구와 시연 클래스가 없으며, 두 문서가 acceptance.md §3.9 문단을 순서대로 같은 글자로 보인다 (maps REQ-UI-002-014)
- AC-UI-002-14: Given 상태 5종의 예약에서, When 배지·이력 행·캘린더 일정 내용과 범례를 그리고 QG-11 검사를 실행하면, Then 순서·라벨·아이콘·토큰이 acceptance.md §3.1 상태 표와 같고 배지마다 아이콘과 라벨이 함께 있으며, 이력 행 레일과 일정 상태 클래스가 원본 `status`와 같고, 일정 접근 이름과 설명이 `"<라벨> · HH:mm · <고객 이름>"`이며, 범례가 5종을 순서대로 보이고 QG-11 검사가 모두 통과한다 (maps REQ-UI-002-015, REQ-UI-002-017)
- AC-UI-002-15: Given acceptance.md §3.1 25칸 전환 표와 예약 1건에서, When 각 전환을 시도하고 확인 대화상자를 닫기·Esc·확인으로 끝내면, Then 바로·확인·선택 불가 구분과 대화상자 문구가 표와 같고 현재 상태는 고를 수 없으며, 닫기·Esc면 요청 0건, 확인이나 바로 전환이면 `PUT /treatments/{id}` 본문 키가 정확히 `reserved_at`·`status`이고 `reserved_at`이 원래와 같은 순간이다 (maps REQ-UI-002-016)
- AC-UI-002-16: Given 주·월·일 보기와 3쪽·20쪽·21쪽짜리 응답에서, When 캘린더를 열고 다음 주로 넘기고 빈 칸 2026-11-10 14:30을 고르고 일정을 누르고 "예약 추가"를 키보드로 누르면, Then 기본 보기가 주이고 보이는 범위가 KST 시작일·끝일로 요청되어 3쪽이 모두 그려지며, 넘길 때 이전 요청이 취소되고, 20쪽은 경고 없이 20번·21쪽은 20번에서 멈추고 경고하며, 일정 내용이 아이콘·시각·고객 이름·접근 이름을 갖고 각 대화상자가 맞게 열린다 (maps REQ-UI-002-017, REQ-UI-002-009)
- AC-UI-002-17: Given 시험 시간대 Asia/Seoul에서, When 2026-11-10 14:30 예약을 등록하고 다른 예약의 메모만 고쳐 저장하고 항목을 바꿔 저장하면, Then 등록 본문 `reserved_at`이 `2026-11-10T05:30:00.000Z`, `status`가 `RESERVED`이고, 메모 수정 본문에 원래와 같은 순간의 `reserved_at`·`status`·`memo`가 있고 `treatment_items`가 없으며, 항목 수정은 기존 항목 `id`를 담은 전체 배열이다 (maps REQ-UI-002-018)
- AC-UI-002-18: Given 자동 진행 없는 가짜 타이머와 고객 목록에서, When 검색어를 300ms 안에 고치고 쪽을 넘기고 같은 URL로 다시 그리고, 등록(성공·409)·수정·삭제(닫기·확인)를 하면, Then 검색 요청은 `search=김민` 1회이고 앞 요청은 취소되며 취소가 화면에 보이지 않고, URL의 `q`·`page`가 복원되며, 등록·수정 본문과 무효화·토스트가 표와 같고, 409는 전화번호 필드 오류와 포커스, 삭제는 닫기 0회·확인 1회다 (maps REQ-UI-002-019, REQ-UI-002-022, REQ-UI-002-009)
- AC-UI-002-19: Given 이스케이프·수식 주입 표본이 든 고객 250명(3쪽)과 25쪽짜리 응답에서, When CSV 내보내기를 누르면, Then 파일 `고객목록_2026-11-09.csv`에 머리 행과 250행이 있고 이스케이프·`'` 접두·BOM·CRLF·KST 등록일이 acceptance.md §3.5와 같으며, 25쪽은 상한 없이 25번 요청하고, `revokeObjectURL`이 만든 URL로 1회 불린다 (maps REQ-UI-002-019)
- AC-UI-002-20: Given 메뉴 2개와 세부 항목에서, When 세부 항목을 열고 세부 항목을 추가(0·1)·수정·삭제하고 메뉴를 추가(성공·409)·수정·삭제하면, Then URL이 `?menu=2`이고 세부 표가 보이며, 0은 요청 없이 필드 오류이고, 각 요청의 경로·본문·무효화·토스트가 acceptance.md §3.2와 같으며, 409는 이름 필드 오류, 삭제는 확인 뒤 1회다 (maps REQ-UI-002-020, REQ-UI-002-022)
- AC-UI-002-21: Given 2026-11-09T10:00:00+09:00에 멈춘 가짜 시계에서, When 이력 화면을 열고 상태·기간·정렬·검색·쪽을 바꾸고 같은 URL로 다시 그리면, Then 첫 요청이 `start_date=2026-11-01&end_date=2026-11-30&sort_by=reserved_at&sort_order=desc&page=1&size=20`이고, 각 변경이 매개변수와 URL 키 `status`·`from`·`to`·`order`·`q`·`page`에 반영되어 복원되며, 필터를 바꾸면 앞 요청이 취소되고, 행마다 배지 + 레일, 금액 열이 오른쪽 정렬·`tabular-nums`·"원"이다 (maps REQ-UI-002-021, REQ-UI-002-009)
- AC-UI-002-22: Given 예약 대화상자에서, When 값을 바꾸다 떠나기 전, 빈 제출 뒤, 값을 고친 뒤, 422(`treatment_items.0.base_price`) 뒤, 가격 칸에 "1234567"·"₩12,000"·빈 값을 넣은 뒤를 확인하면, Then 떠나기 전에는 오류가 없고, 제출 뒤 첫 오류 필드에 포커스, 고치면 오류가 바로 사라지며, 422 필드에 "0 이상 입력해 주세요."와 포커스, 표시는 "1,234,567"·값 1234567, 붙여넣기 값 12000, 빈 값 `null`이다 (maps REQ-UI-002-022)
- AC-UI-002-23: Given M3 시작 때 기록한 기존 시험 목록에서, When ui-core 전체 시험·결함 재현 시험·잠금 시험과 전체 `npm test`를 돌리면, Then 기록한 시험이 모두 통과하거나 "의도적으로 바꾼 시험" 목록에 있고, acceptance.md §3.10의 항목별 증거가 모두 맞으며, 공개 이름이 §3.6의 44개, 컴포넌트 파일이 33개, 새 컴포넌트 4개가 키보드 계약을 지키고 axe 위반이 0건이다 (maps REQ-UI-002-023)
- AC-UI-002-24: Given `VITE_API_BASE_URL=https://api-beauty.dongri.kr`로 만든 운영 빌드와 플러그인 시험 표본에서, When `check:dist`와 플러그인 시험을 돌리면, Then CSP meta가 `<meta charset>` 바로 뒤, 모든 인라인 스크립트 앞에 있고 정책이 acceptance.md §3.8과 같으며, `script-src` 해시가 실제 인라인 스크립트 sha256과 같고 `'unsafe-inline'`이 없으며, API 주소의 경로·포트를 다룬 origin이 맞고, 개발 모드 HTML에는 CSP가 없다 (maps REQ-UI-002-024)
- AC-UI-002-25: Given 작업 트리의 `deploy.sh`를 복사한 임시 디렉터리와 내장 명령만 쓰는 주입 표본, 대역 `npm`·`scp`만 든 PATH에서, When 정상 실행·필수 값 4개 각각 빈 값·파일 없음·숫자가 아닌 포트·`-` 값으로 실행하고 일부러 `source`하는 대조 사본도 실행하면, Then 정상 실행은 표시 파일 없이 값이 글자 그대로이고 대역 `npm`·`scp`가 각 1회 불리며, 나머지 경우는 대역 호출 없이 원인 이름과 함께 0이 아닌 코드로 끝나고, 대조 사본은 표본마다 그 표본이 담은 표시 파일을 만들며, 주석을 뺀 `deploy.sh`에 금지 토큰이 없고 가드를 지운 커밋이 M8의 마지막 run 단계 커밋(C6 정의)이다 (maps REQ-UI-002-025)

## 8. 제외 범위 (Exclusions — What NOT to Build)

### Out of Scope — 네이티브 전용 기능과 계정 관리
- 직원 관리, 초대 코드, 매출 대시보드(`GET /summary/dashboard`), 매장 생성·수정, 회원 가입·정보 수정·탈퇴, 푸시 토큰
- 예약 담당 직원 지정(`staff_user_id`)과 직원 필터 — 직원 목록이 직원 관리 기능에 속한다

### Out of Scope — 예약 기능 확장
- 캘린더 끌어 놓기 일정 변경, 반복 예약, 영업시간·휴무 설정, 상태별 개수 필터, 시간대 고정 표시
- 시술 메뉴 복원(`POST /treatment-menus/{id}/restore`) 화면
- 예전 대시보드(`/manager`)와 예전 `/manager/*` 경로 호환 리디렉트

### Out of Scope — 백엔드 변경
- 운영 CORS 허용 목록과 `tests/test_cors_production_security.py` 변경(백엔드 저장소의 별도 작업, plan.md §P-1)
- 서버 쪽 상태 전환 규칙, 사용자당 여러 리프레시 세션, 오류 문구 통일, 429 본문 형식

### Out of Scope — 배포 서버와 운영 연결
- 운영 연결 작업 전부 — plan.md §P 점검표: `admin-beauty.dongri.kr` 새 conf.d server 블록(SPA 경로 대체 `try_files`, 서버 수준 보안 헤더와 `frame-ancestors`), 정적 파일 마운트(`/srv/server-mini2/compose.yaml`) 또는 정적 파일 컨테이너, Cloudflare DNS 레코드, nginx 다시 읽기
- 실제 운영 전송 실행 — 이 SPEC은 `deploy.sh`를 고치고 가드를 지울 뿐 전송하지 않는다
- 운영 API에 붙는 브라우저 확인 — 운영 로그인 확인(UR-8), 8개 화면의 CSP 위반 관찰(UR-2), 엄격한 스타일 정책 실험(UR-3)은 plan.md §P-1(백엔드 CORS) 뒤에 하는 SPEC 완료 뒤 항목이며 이 SPEC의 완료 조건이 아니다

### Out of Scope — 의존성 줄 바꾸기
- 이전 메이저 줄(react-router 7, FullCalendar 6, MSW 2)로의 전환 — 필요해지면 C5에 따라 blocker와 SPEC 개정으로 다룬다

### Out of Scope — 검증 자동화와 디자인 확장
- 브라우저 E2E·시각 회귀 자동화(후속 SPEC 후보), 엄격한 `style-src` 정책
- 대체 숫자 글꼴, 새 토큰 색, 여러 계열 차트 팔레트

### Out of Scope — 문서와 저장소 밖
- README 정비 — 동기화 단계에서 manager-docs가 맡는다. 넘기는 항목: 사용자당 리프레시 토큰 하나라 관리자 웹 로그인이 같은 계정의 네이티브 세션을 밀어낸다는 안내(plan.md R4), 한국 시간대 브라우저 가정(R10), 로컬 `.env`의 예전 API 주소를 각자 고치라는 안내(§B.10). 로그인 화면에는 이 안내를 넣지 않는다
- 프로젝트 문서(product·structure·tech.md — 사용자 결정으로 미룸), CHANGELOG
- `kmcbeauty-fastapi`, `kmcbeauty-native` 변경(읽기만 한다)
- 예전 공개 저장소 이력에 남은 로그인 기본값 정리

## 9. 영향받는 파일

| 구분 | 경로 | 개수 |
|---|---|---|
| 새로 | `src/app/**`(`routes.tsx`, `dev-routes.ts`, `safe-next.ts` 포함), `src/app/shell/**`, `src/api/**`(생성 `schema.d.ts` 포함), `src/features/{auth,shops,customers,treatment-menus,treatments,reservations,legal}/**`, `src/lib/**`, `src/ui-core/{date-range-picker,number-input,drawer,popover}.tsx`와 `src/ui-core/internal/*.ts`, `src/preview/route.tsx`, `src/test/msw/**`, `src/test/render-route.tsx`, `src/test/export-openapi.test.ts`, `src/test/timezone.test.ts`, `src/test/deploy-script.test.ts`(이름 변경으로 생김), `openapi/openapi.json`, `scripts/{export-openapi,check-dist}.mjs`, `vite-plugins.ts`, `.env.example`, `.env.production.example` — 각각의 시험 파일 포함 | 약 115 **(추정)** |
| 수정 | `.moai/design/system.md`, `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.json`, `biome.json`, `.gitignore`, `deploy.sh`, `src/main.tsx`, `src/vite-env.d.ts`, `src/test/{setup,dependency-pins,design-rules,theme-init}.ts(x)`, ui-core 약 20개 파일과 시험, `src/preview/**` 일부 | 약 45 **(추정)** |
| 삭제 | `src/test/deploy-guard.test.ts`(M8에서 `deploy-script.test.ts`로 이름 변경) | 1 |

경로별 목록은 plan.md §D.2(앱 계층 구성)와 §F의 마일스톤별 새 파일·수정 목록에 있다. 구조는 design.md §2다.
