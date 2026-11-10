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

### M2 — API 클라이언트·인증 세션·오류 계층 (2026-11-10, manager-develop, cycle_type=tdd)

- M2 시작 SHA: 9010753(작업 트리 브랜치 `worktree-agent-ae76c2d44abc4d848`, 밀어 올리지 않음)
- 증거 디렉터리: `.moai/state/verify/e545850e-8214-419f-8a10-cc4b0eb89c6d/m2/`(작업 트리에서 기록)
- 시작 기준선(9010753): typecheck exit=0, lint exit=0(106개 파일), `npm test` 45 files / 590 tests passed(Duration 13.71s) — `preflight-*.txt`
- M2 범위: plan.md §F M2(§B.1 전부). M3·M4 작업은 하지 않았다. 패키지 추가 없음, 스냅숏·생성 타입 손대지 않음(`api:sync`·`api:export` 실행 안 함)

#### 사전 점검(openapi-fetch 0.17.0, research.md §9)

| 점검 | 결과 |
|---|---|
| `onResponse`가 응답을 바꿀 수 있는가 | 된다. `coreFetch`가 반환값이 `Response`인지 검사하고 바꾼다. `options.fetch`로 다시 보낸 요청은 미들웨어를 거치지 않아 재시도가 구조적으로 1회다. 본문은 `onRequest`에서 `clone()`해 두면 보존된다(임시 시험 실측 후 삭제) |
| `credentials`를 요청마다 정하는 방법 | 전역 `createClient({ credentials })`와 호출별 `init`, `onRequest`에서 `new Request(req, { credentials })` 모두 된다 |
| 실측 주의 | MSW 3 처리기가 받는 `request.credentials`는 언제나 `"same-origin"`이다(MSW가 요청을 다시 만든다). 그래서 쿠키 전송 범위는 `createApiClient`에 넣는 기록용 `fetch`(`src/test/msw/request-log.ts`)에서 판정한다 |
| 고른 구현 | 래퍼가 아니라 미들웨어. 기록: `precheck-openapi-fetch.md` |

#### 커밋

| SHA | 제목 |
|---|---|
| 75ec477 | feat(SPEC-UI-002): M2 오류 정규화와 쿼리 기본값 |
| 350d866 | feat(SPEC-UI-002): M2 외부 저장소와 메모리 세션·single-flight 갱신 |
| 5b695b7 | feat(SPEC-UI-002): M2 API 클라이언트 미들웨어 — 401 갱신 재시도와 매장 미선택 |
| 9b99672 | feat(SPEC-UI-002): M2 쿼리 키 공장과 인증·매장 쿼리 훅 |
| a40ad7e | test(SPEC-UI-002): M2 로그아웃 시험의 판정 뒤 응답 처리를 진짜 타이머로 |

#### 인수 기준(판정 HEAD a40ad7e)

| AC | 판정 | 명령 | 관찰 |
|---|---|---|---|
| AC-UI-002-05 (가)(나)(다) | PASS | `npx vitest run src/api/session.test.ts` | 21 passed. 저장소 쓰기·쿠키 설정자·`indexedDB.open` 0회, 쿼리·변경 캐시와 세션 모듈 값에 `refresh-` 없음, 새로고침 흉내 뒤 갱신 1회(본문 없음, include)와 `Bearer access-2`, 로그아웃 500·네트워크·응답 없음 세 경우 즉시 비움 + include 1회. (라)는 M4 |
| AC-UI-002-06 (가)~(사) API 부분 | PASS | `npx vitest run src/api/client.test.ts src/api/session.test.ts` | 40 passed. 갱신 1회·각 요청 2회·재시도 `Bearer access-2`, 갱신 401 → 만료 처리기 1회, 재시도 401 → 갱신 늘지 않음, 로그인 401 → 갱신 0회, 네트워크·429·503 → 그 종류 오류·만료 0회·세션 유지, EC-01·EC-02·EC-03·EC-31·EC-32, 모든 요청 기록에서 include는 인증 3개 경로에만·`X-Refresh-Token` 없음. (나)의 화면 부분은 M4 |
| AC-UI-002-07 (다) + (가) 처리기 호출 | PASS | `npx vitest run src/api/client.test.ts src/api/query-keys.test.ts` | 28 passed. §3.11 키 6행 일치, `SHOP_NOT_SELECTED` → 처리기 1회. 화면 부분은 M5 |
| AC-UI-002-08 | PASS | `npx vitest run src/api/errors.test.ts src/api/query-client.test.ts` | 53 passed. §3.2 표 전부 정규화, 4xx·취소 1회 / 500·503·네트워크 3회 / 변경 1회, 키 변경 시 앞 `signal.aborted === true`·최종 데이터 "김민"·`error` null |
| S0 결정 | PASS | 위 AC-06 명령 | `client.test.ts > 첫 방문 S0(만료 문구 없음) > 메모리 토큰 없이 ensureSession()의 갱신이 401이면 false이고 만료 처리기를 부르지 않는다` ✓, 같은 묶음의 "토큰 없이 보낸 요청이 401이고 갱신도 401이면 만료 처리기를 부르지 않는다" ✓ |

#### 품질 게이트(판정 HEAD a40ad7e, grep은 GNU grep 3.11)

| QG | 판정 | 관찰 |
|---|---|---|
| QG-01 | PASS | typecheck exit=0 |
| QG-02 | PASS | lint exit=0, 125개 파일, 새 지적 0건(기준선 106개 파일 0건) |
| QG-03 | PASS | 53 files / 703 tests passed, Duration 15.10s, 직후 uptime load average 11.65, 11.99, 10.52(9b99672에서는 22.06s, load 11.03) |
| QG-04 | PASS | `VITE_API_BASE_URL=https://api-beauty.dongri.kr npm run build` exit=0, `dist/index.html` 13:10:21 |
| QG-05 | PASS | 기준 80/80/80/80, 줄 99.72 · 문장 98.43 · 함수 99.28 · 분기 95.48 |
| QG-06 | PASS | 39 passed |
| QG-07 | PASS | 22 passed |
| QG-08 | PASS | 27 passed(공개 이름 40·파일 29 유지, 새 앱 파일도 검사 대상) |
| QG-09 | PASS | `moai gate` exit=0(pwd=작업 트리, `CLAUDE_PROJECT_DIR` 없음, HEAD a40ad7e). 코드 커밋 5개 모두 훅 우회 없이 통과. 진행 기록 커밋의 첫 시도는 pre-commit `moai gate`가 막았다(아래 관찰) |
| QG-10 | PASS | spec lint 결과 없음 |
| QG-11 | PASS | 경계 검사 exit=1·stderr 0바이트, 자체 확인 2(양성·라벨 검사는 M6). 9b99672에서 실행, 9b99672..a40ad7e 차이는 `src/api/session.test.ts` 하나라 검사 대상과 무관 |
| QG-12 | PASS | 지정자 검사 exit=1·stderr 0바이트, 자체 확인 2, 키 검사 exit=0(실행 HEAD는 QG-11과 같음) |
| QG-13 | PASS | `deploy-guard.test.ts` 5 passed |
| QG-14 | PASS | 9 passed |
| QG-15 | PASS | 26 passed(전시 29개) |
| QG-16 | PASS | `schema-sync.test.ts` 2 passed |

#### RED 증거(구현 전 실패 출력)

| 묶음 | 파일 |
|---|---|
| 오류 정규화 | `red-01-errors.txt`(모듈 없음) |
| 쿼리 기본값·재시도·취소 | `red-02-query-client.txt`(모듈 없음) |
| 외부 저장소 | `red-03-external-store.txt`(모듈 없음) |
| 세션·갱신 결과·single-flight | `red-04-session-refresh.txt`(모듈 없음) |
| 클라이언트 미들웨어 | `red-05-client.txt`(모듈 없음) |
| 쿼리 키 | `red-06-query-keys.txt`(모듈 없음) |
| AC-05 흐름·인증 훅 | `red-07-auth-flow.txt`(모듈 없음) |
| 매장 훅 | `red-08-shops-queries.txt`(모듈 없음) |

#### 계획과 달라진 점

- design.md §4.1의 미들웨어 세 개(`auth`·`retry`·`shop`)를 하나로 합쳤다. `onResponse`는 등록 역순으로 돌아서, 나누면 매장 검사가 재시도 전 응답을 볼 수 있다. 같은 규칙을 한 미들웨어 안의 순서로 정했다(재시도한 응답의 `SHOP_NOT_SELECTED`도 처리기 1회 — 시험 있음).
- `createApiClient`가 `configureSession({ baseUrl, fetch })`로 세션 모듈에 기준 주소와 fetch를 넘긴다. design.md §4.3의 `refreshSession()`·`ensureSession()`이 인자 없이 불리기 때문이다. fetch는 부를 때 찾는다(모듈 적재 때 `globalThis.fetch`를 잡으면 MSW 시험에서 실제 네트워크로 나간다 — 첫 GREEN 실행에서 실측).
- 갱신이 이미 끝난 뒤 옛 토큰으로 보낸 요청의 401은 다시 갱신하지 않고 새 토큰으로 한 번 보낸다(겹친 갱신 방지 보강, 시험 있음).
- 만료 처리기는 같은 갱신 결과에 한 번만 부른다(동시 401 세 개 → 1회, AC-06 (나)). 쿼리 캐시 비우기는 design.md §4.2대로 주입한 처리기의 일이며, 시험은 처리기에서 `queryClient.clear()`를 불러 캐시 0개를 확인한다.
- S0: 토큰 없이 보낸 요청의 401도 갱신은 시도하지만(쿠키가 있으면 복구), 갱신이 401이면 만료 처리기를 부르지 않는다.
- 키 공장에 매장 범위 접두사 `qk.shopScope()`(`["shop"]`)를 더했다. 매장 전환의 `removeQueries`가 이 함수를 쓴다.
- 훅은 클라이언트를 인자로 받는다(`useMe(client)` 등). 클라이언트를 어디에 둘지(컨텍스트 등)는 앱 조립(M4) 때 정한다.
- 로그인 응답에 `access_token`이 없으면(EC-04) status 502·서버 문구의 `ApiError`로 실패시킨다(정본 표에 이 경우의 status가 없어 서버 문제로 분류).
- §3.2 메모에 따라 409 표본 코드를 백엔드 실제 이름 `PHONEBOOK_CONFLICT`로 맞췄다(`kmcbeauty-fastapi/app/exceptions.py` 기본 코드 + `phonebook_service.py` `DOMAIN = "PHONEBOOK"`). `PHONEBOOK_NOT_FOUND`·`SHOP_NOT_SELECTED`는 같다.
- 표에 없는 4xx는 400 문구, 표에 없는 5xx는 서버 문구로 둔다(정본 표 밖의 기본값).
- 시험 장치에 `src/test/msw/request-log.ts`(fetch 층 요청 기록)를 더했다. `src/features/auth`·`src/features/shops`에 훅 시험을 더했다. `src/api/session.test.ts`는 AC-05 판정 때문에 `@/features/auth/queries`를 가져온다(시험 파일만, 앱 코드의 API → features 의존은 없음 — `final-api-boundary-grep.txt`).

#### 관찰(조치하지 않음)

- 백엔드 실제 `SHOP_NOT_SELECTED` 응답의 `hint`는 `"redis에 만료되거나 없음."`(개발자용 글)이다. 정규화는 `hint`를 그대로 담으므로 화면이 `hint`를 보이면 이 글이 나온다. 화면에서 `hint` 노출 여부는 M4 이후 판단.
- MSW 처리기에서 `request.credentials`가 보이지 않는 점은 이후 마일스톤의 시험도 같은 기록용 fetch를 써야 한다는 뜻이다.
- 앱 코드의 저장소 문자열 검색(`final-token-storage-grep.txt`)은 `session.ts` 맨 위 주석 두 줄만 잡는다(코드 사용 0건).
- 진행 기록 커밋의 첫 시도에서 pre-commit `moai gate`가 실패했다(6 failed / 697 passed, Duration 32.47s, 직후 load average 35.06). 다섯 개는 다른 세션의 부하로 ui-core·design-rules 시험이 기본 제한 시간을 넘긴 것이고(단독 재실행 통과), 하나는 M2 로그아웃 500 시험이었다. 그 시험은 부하가 없어도 가짜 타이머가 켜진 채 시험 정리가 약 4초 멈췄다(본문은 0ms에 끝나고 다음 정리 단계까지 4,000ms — 시각 기록으로 확인, 앞 묶음 "refreshSession 결과"와 함께 돌 때만 재현). 판정 뒤 요청 전달 확인부터 진짜 타이머로 바꿔(a40ad7e) 3ms가 됐다. 멈춤의 정확한 원인(MSW·undici 내부의 어느 타이머인지)은 확인하지 않았다. 판정 자체는 그대로 가짜 타이머를 흘리지 않은 상태에서 한다.
- 새 파일 커버리지: `client.ts` 문장 97.56·분기 94.11·함수 88.88(73행 `?? ""` 분기, 91행 기본 fetch 화살표 함수), `session.ts` 분기 83.33(16행 기본 fetch 화살표 함수) — 시험은 언제나 fetch를 주입한다.

