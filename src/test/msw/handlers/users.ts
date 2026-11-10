// 사용자 API 처리기(GET /users/me). 응답 모양은 생성 타입으로 고정한다.
import { HttpResponse, http } from "msw";
import type { components } from "@/api/schema";

type User = components["schemas"]["UserResponse"];

/** Bearer가 있으면 사용자, 없으면 401. */
export function meHandler(origin: string, user: User) {
  return http.get(`${origin}/users/me`, ({ request }) =>
    request.headers.get("authorization")
      ? HttpResponse.json(user)
      : new HttpResponse(null, { status: 401 }),
  );
}
