# SPEC-UI-001 진행 기록

| 항목 | 값 |
|---|---|
| SPEC | SPEC-UI-001 — 프로젝트 기반과 디자인 시스템 |
| 상태 | in-progress(run 단계) |
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

### A.9 run 단계 계획 감사 관문 결과(3회차, 2026-11-01)

- 이유: A.7에 적은 대로 계획 산출물이 2회차 PASS 뒤에 v0.3.1로 바뀌었다(2회차 보고서의 감사 대상은 spec.md 0.3.0). 건너뛰기 조건을 잃어 `/moai run`의 Phase 1이 다시 감사했다.
- audit_verdict: PASS
- audit_score: 0.95(Tier L 통과 기준 0.85, 점수 흐름 0.83 → 0.88 → 0.95)
- audit_report: `.moai/reports/plan-audit/SPEC-UI-001-review-3.md`
- audit_at: 2026-11-01T08:43:02Z
- auditor_version: plan-auditor, Claude 단독 감사(`audit_model` 설정과 MCP 감사 도구가 없어 다른 모델의 교차 검증은 없다)
- plan_artifact_hash: 계산하지 못했다(이 세션에는 `moai audit` 명령도 MCP `audit_cache` 도구도 없다)
- 2회차 결함 D14~D19: 모두 해결
- 새 결함 D20~D26: 모두 minor·optional이고 막는 결함은 없다. 계획 산출물(spec·plan·acceptance·design·research)은 이번 run에서 고치지 않는다. 고치면 해시가 바뀌어 이 PASS를 건너뛰기에 쓸 수 없다. 다음 개정 때 D20·D21·D22·D25·D26을 함께 고친다.

| ID | 내용 | 이번 run의 처리 방침 |
|---|---|---|
| D20 | spec.md §5 [EXISTING] 예외가 M1의 spec.md `status`·`updated` 전환을 빠뜨렸다 | manager-develop 위임 프롬프트 Section D에 M1 커밋의 전환 허용을 적는다(plan.md §A.9) |
| D21 | REQ-006이 분류표에서는 Unwanted인데 §4 머리말 규약으로는 복합이다 | 조치 없음(규범 효과 없음) |
| D22 | plan.md §A.2-1 등이 배포 중지 시작점 확인을 아직 미래형으로 적는다 | 결정 지점 3에서 확인이 끝났으므로(A.8) 다시 묻지 않는다 |
| D23 | 계획 커밋 제목이 한국어라 `moai spec lint`에 `StatusGitConsistency` 경고 1건이 난다 | 기준선 경고로 표시해 새 결함과 구분한다. 다음 SPEC의 계획 커밋 제목에는 `plan-phase artifacts` 토큰을 남긴다 |
| D24 | `reference/my-workspace.zip`이 무시 목록에 없다 | 착수 승인 때 확인받은 뒤 `.git/info/exclude`에 `reference/`를 더하고, 스테이징은 파일 경로로만 한다 |
| D25 | AC-14가 토큰 견본 렌더링을 확인하지 않는다(범위 밖) | 조치 없음 |
| D26 | "충분히 짧아야"는 판정할 수 없는 표현이다(범위 밖) | 조치 없음 |

### A.10 run 단계 실행 위치 결정(2026-11-01)

- 발견: manager-develop 정의(`.claude/agents/moai/manager-develop.md` 2행)에 `isolation: worktree`가 있어, 런타임이 에이전트를 `.claude/worktrees/agent-…`의 임시 로컬 브랜치에 격리해 실행한다. 첫 M1 위임은 사전 점검(위치·브랜치·`git status` 불일치)에서 코드를 바꾸지 않고 멈췄다(바뀐 파일 0, 커밋 0, 푸시 없음). 착수 승인 때 오케스트레이터가 "워크트리는 만들지 않는다"고 가정한 것은 에이전트 정의를 미리 확인하지 않은 탓이다.
- 사용자 결정: 임시 워크트리에서 작업하고 `main`으로 빨리 감기(`git merge --ff-only`) 통합한다. 이 결정에 두 가지 허락이 들어 있다: (a) 이 기록 커밋 1개를 `origin/main`에 먼저 푸시, (b) 주 체크아웃에서 `git merge --ff-only`로 로컬 `main` 앞당기기.
- 마일스톤마다의 통합 절차: 오케스트레이터가 기록을 `main`에 커밋·푸시 → manager-develop이 격리 폴더에서 커밋(푸시하지 않음) → 오케스트레이터가 그 폴더에서 검증 → 주 체크아웃에서 `git merge --ff-only <임시 브랜치>` → `git push origin main` → 검증 증거를 주 체크아웃의 `.moai/state/verify/`로 옮긴 뒤 워크트리 정리.
- C3와의 관계: 최종 `main` 이력은 직접 커밋한 것과 같고 원격 브랜치는 생기지 않는다. 임시 브랜치는 로컬에만 있고 푸시 뒤 지운다. spec.md의 C3 문구는 고치지 않았다(고치면 계획 산출물 해시가 바뀐다). 다음 개정 때 C3를 "임시 워크트리 허용"으로 맞춘다.

### A.11 M1 위임 중단과 복구(2026-11-06)