#### 감사 결함 F1 수정(1회차)

- 2026-11-10, manager-develop, cycle_type=tdd, 수정·평가 1회차(최대 3회). 시작 HEAD 23b0d62, 작업 트리 브랜치 `worktree-agent-af0577476753c767d`(밀어 올리지 않음)
- 증거 디렉터리: `.moai/state/verify/e545850e-8214-419f-8a10-cc4b0eb89c6d/m2-fix1/`
- 시작 기준선: `npx vitest run src/api src/features src/lib` 9 files / 115 tests passed

**결함**(M2 단계별 sync-auditor 검토, 23b0d62에서 재현)

| 결함 | 등급 | 내용 |
|---|---|---|
| F1 | Medium, 차단 | 갱신이 진행 중일 때 로그아웃하면 늦게 온 갱신 응답이 새 토큰을 저장한다(`afterLogout= null afterRefreshSettled= access-2`) |
| F2 | Low | 갱신 401 뒤 그 갱신 전에 보낸 요청의 401이 늦게 오면 갱신과 만료 처리기가 한 번 더 불린다(`refreshCount= 2 expiredCalls= 2`) |
| F6 | Low | 같은 경합에서 재전송이 빈 `Authorization: Bearer `를 보낼 수 있다(`?? ""`) |

**원인**: 갱신 결과와 401 응답을, 그것을 낸 세션이 아니라 결과가 도착한 순간의 세션에 적용했다. 세션 세대가 각 갱신과 요청을 그것을 시작한 세션에 묶으므로, 로그아웃 시점을 조정하는 대신 낡은 결과가 상태를 바꾸려는 바로 그 지점에서 버려진다.

**RED 증거**(구현 전): `npx vitest run src/api/session.test.ts src/api/client.test.ts src/features/auth/queries.test.ts` → 6 failed / 43 passed(`red-F1-F2.txt`). 실패 내용: F2 갱신 2회(1회 기대), F6 재전송 응답 status undefined(401 기대), F1 `ensureSession()`이 true(false 기대)·토큰 `access-2`(null 기대), 새 로그인 뒤 늦은 200이 true를 돌려줌·늦은 401이 새 토큰 `access-9`를 지움. 네트워크 오류 분기는 따로 RED를 받았다(`red-F1-stale-branches.txt`, 1 failed: 거부 대신 false 기대).

**수정**(`src/api/session.ts`, `src/api/client.ts`)

- `clearSession()`(로그아웃·갱신 401)이 모듈 수준 세션 세대를 올린다. 갱신 성공은 올리지 않는다(편차 4 — 옛 토큰 401의 새 토큰 재전송 — 유지).
- `refreshSession()`은 시작할 때 세대를 잡는다. 끝났을 때(응답 도착·네트워크 오류) 세대가 바뀌었으면 아무것도 저장하거나 지우지 않고 false다. `inflight`를 지우는 시점은 그대로다.
- 401 재시도 미들웨어는 보낼 때의 세대를 복제본 옆에 기록한다. 세대가 바뀐 뒤 온 401은 갱신·재전송·만료 처리기 없이 그 401로 끝난다.
- 다시 보낼 토큰이 없으면 빈 Bearer를 보내지 않고 원래 401로 끝난다(`?? ""` 삭제).
- 지시에 없던 추가 한 가지: `isSessionExpired()`. 토큰을 실어 보낸 요청의 401이 갱신을 기다리는 동안 로그아웃하면, 세대 확인만으로는 낡은 갱신의 false를 만료로 보고 만료 처리기를 불렀다. 마지막 세션 삭제가 갱신 401에서 왔을 때만 만료 처리기를 부른다. 이 조건을 뺀 돌연변이 실행에서 해당 시험이 실패한다(`mutation-no-isSessionExpired.txt`, 1 failed: 만료 처리기 1회 호출).
- 두 `@MX:WARN`/`@MX:REASON`(`refreshSession`, 401 재시도)에 세대 확인을 적었다.

**지시에 없던 경우의 관찰**: 로그아웃 뒤 새 로그인이 앞선 갱신보다 먼저 끝나면, 앞선 갱신의 늦은 200·401 모두 새 토큰 `access-9`를 바꾸지 않고 `ensureSession()`은 false다(시험 2건). 이때 앞선 갱신이 아직 `inflight`이면 새 토큰으로 보낸 요청의 401이 그 낡은 갱신에 합류해 false를 받고, 만료 처리기 없이 401로 끝난다(시험 없음, 코드 읽기로 판단).

**하지 않은 것**: 갱신 응답 본문을 읽는 사이의 로그아웃 확인은 넣지 않았다. 본문을 붙잡는 스트림으로 시험하면 확인이 없어도 통과했다(이 MSW·fetch 환경에서는 로그아웃이 `fetch`가 풀리기 전에 끝나 첫 확인이 잡는다). 실패를 보일 수 없는 분기라 넣지 않고 그 시험도 지웠다. F3·F4·F5·F7·F8·F10은 범위 밖.

**새 시험**(7건): `src/api/session.test.ts` "감사 결함 F1 — 갱신 중 로그아웃" 5건(P1 새로고침 흉내, 토큰 실은 요청, 새 로그인 200·401, 네트워크 오류), `src/api/client.test.ts` 2건(P2 늦은 401, F6 빈 Bearer — 구독자가 알림 안에서 세션을 지우는 일부러 만든 재현)

**GREEN·게이트**(판정 HEAD 1d3e22d)

| 항목 | 결과 |
|---|---|
| 대상 3개 파일 | 3 files / 50 tests passed(`green-F1-F2.txt`) |
| typecheck | exit=0 |
| lint | exit=0, 125개 파일(첫 실행은 `session.test.ts` 서식 1건 → `biome format --write`로 고친 뒤 통과) |
| `npm test` | 53 files / 710 tests passed, Duration 14.57s, 직후 load average 10.10, 6.41, 7.60 |
| `npm run test:coverage` | 문장 98.46 · 분기 95.68 · 함수 99.29 · 줄 99.73(기준 80/80/80/80). `client.ts` 문장 97.67·분기 97.22·함수 88.88, `session.ts` 문장 98.18·분기 86.66·함수 94.11 |
| `moai gate` | exit=0(pwd=작업 트리, HEAD 1d3e22d), pre-commit도 우회 없이 통과 |

**커밋**

| SHA | 제목 |
|---|---|
| 1d3e22d | fix(SPEC-UI-002): M2 로그아웃 중 갱신 응답이 토큰을 되살리지 않게 세션 세대 확인 |

#### 오케스트레이터 재검증과 독립 평가(2026-11-10)

- 세션 `e545850e-8214-419f-8a10-cc4b0eb89c6d`, 시작 HEAD `9010753`(차이 `0 0`, 작업 트리는 주 체크아웃 하나). 증거는 `.moai/state/verify/e545850e-8214-419f-8a10-cc4b0eb89c6d/`의 `m2/`·`m2-orchestrator/`·`m2-fix1/`·`m2-fix1-orchestrator/`다(에이전트 증거는 작업 트리에서 옮김).
- 계획 감사 관문: 캐시 적중을 다시 확인했고 plan-auditor는 부르지 않았다. spec·plan·acceptance·design·research의 sha256이 §A.10 기록과 같고, spec.md는 M1의 run 단계 소유 전환인 `status: draft → in-progress` 한 줄만 다르다. 일별 기록 `.moai/reports/plan-audit/SPEC-UI-002-2026-11-10.md`의 "Audit Run 2"에 남겼다.
- M2 재검증(에이전트 작업 트리, HEAD `23b0d62`): typecheck 0, lint 0(125개 파일), `npm test` 53 files / 703 tests(Duration 14.66s, load 10.13), AC 시험 5개 파일 102개 통과, 커버리지 98.43 · 95.48 · 99.28 · 99.72, 빌드 0, `moai gate` 0, spec lint 지적 없음, QG-11·12 exit 1·stderr 0바이트·자체 확인 2·2, 게이트별 시험 파일 130/130(QG-06 39, QG-07 22, QG-08 27, QG-13 5, QG-14 9, QG-15 26, QG-16 2), 보호 경로 변경 0, 주 체크아웃 `moai worktree verify` 0. `git merge --ff-only` 뒤 `git push origin main`(`9010753..23b0d62`).
- 독립 평가 1차(sync-auditor, `.moai/reports/sync-audit/SPEC-UI-002-M2.md`): **FAIL**, 조화 평균 84.5(기능 85 · 보안 75 · 품질 90 · 일관성 90). M2에서 판정하는 AC 부분은 모두 통과했고 일탈 11건도 모두 수용됐다. 차단 결함은 F1(로그아웃 중 갱신 응답이 토큰을 되살림, 탐침 `afterLogout= null afterRefreshSettled= access-2`)이고, F2·F6을 함께 고쳤다.
- 수정 1회차 재검증(HEAD `aacd03f`): typecheck 0, lint 0, `npm test` 53 / 710(Duration 17.97s, load 16.12), `src/api src/features src/lib` 9개 파일 122개 통과, 빌드 0, `moai gate` 0. 첫 `npm run test:coverage`는 손대지 않은 `src/preview/PreviewPage.test.tsx` 한 건이 시간 초과(7383ms > 5000ms, load 16)로 exit 1이었고, 한 번 다시 실행해 53 / 710 통과, 98.46 · 95.68 · 99.29 · 99.73이었다. 합치기 직전에 남아 있던 0바이트 `.git/index.lock`(13:44:16, 실행 중인 git 없음)을 지운 뒤 `23b0d62..aacd03f`로 합치고 푸시했다. 주 체크아웃에서 다시 돌린 `moai gate`는 exit 0이다(`m2-fix1-orchestrator/qg09-gate-primary.txt`. 성공하면 출력이 비므로 종료 코드를 따로 적는다).
- 차분 재감사(`.moai/reports/sync-audit/SPEC-UI-002-M2-rereview-1.md`): **PASS**, 87.3(기능 90 · 보안 80 · 품질 90 · 일관성 90). F1·F2·F6이 닫혔다(탐침 `afterRefreshSettled= null`, `refreshCount= 1 expiredCalls= 1`). 구현자가 더한 `isSessionExpired()`는 S0 결정에 맞는 최소 변경으로 판정됐다.

**넘기는 항목과 사용자 결정(2026-11-10, AskUserQuestion)**

| ID | 내용 | 처리 |
|---|---|---|
| N1 | 로그인이 세션 세대를 올리지 않는다. 로그아웃 없이 다시 로그인하면 그 전에 시작된 갱신의 늦은 결과가 새 토큰을 덮어쓴다(탐침 `afterLogin= access-userB afterBootRefreshSettled= access-userA`, 수정 전부터 있던 결함) | **사용자 결정: M4 첫 커밋.** 탐침 P8·P8b를 시험으로 옮겨 실패를 확인한 뒤, 로그인 때 세대를 올리는 `startSession(token)`으로 고친다 |
| F5 | 인증 3개 경로 밖 요청의 `credentials: "same-origin"`(개발 프록시에서 리프레시 쿠키가 다른 요청에도 실릴 수 있음, 추론) | **사용자 결정: `"omit"`으로 바꾼다.** 코드와 시험은 M4, design.md §4.1 문구는 sync 단계 |
| F3 | 백엔드 `hint`가 개발자용 글이다(`"놉"`, `"redis에 만료되거나 없음."`, `"전화번호 중복 확인하쇼."`) | **사용자 결정: 화면에 보이지 않는다.** 정규화 결과에는 남기고(AC-08), M4·M5 화면 시험에 "hint를 그리지 않는다" 단언을 둔다. 계획 문서는 고치지 않는다 |
| F4 | 로그인 비밀번호가 변경 캐시의 `variables`에 남는다(기본 gcTime 5분) | M4: 로그인 변경에 `gcTime: 0` 또는 성공 뒤 `reset()` |
| F8 | `configureSession`이 모듈 전역 설정을 덮어쓴다 | M4: 클라이언트를 한 번만 만드는지 확인 |
| N2 | 새 세션의 401이 이전 세대의 진행 중 갱신에 합류해 401로 끝난다(구간이 매우 좁음) | 선택. M4에서 N1과 함께 검토 |
| F10 | 실제 409 응답의 기본 `detail`이 "요청이 충돌되었습니다."다 | M5: 고객 폼이 필드 오류로 바꾸는지 확인 |
| F7·N3 | design.md §4.1의 미들웨어 3개 그림, §4.2·§4.3에 세대 규칙과 `isSessionExpired()`가 없다 | sync 단계 문서 갱신 |

