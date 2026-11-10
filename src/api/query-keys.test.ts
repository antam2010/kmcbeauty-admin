// 쿼리 키 공장(AC-UI-002-07 (다)). 기대값은 acceptance.md §3.11 키 표를 그대로 옮긴다.
import { describe, expect, it } from "vitest";
import { createQueryClient } from "./query-client";
import { qk } from "./query-keys";

describe("§3.11 매장 범위 키", () => {
  const rows: [string, readonly unknown[], unknown[]][] = [
    [
      'qk.customers.list(7, { q: "", page: 1 })',
      qk.customers.list(7, { q: "", page: 1 }),
      ["shop", 7, "customers", "list", { q: "", page: 1 }],
    ],
    ["qk.customers.groups(7)", qk.customers.groups(7), ["shop", 7, "customers", "groups"]],
    [
      'qk.menus.list(7, { q: "", page: 1 })',
      qk.menus.list(7, { q: "", page: 1 }),
      ["shop", 7, "menus", "list", { q: "", page: 1 }],
    ],
    ["qk.menus.details(7, 2)", qk.menus.details(7, 2), ["shop", 7, "menus", 2, "details"]],
    [
      'qk.treatments.range(7, "2026-11-08", "2026-11-14")',
      qk.treatments.range(7, "2026-11-08", "2026-11-14"),
      ["shop", 7, "treatments", "range", "2026-11-08", "2026-11-14"],
    ],
    [
      'qk.treatments.list(7, { from: "2026-11-01", to: "2026-11-30", status: null, q: "", page: 1, order: "desc" })',
      qk.treatments.list(7, {
        from: "2026-11-01",
        to: "2026-11-30",
        status: null,
        q: "",
        page: 1,
        order: "desc",
      }),
      [
        "shop",
        7,
        "treatments",
        "list",
        { from: "2026-11-01", to: "2026-11-30", status: null, q: "", page: 1, order: "desc" },
      ],
    ],
  ];

  it.each(rows)("%s", (_name, actual, expected) => {
    expect(actual).toEqual(expected);
  });

  it('6개 모두 ["shop", <매장 id>, …]로 시작한다', () => {
    expect(rows).toHaveLength(6);
    for (const [, key] of rows) {
      expect(key.slice(0, 2)).toEqual(["shop", 7]);
    }
  });
});

describe("매장 범위가 아닌 키", () => {
  it("me·shops.list·shops.selected", () => {
    expect(qk.me()).toEqual(["me"]);
    expect(qk.shops.list(2)).toEqual(["shops", "list", { page: 2 }]);
    expect(qk.shops.selected()).toEqual(["shops", "selected"]);
    expect(qk.shopScope()).toEqual(["shop"]);
  });

  it("removeQueries({ queryKey: qk.shopScope() }) 한 번으로 매장 범위만 지운다", () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(qk.customers.list(7, { q: "", page: 1 }), []);
    queryClient.setQueryData(qk.menus.details(7, 2), []);
    queryClient.setQueryData(qk.treatments.range(7, "2026-11-08", "2026-11-14"), []);
    queryClient.setQueryData(qk.me(), { id: 1 });
    queryClient.setQueryData(qk.shops.selected(), { id: 7 });

    queryClient.removeQueries({ queryKey: qk.shopScope() });

    expect(queryClient.getQueryCache().findAll({ queryKey: ["shop"] })).toHaveLength(0);
    expect(
      queryClient
        .getQueryCache()
        .getAll()
        .map((q) => q.queryKey),
    ).toEqual([["me"], ["shops", "selected"]]);
  });
});
