# SPEC-UI-001 진행 기록

| 항목 | 값 |
|---|---|
| SPEC | SPEC-UI-001 — 프로젝트 기반과 디자인 시스템 |
| 상태 | draft(계획 단계) |
| 등급 | Tier L(spec·plan·acceptance·design·research 5종 + spec-compact.md, plan-auditor 통과 기준 0.85) |
| 하네스 수준 | standard |
| 개발 방식 | TDD(RED → GREEN → REFACTOR), 커버리지 목표 85% |
| Git | late-branch — 주 체크아웃의 `main`, 브랜치 생성 없음(git-strategy `auto_enabled: false`). 푸시·PR 경로는 오케스트레이터가 정한다 |
| 기준 커밋 | `28c87a9`(기존 앱이 남는 커밋) |

## §A 계획 단계 기록

### A.1 산출물

| 파일 | 내용 | 작성 단계 |
|---|---|---|
| `research.md` | 현재 저장소·레퍼런스·라이브러리 조사와 검증 기록, 대안 비교 | Phase 8 → 0.2.0 검토 때 §6.14 추가 |
| `plan.md` | 구현 계획: 컴포넌트 29개, 공개 인터페이스, 키보드 계약, 마일스톤 M1~M6, 위험, MX 계획 | Phase 8 초안 → Phase 10 확정 → 0.2.0 검토 → 0.3.0 감사 반영 → 0.3.1 2회차 감사 뒤 개정 |
| `spec.md` | 요구사항 모듈 5개·요구사항 25개(GEARS), 인수 기준 요약 25개, 제외 범위, 영향받는 파일 | Phase 10 → 0.2.0 → 0.3.0 → 0.3.1 |
| `acceptance.md` | Given-When-Then 시나리오 25개, 기대값 표, 경계 사례 30개, 품질 게이트 15개 | Phase 10 → 0.2.0 → 0.3.0 → 0.3.1 |
| `design.md` | 구현 구조(파일 구성, 작성 규약, 명령형 API, 토큰 파이프라인, 고급 입력, 미리보기, 테스트 장치, 배포 가드) | Phase 10 → 0.2.0 → 0.3.0 → 0.3.1 |
| `spec-compact.md` | spec.md §4·§5·§7·§8·§9를 글자 그대로 뽑은 run 단계용 발췌 | Phase 10 → 0.2.0 → 0.3.0 → 0.3.1 |
| `progress.md` | 이 기록 | Phase 10 |

### A.2 디자인 결정 D1~D9(design-direction.md §17)

| # | 결정 |
|---|---|
| D1 | 예약 상태 집합은 백엔드 enum 5종(`RESERVED`·`VISITED`·`CANCELLED`·`NO_SHOW`·`COMPLETED`). 기존 관리자의 `FINISHED` 타입은 폐기 |
| D2 | 상태 라벨과 색은 네이티브 앱과 맞춤(예약됨 인디고·방문함 자홍·완료 하늘·취소됨 빨강·노쇼 앰버). 전용 `status-*` 토큰, 틴트 배지 + 상태 레일, 방문함 아이콘 `DoorOpen` |
| D3 | UI 문체는 해요체 |
| D4 | 시간 표기는 24시간제 `HH:mm` |
| D5 | 입력 테두리 `#808b9d`(3:1 충족) |
| D6 | 사이드바 240px / 접힘 64px |
| D7 | 테마 기본값은 시스템 설정 |
| D8 | Tailwind 기본 테마 정리 적용(미리보기·자동 테스트로 확인) |
| D9 | Combobox는 cmdk 1.1.1(Radix Popover 1.3.1 안), DateTimePicker는 react-day-picker 10.0.2 + date-fns 4.4.0 `ko` |

### A.3 결정 지점 1 결과(2026-10-29)

