import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalendarDays, LayoutDashboard, Scissors, Users } from "lucide-react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test/axe";
import type { LinkComponent } from "./breadcrumb";
import { Sidebar, type SidebarGroup, type SidebarProps } from "./sidebar";

const FOCUS_CLASSES = [
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-ring",
];
// 색이 아닌 선택 단서(acceptance.md AC-UI-001-12)
const NON_COLOR_CUE =
  /(^|\s)(forced-colors:)?(font-semibold|font-bold|underline|border-(\w+-)?\d|outline-\d)(\s|$)/;

// acceptance.md AC-UI-001-25: 묶음 2개, 항목 4개
const GROUPS: SidebarGroup[] = [
  {
    label: "운영",
    items: [
      { to: "/manager", label: "대시보드", icon: LayoutDashboard },
      { to: "/manager/reservations", label: "예약", icon: CalendarDays },
    ],
  },
  {
    label: "고객",
    items: [
      { to: "/manager/customers", label: "고객", icon: Users },
      { to: "/manager/treatments", label: "시술 메뉴", icon: Scissors },
    ],
  },
];

// 받은 to를 기록하는 가짜 라우터 링크
const received: string[] = [];
const RecordingLink: LinkComponent = ({ to, children, ...props }) => {
  received.push(to);
  return (
    <a href={`#router${to}`} data-router-link="" {...props}>
      {children}
    </a>
  );
};

function renderSidebar(props: Partial<SidebarProps> = {}) {
  return render(
    <>
      <button type="button">앞 요소</button>
      <Sidebar groups={GROUPS} currentPath="/manager" linkComponent={RecordingLink} {...props} />
    </>,
  );
}

const link = (name: string) => screen.getByRole("link", { name });

async function tabTo(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole("button", { name: "앞 요소" }));
  for (let step = 0; step < 6; step += 1) {
    await user.tab();
    if (document.activeElement === link(name)) return;
  }
  throw new Error(`${name} 항목에 포커스가 가지 않았어요.`);
}

describe("Sidebar — 구조와 링크(AC-UI-001-25)", () => {
  it("nav 이름은 기본 '주 메뉴'이고 묶음 이름과 항목 4개가 차례로 있다", () => {
    renderSidebar();
    const nav = screen.getByRole("navigation", { name: "주 메뉴" });
    expect(
      within(nav)
        .getAllByRole("link")
        .map((item) => item.textContent),
    ).toEqual(["대시보드", "예약", "고객", "시술 메뉴"]);
    expect(within(nav).getByRole("list", { name: "운영" })).toBeInTheDocument();
    expect(within(nav).getByRole("list", { name: "고객" })).toBeInTheDocument();
  });

  it("aria-label로 nav 이름을 바꿀 수 있다", () => {
    renderSidebar({ "aria-label": "매장 메뉴" });
    expect(screen.getByRole("navigation", { name: "매장 메뉴" })).toBeInTheDocument();
  });

  it("링크 컴포넌트가 각 항목의 to를 받는다", () => {
    received.length = 0;
    renderSidebar();
    expect(received).toEqual([
      "/manager",
      "/manager/reservations",
      "/manager/customers",
      "/manager/treatments",
    ]);
    expect(link("고객")).toHaveAttribute("data-router-link");
  });

  it("linkComponent가 없으면 기본 <a href={to}>를 쓴다", () => {
    render(<Sidebar groups={GROUPS} currentPath="/manager" />);
    expect(link("예약")).toHaveAttribute("href", "/manager/reservations");
  });

  it("header·footer 자리를 렌더링한다", () => {
    renderSidebar({ header: <span>강남점</span>, footer: <span>김원장</span> });
    expect(screen.getByText("강남점")).toBeInTheDocument();
    expect(screen.getByText("김원장")).toBeInTheDocument();
  });
});

describe("Sidebar — 활성 판정과 단서(AC-UI-001-25, AC-UI-001-12)", () => {
  it("currentPath를 '/manager/customers'로 바꾸면 '고객' 항목에만 aria-current='page'가 붙는다(완전 일치)", () => {
    const { rerender } = renderSidebar();
    expect(link("대시보드")).toHaveAttribute("aria-current", "page");
    rerender(
      <>
        <button type="button">앞 요소</button>
        <Sidebar groups={GROUPS} currentPath="/manager/customers" linkComponent={RecordingLink} />
      </>,
    );
    expect(link("고객")).toHaveAttribute("aria-current", "page");
    // 상위 경로 '/manager'는 하위 화면에서 활성이 아니다.
    expect(link("대시보드")).not.toHaveAttribute("aria-current");
    expect(
      screen.getAllByRole("link").filter((item) => item.hasAttribute("aria-current")),
    ).toHaveLength(1);
  });

  it("isActive를 주입하면 그 판정을 쓴다(예: 접두사 일치)", () => {
    renderSidebar({
      currentPath: "/manager/customers/12",
      isActive: (item, path) => path === item.to || path.startsWith(`${item.to}/`),
    });
    expect(link("고객")).toHaveAttribute("aria-current", "page");
    expect(link("대시보드")).toHaveAttribute("aria-current", "page");
    expect(link("예약")).not.toHaveAttribute("aria-current");
  });

  it("활성 항목에만 primary-subtle 면과 색이 아닌 단서(font-semibold·강제 색 테두리)가 있다", () => {
    renderSidebar({ currentPath: "/manager/customers" });
    const active = link("고객");
    expect(active).toHaveClass("bg-primary-subtle", "font-semibold", "forced-colors:border-2");
    expect(active.className).toMatch(NON_COLOR_CUE);
    for (const name of ["대시보드", "예약", "시술 메뉴"]) {
      expect(link(name).className).not.toMatch(NON_COLOR_CUE);
      expect(link(name)).not.toHaveClass("bg-primary-subtle");
    }
  });
});

