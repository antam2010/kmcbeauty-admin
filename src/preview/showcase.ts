// 미리보기 전시 목록: 컴포넌트마다 보여 줄 상태다. 섹션은 상태마다 시연 요소에
// data-showcase="<컴포넌트>:<상태>"를 단다(오버레이는 여는 버튼에 단다).
// acceptance.md AC-UI-001-14 표와 같아야 하며, 마일스톤마다 그 마일스톤의 컴포넌트를 더한다.

export interface ShowcaseEntry {
  component: string;
  states: string[];
}

export const SHOWCASE: ShowcaseEntry[] = [
  {
    component: "Button",
    states: [
      "default",
      "outline",
      "ghost",
      "destructive",
      "link",
      "sm",
      "lg",
      "icon",
      "icon-sm",
      "loading",
      "disabled",
      "as-child",
    ],
  },
  {
    component: "Badge",
    states: ["neutral", "info", "success", "warning", "destructive", "icon", "dot"],
  },
  { component: "Loading", states: ["sm", "md"] },
  { component: "Skeleton", states: ["block", "text", "group"] },
  { component: "EmptyState", states: ["with-action"] },
  { component: "Alert", states: ["info", "success", "warning", "destructive", "live"] },
  { component: "Field", states: ["description", "error", "required"] },
  {
    component: "Input",
    states: [
      "sm",
      "default",
      "lg",
      "start-adornment",
      "end-adornment",
      "invalid",
      "read-only",
      "disabled",
    ],
  },
  { component: "Textarea", states: ["default", "invalid", "disabled"] },
  {
    component: "Checkbox",
    states: ["unchecked", "checked", "indeterminate", "disabled", "invalid"],
  },
  { component: "Search", states: ["empty", "filled"] },
  { component: "ThemeProvider", states: ["root"] },
  { component: "ThemeToggle", states: ["default"] },
];
