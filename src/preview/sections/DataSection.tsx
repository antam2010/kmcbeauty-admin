import { Users } from "lucide-react";
import { type ReactNode, useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  type Column,
  EmptyState,
  Filter,
  type FilterOption,
  Pagination,
  Search,
  type SortState,
  Table,
} from "@/ui-core";
import { PreviewSection } from "../PreviewSection";

const TODAY = [
  { time: "10:00", customer: "김민지", treatment: "젤 네일" },
  { time: "13:30", customer: "박서연", treatment: "속눈썹 연장" },
  { time: "16:00", customer: "이수민", treatment: "젤 네일 제거" },
];

interface Customer {
  id: number;
  name: string;
  phone: string;
  segment: "regular" | "new";
  lastVisit: string;
  visits: number;
  total: number;
}

const CUSTOMERS: Customer[] = [
  {
    id: 1,
    name: "김민지",
    phone: "010-1234-5678",
    segment: "regular",
    lastVisit: "2026. 10. 28.",
    visits: 24,
    total: 840000,
  },
  {
    id: 2,
    name: "박서연",
    phone: "010-2345-6789",
    segment: "new",
    lastVisit: "2026. 10. 27.",
    visits: 1,
    total: 35000,
  },
  {
    id: 3,
    name: "이수민",
    phone: "010-3456-7890",
    segment: "regular",
    lastVisit: "2026. 10. 25.",
    visits: 12,
    total: 465000,
  },
  {
    id: 4,
    name: "최유나",
    phone: "010-4567-8901",
    segment: "new",
    lastVisit: "2026. 10. 21.",
    visits: 2,
    total: 70000,
  },
];

const SEGMENTS: FilterOption[] = [
  { value: "all", label: "전체", count: 128 },
  { value: "regular", label: "단골", count: 24 },
  { value: "new", label: "신규", count: 12 },
];

const won = (value: number) => `${value.toLocaleString("ko-KR")}원`;

const CUSTOMER_COLUMNS: Column<Customer>[] = [
  { id: "name", header: "이름", cell: (row) => row.name, sortable: true },
  { id: "phone", header: "전화", cell: (row) => row.phone },
  { id: "lastVisit", header: "최근 방문", cell: (row) => row.lastVisit },
  {
    id: "visits",
    header: "방문 횟수",
    cell: (row) => `${row.visits}회`,
    align: "end",
    sortable: true,
  },
  { id: "total", header: "누적 금액", cell: (row) => won(row.total), align: "end", sortable: true },
];

/** 미리보기 안에서만 하는 정렬이다. 실제 화면은 sort를 서버 파라미터(sort_by·sort_order)로 넘긴다. */
function sortCustomers(rows: Customer[], sort: SortState): Customer[] {
  if (!sort) return rows;
  const key = sort.columnId as "name" | "visits" | "total";
  const sign = sort.direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) =>
    key === "name" ? a.name.localeCompare(b.name, "ko") * sign : (a[key] - b[key]) * sign,
  );
}

interface Treatment {
  name: string;
  minutes: number;
  price: number;
}

const TREATMENTS: Treatment[] = [
  { name: "젤 네일", minutes: 60, price: 35000 },
  { name: "속눈썹 연장", minutes: 90, price: 60000 },
  { name: "젤 네일 제거", minutes: 30, price: 15000 },
];

const TREATMENT_COLUMNS: Column<Treatment>[] = [
  { id: "name", header: "시술", cell: (row) => row.name },
  { id: "minutes", header: "소요 시간", cell: (row) => `${row.minutes}분`, align: "end" },
  { id: "price", header: "금액", cell: (row) => won(row.price), align: "end" },
];

interface Booking {
  time: string;
  customer: string;
  treatment: string;
  status: string;
  /** 상태 토큰 변수. 상태와 색의 연결은 미리보기 안의 시연이고, 도메인 매핑은 SPEC-UI-002가 만든다 */
  rail: string;
}

// system.md §9의 임시 표시 순서
const BOOKINGS: Booking[] = [
  {
    time: "10:00",
    customer: "김민지",
    treatment: "젤 네일",
    status: "예약됨",
    rail: "var(--status-reserved-rail)",
  },
  {
    time: "11:00",
    customer: "박서연",
    treatment: "속눈썹 연장",
    status: "방문함",
    rail: "var(--status-visited-rail)",
  },
  {
    time: "13:30",
    customer: "이수민",
    treatment: "젤 네일 제거",
    status: "완료",
    rail: "var(--status-completed-rail)",
  },
  {
    time: "15:00",
    customer: "최유나",
    treatment: "젤 네일",
    status: "취소됨",
    rail: "var(--status-cancelled-rail)",
  },
  {
    time: "17:30",
    customer: "정하은",
    treatment: "속눈썹 연장",
    status: "노쇼",
    rail: "var(--status-no-show-rail)",
  },
];

const BOOKING_COLUMNS: Column<Booking>[] = [
  { id: "time", header: "시간", cell: (row) => row.time, width: "5rem" },
  { id: "customer", header: "고객", cell: (row) => row.customer },
  { id: "treatment", header: "시술", cell: (row) => row.treatment },
  { id: "status", header: "상태", cell: (row) => row.status },
];

const PAGE_COUNT = 13;
const panelClasses = "overflow-hidden rounded-panel border border-border bg-card";

