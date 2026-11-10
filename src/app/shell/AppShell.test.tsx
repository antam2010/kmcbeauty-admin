// 앱 셸(AC-UI-002-10, EC-07·EC-08·EC-40). 폭은 matchMedia 대역, 크기는 클래스로 판정한다(acceptance.md §0 jsdom 한계).
// 크기 클래스와 값은 system.md §10(상단바 h-14, 사이드바 w-(--sidebar-width)·w-(--sidebar-width-collapsed))을 그대로 옮겼다.
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/axe";
import { shopFixture } from "@/test/msw/fixtures";
import { expectLocation, installViewport, renderRoute } from "@/test/render-route";

const KEY = "kmc-admin-sidebar";
const gangnam = { ...shopFixture, id: 1, name: "강남점" };

beforeEach(() => {
  // 오늘 2026-11-09T10:00:00+09:00. 날짜만 가짜로 두고 타이머는 진짜로 흐른다
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-09T10:00:00+09:00"));
});

afterEach(() => {
  vi.useRealTimers();
});

async function openShell(width: number, path = "/customers") {
  const viewport = installViewport(width);
  const user = userEvent.setup();
  const view = renderRoute(path, { session: "S2", shop: gangnam });
  await screen.findByRole("heading", { level: 1, name: path === "/customers" ? "고객" : /.+/ });
  return { ...view, user, viewport };
}

const sidebar = () => document.querySelector<HTMLElement>("[data-sidebar]");
const isCollapsed = () => sidebar()?.className.includes("w-(--sidebar-width-collapsed)") ?? false;

describe("AC-UI-002-10 1024px 이상 — 저장 구간", () => {
  it.each([1280, 1024])(
    "%ipx: 처음에 펼침, 접으면 저장값 collapsed, 다시 그려도 접혀 있다",
    async (width) => {
      const first = await openShell(width);
      expect(sidebar()?.className).toContain("w-(--sidebar-width)");
      expect(isCollapsed()).toBe(false);
      await first.user.click(screen.getByRole("button", { name: "사이드바 접기" }));
      expect(isCollapsed()).toBe(true);
      expect(window.localStorage.getItem(KEY)).toBe("collapsed");
      first.unmount();

      await openShell(width);
      expect(isCollapsed()).toBe(true);
      expect(screen.getByRole("button", { name: "사이드바 펼치기" })).toBeInTheDocument();
    },
  );

  it("저장값이 expanded면 펼친 채 시작한다", async () => {
    window.localStorage.setItem(KEY, "expanded");
    await openShell(1280);
    expect(isCollapsed()).toBe(false);
  });

  it("localStorage 접근이 예외를 던져도 펼침으로 시작하고 예외가 새지 않는다(EC-07)", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });
    const view = await openShell(1280);
    expect(isCollapsed()).toBe(false);
    await view.user.click(screen.getByRole("button", { name: "사이드바 접기" }));
    expect(isCollapsed()).toBe(true);
  });
});

describe("AC-UI-002-10 (가) 768~1023px — 저장하지 않는 접힘 구간", () => {
  it.each([900, 1023, 768])(
    "%ipx: 저장값이 expanded여도 접힌 채 시작하고, 펼쳐도 저장값은 그대로다",
    async (width) => {
      window.localStorage.setItem(KEY, "expanded");
      const view = await openShell(width);
      expect(isCollapsed()).toBe(true);
      await view.user.click(screen.getByRole("button", { name: "사이드바 펼치기" }));
      expect(isCollapsed()).toBe(false);
      expect(window.localStorage.getItem(KEY)).toBe("expanded");
    },
  );

  it("저장값이 collapsed일 때 펼쳐도 저장하지 않는다", async () => {
    window.localStorage.setItem(KEY, "collapsed");
    const view = await openShell(900);
    await view.user.click(screen.getByRole("button", { name: "사이드바 펼치기" }));
    expect(window.localStorage.getItem(KEY)).toBe("collapsed");
  });

  it("1280px에서 접은 뒤 900px이면 접힘, 다시 1280px이면 저장값(collapsed)을 따른다(EC-08)", async () => {
    const view = await openShell(1280);
    await view.user.click(screen.getByRole("button", { name: "사이드바 접기" }));
    view.viewport.resize(900);
    await waitFor(() => expect(isCollapsed()).toBe(true));
    // 900px 구간에서 펼쳐 둔 것은 저장하지 않는다
    await view.user.click(screen.getByRole("button", { name: "사이드바 펼치기" }));
    view.viewport.resize(1280);
    await waitFor(() => expect(isCollapsed()).toBe(true));
    expect(window.localStorage.getItem(KEY)).toBe("collapsed");
  });

  it("900px 구간을 떠났다가 다시 들어오면 접힘으로 다시 시작한다", async () => {
    const view = await openShell(900);
    await view.user.click(screen.getByRole("button", { name: "사이드바 펼치기" }));
    expect(isCollapsed()).toBe(false);
    // 1280px 구간이 한 번 그려진 뒤(act로 렌더를 마침) 900px로 돌아온다
    act(() => view.viewport.resize(1280));
    act(() => view.viewport.resize(900));
    expect(isCollapsed()).toBe(true);
  });
});