- 중단: 2026-11-01에 보낸 M1 위임(manager-develop, 워크트리 `.claude/worktrees/agent-a472505fe21b3ca72`, 브랜치 `worktree-agent-a472505fe21b3ca72`)이 완료 보고 없이 끝났다. 마지막 기록은 2026-11-02 11:40:08(KST)의 Bash 호출(M1 작업 5번, `moai gate` 기록 단계)이고, 프로세스(pid 1945066)는 남아 있지 않았다. 중단 원인은 기록에 없다. 커밋 0, 푸시 없음.
- 남은 상태: 계획한 M1 변경(삭제 59 · 수정 9 · 새 파일 25, spec.md·progress.md 상태 전환 포함)이 커밋되지 않은 채 이 워크트리에만 있었다. 오케스트레이터가 백업(`.moai/state/verify/78e83a22-ffc5-4a8e-a540-037a45f4a42f/m1-backup/`)을 만든 뒤 E.1 게이트를 다시 실행했다.
- 복구 방식: 구현은 끝나 있었으므로 새 구현 에이전트를 부르지 않았다. 새 manager-develop은 `origin/main`에서 새 워크트리를 만들어 이 변경을 볼 수 없다(A.10). 오케스트레이터가 같은 워크트리에서 남은 기록(게이트 실측, §E.2)을 채우고 훅을 거쳐 커밋한다. 코드는 바꾸지 않았다.
- 구현 에이전트의 증거 파일은 주 체크아웃의 `.moai/state/verify/c18b881e-a179-4fd6-82a0-7b1bacde1e23/`로 복사했다.

## §E.1 Plan-phase Audit-Ready Signal

- plan_complete_at: 2026-10-31T22:06:33+09:00
- plan_status: audit-ready

## §E.2 Run-phase Evidence

### M1 — 기반(2026-11-06 확인)

- 구현: manager-develop(2026-11-01~02, 워크트리 `agent-a472505fe21b3ca72`). 기록과 커밋: 오케스트레이터(§A.11).
- 기준 트리: 워크트리 `agent-a472505fe21b3ca72`, HEAD `287134a` + 커밋 전 M1 변경(이번 실행, 이 트리).
- 증거 경로(주 체크아웃, git 제외): 오케스트레이터 실측 `.moai/state/verify/78e83a22-ffc5-4a8e-a540-037a45f4a42f/`, 구현 에이전트 기록 `.moai/state/verify/c18b881e-a179-4fd6-82a0-7b1bacde1e23/`.

#### E.1 마일스톤 게이트

| 확인 | 명령 | 관찰한 출력 |
|---|---|---|
| 타입 | `npm run typecheck` | exit 0, `tsc --noEmit` 출력 없음(`status-m1-typecheck.txt`) |
| 린트·서식 | `npm run lint` | exit 0, `Checked 32 files in 29ms. No fixes applied.`(`status-m1-lint.txt`) |
| 테스트 | `npm test` | exit 0, `Test Files 11 passed (11)`, `Tests 150 passed (150)`(`status-m1-test.txt`) |
| 커버리지(커밋 직전) | `npm run test:coverage` | exit 0, Statements 100% (59/59), Branches 100% (20/20), Functions 100% (20/20), Lines 100% (51/51)(`m1-close-coverage.txt`) |
| 빌드 | `npm run build` | exit 0, `✓ built in 1.12s`(`m1-close-build.txt`) |
| 게이트 실측 | `moai gate; echo "gate exit=$?"` | `gate exit=0`, 출력 0줄(`m1-close-gate.txt`) — 아래 AC-UI-001-03 기록 참조 |
| 배포 중지 가드 | `npx vitest run src/test/deploy-guard.test.ts` | exit 0, `Tests 5 passed (5)`(`m1-close-deploy-guard.txt`) |
| 경계·옛 의존성 | E.1 코드 블록 세 줄 | 경계 출력 없음, 자체 확인 `2`, 옛 의존성 출력 없음 |
| 작업 트리 | `git status --short` | 삭제 59(`src/` 51 + 루트 8, §I.1과 같음), 수정 11(§I.2의 9 + spec.md·progress.md), 새 파일 25(모두 plan.md에 이름이 있음) |

#### M1 완료 조건(plan.md §F M1)

- 토큰 동기화: `src/styles/tokens.sync.test.ts` 통과(위 150개에 포함).
- 대비: `src/styles/tokens.contrast.test.ts` 통과. 쌍 표 52행(텍스트 36 + UI 16, 605~607행)을 라이트·다크로 재고, 예약 상태 값 90개(5종 × 2테마 × 9측정, 654~656행)를 잰다.
- 기본 테마 정리(E.4 1~4): `src/styles/theme-reset.test.ts` 통과.
- 배포 중지 가드: 위 표.

#### TDD 증거

- RED: 테스트 파일 11개의 첫 실패 출력 `m1-red1-*.txt` 11개(2026-11-02 10:24)와 두 번째 RED `m1-red2-*.txt` 3개(design-rules, theme-init, theme-toggle 방향키). 14개 모두 실패 표시가 있다.
- GREEN: `m1-green-*.txt` 10개, 모두 `passed`.

#### AC-UI-001-03 게이트 실행 단계 기록(M1)

- 실행 단계: `moai gate`는 종료 코드 0이었지만 출력이 없어 실행된 단계(타입·린트·테스트 명령)를 확인할 수 없다 — 공백. `moai gate --help`: "Exit code 0: gate passed (or no recognized language toolchain detected)". 구현 에이전트의 2026-11-02 실행(`m1-gate-precommit.txt`)도 0바이트였다.
- TypeScript: PATH `tsc`는 `/mnt/c/Program Files/nodejs/tsc`(Version 6.0.3, 프로젝트 밖), 프로젝트 `npx tsc --version`은 Version 5.9.3. 게이트가 어느 쪽을 썼는지는 출력이 없어 알 수 없다 — 공백.
- 판정 근거: AC-UI-001-03에 따라 같은 트리에서 따로 실행한 타입·린트·테스트·빌드 명령과 커버리지 명령(위 표)으로 판정한다.
- ast-grep 단계: PATH의 `sg`는 ast-grep이 아니라 `/usr/bin/sg`(그룹 전환 명령)이고, `sg scan`은 `sg: group 'scan' does not exist`를 냈다(`m1-gate-sg-probe.txt`). `gate.yaml`의 ast-grep 게이트는 경고 전용(`warn_only_mode: true`)이라 커밋을 막지 않는다.

