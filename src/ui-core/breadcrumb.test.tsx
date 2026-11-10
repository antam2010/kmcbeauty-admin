import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test/axe";
import { Breadcrumb, type BreadcrumbItem, DefaultLink, type LinkComponent } from "./breadcrumb";

const FOCUS_CLASSES = [
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-ring",
];

// acceptance.md AC-UI-001-25: 3단계
const ITEMS: BreadcrumbItem[] = [
  { label: "홈", to: "/manager" },
  { label: "고객", to: "/manager/customers" },
  { label: "김민지" },
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

describe("Breadcrumb — 구조(AC-UI-001-25)", () => {
  it("nav '현재 위치' 안의 ol에 항목이 차례로 있다", () => {
    render(<Breadcrumb items={ITEMS} />);
    const nav = screen.getByRole("navigation", { name: "현재 위치" });
    const list = within(nav).getByRole("list");
    expect(list.tagName).toBe("OL");
    expect(
      within(list)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["홈", "고객", "김민지"]);
  });

  it("기본 링크는 <a href={to}>이고, 마지막 항목은 링크가 아니라 aria-current='page'다", () => {
    render(<Breadcrumb items={ITEMS} />);
    expect(screen.getByRole("link", { name: "홈" })).toHaveAttribute("href", "/manager");
    expect(screen.getByRole("link", { name: "고객" })).toHaveAttribute(
      "href",
      "/manager/customers",
    );
    expect(screen.queryByRole("link", { name: "김민지" })).toBeNull();
    expect(screen.getByText("김민지")).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "고객" })).not.toHaveAttribute("aria-current");
  });

  it("마지막 항목에 to가 있어도 현재 위치로 렌더링한다", () => {
    render(
      <Breadcrumb
        items={[
          { label: "홈", to: "/manager" },
          { label: "고객", to: "/c" },
        ]}
      />,
    );
    expect(screen.queryByRole("link", { name: "고객" })).toBeNull();
    expect(screen.getByText("고객")).toHaveAttribute("aria-current", "page");
  });

  it("가운데 항목에 to가 없으면 링크 없이 글자로 보인다", () => {
    render(
      <Breadcrumb
        items={[{ label: "홈", to: "/manager" }, { label: "매장 관리" }, { label: "시술 메뉴" }]}
      />,
    );
    expect(screen.queryByRole("link", { name: "매장 관리" })).toBeNull();
    expect(screen.getByText("매장 관리")).not.toHaveAttribute("aria-current");
  });

  it("구분 기호는 항목 사이에만 있고 aria-hidden이다", () => {
    const { container } = render(<Breadcrumb items={ITEMS} />);
    const icons = container.querySelectorAll("svg");
    expect(icons).toHaveLength(2);
    for (const icon of icons) expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  it("linkComponent를 주면 각 링크 항목의 to를 그 컴포넌트에 넘긴다", () => {
    received.length = 0;
    render(<Breadcrumb items={ITEMS} linkComponent={RecordingLink} />);
    expect(received).toEqual(["/manager", "/manager/customers"]);
    expect(screen.getByRole("link", { name: "고객" })).toHaveAttribute("data-router-link");
  });

  it("링크는 포커스 윤곽선 클래스 세 개를 가진다", () => {
    render(<Breadcrumb items={ITEMS} />);
    for (const link of screen.getAllByRole("link")) expect(link).toHaveClass(...FOCUS_CLASSES);
  });

  it("axe 위반이 0건이다", async () => {
    const { container } = render(<Breadcrumb items={ITEMS} />);
    await expectNoAxeViolations(container);
  });
});

// acceptance.md §3.10 후속 과제 4의 표본 그대로
const UNSAFE_LINKS = [
  "javascript:alert(1)",
  "JavaScript:alert(1)",
  " javascript:alert(1)",
  "java\tscript:alert(1)",
  "data:text/html,x",
  "mailto:a@b.c",
];
const SAFE_LINKS = ["/customers", "customers", "https://example.com", "http://example.com"];

describe("DefaultLink — 스킴 허용 목록(SPEC-UI-002 후속 과제 4)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  for (const to of UNSAFE_LINKS) {
    it(`${JSON.stringify(to)}는 href="#"이고 개발 모드 경고가 1번이다`, () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(<DefaultLink to={to}>이동</DefaultLink>);
      expect(screen.getByText("이동").closest("a")).toHaveAttribute("href", "#");
      expect(warn).toHaveBeenCalledTimes(1);
    });
  }

  for (const to of SAFE_LINKS) {
    it(`${JSON.stringify(to)}는 그대로 href가 되고 경고가 없다`, () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(<DefaultLink to={to}>이동</DefaultLink>);
      expect(screen.getByText("이동").closest("a")).toHaveAttribute("href", to);
      expect(warn).not.toHaveBeenCalled();
    });
  }

  it('URL로 읽을 수 없는 값(http://[)도 href="#"로 바꾼다', () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(<DefaultLink to="http://[">이동</DefaultLink>);
    expect(screen.getByText("이동").closest("a")).toHaveAttribute("href", "#");
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
