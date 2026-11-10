// 시험 장치(design.md §16, acceptance.md §0): MSW 3 HTTP 대역과 IndexedDB 대역.
// 처리하지 않은 요청은 시험 실패여야 하고, indexedDB.open은 호출 수를 셀 수 있어야 한다.
import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { shopFixture, TEST_API_ORIGIN } from "./msw/fixtures";
import { assertNoUnhandledRequests, server } from "./msw/server";

describe("MSW 시험 장치", () => {
  it("처리기가 있는 요청은 대역 응답을 받는다", async () => {
    server.use(http.get(`${TEST_API_ORIGIN}/shops/selected`, () => HttpResponse.json(shopFixture)));

    const response = await fetch(`${TEST_API_ORIGIN}/shops/selected`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(shopFixture);
  });

  it("처리하지 않은 요청은 네트워크 오류가 되고, 시험 뒤 점검이 실패로 보고한다", async () => {
    await expect(fetch(`${TEST_API_ORIGIN}/unknown?page=2`)).rejects.toThrow();

    // setup.ts의 afterEach가 같은 점검을 부른다. 여기서 먼저 불러 실패를 확인하고 기록을 비운다.
    expect(() => assertNoUnhandledRequests()).toThrowError(
      `처리하지 않은 요청: GET ${TEST_API_ORIGIN}/unknown?page=2`,
    );
    expect(() => assertNoUnhandledRequests()).not.toThrow();
  });

  it("처리기는 시험마다 초기화된다", async () => {
    await expect(fetch(`${TEST_API_ORIGIN}/shops/selected`)).rejects.toThrow();
    expect(() => assertNoUnhandledRequests()).toThrowError(/shops\/selected/);
  });
});

describe("IndexedDB 대역", () => {
  it("indexedDB.open은 감시 가능한 대역이고 시험 시작 때 호출 0회다", () => {
    expect(globalThis.indexedDB).toBeDefined();
    expect(vi.isMockFunction(indexedDB.open)).toBe(true);
    expect(indexedDB.open).not.toHaveBeenCalled();
  });

  it("호출을 세고, 다음 시험에서는 다시 0회다(1/2)", () => {
    indexedDB.open("kmc");
    expect(indexedDB.open).toHaveBeenCalledTimes(1);
  });

  it("호출을 세고, 다음 시험에서는 다시 0회다(2/2)", () => {
    expect(indexedDB.open).not.toHaveBeenCalled();
  });
});