#### 커밋

- 커밋: `818b209`

### M2 — 기본 동작·피드백·폼 컨트롤 12개(2026-11-06 확인)

- 구현·기록: manager-develop(워크트리 `agent-a3372b0378407d0da`, 브랜치 `worktree-agent-a3372b0378407d0da`, TDD).
- 기준 트리: HEAD `c3326e8` + 커밋 전 M2 마지막 변경(Card·DataSection·이 기록, 이번 실행, 이 트리).
- 증거 경로(워크트리, git 제외): `.moai/state/verify/spec-ui-001-m2/`. 커밋 단위마다 같은 게이트를 `c1-*`~`c3-*`로 남겼다.

#### E.1 마일스톤 게이트

| 확인 | 명령 | 관찰한 출력 |
|---|---|---|
| 타입 | `npm run typecheck` | exit 0, `tsc --noEmit` 출력 없음(`final-typecheck.txt`) |
| 린트·서식 | `npm run lint` | exit 0, `Checked 60 files in 21ms. No fixes applied.`(`final-lint.txt`) |
| 테스트 | `npm test` | exit 0, `Test Files 23 passed (23)`, `Tests 269 passed (269)`, 5.38s(`final-test.txt`) |
| 커버리지(커밋 직전) | `npm run test:coverage` | exit 0, Statements 100% (146/146), Branches 100% (146/146), Functions 100% (52/52), Lines 100% (128/128)(`final-coverage.txt`) |
| 빌드 | `npm run build` | exit 0, `✓ built in 388ms`(`final-build.txt`) |
| 게이트 실측 | `moai gate; echo "gate exit=$?"` | `gate exit=0`, 출력 0줄(`final-moai-gate.txt`). 실행 단계는 확인할 수 없다 — 공백(M1과 같음) |
| 배포 중지 가드 | `npx vitest run src/test/deploy-guard.test.ts` | exit 0, `Tests 5 passed (5)`(`final-deploy-guard.txt`) |
| 경계·옛 의존성 | E.1 코드 블록 세 줄 | 경계 출력 없음, 자체 확인 `2`, 옛 의존성 출력 없음(`final-grep-*.txt`) |
| 작업 트리 | `git status --short` | M2 계획 경로와 아래 '계획과 다른 점'의 두 파일, 이 기록만 변경 |

#### M2 완료 조건(plan.md §F M2)

- 컴포넌트 12개(Button → Field → Input → Textarea → Checkbox → Search → Alert → Badge → Loading → Skeleton → EmptyState → Card)와 미리보기 섹션 4개(동작·피드백·폼·데이터), 전시 목록 12행을 더했다. `@/ui-core` 런타임 공개 이름은 22개(M1 4 + M2 18)다.
- axe 위반 0: 컴포넌트 테스트 12개마다 주요 상태의 axe 사례가 있고, 미리보기 테스트가 라이트·다크 전체 페이지를 검사한다.
- 포커스 클래스: Button·Checkbox·Search 테스트가 `focus-visible:outline-2`·`outline-offset-2`·`outline-ring`(텍스트 입력은 `focus-visible:border-ring`도)을 확인한다. `AC-UI-001-11` 표지 파일은 4개(theme-toggle·button·checkbox·search, M5에서 16개 목표).
- 선택 단서: M2 컴포넌트에는 배경 채움 선택 상태가 없다(해당 쌍은 M3~M5). 입력 테두리 `border-input`은 Input·Textarea·Checkbox·Search 테스트가 확인한다.

#### TDD 증거

- RED: 컴포넌트마다 구현 전 실패 출력 `m2-red-<컴포넌트>.txt` 12개(모두 `Failed to resolve import`). Field의 첫 실행은 테스트 이름의 따옴표 문법 오류로 실패해 무효로 보고 `m2-red-field-invalid-parse-error.txt`로 따로 두었고, 고친 뒤 다시 얻은 RED가 `m2-red-field.txt`다.
- 통합 RED: 공개 이름·섹션·전시 목록을 테스트 목록에 먼저 더해 실패를 본 `m2-red-integration-{button,forms,feedback,card}.txt` 4개.
- GREEN: `m2-green-*.txt`, 모두 `passed`.

#### 계획과 다른 점

- `src/test/design-rules.test.ts`·`src/preview/PreviewPage.test.tsx`도 고쳤다(plan.md §F M2의 수정 3개 밖). AC-UI-001-09("M1~M4에서는 그 마일스톤에서 만든 이름을 기대 목록에 먼저 더해 RED를 본다")와 AC-UI-001-14("M1~M5는 그때까지 만든 컴포넌트 기준")가 마일스톤마다 '지금까지 만든 것' 목록을 늘리게 하므로, 고치지 않으면 새 컴포넌트 파일만으로 기존 테스트가 실패한다. PreviewPage 테스트에는 피드백 섹션의 예약 상태 배지 시연(순서·상태 클래스가 tone 면을 덮음·안내 문구) 확인도 더했다.
- `SearchProps`는 계획의 `Omit<…, "type" | "value" | "onChange">`에 네이티브 `size`(글자 폭 속성)도 뺐다. Input의 `size`(변형)와 이름이 겹쳐 그대로 넘길 수 없기 때문이다. 런타임 이름은 바뀌지 않는다.

