# SPEC-UI-002 진행 기록

| 항목 | 값 |
|---|---|
| SPEC | SPEC-UI-002 — 업무 화면·API·인증·라우팅 재구축과 배포 가드 제거 |
| 상태 | draft(계획 단계 산출물 작성, 2026-11-09. spec.md 0.2.0 — 사전 검토 반영, 2026-11-10 0.3.0 — plan-auditor 1회차 반영) |
| 등급 | Tier L(spec·plan·acceptance·design·research 5종 + spec-compact.md, plan-auditor 통과 기준 0.85). 요구사항 25개·인수 기준 25개(Tier L 상한) |
| 하네스 수준 | **thorough**(판단 근거 아래) |
| 개발 방식 | TDD(RED → GREEN → REFACTOR, `quality.yaml` `constitution.development_mode: tdd`), 커버리지 목표 85%(앱 코드 포함). 기준값은 M1~M7 커밋 80/80/80/80, M8 마지막 커밋 85/85/85/80(spec.md C2) |
| Git | `main` 직행(C3) — 실제 변경은 임시 작업 트리(로컬 임시 브랜치)에서 만들고 주 체크아웃에서 `git merge --ff-only`로 합친 뒤 `origin/main`에 푸시. 원격 기능 브랜치·PR 없음 |
| 기준 커밋 | `b84b92b`(SPEC-UI-001 동기화 완료, `origin/main`과 같음). 백엔드 기준 `kmcbeauty-fastapi` `eb8b06d` |

**하네스 수준 판단**: `.moai/config/sections/harness.yaml`의 자동 판정 규칙에서 `thorough` 조건 "`security_keywords` 있음"과 "`domain in [auth, …]`"에 해당한다. 이 SPEC은 인증(메모리 토큰, HttpOnly 쿠키 갱신, single-flight), 보안 경계(CSP, `deploy.sh`의 명령 주입 방지, 열린 리디렉트 방지)를 다룬다. `standard` 조건(파일 3개 초과, 여러 도메인)도 맞지만 더 깊은 쪽을 고른다. 최종 판정은 오케스트레이터의 몫이다.

## §A 계획 단계 기록

### A.1 산출물

