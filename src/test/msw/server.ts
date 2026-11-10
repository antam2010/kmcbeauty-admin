// 시험 전체가 쓰는 MSW 3 서버(msw/node). setup.ts가 수명 주기를 돌린다(design.md §16).
// 시험은 필요한 처리기를 server.use()로 더하고, 처리기는 시험마다 초기화된다.
// 처리하지 않은 요청은 네트워크 오류로 끝내고 기록해 두었다가, 시험 뒤 점검에서 시험 실패로 보고한다
// (앱 코드가 오류를 삼켜도 놓치지 않기 위해서다 — acceptance.md §0).
import { setupServer } from "msw/node";

type ListenOptions = NonNullable<Parameters<typeof server.listen>[0]>;

const unhandledRequests: string[] = [];

export const server = setupServer();

const onUnhandledFrame: ListenOptions["onUnhandledFrame"] = ({ frame, defaults }) => {
  const data = frame.data as { request?: Request };
  unhandledRequests.push(
    data.request ? `${data.request.method} ${data.request.url}` : `${frame.protocol} 프레임`,
  );
  defaults.error();
};

export function listenStrict(): void {
  server.listen({ onUnhandledFrame });
}

/** 처리하지 않은 요청이 있었으면 목록을 담은 오류를 던지고 기록을 비운다. */
export function assertNoUnhandledRequests(): void {
  const missed = unhandledRequests.splice(0);
  if (missed.length > 0) {
    throw new Error(`처리하지 않은 요청: ${missed.join(", ")}`);
  }
}
