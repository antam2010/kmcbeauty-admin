// 미리보기 전시 목록: 컴포넌트마다 보여 줄 상태다. 섹션은 상태마다 시연 요소에
// data-showcase="<컴포넌트>:<상태>"를 단다(오버레이는 여는 버튼에 단다).
// acceptance.md AC-UI-001-14 표(29개 컴포넌트)와 같아야 한다. 29개는 M5에서 모두 들어갔다.

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
  { component: "Card", states: ["parts"] },
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
  { component: "Select", states: ["default", "grouped", "invalid", "disabled"] },
  { component: "Filter", states: ["default", "count"] },
  { component: "Combobox", states: ["local", "remote", "create"] },
  { component: "Calendar", states: ["default", "disabled-dates"] },
  { component: "DateTimePicker", states: ["datetime", "date", "invalid"] },
  { component: "Modal", states: ["sm", "md", "lg", "dirty", "submitting"] },
  { component: "ConfirmDialog", states: ["default", "destructive", "async-failure"] },
  {
    component: "Toast",
    states: ["success", "info", "warning", "destructive", "queue", "action"],
  },
  { component: "Tooltip", states: ["default"] },
  { component: "Table", states: ["default", "sorted", "rail", "loading", "empty"] },
  { component: "Tabs", states: ["default", "disabled"] },
  { component: "Pagination", states: ["first", "middle", "last"] },
  { component: "Sidebar", states: ["expanded", "collapsed"] },
  { component: "Breadcrumb", states: ["default"] },
  { component: "PageHeader", states: ["page-title", "sub-nav"] },
  { component: "ThemeProvider", states: ["root"] },
  { component: "ThemeToggle", states: ["default"] },
];