#### 커밋

- `eb192a6` Button과 동작 섹션, `8938a8b` Field·Input·Textarea·Checkbox·Search와 폼 섹션, `c3326e8` Alert·Badge·Loading·Skeleton·EmptyState와 피드백 섹션.
- `5c25d5a` Card와 데이터 섹션, M2 진행 기록.

### M3 — 선택과 오버레이 6개(2026-11-06 확인)

- 구현·기록: manager-develop(워크트리 `agent-ae6f736ac7d611ad1`, 브랜치 `worktree-agent-ae6f736ac7d611ad1`, TDD).
- 기준 트리: HEAD `562406a` + 커밋 전 M3 마지막 변경(Tooltip·Toast·`main.tsx`·오버레이 섹션 나머지·이 기록, 이번 실행, 이 트리).
- 증거 경로(워크트리, git 제외): `.moai/state/verify/spec-ui-001-m3/`. 앞의 두 커밋은 같은 게이트를 `c1-*`·`c2-*`로 남겼다.

#### E.1 마일스톤 게이트

| 확인 | 명령 | 관찰한 출력 |
|---|---|---|
| 타입 | `npm run typecheck` | exit 0, `tsc --noEmit` 출력 없음(`final-typecheck.txt`) |
| 린트·서식 | `npm run lint` | exit 0, `Checked 73 files in 44ms. No fixes applied.`(`final-lint.txt`) |
| 테스트 | `npm test` | exit 0, `Test Files 29 passed (29)`, `Tests 360 passed (360)`, 9.04s(`final-test.txt`) |
| 커버리지(커밋 직전) | `npm run test:coverage` | exit 0, Statements 100% (283/283), Branches 100% (207/207), Functions 100% (112/112), Lines 100% (246/246)(`final-coverage.txt`) |
| 빌드 | `npm run build` | exit 0, `✓ built in 473ms`(`final-build.txt`) |
| 게이트 실측 | pre-commit `moai gate` | 커밋마다 훅이 실행했고 커밋이 만들어졌다(`c1-commit.txt`·`c2-commit.txt`). 실행 단계는 확인할 수 없다 — 공백(M1·M2와 같음) |
| 배포 중지 가드 | `npx vitest run src/test/deploy-guard.test.ts` | exit 0, `Tests 5 passed (5)`(`final-deploy-guard.txt`) |
| 경계·옛 의존성 | E.1 코드 블록 세 줄 | 경계 출력 없음, 자체 확인 `2`, 옛 의존성 출력 없음(`final-grep-*.txt`) |
| 작업 트리 | `git status --short` | M3 계획 경로와 아래 '계획과 다른 점'의 두 파일, 이 기록만 변경 |

#### M3 완료 조건(plan.md §F M3)

- 컴포넌트 6개(Select, Filter, Tooltip, Modal, ConfirmDialog + `showConfirm`·`ConfirmDialogHost`, Toast + `toast`·`Toaster`)와 오버레이 섹션, 폼 섹션의 Select·Filter, 전시 목록 6행을 더했다. `@/ui-core` 런타임 공개 이름은 31개(M2까지 22 + M3 9)다. 컴포넌트 파일은 20개(M2까지 14 + M3 6)다.
- `src/main.tsx`에 `Toaster`와 `ConfirmDialogHost`를 한 번씩 두었다.
- REFACTOR: ThemeToggle의 방향키 선택 보강과 항목 모양을 `filter.tsx`의 내부 훅 `useArrowKeySelection`과 `segmentGroupClasses`·`segmentItemClasses`로 옮겨 Filter와 함께 쓴다(공개 API 아님). `theme-toggle.test.tsx`는 고치지 않았고 전후 모두 `Tests 13 passed (13)`(`m3-theme-toggle-before.txt`, `m3-theme-toggle-after-only.txt`).
- 가짜 타이머: 토스트 테스트 16개는 모두 가짜 타이머(`Date` 포함)로 끝나고 1.56s 걸렸다(`m3-green-toast.txt`). 확인 대화상자는 지연 Promise로 결과를 직접 정하고, 재시도 사례 하나는 가짜 타이머로 기다린다. 전체 스위트 9.04s(게이트 제한 120s).
- 저장소 누수(B-13): `resetToastStore`·`resetConfirmStore`를 모듈 파일에서 내보내고(`index.ts`에는 없음) 두 테스트 파일의 `afterEach`에서 부른다.
- 콘솔 경고(B-17): 설명 없는 Modal에 `aria-describedby`가 없고 `console.warn`·`console.error` 호출 0건임을 modal·confirm-dialog 테스트가 확인한다.
- axe 위반 0: 컴포넌트 테스트 6개마다 주요 상태(열린 목록·대화상자·알림 영역은 그 요소)를 검사하고, 미리보기 테스트가 라이트·다크 전체 페이지를 검사한다.
- 포커스 클래스와 선택 단서: Select 트리거·옵션, Filter 항목, Modal 닫기 버튼, 알림 버튼이 포커스 클래스 세 개를 가진다. 배경 채움 선택 쌍은 Filter 선택 항목(`bg-primary-subtle` + `font-semibold` + `forced-colors:border-2`, 다른 항목에는 없음)이 처음이고, Select 선택 옵션은 체크 아이콘으로 구분한다. `AC-UI-001-11` 표지 파일은 10개(M5에서 16개 목표).

#### TDD 증거

