import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test/axe";
import { Button } from "./button";
import { Drawer } from "./drawer";

function Harness({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button aria-label="메뉴 열기" onClick={() => setOpen(true)}>
        메뉴
      </Button>
      <Drawer
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          onOpenChange?.(next);
        }}
        title="주 메뉴"
        side="left"
      >
        <a href="/reservations">예약</a>
        <a href="/customers">고객</a>
      </Drawer>
    </>
  );
}

const opener = () => screen.getByRole("button", { name: "메뉴 열기", hidden: true });
const drawer = () => screen.getByRole("dialog", { name: "주 메뉴" });
const queryDrawer = () => screen.queryByRole("dialog");
const scrim = () => document.querySelector<HTMLElement>("[data-drawer-overlay]") as HTMLElement;

async function openDrawer(user: ReturnType<typeof userEvent.setup>) {
  await user.click(opener());
  expect(drawer()).toBeInTheDocument();
}

describe("Drawer — 키보드 계약(acceptance.md §3.10)", () => {
  it("role='dialog'이고 제목이 접근 이름이다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openDrawer(user);
    expect(drawer()).toHaveAccessibleName("주 메뉴");
    expect(screen.getByRole("heading", { name: "주 메뉴" })).toBeInTheDocument();
  });

  it("열리면 포커스가 서랍 안으로 간다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openDrawer(user);
    expect(drawer()).toContainElement(document.activeElement as HTMLElement);
  });

  it("Tab·Shift+Tab이 서랍 안에서만 돈다(포커스 가두기)", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openDrawer(user);
    for (let step = 0; step < 6; step += 1) {
      await user.tab();
      expect(drawer()).toContainElement(document.activeElement as HTMLElement);
    }
    for (let step = 0; step < 6; step += 1) {
      await user.tab({ shift: true });
      expect(drawer()).toContainElement(document.activeElement as HTMLElement);
    }
  });

  it("Esc로 닫히고 연 트리거로 포커스가 돌아온다", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onOpenChange={onOpenChange} />);
    await openDrawer(user);
    await user.keyboard("{Escape}");
    expect(queryDrawer()).toBeNull();
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(opener()).toHaveFocus();
  });

  it("스크림을 누르면 닫히고 연 트리거로 포커스가 돌아온다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openDrawer(user);
    await user.click(scrim());
    expect(queryDrawer()).toBeNull();
    expect(opener()).toHaveFocus();
  });

  it("닫기 버튼으로 닫힌다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openDrawer(user);
    await user.click(screen.getByRole("button", { name: "닫기" }));
    expect(queryDrawer()).toBeNull();
    expect(opener()).toHaveFocus();
  });
});

describe("Drawer — 모양·감속 모드·고대비(system.md §8)", () => {
  it("왼쪽 시트: card 면, 바깥쪽 border, 사이드바 폭, z 30이고 스크림은 bg-overlay다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openDrawer(user);
    expect(drawer()).toHaveClass(
      "start-0",
      "bg-card",
      "border-e",
      "border-border",
      "w-(--sidebar-width)",
      "z-30",
    );
    expect(scrim()).toHaveClass("bg-overlay");
  });

  it("이동 애니메이션 클래스는 motion-safe: 아래에만 있어 감속 모드에서는 이동 없이 보인다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openDrawer(user);
    for (const element of [drawer(), scrim()]) {
      const classes = element.className.split(/\s+/).filter((name) => name.includes("animate"));
      expect(classes.length).toBeGreaterThan(0);
      for (const name of classes) expect(name.startsWith("motion-safe:")).toBe(true);
    }
  });

  it("열린 상태에서 axe 위반이 0건이다", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openDrawer(user);
    await expectNoAxeViolations(drawer());
  });
});
