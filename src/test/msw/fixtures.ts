// MSW 처리기가 돌려줄 대역 값. 응답 모양은 생성 타입(schema.d.ts)으로 고정한다(design.md §16).
import type { components } from "@/api/schema";

/** 시험에서 쓰는 API 출처. 운영·개발 주소와 겹치지 않는다. */
export const TEST_API_ORIGIN = "https://api.test";

export const shopFixture: components["schemas"]["ShopResponse"] = {
  id: 7,
  name: "키엠씨 뷰티 본점",
  address: "서울특별시 중구 세종대로 110",
  address_detail: "2층",
  phone: "02-1234-5678",
  business_number: null,
  created_at: "2026-11-01T09:00:00+09:00",
  updated_at: "2026-11-01T09:00:00+09:00",
};

/** GET /users/me 대역(사용자 메뉴의 이름·역할·이메일). */
export const userFixture: components["schemas"]["UserResponse"] = {
  id: 1,
  name: "김원장",
  email: "owner@kmc.test",
  role: "MASTER",
  role_name: "원장",
  created_at: "2026-10-01T09:00:00+09:00",
  updated_at: "2026-10-01T09:00:00+09:00",
};