- 사용자가 plan.md를 그대로 승인했다("Proceed" — 오케스트레이터가 AskUserQuestion으로 받음).
- 열린 질문 1 → **운영 배포 중지**: 기존 앱을 걷어내는 M1 커밋부터 SPEC-UI-002 완료까지 배포하지 않는다(0.3.0에서 시작점 표현을 통일 — 결정 지점 1 당시 기록은 "SPEC-UI-001 완료부터"). `deploy.sh`에 배포 중지 가드를 넣는다(`ALLOW_PREVIEW_ONLY_DEPLOY`가 `1`이 아니면 `.env.stage`를 읽기 전에 안내를 출력하고 종료 코드 1). 가드는 SPEC-UI-002가 업무 화면을 되살릴 때 지운다(REQ-UI-001-004, AC-UI-001-04).
- 시작점을 M1 커밋으로 둔 이유: M1 커밋이 기존 앱을 같은 자리에서 지우므로 그때부터 `main`은 미리보기 전용이 되고, 그 상태로 배포하면 운영 관리자 화면이 미리보기로 바뀐다. 결정 지점 1의 기록보다 앞당긴 시작점이므로 착수 승인 때 오케스트레이터가 사용자에게 보여 확인받는다.
- 열린 질문 2 → **고정폭 숫자**: Noto Sans KR Variable의 `tnum` 지원 여부는 M6 미리보기에서 측정·기록만 하고, 대체 숫자 글꼴 결정은 SPEC-UI-002로 넘긴다.
- plan.md §A.2의 기본값 10개를 그대로 수락했다: TypeScript 5.9.3, jsdom 29.1.1, 예약 상태 배지는 SPEC-UI-002 도메인 모듈, Table은 TanStack 보류, 상단바·앱 셸은 SPEC-UI-002, 테마 전환은 단일 선택 묶음, Combobox는 단일 선택(다중 선택 칩 제외), Tabs·Checkbox 포함, npm 사용(`bun.lock` 삭제), Biome 서식은 옛 Prettier 모양.

### A.4 다음 단계

1. plan-auditor 독립 감사(Tier L 통과 기준 0.85).
2. 통과하면 §E.1에 계획 단계 완료 신호를 기록한다.
3. 구현 착수 승인(Implementation Kickoff Approval)을 받은 뒤 `/moai run SPEC-UI-001`으로 M1부터 진행한다.

### A.5 검토 반영(spec.md 0.2.0, 2026-10-29)

- plan-auditor 실행 전 세 관점 검토(주요 19건·경미 26건)를 반영했다. 요구사항은 REQ-UI-001-025를 더해 25개가 됐고(기존 ID 유지), 인수 기준은 25개를 유지하며 강화했다. 라이브러리 동작 근거는 research.md §6.14다.
- era 분류 확인(`moai spec audit --json`, 읽기 전용): §E.1~§E.4 뼈대가 있는 지금 SPEC-UI-001은 `V3R5`(H-3: §E.2 있음, `sync_commit_sha` 없음)로 분류된다. 저장소 밖 임시 사본으로 확인한 결과, §E.2~§E.4를 빼면 `V3R2-R4`(H-2: §E.* 표시 없음)로 역시 유예 분류이고, 동기화 커밋이 §E.4에 `sync_commit_sha`를 채우면 `V3R6`(H-4)이 된다. 계획 단계에서 뼈대를 빼도 분류가 나아지지 않으므로, progress.md Section Map과 manager-spec 규칙대로 §E.1~§E.4 뼈대를 그대로 둔다.

### A.6 plan-auditor 1회차 반영(spec.md 0.3.0, 2026-10-29)

- 1회차 판정은 FAIL(0.83, Tier L 기준 0.85)이다(`.moai/reports/plan-audit/SPEC-UI-001-review-1.md`). 막는 결함 D1(REQ-023 Pagination 규칙 ↔ acceptance.md §3.1 표)과 D2(REQ-020 조건 범위)를 고쳤고, 선택 결함 D3~D9·D11·D12를 반영했다. D10(SPEC 디렉터리 안의 중첩 `.moai/`)은 오케스트레이터가 지웠고, D13(SPEC-UI-002 미작성)은 할 일이 없다. REQ 25개·AC 25개와 모든 ID는 그대로다.

### A.7 plan-auditor 2회차 반영(spec.md 0.3.1, 2026-10-30)

