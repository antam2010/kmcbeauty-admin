// 매장 선택(plan.md §B.3·§B.13, AC-UI-002-12). 셸은 현재 매장을 보여 주므로 공개 레이아웃에 그린다.
// 고르면 서버의 선택 매장을 바꾸고(POST /shops/selected) 선택 매장 캐시를 바꾼 뒤 이전 매장 범위 캐시를 버리고,
// 규칙을 통과한 next 또는 /reservations로 간다(next 셋째 사용처). 실패하면 캐시·경로를 그대로 두고 destructive Alert.
// 매장이 하나뿐이어도 자동으로 고르지 않는다(기본값). 매장 생성·수정은 네이티브 앱 기능이라 범위 밖이다.
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { nextDestination } from "@/app/safe-next";
import { useApiClient } from "@/app/services";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  PageHeader,
  Pagination,
  Skeleton,
  SkeletonGroup,
} from "@/ui-core";
import { type Shop, useSelectedShop, useSelectShop, useShops } from "./queries";

const EMPTY_MESSAGE = "등록된 매장이 없어요. 매장은 kmcbeauty 앱에서 만들 수 있어요.";

const registeredDate = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

function ShopCard({
  shop,
  current,
  onSelect,
}: {
  shop: Shop;
  current: boolean;
  onSelect: (shop: Shop) => void;
}) {
  const address = [shop.address, shop.address_detail].filter(Boolean).join(" ");
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(shop)}
        className="flex w-full flex-col items-start gap-1 rounded-panel border border-border bg-card p-4 text-start transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="flex items-center gap-2">
          <span className="text-subtitle font-semibold text-foreground">{shop.name}</span>
          {current ? <Badge tone="info">현재 매장</Badge> : null}
        </span>
        <span className="text-body-sm text-muted-foreground">{address}</span>
        <span className="text-caption text-muted-foreground tabular-nums">
          등록일 {registeredDate.format(new Date(shop.created_at))}
        </span>
      </button>
    </li>
  );
}

export function ShopSelectPage() {
  const client = useApiClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const shops = useShops(client, page);
  // 매장이 없으면(SHOP_NOT_SELECTED) 오류로 끝나며, 그때는 현재 매장 표시만 없다
  const selected = useSelectedShop(client);
  const selectShop = useSelectShop(client);

  const onSelect = (shop: Shop) => {
    if (selectShop.isPending) return;
    selectShop.mutate(shop, {
      onSuccess: () =>
        navigate(nextDestination(searchParams.get("next"), window.location.origin), {
          replace: true,
        }),
    });
  };

  return (
    <section className="mx-auto flex w-full max-w-reading flex-col gap-6 py-6">
      <PageHeader title="매장 선택" />
      {selectShop.isError ? (
        <Alert tone="destructive" live>
          {selectShop.error.message}
        </Alert>
      ) : null}
      {shops.isPending ? (
        <SkeletonGroup>
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </SkeletonGroup>
      ) : shops.isError ? (
        <Alert tone="destructive" live>
          <div className="flex flex-col items-start gap-3">
            <p>{shops.error.message}</p>
            <Button variant="outline" size="sm" onClick={() => void shops.refetch()}>
              다시 시도
            </Button>
          </div>
        </Alert>
      ) : shops.data.items.length === 0 ? (
        <EmptyState title={EMPTY_MESSAGE} />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {shops.data.items.map((shop) => (
              <ShopCard
                key={shop.id}
                shop={shop}
                current={selected.data?.id === shop.id}
                onSelect={onSelect}
              />
            ))}
          </ul>
          {(shops.data.pages ?? 1) > 1 ? (
            <Pagination
              page={page}
              pageCount={shops.data.pages ?? 1}
              onPageChange={setPage}
              className="self-center"
            />
          ) : null}
        </>
      )}
    </section>
  );
}
