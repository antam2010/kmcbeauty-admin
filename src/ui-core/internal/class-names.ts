// ui-core 안에서만 쓰는 공용 클래스 문자열(비공개 — index.ts가 내보내지 않는다).
// 여러 컴포넌트에 같은 글자로 복사돼 있던 것을 한곳에 모았다(SPEC-UI-002 후속 과제 7·8).
// 글자를 그대로 두어야 Tailwind가 이 파일에서 후보 클래스를 찾는다 — 이어 붙여 만들지 않는다.

/** 키보드 포커스 윤곽선(system.md §8 공통 상태 focus-visible). box-shadow 링이 아니라 outline이라 고대비 모드에서도 남는다 */
export const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/**
 * 선택된 항목(현재 쪽·활성 메뉴·고른 필터). primary-subtle 면에 색이 아닌 단서(font-semibold + 강제 색 모드 테두리)를
 * 함께 둔다(system.md §8 selected, REQ-UI-001-025). hover에서도 같은 면을 유지한다.
 */
export const SELECTED_ITEM =
  "bg-primary-subtle font-semibold text-primary-subtle-foreground hover:bg-primary-subtle hover:text-primary-subtle-foreground forced-colors:border-2";

/**
 * 팝오버를 여는 입력 모양 트리거(DateTimePicker·DateRangePicker). Input과 같은 면이고 테두리는 input 토큰(D5),
 * 포커스는 ring 테두리 + 윤곽선, invalid는 destructive 테두리·윤곽선.
 */
export const PICKER_TRIGGER = `inline-flex h-10 w-full min-w-0 items-center gap-2 rounded-control border border-input bg-card px-3 text-start text-body text-foreground transition-colors focus-visible:border-ring ${FOCUS_RING} disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus-visible:outline-destructive`;
