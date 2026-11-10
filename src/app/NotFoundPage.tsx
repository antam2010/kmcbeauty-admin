// 찾을 수 없음(404). 경로 표의 빈칸을 막는 최소 화면이다(plan.md §B.13 기본값). 문구는 acceptance.md §3.2 화면별 문구.
import { Link } from "react-router";
import { Button } from "@/ui-core";

export function NotFoundPage() {
  return (
    <section className="mx-auto flex w-full max-w-reading flex-col items-center gap-6 py-12 text-center">
      <h1 className="text-heading font-bold text-foreground">찾을 수 없는 페이지예요.</h1>
      <Button asChild variant="outline">
        <Link to="/">첫 화면으로 가기</Link>
      </Button>
    </section>
  );
}