describe("AC-UI-002-10 (나) 768px 미만 — 서랍 구간", () => {
  it.each([375, 767])(
    "%ipx: 사이드바 대신 메뉴 버튼, 서랍(role=dialog)의 고객으로 이동하면 서랍이 닫히고 경로가 /customers다",
    async (width) => {
      const view = await openShell(width, "/treatments");
      expect(sidebar()).toBeNull();
      await view.user.click(screen.getByRole("button", { name: "메뉴 열기" }));
      const drawer = await screen.findByRole("dialog", { name: "메뉴" });
      await view.user.click(within(drawer).getByRole("link", { name: "고객" }));
      await screen.findByRole("heading", { level: 1, name: "고객" });
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      expectLocation(view.router, "/customers");
    },
  );
});

describe("AC-UI-002-10 (다) 건너뛰기 링크·크기·상단바·사이드바 머리·사용자 메뉴", () => {
  it("첫 Tab이 본문으로 건너뛰기 링크에 가고 Enter로 #main에 포커스가 간다", async () => {
    const view = await openShell(1280);
    await view.user.tab();
    const skip = screen.getByRole("link", { name: "본문으로 건너뛰기" });
    expect(skip).toHaveFocus();
    expect(skip).toHaveAttribute("href", "#main");
    await view.user.keyboard("{Enter}");
    expect(document.getElementById("main")).toHaveFocus();
  });

  it("상단바 h-14에 접기 버튼·이동 경로·오늘 날짜·테마 전환·사용자 메뉴 버튼 다섯 개가 있다", async () => {
    await openShell(1280);
    const topBar = screen.getByRole("banner");
    expect(topBar.className).toContain("h-14");
    const bar = within(topBar);
    expect(bar.getByRole("button", { name: "사이드바 접기" })).toBeInTheDocument();
    const breadcrumb = bar.getByRole("navigation", { name: "현재 위치" });
    expect(breadcrumb).toHaveTextContent("관리");
    expect(breadcrumb).toHaveTextContent("고객");
    expect(bar.getByText("11월 9일 (월)")).toBeInTheDocument();
    expect(bar.getByRole("radiogroup", { name: "테마" })).toBeInTheDocument();
    expect(bar.getByRole("button", { name: "사용자 메뉴" })).toBeInTheDocument();
  });

  it("사이드바 머리에 강남점과 /shops로 가는 매장 변경이 있고, 메뉴 묶음은 예약·관리, 현재 화면 링크가 aria-current다", async () => {
    await openShell(1280);
    const nav = within(sidebar() as HTMLElement);
    expect(nav.getByText("강남점")).toBeInTheDocument();
    expect(nav.getByRole("link", { name: "매장 변경" })).toHaveAttribute("href", "/shops");
    expect(nav.getByText("예약")).toBeInTheDocument();
    expect(nav.getByText("관리")).toBeInTheDocument();
    for (const name of ["예약 캘린더", "시술 이력", "고객", "시술 메뉴"]) {
      expect(nav.getByRole("link", { name })).toBeInTheDocument();
    }
    expect(nav.getByRole("link", { name: "고객" })).toHaveAttribute("aria-current", "page");
    expect(nav.getByRole("link", { name: "시술 이력" })).not.toHaveAttribute("aria-current");
  });

  it("하위 경로·쿼리(/treatment-menus?menu=3)에서도 시술 메뉴 링크가 활성이다(접두사 일치)", async () => {
    await openShell(1280, "/treatment-menus?menu=3");
    await screen.findByRole("heading", { level: 1, name: "시술 메뉴" });
    expect(
      within(sidebar() as HTMLElement).getByRole("link", { name: "시술 메뉴" }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("사용자 메뉴(Popover)에 이름·역할·이메일·매장 변경·로그아웃이 있고 매장 변경은 /shops로 간다", async () => {
    const view = await openShell(1280);
    await view.user.click(screen.getByRole("button", { name: "사용자 메뉴" }));
    const menu = await screen.findByRole("dialog", { name: "사용자 메뉴" });
    const content = within(menu);
    expect(content.getByText("김원장")).toBeInTheDocument();
    expect(content.getByText("원장")).toBeInTheDocument();
    expect(content.getByText("owner@kmc.test")).toBeInTheDocument();
    expect(content.getByRole("button", { name: "로그아웃" })).toBeInTheDocument();
    await view.user.click(content.getByRole("button", { name: "매장 변경" }));
    await screen.findByRole("heading", { level: 1, name: "매장 선택" });
    expectLocation(view.router, "/shops");
  });

  it.each([1280, 900, 375])("%ipx에서 axe 위반이 0건이다", async (width) => {
    const view = await openShell(width);
    await expectNoAxeViolations(view.container);
  });

  it("캘린더(예약 캘린더)는 본문 최대 폭을 풀고, 그 밖의 화면은 max-w-content다", async () => {
    const view = await openShell(1280);
    expect(document.getElementById("main")?.className).toContain("max-w-content");
    view.unmount();
    await openShell(1280, "/reservations");
    await screen.findByRole("heading", { level: 1, name: "예약 캘린더" });
    expect(document.getElementById("main")?.className).not.toContain("max-w-content");
  });
});
