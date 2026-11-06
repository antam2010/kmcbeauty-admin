// 미리보기 전시 목록: 컴포넌트마다 보여 줄 상태다. 섹션은 상태마다 시연 요소에
// data-showcase="<컴포넌트>:<상태>"를 단다(오버레이는 여는 버튼에 단다).
// acceptance.md AC-UI-001-14 표와 같아야 하며, 마일스톤마다 그 마일스톤의 컴포넌트를 더한다.

export interface ShowcaseEntry {
  component: string;
  states: string[];
}

export const SHOWCASE: ShowcaseEntry[] = [
  { component: "ThemeProvider", states: ["root"] },
  { component: "ThemeToggle", states: ["default"] },
];