- 다음 마일스톤은 M3다. 착수 결정대로 독립 평가는 M4·M8 직후에 한다.

### M3 — ui-core 후속 과제 15건과 새 공개 컴포넌트 4개 (2026-11-10, manager-develop, cycle_type=tdd)

- M3 시작 SHA: 7677aa7(작업 트리 브랜치 `worktree-agent-adbe3c628019ad700`, 밀어 올리지 않음). 코드 트리는 aacd03f와 같다
- 증거 디렉터리: `.moai/state/verify/f64b7914-6a56-4436-86f6-7a9eef484222/m3/`(작업 트리에서 기록)
- 시작 기준선(7677aa7): typecheck exit=0, lint exit=0(125개 파일), `npm test` 53 files / 710 tests passed(Duration 16.82s, 직후 load average 12.56) — `preflight-*.txt`. AC-23 기준선 `m3-baseline.json`: 시험 파일 53개·시험 710개 전부 통과(첫 M3 커밋 전에 기록)
- M3 범위: plan.md §F M3. 후속 과제 1·2·4·6~17, 새 컴포넌트 4개와 Calendar 범위 모드, 미리보기 전시, 잠금 44·33. 패키지 추가 없음(기존 `@radix-ui/react-dialog`·`@radix-ui/react-popover`·`react-day-picker` 재사용), 라우터·화면·폼 훅·CSP·deploy.sh 손대지 않음

#### 사전 점검

| 점검 | 결과 |
|---|---|
| 브랜치·HEAD·상태 | `worktree-agent-adbe3c628019ad700`, 7677aa7, 깨끗함. 작업 트리에 `node_modules`가 없어 `npm ci`(281개, exit 0) |
| grep 판본 | `/usr/bin/grep --version` → `grep (GNU grep) 3.11`. 이 셸의 맨 이름 `grep`은 셸 함수(ugrep 7.8.4)라 증거용 grep은 모두 `/usr/bin/grep`으로 불렀다 |
| react-day-picker 10 범위 API | `mode="range"`, `onSelect(selected, triggerDate, modifiers, e)`. 시작만 고른 상태(`to` 없음)에서는 라이브러리 `range_start` 수정자가 붙지 않아(첫 GREEN 실행에서 실측) 시작·끝·사이 수정자를 직접 계산했다 |
| Radix Popover 1.3.1 트리거 | `aria-controls`는 열렸을 때만 붙는다(닫힌 상태에서 없는 id를 가리키지 않음, 실측) |

#### M3 시작 기록(acceptance.md §3.10 항목 7·8·11, `m3-start-record.txt`)

7677aa7 트리를 `git grep`으로 세고, 같은 값을 작업 트리에서 `/usr/bin/grep`으로 다시 확인했다(세 문자열이 든 줄은 결함 수정 1·2·4가 바꾸지 않았다).

| 항목 | 문자열·줄 | 시작 개수 |
|---|---|---|
| 7 포커스 링 | `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring` | 시험 밖 12개 파일 13곳(breadcrumb·button·calendar·checkbox·date-time-picker·filter·input·select(2)·sidebar·table·tabs·toast). 이어 붙인 문자열을 담은 시험 파일 0개. 세 클래스를 나눠 단언하는 시험 파일 18개 |
| 8 선택 상태 | `bg-primary-subtle font-semibold text-primary-subtle-foreground hover:bg-primary-subtle hover:text-primary-subtle-foreground forced-colors:border-2` | 시험 밖 3개 파일 각 1곳(filter·pagination·sidebar), 시험 파일 0개 |
| 11 Pagination 맨 숫자 | `src/ui-core/pagination.tsx:25:  if (page >= pageCount - 3) {` | 1줄 |
| 16 `size="md"` 호출부 | `src/preview/sections/OverlaysSection.tsx:146:          <SizeDemo size="md" label="기본 대화상자" />` | 1곳(+ `modal.tsx` 기본값·타입, `showcase.ts`·`PreviewPage.test.tsx` 전시 표의 `"md"`) |

#### 커밋

| SHA | 제목 |
|---|---|
| fcad41c | fix(SPEC-UI-002): M3 Modal을 밖에서 닫으면 버리기 확인 초기화 |
| c67830d | fix(SPEC-UI-002): M3 DateTimePicker가 간격 밖 시각을 바꾸지 않고 보이게 |
| ae80cc3 | fix(SPEC-UI-002): M3 DefaultLink 링크 스킴 허용 목록 |
| a0be727 | refactor(SPEC-UI-002): M3 Combobox 새 값 만들기 조건을 canCreate로 합침 |
| 4e63143 | refactor(SPEC-UI-002): M3 포커스 링·선택 상태 클래스를 internal/class-names.ts로 |
| 75a4495 | refactor(SPEC-UI-002): M3 외부 저장소와 포커스 복귀를 ui-core internal로 |
| da7e0fc | test(SPEC-UI-002): M3 setup.ts의 canvas 빈 구현과 저장소 초기화 |
| 9010c0c | refactor(SPEC-UI-002): M3 Search 병합 ref를 useCallback으로 메모 |
| 00dc75e | refactor(SPEC-UI-002): M3 Pagination 끝 묶음 판정의 맨 숫자 3을 이름 붙은 상수로 |
| 78544a8 | refactor(SPEC-UI-002): M3 Loading·Skeleton 크기·변형을 cva로 |
| 2016918 | refactor(SPEC-UI-002): M3 ToastTone을 공용 Tone에서 파생 |
| e6c40ac | refactor(SPEC-UI-002): M3 Modal 중간 크기 이름 md를 default로 |
| 5289453 | test(SPEC-UI-002): M3 PreviewPage describe 제목의 AC 표지를 풀어 씀 |
| b480808 | feat(SPEC-UI-002): M3 Calendar 범위 모드와 DateRange 타입 |
| 120fd72 | feat(SPEC-UI-002): M3 NumberInput 공개 컴포넌트 |
| b051866 | feat(SPEC-UI-002): M3 Popover 공개 컴포넌트 |
| abcfcb1 | feat(SPEC-UI-002): M3 Drawer 공개 컴포넌트 |
| 153f9ad | feat(SPEC-UI-002): M3 DateRangePicker 공개 컴포넌트와 잠금 44·33 |
| 04712ec | feat(SPEC-UI-002): M3 미리보기 전시에 새 컴포넌트 4개와 Calendar 범위 모드 |
| c4dec3f | docs(SPEC-UI-002): M3 ui-core internal 공용 상수·훅에 @MX:ANCHOR |
| 4c51403 | docs(SPEC-UI-002): M3 DateRangePicker 주석에서 날짜 라이브러리 이름을 뺌 |

마지막 코드 커밋(판정 HEAD)은 4c51403이다. 모든 커밋이 pre-commit `moai gate`를 우회 없이 통과했다.

#### 인수 기준(판정 HEAD 4c51403)

**AC-UI-002-23 (가) — §3.10 후속 과제 항목별 증거**

| # | 판정 | 명령 | 관찰 |
|---|---|---|---|
| 1 | PASS | `npx vitest run src/ui-core/modal.test.tsx` | 재현 시험 "버리기 확인을 띄운 채 부모가 open=false → open=true로 바꾸면 다시 열린 Modal에 버리기 확인이 없다" 고치기 전 실패(`red-01-modal.txt`: `expected <div role="alertdialog" …> to be null`), 고친 뒤 통과 |
| 2 | PASS | `npx vitest run src/ui-core/date-time-picker.test.tsx` | 값 14:10·30분 간격: 트리거 "2026. 10. 29. (목) 14:10", 시간 칸 "14:10" `aria-selected="true"`, 14:00·14:10·14:30 순서, `onValueChange` 0회. 고치기 전 실패(`red-02-datetime.txt`: 시간 칸 글자 없음) |
| 4 | PASS | `npx vitest run src/ui-core/breadcrumb.test.tsx` | 표본 6개(`javascript:alert(1)`, `JavaScript:alert(1)`, ` javascript:alert(1)`, `java`TAB`script:alert(1)`, `data:text/html,x`, `mailto:a@b.c`) `href="#"`·경고 각 1번, 4개(`/customers`, `customers`, `https://example.com`, `http://example.com`) 그대로·경고 0. 고치기 전 6 failed(`red-04-link.txt`). 추가: URL로 읽히지 않는 `http://[`도 `#` |
| 6 | PASS | `/usr/bin/grep -c 'canCreate' src/ui-core/combobox.tsx` | `3`, Combobox 시험 37 passed |
| 7 | PASS | `/usr/bin/grep -rl --exclude='*.test.*' '<포커스 링 문자열>' src/ui-core` | `src/ui-core/internal/class-names.ts` 한 줄(exit 0). 시험은 원래부터 렌더링된 세 클래스를 단언하고 있어 기대값·시험을 바꾸지 않았다 |
| 8 | PASS | 같은 grep, 선택 상태 문자열 | `src/ui-core/internal/class-names.ts` 한 줄(exit 0) |
| 9 | PASS | `ls src/ui-core/internal`, `/usr/bin/grep -l 'internal/external-store' src/ui-core/toast.tsx src/ui-core/confirm-dialog.tsx`, `/usr/bin/grep -rn '@MX:WARN' src/ui-core/toast.tsx src/ui-core/confirm-dialog.tsx src/ui-core/internal/external-store.ts` | `class-names.ts external-store.ts use-restore-focus.ts`; 두 파일 모두 출력; WARN은 `internal/external-store.ts:13` 한 곳(+REASON :14), 옛 두 자리에는 없음 |
| 10 | PASS | `/usr/bin/grep -nE 'useCallback\|useMemo' src/ui-core/search.tsx` | 2줄(:2 가져오기, :39 `const mergedRef = useCallback(`). 새 시험 "다시 그려도 병합 ref 콜백이 새 함수로 바뀌지 않는다" — 고치기 전 `expected "vi.fn()" to be called 1 times, but got 5 times`(`red-10-search-ref.txt`) |
| 11 | PASS | `/usr/bin/grep -n 'TAIL_RUN_START' src/ui-core/pagination.tsx` | 전 `25:  if (page >= pageCount - 3) {` → 후 `13:const TAIL_RUN_START = EDGE_RUN - 2;`, `28:  if (page >= pageCount - TAIL_RUN_START) {`. Pagination 시험 통과 |
| 12 | PASS | `/usr/bin/grep -c "Not implemented: HTMLCanvasElement" final-qg03-test.txt` | `0`(기준선 `preflight-test.txt`는 5) |
| 13 | PASS | `/usr/bin/grep -c 'cva(' src/ui-core/loading.tsx src/ui-core/skeleton.tsx` | `loading.tsx:2`, `skeleton.tsx:1`, 기존 시험 통과 |
| 14 | PASS | `/usr/bin/grep -c 'act(' src/test/setup.ts`, `/usr/bin/grep -c "not wrapped in act" final-qg03-test.txt` | `1`, `0` |
| 15 | PASS | `npm run typecheck` + `toast.test.tsx` | `expectTypeOf<ToastTone>().toEqualTypeOf<Exclude<Tone, "neutral">>()` typecheck exit 0·시험 통과. 고치기 전 typecheck 실패(`red-15-toast-tone-typecheck.txt`: TS2459 내보내지 않음) |
| 16 | PASS | `/usr/bin/grep -rn 'size="md"' src --include='*.tsx'; echo "exit=$?"` | 출력 없음 `exit=1`. Modal 시험이 `"default"`를 단언하고 `@ts-expect-error`로 `"md"`가 타입 오류임을 확인. 옛 modal.tsx로 돌린 typecheck가 실패(`red-16-modal-size-typecheck.txt`: TS2322·TS2344·TS2578) |
| 17 | PASS | `/usr/bin/grep -rn 'AC-UI-001-06·AC-UI-001-14' src/preview/PreviewPage.test.tsx` | `302:describe("검증 섹션(AC-UI-001-06·AC-UI-001-14, EC-28, plan.md §E.4)", () => {` |