- RED: 컴포넌트마다 구현 전 실패 출력 `m3-red-<컴포넌트>.txt` 6개(select, filter, confirm-dialog, modal, tooltip, toast — 모두 `Failed to resolve import`).
- 통합 RED: 공개 이름·전시 목록·섹션을 테스트 목록에 먼저 더해 실패를 본 `m3-red-integration-{forms,overlays,toast-tooltip}.txt` 3개.
- GREEN: `m3-green-*.txt`, 모두 `passed`. 첫 GREEN에서 실패한 사례와 처리: Select는 열린 동안 Radix가 트리거를 `aria-hidden`으로 가려 테스트가 트리거를 먼저 잡아 두게 했다. ConfirmDialog는 Radix Trigger가 없어 닫힌 뒤 포커스가 돌아오지 않아, 열릴 때 포커스가 있던 요소를 기억해 돌려주게 고쳤다(Modal도 같은 방식). 토스트의 Radix 기본 낭독 이름이 영어 "Notification"이라 Provider `label="알림"`을 주었다.
- REFACTOR 전후: `m3-theme-toggle-before.txt`(13 passed), `m3-theme-toggle-after-only.txt`(13 passed).

#### 계획과 다른 점

- `src/test/design-rules.test.ts`·`src/preview/PreviewPage.test.tsx`도 고쳤다(plan.md §F M3의 수정 6개 밖). M2와 같은 이유로 AC-UI-001-09·AC-UI-001-14의 '지금까지 만든 것' 목록(공개 이름 9개, 컴포넌트 파일 6개, 전시 컴포넌트 6개, 섹션 '오버레이')을 늘려야 했다.
- 저장소 초기화는 design.md §10.2의 `setup.ts` 대신 위임 지시에 따라 toast·confirm-dialog 테스트 파일의 `afterEach`에서 부른다. `setup.ts`는 고치지 않았다(Radix Select·Dialog·Toast에 더 필요한 대체 구현이 없었다).
- Modal의 작성 중 닫기 확인은 선언형 `ConfirmDialog`를 다시 쓴다. `ConfirmOptions.description`이 필수라, 문구 "작성 중인 내용이 사라져요. 닫을까요?"(제목)에 설명 "닫으면 지금까지 입력한 내용은 저장되지 않아요."를 더했다. 버튼은 계획대로 [계속 작성] [닫기].
- `SelectProps`·`FilterProps`는 A.5의 필드에 더해 감싸는 요소의 네이티브 속성(각각 트리거 버튼, 묶음 div)을 받는다(A.5 머리말 "네이티브 속성도 받는다"). 미리보기의 `data-showcase`가 이 경로로 붙는다. `ModalProps`에는 `className`을 더했다.
- 가짜 타이머 아래에서는 user-event 대신 `fireEvent`를 쓴다. Testing Library의 비동기 감싸기가 실제 `setTimeout(0)`을 기다려 Vitest 가짜 타이머에서 멈추기 때문이다. 키보드 경로(F8 → Tab → Enter) 사례 하나와 axe 사례 하나는 실제 타이머로 돌린다(그 안에서 알림 시간이 지나지 않는다).
- 스와이프 닫기는 Radix 기본값(오른쪽, 50px)을 두었고 jsdom에서 확인하지 않았다(AC-UI-001-23, 브라우저 수동 확인 — 아래 공백).

#### 공백(미검증)

- `moai gate`가 실행한 단계(M1·M2와 같음).
- 스와이프 닫기, 실제 브라우저의 위치(768px 기준)·애니메이션, B-20의 "대화상자 위 알림에서 첫 Esc는 알림" 순서는 브라우저에서 확인하지 않았다.

#### 커밋

- `b8f387a` Select·Filter와 방향키 선택 훅 공유, `562406a` ConfirmDialog·Modal과 오버레이 섹션.
- `557b632` Tooltip·Toast와 앱 루트 Host, M3 진행 기록.

### M4 — 고급 입력 3개(2026-11-06 확인)

- 구현·기록: manager-develop(워크트리 `agent-aebfeaac1aea49e27`, 브랜치 `worktree-agent-aebfeaac1aea49e27`, TDD).
- 기준 트리: HEAD `ce06735` + 커밋 전 M4 마지막 변경(DateTimePicker·고급 입력 섹션의 예약 일시 시연·이 기록, 이번 실행, 이 트리).
- 증거 경로(워크트리, git 제외): `.moai/state/verify/spec-ui-001-m4/`. 앞의 두 커밋은 같은 게이트를 `c1-*`·`c2-*`로 남겼다.

#### E.1 마일스톤 게이트

| 확인 | 명령 | 관찰한 출력 |
|---|---|---|
| 타입 | `npm run typecheck` | exit 0, `tsc --noEmit` 출력 없음(`final-typecheck.txt`) |
| 린트·서식 | `npm run lint` | exit 0, `Checked 80 files in 43ms. No fixes applied.`(`final-lint.txt`) |
| 테스트 | `npm test` | exit 0, `Test Files 32 passed (32)`, `Tests 438 passed (438)`, 13.74s(`final-test.txt`) |
| 커버리지(커밋 직전) | `npm run test:coverage` | exit 0, Statements 99.16% (474/478), Branches 96.96% (384/396), Functions 100% (160/160), Lines 100% (423/423)(`final-coverage.txt`). M4 세 파일만 잰 실행(`final-coverage-m4-files.txt`): 합계 Statements 191/195, Branches 177/189이고 빠진 4·12개가 모두 combobox.tsx(96.72·91.24·100·100)에 있어 calendar.tsx·date-time-picker.tsx는 100%다(표는 100% 행을 싣지 않는다) |
| 빌드 | `npm run build` | exit 0, `✓ built in 781ms`(`final-build.txt`) |
| 게이트 실측 | pre-commit `moai gate` | 커밋마다 훅이 실행했고 커밋이 만들어졌다. 실행 단계는 확인할 수 없다 — 공백(M1~M3과 같음) |
| 배포 중지 가드 | `npx vitest run src/test/deploy-guard.test.ts` | exit 0, `Tests 5 passed (5)`(`final-deploy-guard.txt`) |
| 경계·옛 의존성 | E.1 코드 블록 세 줄 | 경계 출력 없음, 자체 확인 `2`, 옛 의존성 출력 없음(`final-grep-*.txt`) |
| 작업 트리 | `git status --short` | M4 계획 경로와 아래 '계획과 다른 점'의 두 파일, 이 기록만 변경 |

