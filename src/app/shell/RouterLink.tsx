// ui-core LinkComponent 자리에 넣는 라우터 링크(plan.md §B.2 링크 어댑터). 문서 새로고침 없이 경로만 바꾼다.
import { Link } from "react-router";
import type { LinkComponentProps } from "@/ui-core";

export function RouterLink({ to, ...props }: LinkComponentProps) {
  return <Link to={to} {...props} />;
}
