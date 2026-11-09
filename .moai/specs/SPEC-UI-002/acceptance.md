# SPEC-UI-002 인수 기준

| 항목 | 내용 |
|---|---|
| SPEC | SPEC-UI-002 — 업무 화면·API·인증·라우팅 재구축과 배포 가드 제거(spec.md 0.3.0 기준) |
| 인수 기준 | 25개(`AC-UI-002-01` ~ `AC-UI-002-25`). 요구사항 25개의 모든 절을 하나 이상의 인수 기준이 덮는다(§1.1) |
| 경계 사례·품질 게이트 | 경계 사례 42개(§3.7), 품질 게이트 18개(§4, 적용 시점 포함) |
| 사용자 검토 | UR-1 ~ UR-9(§5). UR-2·UR-3·UR-8은 SPEC 완료 뒤 항목이다 |
| 형식 | 시나리오는 Given-When-Then, 판정은 통과·실패 두 가지 |
| 증거 | 실행한 명령, 출력 원문, HEAD SHA를 주 체크아웃의 `/home/antam2010/workSpace/_myproject/kmcbeauty/kmcbeauty-admin/.moai/state/verify/<세션>/`에 남긴다(§7) |
| 관련 | spec.md §4(요구사항), §7(인수 기준 요약) · plan.md §B(기술 접근), §F(마일스톤), §I(시험 전략), §P(운영 연결 점검표) · design.md §16(시험 장치) |

## 0. 읽는 법

- `(maps …)`는 그 인수 기준이 확인하는 요구사항이다. **판정 시점**(§1)은 그 인수 기준의 어느 부분을 어느 마일스톤에서 판정하는지다. 마일스톤 완료 기준은 그 시점의 부분만 요구한다.
- **정본 순서**: 이 문서 §3의 표 → system.md(M1 첫 커밋에서 같은 글자로 옮김) → 코드. 시험은 §3 표를 옮겨 쓰고 스스로 기대값을 만들지 않는다.
- 명령은 저장소 루트에서 실행한다. 정규식이나 여러 줄 명령은 표 밖의 코드 블록에 둔다. 표 칸 안의 `\|`는 복사하면 글자 그대로 남아 `grep -E`가 문자 `|`를 찾게 되므로, 표에는 §4.1 블록을 가리키는 말만 둔다.
- **grep**은 GNU grep(`/usr/bin/grep`, 3.11)을 뜻한다. 셸 함수나 별칭이 끼는 환경에서는 `/usr/bin/grep`으로 부르고 `grep --version`의 첫 줄을 증거에 적는다.
- **"출력 없음" 검사**는 종료 코드가 정확히 1이고 표준 오류가 비어 있을 때만 통과다. 경로가 없거나 명령이 실패해 출력이 비는 경우(종료 코드 2, 오류 메시지)는 실패다. 빌드 산출물을 검사하는 grep은 같은 순서에서 빌드가 종료 코드 0으로 끝난 것을 확인한 뒤에만 실행하고, `dist/index.html`의 수정 시각을 증거에 함께 적는다(이전 빌드가 남긴 `dist/`를 판정하지 않기 위해).
- **쿼리 비교**: 요청의 쿼리 매개변수는 디코딩한 `URLSearchParams`를 순서와 상관없는 (이름, 값) 다중 집합으로 비교한다. 이 문서에 쓴 `a=1&b=2` 꼴은 그 집합을 적은 것이다. 이동한 경로도 디코딩한 경로명 + 같은 방식의 쿼리로 비교한다.
- **일시 비교**: 일시 값은 문자열이 아니라 같은 순간인지(`new Date(a).getTime() === new Date(b).getTime()`)로 비교하고, 형식 조건(`Z` 또는 `±hh:mm`으로 끝남)은 따로 확인한다.
- HTTP는 MSW 3(`msw/node`)이 대신 응답한다. 처리하지 않은 요청은 시험 실패다. Node의 fetch는 쿠키를 저장하지 않으므로 "쿠키가 실제로 저장·전송되는가"는 사용자 검토(UR-1)로 넘기고, 시험은 "`credentials: "include"`를 어느 요청에 주는가"만 판정한다.
- **시간대**: 시험은 `vite.config.ts`의 `test.env.TZ = "Asia/Seoul"`로 돈다(밖의 `TZ`와 상관없이). `TZ=UTC npx vitest run src/test/timezone.test.ts`가 통과하는 것이 그 증거다(AC-UI-002-01 묶음, QG-03).
- **가짜 시계**: 오늘이 필요한 시나리오는 `vi.setSystemTime(new Date("2026-11-09T10:00:00+09:00"))`로 정확한 순간에 고정한다. 시간 간격을 판정하는 시나리오(디바운스, 300ms 스켈레톤, 응답 지연, 로그아웃 지연)는 자동 진행이 없는 가짜 타이머(`vi.useFakeTimers()` 기본값, `shouldAdvanceTime` 없음)를 쓰고 `await vi.advanceTimersByTimeAsync(n)`으로만 시간을 보낸다. MSW 처리기의 지연(`delay(n)`)도 같은 가짜 시계로 흐르고, `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`로 입력 도구를 맞춘다.
- **jsdom 한계**: 레이아웃이 없으므로 화면 폭은 `matchMedia` 대역으로, 색·크기는 토큰·클래스로, 실제 렌더링(캘린더, 쿠키, CSP 위반)은 §5 사용자 검토로 판정한다. jsdom에는 IndexedDB가 없으므로 `src/test/setup.ts`가 앱 모듈을 가져오기 전에 감시 가능한 `open`을 가진 `indexedDB` 대역을 설치한다. `window.location`의 메서드는 감시할 수 없으므로 "문서 새로고침 없음"은 `location.href`가 그대로이고 jsdom의 "Not implemented: navigation" 오류가 없는 것으로 판정한다.
- **vitest 파일 지정**: 명령의 경로 인자는 vitest의 부분 문자열 필터다. 여러 파일은 디렉터리(`npx vitest run src/app/shell`)나 정확한 파일 경로로 지정하고 셸 glob(`**`)을 쓰지 않는다.
- 이 SPEC이 라이브러리 위에 더하는 동작은 RED 시험을 먼저 써서 실패를 확인한 뒤 구현한다. 결함 재현 시험(후속 과제 1·2·4)은 고치기 전에 실패해야 한다.

## 1. 인수 기준 매트릭스

| AC | 요지 | REQ | 검증 | 판정 시점 | 사용자 검토 |
|---|---|---|---|---|---|
| AC-UI-002-01 | 의존성 25 + 19 정확 고정, engines, 옛 의존성 0건 | 001 | `dependency-pins` 시험 · QG-12 | M1 | — |
| AC-UI-002-02 | OpenAPI 스냅숏·생성 타입 동기, 내보내기 쓰기 범위 | 002 | `schema-sync`·`export-openapi` 시험 | M1 | — |
| AC-UI-002-03 | 운영 빌드 env 검사, 기준 주소, 개발 프록시 | 003 | `vite-plugins`·`env` 시험 · 빌드 산출물 검사 | M1 | UR-8 |
| AC-UI-002-04 | 커버리지·디자인 규칙 범위 확대, `@/ui-core` 가져오기 | 004 | 설정 시험 · 커버리지 보고 검사 · `design-rules` 시험 | (가)(다) M1, (나) M4·M8 | — |
| AC-UI-002-05 | 메모리 토큰, 새로고침 복원, 로그아웃 | 005, 007 | `session` 시험 · 인증 흐름 통합 시험 | (가)~(다) M2, (라) M4 | UR-1 |
| AC-UI-002-06 | 동시 401 single-flight, 갱신 실패 종류, 쿠키 전송 범위 | 006 | `client`·`session` 시험 · 경로 시험 | (가)~(사) M2, (나)의 화면 부분 M4 | UR-1 |
| AC-UI-002-07 | `SHOP_NOT_SELECTED`, 다른 기기의 매장 변경, 매장 범위 키 | 008 | `client`·`query-keys` 시험 · 셸 매장 범위 시험 | (다)와 처리기 호출 M2, (가)(나)의 화면 부분 M5 | UR-6 |
| AC-UI-002-08 | 오류 정규화, 재시도 규칙, 이전 요청 취소(훅 수준) | 009 | `errors`·`query-client` 시험 | M2 | — |
| AC-UI-002-09 | 경로 표, 보호, `next` 두 사용처, 404 | 010 | 경로 시험 · `safe-next` 시험 | M4 | UR-8 |
| AC-UI-002-10 | 앱 셸 반응형·저장·서랍·건너뛰기 링크 | 011 | 셸 컴포넌트 시험(matchMedia 대역, axe) | M4 | UR-5 |
| AC-UI-002-11 | 로그인 검증·오류 문구·이동 | 012 | LoginPage 통합 시험 | M4 | — |
| AC-UI-002-12 | 매장 선택·캐시 교체·`next` 셋째 사용처·실패·빈 상태 | 013, 010 | ShopSelectPage 통합 시험 | M4 | — |
| AC-UI-002-13 | 미리보기 개발 전용, 약관·개인정보 | 014 | 경로 시험 · `check:dist` · QG-18 · legal 시험 | M4, M8에서 다시 판정 | — |
| AC-UI-002-14 | 상태 모듈·배지·레일·캘린더 일정 상태 표시·도메인 경계 | 015, 017 | `status`·StatusBadge·이력 행·일정 내용 시험 · QG-11 | 배지·행·QG-11 M6, 일정·범례 M7 | UR-5 |
| AC-UI-002-15 | 25칸 전환 규칙과 확인 대화상자 | 016 | `status`·StatusChangeControl 시험 | M6 | — |
| AC-UI-002-16 | 캘린더 범위·쪽 반복·상한·취소·일정 내용·대화상자 열기 | 017, 009 | `calendar-events` 단위 · 캘린더 통합 시험 | M7 | UR-5, UR-7 |
| AC-UI-002-17 | 예약 저장 요청 계약 | 018 | ReservationFormModal 통합 시험 | M7 | — |
| AC-UI-002-18 | 고객 검색·URL·CRUD·409·삭제 확인·취소 비표시 | 019, 022, 009 | CustomersPage 통합 시험(가짜 타이머) | M5 | — |
| AC-UI-002-19 | CSV 전체 쪽·이스케이프·수식 주입 방지 | 019 | `csv` 단위 · `export-csv` 시험 | M5 | — |
| AC-UI-002-20 | 시술 메뉴·세부 항목 CRUD와 하한 | 020, 022 | TreatmentMenusPage 통합 시험 | M6 | UR-4 |
| AC-UI-002-21 | 시술 이력 필터·정렬·URL·취소·배지 + 레일 | 021, 009 | TreatmentHistoryPage 통합 시험 | M6 | UR-4 |
| AC-UI-002-22 | 폼 검증 시점·첫 오류 포커스·숫자 입력 | 022 | `number-input` 시험 · `form` 단위 · 대화상자 시험 | (마)~(사)의 입력 부분 M3, 시점 규칙 단위 M4, 대화상자 M7 | — |
| AC-UI-002-23 | ui-core 후속 과제 15건·새 컴포넌트 4개·잠금 | 023 | ui-core 전체 시험 · 기준선 비교 · `design-rules` · PreviewPage | M3 | UR-9 |
| AC-UI-002-24 | 운영 빌드 CSP | 024 | `vite-plugins` 시험 · `check:dist` | M8 | UR-2, UR-3 |
| AC-UI-002-25 | `deploy.sh` 운영 모드 빌드·안전한 env 읽기·가드 제거 | 025 | `deploy-script` 시험(대역 명령) · 주석 제외 검사 · 커밋 확인 | (가)~(마) M8 읽기 커밋부터(가드 변수를 주고), 전부 M8 마지막 커밋(가드 변수 없이) | — |

### 1.1 요구사항 → 인수 기준(절별)

절 번호는 spec.md의 요구사항 문장에서 `(shall)`·`(shall not)`이 붙은 순서다.