#### M4 완료 조건(plan.md §F M4)

- 컴포넌트 3개(Combobox, Calendar, DateTimePicker)와 고급 입력 섹션(로컬 거르기, 400ms 지연 응답 목업의 원격 검색, 빈 결과와 "새 고객 등록", 휴무일을 막은 달력, 예약 일시·날짜만·오류 표시), 전시 목록 3행을 더했다. `@/ui-core` 런타임 공개 이름은 34개(M3까지 31 + M4 3)다. 컴포넌트 파일은 23개(M3까지 20 + M4 3)다.
- E.4 6(react-day-picker 10 API): `calendar.test.tsx` 18개·`date-time-picker.test.tsx` 23개가 통과한다. classNames는 UI 요소 키(`months`·`month`·`nav`·`button_previous`·`button_next`·`month_caption`·`caption_label`·`month_grid`·`weekday`·`day`·`day_button`·`outside`·`hidden` 등)를 토큰 유틸리티로 지정하고 패키지 CSS는 가져오지 않는다. 로캘은 `react-day-picker/locale`의 `ko`, 주말은 `modifiers`(`dayOfWeek` 0·6)와 `modifiersClassNames`(`text-destructive`·`text-primary`), 오늘·선택 표시는 `components.DayButton`에서 수정자를 읽어 그린다. 키마다 도착 날짜(→ 10-30, ← 10-29, ↓ 11-05, ↑ 10-29, PageDown 11-29, PageUp 10-29, Shift+PageDown 2027-10-29, Shift+PageUp 2026-10-29, Home 10-25, End 10-31)는 jsdom에서 실제 포커스 이동으로 확인했다(research.md §6.4의 [미검증] 해소). 월 머리 "2026년 10월", 요일 머리 일~토. 확인 결과: 예.
- E.4 7(cmdk + Popover의 ARIA): `combobox.test.tsx` 37개가 통과한다. `role="combobox"`는 입력 하나, 닫힘 `aria-expanded="false"`, 열림 `aria-controls`=listbox id, 첫 옵션 자동 하이라이트와 `aria-activedescendant`, Popover의 `role="dialog"`를 `presentation`으로 덮어씀, 목록 이름 "<이름> 검색 결과". 확인 결과: 예.
- 가짜 타이머: Calendar·DateTimePicker는 `Date`만 가짜로 두고(2026-10-29 10:00) user-event를 쓴다. 원격 지연 응답 사례 하나는 가짜 타이머 전체로 `fireEvent` + `advanceTimersByTime(400)`. 전체 스위트 13.74s(게이트 제한 120s).
- axe 위반 0: 세 컴포넌트 테스트가 닫힌 상태·열린 목록(로컬·빈 결과·로딩)·열린 대화상자·필수/오류 트리거를 검사하고, 미리보기 테스트가 라이트·다크 전체 페이지를 검사한다.
- 포커스 클래스와 선택 단서: Combobox 입력, 날짜 버튼, 달 이동 버튼, DateTimePicker 트리거가 포커스 클래스 세 개를 가진다. 배경 채움 선택 쌍: Calendar 선택 날짜(`bg-primary` + `forced-colors:outline-2`, 다른 날짜에는 없음), Combobox 하이라이트 옵션(`forced-colors:outline-2`, 하이라이트된 항목에만 붙고 ↓로 옮기면 따라감). 테두리는 Combobox 입력·DateTimePicker 트리거 모두 `border-input`. `AC-UI-001-11` 표지 파일은 13개(M5에서 16개 목표).
- 감속 모드: 두 팝업의 애니메이션 클래스는 `motion-safe:` 아래에만 있다(테스트로 확인).

#### TDD 증거

