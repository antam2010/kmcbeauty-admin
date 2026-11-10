// 매장 쿼리(목록·선택 매장·매장 선택, design.md §4.4).
// 선택 매장의 정본은 서버(Redis, 사용자 단위)다. 클라이언트는 ["shops","selected"] 쿼리로 비춰 볼 뿐 따로 저장하지 않는다.
import {
  mutationOptions,
  type QueryClient,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { ApiClient } from "@/api/client";
import { unwrap } from "@/api/errors";
import { qk } from "@/api/query-keys";
import type { components } from "@/api/schema";

export type Shop = components["schemas"]["ShopResponse"];

/** 매장 목록 쪽 크기. 백엔드 최대값(openapi.json의 size maximum 100, 기본 50)이고, 이보다 많을 때만 Pagination이 생긴다(plan.md §B.13). */
export const SHOPS_PAGE_SIZE = 100;

export const shopsQueryOptions = (client: ApiClient, page: number) =>
  queryOptions({
    queryKey: qk.shops.list(page),
    queryFn: ({ signal }) =>
      unwrap(client.GET("/shops", { params: { query: { page, size: SHOPS_PAGE_SIZE } }, signal })),
  });

/** refetchOnWindowFocus "always"는 createQueryClient의 키 기본값이 정한다. */
export const selectedShopQueryOptions = (client: ApiClient) =>
  queryOptions({
    queryKey: qk.shops.selected(),
    queryFn: ({ signal }) => unwrap(client.GET("/shops/selected", { signal })),
  });

/** 성공하면 선택 매장 캐시를 바꾸고 이전 매장 범위 캐시를 버린다. 실패하면 캐시를 그대로 둔다. */
export const selectShopMutationOptions = (client: ApiClient, queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: async (shop: Shop) => {
      await unwrap(client.POST("/shops/selected", { body: { shop_id: shop.id } }));
    },
    onSuccess: (_data, shop) => {
      queryClient.setQueryData(qk.shops.selected(), shop);
      queryClient.removeQueries({ queryKey: qk.shopScope() });
    },
  });

export function useShops(client: ApiClient, page: number) {
  return useQuery(shopsQueryOptions(client, page));
}

export function useSelectedShop(client: ApiClient) {
  return useQuery(selectedShopQueryOptions(client));
}

export function useSelectShop(client: ApiClient) {
  return useMutation(selectShopMutationOptions(client, useQueryClient()));
}