**AC-UI-002-23 (나)(다)·기준선 비교**

| AC | 판정 | 명령 | 관찰 |
|---|---|---|---|
| (나) 공개 이름 44 | PASS | `npx vitest run src/test/design-rules.test.ts` | "@/ui-core의 런타임 내보내기가 공개 이름 44개와 정확히 같다" 통과. `PUBLIC_NAMES`가 §3.6의 44개와 글자·순서까지 같은지 node로 따로 비교 → `44 44 true` |
| (나) 컴포넌트 파일 33 | PASS | 같은 시험 | "정해진 33개와 정확히 같다" 통과, `BASE_LIBRARIES`에 `popover.tsx`·`date-range-picker.tsx`→`@radix-ui/react-popover`, `drawer.tsx`→`@radix-ui/react-dialog` |
| (나) Modal 크기 값 | PASS | `/usr/bin/grep -n 'size?: \|default: "max-w' src/ui-core/modal.tsx` | `32:  size?: "sm" \| "default" \| "lg";`, `18:        default: "max-w-dialog-md",` |
| (다) 키보드 계약·axe 0 | PASS | `npx vitest run src/ui-core/date-range-picker.test.tsx src/ui-core/drawer.test.tsx src/ui-core/popover.test.tsx src/ui-core/calendar.test.tsx` | 4 files / 57 tests passed. DateRangePicker 10(Enter·Space 열기, 화살표 이동, Enter 시작·Enter 끝 → 1회 `{ from, to }`·닫힘·트리거 포커스, Esc 값 유지·트리거 포커스, 시작·끝·사이 단서, 프리셋, axe), Drawer 9(포커스 안으로, Tab·Shift+Tab 가두기, Esc·스크림·닫기 버튼, 트리거로 복귀, role=dialog+제목, motion-safe, axe), Popover 10(Enter·Space, Esc+복귀, 바깥 클릭, aria-expanded·aria-controls, motion-safe, axe), Calendar 범위 10 |
| (다) 전시 33 | PASS | `npx vitest run src/preview/PreviewPage.test.tsx` | 26 passed. "전시 목록 표는 33개 컴포넌트" + 라이트·다크 전시 요소 빠짐 0·axe 0 |
| 기준선 비교(§4.1 AC-23) | PASS | §4.1 블록, 증거 경로를 작업 트리 상대 경로로 바꿔 작업 트리 루트에서 실행 | `baseline ok: 710 tests kept or listed`, `exit=0`(`ac23-compare.txt`). `m3-after.json`(4c51403): 시험 파일 57개·시험 783개 전부 통과 |
| 묶음 | PASS | `npx vitest run src/ui-core src/test/design-rules.test.ts src/preview/PreviewPage.test.tsx` | 36 files / 542 tests passed |
| AC-UI-002-22 (마)(바)(사)+EC-23+EC-24 | PASS | `npx vitest run src/ui-core/number-input.test.tsx` | 18 passed. "1234567" → 표시 "1,234,567"·값 1234567, "₩12,000" 붙여넣기 → 12000, 비우기 → null, `1,234|,567`+Backspace → "123,567"·커서 3, `max=1000`에 1500 → 값 1500·`aria-invalid="true"`·설명 "1,000원 이하로 입력해 주세요.", 위·아래 화살표 값 변화 없음, `inputmode="numeric"`, axe 0 |

#### 품질 게이트(판정 HEAD 4c51403, grep은 `/usr/bin/grep` GNU grep 3.11)

| QG | 판정 | 관찰 |
|---|---|---|
| QG-01 | PASS | typecheck exit=0 |
| QG-02 | PASS | lint exit=0, 136개 파일, 새 지적 0건(기준선 125개 파일 0건) |
| QG-03 | PASS | 57 files / 783 tests passed, Duration 13.67s, 직후 uptime load average 17.88, 13.39, 10.26(c4dec3f에서는 11.89s, load 10.97) |
| QG-04 | PASS | `VITE_API_BASE_URL=https://api-beauty.dongri.kr npm run build` exit=0, `dist/index.html` 2026-11-10 14:57:44. 빌드 CSS에 상수로 옮긴 클래스(`focus-visible:outline-offset-2`, `bg-primary-subtle`)와 새 클래스(`rounded-s-control`, `forced-colors:outline-1`, `slide-in-from-left`)가 있음 |
| QG-05 | PASS | 기준 80/80/80/80, 줄 99.64 · 문장 98.55 · 함수 99.35 · 분기 95.94. 새 파일은 아래 표 |
| QG-06 | PASS | 39 passed(sync 6 + contrast 33) |
| QG-07 | PASS | 22 passed |
| QG-08 | PASS | 27 passed(공개 이름 44·파일 33) |
| QG-09 | PASS | `moai gate` → `gate exit=0`, pwd=작업 트리, `CLAUDE_PROJECT_DIR=<unset>`, HEAD 4c51403(`final-qg09-gate.txt`) |
| QG-10 | PASS | `moai spec lint .moai/specs/SPEC-UI-002/spec.md` exit=0, "No findings" |
| QG-11 | PASS | 경계 검사 exit=1·stderr 0바이트, 자체 확인 `2`(양성·라벨 검사는 M6) |
| QG-12 | PASS | 지정자 검사 exit=1·stderr 0바이트, 자체 확인 `2`, `package.json` 키 검사 exit=0 |
| QG-13 | PASS | `deploy-guard.test.ts` 5 passed |
| QG-14 | PASS | 9 passed |
| QG-15 | PASS | 26 passed(전시 33개) |
| QG-16 | PASS | `schema-sync.test.ts` 2 passed |

새 파일·크게 바뀐 파일 커버리지(`coverage/coverage-summary.json`, `final-qg05-new-files.txt`, 줄·문장·함수·분기)

| 파일 | 줄 | 문장 | 함수 | 분기 |
|---|---|---|---|---|
| `date-range-picker.tsx` | 100 | 100 | 100 | 100 |
| `number-input.tsx` | 97.29 | 97.82 | 100 | 97.82(35행 `caretAfterDigits`의 끝까지 못 찾은 경우) |
| `drawer.tsx` | 100 | 100 | 100 | 100 |
| `popover.tsx` | 100 | 100 | 100 | 100 |
| `calendar.tsx` | 100 | 100 | 100 | 98.63(97행 로캘 이름 함수가 없을 때의 대체) |
| `internal/class-names.ts` · `external-store.ts` · `use-restore-focus.ts` | 100 | 100 | 100 | 100 |

**경계 grep(E4)**

- `/usr/bin/grep -rln "react-day-picker" src --include='*.ts' --include='*.tsx'` → 시험 밖 앱 코드는 `src/ui-core/calendar.tsx`와 `src/ui-core/date-time-picker.tsx`. 뒤의 것은 7677aa7부터 있던 주석 한 줄(`// react-day-picker 날짜 버튼의 포커스 효과보다 늦게 실행된다.`, 가져오기 아님)이라 범위 밖으로 두었다. 가져오기 기준으로는 design-rules의 "react-day-picker와 cmdk는 표에 적힌 파일 밖에서 가져오지 않는다" 시험이 통과한다. 나머지는 시험 파일(`design-rules`·`dependency-pins`·`calendar.test`)
- `/usr/bin/grep -rn "ui-core/internal" src --include='*.ts' --include='*.tsx'` → `src/test/design-rules.test.ts:656`·`:668`뿐이다. 둘 다 "앱 코드가 `@/ui-core/internal/…`을 가져오면 잡는다"는 자기 검사 표본 문자열이다. ui-core 안은 상대 경로(`./internal/…`)로 가져온다
- `/usr/bin/grep -rnE "@/(lib|api|features|app)" src/ui-core` → 출력 없음, exit=1, stderr 0바이트

#### RED 증거(구현 전 실패 출력)

| 묶음 | 파일 |
|---|---|
| 후속 과제 1 Modal 다시 열기 | `red-01-modal.txt`(1 failed: 다시 연 뒤 alertdialog가 남음) |
| 후속 과제 2 간격 밖 시각 | `red-02-datetime.txt`(1 failed: 시간 칸 글자 없음) |
| 후속 과제 4 링크 스킴 | `red-04-link.txt`(6 failed) |
| 후속 과제 10 병합 ref | `red-10-search-ref.txt`(1 failed: 함수 ref 5회) |
| 후속 과제 15 ToastTone | `red-15-toast-tone-typecheck.txt`(TS2459) |
| 후속 과제 16 Modal 크기 | `red-16-modal-size-typecheck.txt`(옛 modal.tsx로 typecheck, TS2322·TS2344·TS2578) |
| Calendar 범위 모드 | `red-20-calendar-range.txt`(10 failed) |
| NumberInput | `red-21-number-input.txt`(모듈 없음) |
| Popover | `red-22-popover.txt`(모듈 없음) |
| Drawer | `red-23-drawer.txt`(모듈 없음) |
| DateRangePicker | `red-24-date-range-picker.txt`(모듈 없음) |
| 미리보기 전시 33 | `red-25-preview-showcase.txt`(1 failed: 표 33개 ≠ showcase.ts) |

정리 과제 6·7·8·9·11·12·13·14·17은 동작이 바뀌지 않는 정리라 기존 시험이 기준이다(12·14는 바꾸기 전 `npm test` 출력에 canvas 메시지 5건이 있었음).

#### 의도적으로 바꾼 시험(`m3-intentional-changes.txt`, 18줄)

| 시험(`m3-baseline.json`의 fullName) | 이유 |
|---|---|
| `src/ui-core/modal.test.tsx > Modal — 구조(AC-UI-001-22) 크기 sm·md·lg는 dialog 폭 토큰 400·560·720px이고 기본은 md다` | 후속 과제 16. 크기 이름 `md` → `default`. 새 이름 "크기 sm·default·lg는 … 기본은 default다"로 같은 폭 토큰(`max-w-dialog-md`)을 단언 |
| `src/test/design-rules.test.ts > … 공개 이름 40개와 정확히 같다` | 잠금 40 → 44(acceptance.md §3.6). 새 이름 "공개 이름 44개와 정확히 같다" |
| `src/test/design-rules.test.ts > … 정해진 29개와 정확히 같다` | 잠금 29 → 33. 새 이름 "정해진 33개와 정확히 같다" |
| `src/preview/PreviewPage.test.tsx > 미리보기 페이지(AC-UI-001-14) 전시 목록 표는 29개 컴포넌트이고 …` | QG-15 29 → 33(새 컴포넌트 4개, Calendar `range`, Modal `default`). 새 이름 "33개 컴포넌트" |
| `src/preview/PreviewPage.test.tsx > 검증 섹션(AC-UI-001-06·14, EC-28, plan.md §E.4) …` 14건 | 후속 과제 17. describe 제목만 `AC-UI-001-06·AC-UI-001-14`로 풀어 써 fullName이 바뀌었다. 시험 내용은 그대로이고 새 이름으로 모두 통과 |

#### 계획과 달라진 점

