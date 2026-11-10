// 경로 오류 화면(EC-06): loader가 던진 오류(갱신 네트워크 오류, 선택 매장 확인 실패 등)를 보이고 "다시 시도"로 loader를 다시 돈다.
// 정규화한 message만 보인다. 백엔드 hint는 개발자용 글이라 그리지 않는다(사용자 결정 F3).
import { useRevalidator, useRouteError } from "react-router";
import { ApiError } from "@/api/errors";
import { Alert, Button } from "@/ui-core";
import { PublicLayout } from "./PublicLayout";

export function RouteError() {
  const error = useRouteError();
  const revalidator = useRevalidator();
  // API 오류만 정규화한 문구를 보인다. 그 밖의 예외(코드 결함 등)는 원인을 짐작하는 문구를 지어내지 않고 제목만 둔다
  const message = error instanceof ApiError && error.message ? error.message : null;
  return (
    <PublicLayout>
      <section className="mx-auto flex w-full max-w-reading flex-col gap-6 py-12">
        <h1 className="text-heading font-bold text-foreground">페이지를 불러오지 못했어요.</h1>
        {message ? <Alert tone="destructive">{message}</Alert> : null}
        <div>
          <Button
            variant="outline"
            loading={revalidator.state === "loading"}
            onClick={() => void revalidator.revalidate()}
          >
            다시 시도
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