describe("Sidebar — 접힘(AC-UI-001-25, EC-14)", () => {
  it("접히면 이름은 숨긴 텍스트로 남아 접근 이름이 유지되고 묶음 이름은 구분선으로 바뀐다", () => {
    const { container } = renderSidebar({ collapsed: true });
    expect(link("고객")).toBeInTheDocument();
    expect(within(link("고객")).getByText("고객")).toHaveClass("sr-only");
    expect(screen.getByText("운영")).toHaveClass("sr-only");
    expect(container.querySelectorAll("[data-sidebar-separator]")).toHaveLength(1);
    expect(container.querySelector("[data-sidebar]")).toHaveClass("w-(--sidebar-width-collapsed)");
  });

  it("펼치면 이름이 보이는 글자이고 폭은 펼친 폭이다", () => {
    const { container } = renderSidebar();
    expect(within(link("고객")).getByText("고객")).not.toHaveClass("sr-only");
    expect(container.querySelector("[data-sidebar-separator]")).toBeNull();
    expect(container.querySelector("[data-sidebar]")).toHaveClass("w-(--sidebar-width)");
  });

  it("AC-UI-001-11: 접힌 '고객' 항목에 Tab으로 포커스를 주면 Tooltip이 이름을 보이고 Esc로 닫힌다", async () => {
    const user = userEvent.setup();
    renderSidebar({ collapsed: true, currentPath: "/manager/customers" });
    await tabTo(user, "고객");
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveTextContent("고객");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).toBeNull();
    expect(link("고객")).toHaveFocus();
  });

  it("다시 펴면 숨긴 텍스트가 보이는 이름으로 바뀌고 포커스해도 Tooltip이 뜨지 않는다(EC-14)", async () => {
    const user = userEvent.setup();
    const { rerender } = renderSidebar({ collapsed: true });
    rerender(
      <>
        <button type="button">앞 요소</button>
        <Sidebar groups={GROUPS} currentPath="/manager" linkComponent={RecordingLink} />
      </>,
    );
    expect(within(link("고객")).getByText("고객")).not.toHaveClass("sr-only");
    await tabTo(user, "고객");
    expect(screen.queryByRole("tooltip")).toBeNull();
  });
});

describe("Sidebar — 키보드와 접근성(AC-UI-001-11)", () => {
  it("AC-UI-001-11: Tab으로 항목을 차례로 지나고 Enter로 링크를 연다", async () => {
    const user = userEvent.setup();
    const clicked: string[] = [];
    renderSidebar();
    const recordClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest("a");
      if (target) {
        clicked.push(target.textContent ?? "");
        event.preventDefault();
      }
    };
    document.addEventListener("click", recordClick);
    await user.click(screen.getByRole("button", { name: "앞 요소" }));
    await user.tab();
    expect(link("대시보드")).toHaveFocus();
    await user.tab();
    expect(link("예약")).toHaveFocus();
    await user.keyboard("{Enter}");
    document.removeEventListener("click", recordClick);
    expect(clicked).toEqual(["예약"]);
  });

  it("AC-UI-001-11: 펼침·접힘 모두 항목 링크가 포커스 윤곽선 클래스 세 개를 가진다", () => {
    const { rerender } = renderSidebar();
    for (const item of screen.getAllByRole("link")) expect(item).toHaveClass(...FOCUS_CLASSES);
    rerender(<Sidebar groups={GROUPS} currentPath="/manager" collapsed />);
    for (const item of screen.getAllByRole("link")) expect(item).toHaveClass(...FOCUS_CLASSES);
  });

  it("AC-UI-001-11: 펼침·접힘·Tooltip이 열린 상태에서 axe 위반이 0건이다", async () => {
    const user = userEvent.setup();
    const { container, rerender } = renderSidebar({ currentPath: "/manager/customers" });
    await expectNoAxeViolations(container);
    rerender(
      <>
        <button type="button">앞 요소</button>
        <Sidebar
          groups={GROUPS}
          currentPath="/manager/customers"
          linkComponent={RecordingLink}
          collapsed
        />
      </>,
    );
    await expectNoAxeViolations(container);
    await tabTo(user, "예약");
    await expectNoAxeViolations(container);
    // 포털로 렌더링되는 Tooltip은 tooltip.test.tsx와 같이 그 요소 자체를 검사한다.
    await expectNoAxeViolations(screen.getByRole("tooltip"));
  });
});