- **M3 시작 기록의 시점**: 기준선 JSON은 첫 M3 커밋 전에 기록했지만, 포커스 링·선택 상태·Pagination 줄의 시작 기록 파일은 결함 수정 세 커밋(fcad41c·c67830d·ae80cc3) 뒤에 썼다. 값은 7677aa7 트리를 `git grep`으로 직접 센 것이라 시작 시점과 같고, 세 커밋은 그 문자열이 든 줄을 바꾸지 않았다.
- **후속 과제 7**: 시험은 이미 렌더링된 세 클래스를 단언하고 있었고 상수 문자열을 가져오는 시험이 없어, 시험은 바꾸지 않았다.
- **후속 과제 12**: "조건부"는 jsdom에 `canvas` 패키지가 없을 때(`import.meta.resolve("canvas")` 실패)로 정했다. 바꾼 `getContext`는 jsdom이 메시지 뒤에 돌려주던 것과 같은 `null`을 돌려준다.
- **후속 과제 14**: 저장소 초기화를 setup.ts의 `afterEach`에서 `cleanup()` 앞, `act` 안으로 옮겼다(화면이 붙어 있는 동안 비워야 Host가 다시 그려지며 경고가 없다). setup.ts가 모든 시험 파일에서 toast·confirm-dialog를 가져오게 되어 vitest의 setup 비율이 7% → 15% 안팎으로 늘었다(전체 Duration은 11.9~13.7s로 기준선 16.8s보다 짧았다).
- **후속 과제 9 보강**: `useRestoreFocus`는 Modal·ConfirmDialog에 더해 새 Drawer도 쓴다. DateTimePicker·DateRangePicker의 트리거 모양 문자열은 `PICKER_TRIGGER`로 `internal/class-names.ts`에 모았다(같은 글자의 복사를 막으려는 것, 렌더링 결과 같음).
- **Calendar 범위 모드**: 라이브러리의 범위 계산(`onSelect`의 첫 인자)을 쓰지 않고 누른 날만 받아 시작 → 끝을 정한다. 두 번째 선택에서 한 번만 알리고, 끝이 앞이면 순서를 바로잡고, 같은 날 두 번이면 하루짜리, 범위가 있을 때 새로 누르면 새 시작이다. 사이 날짜 접근 이름은 "선택한 기간", 고대비 단서는 시작·끝 `forced-colors:outline-2`, 사이 `forced-colors:outline-1`로 정했다(정본에 낱말이 없어 고름). 띠는 칸(`td`)에 `bg-primary-subtle` + 시작 `rounded-s-control`·끝 `rounded-e-control`.
- **NumberInput**: 0 이상의 정수만 다룬다(가격·소요 시간). 15자리에서 자른다. 범위 오류 문장은 "{min}{단위} 이상 {max}{단위} 이하로 입력해 주세요."(min만·max만이면 앞·뒤 하나)로 정했고, 오류 문장은 NumberInput이 입력 아래에 직접 그리고 `aria-describedby`로 잇는다.
- **Popover**: 정본 API(`trigger`·`children`·`align?`)에 `aria-label?`(내용 대화상자 이름)과 `className?`을 더했다. axe의 대화상자 이름 규칙과 사용자 메뉴의 이름 때문이다. 기본 정렬은 `end`. 트리거의 `aria-controls`는 열렸을 때만 있다(Radix 동작, 위 사전 점검).
- **Drawer**: 정본 API에 `closeLabel?`(기본 "닫기")과 `className?`을 더하고 머리에 닫기 버튼을 두었다. 스크림과 서랍 모두 z 30(system.md §7의 모바일 서랍 층)이고 스크림이 먼저 그려져 아래에 깔린다.
- **DateRangePicker**: 프리셋 타입 `DateRangePreset { label, range }`를 내보낸다. 트리거 표기는 "2026. 10. 12. ~ 2026. 10. 15.".
- **잠금 갱신 순서**: 컴포넌트마다 그 커밋에서 잠금을 한 칸씩 늘렸다(41·30 → 42·31 → 43·32 → 44·33). 중간 커밋도 모두 초록으로 남기기 위해서다. index.ts는 `DateRange`·`CalendarRangeProps`·`CalendarSingleProps`·`NumberInputProps`·`PopoverProps`·`DrawerProps`·`DateRangePickerProps`·`DateRangePreset` 타입을 내보내고, `internal/`은 내보내지 않는다.
- **추가 커밋 두 개**: `@MX:ANCHOR`(FOCUS_RING·SELECTED_ITEM·useRestoreFocus, 호출처 3곳 이상)와 DateRangePicker 주석 정리(E4 grep이 주석 글자에 걸리지 않게).

#### 관찰(조치하지 않음)

- **중단과 재개**: ae80cc3 커밋 뒤, 정리 과제 6·7·8을 작업 트리에 둔 채(6은 스테이징까지) 기기 재시작으로 실행이 끊겼다. 같은 작업 트리에서 이어 갔다. 재개 직후 `git status`와 diff로 남은 변경이 6·7·8뿐이고 잘린 편집이 없음을 확인하고, typecheck·lint·ui-core와 design-rules 시험(31 files / 456 tests)을 다시 돌린 뒤 커밋했다(a0be727, 4e63143).
- **외부 저장소 중복**: `src/ui-core/internal/external-store.ts`(값을 갖는 저장소, `get`·`set`)와 `src/lib/external-store.ts`(M2, 앱 계층, `read()`를 비추는 저장소)는 비슷한 일을 한다. ui-core는 앱 코드를 가져올 수 없고 앱 코드는 `@/ui-core`만 가져올 수 있어 합치지 않았다(경계 규칙상 의도된 중복). 모양도 조금 다르다.
- **grep 셸 함수**: 이 환경의 `grep`은 ugrep을 부르는 셸 함수라 `--version`이 ugrep으로 나온다. acceptance.md §0대로 증거는 `/usr/bin/grep`으로 남겼다. 다음 위임에서도 `/usr/bin/grep`을 명시하면 된다.
- **Bash 가드**: 작업 트리 가드는 git이 없는 명령도 `{ …; }` 묶음, 셸 변수를 쓴 `npx` 인자, 따옴표 속 한글이 섞인 `npx … -t "…"`를 거부했다. 증거 파일 경로를 글자 그대로 적은 한 줄 명령은 통과했다. 작업 트리 밖(스크래치패드) 쓰기는 Write 훅이 막아, 일회성 도구 스크립트는 증거 디렉터리 `tools/`에 두었다.
- **pre-commit**: `moai gate`가 커밋마다 돌았고 한 번도 실패하지 않았다(재시작 뒤 부하 load 10~18).
- **date-time-picker.tsx 주석**: 7677aa7부터 "react-day-picker"라는 낱말이 주석에 있어, 글자 기준 E4 grep에는 calendar.tsx 밖 한 줄로 걸린다. 범위 밖이라 그대로 두었다. 가져오기 기준 잠금 시험은 통과한다.
- **UR-9**: 새 컴포넌트 4개와 범위 달력의 실제 모양은 `/dev/preview`(M4 뒤) 또는 지금의 `npm run dev` 미리보기에서 사용자 검토로 볼 수 있다. 자동 시험은 클래스와 ARIA까지만 판정한다.

#### 오케스트레이터 재검증과 통합(2026-11-10)

- 세션 `f64b7914-6a56-4436-86f6-7a9eef484222`, 시작 HEAD `7677aa7`(차이 `0 0`, 작업 트리는 주 체크아웃 하나, 같은 SPEC의 다른 세션 없음). 증거는 `.moai/state/verify/f64b7914-6a56-4436-86f6-7a9eef484222/`의 `m3/`(에이전트, 작업 트리에서 옮김 — 44개 파일, `diff -rq` 동일)와 `m3-orchestrator/`다.
- 계획 감사 관문: 캐시 적중을 다시 확인했고 plan-auditor는 부르지 않았다. acceptance·design·plan·research의 sha256이 Run 1 지문과 같고, spec.md는 `status: draft`로 되돌리면 Run 1 지문과 같다. `fd184ee..HEAD`에서 계획 문서 5개를 바꾼 커밋은 6d870b7(M1의 상태 전환)뿐이다. 일별 기록의 "Audit Run 3"에 남겼다.
- 중단과 재개: 첫 위임은 ae80cc3 뒤 기기 재시작으로 보고 없이 끊겼다. 작업 트리에는 커밋 3개와 과제 6·7·8의 미커밋 변경이 남아 있었고, 같은 에이전트를 같은 작업 트리에서 이어 가게 했다. 최종 HEAD는 `ba3a78c`(코드 판정 HEAD `4c51403` + 진행 기록 커밋)다.
- M3 재검증(에이전트 작업 트리, HEAD `ba3a78c`. grep은 `/usr/bin/grep` GNU grep 3.11)
  - 게이트: typecheck 0, lint 0(136개 파일). `npm test` 57 files / 783 tests, Duration 12.02s, 직후 load 9.32. 같은 출력에 "Not implemented: HTMLCanvasElement" 0건, "not wrapped in act" 0건(과제 12·14).
  - AC-23 기준선 비교: 새로 만든 `m3-after-orch.json`(57 files / 783 passed)을 에이전트의 `m3-baseline.json`·`m3-intentional-changes.txt`(18줄)와 §4.1 스크립트로 비교했다 → exit 0, `baseline ok: 710 tests kept or listed`.
  - 게이트별 시험 파일(같은 JSON): QG-06 39, QG-07 22, QG-08 27, QG-13 5, QG-14 9, QG-15 26, QG-16 2. 새 시험: date-range-picker 10, drawer 9, popover 10, number-input 18(AC-22 (마)~(사)·EC-23·EC-24), calendar 28, 결함 재현이 든 modal 22·date-time-picker 24·breadcrumb 19, 모두 통과. 새 시험 4개 파일의 제목을 §3.10 키보드 계약 표와 맞춰 봤다(`new-component-test-titles.txt`).
  - 커버리지 98.55 · 95.94 · 99.35 · 99.64(기준 80/80/80/80). 빌드 0(`dist/index.html` 15:06:54). `moai gate` exit 0(pwd=작업 트리, `CLAUDE_PROJECT_DIR` 없음). spec lint 지적 없음.
  - QG-11 경계 검사 exit 1·stderr 0바이트·자체 확인 2. QG-12 지정자 검사 exit 1·stderr 0바이트·자체 확인 2, `package.json` 키 검사 exit 0.
  - §3.10 항목 증거: 6 `canCreate` 3회. 7·8은 포커스 링·선택 상태 문자열이 시험 밖 ui-core에서 `internal/class-names.ts`에만 있다. 9는 toast·confirm이 `internal/external-store`를 가져오고, `@MX:WARN`이 `internal/external-store.ts:13`에만 있다. 10 `useCallback`, 11 `TAIL_RUN_START`, 13 `cva(` 2·1, 14 `act(` 1, 16 `size="md"` 출력 없음(exit 1), 17 한 줄.
  - 공개 표면: `PUBLIC_NAMES`가 §3.6의 44개와 글자·순서까지 같다. 컴포넌트 파일 33개, `index.ts`에 `internal` 없음, ui-core 안에서 앱 코드(`@/lib`·`@/api`·`@/features`·`@/app`) 가져오기 없음. react-day-picker를 가져오는 곳은 `calendar.tsx`뿐이다(`date-time-picker.tsx`에는 7677aa7부터 있던 주석의 낱말만 있다).
  - 범위: 바뀐 파일 46개가 모두 `src/`와 `.moai/` 안이다. `.moai/` 변경은 progress.md(+182, −0)뿐이다. `openapi/`·`src/api/schema.d.ts`·`package.json`·`package-lock.json`·`.claude/`·SPEC-UI-001·`.moai/design/`·계획 문서 5개는 바뀌지 않았다. 커밋 22개 모두 `🗿 MoAI` 줄이 있다. 주 체크아웃 `moai worktree verify` exit 0.
- 통합: `git merge --ff-only` 뒤 `git push origin main`(`7677aa7..ba3a78c`, 차이 `0 0`). 증거를 옮긴 뒤 작업 트리와 임시 브랜치를 지웠다. 주 체크아웃에서 다시 돌린 typecheck는 exit 0이다(`qg01-typecheck-primary.txt`).
- 독립 평가: 착수 결정대로 M3 직후에는 돌리지 않는다. 다음 평가는 M4 직후다.

**넘기는 항목(M3에서 생김)**

| 내용 | 처리 |
|---|---|
| 정본에 글자가 없어 구현자가 정한 표현: Calendar 범위 모드의 사이 날짜 접근 이름 "선택한 기간", 고대비 단서(시작·끝 `outline-2`, 사이 `outline-1`), NumberInput의 범위 오류 문장(예: "1,000원 이하로 입력해 주세요."), 0 이상의 정수·15자리 제한 | UR-9에서 모양을 확인한다. 범위 문장이 acceptance.md §3.2 필드 문구("0 이상 입력해 주세요." 등)와 맞는지는 M5~M7에서 폼에 붙일 때 확인한다(이번에 비교하지 않음) |
| `src/ui-core/internal/external-store.ts`와 `src/lib/external-store.ts`의 중복 | 경계 규칙상 의도된 중복. 조치 없음 |
| 다음 위임 팁: 작업 트리에 `node_modules`가 없어 `npm ci`가 먼저 필요하다. 증거용 grep은 `/usr/bin/grep`(셸의 `grep`은 ugrep 함수)으로 부른다. 작업 트리 가드는 git 없이도 `{ …; }`·셸 변수 인자·따옴표 속 한글 `-t "…"`를 거부한다. 일회성 스크립트는 증거 디렉터리 `tools/`에 둔다 | M4 위임 지시문에 넣는다 |

- 다음 마일스톤은 M4다. 위임 때 M2의 N1·F5·F3·F4·F8·N2 행을 그대로 옮기고, M4 직후 sync-auditor 독립 평가를 한다.

