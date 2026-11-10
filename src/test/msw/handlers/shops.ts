// 매장 API 처리기(GET /shops, GET·POST /shops/selected). 응답 모양은 생성 타입으로 고정한다.
import { HttpResponse, http } from "msw";
import type { components } from "@/api/schema";

type Shop = components["schemas"]["ShopResponse"];
type ShopPage = components["schemas"]["Page_ShopResponse_"];

export const shopNotSelectedBody = {
  detail: { code: "SHOP_NOT_SELECTED", detail: "상점을 먼저 선택해주세요.", hint: null },
};

export function shopsListHandler(origin: string, shops: Shop[]) {
  return http.get(`${origin}/shops`, ({ request }) => {
    const page = Number(new URL(request.url).searchParams.get("page") ?? "1");
    const body: ShopPage = { items: shops, total: shops.length, page, size: 20, pages: 1 };
    return HttpResponse.json(body);
  });
}

/** 선택 매장. null이면 404 SHOP_NOT_SELECTED. */
export function selectedShopHandler(origin: string, shop: Shop | null) {
  return http.get(`${origin}/shops/selected`, () =>
    shop ? HttpResponse.json(shop) : HttpResponse.json(shopNotSelectedBody, { status: 404 }),
  );
}

export function selectShopHandler(origin: string, status: number) {
  return http.post(`${origin}/shops/selected`, () => new HttpResponse(null, { status }));
}