- RED: 컴포넌트마다 구현 전 실패 출력 `m4-red-{combobox,calendar,date-time-picker}.txt` 3개(모두 `Failed to resolve import`).
- **Combobox 구조**(AC-UI-001-19, K9-a): 1순위(직접 만든 `<input>` + cmdk 목록·키보드·하이라이트)를 채택했다. 근거 RED `m4-red-combobox-structure-probe.txt`: 2순위의 바탕인 `Command.Input`에 `aria-expanded={false}`·`id="field-control"`을 주어도 `aria-expanded="true"`·`id="radix-_r_5_"`로 덮이고, Home 키가 `preventDefault`된다(`expected true to be false`, 3 failed). 1순위 구현은 첫 GREEN 실행(`m4-green-combobox-1.txt`, 8 failed)에서 두 가지를 고친 뒤 `m4-green-combobox-2.txt`에서 37 passed: (1) 목록 id·하이라이트 id를 포털 ref에서 읽는 레이아웃 효과가 첫 커밋에 목록을 못 찾아, `Command.List`를 콜백 ref로 받아 다시 렌더링하게 했다. (2) Radix DismissableLayer가 문서 캡처 단계에서 Esc를 `preventDefault`해 입력의 Esc 처리가 `defaultPrevented` 검사에서 멈췄다 — 그 검사를 없앴다. 하이라이트 id는 `[cmdk-item]`의 `data-value`가 제어형 하이라이트 값과 같은 항목의 id로 읽는다(cmdk의 `data-selected`는 제어형 값 변경 뒤 같은 커밋 안에서 아직 갱신되지 않는다). 첫 하이라이트 되돌리기·포커스 이탈 되돌리기·Home/End(EC-12)는 RED 단계 테스트 목록에 있었다. 2순위로 바꿀 필요는 없었고 D9 밖의 구조 변경도 없다.
- **react-day-picker 10 사용법**(K9-b): 위 E.4 6. 요일 머리는 라이브러리가 `thead`를 `aria-hidden`으로 두고 날짜 버튼 이름에 요일을 넣는다("2026년 10월 29일 목요일") — 첫 GREEN(`m4-green-calendar-1.txt`, 1 failed)에서 `columnheader`를 찾지 못해 테스트를 숨김 포함 검색으로 고쳤다. shadcn v9 예제는 옮기지 않았다.
- **DateTimePicker 첫 포커스와 진행 중 날짜**(K9-c, A.6-10): 보강 없이 만든 첫 구현으로 RED를 먼저 봤다(`m4-red-date-time-picker-focus.txt`, 5 failed: 열 때 포커스된 날짜 `expected undefined to be '2026-10-29'`, 날짜 뒤 시간 칸 포커스 실패). 채택한 규칙: 열 때 Calendar `autoFocus`가 선택 날짜 → 오늘 → 이 달의 첫 활성 날짜 순으로 날짜 버튼에 먼저 포커스를 두고, Radix FocusScope는 이미 안에 포커스가 있어 옮기지 않는다(고를 날짜가 없으면 FocusScope 기본값인 "이전 달로 이동"). 날짜를 고르면 렌더링 뒤의 효과에서 시간 칸 트리거로 포커스를 옮긴다(react-day-picker 날짜 버튼의 포커스 효과보다 늦게 실행되게). 진행 중 날짜는 값이 없을 때만 대화상자 안에 두고 닫으면 버린다(EC-24). 시간을 먼저 고르면 진행 중 시간으로 두고 날짜를 고를 때 합쳐 알린다. GREEN `m4-green-date-time-picker-1.txt` 21 passed(이후 사례 2개를 더해 23).
- 통합 RED: 공개 이름·컴포넌트 파일·전시 목록·섹션을 테스트 목록에 먼저 더해 실패를 본 `m4-red-integration-{combobox,calendar,date-time-picker}.txt` 3개, GREEN `m4-green-integration-*.txt`.
- REFACTOR: Combobox 테스트의 내부 컴포넌트 정의를 파일 수준으로 옮겼다(Biome `noComponentHookFactories`). DateTimePicker는 쓰이지 않던 `onOpenAutoFocus` 막기를 지우고 위 첫 포커스 규칙을 주석으로 남겼다.

#### 계획과 다른 점

- `src/test/design-rules.test.ts`·`src/preview/PreviewPage.test.tsx`도 고쳤다(plan.md §F M4의 수정 3개 밖). M2·M3과 같은 이유로 AC-UI-001-09·AC-UI-001-14의 '지금까지 만든 것' 목록(공개 이름 3개, 컴포넌트 파일 3개, 전시 컴포넌트 3개, 섹션 '고급 입력')을 늘렸다. 여기에 더해 `PreviewPage.test.tsx`의 페이지 전체 axe 사례(라이트·다크 두 번)에 테스트별 제한 시간 20초를 주었다. 달력 두 개가 들어가며 커버리지 계측 + 병렬 실행에서 4.6~5.0초로 기본 5초에 닿았고 한 번은 넘었다(`c2-coverage.txt`의 첫 실행 `Test timed out in 5000ms`, 마지막 실측 6178ms — `final-coverage-verbose.txt`). 단독 실행은 1.56초다.
- `src/test/setup.ts`는 고치지 않았다(cmdk·react-day-picker·Radix Popover에 더 필요한 대체 구현이 없었다).
- DateTimePicker 트리거는 `role="combobox"` + `aria-haspopup="dialog"`인 버튼이다. 버튼 역할은 `aria-required`를 받지 못해 필수 표시가 있으면 axe `aria-allowed-attr` 위반이 났다(미리보기 오류 시연에서 발견). APG 날짜 선택 콤보박스 형태로 두어 AC-UI-001-16의 `aria-required="true"`를 유지한다. Enter·Space로 여는 동작은 버튼 그대로다.
- `CalendarProps`에 `autoFocus`(DateTimePicker가 첫 포커스에 씀)·`className`·`aria-label`을 더했다(A.5 머리말 "네이티브 속성도 받는다"). `aria-label`은 이동 모음 이름 "<이름> 달 이동"에 쓴다 — 미리보기에 달력이 둘이라 기본 이름 "탐색 모음"이 겹쳐 axe `landmark-unique` 위반이 났다.
- `ComboboxProps`·`DateTimePickerProps`는 A.5의 필드에 더해 감싸는 요소의 네이티브 속성(각각 입력, 트리거 버튼)을 받는다. 미리보기의 `data-showcase`가 이 경로로 붙는다. Combobox 목록 이름은 `aria-label`이 있으면 "<이름> 검색 결과", 없으면 "검색 결과"다(cmdk 기본값은 영어 "Suggestions").
- Combobox의 불러오는 중 표시(`role="status"`)와 빈 결과 문구는 팝업 안, listbox 요소 바깥에 둔다(listbox 안의 `status` 역할은 허용되지 않는 자식이다). 새 값 만들기는 listbox 안의 옵션이다.
- `getTimeSlots`는 date-fns가 아니라 분 단위 산술로 만든다(design.md §7.2는 date-fns를 적었다 — 표준 기능으로 충분하다). 표기 `formatDateTime`은 date-fns `format` + `ko` 로캘이다. `timeRange`가 없으면 하루 전체(00:00~23:30, 30분)다.

