// 로그인·매장 선택 뒤 돌아갈 next 매개변수 검사(acceptance.md §3.3 `next` 규칙, design.md §3.2).
// WHATWG URL은 `\`를 `/`처럼 다루고 TAB·LF·CR을 지우므로, `/\evil.example`·`/%09/evil.example` 같은 값이
// 외부 주소가 될 수 있다. 그래서 글자 검사를 먼저 하고, 출처 비교와 앞머리 검사를 함께 한다(열린 리디렉트 방지).
// 이동에는 nextDestination이 다시 직렬화한 경로를 쓴다. URL 해석이 점 세그먼트(`.`·`..`·`%2e`)를 지우면
// `/.//evil.example`이 `//evil.example`(다른 출처로 가는 주소)이 되므로, 해석한 경로명의 앞머리도 본다(M4 감사 F-1).

// biome-ignore lint/suspicious/noControlCharactersInRegex: C0 제어 문자를 찾는 것이 이 정규식의 목적이다
const FORBIDDEN_CHARACTERS = /[\\\u0000-\u001f\s]/;

// @MX:ANCHOR: [AUTO] 로그인 화면 loader·로그인 제출·매장 선택 세 곳이 같은 이 함수로 next를 거른다.
// @MX:REASON: 세 사용처가 다른 규칙을 쓰면 한 곳이 열린 리디렉트가 된다. 받은 값뿐 아니라 실제로 이동하는 직렬화한 경로도 같은 규칙을 통과해야 한다(M4 감사 F-1). 규칙을 바꿀 때는 acceptance.md §3.3 표본 표와 safe-next.test.ts를 함께 바꾼다.
/**
 * 입력은 URLSearchParams가 한 번 디코딩한 값이다(더 디코딩하지 않는다).
 * 앱 안의 경로면 그대로, 아니면 null(부르는 쪽이 /reservations로 보낸다).
 */
export function safeNext(value: string | null, origin: string): string | null {
  if (!value || FORBIDDEN_CHARACTERS.test(value)) return null;
  let resolved: URL;
  try {
    resolved = new URL(value, origin);
  } catch {
    return null;
  }
  if (resolved.origin !== origin) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  // 이동 주소(nextDestination)는 해석한 경로명으로 시작한다 — 점 세그먼트를 지운 뒤 //로 시작하면 외부 주소다
  if (resolved.pathname.startsWith("//")) return null;
  return value;
}

/**
 * safeNext를 통과한 값(없거나 거부하면 /reservations)을 이동 주소로 직렬화한다.
 * redirect의 Location 헤더는 한글을 담을 수 없어 URL로 퍼센트 인코딩한다(이미 있는 %xx는 그대로 둔다).
 */
export function nextDestination(value: string | null, origin: string): string {
  const url = new URL(safeNext(value, origin) ?? "/reservations", origin);
  return url.pathname + url.search + url.hash;
}
