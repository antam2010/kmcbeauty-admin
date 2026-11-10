// 앱이 보낸 요청을 fetch 층에서 기록한다. MSW 처리기가 받는 request.credentials는 원래 값과 상관없이
// "same-origin"이라(M2 사전 점검 실측) credentials·헤더 판정은 처리기가 아니라 여기서 한다.
// createApiClient({ fetch })에 넣으면 클라이언트 요청과 갱신 요청이 모두 이 fetch를 지난다.

export interface LoggedRequest {
  method: string;
  path: string;
  credentials: RequestCredentials;
  authorization: string | null;
  refreshTokenHeader: string | null;
  contentType: string | null;
  body: string;
}

export function createRequestLog() {
  const requests: LoggedRequest[] = [];
  const fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const request = new Request(input, init);
    requests.push({
      method: request.method,
      path: new URL(request.url).pathname,
      credentials: request.credentials,
      authorization: request.headers.get("authorization"),
      refreshTokenHeader: request.headers.get("x-refresh-token"),
      contentType: request.headers.get("content-type"),
      body: await request.clone().text(),
    });
    // 부를 때 찾는다 — MSW가 바꾼 globalThis.fetch를 쓰기 위해서다
    return globalThis.fetch(request);
  };
  const count = (method: string, path: string) =>
    requests.filter((r) => r.method === method && r.path === path).length;
  return { fetch, requests, count };
}