#### 공백(미검증)

- `moai gate`가 실행한 단계(M1~M3과 같음).
- 실제 브라우저에서의 팝업 위치·애니메이션, 한글 IME의 실제 조합 이벤트 순서(테스트는 `isComposing`·`keyCode 229` 이벤트를 흉내 낸다), 스크린 리더 낭독은 확인하지 않았다.
- Combobox가 Modal 안에 있을 때 닫힌 목록의 두 번째 Esc가 Modal도 닫는지는 확인하지 않았다.

#### 커밋

- `02b3be0` Combobox와 고급 입력 섹션, `ce06735` Calendar와 고급 입력 섹션의 달력 시연.
- 마지막 커밋(DateTimePicker·예약 일시 시연·이 기록)의 SHA는 커밋이 만들어진 뒤에 정해지므로 다음 기록 커밋에서 채운다.

## §E.3 Run-phase Audit-Ready Signal

_<pending run-phase — manager-develop가 기록한다>_

## §E.4 Sync-phase Audit-Ready Signal

_<pending sync-phase — manager-docs가 기록한다>_

## §F Phase 4 Mode Selection

- Decision: serial (`--solo`로 강제 — 마일스톤마다 manager-develop 하나를 순서대로 보낸다)
- 기록 시점: 2026-11-01, 착수 승인(Implementation Kickoff Approval)을 받은 뒤 첫 run 단계 에이전트 호출 전
- 사용자 선택(착수 승인 질문): 착수 승인, 진행 방식 = 자율(autonomous), 푸시 방식 = 마일스톤마다 검증 직후 `origin/main`에 푸시(오케스트레이터가 검증 뒤에 푸시하고 manager-develop은 푸시하지 않는다)
- 가정 5가지(착수 승인 보고 ⑥)를 승인과 함께 받았다: `main`에서 작업·브랜치 없음, `reference/`는 커밋하지 않고 로컬 제외(`.git/info/exclude`), 계획 산출물은 고치지 않되 M1에서 spec.md `status`·`updated`만 전환, 프로젝트 문서는 만들지 않음, 구현 에이전트는 모델 정책(medium)에 따라 opus

### 입력값

| 항목 | 값 |
|---|---|
| tier | L |
| 범위(파일 수) | 새 87 · 삭제 59 · 수정 9와 이후 마일스톤의 갱신(plan.md §F.7) |
| 도메인 수 | 4 — 스타일·토큰, 컴포넌트, 테스트 장치, 빌드·배포 설정 |
| 파일 언어 구성 | TypeScript·TSX·CSS 중심, JSON·shell·markdown 소량 |
| 동시 실행 이득 | 낮음 — 코딩 중심이고 마일스톤이 서로 의존한다 |
| Agent Teams 전제 | 해당 없음 — 명시 요청 없음 |

### 모드 평가

| 모드 | 선택 | 근거 |
|---|---|---|
| direct | 아니오 | 오탈자·한 줄 수정이 아니라 구현 규모가 크다 |
| serial | 예 | `--solo`가 강제했고, 코딩 중심 작업의 기본값이다 |
| fanout | 아니오 | 읽기 전용 조사가 아니고, 마일스톤이 서로 의존한다 |
| sweep | 아니오 | 균일한 기계적 변환이 아니다. 새 코드가 대부분이다 |

### 경계 사례

- manager-lead 진입 조건(마일스톤 3개 이상, 파일 10개 이상, 여러 도메인)을 충족하지만 쓰지 않는다. `--solo`가 순차 실행을 강제했고, manager-lead는 워크트리로 격리한 리프 작업자를 병렬로 돌리는데 이 SPEC은 `main`에서 브랜치 없이 작업한다(C3).

### 근거

코딩 중심이고 마일스톤이 앞 단계의 규약(토큰 이름, `cn` 병합 규칙, 테스트 환경, 공개 내보내기)에 기대므로 순차 실행이 맞다. 병렬로 얻는 이득이 작고 쓰기 충돌 위험이 크다. `sweep` 확인 항목은 해당 없음(선택하지 않았다).

### 실행 방식 정정(2026-11-01)

- 위의 "`main`에서 작업·브랜치 없음" 가정은 manager-develop의 `isolation: worktree` 때문에 지켜지지 않았고, A.10의 결정(임시 워크트리 + 빨리 감기 통합)으로 대체했다.
- 자율 진행은 `moai goal`을 걸지 않고 구현 에이전트의 완료 알림으로 마일스톤을 이어간다. 목표를 걸어 보니 완료 조건 문장이 셸 명령 1개(`type: mechanical`)로 등록돼 평가 0회에서 바로 지웠고, 모델 조건 목표는 오케스트레이터가 지울 때까지 모든 턴 끝을 막아 에이전트를 기다리는 동안 상한만 소모하기 때문이다. 완료 조건은 마일스톤마다와 마지막에 오케스트레이터가 증거로 판정한다.

## §H Recursive Self-Diagnosis Log

_<run 단계에서 필요할 때 기록한다>_

## §I Token Accounting

_<동기화 단계를 닫을 때 기록한다>_