| REQ | 절 | 판정 위치 |
|---|---|---|
| 001 | ① 25 + 19 고정·engines ② 옛 의존성 키·지정자 금지 | ① 01 Then·And ② 01 And(QG-12 두 검사) |
| 002 | ① 스냅숏·타입 보유 ② 재생성 동일 ③ 백엔드 폴더 무변경 ④ 지정 출력 경로에만 씀 ⑤ 3.1이 아니면 실패 | ① ② 02 Then ③ ④ ⑤ 02 And |
| 003 | ① 운영 빌드 env 검사 ② 개발 기준 주소 `/api`·프록시 ③ 운영 기준 주소 ④ 프록시 값 번들 비노출 | ① 03 Then·EC-35 ② 03 And(가)(나) ③ 03 And(나) ④ 03 And(다) |
| 004 | ① 커버리지 포함·제외 ② 규칙 검사 범위 ③ `@/ui-core`만 | ① 04 (가)(나) ② ③ 04 (다) |
| 005 | ① 메모리 토큰·Bearer ② 저장소 쓰기 금지 ③ `refresh_token` 미보관 | ① 05 Then(가) ② 05 Then(가)·And(가) ③ 05 And(나) |
| 006 | ① 갱신 1회·재전송 1회 ② 재전송 401이면 끝냄 ③ 갱신 401 → 세션 삭제·로그인 화면·만료 문구 ④ 401이 아닌 갱신 실패 → 세션 유지 | ① 06 Then(가)·EC-01·EC-02 ② 06 And(다) ③ 06 And(나) ④ 06 And(마)(바)(사)·EC-31·EC-32 |
| 007 | ① 보호 경로 쿠키 갱신 1회 ② 로그아웃은 기다리지 않고 지움 ③ 결과가 요청 결과에 따라 달라지지 않음 | ① 05 And(나)(라)·09 Then(가)(S0의 갱신 시도) ② ③ 05 And(다)(라) |
| 008 | ① 미선택 → `/shops?next=`·캐시 폐기 ② 포커스 때 신선도 무관 재요청 ③ id가 다르면 캐시 폐기·토스트 1회 ④ 키 모양 | ① 07 Then(가) ② ③ 07 And(나) ④ 07 And(다) |
| 009 | ① 정규화·문구 순서(백엔드 문구 예외) ② 쿼리 재시도 정책 ③ 변경 재시도 없음 ④ 입력 변경 시 취소·비표시 | ① 08 Then·EC-09·EC-10 ② ③ 08 And(가) ④ 08 And(나)·16 Then·18 Then·21 And(둘째) |
| 010 | ① 경로 표 ② 세션 없으면 그리기 전 이동 ③ `next` 규칙(세 사용처) | ① 09 Then(가) ② 09 Then(가) ③ 09 And(나)(다)·12 Then(다)·EC-05·EC-27~EC-30 |
| 011 | ① 상단바·사이드바·건너뛰기 링크 ② 폭별 상태 ③ 서랍 이동 시 닫힘 | ① 10 And(다) ② 10 Then·And(가)·EC-07·EC-08·EC-40 ③ 10 And(나) |
| 012 | ① 빈 칸·형식 오류 → 요청 없음·포커스 ② 성공 + 매장 있음 ③ 성공 + 매장 없음 ④ 오류 3종 문구 | ① 11 Then(가)(나)(나') ② 11 And(바)(사) ③ 11 And(아)(자) ④ 11 And(다)(라)(마) |
| 013 | ① 성공 → 캐시 교체·이동 ② 실패 → 그대로·오류 ③ 로딩·빈·오류 상태 | ① 12 Then(가)(나)(다) ② 12 And(라) ③ 12 And(마)(바) |
| 014 | ① 개발 서버 미리보기 ② 운영 산출물에 미리보기 없음 ③ 약관·개인정보 문구 | ① 13 Then(가) ② 13 Then(나)·And(다) ③ 13 And(라) |
| 015 | ① 한곳에 정의 ② 목록·표의 배지 + 레일 ③ ui-core에 상태 키 없음 ④ 라벨 글자 재기재 금지 | ① 14 Then ② 14 And(가) ③ 14 And(다)(QG-11 경계) ④ 14 And(다)(QG-11 라벨 검사) |
| 016 | ① 현재 상태 선택 불가 ② 바로·확인 구분 ③ 닫기·Esc → 요청 없음 | ① 15 Then ② 15 Then ③ 15 And·EC-42 |
| 017 | ① 쪽 반복·상한 ② 일정 내용·접근 이름·설명·범례 ③ 일정·빈 칸·"예약 추가" → 대화상자 | ① 16 Then·And(가)·EC-11·EC-12 ② 14 And(나)·16 And(나) ③ 16 And(다) |
| 018 | ① 오프셋 ISO·`reserved_at`·`status`·항목 생략·전체 배열 | ① 17 Then·And·EC-14·EC-15 |
| 019 | ① 디바운스·URL·CRUD ② CSV 전체·형식 ③ 중간 실패 → 파일 없음 | ① 18 ② 19 Then·And·EC-18·EC-36 ③ EC-19 |
| 020 | ① 메뉴·세부 한 화면·CRUD ② 소요 시간·가격 1 이상 | ① 20 Then·And(가)(나)·EC-20 ② 20 Then(0)·And(다) |
| 021 | ① 필터·정렬·쪽 URL·배지 + 레일 표 | ① 21 Then·And·EC-21·EC-22·EC-33 |
| 022 | ① 검증 시점 ② 제출 실패 → 첫 오류 필드·문구 ③ 숫자 입력 | ① 22 Then(가)~(다)·22 And(폼 단위 시험) ② 22 And(라)·18 And(다)·20 And(다) ③ 22 And(마)(바)(사)·EC-23·EC-24 |
| 023 | ① 후속 과제 15건·기존 시험 통과 ② 새 컴포넌트 4개·잠금 | ① 23 Then·And(가) ② 23 And(나)(다) |
| 024 | ① 운영 빌드 CSP meta 위치·정책 ② 개발 서버에 CSP 없음 | ① 24 Then·And(가)·EC-25·EC-34 ② 24 And(나) |
| 025 | ① 운영 모드 빌드·안전한 읽기 ② 멈춤 조건 ③ M8 마지막 run 단계 커밋에서 가드 제거 | ① 25 Then·EC-26·EC-37·EC-38 ② 25 And(가)·EC-39 ③ 25 And(다) |

## 2. 시나리오

### 모듈 1 — 기반·계약

#### AC-UI-002-01 — 의존성 정확 고정과 옛 의존성 (maps REQ-UI-002-001)

- **Given** M1 이후 `npm ci`로 설치한 작업 트리
- **When** `src/test/dependency-pins.test.ts`, `src/test/timezone.test.ts`, §4.1 QG-12 두 검사를 실행한다
- **Then** `package.json`의 `dependencies` 25개와 `devDependencies` 19개가 §3.4 목록과 이름·버전 문자열까지 같고, 목록에 없는 항목과 범위 기호(`^`, `~`, `>=`)가 없다
- **And** 고정 시험이 `engines.node === "^22.22.0 || ^24.0.0"`을 단언하고, QG-12 모듈 지정자 검사가 "출력 없음"(§0), `package.json` 키 검사가 종료 코드 0이다. 시간대 시험은 밖의 `TZ=UTC`에서도 통과한다
- **검증**:

```bash
npx vitest run src/test/dependency-pins.test.ts
TZ=UTC npx vitest run src/test/timezone.test.ts
# QG-12 두 검사는 §4.1 블록
```

#### AC-UI-002-02 — OpenAPI 스냅숏과 생성 타입 (maps REQ-UI-002-002)

- **Given** 커밋된 `openapi/openapi.json`과 `src/api/schema.d.ts`, 그리고 `src/test/export-openapi.test.ts`가 임시 디렉터리에 만든 가짜 백엔드 폴더(`.venv/bin/python` 자리에 대역 스크립트가 있고, 대역은 받은 작업 디렉터리와 환경 변수 `PYTHONDONTWRITEBYTECODE`·`LOG_TO_FILE`·`SENTRY_DSN`을 기록 파일에 적은 뒤 최소 OpenAPI 3.1 문서를 표준 출력에 낸다)
- **When** `src/api/schema-sync.test.ts`가 `node_modules/.bin/openapi-typescript`를 `api:types`와 같은 옵션으로 임시 경로에 실행해 비교하고 스냅숏 머리 값을 읽으며, 내보내기 시험이 저장소 루트를 작업 디렉터리로 `node scripts/export-openapi.mjs --out <임시 디렉터리>/out/openapi.json`을 `KMC_BACKEND_DIR=<가짜 폴더>`로 실행한다
- **Then** 다시 생성한 타입이 커밋된 `schema.d.ts`와 글자 단위로 같고, 스냅숏의 `openapi`가 `3.1.0`, 경로 31개, 연산(API) 50개, `components.schemas` 58개다(백엔드 `eb8b06d`에서 확인한 값이며, 출처 커밋은 progress.md와 M1 커밋 메시지에 적는다)
- **And** 가짜 백엔드 폴더의 파일 목록(이름·크기·수정 시각)이 실행 전후로 같고, 출력은 `--out` 경로 한 곳에만 생기며, 대역 기록에 작업 디렉터리 = 가짜 폴더, `PYTHONDONTWRITEBYTECODE=1`, `LOG_TO_FILE=false`, 빈 `SENTRY_DSN`이 있다. 대역이 `"openapi": "3.0.3"` 문서를 내면 출력 파일을 만들지 않고 0이 아닌 코드로 끝난다
- **검증**:

```bash
npx vitest run src/api/schema-sync.test.ts src/test/export-openapi.test.ts
```

#### AC-UI-002-03 — 운영 빌드 env 검사, 기준 주소, 개발 프록시 (maps REQ-UI-002-003)

- **Given** `vite-plugins.ts`의 `envCheckPlugin`, `src/app/env.ts`의 기준 주소 함수, `vite.config.ts`에서 뺀 순수 함수 `buildDevProxy(env)`
- **When** 플러그인을 `command: "build"`, `mode: "production"`으로 `VITE_API_BASE_URL` 없음, `http://api.example.test`, `https://`, `https://a b`, `https://api-beauty.dongri.kr` 다섯 값으로, `mode: "development"`·값 없음으로 실행하고, 기준 주소 함수를 `{ DEV: true }`와 `{ DEV: false, VITE_API_BASE_URL: "https://api.test" }`로 부르고, `buildDevProxy`를 명시한 env 객체 `{}`와 `{ DEV_API_PROXY_TARGET: "http://127.0.0.1:9000" }`, `{ DEV_API_PROXY_TARGET: "https://api-beauty.dongri.kr" }`로 부른다
- **Then** 운영 모드의 앞 네 경우는 오류 메시지에 `VITE_API_BASE_URL`을 담고 실패하며, 마지막 값과 개발 모드는 통과한다
- **And** (가) 프록시는 `/api` 키 하나이고 대상이 기본 `http://localhost:8000`(덮어쓰면 그 값), `changeOrigin: true`, 경로 변환이 `/api/auth/login` → `/auth/login`이며, 대상 호스트가 `localhost`·`127.0.0.1`이 아니면 경고를 한 줄 출력한다. (나) 기준 주소가 개발 `/api`, 운영 `https://api.test`다
- **And** (다) 빌드 산출물에 프록시 대상 값과 변수 이름이 없다(§4.1 AC-03 블록)
- **검증**:

```bash
npx vitest run src/test/vite-plugins.test.ts src/app/env.test.ts
# 빌드 산출물 검사는 §4.1 AC-03 블록
```

#### AC-UI-002-04 — 커버리지·디자인 규칙 범위 확대 (maps REQ-UI-002-004)

- **Given** M1에서 바꾼 `vite.config.ts`의 `coverage` 설정(보고 형식 `text`·`json`·`json-summary`)과 design-rules 시험의 검사 대상
- **When** (가) 설정 시험(`src/test/coverage-config.test.ts`)이 `vite.config.ts`의 `coverage.include`·`exclude`·`thresholds`를 읽고, (나) M4와 M8에서 `npm run test:coverage` 뒤 §4.1 AC-04 블록으로 `coverage/coverage-final.json`의 파일 목록을 검사하고, (다) design-rules 시험이 `src/features` 위치를 흉내 낸 위반 표본(`dark:bg-card`, `bg-rose-700`, `import { Button } from "@/ui-core/button"`, `import { x } from "@/ui-core/internal/class-names"`, `import { Button } from "../../ui-core/button"`, `export { Button } from "@/ui-core/button"`, `const m = import("@/ui-core/button")`)과 통과 표본(`import { Button } from "@/ui-core"`)을 검사한다
- **Then** (가) 포함 목록이 `src/**/*.{ts,tsx}`와 `vite-plugins.ts`이고, 제외 목록에 `src/api/schema.d.ts`·`**/*.d.ts`·`src/main.tsx`·`src/preview/**`·`src/test/**`·`src/ui-core/index.ts`·`**/*.test.{ts,tsx}`가 있으며, 기준값이 M1~M7 커밋에서 80/80/80/80, M8 마지막 커밋에서 85/85/85/80(줄·문장·함수·분기)이다. `scripts/*.mjs`는 자식 프로세스로 실행되어 측정되지 않으므로 포함하지 않고, 동작은 AC-02·AC-13·AC-24 시험이 판정한다
- **And** (나) 보고에 `src/app/`·`src/api/`·`src/features/`·`src/lib/`·`src/ui-core/`·`vite-plugins.ts`가 있고 제외 경로가 하나도 없다. (다) 위반 표본 일곱 개가 각각 `경로:줄`이 든 실패로 잡히고 통과 표본은 잡히지 않는다
- **검증**:

```bash
npx vitest run src/test/coverage-config.test.ts src/test/design-rules.test.ts
npm run test:coverage
# 보고 파일 검사는 §4.1 AC-04 블록(M4, M8)
```

### 모듈 2 — 데이터·인증

#### AC-UI-002-05 — 메모리 토큰, 새로고침 복원, 로그아웃 (maps REQ-UI-002-005, REQ-UI-002-007)

- **Given** `Storage.prototype.setItem`, `Document.prototype`의 `cookie` 설정자, setup이 설치한 `indexedDB.open` 대역을 감시하는 시험과 MSW 처리기: 로그인 응답 `{"access_token":"access-1","refresh_token":"refresh-1","token_type":"bearer"}`, 갱신 응답 `{"access_token":"access-2","refresh_token":"refresh-2","token_type":"bearer"}`, 로그아웃은 경우마다 500·네트워크 오류·응답하지 않음
- **When** (가) `src/api/session.test.ts`에서 로그인하고 보호 요청을 보낸다. (나) 세션 모듈을 초기 상태로 되돌린 뒤 `ensureSession()`과 보호 요청을 다시 보낸다(새로고침 흉내). (다) 로그아웃을 세 경우로 실행한다 — 응답하지 않는 경우는 가짜 타이머를 전혀 흘리지 않은 채 판정한다. (라) M4의 `src/app/auth-flow.test.tsx`에서 로그인 → 같은 경로 다시 그리기 → 사용자 메뉴의 "로그아웃"을 화면으로 한다
- **Then** (가) 로그인 뒤 보호 요청의 `Authorization`이 `Bearer access-1`이고, 감시한 어떤 쓰기의 인자에도 `access-1`·`access-2`·`refresh-1`·`refresh-2`가 없다
- **And** (가) 흐름이 끝난 뒤 `localStorage`·`sessionStorage`의 모든 키와 값, `document.cookie`에 네 문자열이 없고 `indexedDB.open` 호출이 0회다(`localStorage.x = …`처럼 `setItem`을 거치지 않은 쓰기도 이 뒤 검사가 잡는다)
- **And** (나) `JSON.stringify`한 쿼리 캐시 상태(`queryClient.getQueryCache().getAll().map((q) => q.state)`)와 변경 캐시 상태(`getMutationCache().getAll().map((m) => m.state)`), 세션 모듈이 내보내는 값에 `refresh-`가 없다. 새로고침 흉내 뒤 `POST /auth/refresh`가 정확히 1회(본문 없음, `credentials: "include"`) 가고 이후 요청이 `Bearer access-2`를 쓴다
- **And** (다) 세 경우 모두 로그아웃 함수가 돌아온 즉시(응답을 기다리지 않고) 세션 토큰이 `null`, `queryClient.getQueryCache().getAll()`이 0개이고, `POST /auth/logout`이 `credentials: "include"`로 1회 갔다. (라) 화면에서도 같은 결과이고 현재 경로가 `/login`이며, 새로고침 흉내 뒤 보호 화면이 로그인 화면으로 가지 않고 그려진다
- **검증**: `npx vitest run src/api/session.test.ts`(M2), `npx vitest run src/app/auth-flow.test.tsx`(M4)

#### AC-UI-002-06 — 동시 401, single-flight 갱신, 갱신 실패 종류 (maps REQ-UI-002-006)

- **Given** `createApiClient({ baseUrl: "http://api.test", onSessionExpired, onShopNotSelected })`, 메모리 토큰 `expired-1`, 동시에 보낸 보호 요청 3개(`GET /phonebooks`, `GET /phonebooks/groups`, `GET /users/me`), `expired-1`이 붙은 요청에는 모두 401을 주는 처리기
- **When** 갱신 처리기를 바꿔 (가) 200 `access-2`, (나) 401, (다) 200이지만 재시도한 요청이 다시 401, (라) `POST /auth/login`이 401, (마) 갱신이 네트워크 오류, (바) 갱신이 429, (사) 갱신이 503인 경우를 각각 실행한다
- **Then** (가) `POST /auth/refresh`가 1회이고 세 원래 요청은 각각 정확히 2회(처음 1 + 재시도 1) 가며, 재시도 요청의 `Authorization`이 `Bearer access-2`다
- **And** (나) 세션 만료 처리기가 1회 불리고 쿼리 캐시가 0개다. M4의 `src/app/routes.test.tsx`에서는 `/customers`(M4의 빈 화면)에서 같은 상황이 경로 `/login?next=%2Fcustomers`와 문구 "로그인이 만료됐어요. 다시 로그인해 주세요."로 끝난다
- **And** (다) 갱신은 1회에서 늘지 않고 그 요청은 `status` 401 오류로 끝난다. (라) 갱신 요청이 0회다. (마) 결과가 `kind: "network"` 오류, (바) `status` 429, (사) `status` 503 오류이고, 셋 다 세션 만료 처리기가 0회, 세션 토큰이 지워지지 않는다(EC-31·EC-32)
- **And** 모든 요청 기록에서 `credentials: "include"`는 `/auth/login`·`/auth/refresh`·`/auth/logout` 요청에만 있고, 어떤 요청에도 `X-Refresh-Token` 헤더가 없다
- **검증**: `npx vitest run src/api/client.test.ts src/api/session.test.ts`(M2), `npx vitest run src/app/routes.test.tsx`(M4, (나)의 화면 부분)

#### AC-UI-002-07 — 매장 미선택과 매장 범위 캐시 (maps REQ-UI-002-008)

- **Given** 선택 매장 id 7, 쿼리 캐시에 `["shop", 7, "customers", …]`·`["shop", 7, "menus", …]` 항목. M2는 API 계층만, M5는 고객 화면(`/customers`)을 셸 안에서 그린 `src/app/shell/shop-scope.test.tsx`
- **When** (가) 고객 요청이 404 `{"detail":{"code":"SHOP_NOT_SELECTED","detail":"상점을 먼저 선택해주세요.","hint":null}}`을 받고, (나) 다른 시험에서 첫 화면이 그려진 직후(`staleTime` 30초 안) `focusManager.setFocused(false)` → `focusManager.setFocused(true)`로 포커스를 다시 주고 그때 `GET /shops/selected`가 id 8 매장을 돌려준다
- **Then** (가) M2: 매장 미선택 처리기가 1회 불린다. M5: 경로가 `/shops?next=%2Fcustomers`가 되고 `queryClient.getQueryCache().findAll({ queryKey: ["shop"] })`가 0개이며, `location.href`가 그대로이고 jsdom의 "Not implemented: navigation" 오류가 없다
- **And** (나) M5: 포커스 뒤 `GET /shops/selected`가 1회 더 가고(캐시가 신선해도), `["shop", 7, …]` 항목이 0개가 되며 토스트 "다른 기기에서 매장이 바뀌었어요."가 1번 뜨고 화면이 매장 8의 고객 목록을 다시 요청한다
- **And** (다) M2: 쿼리 키 공장의 매장 범위 키 6개가 모두 `["shop", <매장 id>, …]`로 시작한다(§3.11 키 표 6행)
- **검증**: `npx vitest run src/api/client.test.ts src/api/query-keys.test.ts`(M2), `npx vitest run src/app/shell/shop-scope.test.tsx`(M5)

#### AC-UI-002-08 — 오류 정규화·재시도·취소 (maps REQ-UI-002-009)

- **Given** §3.2 응답 표의 MSW 처리기, 자동 진행 없는 가짜 타이머
- **When** 각 응답을 받은 결과를 정규화하고, 같은 응답을 쿼리와 변경으로 받아 요청 횟수를 세고, 시험 훅(`useQuery`, 키 `["shop", 7, "customers", "list", { q, page: 1 }]`, 처리기 지연 500ms)의 `q`를 `"김"`에서 `"김민"`으로 응답 전에 바꾼다
- **Then** 정규화 결과의 `status`·`kind`·`code`·`message`·`hint`·`fieldErrors`가 §3.2 표와 같다
- **And** (가) 4xx와 `aborted`는 쿼리 요청 횟수 1회(재시도 0), 500·503·네트워크 오류는 3회(처음 1 + 재시도 2), 변경은 언제나 1회다
- **And** (나) 앞 요청의 `signal.aborted`가 `true`가 되고, 훅의 최종 데이터가 `"김민"` 응답이며 `error`가 `null`이다. 화면에서 취소가 알려지지 않는지는 AC-18(고객), AC-21(이력), AC-16(캘린더)이 판정한다
- **검증**: `npx vitest run src/api/errors.test.ts src/api/query-client.test.ts`

### 모듈 3 — 셸·탐색·공개 화면

#### AC-UI-002-09 — 경로 표, 보호, `next` (maps REQ-UI-002-010)

- **Given** 앱과 같은 경로 함수(`createRoutes({ devRoutes: [] })`)로 만든 메모리 라우터(`src/test/render-route.tsx`)와 세 세션 상태: S0 비로그인(갱신 401), S1 로그인·매장 없음(`GET /shops/selected` 404 `SHOP_NOT_SELECTED`), S2 로그인 + 매장 7. 업무 화면 4개는 M4에서 h1만 있는 빈 화면이다
- **When** (가) §3.3 경로 표의 각 경로를 연다. (나) S2에서 §3.3 `next` 표본마다 `/login?next=<표본>`을 연다(로그인 화면 loader 사용처). (다) S0에서 §3.3 `next` 표본마다 `/login?next=<표본>`을 열고 로그인을 마친다(로그인 성공, 선택 매장 있음 — 로그인 제출 사용처). `safe-next` 단위 시험은 같은 표본을 `safeNext(value, "http://localhost:3000")`에 넣는다
- **Then** (가) 각 경로의 결과(이동한 경로와 보이는 h1)가 §3.3 표와 같고, 보호 경로는 로그인 화면으로 갈 때 보호 화면의 h1을 한 번도 그리지 않는다
- **And** (나)·(다) 두 사용처 모두 거부 표본은 `/reservations`로, 허용 표본은 표의 이동 경로로 간다(EC-05, EC-27~EC-30)
- **검증**: `npx vitest run src/app/routes.test.tsx src/app/safe-next.test.ts`(M4)

#### AC-UI-002-10 — 앱 셸 (maps REQ-UI-002-011)

- **Given** S2 상태(매장 "강남점"), 오늘 2026-11-09T10:00:00+09:00, `matchMedia` 대역으로 폭 1280·900·375px과 경계 폭 1024·1023·768·767px
- **When** 각 폭에서 셸을 그리고, 키보드로 첫 Tab → Enter(건너뛰기 링크), 사이드바 접기 버튼, (375px) 메뉴 버튼 → 서랍 안 "고객" 링크를 쓴다
- **Then** 1280px: 처음에 펼침이고, 접으면 `localStorage["kmc-admin-sidebar"]`가 `"collapsed"`가 되며 다시 그려도 접혀 있다. 저장값이 `"expanded"`면 펼친 채 시작한다
- **And** (가) 900px: 저장값이 `"expanded"`여도 접힌 채 시작하고, 펼쳐도 저장값은 `"expanded"` 그대로다. 경계 폭 1024px은 1280px과, 1023px·768px은 900px과, 767px은 375px과 같은 구간으로 동작한다(EC-40)
- **And** (나) 375px: 사이드바 대신 메뉴 버튼이 있고, 누르면 서랍(`role="dialog"`)이 열리며, "고객"으로 이동하면 서랍이 닫히고 경로가 `/customers`다
- **And** (다) 첫 Tab이 "본문으로 건너뛰기" 링크에 가고 Enter로 `#main`에 포커스가 간다. 상단바에 높이 클래스 `h-14`(56px)가, 사이드바에 `w-(--sidebar-width)`(펼침 240px)·`w-(--sidebar-width-collapsed)`(접힘 64px)가 있다(system.md §10 값). 상단바에 접기(또는 메뉴) 버튼, 이동 경로, "11월 9일 (월)", 테마 전환, 사용자 메뉴 버튼 다섯 개가 있고, 사이드바 머리에 "강남점"과 `/shops`로 가는 "매장 변경"이 있으며, 사용자 메뉴(Popover)에 이름·역할·이메일·"매장 변경"·"로그아웃"이 있다. 세 폭 모두 axe 위반이 0건이다
- **검증**: `npx vitest run src/app/shell`(M4)

#### AC-UI-002-11 — 로그인 (maps REQ-UI-002-012)

- **Given** 비로그인 상태의 로그인 화면(`/login?next=%2Fcustomers` 또는 `/login`)
- **When** (가) 빈 제출, (나) 이메일 `abc`로 제출, (나') 이메일 `a@b.co`·비밀번호 `x`로 제출, (다) 401, (라) 429, (마) 네트워크 오류, (바) 성공 + 선택 매장 있음 + `next=%2Fcustomers`, (사) 성공 + 선택 매장 있음 + `next` 없음, (아) 성공 + 선택 매장 없음 + `next=%2Fcustomers`, (자) 성공 + 선택 매장 없음 + `next` 없음을 각각 실행한다
- **Then** (가) 요청 0회, 이메일·비밀번호 필드에 "이메일을 입력해 주세요."·"비밀번호를 입력해 주세요.", 포커스가 이메일 입력. (나) 요청 0회, "이메일 형식을 확인해 주세요.", 포커스가 이메일 입력. (나') 형식 오류 없이 로그인 요청 1회
- **And** (다)·(라)·(마)의 문구가 §3.2의 로그인 401·로그인 429·네트워크 문구와 같고 서로 다르며, 제출 버튼이 `loading`에서 돌아온다
- **And** 로그인 요청은 `application/x-www-form-urlencoded`이고 `username`·`password`·`grant_type=password`를 담으며 `credentials: "include"`다. (바) `/customers`, (사) `/reservations`, (아) `/shops?next=%2Fcustomers`, (자) `/shops`로 간다. 처음 렌더링 때 두 입력 값이 빈 문자열이고 자동 완성 속성이 `username`·`current-password`다
- **검증**: `npx vitest run src/features/auth/LoginPage.test.tsx`(M4)

#### AC-UI-002-12 — 매장 선택 (maps REQ-UI-002-013, REQ-UI-002-010)

- **Given** 로그인 상태에서 매장 1("강남점")이 선택되어 있고(`GET /shops/selected` → id 1) 셸의 "매장 변경"으로 `/shops`를 연 경우, 매장 목록 `[{"id":1,"name":"강남점",…},{"id":2,"name":"홍대점",…}]`, 쿼리 캐시의 `["shop", 1, "customers", …]`, 자동 진행 없는 가짜 타이머
- **When** (가) `next` 없이, (나) `/shops?next=%2Fcustomers`에서, (다) `/shops?next=%2F%2Fevil.example`과 §3.3 거부 표본 전부에서 "홍대점" 카드 버튼을 누른다. 다른 시험에서 (라) `POST /shops/selected`가 500, (마) 목록이 빈 배열, (바) 목록 요청이 500(지연 400ms)인 경우를 실행한다
- **Then** (가)(나)(다) `POST /shops/selected` 본문 `{"shop_id":2}`가 1회 가고, `["shops", "selected"]` 데이터의 id가 2, `["shop", 1, …]` 항목이 0개이며, 경로가 (가) `/reservations`, (나) `/customers`, (다) `/reservations`다
- **And** (라) 선택 매장 캐시 id가 1 그대로, `["shop", 1, …]` 항목이 그대로, 경로가 `/shops` 그대로이고 destructive Alert가 보인다
- **And** (마) "등록된 매장이 없어요. 매장은 kmcbeauty 앱에서 만들 수 있어요."가 보인다. (바) 300ms를 흘리면 스켈레톤이, 응답 뒤 destructive Alert와 "다시 시도" 버튼이 보이고, 누르면 목록을 다시 요청한다. 299ms까지는 스켈레톤이 없다(경계는 "이상" — 300ms 시점부터 보임, REQ-UI-002-013)
- **검증**: `npx vitest run src/features/shops/ShopSelectPage.test.tsx`(M4)

#### AC-UI-002-13 — 미리보기 개발 전용과 약관·개인정보 (maps REQ-UI-002-014)

- **Given** `src/app/dev-routes.ts`가 모듈 범위에서 `import.meta.env.DEV`로 정한 개발 경로 목록(시험 환경에서는 참), 그 목록과 빈 목록으로 각각 만든 두 메모리 라우터, 운영 빌드 산출물
- **When** (가) 개발 라우터에서 `/dev/preview`를 연다. (나) 빈 목록 라우터에서 `/dev/preview`를 연다. (다) `VITE_API_BASE_URL=https://api-beauty.dongri.kr`로 빌드하고 `check:dist`와 §4.1 QG-18 블록을 실행한다. (라) S0에서 `/terms-of-service`·`/privacy-policy`를 연다
- **Then** (가) h1 "컴포넌트 미리보기"가 보인다. (나) h1 "찾을 수 없는 페이지예요."가 보인다
- **And** (다) 빌드가 종료 코드 0이고, `check:dist`가 종료 코드 0이며, `dist`의 JS 파일에 "컴포넌트 미리보기"와 `bg-rose-700`이 없다("출력 없음", §0)
- **And** (라) 두 문서가 로그인 화면으로 가지 않고 h1 "이용약관"·"개인정보처리방침" 아래에 §3.9의 문단을 순서대로, 공백을 하나로 줄이고 앞뒤를 자른 같은 글자로 보인다(문단 수도 같다)
- **검증**:

```bash
npx vitest run src/app/routes.test.tsx src/features/legal
# 빌드와 산출물 검사는 §4.1 QG-17·QG-18 블록
```

### 모듈 4 — 업무 화면

#### AC-UI-002-14 — 상태 모듈과 표시 (maps REQ-UI-002-015, REQ-UI-002-017)

- **Given** 상태 5종 예약이 하나씩 있는 응답(고객 김민지·박서연·이지은·최하늘·정우성, 시각 09:00~13:00 한 시간 간격, KST)
- **When** M6에 StatusBadge와 이력 표 행을, M7에 캘린더 일정 내용(`eventContent` 결과를 따로 그린 것)과 캘린더 위 범례를 그리고, §4.1 QG-11 블록을 실행한다
- **Then** `STATUS_ORDER`와 `STATUS_META`의 순서·라벨·아이콘·토큰·뜻이 §3.1 상태 표와 같고, 배지마다 `aria-hidden` 아이콘과 라벨 글자가 함께 있다
- **And** (가) 이력 행마다 레일 클래스가 그 행의 원본 `status`에 해당하는 `STATUS_META[status].className.rail`이고, 레일이 있는 행에는 모두 배지가 있다
- **And** (나) 일정마다 상태 클래스가 원본 `status`의 `STATUS_META[status].className.event`이고, 상태 아이콘(`aria-hidden`)·시각·고객 이름이 보이며 상태 라벨 글자는 보이지 않는다. 일정의 접근 이름이 §3.1 형식(예: 예약됨 09:00 김민지 → `"예약됨 · 09:00 · 김민지"`)이고, 마우스를 올리거나 포커스하면 같은 글의 설명이 뜬다. 범례는 캘린더 위에 아이콘 + 라벨 5개를 §3.1 순서로 보인다
- **And** (다) QG-11 경계 검사와 라벨 검사가 "출력 없음"(§0), 패턴 자체 확인이 `2`, 도메인 모듈 양성 확인이 `5`다
- **검증**: `npx vitest run src/features/reservations src/features/treatments` 와 §4.1 QG-11 블록

#### AC-UI-002-15 — 상태 전환 규칙 (maps REQ-UI-002-016)

- **Given** §3.1 25칸 전환 표, `reserved_at: "2026-11-10T05:30:00Z"`인 예약 1건, 전환 컨트롤
- **When** 순수 함수에 25칸을 모두 넣고, 화면에서 전환 컨트롤을 열고, 각 "확인" 전환을 고른 뒤 대화상자를 "닫기"·Esc·확인 단추로 각각 끝내고, "바로" 전환을 고른다
- **Then** 함수 결과(`same`·`direct`·`confirm`)와 대화상자 제목·확인 단추 이름이 표와 같고, 컨트롤에서 현재 상태 항목은 고를 수 없다(비활성 또는 목록에 없음)
- **And** "닫기"와 Esc면 `PUT` 0회이고 상태가 그대로이며(EC-42), 확인 단추나 "바로" 전환이면 `PUT /treatments/{id}`가 1회 가고 본문 키가 정확히 `reserved_at`·`status`이며 `reserved_at`이 원래 값과 같은 순간이고(§0 일시 비교) `status`가 새 값이다
- **검증**: `npx vitest run src/features/reservations/status.test.ts src/features/reservations/StatusChangeControl.test.tsx`

#### AC-UI-002-16 — 예약 캘린더 (maps REQ-UI-002-017, REQ-UI-002-009)

- **Given** 주간 보기, 주 시작 요일 일요일(캘린더 옵션에 `firstDay: 0`을 명시한 설정 — ko 로캘 기본값에 기대지 않는다, plan.md §B.6), 보이는 범위 시작 2026-11-08(일) 00:00(KST)·끝 2026-11-15 00:00(KST, 배타), `size=100` 요청에 `pages: 3`(총 230건)을 주는 처리기, 다른 시험에서 `pages: 20`과 `pages: 21`을 주는 처리기, 자동 진행 없는 가짜 타이머
- **When** 캘린더를 열고, 다음 주로 넘기고(첫 범위 응답 지연 중), 월·일 보기로 바꾸고, 빈 칸 2026-11-10 14:30을 고르고, 일정 하나를 누르고, "예약 추가" 버튼에 Tab으로 가서 Enter를 누른다
- **Then** 캘린더의 처음 보기(`initialView`)가 `timeGridWeek`이고, 첫 범위 요청이 `start_date=2026-11-08&end_date=2026-11-14&size=100&page=1`, `page=2`, `page=3` 세 번이며 일정 230개가 만들어지고, 다음 주로 넘기면 앞 범위의 진행 중 요청 signal이 취소되고 `start_date=2026-11-15&end_date=2026-11-21`로 다시 요청하며 취소 오류가 화면에 보이지 않는다
- **And** (가) `pages: 20`이면 요청 20번(`page=1`~`20`)에 경고가 없고, `pages: 21`이면 요청이 20번에서 멈추고 "일부 예약만 보여요. 기간을 좁혀 주세요." 경고가 보인다. 일 보기는 그날 하루(`start_date`=`end_date`)를 요청한다(EC-41)
- **And** (나) 일정 변환 단위 시험: 시작 14:30 + 항목 소요 60분·30분이면 끝 16:00, 소요 합 0이면 끝 15:00, `classNames`에 상태 클래스(§3.1)가 들어간다. 일정 내용 렌더링 시험: 아이콘 하나(`aria-hidden`), 시각 "14:30"(`tabular-nums`), 고객 이름, 접근 이름 `"예약됨 · 14:30 · 김민지"`
- **And** (다) 빈 칸 선택은 등록 대화상자를 일시 2026-11-10 14:30으로 채워 열고, 일정 누르기는 그 예약 고객 이름이 채워진 수정 대화상자를, "예약 추가"는 키보드만으로 등록 대화상자를 연다
- **And** (라) 렌더링 연기 시험 1개: 실제 FullCalendar가 jsdom에서 그려지면 `.kmc-calendar` 안에 접근 이름을 가진 일정 230개가 있다. 그려지지 않아 대역으로 바꾸면, 대역이 받은 `events` 길이 230, `initialView` `timeGridWeek`, `firstDay` `0`, 플러그인 3개(daygrid·timegrid·interaction)를 확인하고 대역을 쓴 사실을 진행 기록에 남긴다(실제 렌더링은 UR-5)
- **검증**: `npx vitest run src/features/reservations`(M7)

#### AC-UI-002-17 — 예약 저장 요청 계약 (maps REQ-UI-002-018)

- **Given** 시간대 Asia/Seoul, 세부 항목 id 11("남성 커트", 60분, 30000원)과 id 12("드라이", 30분, 10000원)
- **When** (가) 고객을 "직접 입력"으로 `김민지`·`01012345678`, 일시 2026-11-10 14:30, 항목 1개(id 11, 회차 1), 결제 카드로 등록하고, (나) `reserved_at: "2026-11-11T01:00:00Z"`, `status: "VISITED"`, 항목 `[{"id":501,"menu_detail_id":11,…}]`인 다른 예약의 메모만 "앞머리 짧게"로 고쳐 저장하고, (다) 같은 예약에 항목 id 12를 더해 저장한다
- **Then** (가) `POST /treatments` 본문의 `reserved_at`이 `"2026-11-10T05:30:00.000Z"`, `status`가 `"RESERVED"`, `payment_method`가 `"CARD"`, `customer_name`·`customer_phone`이 입력값, `treatment_items`가 `[{"menu_detail_id":11,"base_price":30000,"duration_min":60,"session_no":1}]`이고 `finished_at` 키가 없다
- **And** (나) `PUT /treatments/{id}` 본문에 원래와 같은 순간의 `reserved_at`, `status: "VISITED"`, `memo: "앞머리 짧게"`가 있고 `treatment_items` 키가 없다. (다) 본문의 `treatment_items`가 `[{"id":501,"menu_detail_id":11,"base_price":30000,"duration_min":60,"session_no":1},{"menu_detail_id":12,"base_price":10000,"duration_min":30,"session_no":1}]`이다(EC-14). 일시 값은 모두 `Z` 또는 `±hh:mm` 오프셋으로 끝난다
- **검증**: `npx vitest run src/features/reservations/ReservationFormModal.test.tsx`(M7)

#### AC-UI-002-18 — 고객 화면 (maps REQ-UI-002-019, REQ-UI-002-022, REQ-UI-002-009)

- **Given** 자동 진행 없는 가짜 타이머, 첫 목록 응답 지연 500ms, 고객 "김민지"(id 3, 전화 `010-1234-5678`, 그룹 "VIP", 메모 "앞머리 짧게")를 포함한 목록, 매장 7
- **When** 검색 칸에 "김"을 치고 100ms 뒤 "김민"으로 고친 다음 300ms를 흘리고, 2쪽으로 넘기고, `/customers?q=김민&page=2`로 다시 그리고, 고객을 등록(성공, 이어서 중복 전화번호 409)하고, "김민지"를 수정하고, "김민지" 삭제를 "닫기"로 한 번, "삭제"로 한 번 고른다
- **Then** 검색 요청은 `search=김민&page=1&size=20` 1회뿐이고, 응답이 오기 전 첫 목록 요청의 signal이 취소되며, 입력은 친 글자를 바로 보이고, 취소 때문에 토스트·Alert가 나오지 않는다
- **And** (가) URL이 `?q=김민` → `?q=김민&page=2`가 되고, 다시 그리면 검색 칸이 "김민", 요청이 `page=2`다
- **And** (나) 등록 성공: `POST /phonebooks` 본문 `{"name":"박서연","phone_number":"01098765432","group_name":"VIP","memo":"첫 방문"}` 1회 → `["shop", 7, "customers"]` 접두사 무효화로 목록 다시 요청 → 토스트 "고객을 등록했어요.". 수정: 대화상자에 기존 값 네 개가 채워져 열리고, 메모를 "뒷머리 정리"로 바꿔 저장하면 `PUT /phonebooks/3` 본문 `{"name":"김민지","phone_number":"010-1234-5678","group_name":"VIP","memo":"뒷머리 정리"}` 1회 → 같은 무효화 → 토스트 "고객 정보를 고쳤어요."
- **And** (다) 409이면 전화번호 필드에 "이미 등록된 전화번호예요."가 보이고 포커스가 그 입력으로 가며 대화상자가 열려 있다
- **And** (라) 삭제 확인 제목은 "‘김민지’ 고객을 삭제할까요?", 단추는 "닫기"·"삭제"(destructive)이고, "닫기"면 `DELETE` 0회, "삭제"면 `DELETE /phonebooks/3` 1회 뒤 토스트 "고객을 삭제했어요."와 목록 다시 불러오기
- **검증**: `npx vitest run src/features/customers`(M5)

#### AC-UI-002-19 — 고객 CSV 내보내기 (maps REQ-UI-002-019)

- **Given** 검색어 없음, `size=100`에 `pages: 3`(총 250명)을 주는 처리기, §3.5의 표본 고객, 오늘 2026-11-09T10:00:00+09:00, `URL.createObjectURL`·`revokeObjectURL` 대역, 다른 시험에서 `pages: 25`를 주는 처리기
- **When** "CSV 내보내기"를 누른다
- **Then** 내보내는 동안 버튼이 `loading`이고, `GET /phonebooks`가 `page=1`·`2`·`3`(`size=100`)으로 가며, 내려받기 링크 이름이 `고객목록_2026-11-09.csv`다
- **And** 파일 내용이 BOM(`U+FEFF`)으로 시작하고 머리 행 `이름,연락처,그룹,메모,등록일` + 250행이며 줄 끝이 모두 CRLF이고, 표본 행이 §3.5 기대값과 같다
- **And** `pages: 25`이면 상한 없이 25번 요청한다(EC-36). `revokeObjectURL`이 `createObjectURL`이 돌려준 URL로 1회 불리고, `file-saver`를 가져오는 코드가 없다(QG-12)
- **검증**: `npx vitest run src/lib/csv.test.ts src/features/customers/export-csv.test.ts`(M5)

#### AC-UI-002-20 — 시술 메뉴와 세부 항목 (maps REQ-UI-002-020, REQ-UI-002-022)

- **Given** 매장 7, 메뉴 "커트"(id 1, 세부 "남성 커트" id 11, 30분 15000원), "펌"(id 2, 세부 "디지털 펌" id 21, 120분 120000원)
- **When** "펌" 행의 "세부 항목 보기"를 누르고, 세부 항목을 이름 "열펌"·60분·가격 0으로 저장했다가 가격 1로 저장하고, "디지털 펌"을 150분·130000원으로 고치고, "디지털 펌"을 삭제 확인 뒤 삭제하고, 이름 "염색"으로 메뉴를 만들고, 이름 "커트"로 메뉴를 만들어 409를 받고, "펌"의 이름을 "볼륨 펌"으로 고치고, "커트"를 삭제 확인 뒤 삭제한다
- **Then** URL이 `/treatment-menus?menu=2`이고 "펌"의 세부 항목 표가 보이며, 가격 0은 요청 없이 "1 이상 입력해 주세요." 필드 오류, 가격 1은 `POST /treatment-menus/2/details` 본문 `{"name":"열펌","duration_min":60,"base_price":1}` 1회 → `["shop", 7, "menus"]` 접두사 무효화 → 토스트 "세부 항목을 추가했어요."
- **And** (가) 세부 수정은 `PUT /treatment-menus/2/details/21` 본문 `{"name":"디지털 펌","duration_min":150,"base_price":130000}`(전체 필드) 1회 → 무효화 → "세부 항목을 고쳤어요.". 세부 삭제 확인 제목은 "‘디지털 펌’ 세부 항목을 삭제할까요?"이고 확인 뒤 `DELETE /treatment-menus/2/details/21` 1회 → "세부 항목을 삭제했어요."
- **And** (나) 메뉴 추가는 `POST /treatment-menus` 본문 `{"name":"염색"}` 1회 → 무효화 → "메뉴를 추가했어요.", 메뉴 수정은 `PUT /treatment-menus/2` 본문 `{"name":"볼륨 펌"}` 1회 → "메뉴 이름을 고쳤어요.", 메뉴 삭제 확인 제목은 "‘커트’ 메뉴를 삭제할까요?"이고 확인 뒤 `DELETE /treatment-menus/1` 1회 → "메뉴를 삭제했어요."
- **And** (다) 409는 이름 필드에 "이미 있는 메뉴 이름이에요."와 포커스, 소요 시간 0도 "1 이상 입력해 주세요." 필드 오류다
- **검증**: `npx vitest run src/features/treatment-menus`(M6)

#### AC-UI-002-21 — 시술 이력 (maps REQ-UI-002-021, REQ-UI-002-009)

- **Given** 2026-11-09T10:00:00+09:00에 멈춘 가짜 시계, 자동 진행 없는 가짜 타이머, 상태 5종과 항목 가격이 든 예약 응답(한 행의 항목 가격 30000 + 15000, `pages: 2`), 응답 지연 200ms
- **When** 이력 화면을 열고, 상태 필터 "방문함"을 고르고(첫 응답 전), 기간을 2026-11-03~2026-11-05로 바꾸고, 예약 일시 머리글을 두 번 누르고, 검색어 "김"을 치고 300ms를 흘리고, 2쪽으로 넘기고, 그 URL로 다시 그린다
- **Then** 첫 요청 매개변수가 `start_date=2026-11-01&end_date=2026-11-30&sort_by=reserved_at&sort_order=desc&page=1&size=20`이고 머리글 `aria-sort`가 `descending`이다
- **And** 상태 → 요청 `status=VISITED&page=1`·URL `status=VISITED`, 기간 → `start_date=2026-11-03&end_date=2026-11-05`·URL `from=2026-11-03&to=2026-11-05`, 머리글 첫 번째 → `sort_order=asc`·URL `order=asc`·`aria-sort="ascending"`, 두 번째 → `sort_order=desc`·URL에서 `order` 빠짐(정렬 없음 상태는 쓰지 않는다), 검색 → `search=김&page=1`·URL `q=김`, 2쪽 → `page=2`·URL `page=2`이고, 다시 그리면 같은 요청이 간다
- **And** 상태 필터를 바꿀 때 첫 요청의 signal이 취소되고 취소 오류가 화면에 보이지 않는다. 필터 선택지(전체 + 5종)가 `STATUS_ORDER`에서 만들어진다
- **And** 행마다 StatusBadge와 같은 상태의 레일이 있고, 금액 칸이 "45,000원", 오른쪽 정렬, `tabular-nums`다. 달 경계는 EC-33으로 확인한다
- **검증**: `npx vitest run src/features/treatments`(M6)

#### AC-UI-002-22 — 폼 검증 시점·첫 오류 포커스·숫자 입력 (maps REQ-UI-002-022)

- **Given** 예약 등록 대화상자(고객·일시·항목 필수), 422 처리기 `{"detail":[{"loc":["body","treatment_items",0,"base_price"],"msg":"Input should be greater than or equal to 0","type":"greater_than_equal"}]}`
- **When** (가) 고객 칸에 글자를 쳤다 지우되 칸을 떠나지 않고, (나) 빈 채로 제출하고, (다) 고객을 고르고, (라) 나머지를 채워 제출해 422를 받고, (마) 가격 칸에 `1234567`을 치고, (바) 가격 칸에 `₩12,000`을 붙여넣고, (사) 가격 칸을 비운다
- **Then** (가) 오류 문구가 보이지 않는다. (나) 요청 0회, 필수 오류가 보이고 포커스가 등록 순서상 첫 오류 필드(고객)에 간다. (다) 고객 오류가 그 자리에서 사라진다
- **And** (라) 첫 항목 가격 필드에 앱 문구 "0 이상 입력해 주세요."(§3.2)가 보이고 `aria-invalid="true"`, 포커스가 그 입력에 간다. (마) 표시 `1,234,567`, 폼 값 `1234567`. (바) 폼 값 `12000`. (사) 폼 값 `null`
- **And** 폼 단위 시험: `src/lib/form.ts` 단위 시험(M4)이 같은 시점 규칙(처음 숨김 → 떠남·제출 뒤 표시 → 이후 바뀔 때마다 재검사)과 "필드별 앱 문구가 없으면 백엔드 `msg`" 규칙을 독립적으로 확인한다. (마)~(사)의 입력 동작은 M3의 NumberInput 시험이 먼저 확인한다
- **검증**: `npx vitest run src/ui-core/number-input.test.tsx`(M3), `npx vitest run src/lib/form.test.ts`(M4), `npx vitest run src/features/reservations/ReservationFormModal.test.tsx`(M7)

### 모듈 5 — 품질·보안·배포

#### AC-UI-002-23 — ui-core 후속 과제와 새 컴포넌트 (maps REQ-UI-002-023)

- **Given** M3 시작 때 기록한 기존 시험 목록(`npx vitest run --reporter=json --outputFile=<증거>/m3-baseline.json`, SPEC-UI-001 마지막 기록은 시험 파일 38개·시험 551개였고 M1·M2 시험이 더해진다)과, M3 동안 의도적으로 바꾼 시험의 이름 목록(`<증거>/m3-intentional-changes.txt`, 한 줄에 하나. 각 줄은 §4.1 AC-23 비교 스크립트가 만드는 키와 같은 `<저장소 루트 기준 시험 파일 경로> > <fullName>` 형식이다 — 경로는 `src/ui-core/modal.test.tsx`처럼 루트 기준 상대 경로, `fullName`은 `m3-baseline.json`의 `assertionResults[].fullName`을 글자 그대로 옮긴 값이며, 예: `src/ui-core/modal.test.tsx > <m3-baseline.json의 fullName 그대로>`. 줄 앞뒤 공백과 빈 줄은 비교 때 무시한다. 대상 — 클래스 문자열 단언을 결과 클래스 단언으로 바꾼 곳, 잠금 수 40/29 → 44/33, `Modal` 크기 값 등)
- **When** ui-core 전체 시험, 결함 재현 시험, design-rules 잠금 시험, 미리보기 전시 시험을 실행하고, M3 마지막 커밋에서 전체 시험을 JSON으로 다시 기록해 §4.1 AC-23 블록으로 비교한다
- **Then** 기준선의 모든 시험이 통과했거나 의도 변경 목록에 있다(비교 명령 종료 코드 0). 목록의 시험은 바꾼 이유가 진행 기록에 있다
- **And** (가) §3.10 후속 과제 표의 항목별 증거가 모두 맞는다(결함 재현 1·2·4는 고치기 전 실패 출력을 함께 남긴다)
- **And** (나) `@/ui-core`의 런타임 공개 이름이 §3.6의 44개와 정확히 같고 컴포넌트 파일이 33개이며, `Modal`의 크기 값에 `"md"`가 없고 `"default"`가 있다
- **And** (다) 새 컴포넌트 4개가 §3.10 키보드 계약 표대로 동작하고 axe 위반이 0건이며, 미리보기 전시 항목이 33개 컴포넌트를 덮는다(QG-15)
- **검증**:

```bash
npx vitest run src/ui-core src/test/design-rules.test.ts src/preview/PreviewPage.test.tsx
# 기준선 비교는 §4.1 AC-23 블록
```

#### AC-UI-002-24 — 운영 빌드 CSP (maps REQ-UI-002-024)

- **Given** `VITE_API_BASE_URL=https://api-beauty.dongri.kr`로 만든 `dist/index.html`, 인라인 스크립트 2개가 든 고정 HTML 표본, 인라인 스크립트 0개 표본, 개발 모드 변환 결과
- **When** §4.1 QG-17 블록과 `src/test/vite-plugins.test.ts`의 CSP 사례(API 주소 `https://api-beauty.dongri.kr`와 `https://api.test:8443/v1/`)를 실행한다
- **Then** `<meta http-equiv="Content-Security-Policy">`가 `<meta charset>` 바로 다음 요소이고 모든 인라인 `<script>`보다 앞에 있으며, 정책이 §3.8 정책과 같고, `script-src`가 `'self'`와 인라인 스크립트마다의 `'sha256-…'`(실제 내용으로 다시 계산한 값과 같음)만 담고 `'unsafe-inline'`이 없다
- **And** (가) 운영 빌드의 `connect-src`가 `'self' https://api-beauty.dongri.kr`이고 `check:dist`가 같은 env 값과 비교한다. `https://api.test:8443/v1/`이면 `connect-src 'self' https://api.test:8443`이다(EC-34). 고정 표본은 해시 2개, 스크립트 내용을 한 글자 바꾸면 해시가 바뀌며, 인라인 스크립트 0개 표본은 `script-src 'self'`만 남는다(EC-25)
- **And** (나) 개발 모드 변환 결과에는 CSP meta가 없다
- **검증**:

```bash
npx vitest run src/test/vite-plugins.test.ts
# 빌드와 check:dist는 §4.1 QG-17 블록
```

#### AC-UI-002-25 — `deploy.sh` 운영 모드 빌드·안전한 읽기·가드 제거 (maps REQ-UI-002-025)

- **Given** `src/test/deploy-script.test.ts`(node 환경 — M8의 읽기 커밋에서 `deploy-guard.test.ts`를 이 이름으로 바꾼 파일)가 임시 디렉터리에 **작업 트리의** `deploy.sh`를 복사하고 다음을 둔다
  - 더미 `.env.production`(CRLF 줄 포함): `SCP_USER=tester`, `SCP_HOST="example.invalid"`, `SCP_DIR='/srv/none'`, `SCP_PORT=2222`, `VITE_API_BASE_URL=https://api.test`, `EVIL=1`, `# 주석`, 빈 줄, 내장 명령만 쓰는 주입 표본 `SCP_USER2=$(: > pwned)`, `` X=`echo x > pwned2` ``. 두 번째·세 번째 표본 파일은 첫 번째 표본에서 `SCP_DIR` 줄만 바꾼 것이다 — 두 번째는 값 안의 주입 표본 `SCP_DIR=/srv/$(: > pwned3)`, 세 번째는 `SCP_DIR='/srv/a b'`. 표본마다 새 임시 디렉터리에서 실행한다
  - PATH에는 대역 디렉터리만 둔다. 그래서 `deploy.sh`는 bash 내장 명령과 `npm`·`scp`만 쓴다(그 밖의 바깥 명령 — `tr`·`sed`·`dirname` 등 — 은 이 PATH에서 찾을 수 없다). 대역 `npm`·`scp`는 받은 인자를 `printf '%s\n' "$@"`로 한 줄에 하나씩 기록 파일에 적고 호출 사이에 구분 줄을 넣으며 종료 코드 0이다
  - 대역 `npm`은 인자를 기록한 뒤 고정 산출물 `dist/index.html`·`dist/assets/a.js`를 만든다(대역 안에서는 `/bin/mkdir`처럼 절대 경로를 쓴다 — PATH 제한은 `deploy.sh`에만 걸린다). 임시 디렉터리에 `dist/`를 미리 두지 않는다
  - 대조 사본: 같은 디렉터리의 `source-control.sh`가 `set -a; . ./.env.production; set +a`만 실행한다
- **When** 가드를 지운 뒤에는 `ALLOW_PREVIEW_ONLY_DEPLOY` 없이, 지우기 전 M8 커밋에서는 `ALLOW_PREVIEW_ONLY_DEPLOY=1`을 주고 `bash deploy.sh`를 실행하고, 필수 값 4개를 하나씩 비운 표 4행, 파일 없음, `SCP_PORT=22a`, `SCP_HOST=-oProxyCommand=x`로도 실행하고, 대조 사본을 실행한다
- **Then** 정상 실행에서 표시 파일 `pwned`·`pwned2`·`pwned3`가 생기지 않고, 대역 `npm`이 인자 `run`·`build`·`--`·`--mode`·`production`으로 1회, 대역 `scp`가 인자 `-P`·`2222`·`-r`·`./dist/assets`·`./dist/index.html`·`tester@example.invalid:/srv/none`(이 순서, 한 줄에 하나)으로 1회 불리며 종료 코드 0이다. `npm` 호출 기록이 `scp` 호출 기록보다 앞이다. 두 번째 표본에서는 마지막 인자가 글자 그대로 `tester@example.invalid:/srv/$(: > pwned3)`, 세 번째 표본에서는 하나의 인자 `tester@example.invalid:/srv/a b`다(EC-37)
- **And** (가) 빈 필수 값 4행·파일 없음·숫자가 아닌 포트·`-`로 시작하는 값은 대역 호출 기록이 비고 종료 코드가 0이 아니며 출력에 원인 변수 이름(또는 파일 이름)이 있다(EC-39). 같은 이름이 두 번이면 마지막 값을 쓰고, `export SCP_USER=…` 줄은 허용 이름이 아니라 건너뛴다(EC-38)
- **And** (나) 대조 사본을 표본마다 그 표본의 임시 디렉터리에서 따로 실행한다. 첫 번째 표본에서는 `pwned`·`pwned2`가 생기고 `pwned3`는 없다. 두 번째 표본에서는 `pwned`·`pwned2`·`pwned3`가 모두 생긴다(이 대역 환경에서 표본이 실제로 동작함을 보이는 양성 대조. 세 번째 표본은 대조하지 않는다)
- **And** (다) 주석 줄을 뺀 `deploy.sh`에 `ALLOW_PREVIEW_ONLY_DEPLOY`, `.env.stage`, `--mode stage`, `eval`, 줄 머리 `. ` 또는 `source `가 없다(§4.1 QG-13 블록, "출력 없음"). `git log -S ALLOW_PREVIEW_ONLY_DEPLOY -- deploy.sh`가 보여 주는 가장 최근 커밋이 M8의 마지막 run 단계 커밋이고(여기서 "M8의 마지막 run 단계 커밋"은 run 단계 커밋 가운데 `.moai/` 밖의 파일을 바꾸는 마지막 커밋이다. 그 뒤의 `.moai/specs/SPEC-UI-002/progress.md`만 바꾸는 진행 기록 커밋 — §E.2·§E.3 기록, run_commit_sha 채우기, 오케스트레이터 재검증 기록 — 은 세지 않는다, spec.md C6), 그 부모 커밋에서 가드가 있는 상태의 QG-13 시험이 통과한 기록이 진행 기록에 있다
- **안전**: 실제 `npm`·`scp`는 실행하지 않는다. 저장소 작업 트리에서 `deploy.sh`를 실행하지 않는다
- **검증**:

```bash
npx vitest run src/test/deploy-script.test.ts
# 주석 제외 검사와 커밋 확인은 §4.1 QG-13 블록
```

## 3. 기대값 표

### 3.1 예약 상태와 전환(정본)

**상태 표**(system.md §9를 1.2.0에서 이 순서와 글자로 확정한다)

| 순서 | 키 | 라벨 | 아이콘(lucide 정식 이름) | 토큰 접두사 | 뜻(툴팁·범례 보조 문구) |
|---|---|---|---|---|---|
| 1 | `RESERVED` | 예약됨 | `CalendarClock` | `status-reserved` | 예약이 잡혀 있어요. |
| 2 | `VISITED` | 방문함 | `DoorOpen` | `status-visited` | 손님이 와서 시술 중이에요. |
| 3 | `COMPLETED` | 완료 | `CircleCheck` | `status-completed` | 시술이 끝났어요. 소요 시간이 지나면 자동으로 바뀌어요. |
| 4 | `CANCELLED` | 취소됨 | `Ban` | `status-cancelled` | 예약이 취소됐어요. |
| 5 | `NO_SHOW` | 노쇼 | `UserX` | `status-no-show` | 손님이 오지 않았어요. |

**캘린더 일정의 상태 표시**(결정 15, system.md §9 "아이콘 + 라벨 필수" 규칙의 예외)

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

### 3.2 오류 정규화와 화면 문구(정본)

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
- **재시도 규칙**: 쿼리는 `kind`가 `http`이고 `status`가 400~499이거나 `aborted`면 0회, 500 이상이거나 `network`면 최대 2회. 변경은 0회. 401 뒤 갱신 후 한 번 재전송(REQ-UI-002-006)은 이 규칙 밖이다.
- **이메일 형식 규칙**: 앞뒤 공백을 자른 값이 정규식 `^[^\s@]+@[^\s@]+\.[^\s@]+$`에 맞으면 형식이 맞다. `abc`는 틀리고 `a@b.co`는 맞다.

**필드별 앱 문구**

| 필드 | 조건 | 문구 |
|---|---|---|
| 로그인 이메일·비밀번호 | 빈 값 | 이메일을 입력해 주세요. / 비밀번호를 입력해 주세요. |
| 로그인 이메일 | 형식 | 이메일 형식을 확인해 주세요. |
| 고객 전화번호 | 409 | 이미 등록된 전화번호예요. |
| 메뉴 이름 | 409 | 이미 있는 메뉴 이름이에요. |
| 세부 항목 소요 시간·가격 | 1 미만 | 1 이상 입력해 주세요. |
| 예약 항목 가격·소요 시간 | 0 미만, 또는 422 `greater_than_equal` | 0 이상 입력해 주세요. |
| 필수 필드(고객·일시·항목 등) | 빈 값 | <필드 라벨>을(를) 입력해 주세요. — 받침에 따라 "을"·"를"을 고른다(예: "고객을 입력해 주세요.", "일시를 입력해 주세요.") |

**화면별 문구**

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

### 3.3 경로 표(정본)

| 상태 | 연 경로 | 결과 경로 | 보이는 h1 |
|---|---|---|---|
| S0 | `/customers` | `/login?next=%2Fcustomers` | 로그인 |
| S0 | `/shops` | `/login?next=%2Fshops` | 로그인 |
| S0 | `/` | `/login?next=%2F` | 로그인 |
| S0 | `/terms-of-service` | 그대로 | 이용약관 |
| S0 | `/privacy-policy` | 그대로 | 개인정보처리방침 |
| S1 | `/reservations` | `/shops?next=%2Freservations` | 매장 선택 |
| S1 | `/shops` | 그대로 | 매장 선택 |
| S2 | `/` | `/reservations` | 예약 캘린더 |
| S2 | `/login` | `/reservations` | 예약 캘린더 |
| S2 | `/customers` | 그대로 | 고객 |
| S2 | `/treatment-menus` | 그대로 | 시술 메뉴 |
| S2 | `/treatments` | 그대로 | 시술 이력 |
| 아무 상태 | `/no-such-page` | 그대로 | 찾을 수 없는 페이지예요. |
| 아무 상태 | `/manager/treatments` | 그대로 | 찾을 수 없는 페이지예요. |
| 개발 경로 목록 | `/dev/preview` | 그대로 | 컴포넌트 미리보기 |
| 빈 개발 경로 목록(운영) | `/dev/preview` | 그대로 | 찾을 수 없는 페이지예요. |

**`next` 규칙**(세 사용처 — 로그인 화면 loader, 로그인 제출, 매장 선택 — 가 같은 함수 `safeNext`를 쓴다)

1. 입력은 쿼리 문자열을 `URLSearchParams`로 읽은 값이다(한 번 디코딩). 이 값을 더 디코딩하지 않는다.
2. 값이 비었거나, `\`를 담거나, C0 제어 문자(U+0000~U+001F)나 공백 문자(정규식 `\s`에 맞는 글자)를 담으면 버린다.
3. `new URL(값, location.origin).origin`이 `location.origin`과 다르면 버린다(해석 오류도 버림).
4. `/`로 시작하지 않거나 `//`로 시작하면 버린다.
5. 통과한 값은 그대로 이동에 쓴다. 버린 값이나 `next`가 없으면 `/reservations`로 간다.

**`next` 표본 표**(AC-09의 두 사용처와 AC-12가 모두 쓴다)

| `?next=` 뒤의 쿼리 원문 | 한 번 디코딩한 값 | 판정 | 이동 |
|---|---|---|---|
| (매개변수 없음) | — | — | `/reservations` |
| (빈 값) | (빈 문자열) | 거부(빈 값) | `/reservations` |
| `%2Fcustomers` | `/customers` | 허용 | `/customers` |
| `%2Fcustomers%3Fq%3D%EA%B9%80` | `/customers?q=김` | 허용 | `/customers?q=김` |
| `customers` | `customers` | 거부(`/`로 시작하지 않음) | `/reservations` |
| `%2F%2Fevil.example` | `//evil.example` | 거부(`//`) | `/reservations` |
| `https%3A%2F%2Fevil.example` | `https://evil.example` | 거부(출처 다름) | `/reservations` |
| `javascript%3Aalert(1)` | `javascript:alert(1)` | 거부(출처 다름) | `/reservations` |
| `/\evil.example` | `/\evil.example` | 거부(`\`) | `/reservations` |
| `/%5Cevil.example` | `/\evil.example` | 거부(`\`) | `/reservations` |
| `/%09/evil.example` | `/`(TAB)`/evil.example` | 거부(C0) | `/reservations` |
| `/%0A/evil.example` | `/`(LF)`/evil.example` | 거부(C0) | `/reservations` |
| `/%20/evil.example` | `/ /evil.example` | 거부(공백) | `/reservations` |

### 3.4 의존성 고정 목록(정본)

`dependencies`(25)

| 패키지 | 버전 | 패키지 | 버전 |
|---|---|---|---|
| `@fontsource-variable/noto-sans-kr` | 5.3.1 | `@tanstack/react-query` | 5.107.1 |
| `@fullcalendar/react` | 7.1.4 | `class-variance-authority` | 0.7.1 |
| `@radix-ui/react-alert-dialog` | 1.2.1 | `clsx` | 2.1.1 |
| `@radix-ui/react-checkbox` | 1.4.1 | `cmdk` | 1.1.1 |
| `@radix-ui/react-dialog` | 1.3.1 | `date-fns` | 4.4.0 |
| `@radix-ui/react-popover` | 1.3.1 | `lucide-react` | 1.64.0 |
| `@radix-ui/react-select` | 2.4.1 | `openapi-fetch` | 0.17.0 |
| `@radix-ui/react-slot` | 1.5.0 | `react` | 19.3.1 |
| `@radix-ui/react-tabs` | 1.2.1 | `react-day-picker` | 10.0.2 |
| `@radix-ui/react-toast` | 1.3.1 | `react-dom` | 19.3.1 |
| `@radix-ui/react-toggle-group` | 1.2.1 | `react-router` | 8.5.1 |
| `@radix-ui/react-tooltip` | 1.4.1 | `tailwind-merge` | 3.7.0 |
| | | `temporal-polyfill` | 1.0.8 |

`devDependencies`(19)

| 패키지 | 버전 | 패키지 | 버전 |
|---|---|---|---|
| `@biomejs/biome` | 2.6.4 | `@vitest/coverage-v8` | 5.0.5 |
| `@tailwindcss/vite` | 4.3.3 | `axe-core` | 4.14.0 |
| `@testing-library/dom` | 10.4.2 | `jsdom` | 29.1.1 |
| `@testing-library/jest-dom` | 7.0.1 | `msw` | 3.0.4 |
| `@testing-library/react` | 16.3.3 | `openapi-typescript` | 7.13.0 |
| `@testing-library/user-event` | 14.6.8 | `tailwindcss` | 4.3.3 |
| `@types/node` | 24.19.2 | `typescript` | 5.9.3 |
| `@types/react` | 19.3.0 | `vite` | 8.3.5 |
| `@types/react-dom` | 19.3.0 | `vitest` | 5.0.5 |
| `@vitejs/plugin-react` | 6.1.2 | | |

- 새로 들어간 것은 `dependencies`의 `@fullcalendar/react`·`@tanstack/react-query`·`openapi-fetch`·`react-router`·`temporal-polyfill`과 `devDependencies`의 `msw`·`openapi-typescript`다. 나머지는 SPEC-UI-001 목록 그대로다.
- 이 표의 어느 패키지든 이전 메이저 줄(react-router 7, FullCalendar 6, MSW 2)로 바꾸는 일은 C5에 따라 blocker다. 작업을 멈추고 보고하며, 사용자 승인 뒤 manager-spec이 REQ-UI-002-001, 이 표, QG-12, plan.md §E E-3을 함께 개정해야 이어 갈 수 있다. plan.md §C의 이전 줄 버전은 참고 정보다.
- QG-12의 판정 범위는 `package.json`의 키와 `src`의 모듈 지정자다. `package-lock.json`에 하위 의존성으로 들어오는 패키지(예: `@fullcalendar/react` 7이 내부에서 쓰는 패키지)는 판정하지 않는다.

### 3.5 CSV 기대값(정본)

- 파일 시작: BOM `U+FEFF`. 머리 행: `이름,연락처,그룹,메모,등록일`. 줄 끝: CRLF(마지막 행 뒤 포함).
- 등록일: `created_at`을 KST 날짜(`YYYY-MM-DD`)로 바꾼다. `2026-11-08T16:30:00Z` → `2026-11-09`.
- 빈 값(`null`)은 빈 칸이다.
- 범위: 현재 검색에 맞는 고객 전부. 쪽 수 상한은 없다(첫 응답의 `pages`만큼 `size=100`으로 요청).

| 표본 필드 값 | CSV 칸 |
|---|---|
| 이름 `김,민지` | `"김,민지"` |
| 메모 `그는 "VIP"` | `"그는 ""VIP"""` |
| 메모 `첫 줄`(LF)`둘째 줄` | `"첫 줄`(LF)`둘째 줄"` |
| 이름 `=SUM(1)` | `'=SUM(1)` |
| 메모 `-3` | `'-3` |
| 연락처 `+82` | `'+82` |
| 그룹 `@a` | `'@a` |
| 메모 `=1,2` | `"'=1,2"` |
| 메모 (탭)`x` | `'`(탭)`x` |
| 메모 (CR)`=1` | `"'`(CR)`=1"` |
| 메모 ` =1`(앞 공백) | ` =1` |
| 메모 `＝1`(전각 등호) | `＝1` |
| 그룹 `null` | (빈 칸) |
| 이름 `박서연` | `박서연` |

- 수식 주입 방지 대상: `=`, `+`, `-`, `@`, 탭, CR로 시작하는 값. `'`를 먼저 붙이고 그다음 RFC 4180 따옴표 규칙(쉼표·큰따옴표·CR·LF가 있으면 감쌈)을 적용한다.
- 정한 정책: 앞에 공백이 있는 값과 전각 등호(`＝`)로 시작하는 값은 바꾸지 않는다. 스프레드시트가 수식으로 읽는 첫 글자는 위 여섯 가지로 본다 **(추론 — OWASP CSV Injection 권고의 대상 목록 기준)**.

### 3.6 ui-core 공개 이름 44개(정본, 정렬 순서)

`Alert`, `Badge`, `Breadcrumb`, `Button`, `Calendar`, `Card`, `CardContent`, `CardDescription`, `CardFooter`, `CardHeader`, `CardTitle`, `Checkbox`, `Combobox`, `ConfirmDialog`, `ConfirmDialogHost`, `DateRangePicker`, `DateTimePicker`, `Drawer`, `EmptyState`, `Field`, `Filter`, `Input`, `Loading`, `Modal`, `NumberInput`, `PageHeader`, `Pagination`, `Popover`, `Search`, `Select`, `Sidebar`, `Skeleton`, `SkeletonGroup`, `Table`, `Tabs`, `Textarea`, `ThemeProvider`, `ThemeToggle`, `Toaster`, `Tooltip`, `cn`, `showConfirm`, `toast`, `useTheme`

- 새 이름: `DateRangePicker`, `Drawer`, `NumberInput`, `Popover`. 새 타입 `DateRange`는 타입 전용이라 런타임 이름에 들지 않는다.
- 컴포넌트 파일 33개 = SPEC-UI-001의 29개 + `date-range-picker.tsx`, `number-input.tsx`, `drawer.tsx`, `popover.tsx`. 기반 라이브러리 표에 `drawer.tsx` → `@radix-ui/react-dialog`, `popover.tsx`·`date-range-picker.tsx` → `@radix-ui/react-popover`를 더한다.

### 3.7 경계 사례

인수 기준을 늘리지 않고, 해당 인수 기준의 시험 파일 안에서 함께 확인한다.

| ID | 속한 AC | 경계 사례 | 기대 결과 |
|---|---|---|---|
| EC-01 | AC-UI-002-06 | 갱신이 진행 중일 때 네 번째 401이 온다 | 같은 갱신을 기다리고 갱신 요청은 여전히 1회 |
| EC-02 | AC-UI-002-06 | 본문이 있는 `POST` 요청이 401 뒤 재시도된다 | 재시도 본문이 원래 본문과 같다(본문 소실 없음) |
| EC-03 | AC-UI-002-06 | `navigator.locks`가 없는 환경 | 탭 잠금 없이 같은 single-flight 동작, 예외 없음 |
| EC-04 | AC-UI-002-05 | 로그인 응답 본문에 `refresh_token`만 있고 `access_token`이 없다 | 로그인 실패로 처리하고 세션을 만들지 않음 |
| EC-05 | AC-UI-002-09 | `next=%2F%2Fevil.example`(인코딩된 `//`) | §3.3 표본 표대로 거부하고 `/reservations` |
| EC-06 | AC-UI-002-09 | S0에서 갱신이 네트워크 오류 | 로그인 화면이 아니라 경로 오류 화면("다시 시도")이 보임 |
| EC-07 | AC-UI-002-10 | `localStorage` 접근이 예외를 던진다 | 1024px 이상에서 펼침으로 시작, 예외가 새지 않음 |
| EC-08 | AC-UI-002-10 | 1280px에서 접은 뒤 900px로 바꾸고 다시 1280px | 900px에서 접힘, 1280px로 돌아오면 저장값(`collapsed`)을 따름 |
| EC-09 | AC-UI-002-08 | 봉투 모양이 아닌 JSON(`{"error":"x"}`) 404 | `code` 없음, 404 문구 "찾는 정보가 없어요." |
| EC-10 | AC-UI-002-08 | 422 `loc`이 `["query","page"]` | 키 `query.page` — `body`가 아니면 접두사를 남김 |
| EC-11 | AC-UI-002-16 | 범위 응답 `pages: 0`(예약 없음) | 요청 1회, 일정 0개, 경고 없음 |
| EC-12 | AC-UI-002-16 | 쪽 반복 중 2쪽이 500 | 앞쪽 결과를 버리고 오류 Alert + "다시 시도", 부분 결과를 보이지 않음 |
| EC-13 | AC-UI-002-16 | 월 보기의 보이는 범위 끝이 2026-12-07 00:00(KST, 배타)이고 2026-11-30 23:30(KST) 시작 예약이 있다 | 요청 `end_date=2026-12-06`, 예약은 11월 30일 칸에 그려짐(주 시작 요일 설정과 상관없이 범위 함수 입력으로 판정) |
| EC-14 | AC-UI-002-17 | 항목 목록에서 항목을 지웠다가 같은 항목을 다시 넣는다 / 항목을 하나 더한다 | 배열이 원래와 같으면(순서·값) `treatment_items`를 빼고, 다르면 기존 항목은 `id`를 담고 새 항목은 `id` 없이 전체 배열을 보냄 |
| EC-15 | AC-UI-002-17 | 고객을 전화번호부에서 고른다 | 본문에 `phonebook_id`가 있고 `customer_name`·`customer_phone`이 없음 |
| EC-16 | AC-UI-002-18 | 검색어 앞뒤 공백(`" 김 "`) | 요청 `search=김`, URL `q=김` |
| EC-17 | AC-UI-002-18 | 2쪽에서 검색어를 바꾼다 | `page`가 1로 돌아가고 URL에서 `page`가 빠짐 |
| EC-18 | AC-UI-002-19 | 검색어가 있을 때 내보내기 | 모든 쪽 요청에 같은 `search`, 결과 0명이면 머리 행만 있는 파일 |
| EC-19 | AC-UI-002-19 | 내보내기 중 2쪽이 실패 | 파일을 만들지 않고 토스트 "고객 목록을 내보내지 못했어요. 다시 시도해 주세요.", `createObjectURL` 0회 |
| EC-20 | AC-UI-002-20 | 선택한 메뉴(`?menu=2`)를 삭제 | URL에서 `menu`가 빠지고 세부 표가 사라짐 |
| EC-21 | AC-UI-002-21 | URL `status=FOO`(없는 상태) | "전체"로 보고 `status` 매개변수를 보내지 않음 |
| EC-22 | AC-UI-002-21 | 기간 `from`이 `to`보다 뒤인 URL | 두 값을 바꿔 요청(`start_date` ≤ `end_date`) |
| EC-23 | AC-UI-002-22 | NumberInput에 `max`보다 큰 값을 친다 | 값을 몰래 줄이지 않고 범위 오류를 보임 |
| EC-24 | AC-UI-002-22 | NumberInput 가운데 숫자를 지운다(`1,234|,567`에서 Backspace) | 표시 `123,567`, 커서가 지운 자리에 남음 |
| EC-25 | AC-UI-002-24 | 인라인 스크립트가 0개인 HTML | `script-src 'self'`만 남고 해시 없음 |
| EC-26 | AC-UI-002-25 | `.env.production`의 값이 `"`로 열리고 닫히지 않는다(`SCP_HOST="a`) | 감싼 따옴표로 보지 않고 글자 그대로 `"a` |
| EC-27 | AC-UI-002-09, AC-UI-002-12 | `next=/\evil.example`(쿼리 원문에 역슬래시) | 거부, `/reservations` |
| EC-28 | AC-UI-002-09, AC-UI-002-12 | `next=/%5Cevil.example` | 디코딩한 `/\evil.example`을 거부, `/reservations` |
| EC-29 | AC-UI-002-09, AC-UI-002-12 | `next=/%09/evil.example` | TAB을 담아 거부, `/reservations` |
| EC-30 | AC-UI-002-09, AC-UI-002-12 | `next=/%0A/evil.example` | LF를 담아 거부, `/reservations` |
| EC-31 | AC-UI-002-06 | 갱신 응답이 429 | 세션 유지, 만료 처리 0회, 원래 요청이 `status` 429 오류(문구 "요청이 많아요. 잠시 뒤 다시 시도해 주세요.") |
| EC-32 | AC-UI-002-06 | 갱신 응답이 503 | 세션 유지, 만료 처리 0회, 원래 요청이 `status` 503 오류 |
| EC-33 | AC-UI-002-21 | 가짜 시계 2026-11-30T15:30:00Z(KST 12월 1일 00:30) | 첫 요청 `start_date=2026-12-01&end_date=2026-12-31` |
| EC-34 | AC-UI-002-24 | `VITE_API_BASE_URL=https://api.test:8443/v1/` | `connect-src 'self' https://api.test:8443`(경로·끝 빗금 없음, 포트 유지) |
| EC-35 | AC-UI-002-03 | `VITE_API_BASE_URL`이 `https://` 또는 `https://a b` | 해석 실패·빈 호스트로 보고 변수 이름을 담은 오류로 실패 |
| EC-36 | AC-UI-002-19 | 응답 `pages: 25`(고객 2,500명) | 상한 없이 `page=1`~`25` 25번 요청, 행 2,500개 |
| EC-37 | AC-UI-002-25 | `SCP_DIR='/srv/a b'` | 대역 `scp`의 마지막 인자가 하나의 인자 `tester@example.invalid:/srv/a b` |
| EC-38 | AC-UI-002-25 | `SCP_PORT=1` 다음 줄에 `SCP_PORT=2222`, 그리고 `export SCP_USER=x` 줄 | 마지막 값 2222를 쓰고(`-P 2222`), `export …` 줄은 건너뜀(`SCP_USER`는 `tester`) |
| EC-39 | AC-UI-002-25 | `SCP_HOST=-oProxyCommand=x` | 빌드 전에 멈춤, 출력에 `SCP_HOST`, 대역 호출 0회, 종료 코드 0이 아님 |
| EC-40 | AC-UI-002-10 | 폭 1024·1023·768·767px | 1024는 저장 구간, 1023·768은 비저장 접힘 구간, 767은 서랍 구간 |
| EC-41 | AC-UI-002-16 | 일 보기(`timeGridDay`)로 2026-11-10을 본다 | 요청 `start_date=2026-11-10&end_date=2026-11-10` |
| EC-42 | AC-UI-002-15 | 확인 대화상자에서 Esc | 대화상자가 닫히고 `PUT` 0회, 상태 그대로 |

### 3.8 운영 CSP 정책(정본)

빌드 플러그인이 넣는 meta 정책이다(REQ-UI-002-024가 이 정책을 그대로 요구한다). `<해시 목록>`은 빌드 때 최종 HTML의 인라인 스크립트마다 계산한 `'sha256-…'`이고, `<API 출처>`는 `new URL(VITE_API_BASE_URL).origin`이다.

```text
default-src 'self'; script-src 'self' <해시 목록>; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' <API 출처>; object-src 'none'; base-uri 'self'; form-action 'self'
```

- `frame-ancestors`는 meta로 줄 수 없어 배포 서버 헤더가 맡는다(plan.md §P-4, 범위 밖).
- `style-src`의 `'unsafe-inline'`은 Radix의 런타임 `<style>` 때문에 남긴다. 실제 브라우저의 위반 관찰(UR-2)과 엄격한 정책 실험(UR-3)은 SPEC 완료 뒤 항목이고, 완료 전에는 AC-24·QG-17의 빌드 산출물 정책 시험으로 대신한다(plan.md R2 잔여 위험).

### 3.9 약관·개인정보 문구(정본, 예전 앱 `28c87a9` 그대로)

문단은 공백 문자 연속을 공백 하나로 줄이고 앞뒤를 자른 값으로 비교한다. 예전 파일은 한 `<p>` 안의 `<br /><br />`로 문단을 나눴고, 새 화면은 문단마다 `<p>`를 쓴다. 문구 수정은 범위 밖이며 해요체 규칙의 예외다(C4).

| 문서 | 문단 | 글 |
|---|---|---|
| 이용약관 | 1 | 본 서비스는 무료로 제공되며, 누구나 이메일과 별명을 통해 회원 가입할 수 있습니다. |
| 이용약관 | 2 | 운영자는 서비스의 일부 또는 전부를 사전 통보 없이 변경하거나 종료할 수 있으며, 서비스 종료 시 사용자의 데이터는 파기 또는 요청 시 반환됩니다. |
| 이용약관 | 3 | 사용자는 언제든지 자신의 정보를 열람, 수정, 삭제할 수 있으며, 본 약관은 향후 필요에 따라 수정될 수 있습니다. |
| 개인정보처리방침 | 1 | 본 서비스는 회원가입 시 이메일(아이디), 별명 정보를 수집하며, 샵 등록 시 샵명, 주소, 전화번호, 사업자등록번호를 입력받습니다. 수집된 정보는 서비스 제공 및 사용자 확인 외의 목적으로 사용되지 않으며, 열람/수정/삭제는 언제든 가능합니다. |
| 개인정보처리방침 | 2 | 운영자는 서비스를 자유롭게 종료할 수 있으며, 종료 시 개인정보는 즉시 파기되거나 요청 시 반환됩니다. 쿠키는 인증용 리프레시 토큰에만 사용되며, 제3자 제공 및 위탁은 없습니다. |

### 3.10 ui-core 후속 과제 증거와 새 컴포넌트 키보드 계약(정본)

**후속 과제 15건의 항목별 증거**(번호는 SPEC-UI-001 `progress.md:591-615`). "M3 시작 기록"은 M3 첫 커밋 전에 grep으로 세어 진행 기록에 적는 값이다.

| # | 처리 | 증거(모두 통과해야 함) |
|---|---|---|
| 1 | Modal: `open`이 거짓이 되면 버리기 확인 상태 초기화 | 재현 시험: `dirty` Modal에서 버리기 확인을 띄운 채 부모가 `open=false` → `open=true`로 바꾸면 버리기 확인이 없다(고치기 전 실패 출력 보존) |
| 2 | DateTimePicker: 간격 밖 값을 옵션에 더해 보임 | 재현 시험: 값 14:10, 30분 간격에서 트리거가 "14:10", 시간 칸에 "14:10"이 선택되어 있고 `onValueChange` 호출 0회(고치기 전 실패 출력 보존) |
| 4 | 링크 스킴 허용 목록(`new URL(to, location.origin).protocol` 기준, 상대 경로와 `http:`·`https:`만) | 재현 시험: `javascript:alert(1)`, `JavaScript:alert(1)`, ` javascript:alert(1)`, `java`(TAB)`script:alert(1)`, `data:text/html,x`, `mailto:a@b.c`는 `href="#"`이고 개발 모드 경고가 각각 1번, `/customers`·`customers`·`https://example.com`·`http://example.com`은 그대로(고치기 전 실패 출력 보존) |
| 6 | Combobox `canCreate()` 도우미 | `grep -c 'canCreate' src/ui-core/combobox.tsx`가 1 이상, 기존 Combobox 시험 통과 |
| 7 | 포커스 링 상수 `src/ui-core/internal/class-names.ts` | M3 시작 기록의 포커스 링 클래스 문자열이 시험 파일 밖 ui-core에서 `internal/class-names.ts` 한 곳에만 남는다(`grep -rl --exclude='*.test.*' '<그 문자열>' src/ui-core`의 출력이 그 파일 하나). 시험은 렌더링 결과 클래스를 단언하고 기대값은 그대로 |
| 8 | 선택 상태 클래스 상수 | M3 시작 기록의 선택 상태 클래스 문자열이 같은 방식으로 `internal/class-names.ts` 한 곳에만 남는다 |
| 9 | `internal/external-store.ts`·`internal/use-restore-focus.ts` | 두 파일이 있고 `toast.tsx`·`confirm-dialog.tsx`가 이 파일을 가져온다(`grep -l 'internal/external-store' src/ui-core/toast.tsx src/ui-core/confirm-dialog.tsx`가 둘 다 출력). `@MX:WARN`이 `internal/external-store.ts`에 있고 옛 두 자리(`toast.tsx:40`, `confirm-dialog.tsx:153`)의 같은 경고는 옮겨졌다 |
| 10 | Search 병합 ref 메모 | `src/ui-core/search.tsx`의 병합 ref가 `useCallback` 또는 `useMemo` 안에서 만들어진다(코드 확인 + `grep -nE 'useCallback\|useMemo' src/ui-core/search.tsx` 1 이상), 다시 그려도 ref 콜백이 새 함수로 바뀌지 않는다는 시험 1개 |
| 11 | Pagination 맨 숫자를 이름 붙은 상수로 | M3 시작 기록의 맨 숫자 줄이 이름 붙은 상수 참조로 바뀐다(전후 줄을 진행 기록에 남김), 기존 Pagination 시험 통과 |
| 12 | `src/test/setup.ts`의 조건부 빈 `getContext` | `npm test` 출력에 "Not implemented: HTMLCanvasElement"가 없다 |
| 13 | Loading·Skeleton `cva` | `grep -c 'cva(' src/ui-core/loading.tsx src/ui-core/skeleton.tsx`가 두 파일 모두 1 이상, 기존 시험 통과 |
| 14 | 명령형 저장소 초기화를 `setup.ts`의 `act` 안으로 | `grep -c 'act(' src/test/setup.ts`가 1 이상, `npm test` 출력에 "not wrapped in act"가 없다 |
| 15 | `ToastTone = Exclude<Tone, "neutral">` | 타입 시험 `expectTypeOf<ToastTone>().toEqualTypeOf<Exclude<Tone, "neutral">>()`가 `npm run typecheck`와 시험에서 통과 |
| 16 | `Modal` `size="md"` → `size="default"` | `grep -rn 'size="md"' src --include='*.tsx'`가 "출력 없음"(§0), Modal 시험이 `"default"`를 단언하고 `"md"`를 타입 오류로 확인 |
| 17 | describe 제목 표지를 `AC-UI-001-06·AC-UI-001-14`로 풀어 씀 | `grep -rn 'AC-UI-001-06·AC-UI-001-14' src/preview/PreviewPage.test.tsx`가 1줄 이상 |

**새 컴포넌트 키보드 계약**(axe 위반 0건은 네 컴포넌트 공통)

| 컴포넌트 | 계약 |
|---|---|
| DateRangePicker | 트리거에서 Enter·Space로 열림 / 화살표 키로 날짜 포커스 이동(Calendar 계약) / Enter로 시작 날짜, 다시 Enter로 끝 날짜를 고르면 `onValueChange`가 `{ from, to }`로 1번 불리고 닫히며 포커스가 트리거로 돌아옴 / Esc는 값을 바꾸지 않고 닫고 포커스를 트리거로 돌림 / 시작·끝·사이 날짜에 색이 아닌 단서(`aria-selected`와 시작·끝을 알리는 접근 이름) |
| NumberInput | `inputMode="numeric"` / 숫자를 치면 천 단위 쉼표가 붙은 표시와 숫자 값 / 붙여넣기는 숫자만 남김 / 가운데 숫자를 지워도 커서가 그 자리에 남음(EC-24) / 위·아래 화살표로 값을 바꾸지 않음(숫자 스피너 없음) / 범위 밖 값은 줄이지 않고 오류로(EC-23) / 라벨과 `aria-invalid`·`aria-describedby` 연결 |
| Drawer | 열리면 포커스가 서랍 안으로 / Tab·Shift+Tab이 서랍 안에서만 돎(포커스 가두기) / Esc와 스크림 누르기로 닫힘 / 닫히면 연 트리거로 포커스가 돌아옴 / `role="dialog"`와 제목 / `prefers-reduced-motion: reduce`에서 이동 애니메이션 클래스가 없음 |
| Popover | 트리거에서 Enter·Space로 열림 / Esc로 닫히고 포커스가 트리거로 돌아옴 / 바깥을 누르면 닫힘 / 트리거에 `aria-expanded`·`aria-controls` |

### 3.11 매장 범위 쿼리 키(정본)

| 공장 | 키 |
|---|---|
| `qk.customers.list(7, { q: "", page: 1 })` | `["shop", 7, "customers", "list", { q: "", page: 1 }]` |
| `qk.customers.groups(7)` | `["shop", 7, "customers", "groups"]` |
| `qk.menus.list(7, { q: "", page: 1 })` | `["shop", 7, "menus", "list", { q: "", page: 1 }]` |
| `qk.menus.details(7, 2)` | `["shop", 7, "menus", 2, "details"]` |
| `qk.treatments.range(7, "2026-11-08", "2026-11-14")` | `["shop", 7, "treatments", "range", "2026-11-08", "2026-11-14"]` |
| `qk.treatments.list(7, { from: "2026-11-01", to: "2026-11-30", status: null, q: "", page: 1, order: "desc" })` | `["shop", 7, "treatments", "list", { from: "2026-11-01", to: "2026-11-30", status: null, q: "", page: 1, order: "desc" }]` |

- 매장 범위가 아닌 키: `["me"]`, `["shops", "list", { page }]`, `["shops", "selected"]`. `["shops", "selected"]`는 `refetchOnWindowFocus: "always"`로 둔다(REQ-UI-002-008).

## 4. 품질 게이트

각 게이트는 **적용 시점**부터 그 마일스톤의 모든 커밋에서 통과해야 한다. 적용 전 마일스톤에는 중간 조건을 쓴다. 마지막 판정은 M8의 마지막 run 단계 커밋(가드 제거 커밋 — `.moai/` 밖의 파일을 바꾸는 마지막 run 단계 커밋, spec.md C6)에서 QG-01~QG-18 전부다. 명령은 저장소 루트에서 실행한다. `.env`가 없는 임시 작업 트리에서는 빌드·`check:dist` 명령에 `VITE_API_BASE_URL`을 넘긴다(plan.md §B.10). 주 체크아웃의 로컬 `.env`에 다른 값이 있어도 명령 앞에 넘긴 환경 변수가 우선한다.

| ID | 확인 | 명령 | 통과 조건 | 적용 시점(중간 조건) |
|---|---|---|---|---|
| QG-01 | 타입 검사 | `npm run typecheck` | 종료 코드 0 | M1 |
| QG-02 | 린트·서식(Biome) | `npm run lint` | 종료 코드 0(생성 파일 `openapi/`·`src/api/schema.d.ts`는 제외 목록) | M1 |
| QG-03 | 시험 | `npm test` | 종료 코드 0, vitest 요약 줄이 보고한 `Duration` 값이 120초보다 짧음(`.moai/config/sections/gate.yaml` `timeouts.test: 120` — 벽시계 시간이 아니라 vitest가 보고한 값으로 판정). 같은 실행 직후의 `uptime` 출력을 그 값과 함께 기록한다. 여유 목표는 90초 이하이고, 90초를 넘으면 plan.md R12에 따라 통합 시험을 줄인다 | M1 |
| QG-04 | 빌드 | `VITE_API_BASE_URL=https://api-beauty.dongri.kr npm run build` | 종료 코드 0. 값을 빼면 실패하는 것이 맞는 동작(AC-UI-002-03) | M1 |
| QG-05 | 커버리지 | `npm run test:coverage`(커밋 직전) | 종료 코드 0. 기준값은 `vite.config.ts` 하나에서 온다 | M1~M7 커밋: 80/80/80/80. M8 마지막 커밋: 85/85/85/80(줄·문장·함수·분기) |
| QG-06 | 토큰 동기화·대비 회귀 | `npx vitest run src/styles/tokens.sync.test.ts src/styles/tokens.contrast.test.ts` | 통과(system.md 1.2.0에서도 토큰 값 변화 없음) | M1. M7부터 `src/features/reservations/calendar-theme.test.ts`를 함께 실행 — `calendar-theme.css`의 모든 `var(--…)`가 `src/styles/tokens.css`에 있는 토큰이고 선택자가 모두 `.kmc-calendar` 아래 |
| QG-07 | 기본 테마 정리 | `npx vitest run src/styles/theme-reset.test.ts` | 통과 | M1 |
| QG-08 | 디자인 규칙·공개 내보내기·가져오기 규칙 | `npx vitest run src/test/design-rules.test.ts` | 통과(앱 코드 검사 포함) | M1~M2: 공개 이름 40·파일 29. M3부터: 44·33 |
| QG-09 | 커밋 게이트 | 마일스톤 커밋 시 pre-commit `moai gate`(직접 확인: `moai gate; echo "gate exit=$?"`) | `gate exit=0`, 훅 우회 없음. 증거에 `pwd`, `CLAUDE_PROJECT_DIR`, `git rev-parse --short HEAD`를 함께 적는다. 빌드 단계 때문에 막히면 blocker 보고(plan.md R18) | M1 |
| QG-10 | SPEC 형식 | `moai spec lint .moai/specs/SPEC-UI-002/spec.md` | 오류 0건 | 계획 단계, 그리고 모든 마일스톤 |
| QG-11 | 도메인 경계 | §4.1 QG-11 블록 | 경계 검사 "출력 없음", 패턴 자체 확인 `2`, 도메인 모듈 양성 확인 `5`, 라벨 검사 두 줄 모두 "출력 없음", "완료" 패턴 자체 확인 `2` | 경계·자체 확인 M1. 양성 확인·라벨 검사 M6 |
| QG-12 | 옛 의존성(재정의) | §4.1 QG-12 블록 | 모듈 지정자 검사 "출력 없음", `package.json` 키 검사 종료 코드 0. react-router 8과 `@fullcalendar/react`(v7 하위 경로)는 허용 | M1 |
| QG-13 | 배포 스크립트 | M1~M7: `npx vitest run src/test/deploy-guard.test.ts`(지금 시험). M8 읽기 커밋부터: `npx vitest run src/test/deploy-script.test.ts`(가드 + 안전한 읽기, 마지막 커밋에서는 가드 없음 + 안전한 읽기) + §4.1 QG-13 블록 | 통과(대역 명령만 쓰고 실제 배포 없음). 주석 제외 검사는 마지막 커밋에서만 판정 | M1(지금 시험), M8(새 시험) |
| QG-14 | 의존성 정확 고정 | `npx vitest run src/test/dependency-pins.test.ts` | 통과(§3.4) | M1 |
| QG-15 | 미리보기 전시 | `npx vitest run src/preview/PreviewPage.test.tsx` | 통과 | M1~M2: 29개. M3부터: 33개 |
| QG-16(신규) | 스키마 동기 | `npx vitest run src/api/schema-sync.test.ts` | 통과(재생성 동일, 머리 값 3.1.0·31·50·58) | M1 |
| QG-17(신규) | CSP 해시 | §4.1 QG-17 블록 | 빌드·`check:dist` 종료 코드 0, `dist/index.html`의 CSP 해시가 실제 인라인 스크립트 해시와 같고 `connect-src` origin이 넘긴 env 값과 같음 | M8(CSP 플러그인 커밋부터) |
| QG-18(신규) | 운영 빌드에 미리보기 없음 | §4.1 QG-18 블록 | 빌드 종료 코드 0, JS 검사 "출력 없음", 원본 확인 1 이상 | M4. M4~M7의 `check:dist`는 미리보기 부분만 검사 |

### 4.1 검사 명령

```bash
# 공통 규칙: "출력 없음" 검사는 종료 코드가 정확히 1이고 표준 오류가 비어 있을 때만 통과다(§0).

# QG-11 도메인 경계(M1부터): exit=1, 출력 없음
grep -rnE 'RESERVED|VISITED|COMPLETED|CANCELLED|NO_SHOW|status-(reserved|visited|completed|cancelled|no-show)' src/ui-core; echo "exit=$?"
# QG-11 패턴 자체 확인(M1부터): 2
printf '%s\n' 'NO_SHOW' 'bg-status-no-show-rail' | grep -cE 'RESERVED|VISITED|COMPLETED|CANCELLED|NO_SHOW|status-(reserved|visited|completed|cancelled|no-show)'
# QG-11 도메인 모듈 양성 확인(M6부터): 5
grep -oE 'RESERVED|VISITED|COMPLETED|CANCELLED|NO_SHOW' src/features/reservations/status.ts | sort -u | wc -l
# QG-11 라벨 검사(M6부터): 상태 라벨 글자가 시험 밖 앱 코드에서 status.ts에만 있다. exit=1, 출력 없음
# (생성 타입 *.d.ts는 백엔드 설명 글을 담을 수 있어 뺀다)
grep -rlE --exclude='*.test.ts' --exclude='*.test.tsx' --exclude='*.d.ts' '예약됨|방문함|취소됨|노쇼' src/app src/api src/features src/lib | grep -vx 'src/features/reservations/status.ts'; echo "exit=$?"
# QG-11 라벨 검사 — "완료"(M6부터): exit=1, 출력 없음
# "완료"는 "저장을 완료했어요." 같은 문장에도 흔히 쓰이는 낱말이라 위 줄의 글자 검사에 넣으면 헛된 실패가 난다.
# 그래서 라벨을 다시 적은 모양 — 문자열 전체가 "완료"인 리터럴, 또는 JSX 글 전체가 "완료"인 것 — 만 따로 찾는다.
grep -rlE --exclude='*.test.ts' --exclude='*.test.tsx' --exclude='*.d.ts' "[\"'\`>][[:space:]]*완료[[:space:]]*[\"'\`<]" src/app src/api src/features src/lib | grep -vx 'src/features/reservations/status.ts'; echo "exit=$?"
# QG-11 "완료" 패턴 자체 확인(M6부터): 2(리터럴과 JSX 글은 잡히고 문장 속 낱말은 잡히지 않음)
printf '%s\n' 'label: "완료",' '<b>완료</b>' '"저장을 완료했어요."' | grep -cE "[\"'\`>][[:space:]]*완료[[:space:]]*[\"'\`<]"

# QG-12 옛 의존성 — 모듈 지정자(M1부터): exit=1, 출력 없음
grep -rnE --include='*.ts' --include='*.tsx' --exclude='*.test.ts' --exclude='*.test.tsx' "(from[[:space:]]+|import[[:space:]]*\(?[[:space:]]*|require[[:space:]]*\([[:space:]]*)[\"'](zustand|@headlessui/[^\"'/]+|axios|file-saver|react-router-dom|@fullcalendar/(core|daygrid|timegrid|interaction|list))(/[^\"']*)?[\"']" src; echo "exit=$?"
# QG-12 패턴 자체 확인: 2(axios와 @fullcalendar/core만 잡히고, 주석과 @fullcalendar/react 하위 경로는 잡히지 않음)
printf '%s\n' 'import x from "axios";' '// file-saver 없이 만든다' 'import "@fullcalendar/react/daygrid";' 'const m = import("@fullcalendar/core");' | grep -cE "(from[[:space:]]+|import[[:space:]]*\(?[[:space:]]*|require[[:space:]]*\([[:space:]]*)[\"'](zustand|@headlessui/[^\"'/]+|axios|file-saver|react-router-dom|@fullcalendar/(core|daygrid|timegrid|interaction|list))(/[^\"']*)?[\"']"
# QG-12 옛 의존성 — package.json 키(M1부터): 종료 코드 0
node -e '
const p = require("./package.json");
const banned = /^(zustand|@headlessui\/.+|axios|file-saver|react-router-dom|@fullcalendar\/(core|daygrid|timegrid|interaction|list))$/;
const keys = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"].flatMap((s) => Object.keys(p[s] ?? {}));
const hit = keys.filter((k) => banned.test(k));
if (hit.length) { console.error("QG-12 금지 키:", hit); process.exit(1); }
console.log("QG-12 package.json ok");
'

# AC-03 빌드 산출물(M1부터): 빌드가 0으로 끝난 뒤에만 아래 두 줄을 판정한다
VITE_API_BASE_URL=https://api-beauty.dongri.kr DEV_API_PROXY_TARGET=http://proxy-marker.invalid npm run build; echo "build exit=$?"
stat -c '%y' dist/index.html
grep -rlE 'proxy-marker\.invalid|DEV_API_PROXY_TARGET' dist; echo "exit=$?"   # exit=1, 출력 없음

# AC-04 커버리지 보고 범위(M4·M8): npm run test:coverage 뒤, 종료 코드 0
node -e '
const path = require("node:path");
const report = require("./coverage/coverage-final.json");
const files = Object.keys(report).map((f) => path.relative(process.cwd(), f));
const must = ["src/app/", "src/api/", "src/features/", "src/lib/", "src/ui-core/", "vite-plugins.ts"];
const banned = [/^src\/api\/schema\.d\.ts$/, /\.d\.ts$/, /^src\/main\.tsx$/, /^src\/preview\//, /^src\/test\//, /^src\/ui-core\/index\.ts$/, /\.test\.tsx?$/, /^scripts\//];
const missing = must.filter((m) => !files.some((f) => f.startsWith(m)));
const leaked = files.filter((f) => banned.some((b) => b.test(f)));
if (missing.length || leaked.length) { console.error({ missing, leaked }); process.exit(1); }
console.log("coverage scope ok:", files.length, "files");
'

# AC-23 기준선 비교(M3 마지막 커밋): 종료 코드 0
EVIDENCE=/home/antam2010/workSpace/_myproject/kmcbeauty/kmcbeauty-admin/.moai/state/verify/<세션>
npx vitest run --reporter=json --outputFile="$EVIDENCE/m3-after.json"
node -e '
const fs = require("node:fs"), path = require("node:path");
const [base, after, allow] = process.argv.slice(1);
const ids = (f) => new Map(JSON.parse(fs.readFileSync(f, "utf8")).testResults.flatMap((r) =>
  r.assertionResults.map((a) => [path.relative(process.cwd(), r.name) + " > " + a.fullName, a.status])));
const b = ids(base), a = ids(after);
const listed = new Set(fs.readFileSync(allow, "utf8").split("\n").map((s) => s.trim()).filter(Boolean));
const bad = [...b.keys()].filter((k) => a.get(k) !== "passed" && !listed.has(k));
if (bad.length) { console.error("기준선에서 빠지거나 실패한 시험:", bad); process.exit(1); }
console.log("baseline ok:", b.size, "tests kept or listed");
' "$EVIDENCE/m3-baseline.json" "$EVIDENCE/m3-after.json" "$EVIDENCE/m3-intentional-changes.txt"

# QG-13 deploy.sh 주석 제외 검사(M8 마지막 커밋): exit=1, 출력 없음
# 주석 줄(공백 뒤 #로 시작하는 줄)은 판정에서 뺀다. @MX:WARN 주석은 코드 뒤가 아니라 자기 줄에 둔다.
( set -o pipefail; grep -nE 'ALLOW_PREVIEW_ONLY_DEPLOY|\.env\.stage|--mode stage|\beval\b|^[[:space:]]*(\.|source)[[:space:]]' deploy.sh | grep -vE '^[0-9]+:[[:space:]]*#' ); echo "exit=$?"
# QG-13 가드 제거 커밋 확인(M8 마지막 커밋): 첫 줄이 M8 마지막 run 단계 커밋의 SHA와 제목
# "M8 마지막 run 단계 커밋" = `.moai/` 밖의 파일을 바꾸는 마지막 run 단계 커밋(spec.md C6). 그 뒤의 progress.md 전용 커밋
# (§E.2·§E.3 기록, run_commit_sha 채우기, 재검증 기록)은 세지 않으며, `-- deploy.sh` 경로 제한 때문에 이 출력에도 나오지 않는다.
git log -S ALLOW_PREVIEW_ONLY_DEPLOY --format='%h %s' -- deploy.sh | head -1

# QG-17 CSP(M8부터)와 QG-18 미리보기(M4부터): 빌드가 0으로 끝난 뒤에만 다음 줄을 판정한다
VITE_API_BASE_URL=https://api-beauty.dongri.kr npm run build; echo "build exit=$?"
stat -c '%y' dist/index.html
VITE_API_BASE_URL=https://api-beauty.dongri.kr npm run check:dist; echo "check:dist exit=$?"   # 0
# QG-18 JS 검사: exit=1, 출력 없음
grep -rlE --include='*.js' '컴포넌트 미리보기|bg-rose-700' dist; echo "exit=$?"
# QG-18 원본 확인: 1 이상(시연 허용 구역은 원본에 남는다)
grep -c 'bg-rose-700' src/preview/sections/VerificationSection.tsx
```

### 4.2 직접 실행하는 게이트

`.moai/config/sections/gate.yaml`에 정의된 pre-commit 단계는 vet·lint·test뿐이다(빌드·커버리지 단계 없음). 따라서 QG-01, QG-04, QG-05, QG-06~QG-08, QG-10~QG-18의 명령은 마일스톤마다 적용 시점에 맞춰 직접 실행하고 증거를 남긴다. QG-02·QG-03은 게이트도 돌리지만 증거용으로 한 번 더 실행해 출력을 남긴다.

## 5. 사용자 검토 항목(실제 브라우저)

자동 시험으로 판정하지 않는 항목이다. 결과는 progress.md에 적고, 확인하지 못한 항목은 공백으로 남긴다. UR-1, UR-4~UR-7, UR-9는 SPEC 완료 전에 사용자가 보면 좋지만 완료 조건은 아니다. UR-2·UR-3·UR-8은 운영 API에 붙어야 볼 수 있어 **SPEC 완료 뒤** 항목이다(로컬 미리보기 서버는 운영 CORS에 막히고, 로컬 백엔드는 `http`라 운영 빌드 env 검사를 통과하지 못한다).

| UR | 확인 내용 | 방법 | 시점 |
|---|---|---|---|
| UR-1 | HttpOnly 리프레시 쿠키 저장, 새로고침 뒤 세션 유지, 로그아웃 뒤 쿠키 삭제(Vite 프록시 경유 `localhost`의 Secure 쿠키 포함) | 로컬 백엔드 + `npm run dev`, 개발자 도구 쿠키 표 | run 단계 뒤 |
| UR-2 | 운영 빌드에서 CSP 위반 0건 — 8개 화면, 대화상자 열기, 캘린더 | 운영 배포(plan.md §P-1~§P-9) 뒤 브라우저 콘솔과 `securitypolicyviolation` | SPEC 완료 뒤(완료 조건 아님). 완료 전에는 AC-24·QG-17이 대신한다 |
| UR-3 | (선택) 엄격한 스타일 정책 — `'unsafe-inline'`을 뺐을 때 위반 기록 | UR-2와 같은 환경, 정책만 바꿔 실행. 결과로 후속 과제를 정한다 | SPEC 완료 뒤(완료 조건 아님) |
| UR-4 | Noto Sans KR `tnum`과 숫자 열 정렬(SPEC-UI-001에서 넘어온 항목) | 이력·메뉴 금액 열 | M6 뒤 |
| UR-5 | 셸 반응형(1280·900·375px), 서랍, 캘린더 실제 렌더링·테마·레일·범례·일정 설명·포커스 윤곽 | 로컬 백엔드 + `npm run dev`, 브라우저 폭 조절 | M7 뒤 |
| UR-6 | 같은 계정으로 네이티브 앱과 동시 사용 시 세션·선택 매장 영향(사용자당 리프레시 토큰 하나) | 실제 계정 두 기기 | run 단계 뒤 |
| UR-7 | (선택) Windows 고대비 모드에서 캘린더 포커스와 상태 구분 | Windows 고대비 | M7 뒤 |
| UR-8 | **SPEC 완료 뒤** — 운영 연결: plan.md §P 점검표와 백엔드 CORS 변경을 끝낸 뒤 `https://admin-beauty.dongri.kr`에서 로그인, 새로고침(쿠키 갱신), 깊은 경로(`/customers`)에서 새로고침, 로그아웃, `curl -sI`로 서버 보안 헤더 | 운영 배포 뒤 | SPEC 완료 뒤(완료 조건 아님) |
| UR-9 | 새 ui-core 컴포넌트 4개(DateRangePicker, NumberInput, Drawer, Popover)의 모양과 키보드 사용감(system.md 1.2.0 §8 규칙, plan.md §E E-4) | `npm run dev`의 `/dev/preview` | M3 뒤 |

## 6. 완료 정의

- 인수 기준 25개가 모두 판정 시점에 통과했고, 각 판정의 명령·출력·HEAD SHA가 기록됐다.
- 품질 게이트는 적용 시점부터 각 마일스톤 커밋에서 통과했고, M8의 마지막 run 단계 커밋(가드 제거 커밋 — `.moai/` 밖의 파일을 바꾸는 마지막 run 단계 커밋, spec.md C6)에서 QG-01 ~ QG-18이 모두 통과했다.
- 마일스톤 M1 ~ M8의 커밋이 각각 pre-commit 게이트를 훅 우회 없이 통과했고, 새 동작마다 RED 실패 출력이 보존됐다.
- 배포 중지 가드는 다른 모든 기준이 통과한 뒤 M8의 마지막 run 단계 커밋에서 지웠고, 그 커밋이 AC-UI-002-25와 QG-01~QG-18을 통과했다(C6). 실제 운영 전송은 하지 않았다.
- progress.md §E.2·§E.3이 manager-develop에 의해 기록됐고, MX 태그(plan.md §K)가 반영됐다. 이 기록을 담은 progress.md 전용 커밋은 가드 제거 커밋 뒤에 와도 되며 "M8의 마지막 run 단계 커밋" 판정에 세지 않는다(spec.md C6).
- 운영 연결 작업(plan.md §P)과 SPEC 완료 뒤 사용자 검토(UR-2·UR-3·UR-8)는 완료 정의에 들지 않는다. 남은 작업으로 progress.md에 적혀 있으면 된다.

## 7. 증거 기록

- 판정 하나마다 주장, 증거(명령과 출력 원문), 기준선 귀속(HEAD SHA, 이 트리), 공백(확인하지 못한 것), 잔여 위험을 적는다.
- 증거 파일은 임시 작업 트리가 아니라 주 체크아웃의 절대 경로 `/home/antam2010/workSpace/_myproject/kmcbeauty/kmcbeauty-admin/.moai/state/verify/<세션>/`에 남긴다. 임시 작업 트리는 합친 뒤 지워지고, 이 디렉터리는 `.gitignore` 대상이라 커밋되지 않는다.
- 출력이 길면 파일로 남기고, 보고에는 종료 코드와 끝부분만 인용한다.
- 빌드 산출물을 판정한 기록에는 `dist/index.html`의 수정 시각을, grep 판정 기록에는 `grep --version` 첫 줄을 함께 적는다.
- 브라우저에서만 확인할 수 있는 항목(§5)은 공백으로 분명히 표시하고, 확인했다면 그 결과를 진행 기록에 적는다.
- 라이브러리 사전 점검(plan.md §F 각 마일스톤)의 결과를 진행 기록에 남긴다. 이전 메이저 줄로 바꿔야 할 사정이 생기면 바꾸지 말고 blocker로 보고한다(C5).