### M4 — 라우터·앱 셸·로그인·매장 선택·약관·404·미리보기 개발 전용 경로 (2026-11-10, manager-develop, cycle_type=tdd)

- M4 시작 SHA: 0d93b12(작업 트리 브랜치 `worktree-agent-ad12201b731673ec3`, 밀어 올리지 않음)
- 증거 디렉터리: `.moai/state/verify/f47c2a0d-1c2b-4303-861c-103a59bc6b04/m4/`(작업 트리에서 기록)
- 시작 기준선(0d93b12): typecheck exit=0, lint exit=0(136개 파일), `npm test` 57 files / 783 tests passed(Duration 13.08s, 직후 load average 7.99) — `preflight-*.txt`
- M4 범위: plan.md §F M4(§B.2·§B.3·§B.5 폼 훅·§B.9·§B.13), `main.tsx`의 `RouterProvider` 전환, `scripts/check-dist.mjs`(QG-18 부분)와 `check:dist` 스크립트, 넘겨받은 항목 N1·N2·F5·F3·F4·F8·처리기 멱등·일탈 8·S0. 패키지 추가 없음, ui-core·계획 문서·스냅숏 손대지 않음

#### 사전 점검

| 점검 | 결과 |
|---|---|
| 브랜치·HEAD·상태 | `worktree-agent-ad12201b731673ec3`, 0d93b12, 깨끗함. `node_modules`가 없어 `npm ci`(exit 0) |
| grep 판본 | `/usr/bin/grep --version` → `grep (GNU grep) 3.11`. 증거용 grep은 모두 `/usr/bin/grep`으로 불렀다 |
| react-router 8.5.1 데이터 모드 | `createBrowserRouter`·`createMemoryRouter`·`RouterProvider`·`redirect`·`useNavigation`·`isRouteErrorResponse`·`Link`·`useRouteError`·`useSearchParams`·`useRevalidator`·`useMatches`·`LoaderFunctionArgs`·`RouteObject`·`DataRouter` 타입이 모두 `react-router`에서 나온다(`dist/production/index.d.ts`). `RouterProvider`는 `react-router`와 `react-router/dom` 두 곳에 있고 앱은 `react-router`를 쓴다. 경로 객체의 `lazy: () => import(…)`·`HydrateFallback`도 타입 검사를 통과했다 |
| `Link`와 ui-core `LinkComponent` | `const RouterLinkProbe: LinkComponent = (props: LinkComponentProps) => <Link {...props} />`가 `tsc --noEmit` exit 0. 임시 파일은 지웠고 사본은 `preflight-router-probe.tsx.txt`, 결과는 `preflight-router-typecheck.txt` |

#### 커밋

| SHA | 제목 |
|---|---|
| dd90991 | fix(SPEC-UI-002): M4 로그인이 세션 세대를 올려 부팅 갱신의 늦은 결과를 버림 |
| 063a210 | fix(SPEC-UI-002): M4 새 세션의 401이 앞 세대 갱신에 합류하지 않게 |
| c5227b9 | fix(SPEC-UI-002): M4 인증 경로 밖 요청의 credentials를 omit으로 |
| 540d7cb | feat(SPEC-UI-002): M4 next 매개변수 검사 safeNext |
| 6cdd1c0 | feat(SPEC-UI-002): M4 폼 훅 useForm |
| bccc4f8 | feat(SPEC-UI-002): M4 화면 폭 훅과 저장 상태 훅 |
| 6bd9b2e | feat(SPEC-UI-002): M4 데이터 라우터·경로 보호·로그인·약관·404·미리보기 개발 경로 |
| 34f3cef | feat(SPEC-UI-002): M4 매장 선택 화면 |
| 9f5622c | feat(SPEC-UI-002): M4 앱 셸 — 사이드바·상단바·서랍·사용자 메뉴 |
| bbf53c6 | feat(SPEC-UI-002): M4 빌드 산출물 검사 check:dist(QG-18 미리보기 부분) |
| 59db12b | fix(SPEC-UI-002): M4 loader가 확인 도중 끝난 세션을 로그인 화면으로 보냄 |

마지막 코드 커밋(판정 HEAD)은 59db12b다. 첫 커밋이 N1이고, 모든 커밋이 pre-commit `moai gate`를 우회 없이 통과했다.

#### 인수 기준(판정 HEAD 59db12b)

