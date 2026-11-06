import {
  CalendarDays,
  Download,
  LayoutDashboard,
  Scissors,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";
import type { MouseEvent } from "react";
import {
  Badge,
  Breadcrumb,
  Button,
  type LinkComponentProps,
  PageHeader,
  Sidebar,
  type SidebarGroup,
  type TabItem,
  Tabs,
} from "@/ui-core";
import { PreviewSection } from "../PreviewSection";

/** 미리보기 안에서는 페이지를 옮기지 않는 링크. 실제 화면은 라우터 링크를 넘긴다(design.md §8.2). */
function PreviewLink({ to, children, ...props }: LinkComponentProps) {
  return (
    <a href={to} {...props} onClick={(event: MouseEvent) => event.preventDefault()}>
      {children}
    </a>
  );
}

const MENU: SidebarGroup[] = [
  {
    label: "운영",
    items: [
      { to: "/manager", label: "대시보드", icon: LayoutDashboard },
      { to: "/manager/reservations", label: "예약", icon: CalendarDays },
    ],
  },
  {
    label: "고객",
    items: [{ to: "/manager/customers", label: "고객", icon: Users }],
  },
  {
    label: "매장 관리",
    items: [
      { to: "/manager/treatments", label: "시술 메뉴", icon: Scissors },
      { to: "/manager/settings", label: "매장 설정", icon: Settings },
    ],
  },
];

function StoreMark() {
  return (
    <span
      aria-hidden="true"
      className="flex size-8 shrink-0 items-center justify-center rounded-control bg-primary font-semibold text-primary-foreground"
    >
      강
    </span>
  );
}

const CUSTOMER_TABS: TabItem[] = [
  { value: "all", label: "전체", content: <p>등록한 고객 128명을 모두 보여 줘요.</p> },
  { value: "regular", label: "단골", content: <p>최근 3개월에 3번 넘게 방문한 고객이에요.</p> },
  {
    value: "dormant",
    label: "휴면",
    content: <p>6개월 넘게 방문하지 않은 고객이에요.</p>,
    disabled: true,
  },
];

const DETAIL_TABS: TabItem[] = [
  {
    value: "info",
    label: "기본 정보",
    content: <p className="text-body-sm">김민지 · 010-1234-5678 · 첫 방문 2025. 3. 14.</p>,
  },
  {
    value: "history",
    label: "시술 이력",
    content: <p className="text-body-sm">젤 네일 60분 35,000원 · 2026. 10. 28.</p>,
  },
  {
    value: "memo",
    label: "메모",
    content: <p className="text-body-sm">손톱이 얇아 제거할 때 조심해 주세요.</p>,
  },
];

/** 탐색: 사이드바 펼침·접힘, 이동 경로, 하위 탐색으로 Tabs를 둔 시연용 PageHeader, Tabs(plan.md §F M5). */
export function NavigationSection() {
  return (
    <PreviewSection
      id="navigation"
      title="탐색"
      description="사이드바와 화면 머리, 이동 경로, 탭을 보여 줘요. 화면당 h1은 페이지 머리 하나라서 시연용 머리는 h3로 둬요."
    >
      {/* 한 화면의 nav 이름이 겹치지 않도록 시연용 이름을 따로 준다. 접힘 저장·서랍은 앱 셸(SPEC-UI-002)의 몫이에요. */}
      <div className="flex flex-wrap items-start gap-6">
        <div className="h-96 overflow-hidden rounded-panel border border-border">
          <Sidebar
            data-showcase="Sidebar:expanded"
            aria-label="주 메뉴(펼침 시연)"
            groups={MENU}
            currentPath="/manager/customers"
            linkComponent={PreviewLink}
            className="border-e-0"
            header={
              <>
                <StoreMark />
                <span className="truncate font-semibold">kmc뷰티 강남점</span>
              </>
            }
            footer={<p className="px-3 text-body-sm text-muted-foreground">김원장 · 원장</p>}
          />
        </div>
        <div className="h-96 overflow-hidden rounded-panel border border-border">
          <Sidebar
            data-showcase="Sidebar:collapsed"
            aria-label="주 메뉴(접힘 시연)"
            groups={MENU}
            currentPath="/manager/customers"
            linkComponent={PreviewLink}
            collapsed
            className="border-e-0"
            header={<StoreMark />}
          />
        </div>
      </div>
      <div className="rounded-panel border border-border bg-card p-6">
        <PageHeader
          data-showcase="PageHeader:sub-nav"
          titleAs="h3"
          title="고객 관리"
          breadcrumb={
            <Breadcrumb
              data-showcase="Breadcrumb:default"
              linkComponent={PreviewLink}
              items={[
                { label: "홈", to: "/manager" },
                { label: "고객", to: "/manager/customers" },
                { label: "고객 목록" },
              ]}
            />
          }
          badge={<Badge tone="neutral">128명</Badge>}
          description="등록한 고객을 찾고 관리해요."
          secondaryActions={
            <Button variant="outline">
              <Download />
              내보내기
            </Button>
          }
          primaryAction={
            <Button>
              <UserPlus />
              고객 등록
            </Button>
          }
          subNav={
            <Tabs data-showcase="Tabs:disabled" aria-label="고객 구분" items={CUSTOMER_TABS} />
          }
        />
      </div>
      <div className="max-w-reading rounded-panel border border-border bg-card p-6">
        <Tabs data-showcase="Tabs:default" aria-label="고객 상세" items={DETAIL_TABS} />
      </div>
    </PreviewSection>
  );
}
