import axe from "axe-core";
import { expect } from "vitest";

/**
 * 주어진 요소 안을 axe-core로 검사해 위반이 0건인지 확인한다.
 * jsdom은 색을 계산하지 못하므로 `color-contrast` 규칙은 끄고, 대비는 토큰 대비 테스트가 맡는다.
 */
export async function expectNoAxeViolations(container: Element): Promise<void> {
  const results = await axe.run(container, {
    rules: { "color-contrast": { enabled: false } },
  });
  const violations = results.violations.map(
    (violation) =>
      `${violation.id}: ${violation.help} → ${violation.nodes
        .map((node) => node.target.join(" "))
        .join(", ")}`,
  );
  expect(violations).toEqual([]);
}
