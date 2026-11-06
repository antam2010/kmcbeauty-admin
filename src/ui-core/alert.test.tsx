import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test/axe";
import { Alert } from "./alert";

const TONES = [
  {
    tone: "info",
    surface: "bg-info-subtle",
    accent: "text-info-subtle-foreground",
    icon: "lucide-info",
  },
  {
    tone: "success",
    surface: "bg-success-subtle",
    accent: "text-success-subtle-foreground",
    icon: "lucide-circle-check",
  },
  {
    tone: "warning",
    surface: "bg-warning-subtle",
    accent: "text-warning-subtle-foreground",
    icon: "lucide-triangle-alert",
  },
  {
    tone: "destructive",
    surface: "bg-destructive-subtle",
    accent: "text-destructive-subtle-foreground",
    icon: "lucide-circle-alert",
  },
] as const;

describe("Alert — tone과 모양", () => {
  it("tone을 주지 않으면 info 면과 Info 아이콘을 쓴다", () => {
    const { container } = render(
      <Alert title="예약 시간이 바뀌었어요.">새 시간을 확인해 주세요.</Alert>,
    );
    expect(container.firstElementChild).toHaveClass("bg-info-subtle", "rounded-panel", "border");
    expect(container.querySelector("svg")).toHaveClass("lucide-info");
  });

  it("tone 4종이 {tone}-subtle 면과 tone별 아이콘, {tone}-subtle-foreground 제목을 쓴다", () => {
    for (const { tone, surface, accent, icon } of TONES) {
      const { container, unmount } = render(
        <Alert tone={tone} title="제목">
          본문이에요.
        </Alert>,
      );
      expect(container.firstElementChild).toHaveClass(surface);
      expect(container.querySelector("svg")).toHaveClass(icon, accent);
      expect(screen.getByText("제목")).toHaveClass(accent);
      unmount();
    }
  });

  it("본문은 foreground 색으로 제목 아래에 보인다", () => {
    render(
      <Alert tone="destructive" title="예약을 불러오지 못했어요.">
        잠시 후 다시 시도해 주세요.
      </Alert>,
    );
    expect(screen.getByText("예약을 불러오지 못했어요.")).toBeInTheDocument();
    expect(screen.getByText("잠시 후 다시 시도해 주세요.")).toHaveClass("text-foreground");
  });

  it("제목 없이 본문만 보일 수 있다", () => {
    const { container } = render(<Alert tone="success">예약을 저장했어요.</Alert>);
    expect(screen.getByText("예약을 저장했어요.")).toBeInTheDocument();
    expect(container.querySelectorAll("p")).toHaveLength(0);
  });

  it("tone 아이콘은 장식으로 숨긴다", () => {
    const { container } = render(<Alert tone="warning">영업시간이 곧 끝나요.</Alert>);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("className을 루트에 합친다", () => {
    const { container } = render(<Alert className="mt-4">알림이에요.</Alert>);
    expect(container.firstElementChild).toHaveClass("mt-4", "bg-info-subtle");
  });
});

describe("Alert — live(AC-UI-001-24)", () => {
  it("live일 때만 role='alert'를 쓴다", () => {
    render(
      <>
        <Alert tone="destructive" live title="저장하지 못했어요.">
          다시 시도해 주세요.
        </Alert>
        <Alert tone="info" title="정기 점검 안내예요.">
          오늘 밤 열 시에 점검해요.
        </Alert>
      </>,
    );
    const alerts = screen.getAllByRole("alert");
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toHaveTextContent("저장하지 못했어요.");
  });

  it("live가 아니면 role이 없다", () => {
    const { container } = render(<Alert title="정기 점검 안내예요." />);
    expect(container.firstElementChild).not.toHaveAttribute("role");
  });
});

describe("Alert — 자동 접근성 검사", () => {
  it("tone 4종과 live 상태에서 axe 위반이 0건이다", async () => {
    const { container } = render(
      <>
        {TONES.map(({ tone }) => (
          <Alert key={tone} tone={tone} title={`${tone} 알림이에요.`}>
            본문이에요.
          </Alert>
        ))}
        <Alert tone="destructive" live title="저장하지 못했어요.">
          다시 시도해 주세요.
        </Alert>
      </>,
    );
    await expectNoAxeViolations(container);
  });
});