| 파일 | 내용 | 작성 단계 |
|---|---|---|
| `interview.md` | 사용자 결정 기록 1~4회차, 결정 1~15(조사·계획과 다르면 이것이 우선). 오케스트레이터 작성 | Phase 1~3, 3회차는 결정 지점 1 전, 4회차는 사전 검토 뒤 |
| `research.md` | 예전 앱·백엔드 계약·현재 저장소·외부 라이브러리 조사와 모순 23건 처리. 3회차 뒤 §2.9(배포 서버 확인) 추가, 모순 14와 "찾지 못한 것" 2건을 해결로 표시. 0.2.0에서 머리·§5(결정 1~15)·§6(#9·#15)·§9 갱신 | Phase 8 → Phase 10 보강 → 사전 검토 반영 |
| `plan.md` | 기술 접근 §B, 새 패키지 §C, 잠금·게이트 변경 §D, 설계 정본 개정 §E, 마일스톤 M1~M8 §F, 요구사항·인수 기준 초안 §G·§H, 시험 전략 §I, 위험 R1~R19 §J, MX 계획 §K, 제약·제외 §M, 해결 기록 §O, 운영 연결 점검표 §P | Phase 8 초안 → 결정 지점 1 승인 → Phase 10에서 §O 마감 |
| `spec.md` | 요구사항 모듈 5개·요구사항 25개(GEARS), 제약 C1~C9, 인수 기준 요약 25개, 제외 범위, 영향받는 파일, 추적성(사용자 검토 열 포함). 0.2.0 | Phase 10 → 사전 검토 반영 |
| `acceptance.md` | Given-When-Then 시나리오 25개(판정 시점 포함), 절별 추적 표, 기대값 표 11개(상태·전환·캘린더 일정 표시, 오류 정규화·문구, 경로·`next` 표본, 의존성, CSV, 공개 이름, 경계 사례 42개, CSP, 약관 문구, ui-core 후속 과제 증거·키보드 계약, 매장 범위 키), 품질 게이트 18개(적용 시점 포함), 사용자 검토 UR-1~UR-9, 완료 정의 | Phase 10 → 사전 검토 반영 |
| `design.md` | 구현 구조(디렉터리, 경로·보호, 데이터·인증 흐름, 쿼리 키, 오류 정규화, 상태 모듈, 폼, 캘린더, CSV, 빌드 플러그인, 배포 스크립트, 개발 프록시, 미리보기 경로, ui-core 변경, 시험 장치, MX 대상) | Phase 10 |
| `spec-compact.md` | spec.md §4(모듈 1~5)·§7·§8·§9를 글자 그대로 뽑은 run 단계용 발췌 | Phase 10 |
| `progress.md` | 이 기록 | Phase 10 |

### A.2 인터뷰 1~3회차 요약(정본: `interview.md`)

| 회차 | 정한 것 |
|---|---|
| 1회차(범위와 외부 사실) | API 서버 `https://api-beauty.dongri.kr` · 예전 8개 화면만(네이티브 전용 기능 제외) · 미리보기 검토 전(`tnum` 미검증, 숫자 열 `tabular-nums` + 오른쪽 정렬, 대체 글꼴 없음) · SPEC-UI-001 후속 과제 17건 모두 |
| 2회차(조사 결과를 근거로 한 결정) | 사실 정정(예전 대시보드는 빈 페이지, 캘린더는 `/manager/treatments`, 이력 화면 없음) · 백엔드 기능까지 모두(예약·메뉴·세부 항목·고객 CRUD) · 시술 이력 목록 새로 만듦 · 상태 전환은 다음 단계 바로, 끝난 상태 되돌리기는 확인(화면 전용) · OpenAPI 스냅숏 + openapi-typescript + openapi-fetch · `dongri.kr` 아래 새 운영 주소(백엔드 CORS는 범위 밖) · 메모리 액세스 토큰 + HttpOnly 쿠키 갱신. 묻지 않고 정한 기본값 9개(첫 화면 캘린더, 상태 라벨, 약관 경로 유지, CSV 재작성, 최신 안정판, 미리보기 개발 전용, Vite 프록시 기본 로컬, single-flight, C3 재작성) |
| 3회차(배포 환경 확인) | 운영 관리자 주소 `admin-beauty.dongri.kr` · 배포 서버에서 SPA 경로 대체와 보안 헤더 설정 가능 → 경로 방식 라우팅 유지(서버 작업은 범위 밖) · `deploy.sh`는 운영 서버, `--mode production`, `.env.production` · 운영 로그인 확인(UR-8)은 SPEC 완료 뒤 |
| 4회차(사전 검토 결과에 따른 결정) | 결정 15: 캘린더 일정은 색·상태별 아이콘·시각·고객 이름만 보이고, 상태 이름은 접근 이름 `"<상태> · HH:mm · <고객 이름>"`·같은 글의 설명·캘린더 위 범례로 알린다. system.md §9 "아이콘 + 라벨 필수"에 예외를 적는다 |

- 알린 위험(범위 밖): 예전 로그인 코드의 기본 계정 값(공개 저장소 이력), 사용자당 리프레시 토큰 하나(관리자 웹 로그인이 같은 계정의 네이티브 세션을 밀어냄).
- 명확도: 처음 7/10 → 마지막 10/10.

### A.3 조사(fan-out)

- 실행: 계획 조사 fan-out `wf_faa12d18-55d`, 읽기 전용 조사원 5명(관점별 고정 머리글 보고서) + 종합. 조사원별 원본: `.moai/state/verify/cd2cba80-827f-4657-b7ea-6a07e9f25df2/research/`.
- 종합 결과는 `research.md`다. 모순 23건 가운데 19건 해결, 남은 것은 7(엄격한 스타일 정책 — 브라우저 확인 뒤 후속 과제), 18(포커스 링 개수 재측정 — run 단계), 19(백엔드 스키마 차이 — 조치 불필요)다. 14(운영 주소 이름)는 3회차로 해결했다.
- 검증 방식: 백엔드 계약은 로컬 `kmcbeauty-fastapi/.venv`에서 `app.openapi()`로 만든 OpenAPI 3.1.0 문서(경로 31, API 50, 스키마 58)와 코드 읽기, 라이브러리 버전은 2026-11-09 `npm view`. 미검증 항목은 research.md §9에 모았고 각 마일스톤 사전 점검(plan.md §F)으로 넘겼다.

### A.4 결정 지점 1 결과(2026-11-09)

- 사용자가 plan.md 초안을 보고 **"SPEC 문서 만들기"**(진행)를 골랐다. 등급은 **Tier L**로 정했다(오케스트레이터가 AskUserQuestion으로 받음).
- SPEC은 하나로 진행한다(plan.md §N의 두 SPEC 분할안은 쓰지 않음).
- 3회차 인터뷰 답 네 가지를 plan.md §O에 해결 기록으로 적고 본문 해당 자리(§B.10·§B.11·§B.12, M1·M8, §G REQ-025, §H AC-25, §I UR-8, §J R7·R9, §K, §M.2)를 고쳤다. `[NEEDS CLARIFICATION]` 표시는 0개다.
- plan.md §O의 "이번에 새로 정한 기본값"(인터뷰가 정하지 않은 것)은 사용자가 바꾸지 않아 그대로 확정했다.
- Phase 10에서 계획을 다듬으며 바꾼 것(결정 지점 1의 범위 안, 이유는 각 위치에 적음):
  - 예시 env 파일을 둘로 나눴다 — `.env.example`(개발 기본값만), `.env.production.example`(변수 이름만). 운영 API 주소는 예시 파일에 넣지 않는다(plan.md §B.10). **(0.2.0에서 S-F8로 바뀜 — 지금은 공개 API 주소 값 `VITE_API_BASE_URL=https://api-beauty.dongri.kr`을 적고 `SCP_*`만 이름만 둔다, spec.md §3·plan.md §B.10. 이 줄은 당시 기록으로 남긴다)**
  - `.env`가 없는 임시 작업 트리에서는 검증 빌드에 `VITE_API_BASE_URL`을 넘긴다는 규칙과 위험 R18(게이트가 빌드를 돌리면 커밋이 막힘), 위험 R19(점검표 전에 `deploy.sh` 실행)를 더했다.
  - 422 `fieldErrors` 키를 "마지막 문자열 조각"에서 "`body`를 뺀 `loc` 경로"로 바꿨다(예약 항목처럼 같은 이름의 필드가 여러 개인 폼 때문).
  - 전환 함수 결과에 대각선용 `same`을 더했다(25칸 표를 빈칸 없이 정의).
  - 상단바 날짜 예시의 요일을 바로잡았다(2026-11-09는 월요일).

### A.5 배포 서버 확인(읽기 전용, 2026-11-09)

- 사용자가 접속 방법을 알려 주고 확인을 요청해 오케스트레이터가 읽기 전용 명령만 실행했다(설정 변경·다시 읽기 없음). 증거: `.moai/state/verify/cd2cba80-827f-4657-b7ea-6a07e9f25df2/deploy-server/maria-daeho-shop-readonly-check.md`.
- 확인한 것: nginx 1.30.6이 Docker 컨테이너 `nginx`로 동작, 설정 폴더 `/srv/server-mini2/nginx/conf.d`의 소유자 `antam2010`(docker 그룹, sudo 불필요), 다른 사이트의 서버 수준 보안 헤더와 "location 안에 `add_header`를 두지 않는다" 규칙, 정적 파일 마운트 없음, `admin.dongri.kr`은 다른 서비스, 원본 인증서 SAN `*.dongri.kr, dongri.kr`.
- 결론과 남은 작업: 경로 방식 라우팅을 유지한다. 서버 블록·정적 파일 마운트·Cloudflare DNS·nginx 다시 읽기·백엔드 CORS는 이 SPEC 밖이며 plan.md §P 점검표로 남겼다. 운영 로그인 확인(UR-8)은 그 뒤에 한다.

### A.6 다음 단계

1. plan-auditor 독립 감사(Tier L 통과 기준 0.85). 사전 검토 85건의 처리 결과는 §A.7이다.
2. 통과하면 아래 §E.1의 자리 표시(`_<pending plan audit>_`)를 계획 단계 완료 신호(`plan_status: audit-ready`, `plan_complete_at`)로 바꾼다. 제목 `§E.1`~`§E.4`는 이미 있다.
3. 구현 착수 승인(Implementation Kickoff Approval)을 받은 뒤 `/moai run SPEC-UI-002`로 M1부터 진행한다.

### A.7 사전 검토 반영

계획 감사 전 읽기 전용 관점 3개의 사전 검토(`.moai/reports/plan-audit/SPEC-UI-002-lenses-1/`)가 낸 85건(심각 6·중간 37·가벼움 42)과 결정 15를 spec.md 0.2.0에 반영했다. ID 접두사는 관점이다: S = 범위 정합성(`scope-coherence.md`, 17건), T = 요구사항 시험 가능성(`requirement-testability.md`, 36건), C = 인수 명령 유효성(`acceptance-command-validity.md`, 32건). 위치의 `acc`는 acceptance.md, `spec`은 spec.md다.

**범위 정합성(17건)**

| ID | 처리 | 위치 |
|---|---|---|
| S-F1 | 이전 메이저 줄 전환은 언제나 blocker → REQ-001·§3.4·QG-12·E-3 개정 뒤 진행으로 한 규칙만 남김. "미리 승인" 문구를 지움 | spec C5·§8, acc §3.4, plan §C·§B.2·§M C5·R1, design §3.1, research §6 #9 |
| S-F2 | 마일스톤 열을 spec §10 기준으로 다시 맞춤. REQ-022·AC-22는 M3~M7 | spec §10, acc §1, plan §A·F.9 |
| S-F3 | 판정 시점 열 도입, M4에 업무 화면 빈 페이지 등록, AC-05·06·07·14·22를 부분별 시점으로 | acc §1, plan §F·§B.2 |
| S-F4 | 다른 기준을 먼저 통과시키고, 가드 제거 커밋 자체가 AC-25·QG-01~18을 통과하도록 문구 정리 | spec G5·C6, plan §M C6·M8 |
| S-F5 | 앱 문구가 없는 코드의 백엔드 `detail.detail` 통과를 명시한 예외로 | spec REQ-009·C4, acc §3.2, plan §B.1 |
| S-F6 | `api:check`로 드리프트 감지만, 다시 내보내기는 blocker → REQ-002·AC-02·QG-16 개정 뒤 | plan R3·§D.3 |
| S-F7 | 정본 순서 acc §3 → system.md(같은 글자) → 코드. E-2·E-6에 바꾸기 문구와 화면 문구 표 전부 | spec C1, acc §0, plan §E·§B.4 |
| S-F8 | 공개 API 주소를 `.env.production.example`에 적음, `SCP_*`만 이름만 | spec §3, plan §A·§B.10·§P-8, design §13 |
| S-F9 | UR-2·UR-3을 §P-1 뒤(SPEC 완료 뒤)로, R2를 잔여 위험으로 두고 빌드 정책 시험이 대신함 | acc §5·§3.8, plan §I·R2·§P-10, spec §8 |
| S-F10 | README 항목(R4·R10·로컬 `.env`)을 동기화 단계 산출물로 열거, KST 가정은 E-9, 로그인 화면 안내 삭제 | spec §8, plan §E E-9·R4·R10·§M.2 |
| S-F11 | `deploy-guard.test.ts` → `deploy-script.test.ts` 이름 변경을 M8 읽기 커밋의 필수 작업으로 | spec §5·§9, plan §B.12·§D.3·M8, design §12 |
| S-F12 | 게이트 적용 시점 열과 중간 조건, AC-04 판정 시점 | acc §4·§1, plan §F |
| S-F13 | REQ-002를 "백엔드 폴더 무변경 + `--out` 경로 한 곳"으로, 출력 경로 옵션 문서화 | spec REQ-002, acc AC-02, plan §D.3 |
| S-F14 | REQ-023에 항목 번호(1·2·4·6~17)와 "시험 장치 포함" | spec REQ-023 |
| S-F15 | 파일 목록 동기화(`route.tsx`, `export-openapi.test.ts`, `safe-next.ts`, `dev-routes.ts`), `\` 규칙을 REQ로 | spec §9·REQ-010, plan §D.2·M1·M4 |
| S-F16 | §L을 고치고 UR-9(M3 뒤 `/dev/preview`)를 더함 | plan §L, acc §5 |
| S-F17 | plan §G·§H를 대체됨으로 표시, research 머리·§5 갱신, 이 문서 §A.6 정정 | plan 머리·§G·§H, research 머리·§5, progress §A.6 |

**요구사항 시험 가능성(36건)**

| ID | 처리 | 위치 |
|---|---|---|
| T-F1 | `next` 규칙(한 번 디코딩, `\`·C0·공백 거부, origin 비교, `/`·`//`)을 세 사용처에, EC-27~30 추가 | spec REQ-010, acc §3.3·AC-09·AC-12·EC-05·EC-27~30, plan §B.2, design §3.2 |
| T-F2 | 결정 15: REQ-015는 목록·표·폼·대화상자, REQ-017은 접근 이름·설명·범례, AC-14는 원본 `status`와 접근 이름을 비교 | spec REQ-015·017, acc AC-14·§3.1, plan §B.4·§B.6·E-2·E-3, design §9.2 |
| T-F3 | "보관"을 스크립트가 닿는 앱 상태로 정의, 캐시 직렬화·`indexedDB.open` 0회·뒤 검사 | spec REQ-005, acc AC-05, design §4.3·§16 |
| T-F4 | 401이 아닌 갱신 실패 절(세션 유지), EC-31·32, 만료 문구 단언 | spec REQ-006, acc AC-06·EC-31·32·§3.2, plan §B.1, design §4.2 |
| T-F5 | 로그아웃은 응답을 기다리지 않음, 500·네트워크·응답 없음 사례 | spec REQ-007, acc AC-05(다), plan §B.1, design §4.3 |
| T-F6 | AC-09를 로그인 loader·로그인 제출 두 사용처로 나눠 표본 전부 | acc AC-09 |
| T-F7 | AC-12 Given 정리(매장 1 선택 상태에서 "매장 변경"), 경우마다 이동 하나, 선택 요청 실패 사례 | spec REQ-013, acc AC-12 |
| T-F8 | REQ-009 문구 예외와 재시도 금지 범위(쿼리 정책·변경), REQ-006 재전송 예외 | spec REQ-006·009, acc §3.2 |
| T-F9 | `["shops","selected"]` `refetchOnWindowFocus: "always"`, `focusManager`로 포커스 | spec REQ-008, acc AC-07·§3.11, plan §B.1·§B.3, design §4.4 |
| T-F10 | 고객 등록 성공·수정, 메뉴 추가·수정, 세부 수정·삭제의 본문·무효화·토스트 | acc AC-18·AC-20·§3.2 |
| T-F11 | 쓰기 범위 판정(대역이 cwd·env 기록, `--out`), 출처 커밋 문자는 REQ에서 빼고 커밋 메시지·진행 기록에 | spec REQ-002, acc AC-02, plan R3·M1 |
| T-F12 | AC-03에 기준 주소(개발 `/api`, 운영 env 값) 판정 | spec REQ-003, acc AC-03, plan §B.10, design §13 |
| T-F13 | AC-04를 M1 설정 시험과 M4·M8 보고 검사로 나눔, 기준값 출처 하나, "이상" | spec AC-04 요약·C2, acc AC-04·§4.1 |
| T-F14 | REQ-014를 세 절로, 개발 라우터 `/dev/preview` h1 판정 | spec REQ-014, acc AC-13·§3.3 |
| T-F15 | 후속 과제 항목별 증거 표와 새 컴포넌트 키보드 계약 표 | spec REQ-023, acc AC-23·§3.10 |
| T-F16 | "M8의 마지막 run 단계 커밋"으로 정의, `git log -S`로 확인 | spec REQ-025·C6, acc AC-25·QG-13 |
| T-F17 | 모든 REQ의 절별 판정 위치 | acc §1.1 |
| T-F18 | GEARS 유형 표 바로잡음(001은 조건 없음, 복합 행 복원) | spec §4.6 |
| T-F19 | REQ-012를 결과마다 When 절로, 이메일 형식 규칙, 사례 둘 추가 | spec REQ-012, acc AC-11·§3.2 |
| T-F20 | 셸 크기 클래스 단언, 경계 폭 767·768·1023·1024 | acc AC-10·EC-40, plan §E E-5 |
| T-F21 | `initialView` 단언, 일 보기, 20/21쪽 경계, 연기 시험 두 갈래 판정, 일정 내용 렌더링 시험 | spec REQ-017, acc AC-16·EC-41 |
| T-F22 | CSV 쪽 수 상한 없음과 시험, CR 표본, 앞 공백·전각 등호 정책 | spec REQ-019, acc §3.5·AC-19·EC-36, plan §B.8, design §10 |
| T-F23 | URL 키 명시, 2쪽 단계, 달 경계 EC-33 | spec REQ-021, acc AC-21·EC-33 |
| T-F24 | §3.8 정책을 REQ가 직접 요구, 개발 서버 shall not, origin 사례 EC-34 | spec REQ-024, acc AC-24·EC-34·§3.8 |
| T-F25 | `new URL` 해석·`https:`·호스트 검사, EC-35 | spec REQ-003, acc AC-03·EC-35, plan §B.10, design §11 |
| T-F26 | 필수 값 4행 표, 인자 한 줄씩 기록, 공백 든 값, 같은 이름은 뒤 값, `export ` 줄, `-` 값 | spec REQ-025, acc AC-25·EC-37~39, plan §B.12, design §12 |
| T-F27 | 링크 스킴을 URL 프로토콜로 판정, 대소문자·앞 공백·TAB·`data:` 표본 | acc §3.10 #4, plan M3, design §15.2 |
| T-F28 | QG-11 라벨 검사, 이력 필터 선택지가 `STATUS_ORDER`에서 | spec REQ-015, acc QG-11·AC-21, design §7 |
| T-F29 | 이력 필터 변경 취소 판정, §3.2 대체 문구(400·401·409·502~504·404) | acc AC-21·§3.2 |
| T-F30 | 매장 범위 키 공장 6개 정본 표 | acc §3.11·AC-07 |
| T-F31 | 추적성 표와 매트릭스에 사용자 검토 열 | spec §10, acc §1 |
| T-F32 | 업무 폼 범위 명시, 422 가격 칸 문구 "0 이상 입력해 주세요." | spec REQ-022, acc AC-22·§3.2 |
| T-F33 | `vite-plugins.ts` 포함·`scripts/*.mjs` 제외 이유, 가져오기 표본 3개 추가 | spec REQ-004, acc AC-04, plan §D.3 |
| T-F34 | 현재 상태 선택 불가 절, Esc 사례 EC-42 | spec REQ-016, acc AC-15·EC-42 |
| T-F35 | 약관 문단 전문을 §3.9에 두고 전체 비교, 산출물 검사는 JS 문자열 | acc §3.9·AC-13·QG-18 |
| T-F36 | 항목을 바꾼 수정 본문은 전체 배열(기존 항목 `id` 포함) | spec REQ-018, acc AC-17·EC-14, plan §B.4, design §9.3 |

**인수 명령 유효성(32건)**

| ID | 처리 | 위치 |
|---|---|---|
| C-F1 | 내장 명령만 쓰는 주입 표본, 일부러 `source`하는 양성 대조 사본, PATH 문구 정정 | acc AC-25, plan §B.12, design §12 |
| C-F2 | 주석 줄을 뺀 뒤 판정하는 파이프라인(`pipefail`), `@MX:WARN`은 자기 줄 | acc §4.1 QG-13, plan §B.12·§K, design §12 |
| C-F3 | 게이트마다 적용 시점과 중간 조건, plan §F와 맞춤 | acc §4, plan §F |
| C-F4 | QG-18을 JS 검사로 바꾸고 CSS 검사를 뺌 | acc QG-18·§4.1·AC-13, plan §B.9·§D.3, design §11 |
| C-F5 | `vite.config.ts` `test.env.TZ` 고정, `TZ=UTC` 증명, 가짜 시계를 정확한 순간으로 | acc §0·AC-01, plan §I·M1, design §16 |
| C-F6 | 커버리지 단계 기준(M1~M7 80, M8 마지막 커밋 85/85/85/80) | spec C2, acc QG-05·AC-04, plan §D.3·§F·M8 |
| C-F7 | M1 설정 시험 + M4·M8 `coverage-final.json` `node -e` 검사 | acc AC-04·§4.1 |
| C-F8 | AC-08의 화면 문장을 AC-18(M5)로, AC-08은 훅 수준 취소 | acc AC-08·AC-18 |
| C-F9 | M3 시작 JSON 기준선, 의도 변경 목록, 비교 명령 | acc AC-23·§4.1, plan M3 |
| C-F10 | 시험 파일 이름 변경 필수(S-F11과 같은 처리) | spec §9, plan §D.3·M8 |
| C-F11 | 빌드·`check:dist`에 `VITE_API_BASE_URL`을 넘기고 `check:dist`가 origin 비교 | acc §4·§4.1, plan §B.10·§D.3·M4, design §11 |
| C-F12 | QG-12를 모듈 지정자와 `package.json` 키 검사로(패턴 자체 확인 포함) | spec REQ-001, acc §4.1, plan §D.3 |
| C-F13 | `export-openapi.test.ts`를 M1 목록에, `--out` 옵션과 호출 방법 | acc AC-02, plan M1·§D.3 |
| C-F14 | `calendar-theme.test.ts`를 M7부터 QG-06에 | acc QG-06, plan §D.3·M7 |
| C-F15 | 쿼리는 디코딩한 `URLSearchParams` 다중 집합으로 비교 | acc §0 |
| C-F16 | "출력 없음"은 종료 코드 1 + 빈 표준 오류, 빌드 성공 뒤에만, 수정 시각 기록 | acc §0·§4.1·§7 |
| C-F17 | `indexedDB` 대역을 setup에 설치, 위치 변경은 `location.href`와 jsdom 오류로 판정 | acc §0·AC-05·AC-07, design §16 |
| C-F18 | vitest는 디렉터리·정확한 경로로 지정, AC-07 파일 이름 명시 | acc §0·AC-05·AC-07·AC-10 |
| C-F19 | plan §D.3의 QG-12 칸은 acc §4.1 블록을 가리키게 | plan §D.3 |
| C-F20 | 자동 진행 없는 가짜 타이머와 `advanceTimersByTimeAsync` | acc §0·AC-12·AC-18, design §16 |
| C-F21 | `buildDevProxy`에 명시한 env 객체를 넘김 | acc AC-03, design §13 |
| C-F22 | 약관·개인정보 문단 다섯 개를 §3.9 표로 | acc §3.9 |
| C-F23 | `engines` 단언을 dependency-pins 시험에 | acc AC-01, plan §D.3·M1 |
| C-F24 | 게이트 증거에 `pwd`·`CLAUDE_PROJECT_DIR`·HEAD, 직접 실행하는 게이트 목록 | acc QG-09·§4.2 |
| C-F25 | 증거 디렉터리를 주 체크아웃 절대 경로로 | acc 머리·§7 |
| C-F26 | GNU grep(`/usr/bin/grep`) 명시, 버전 기록 | acc §0·§7 |
| C-F27 | vitest `Duration`으로 판정, `uptime` 기록, 90초 여유 기준 | acc QG-03 |
| C-F28 | 작업 트리의 `deploy.sh`를 복사 | acc AC-25, plan §B.12 |
| C-F29 | 개발 전용 경로를 모듈 범위 `import.meta.env.DEV`(`dev-routes.ts`)로 | plan §B.9·§D.2·M4, design §3.1·§14, acc AC-13 |
| C-F30 | UR-2를 §P-1 뒤로(S-F9과 같은 처리) | acc §5 |
| C-F31 | 일시는 같은 순간인지로 비교 | acc §0·AC-15·AC-17 |
| C-F32 | 동기 시험은 `api:types`와 같은 CLI로 재생성 | spec REQ-002, acc AC-02, plan §D.3·M1, research §9 |

### A.8 plan-auditor 1회차 반영(2026-11-10)

감사 보고 `.moai/reports/plan-audit/SPEC-UI-002-review-1.md`(FAIL, 0.871, 필수 통과 기준 모두 통과, 차단 결함 6건)의 D1~D14를 spec.md 0.3.0에 반영했다. 요구사항 25개·인수 기준 25개는 그대로다.

| ID | 처리 | 위치 |
|---|---|---|
| D1 | 고침 — 대조 사본을 표본마다 따로 실행하고 기대 표시 파일을 표본별로 적음(첫 표본 `pwned`·`pwned2`, `SCP_DIR` 줄만 바꾼 둘째 표본 셋 모두). 둘째·셋째 표본의 구성과 표본별 임시 디렉터리를 명시 | acc AC-25 Given·(나), plan §B.12, spec §7 AC-25 |
| D2 | 고침 — "M8의 마지막 run 단계 커밋" = `.moai/` 밖의 파일을 바꾸는 마지막 run 단계 커밋. 그 뒤의 progress.md 전용 커밋은 세지 않음. `git log -S`는 `-- deploy.sh`로 범위를 좁힘 | spec C6·REQ-025·§7 AC-25, acc AC-25 (다)·§4 머리·§4.1 QG-13·§6, plan §B.12·M8 4단계·완료 기준 |
| D3 | 고침 — AC-12·14·16·18·20·21의 `(maps …)`를 acc §1 표 REQ 열과 같게 | spec §7, acc AC-14·16·18·20·21 머리글 |
| D4 | 고침 — 스켈레톤 경계를 "300ms 이상(300ms 시점부터 보임)"으로 통일 | spec REQ-013, acc AC-12 (바), plan M5 시험 |
| D5 | 고침 — `.env.production.example`은 공개 `VITE_API_BASE_URL` 값 + `SCP_*` 이름만. §A.4의 당시 기록에 바뀜 표시 | design §2, progress §A.4 |
| D6 | 고침 — REQ-025에 "양끝이 같은 따옴표면 한 겹만 벗기고 그 밖은 글자 그대로" | spec REQ-025 |
| D7 | 고침 — `deploy.sh`는 bash 내장 명령과 `npm`·`scp`만 씀. 대역 `npm`이 `dist/index.html`·`dist/assets/a.js`를 만들고 `scp` 기대 인자를 고정 | acc AC-25 Given·Then, plan §B.12, design §12 |
| D8 | 고침 — "완료"를 글자 검사에서 뺀 이유를 주석에 적고, 문자열 전체·JSX 글 전체가 "완료"인 경우를 찾는 검사와 그 패턴 자체 확인(`2`)을 더함 | acc §4.1 QG-11 블록, QG-11 표 |
| D9 | 남은 사항 — AC·경계 사례가 처음 정한 동작(EC-06, AC-11 처음 값·자동 완성 속성, AC-06 쿠키 범위 등)은 해당 REQ를 AC 수준에서 구체화한 것으로 본다. REQ 문장은 고치지 않음 | — |
| D10 | 고침 — 주 시작 요일 일요일, 캘린더 옵션에 `firstDay: 0` 명시(ko 로캘 기본값에 기대지 않음). AC-16 Given과 대역 확인 항목에 반영 | plan §B.6, design §9.1, acc AC-16 |
| D11 | 고침 — 의도 변경 목록의 줄 형식을 비교 스크립트 키와 같은 `<루트 기준 경로> > <fullName 그대로>`로 정함 | acc AC-23 Given |
| D12 | 고침 — vitest가 보고한 `Duration`으로 판정하고 같은 실행의 `uptime`을 함께 기록. 제한 120초(gate.yaml `timeouts.test`), 여유 목표 90초 이하 | acc QG-03 |
| D13 | 남은 사항 — 복합 절은 Tier L 상한(REQ 25개) 안에 두려고 유지한다. 절별 판정 위치는 acc §1.1이 준다 | — |
| D14 | 고침 — `SPEC-UI-003`은 채택하지 않은 안의 가상 ID라 만들지 않음을 명시 | plan §N |

### A.9 plan-auditor 2회차와 계획 단계 마무리(2026-11-10)

- 판정: **PASS, 0.934**(명확성·완전성·시험 가능성·추적성의 조화 평균, Tier L 기준 0.85, 1회차 0.871에서 상승). 필수 통과 기준 7개 통과, `moai spec lint` exit 0. 보고서: `.moai/reports/plan-audit/SPEC-UI-002-review-2.md`(1회차 `-review-1.md`).
- 1회차 결함: D1~D6(차단) 모두 해결, D7·D8·D10·D11·D14 해결, D12 일부 해결(120초를 넘을 때 다시 실행하는 규칙 없음), D9·D13 남은 사항. 퇴보 없음.
- 교차 확인: harness `thorough`는 PASS 뒤 sync-auditor 교차 확인을 두지만 sync-auditor 정의가 계획 단계 감사를 제외한다. 대신 오케스트레이터가 필수 기준을 기계 점검으로 다시 확인했다: REQ 001~025·AC 01~25 연속, REQ 25개 모두 shall, frontmatter 12/12, `NEEDS CLARIFICATION` 0, syscall 0.
- 계획 HTML 보고서: `.moai/reports/plan-html/SPEC-UI-002-plan.html`.
- run 단계로 넘기는 항목. 감사를 통과한 뒤 계획 문서를 고치면 run 단계 Phase 1의 감사 생략 조건(문서 해시 불변)이 깨지므로 문서는 고치지 않고 위임 지시문에 넣는다.
  - N1: 가드 제거 커밋을 판정할 기준 SHA를 run 단계가 끝난 시점, 동기화 커밋 전에 `git log -1 --format='%h %s' <M1 시작 SHA>..HEAD -- . ':(exclude).moai'`로 기록한다.
  - N2: plan.md §M C6 사본에 D2 정의(`.moai/` 밖을 바꾸는 마지막 run 커밋)가 빠져 있다. 기준은 spec.md C6과 plan M8 4단계다.
  - N3: plan.md §G 머리의 판 번호가 "0.2.0"이다. §G·§H에는 대체됨 표시가 있고 기준은 spec.md다.
  - D9 가운데 미정: 첫 방문(S0)에 세션 만료 문구를 보일지. run 단계 위임 때 결정값을 주거나 blocker로 받는다.
  - D12: QG-03이 120초를 넘으면 한 번 다시 실행하고 두 번의 Duration을 함께 기록한다(판정 기준은 그대로).
- 다음 단계: 계획 산출물 커밋(late-branch, `main`) → 푸시 여부 결정 → `/clear` → 새 세션에서 `/moai run SPEC-UI-002`. 구현 착수 승인과 짧은 설계 패스(plan §L) 여부는 run 단계에서 묻는다.

### A.10 run 단계 계획 감사 관문과 구현 착수 승인(2026-11-10)

- 실행: `/moai run SPEC-UI-002`, 세션 `f2f06653-455e-4f0b-a6b6-b69d14ecb2e5`. 시작 HEAD `fd184ee`(`origin/main`과 같음, 차이 `0 0`).
- 계획 감사 관문(Phase 1): 캐시 적중이라 plan-auditor를 다시 부르지 않았다.
  - audit_cache_hit: true
  - cached_audit_at: 2026-11-10T01:04:42+09:00(`SPEC-UI-002-review-2.md` 기록 시각)
  - audit_verdict: PASS(0.934, Tier L 기준 0.85)
  - 문서 불변 조건: 해시 대상 5개(spec·plan·acceptance·design·research)는 모두 보고서보다 먼저 마지막으로 고쳐졌다(가장 늦은 것 00:57:51). `tasks.md`는 없고 SPEC 폴더의 git 변경은 0이다. Go `ComputeHash` 값은 이 세션에서 낼 수 없어 sha256 지문으로 대신 남겼다(일별 기록 `.moai/reports/plan-audit/SPEC-UI-002-2026-11-10.md`, git 제외).
  - 재개 메시지의 전제 2(`grep -c "plan_status: audit-ready"`)가 `2`를 낸 이유: 70행의 안내 문장에 같은 글자가 있다. 216행의 신호는 하나다(`grep -c "^plan_status: audit-ready"` → `1`).
- 구현 착수 승인(사용자, AskUserQuestion):

| 항목 | 결정 |
|---|---|
| 착수와 진행 방식 | 착수한다. 마일스톤을 이어서 진행하고, blocker·같은 실패 3회·사용자 결정이 필요할 때만 멈춘다 |
| D9 미정 사항(첫 방문 S0의 만료 문구) | 첫 방문에는 문구를 보이지 않는다. 세션 만료 문구는 이 탭에서 로그인돼 있던 세션이 갱신 401로 끝났을 때만 보인다. 앱을 처음 열거나 새로고침할 때 갱신이 401이면 문구 없이 로그인 화면을 보인다. M4 시험에 "S0에서는 문구 없음" 단언을 더한다 |
| 설계 패스(plan §L) | M1 전에 manager-design으로 §E 범위만 다루는 짧은 설계 패스를 한다. 결과는 system.md 1.2.0 커밋 하나이고, M1은 §E 첫 커밋을 건너뛴다 |
| 독립 평가(sync-auditor) | M2·M4·M8 직후에 돌린다(보안 경계가 있는 마일스톤). 나머지 마일스톤은 오케스트레이터 검증 묶음만 하고, sync 단계의 전체 평가는 그대로 둔다 |

- 실행 방식(C3 그대로): 진행 기록 커밋·푸시 → manager-develop이 임시 작업 트리에서 TDD로 구현·커밋 → 오케스트레이터가 그 작업 트리에서 다시 검증 → 주 체크아웃에서 `git merge --ff-only` → `git push origin main` → 증거를 주 체크아웃 `.moai/state/verify/`로 복사 → 작업 트리 정리.
- 건너뛴 단계와 이유:
  - Phase 5·6(재계획과 `tasks.md`): plan.md §F가 감사를 통과한 작업 분해다. `tasks.md`는 계획 산출물 해시 대상이라 만들면 다음 재개 때 감사 생략 조건이 깨진다.
  - Phase 7(인수 기준별 작업 목록): 마일스톤 단위 작업 목록으로 대신한다. 인수 기준의 판정 시점은 acceptance.md §1이 정한다.
  - Phase 8(빈 파일 미리 만들기): TDD로 시험부터 쓰고, 작업은 임시 작업 트리에서 한다.
  - Phase 10(`contract.md`): acceptance.md §1 판정 시점과 §4 게이트 적용 시점이 마일스톤별 완료 계약이다.
  - `ac_converge` 목표: 걸지 않는다. 배경 에이전트를 기다리는 동안 Stop 훅이 헛돌아 차단 상한을 써 버린 적이 있다. 에이전트 완료 알림을 받으면 다음 마일스톤을 잇는다.
- 위임 지시문에 넣는 항목: acceptance.md §1 판정 시점 열, §A.9의 N1·N2·N3·D12, 위 S0 결정, 기존 @MX 태그 지도(`src/` 15개 파일).

### A.11 설계 패스 결과(manager-design, 2026-11-10)

- 결과: `.moai/design/system.md` 1.1.0 → 1.2.0(268행 → 440행). plan §E E-1~E-9를 모두 반영했다. 이 파일 하나만 바뀌었다. DesignSync·네트워크·외부 산출물은 쓰지 않았다.
- 오케스트레이터 재검증(이번 실행, 커밋 전 트리, 증거 `.moai/state/verify/f2f06653-455e-4f0b-a6b6-b69d14ecb2e5/design-pass/`):
  - 글자 그대로 옮김: acceptance.md §3.1·§3.2·§3.10의 표와 규칙 78줄이 system.md에 모두 같은 글자로 있다(`verbatim-check.txt`, `TOTAL expected=78 found=78`).
  - E-3 변수 이름: 쓴 이름은 모두 research.md:387~388(Monarch theme.css 확인 기록)의 이름이나 그 묶음 표기를 푼 것이다. 새로 지은 이름은 없다.
  - `npm run typecheck` exit 0, `npm run lint` exit 0(`Checked 94 files in 33ms. No fixes applied.`), `npm test` exit 0(`Test Files 38 passed (38)`, `Tests 551 passed (551)`, `Duration 12.43s`).
- M7 사전 점검으로 넘기는 항목(system.md §14에 "M7 사전 점검에서 실제 이름 확인"으로 표시됨):
  - 이름만 확인되고 역할은 확인되지 않은 Monarch 변수: `primary-over`·`primary-down`, `faint`·`faint-foreground`, `highlight`, `now`, `outline`, `selected` 계열, `secondary` 계열, `tertiary` 계열, `strong` 계열. 후보 토큰만 적혀 있다.
  - 포커스 `box-shadow`를 끌 해시 선택자의 실제 이름, 테마 CSS 하위 경로 이름(패키지 `exports`).
  - 캘린더 바탕을 `background`가 아니라 `card`에 연결한 것은 설계 판단이다(UR-5에서 확인).
- 문서 사이 사소한 표기 차이(다음 SPEC 개정 때 manager-spec이 맞춤): 접근 이름 형식이 acceptance.md:397에는 `"<라벨> · <HH:mm> · <고객 이름>"`, plan.md:444·plan.md:255·design.md 9.2에는 `HH:mm`(꺾쇠 없음)이다. system.md는 정본인 acceptance.md 형태를 따랐다.
- 확인하지 못한 것: Monarch 테마 CSS 원문, 범위 모드 시작·끝 칸과 주말 숫자 색이 겹칠 때의 대비(기존 검증 쌍에 기댐, 색 값 변화 없음), Drawer·Popover·NumberInput 모양(UR-9에서 확인), 마크다운 렌더링.

## §E.1 Plan-phase Audit-Ready Signal

```yaml
plan_complete_at: "2026-11-10T01:07:08+09:00"
plan_status: audit-ready
plan_audit:
  verdict: PASS
  score: 0.934
  threshold: 0.85
  iterations: 2
  report: .moai/reports/plan-audit/SPEC-UI-002-review-2.md
  pre_audit_lenses: .moai/reports/plan-audit/SPEC-UI-002-lenses-1/
spec_version: "0.3.0"
tier: L
harness: thorough
```

## §E.2 Run-phase Evidence

### M1 — 의존성·설정·API 스냅숏과 타입 (2026-11-10, manager-develop, cycle_type=tdd)

- M1 시작 SHA: cc36b4d
- 백엔드 출처: kmcbeauty-fastapi `eb8b06d`(내보내기 2026-11-10 11:21, 작업 트리 깨끗함, 내보내기 전후 `git status --short` 출력 없음)
- 증거 디렉터리: `.moai/state/verify/2478a668-aa6d-41e3-b880-f00c9220f306/m1/`(작업 트리에서 기록, 오케스트레이터가 주 체크아웃으로 옮김)
- M1 범위: plan.md §F M1에서 §E 설계 정본 개정을 뺀 나머지(설계 패스 커밋 69ce28c가 system.md 1.2.0을 이미 반영)

#### 사전 점검

| 점검 | 명령 | 결과 |
|---|---|---|
| `test.env.TZ`가 vitest 작업자에 닿는가 | `TZ=UTC npx vitest run src/test/timezone.test.ts` | `test.env.TZ`만 두고 통과(2 passed). `setup.ts`의 `process.env.TZ` 보강은 필요 없다. 같은 시험이 `TZ=America/New_York`에서도 통과 |
| R18: pre-commit `moai gate`가 빌드를 돌리는가 | `VITE_API_BASE_URL= moai gate` 전후 `stat -c '%y' dist/index.html` | `gate exit=0`, `dist/index.html` 수정 시각이 그대로(11:15:25). 빈 값으로는 빌드가 실패하므로(`VITE_API_BASE_URL= npm run build` → exit 1) 게이트는 빌드 단계를 돌리지 않는다. blocker 없음 |

#### 설치한 새 패키지(acceptance.md §3.4와 같음, `npm ls --depth=0`)

| 패키지 | 고정 버전 | 설치 버전 |
|---|---|---|
| `react-router` | 8.5.1 | 8.5.1 |
| `@tanstack/react-query` | 5.107.1 | 5.107.1 |
| `@fullcalendar/react` | 7.1.4 | 7.1.4 |
| `temporal-polyfill` | 1.0.8 | 1.0.8 |
| `openapi-fetch` | 0.17.0 | 0.17.0 |
| `msw`(dev) | 3.0.4 | 3.0.4 |
| `openapi-typescript`(dev) | 7.13.0 | 7.13.0 |

`engines.node`는 `^22.22.0 || ^24.0.0`. 고정 시험은 25 + 19 + engines를 단언한다.

#### 커밋

| SHA | 제목 |
|---|---|
| 6d870b7 | feat(SPEC-UI-002): M1 의존성 고정 25+19와 시험 시간대 고정 |
| fe474ea | feat(SPEC-UI-002): M1 운영 빌드 env 검사·앱 기준 주소·개발 프록시 |
| 4b389ef | feat(SPEC-UI-002): M1 OpenAPI 스냅숏·내보내기 스크립트·생성 타입 |
| ae883f9 | feat(SPEC-UI-002): M1 MSW 시험 장치·커버리지 범위 확대·앱 계층 규칙 |

#### 인수 기준(판정 HEAD ae883f9)

| AC | 판정 | 명령 | 관찰 |
|---|---|---|---|
| AC-UI-002-01 | PASS | `npx vitest run src/test/dependency-pins.test.ts` · `TZ=UTC npx vitest run src/test/timezone.test.ts` · §4.1 QG-12 두 검사 | 9 passed · 2 passed · 지정자 검사 exit=1·stderr 0바이트 · 자체 확인 2 · 키 검사 exit=0 |
| AC-UI-002-02 | PASS | `npx vitest run src/api/schema-sync.test.ts src/test/export-openapi.test.ts` | 8 passed(머리 값 3.1.0·31·50·58, CLI 재생성 동일, 쓰기 범위·환경 변수·3.0.3 거부) |
| AC-UI-002-03 | PASS | `npx vitest run src/test/vite-plugins.test.ts src/app/env.test.ts` · §4.1 AC-03 블록 | 14 passed · build exit=0, `dist/index.html` 11:32:23, grep exit=1·stderr 0바이트 |
| AC-UI-002-04 (가)(다) | PASS | `npx vitest run src/test/coverage-config.test.ts src/test/design-rules.test.ts` | 31 passed. (나)는 M4·M8 판정 |

#### 품질 게이트(판정 HEAD ae883f9, grep은 GNU grep 3.11)

| QG | 판정 | 관찰 |
|---|---|---|
| QG-01 | PASS | typecheck exit=0 |
| QG-02 | PASS | lint exit=0, 106개 파일, 경고 0 |
| QG-03 | PASS | 45 files / 590 tests passed, Duration 15.45s, 직후 uptime load average 15.67 |
| QG-04 | PASS | `VITE_API_BASE_URL=https://api-beauty.dongri.kr npm run build` exit=0, `dist/index.html` 11:32:27 |
| QG-05 | PASS | 기준 80/80/80/80, 줄 99.82 · 문장 98.42 · 함수 100 · 분기 96.16 |
| QG-06 | PASS | 39 passed |
| QG-07 | PASS | 22 passed |
| QG-08 | PASS | 27 passed(공개 이름 40·파일 29 유지) |
| QG-09 | PASS | `moai gate` exit=0(pwd=작업 트리, `CLAUDE_PROJECT_DIR` 없음, HEAD ae883f9). 커밋 4개 모두 훅 우회 없이 통과 |
| QG-10 | PASS | spec lint 오류 0, 경고 0 |
| QG-11 | PASS | 경계 검사 exit=1·stderr 0바이트, 자체 확인 2(양성·라벨 검사는 M6) |
| QG-12 | PASS | 지정자 검사 exit=1·stderr 0바이트, 자체 확인 2, 키 검사 exit=0 |
| QG-13 | PASS | `deploy-guard.test.ts` 5 passed |
| QG-14 | PASS | 9 passed(25 + 19 + engines) |
| QG-15 | PASS | 26 passed(전시 29개) |
| QG-16 | PASS | `schema-sync.test.ts` 통과(재생성 동일, 머리 값) |

#### RED 증거(구현 전 실패 출력)

| 묶음 | 파일 |
|---|---|
| 의존성 고정·engines | `red-01-dependency-pins.txt` |
| 시간대 | `red-02-timezone.txt` |
| env 검사·기준 주소·프록시 | `red-03-env-proxy-plugin.txt` |
| 내보내기 스크립트 | `red-04-export-openapi.txt` |
| 생성 타입 동기 | `red-05-schema-sync.txt` |
| MSW·IndexedDB 대역 | `red-06-msw-indexeddb.txt`(모듈 없음), `red-06b-msw-indexeddb.txt`(동작 실패 6건) |
| 커버리지 설정 | `red-07-coverage-config.txt` |
| 앱 계층 가져오기 규칙 | `red-08-design-rules.txt` |

#### 계획과 달라진 점

- `buildDevProxy`는 `vite.config.ts` 대신 `vite-plugins.ts`에 두었다. 같은 빌드 설정 도우미이고 커버리지 포함 대상이다. `vite.config.ts`는 개발 서버(`command === "serve"`)에서만 프록시를 만든다.
- 시험 장치 시험 `src/test/harness.test.ts`를 새로 두었다(B-9의 "처리하지 않은 요청이 실패로 보고되는지" 확인). 처리하지 않은 요청은 네트워크 오류로 끝내고 기록했다가 `setup.ts`의 `afterEach`가 시험 실패로 보고한다.
- `api:check`는 같은 스크립트의 `--check` 옵션으로 만들었다(임시 내보내기 결과를 `--out` 경로의 스냅숏과 비교하고 아무것도 쓰지 않는다).
- `vite.config.ts`가 `./vite-plugins.ts`를 확장자와 함께 가져오도록 하고 `tsconfig.json`에 `allowImportingTsExtensions`를 더했다(Vite native 설정 로더 경고 제거).

#### 관찰(조치하지 않음)

- 백엔드가 M1 도중(2026-11-10 11:29) `c626dd3`로 빨리 감기되었다(다른 작업, 이 실행은 백엔드에 쓰지 않음). `api:check` 결과 차이는 `DELETE /users/me/force`의 `description` 글 한 줄뿐이고 머리 값(3.1.0·31·50·58)은 같다. R3에 따라 스냅숏을 다시 내보내지 않았다. 차이: `final-api-drift-eb8b06d-vs-c626dd3.diff`.
- `vite-plugins.ts:20`(https 주소의 빈 호스트 분기)은 `new URL`이 먼저 던져 도달하지 않는 방어 분기다.

#### 오케스트레이터 재검증(2026-11-10)

- 대상: 작업 트리 브랜치 `worktree-agent-aadb15dba7b55a5f5`의 HEAD `3d664cb`(M1 커밋 5개, `cc36b4d..3d664cb`, 파일 28개). 증거: `.moai/state/verify/2478a668-aa6d-41e3-b880-f00c9220f306/m1-orchestrator/`.
- 범위: PRESERVE 경로(`src/ui-core/`·`src/preview/`·`src/styles/`·`deploy.sh`·`deploy-guard.test.ts`·`.moai/design/`) 변경 0건(grep exit=1). spec.md 변경은 `status: draft → in-progress` 한 줄이다. `.moai/specs` 아래 중첩 `.moai` 폴더는 없다.

| 확인 | 결과 |
|---|---|
| QG-01·QG-02 | typecheck exit=0, lint exit=0(106개 파일) |
| QG-03 | `npm test` exit=0, 45 files / 590 tests passed, Duration 10.20s, 직후 load average 7.63 |
| QG-05 | `npm run test:coverage` exit=0, 줄 99.82 · 문장 98.42 · 함수 100 · 분기 96.16 |
| QG-09 | `moai gate` exit=0(작업 트리, HEAD 3d664cb) |
| QG-04·AC-03(다) | 빌드 exit=0(`dist/index.html` 11:39:07), 프록시 표식 grep exit=1·stderr 0바이트. `VITE_API_BASE_URL=` 빌드와 `http://api.example.test` 빌드는 둘 다 exit=1 |
| QG-10 | spec lint 결과 없음 |
| QG-11·QG-12 | 경계 검사·지정자 검사 exit=1·stderr 0바이트, 자체 확인 2·2, `package.json` 키 검사 exit=0(GNU grep 3.11) |
| AC-01 | 새 패키지 7개의 설치 버전이 §3.4와 같다. `TZ=UTC` 시간대 시험 2 passed |
| AC-02 | 스냅숏 머리 값 3.1.0 · 31 · 50 · 58 |
| 주 체크아웃 | `moai worktree verify` exit=0(HEAD·브랜치·추적 파일 변화 없음) |

- 통합: 주 체크아웃에서 `git merge --ff-only` 뒤 `git push origin main`(`cc36b4d..3d664cb`, 차이 `0 0`). 작업 트리의 증거 53개를 위 증거 디렉터리의 `m1/`로 옮긴 뒤 작업 트리와 임시 브랜치를 지웠다. 주 체크아웃은 `npm ci` 뒤 typecheck exit=0이다.
- 백엔드 드리프트 판단: 백엔드 reflog에 2026-11-10 11:29:24 `pull --ff-only`(`eb8b06d → c626dd3`)가 있다. 이 SPEC 밖의 작업이다. 스냅숏과의 차이는 `DELETE /users/me/force`의 설명 글 하나이고, 이 엔드포인트는 범위 밖인 계정 관리 기능이다(plan.md §M.2). REQ-002·AC-02가 스냅숏 출처를 `eb8b06d`로 정했으므로 스냅숏은 그대로 둔다. 다시 맞추려면 R3 절차(blocker → REQ-002·AC-02·QG-16 개정 → `api:sync`)를 밟는다. 그 전까지 `api:check`의 exit 1은 예상된 결과이며, 다음 위임 지시문에 이 사실을 적는다.
- 작업 트리 환경: `.worktreeinclude`가 주 체크아웃의 `.env`를 작업 트리로 복사하고, 그 안의 값은 예전 API 주소다. 검증 명령은 앞에 넘긴 `VITE_API_BASE_URL`이 이 값을 덮어쓴다. 로컬 `.env` 정리는 동기화 단계의 README 항목(S-F10)에서 다룬다.

## §E.3 Run-phase Audit-Ready Signal

_<pending run-phase>_

## §E.4 Sync-phase Audit-Ready Signal

_<pending sync-phase>_

## §F Phase 4 Mode Selection

- 입력: tier L · 새 파일 약 110개, 수정 약 45개(plan.md 요약, 추정) · 도메인 5개(설정·API와 인증·ui-core·업무 화면·배포와 보안) · 언어 TypeScript/TSX, CSS, Markdown, bash(`deploy.sh`) · 동시 실행 이점 낮음(코딩 중심, M2 → M4 → M5~M7 의존)

| 모드 | 선택 | 이유 |
|---|---|---|
| direct | 아님 | 구현 범위가 크다 |
| serial | **선택** | 마일스톤 사이 의존이 강한 코딩 작업이고, 쓰기 에이전트는 한 번에 하나만 둔다 |
| fanout | 아님 | 연구 중심 작업이 아니다. 조사는 계획 단계에서 끝났다 |
| sweep | 아님 | 한 가지 기계적 변환을 여러 파일에 반복하는 작업이 아니다 |
| agent-team | 아님 | 명시 요청이 없다 |

- Decision: serial
- Justification: plan.md F.9가 적은 대로 마일스톤 사이 의존이 강하고, 병렬로 나눌 독립 작업은 M3 정도다. 그래서 마일스톤마다 manager-develop 하나를 차례로 부르고, M1 앞에 manager-design 설계 패스를 한 번 둔다. 코딩 작업은 연구보다 진짜로 병렬화할 몫이 적다는 Anthropic의 지적과도 맞는다.
- Boundary Case: manager-lead 진입 조건(마일스톤 3개 이상, 파일 10개 이상, 도메인 간 분산)은 충족한다. 하지만 tie-breaker "코딩 중심 + 여러 도메인 → serial"을 따랐고, C3의 빨리 감기 통합을 마일스톤마다 오케스트레이터가 직접 확인하는 편이 안전하다.