| AC | 판정 | 명령 | 관찰 |
|---|---|---|---|
| AC-UI-002-09 | PASS | `npx vitest run src/app/routes.test.tsx src/app/safe-next.test.ts` | 70 passed. (가) §3.3 경로 표 16행이 이동 경로·h1과 같고, 로그인·매장 선택으로 가는 보호 경로는 보호 화면 h1을 한 번도 그리지 않는다(문서 전체 h1 기록으로 판정). (나) S2의 `/login?next=` 표본 13개, (다) S0에서 로그인한 뒤의 표본 13개가 모두 거부 → `/reservations`, 허용 → 표의 경로. `safeNext` 단위 표본 13개 + 출처 해석 오류·C0 경계 |
| AC-UI-002-10 | PASS | `npx vitest run src/app/shell` | 21 passed. 1280·1024px 펼침으로 시작·접으면 `collapsed` 저장·다시 그려도 접힘, 저장값 `expanded`면 펼침. 900·1023·768px 저장값 `expanded`여도 접힘·펼쳐도 저장값 그대로. 375·767px 메뉴 버튼 → `role="dialog"` 서랍 → "고객" → 서랍 닫힘·경로 `/customers`. 첫 Tab → 건너뛰기 링크 → Enter → `#main` 포커스. 상단바 `h-14`, 사이드바 `w-(--sidebar-width)`·`w-(--sidebar-width-collapsed)`, 상단바 다섯 요소("11월 9일 (월)" 포함), 사이드바 머리 "강남점"·`/shops` "매장 변경", 사용자 메뉴의 이름·역할·이메일·매장 변경·로그아웃, 세 폭 axe 0. EC-07·EC-08·EC-40 |
| AC-UI-002-11 | PASS | `npx vitest run src/features/auth/LoginPage.test.tsx` | 17 passed. (가) 요청 0·두 필드 문구·이메일 포커스, (나) 요청 0·형식 문구·이메일 포커스, (나') 요청 1회(form-urlencoded, `username`·`password`·`grant_type=password`, `credentials: "include"`), (다)(라)(마) §3.2 문구·서로 다름·loading에서 돌아옴, (바)(사)(아)(자) 이동 경로, 처음 값 빈 문자열·`username`·`current-password` |
| AC-UI-002-12 | PASS | `npx vitest run src/features/shops/ShopSelectPage.test.tsx` | 18 passed. (가)(나)(다) `POST /shops/selected` `{"shop_id":2}` 1회·선택 매장 캐시 id 2·`["shop", 1, …]` 0개·이동 경로(거부 표본 10개 → `/reservations`, 허용 표본 `/customers?q=김`), (라) 500 → 캐시 id 1·`["shop", 1, …]` 1개·경로 `/shops`·destructive Alert, (마) 빈 상태 문구, (바) 299ms 스켈레톤 없음·300ms 있음·응답 뒤 Alert·"다시 시도" → 다시 요청 |
| AC-UI-002-13 M4 판정 | PASS | `npx vitest run src/app/routes.test.tsx src/features/legal` + §4.1 QG-18 블록 | 54 passed. (가) 개발 경로 목록 `/dev/preview` → "컴포넌트 미리보기", (나) 빈 목록 → "찾을 수 없는 페이지예요.", (라) 이용약관 3문단·개인정보처리방침 2문단이 §3.9와 같은 글자(공백 정규화)·같은 수. (다)는 아래 QG-18 |
| AC-UI-002-05 (라) | PASS | `npx vitest run src/app/auth-flow.test.tsx` | 1 passed. 로그인 → 새로고침 흉내(새 앱, 갱신 1회 → `access-2`) 뒤 `/customers`가 로그인 화면으로 가지 않고 그려짐 → 사용자 메뉴 로그아웃(응답 없는 처리기) 즉시 토큰 `null`·쿼리 캐시 0개 → `/login`, `POST /auth/logout` 1회 `credentials: "include"`. 저장소 쓰기·쿠키·`indexedDB.open` 0회, 토큰 문자열 4개가 어떤 저장소에도 없음 |
| AC-UI-002-06 (나) 화면 부분 | PASS | `npx vitest run src/app/routes.test.tsx` | `/customers`에서 동시 401 세 개 + 갱신 401 → `/login?next=%2Fcustomers`, 문구 "로그인이 만료됐어요. 다시 로그인해 주세요." 1개, 쿼리 캐시 0개 |
| AC-UI-002-22 폼 단위 | PASS | `npx vitest run src/lib/form.test.ts` | 13 passed. 처음 숨김(쳤다 지워도 숨김) → 떠난 필드만 표시 → 이후 바뀔 때마다 재검사, 제출하면 전부 표시·`onSubmit` 0회·등록 순서상 첫 오류 필드 포커스, 서버 오류는 필드별 앱 문구가 있으면 그 문구·없으면 백엔드 msg, 값이 바뀌면 그 필드의 서버 오류 삭제, 경로 이름 필드 |
| AC-UI-002-04 (나) | PASS | `npm run test:coverage` 뒤 §4.1 AC-04 블록(`tools/ac04-check.cjs`에 글자 그대로 옮김) | `coverage scope ok: 76 files`, exit=0(`final-ac04-coverage-scope.txt`) |
| S0 결정 | PASS | 위 AC-09 명령 | "첫 방문(새로고침)의 갱신 401은 문구 없이 로그인 화면이다"(`/customers` → `/login?next=%2Fcustomers`, 문구 없음), "/login을 바로 열어도 문구가 없다" ✓ |

#### 품질 게이트(판정 HEAD 59db12b, grep은 `/usr/bin/grep` GNU grep 3.11)

| QG | 판정 | 관찰 |
|---|---|---|
| QG-01 | PASS | typecheck exit=0 |
| QG-02 | PASS | lint exit=0, 180개 파일, 새 지적 0건(기준선 136개 파일 0건) |
| QG-03 | PASS | 69 files / 949 tests passed, Duration 19.45s, 직후 uptime load average 16.60, 12.03, 9.38. 120초를 넘지 않아 D12 재실행 없음 |
| QG-04 | PASS | `VITE_API_BASE_URL=https://api-beauty.dongri.kr npm run build` exit=0, `dist/index.html` 2026-11-10 17:09:17. AC-03 산출물 검사(프록시 표지 빌드 17:09:04)는 exit=1·출력 0바이트·stderr 0바이트 |
| QG-05 | PASS | 기준 80/80/80/80, 줄 99.65 · 문장 98.53 · 함수 99.27 · 분기 94.79. 새 파일은 아래 표 |
| QG-06 | PASS | 39 passed(sync 6 + contrast 33) |
| QG-07 | PASS | 22 passed |
| QG-08 | PASS | 27 passed(공개 이름 44·파일 33, 새 앱 파일도 검사 대상) |
| QG-09 | PASS | `moai gate` → `gate exit=0`, pwd=작업 트리, `CLAUDE_PROJECT_DIR=<unset>`, HEAD 59db12b(`final-qg09-gate.txt`) |
| QG-10 | PASS | `moai spec lint .moai/specs/SPEC-UI-002/spec.md` exit=0, "No findings" |
| QG-11 | PASS | 경계 검사 exit=1·출력 0바이트·stderr 0바이트, 자체 확인 `2`(양성·라벨 검사는 M6) |
| QG-12 | PASS | 지정자 검사 exit=1·출력 0바이트·stderr 0바이트, 자체 확인 `2`, `package.json` 키 검사 exit=0 |
| QG-13 | PASS | `deploy-guard.test.ts` 5 passed |
| QG-14 | PASS | 9 passed |
| QG-15 | PASS | 26 passed(전시 33개) |
| QG-16 | PASS | `schema-sync.test.ts` 2 passed |
| QG-17 | 해당 없음 | M8부터 |
| QG-18 | PASS | 빌드 exit=0(17:09:17), `check:dist` exit=0("JS 파일 1개에 미리보기 흔적이 없습니다."), JS 검사 exit=1·출력 0바이트·stderr 0바이트, 원본 확인 `1`(`final-qg18-*.txt`) |

새 파일·크게 바뀐 파일 커버리지(`coverage/coverage-summary.json`, `final-qg05-new-files.txt`, 줄·문장·함수·분기)

| 파일 | 줄 | 문장 | 함수 | 분기 |
|---|---|---|---|---|
| `src/app/create-app.tsx` | 100 | 97.05 | 100 | 87.5 |
| `src/app/loaders.ts` · `routes.tsx` · `safe-next.ts` · `providers.tsx` · `PublicLayout.tsx` · `NotFoundPage.tsx` | 100 | 100 | 100 | 100 |
| `src/app/RouteError.tsx` | 100 | 100 | 100 | 66.66(API 오류가 아닌 예외의 갈래) |
| `src/app/services.ts` | 100 | 94.44 | 100 | 75(문맥 없음 오류) |
| `src/app/dev-routes.ts` | 100 | 100 | 100 | 50(운영 빌드 갈래 — 시험 환경은 DEV) |
| `src/app/shell/AppShell.tsx` | 100 | 94.73 | 100 | 81.25 |
| `src/app/shell/AccountMenu.tsx` | 100 | 100 | 100 | 75 |
| `src/app/shell/TopBar.tsx` | 100 | 100 | 100 | 83.33 |
| `src/app/shell/use-sidebar-state.ts` | 100 | 100 | 100 | 93.75 |
| `src/app/shell/NavSidebar.tsx` · `RouterLink.tsx` | 100 | 100 | 100 | 100 |
| `src/features/auth/LoginPage.tsx` | 100 | 100 | 100 | 92.3 |
| `src/features/shops/ShopSelectPage.tsx` | 100 | 95 | 100 | 83.33 |
| `src/features/legal/*` · 업무 화면 빈 페이지 4개 | 100 | 100 | 100 | 100 |
| `src/lib/form.ts` | 100 | 100 | 100 | 92.1 |
| `src/lib/use-media-query.ts` | 85.71 | 87.5 | 80 | 100(서버 스냅숏 함수) |
| `src/lib/use-persisted-state.ts` | 100 | 100 | 100 | 100 |
| `src/api/session.ts` | 98.11 | 98.36 | 94.44 | 90.62 |
| `src/api/client.ts` | 100 | 97.67 | 88.88 | 97.22 |

**경계 grep(E4)**

- `/usr/bin/grep -rln "react-router-dom" src scripts package.json` → exit=1, 출력·stderr 없음
- `/usr/bin/grep -rnE "@/ui-core/|ui-core/internal|\.\./ui-core|\.\./\.\./ui-core" src/app src/features src/lib --include=*.ts --include=*.tsx` → exit=1(앱 코드는 `@/ui-core`만 가져온다. design-rules 시험도 통과)
- `/usr/bin/grep -rnE "\.hint\b" src/app src/features --include=*.tsx` → exit=1(화면이 `hint`를 읽는 곳 없음). 화면 시험의 "hint를 그리지 않는다" 단언: 로그인 401, 매장 선택 500, 경로 오류 화면 403
- 저장소 문자열: 시험 밖 앱 코드에서 `localStorage`를 쓰는 곳은 `src/lib/use-persisted-state.ts`(사이드바 접힘 값)뿐이고 나머지는 주석이다(`final-e4-storage.txt`)

#### RED 증거(구현 전 실패 출력)

| 묶음 | 파일 |
|---|---|
| N1 로그인 세대 | `red-01-n1-login-generation.txt`(3 failed: P8 `expected null to be 'access-9'`, P8b `expected true to be false`, `startSession is not a function`) |
| N2 다른 세대 합류 | `red-02-n2-join-other-generation.txt`(1 failed: P9 `expected 1 to be 2` — 두 번째 갱신이 생기지 않음) |
| F5 credentials | `red-03-f5-credentials-omit.txt`(8 failed: 비인증 요청이 `"same-origin"`) |
| safeNext | `red-04-safe-next.txt`(모듈 없음) |
| 폼 훅 | `red-05-form.txt`(모듈 없음) |
| 폭·저장 훅 | `red-06-media-persisted.txt`(모듈 없음) |
| 경로·로그인·약관·앱 조립 | `red-07-routes-login-legal.txt`(4개 파일 모두 모듈 없음) |
| 매장 선택 | `red-08-shop-select.txt`(18 failed — 자리 화면) |
| 앱 셸·인증 흐름 | `red-09-shell-auth-flow.txt`(18 failed / 4 passed — axe 3건 등은 자리 셸에서도 통과) |
| check:dist | `red-10-check-dist.txt`(6 failed — 스크립트 없음) |
| loader의 두 갈래 | `red-11-loader-branches.txt`(2 failed) — 시험보다 먼저 쓴 두 갈래(요청 도중 끝난 세션, 로그인 loader의 갱신 오류)를 잠시 지운 채 새 시험을 돌려 실패를 확인하고 되돌렸다(`tools/strip-loader-branches.py`). 그 뒤 첫 갈래의 조건을 "토큰이 없으면"으로 넓혔다(아래 계획과 달라진 점) |

#### 계획과 달라진 점

- **클라이언트의 자리(F8)**: `createApp`(`src/app/create-app.tsx`)이 API 클라이언트·QueryClient·라우터를 함께 만들고, `main.tsx`가 모듈 범위에서 한 번 부른다. 화면은 문맥(`src/app/services.ts`의 `useApiClient`·`useServices`)으로 받는다. 화면이 클라이언트를 만들지 않으므로 StrictMode 이중 렌더링과 무관하다. 시험: `createApiClient(`를 부르는 앱 코드가 `create-app.tsx` 하나, `main.tsx`의 `createApp(`가 들여쓰기 없는 한 줄, StrictMode로 그려도 부팅 갱신 수가 늘지 않음. 그래서 `src/features`가 `@/app/services`를 가져온다(design.md §17은 features → app/env만 적었다)
- **경로 함수 인자**: `createRoutes({ devRoutes, services })`. loader가 클라이언트·QueryClient를 써야 해서 `services`를 더했다
- **세션 만료 안내**: 위치 상태 대신 앱마다 하나인 안내 저장소(`createSessionNotice`)에 켠다. 만료 처리기만 켜고(이 탭의 토큰을 실은 요청의 만료일 때만 클라이언트가 부른다 — S0), 로그인 성공·직접 로그아웃이 끈다. 로그인 화면은 그 값을 읽어 warning Alert로 보인다
- **처리기가 이동하지 않는 때**: 첫 로딩 중·이동 중이면 만료·매장 미선택 처리기는 이동하지 않고 그 loader가 목적지를 next로 실어 보낸다(떠나는 화면이 next가 되지 않게). `/login`·`/shops`·약관 두 화면에서도 이동하지 않는다(로그인 직후 선택 매장 확인의 `SHOP_NOT_SELECTED`가 `/shops?next=/login…`으로 튀지 않게). 만료 처리기는 세션 세대로 한 번만 동작한다
- **매장 미선택 처리기**: `["shop"]` 범위만 버리고 선택 매장 캐시는 버리지 않는다. 관찰 중인 선택 매장 쿼리를 지우면 다시 만들어져 같은 404를 되풀이할 수 있어서다
- **loader**: 첫 화면(`/`)의 index loader도 `requireShop`을 먼저 마친 뒤 `/reservations`로 보낸다(부모·자식 loader가 동시에 돌아 로그인·매장 이동이 앞서게). `requireShop`은 확인이 실패했을 때 토큰이 없으면(만료 처리기가 세션을 지우고 캐시를 비워 확인이 401이나 취소로 끝남) 로그인으로 보낸다. 로그인 화면 loader는 갱신이 네트워크·서버 오류여도 오류 화면 대신 로그인 화면을 보인다(보호 경로는 EC-06대로 오류 화면)
- **이동 주소 직렬화**: `nextDestination(value, origin)`을 `safe-next.ts`에 더했다. `redirect`의 Location 헤더가 한글을 담지 못해 URL로 퍼센트 인코딩한다(이미 있는 `%xx`는 그대로)
- **셸 내리기**: 세션이 끝나면 `AppShell`이 아무것도 그리지 않는다. 로그아웃 뒤 로그인 화면으로 가는 동안 셸의 쿼리(내 정보·선택 매장)가 토큰 없이 다시 만들어져 비운 캐시에 남던 것을 막는다(AC-05 (라) 시험이 처음에 캐시 1개로 실패해 찾았다)
- **폼 훅 API**: `register(name)`은 `{ name, value, onChange, onBlur, ref }`만 돌려주고 오류는 `error(name)`으로 읽는다(DOM 입력에 `error` 속성이 새지 않게). `setServerErrors(errors, appMessage?)`는 맞는 필드가 있으면 true이고 그 필드들을 떠난 것으로 표시한다
- **매장 목록**: `size=100`(openapi.json의 최대값)으로 가져오고 쪽이 둘 이상이면 Pagination을 보인다. 쪽 번호는 URL이 아니라 화면 상태다
- **F4**: 로그인 변경에 `gcTime: 0`을 두고, 화면이 시도마다 `reset()`으로 관찰자를 뗀다. 실패한 뒤 로그인 화면에 머무는 동안에도 변경 캐시 상태에 비밀번호가 없다(시험 있음)
- **경로 오류 화면**: API 오류만 정규화한 문구를 보이고, 그 밖의 예외는 원인을 짐작하는 문구 없이 제목과 "다시 시도"만 둔다
- **AC-12 시계**: 시점 판정이 있는 (바)만 자동 진행 없는 가짜 타이머로 돌리고, 판정 뒤 진짜 타이머로 바꿔 다시 시도 요청을 확인했다. (가)~(마)는 진짜 타이머다
- **check:dist**: `dist/index.html`이 없거나 JS 파일이 하나도 없어도 실패로 본다(빈 산출물을 통과로 보지 않게). 동작 시험 `src/test/check-dist.test.ts`를 더했다
- **시험 장치**: `src/test/render-route.tsx`(세 세션 상태, 기본 처리기, 그려진 h1 기록, 경로 비교, 폭 대역 `installViewport`), `src/test/msw/handlers/users.ts`·`userFixture`를 더했다. MSW는 한 번의 `server.use(a, b)` 안에서 앞의 처리기가 이기므로 시험의 처리기는 기본값과 따로 더한다
- **정본에 글자가 없어 고른 표현(사용자 검토)**: 경로 오류 화면 제목 "페이지를 불러오지 못했어요.", 404 링크 "첫 화면으로 가기", 매장 카드의 "현재 매장" 배지와 "등록일 2026. 11. 1." 앞머리, 버튼 이름 "사이드바 접기"·"사이드바 펼치기"·"메뉴 열기", 서랍 제목 "메뉴", 사용자 메뉴 버튼·Popover 이름 "사용자 메뉴". 아이콘은 예약 캘린더 `CalendarDays`, 시술 이력 `ClipboardList`, 고객 `Users`, 시술 메뉴 `ListTree`, 사용자 메뉴 `CircleUser`

#### 관찰(조치하지 않음)

- 운영 빌드의 JS가 한 파일(586.32 kB, gzip 184.16 kB)이라 Vite가 500 kB 경고를 낸다. 미리보기가 빠진 결과이며 코드 분할은 M4 범위 밖이다
- S0에서 보호 경로를 열면 그 경로의 loader와 로그인 화면 loader가 각각 쿠키 갱신을 한 번씩 보낸다(합 2회). 로그인 화면 loader는 다른 탭의 로그인으로 쿠키가 살아났을 수 있어 갱신을 다시 시도한다
- N2: jsdom에는 `navigator.locks`가 없어 시험에서는 앞 세대 갱신과 새 갱신이 겹쳐 돈다. 브라우저에서는 탭 잠금이 둘을 줄 세운다
- `src/preview/PreviewPage.tsx` 맨 위 주석("라우터 없이 src/main.tsx가 바로 렌더링한다")은 이제 맞지 않는다. 미리보기 폴더는 경로 모듈 하나만 더하는 범위라 고치지 않았다
- 마무리 실행 때 load average 16~18이었고 시간 초과는 없었다. pre-commit `moai gate`는 11개 커밋에서 한 번도 실패하지 않았다
- 실패한 로그인 뒤의 비밀번호(F4 질문): `reset()`이 시도마다 관찰자를 떼므로 `/login`에 머무는 동안에도 변경 캐시에서 바로 지워진다. 떠날 때까지 기다리지 않는다

#### 넘겨받은 항목의 처리

| 항목 | 처리 |
|---|---|
| N1 로그인 세대(첫 커밋) | `startSession(token)`(세대 +1, 토큰 저장, 알림)을 두고 `login`이 쓴다. P8·P8b를 시험으로 옮겨 실패를 확인한 뒤 고쳤다(`red-01`). 로그아웃 → 로그인 기존 시험은 그대로 통과. `refreshSession`의 `@MX:WARN`/`@MX:REASON`에 로그인도 새 세대를 시작한다고 적었다 |
| N2 다른 세대 합류(선택) | 실패를 보일 수 있어(P9, `red-02`) 따로 커밋했다(063a210). `inflight`를 시작한 세대를 함께 두고, 다른 세대의 호출은 자기 갱신을 시작한다. 401 재시도 미들웨어는 바꾸지 않았다 |
| F5 credentials | 인증 3개 경로 밖은 `"omit"`. 요청 기록 시험이 모든 요청의 값을 판정한다(`"include"`는 `/auth/login`·`/auth/refresh`·`/auth/logout`만). design.md §4.1은 sync 단계 |
| F3 hint 비표시 | 정규화 결과의 `hint`는 그대로 두고(AC-08), 로그인 401·매장 선택 500·경로 오류 화면 403 시험에 "hint를 그리지 않는다" 단언을 두었다 |
| F4 비밀번호 | 위 계획과 달라진 점. 성공해 떠난 뒤·실패한 뒤 모두 변경 캐시 상태에 비밀번호 없음(시험 2건) |
| F8 클라이언트 한 번 | 위 계획과 달라진 점(모듈 범위 `createApp` + 문맥). 시험 2건 |
| 처리기 멱등 | 같은 만료로 두 번 불러도 이동 1회·문구 1개(시험 있음). 세션 세대로 판정한다 |
| 일탈 8(합성 502) | 화면은 status로 가르지 않고 정규화 문구를 보인다. 로그인 401·429만 화면 전용 문구다. `access_token` 없는 응답 → "서버에 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요."·세션 없음(시험 있음) |
| S0 | 첫 방문·`/login` 직접 열기에서 문구 없음 단언 2건, 이 탭의 세션 만료에서는 문구 1개(AC-06 (나) 화면 부분과 loader 갈래 시험) |
| D12 | Duration 19.45s라 재실행하지 않았다 |
| M2 관찰(가짜 타이머) | 매장 선택 (바)에서 시점 판정 뒤 진짜 타이머로 바꾸고 다시 시도 요청을 확인했다. 셸 시험은 날짜만 가짜로 둔다(`toFake: ["Date"]`) |

#### 오케스트레이터 재검증·통합과 독립 평가(2026-11-10)

- 세션 `f47c2a0d-1c2b-4303-861c-103a59bc6b04`, 시작 HEAD `0d93b12`(차이 `0 0`, 작업 트리는 주 체크아웃 하나, 같은 SPEC의 다른 세션 없음). 증거는 `.moai/state/verify/f47c2a0d-1c2b-4303-861c-103a59bc6b04/`의 `m4/`(에이전트, 작업 트리에서 옮김 — 64개 파일, `diff -rq` 동일)와 `m4-orchestrator/`다.
- 계획 감사 관문: 캐시 적중을 다시 확인했고 plan-auditor는 부르지 않았다. acceptance·design·plan·research의 sha256이 Run 1 지문과 같고, spec.md는 `status: draft`로 되돌리면 Run 1 지문과 같다. `fd184ee..HEAD`에서 계획 문서 5개를 바꾼 커밋은 6d870b7뿐이다. 일별 기록의 "Audit Run 4"에 남겼다. Phase 4 모드는 §F 판단(serial) 그대로다.
- M4 재검증(에이전트 작업 트리, HEAD `c2d4b82`. grep은 `/usr/bin/grep` GNU grep 3.11)
  - 게이트: typecheck 0, lint 0(180개 파일). `npm test` 69 files / 949 tests, Duration 23.94s, 직후 load 7.83.
  - 같은 트리의 JSON 보고(`ac-gate-files.txt`): AC-09 70(2개 파일), AC-10 21, AC-11 17, AC-12 18, AC-13 54(2개 파일), AC-05 (라) 1, AC-22 폼 단위 13, 넘겨받은 항목 묶음 63(4개 파일), 모두 통과. 게이트별 시험 파일 QG-06 39, QG-07 22, QG-08 27, QG-13 5, QG-14 9, QG-15 26, QG-16 2.
  - 커버리지 exit 0, 줄 99.65 · 문장 98.53 · 함수 99.27 · 분기 94.79(기준 80/80/80/80), 직후 load 14.95. AC-04 (나) 보고 범위 검사 `coverage scope ok: 76 files`(exit 0). 새 파일 가운데 분기가 가장 낮은 곳은 `dev-routes.ts` 50(운영 빌드 갈래)이다(`qg05-new-files.txt`).
  - 빌드 exit 0(`dist/index.html` 17:19:43), `check:dist` exit 0, QG-18 JS 검사 exit 1·출력과 stderr 0바이트, 원본 확인 1. AC-03 프록시 표지 빌드(17:19:51) 검사 exit 1·0바이트.
  - `moai gate` exit 0(pwd=작업 트리, `CLAUDE_PROJECT_DIR`를 비우고 실행, HEAD `c2d4b82`). spec lint 지적 없음.
  - QG-11 경계 검사 exit 1·0바이트·자체 확인 2. QG-12 지정자 검사 exit 1·0바이트·자체 확인 2, `package.json` 키 검사 exit 0.
  - 범위: 바뀐 파일 54개(코드 53 + progress.md)가 모두 `src/`·`scripts/check-dist.mjs`·`package.json`(`check:dist` 한 줄)·progress.md 안이다. 보호 경로 변경 0, 커밋 12개 모두 `🗿 MoAI` 줄이 있다. 주 체크아웃 `moai worktree verify` exit 0(갈라짐 없음).
- 통합: `git merge --ff-only` 뒤 `git push origin main`(`0d93b12..c2d4b82`, 차이 `0 0`). 증거를 옮긴 뒤 작업 트리와 임시 브랜치를 지웠다. 주 체크아웃에서 다시 돌린 typecheck는 exit 0이다(`qg01-typecheck-primary.txt`).
- 독립 평가(sync-auditor, `.moai/reports/sync-audit/SPEC-UI-002-M4.md`, 증거 `m4-evidence/`): **FAIL**, 조화 평균 64.7(기능 75 · 보안 40 · 품질 85 · 일관성 85). 보안은 필수 통과 차원이라 F-1만으로 FAIL이다. 감사자가 다시 돌린 M4 판정 AC 부분과 QG-01~16·QG-18은 모두 통과했고, 넘겨받은 항목(N1·N2·F3·F4·F5·F8·일탈 7·8·처리기 멱등)은 닫혔다.

**차단 결함(수정 1회차 대상, 최대 3회)**

| ID | 등급 | 내용 | 요구 수정 |
|---|---|---|---|
| F-1 | High, 차단 | 열린 리디렉트. `safeNext`(`src/app/safe-next.ts:14-34`)는 원래 값만 검사하고, `nextDestination`이 `new URL`로 다시 직렬화하며 점 구간을 정리한다. 그래서 `/.//evil.example`·`/a/..//evil.example`·`/%2e//evil.example`·`/reservations/..//evil.example/x`가 `//evil.example…`이 된다(탐침 P1). S2에서 `/login?next=%2F.%2F%2Fevil.example`을 열면 loader가 `Location="//evil.example"`(302)을 던지고 라우터가 `location.assign("//evil.example")`로 다른 출처에 문서 이동한다(P2·P2c). 같은 값의 로그인 제출·매장 선택은 `Error: External navigation is not allowed`가 처리되지 않은 채 화면이 멈춘다(P3·P4) | 검사한 문자열과 이동에 쓰는 문자열을 같게 한다. 직렬화 뒤 경로명(`resolved.pathname`)이 `//`로 시작하면 거부한다(`null` → `/reservations`). 표본 `%2F.%2F%2Fevil.example`·`%2Fa%2F..%2F%2Fevil.example`·`%2F%252e%2F%2Fevil.example`을 safe-next 단위·AC-09 (나)(다)·AC-12 (다) 시험에 더한다. 감사자의 한 줄 변형은 기존 대상 시험 101건을 모두 통과했다(`variant-fixed.txt`) |
| F-2 | Medium, 차단 | `/shops`에서 끝난 세션이 로그인 화면으로 가지 않는다(REQ-UI-002-006 위반). 만료 처리기가 매장 미선택 처리기와 같은 `SELF_ROUTED_PATHS`를 쓴다(`src/app/create-app.tsx:32,41-61`). P6: `/shops`에서 고르기 401 + 갱신 401 → 경로 `/shops` 그대로, Alert "로그인이 필요해요. 다시 로그인해 주세요.", 만료 문구 없음 | 만료 처리기는 `/login`에서만 이동을 건너뛴다(매장 미선택 처리기의 집합은 그대로). 시험: `/shops`에서 만료되면 `/login?next=%2Fshops`, 만료 문구 1개, 쿼리 캐시 0개 |

- 정본 처리(오케스트레이터 판단, 사용자가 다르게 정하면 바꾼다): 감사자는 F-1의 점 구간 규칙과 표본 행을 시험보다 먼저 acceptance.md §3.3에 넣도록 manager-spec 재위임을 권했다. §A.9 원칙(감사를 통과한 계획 문서는 run 단계에서 고치지 않고 위임 지시문에 넣는다)과 M2의 F3 결정을 따라, 수정 1회차는 코드와 시험으로 하고 §3.3 규칙 문구·표본 행, 규칙 5("통과한 값은 그대로 이동에 쓴다")와 Location 직렬화의 관계 정리는 sync 단계로 넘긴다. 새 표본의 기대값(거부 → `/reservations`)은 REQ-UI-002-010의 같은 출처 조건과 §3.3의 거부 규칙에서 나온다.
- 이 세션은 문맥 사용량이 1M 기준 인계 지점(50%)에 닿아, 수정 위임 전에 기록을 남기고 멈췄다.

**선택 지적과 넘기는 항목**

| ID | 내용 | 처리 |
|---|---|---|
| N-1 | S0에서 보호 경로를 열면 갱신이 2회 간다(P5 `refreshCount=2`) | 수용(REQ-007의 "판단하기 전에 한 번"은 보호 경로 loader가 지킨다). 줄이는 일은 후속 과제 |
| N-2 | 처리기가 "이동 중"이라 건너뛴 직후 이동이 확정되면, 세션이 없어 `AppShell`이 빈 화면을 남길 수 있다(추론, 재현 안 됨) | M5에 시험 1건과 함께 넘긴다 |
| N-3 | 탭 잠금을 기다리는 동안 세대가 바뀌어도 갱신 요청을 보낸다(결과는 버려짐, 요청 1회 낭비) | 선택 |
| N-4 | `src/features`가 `@/app/services`·`@/app/safe-next`를 가져온다 — design.md §17 의존 방향 밖, 순환 없음 | sync 단계 문서 갱신 |
| N-5 | `src/preview/PreviewPage.tsx:31` 주석이 사실과 다르다 | 수정 1회차에서 고쳐도 된다(선택) |
| N-6 | `LegalDocument`가 문단 글을 `key`로 쓴다 | 수정 1회차에서 고쳐도 된다(선택) |
| N-7 | AC-12 가짜 타이머를 (바)에만 쓴 것 | 수용 |
| 표현 | 정본에 글자가 없어 고른 표현: "페이지를 불러오지 못했어요.", "첫 화면으로 가기", "현재 매장", "등록일 …", "사이드바 접기"·"사이드바 펼치기"·"메뉴 열기", 서랍 제목 "메뉴", "사용자 메뉴", 아이콘 선택 | 사용자 검토(감사자 확인: 정본과 어긋남 없음) |
| M5 | F10(409 필드 오류 변환), AC-07 (가)(나) 화면 부분, N-2 시험, M3 이월(NumberInput 범위 문장과 §3.2 필드 문구 비교, M5~M7) | M5 위임 지시문에 넣는다 |
| sync | design.md §3.1·§3.2·§17·§4.1(F5·F7)·§4.2·§4.3(N3: 세대·`startSession`·합류 규칙), acceptance.md §3.3(F-1 규칙·표본) | sync 단계에서 manager-spec이 고친다 |

- 다음 단계: F-1·F-2 수정 1회차(manager-develop, 임시 작업 트리, 탐침 P1~P4·P6을 시험으로 옮겨 실패를 확인한 뒤 수정) → 오케스트레이터 재검증·통합 → 차분 재감사(sync-auditor, `m4-evidence/m4.probe.test.tsx` 다시 실행) → M5.

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
