// 쿼리 키 공장(design.md §5, acceptance.md §3.11 정본).
// 매장 범위 데이터는 모두 ["shop", shopId, …] 아래에 둔다. 매장을 바꾸면 removeQueries({ queryKey: qk.shopScope() }) 한 번으로
// 이전 매장 데이터를 버리고, 변경 뒤 무효화는 접두사로 한다(invalidateQueries는 접두사 일치).

// @MX:ANCHOR: [AUTO] 무효화·매장 전환 캐시 폐기가 이 키 모양에 기댄다.
// @MX:REASON: 매장 범위 키가 ["shop", shopId]로 시작하지 않으면 매장을 바꿔도 다른 매장 데이터가 캐시에 남는다(AC-UI-002-07). 모양을 바꾸면 query-keys.test.ts의 §3.11 표와 함께 바꾼다.

export interface ListParams {
  q: string;
  page: number;
}

export interface TreatmentListFilters {
  from: string;
  to: string;
  status: string | null;
  q: string;
  page: number;
  order: "asc" | "desc";
}

export const qk = {
  me: () => ["me"] as const,
  shops: {
    list: (page: number) => ["shops", "list", { page }] as const,
    selected: () => ["shops", "selected"] as const,
  },
  /** 매장 범위 전체의 접두사. */
  shopScope: () => ["shop"] as const,
  customers: {
    list: (shopId: number, params: ListParams) =>
      ["shop", shopId, "customers", "list", params] as const,
    groups: (shopId: number) => ["shop", shopId, "customers", "groups"] as const,
  },
  menus: {
    list: (shopId: number, params: ListParams) =>
      ["shop", shopId, "menus", "list", params] as const,
    details: (shopId: number, menuId: number) =>
      ["shop", shopId, "menus", menuId, "details"] as const,
  },
  treatments: {
    range: (shopId: number, startKst: string, endKst: string) =>
      ["shop", shopId, "treatments", "range", startKst, endKst] as const,
    list: (shopId: number, filters: TreatmentListFilters) =>
      ["shop", shopId, "treatments", "list", filters] as const,
  },
};