- 2회차 판정은 PASS(0.88, Tier L 기준 0.85)다(`.moai/reports/plan-audit/SPEC-UI-001-review-2.md`). 통과 뒤 남은 결함 D14(막음)와 D15~D19(선택)를 이번 개정에서 모두 반영했다. REQ 25개·AC 25개와 모든 ID는 그대로다.
- D14: REQ-021에서 제출 중(`closeDisabled`)을 작성 중(`dirty`)보다 먼저 판정한다. 제출 중이면 `dirty`와 상관없이 닫기 요청을 무시하고 작성 중 확인도 띄우지 않는다. AC-22 (나)에 "작성 중 확인 대화상자가 뜨지 않는다"를 더했고, AC-22 요약, plan.md(A.5 `ModalProps`, A.6-4, A.6-8 표, E.3), design.md §4.6을 같게 맞췄다.
- D15: spec.md §5 [EXISTING] 줄에 예외를 적었다. `.moai/specs/SPEC-UI-001/progress.md`와 `.moai/state/verify/`의 증거 파일은 run 단계 소유 에이전트가 쓴다.
- D16: AC-10 금지 이름 집합을 고쳤다. 컨테이너 규칙에 `inline-`·`min-inline-`·`max-inline-`·`basis-`·`columns-`와 컨테이너 쿼리 변형 `@<이름>:`·`@min-<이름>:`·`@max-<이름>:`을 더했다. 색 규칙은 접두사와 상관없는 닫힌 규칙(계열 26개·단계 11개 열거)으로 바꾸고, 토큰 클래스·흔한 유틸리티와 겹치는지 확인해 유일하게 겹치는 `font-black`을 예외로 적었다. 자기 검사 표본에 `basis-md`를 더했다(EC-18도 같게).
- D17: REQ-025와 AC-12 요약의 열거를 "Select 선택 옵션(체크 아이콘), Select·Combobox 하이라이트 옵션"으로 나눴다. acceptance.md AC-12와 design.md §4.3에 Select 하이라이트 옵션은 `focus-visible` 윤곽선(AC-UI-001-11)으로 구분된다고 적었다.
- D18: REQ-023 표시 지연의 주어를 SkeletonGroup으로, 시간을 `delayMs`(기본 300ms)로 바꿨다. AC-24·EC-10과 plan.md(A.3 표, A.5, E.3)의 지연 문구를 맞췄다.
- D19: spec.md §4.6의 복합 정의를 "조건절 유형이 둘 이상이거나 항상 절과 섞임"으로 고쳤다(007·021은 그대로 둔다). acceptance.md §1.1 REQ-010 행에 "기반 라이브러리 가져오기(09 And)"를 더했다.
- 그 밖에: plan.md §E.5 제목에 `(mx_plan)`을 달고, 첫 문장을 "MX 대상은 계획 단계(Phase 14)에서 정하고 태그는 run 단계에서 각 파일을 만들 때 쓰며 동기화 단계는 확인만 한다"는 뜻으로 바로잡았다. 표는 그대로다.
- spec.md·plan.md·acceptance.md·design.md가 바뀌어 계획 산출물 해시가 2회차 감사 때와 달라졌다. 그래서 run 단계의 계획 감사 게이트(Phase 1)는 건너뛰기 조건을 잃고 다시 감사한다.

### A.8 결정 지점 3 결과(2026-10-31)

- 사용자가 구현 시작을 골랐다(오케스트레이터가 AskUserQuestion으로 받음). 코드 변경은 `/moai run`의 계획 감사 게이트와 착수 승인을 지난 뒤에 시작한다.
- 운영 배포 중지 시작점: 사용자가 "M1 커밋부터"를 확인했다(A.3의 확인 절차 완료).
- 계획 문서 저장: `.moai/design/system.md`와 이 SPEC 문서 9개를 `main`에 커밋하고 푸시한다. `reference/my-workspace.zip`은 공개 저장소에 올리면 되돌리기 어려우므로 커밋하지 않고 이 체크아웃에만 둔다.
- 실행 방식: tmux가 없어 하위 에이전트 순차 실행(`--solo`)이고, 새 브랜치 없이 `main`에서 작업한다(Late-branch, C3).

## §E.1 Plan-phase Audit-Ready Signal

- plan_complete_at: 2026-10-31T22:06:33+09:00
- plan_status: audit-ready

## §E.2 Run-phase Evidence

_<pending run-phase — manager-develop가 기록한다>_

## §E.3 Run-phase Audit-Ready Signal

_<pending run-phase — manager-develop가 기록한다>_

## §E.4 Sync-phase Audit-Ready Signal

_<pending sync-phase — manager-docs가 기록한다>_

## §F Phase 4 Mode Selection

_<오케스트레이터가 첫 run 단계 에이전트 호출 전에 기록한다>_

## §H Recursive Self-Diagnosis Log

_<run 단계에서 필요할 때 기록한다>_

## §I Token Accounting

_<동기화 단계를 닫을 때 기록한다>_