function CustomerListPanel() {
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState("all");
  const [sort, setSort] = useState<SortState>({ columnId: "name", direction: "asc" });
  const [page, setPage] = useState(5);

  const visible = sortCustomers(
    CUSTOMERS.filter(
      (customer) =>
        (segment === "all" || customer.segment === segment) &&
        (query === "" || customer.name.includes(query) || customer.phone.includes(query)),
    ),
    sort,
  );

  return (
    <div className={panelClasses}>
      <div className="flex flex-wrap items-center gap-3 px-6 py-4">
        <div className="w-72">
          <Search
            aria-label="고객 검색"
            placeholder="이름·전화번호"
            value={query}
            onValueChange={setQuery}
          />
        </div>
        <Filter
          aria-label="고객 구분"
          options={SEGMENTS}
          value={segment}
          onValueChange={setSegment}
        />
      </div>
      <Table
        data-showcase="Table:sorted"
        caption="고객 목록"
        rows={visible}
        columns={CUSTOMER_COLUMNS}
        getRowKey={(row) => row.id}
        sort={sort}
        onSortChange={setSort}
        inPanel
        className="border-t border-border"
        empty={
          <EmptyState
            icon={Users}
            title="조건에 맞는 고객이 없어요."
            description="검색어나 구분을 바꿔 보세요."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setSegment("all");
                }}
              >
                조건 지우기
              </Button>
            }
          />
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-3">
        <p className="text-caption text-muted-foreground">총 128명</p>
        <Pagination
          data-showcase="Pagination:middle"
          page={page}
          pageCount={PAGE_COUNT}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}

function PaginationEdges() {
  const [first, setFirst] = useState(1);
  const [last, setLast] = useState(PAGE_COUNT);
  return (
    <div className="flex flex-col gap-3">
      {/* 한 화면의 nav 이름이 겹치지 않도록 시연용 이름을 따로 준다. */}
      <Pagination
        data-showcase="Pagination:first"
        aria-label="페이지 이동(첫 쪽 시연)"
        page={first}
        pageCount={PAGE_COUNT}
        onPageChange={setFirst}
      />
      <Pagination
        data-showcase="Pagination:last"
        aria-label="페이지 이동(끝 쪽 시연)"
        page={last}
        pageCount={PAGE_COUNT}
        onPageChange={setLast}
      />
    </div>
  );
}

function StatePanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={panelClasses}>
      <h3 className="border-b border-border px-6 py-3 text-subtitle font-semibold">{title}</h3>
      {children}
    </div>
  );
}

/** 데이터 표시: Card 조합 부품, 목록 패널(툴바 → 표 → 바닥), 표의 상태와 쪽 이동(plan.md §F M5). */
export function DataSection() {
  return (
    <PreviewSection
      id="data"
      title="데이터"
      description="목록 패널의 조합과 표의 상태를 보여 줘요. 카드 안에 카드를 넣지 않아요."
    >
      {/* 한 화면에 Card 제목이 여럿일 수 있어 미리보기에서는 섹션 제목(h2) 아래 수준인 h3를 쓴다. */}
      <Card data-showcase="Card:parts" className="max-w-reading">
        <CardHeader>
          <CardTitle as="h3">오늘 예약</CardTitle>
          <CardDescription>2026. 10. 29. (목) 기준이에요.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col divide-y divide-border">
            {TODAY.map(({ time, customer, treatment }) => (
              <li key={time} className="flex items-center gap-4 py-2">
                <span className="w-12 tabular-nums text-muted-foreground">{time}</span>
                <span className="font-medium">{customer}</span>
                <span className="text-muted-foreground">{treatment}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="justify-end">
          <Button variant="outline">전체 보기</Button>
        </CardFooter>
      </Card>

      <CustomerListPanel />

      <div className="grid gap-6 lg:grid-cols-2">
        <StatePanel title="시술 메뉴">
          <Table
            data-showcase="Table:default"
            caption="시술 메뉴"
            rows={TREATMENTS}
            columns={TREATMENT_COLUMNS}
            getRowKey={(row) => row.name}
            inPanel
          />
        </StatePanel>
        <StatePanel title="오늘 예약 레일">
          <p className="px-6 pt-3 text-body-sm text-muted-foreground">
            레일 색은 상태 토큰을 넘긴 시연이에요. 상태와 색의 연결은 SPEC-UI-002에서 정해요.
          </p>
          <Table
            data-showcase="Table:rail"
            caption="오늘 예약 레일 시연"
            rows={BOOKINGS}
            columns={BOOKING_COLUMNS}
            getRowKey={(row) => row.time}
            getRowRail={(row) => row.rail}
            inPanel
          />
        </StatePanel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <StatePanel title="불러오는 중">
          <Table
            data-showcase="Table:loading"
            caption="고객 목록(불러오는 중 시연)"
            rows={[]}
            columns={CUSTOMER_COLUMNS.slice(0, 3)}
            getRowKey={(row) => row.id}
            loading
            inPanel
          />
        </StatePanel>
        <StatePanel title="비어 있음">
          <Table
            data-showcase="Table:empty"
            caption="고객 목록(빈 상태 시연)"
            rows={[]}
            columns={CUSTOMER_COLUMNS.slice(0, 3)}
            getRowKey={(row) => row.id}
            inPanel
            empty={
              <EmptyState
                icon={Users}
                title="아직 등록한 고객이 없어요."
                description="첫 고객을 등록해 보세요."
              />
            }
          />
        </StatePanel>
        <StatePanel title="오류">
          <div className="flex flex-col items-start gap-3 p-6">
            <Alert tone="destructive" title="고객 목록을 불러오지 못했어요." className="w-full">
              잠시 뒤에 다시 시도해 주세요.
            </Alert>
            <Button variant="outline">다시 시도</Button>
          </div>
        </StatePanel>
      </div>

      <PaginationEdges />
    </PreviewSection>
  );
}
