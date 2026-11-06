import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// 이 시스템의 사용자 정의 테마 이름을 tailwind-merge에 등록한다(design.md §4.2, plan.md §B B-05).
// 등록하지 않으면 text-body 같은 글자 크기 이름이 글자색으로 분류되어 병합 때 지워진다.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["caption", "body-sm", "body", "subtitle", "title", "heading", "display"],
      radius: ["panel", "control", "badge", "chip"],
      shadow: ["raised", "overlay"],
      container: ["content", "reading", "dialog-sm", "dialog-md", "dialog-lg"],
    },
  },
});

// @MX:ANCHOR: [AUTO] 모든 ui-core 컴포넌트의 클래스 병합 진입점이다.
// @MX:REASON: 테마 키 등록을 바꾸면 모든 컴포넌트의 className 덮어쓰기 결과가 함께 바뀐다(cn.test.ts가 병합 규칙을 고정).
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
