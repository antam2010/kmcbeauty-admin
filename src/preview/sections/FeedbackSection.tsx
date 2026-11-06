import {
  Ban,
  CalendarClock,
  CircleCheck,
  DoorOpen,
  type LucideIcon,
  Scissors,
  Users,
  UserX,
} from "lucide-react";
import type { ReactNode } from "react";
import { Alert, Badge, Button, EmptyState, Loading, Skeleton, SkeletonGroup } from "@/ui-core";
import { PreviewSection } from "../PreviewSection";

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-panel border border-border bg-card p-6">
      <h3 className="text-subtitle font-semibold">{title}</h3>
      {children}
    </div>
  );
}

// 예약 상태 토큰 시연용 조합이다. 상태 → 라벨·아이콘·토큰 매핑은 SPEC-UI-002의 예약 도메인 모듈이 맡는다(plan.md §A.7).
// 순서는 system.md §9의 임시 순서이고, Tailwind가 소스에서 클래스를 찾도록 클래스 이름을 글자 그대로 적는다.
const STATUS_DEMO: { key: string; label: string; icon: LucideIcon; className: string }[] = [
  {
    key: "reserved",
    label: "예약됨",
    icon: CalendarClock,
    className: "bg-status-reserved-bg text-status-reserved-fg",
  },
  {
    key: "visited",
    label: "방문함",
    icon: DoorOpen,
    className: "bg-status-visited-bg text-status-visited-fg",
  },
  {
    key: "completed",
    label: "완료",
    icon: CircleCheck,
    className: "bg-status-completed-bg text-status-completed-fg",
  },
  {
    key: "cancelled",
    label: "취소됨",
    icon: Ban,
    className: "bg-status-cancelled-bg text-status-cancelled-fg",
  },
  {
    key: "no-show",
    label: "노쇼",
    icon: UserX,
    className: "bg-status-no-show-bg text-status-no-show-fg",
  },
];

/** Alert·Badge·Loading·Skeleton·EmptyState와 예약 상태 토큰 시연을 보여 준다. */
export function FeedbackSection() {
  return (
    <PreviewSection
      id="feedback"
      title="피드백"
      description="알림·배지·로딩·빈 상태의 tone과 상태를 보여 줘요."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Alert">
          <Alert data-showcase="Alert:info" title="예약 시간이 바뀌었어요.">
            김민지 고객의 예약이 15:00으로 옮겨졌어요.
          </Alert>
          <Alert data-showcase="Alert:success" tone="success" title="예약을 저장했어요." />
          <Alert data-showcase="Alert:warning" tone="warning" title="영업 종료 30분 전이에요.">
            새 예약은 다음 영업일로 잡아 주세요.
          </Alert>
          <Alert
            data-showcase="Alert:destructive"
            tone="destructive"
            title="예약을 불러오지 못했어요."
          >
            잠시 후 다시 시도해 주세요.
          </Alert>
          <Alert data-showcase="Alert:live" tone="destructive" live title="저장하지 못했어요.">
            동적으로 나타나는 오류에만 role="alert"를 써요.
          </Alert>
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel title="Badge">
            <div className="flex flex-wrap items-center gap-2">
              <Badge data-showcase="Badge:neutral">VIP</Badge>
              <Badge data-showcase="Badge:info" tone="info">
                신규
              </Badge>
              <Badge data-showcase="Badge:success" tone="success">
                재방문
              </Badge>
              <Badge data-showcase="Badge:warning" tone="warning">
                미수금
              </Badge>
              <Badge data-showcase="Badge:destructive" tone="destructive">
                차단
              </Badge>
              <Badge data-showcase="Badge:icon" icon={Scissors}>
                시술
              </Badge>
              <Badge data-showcase="Badge:dot" tone="success" dot>
                운영 중
              </Badge>
            </div>
          </Panel>

          <Panel title="예약 상태 토큰">
            <p className="text-body-sm text-muted-foreground">
              토큰 시연용 조합이에요. 예약 상태 배지는 SPEC-UI-002에서 만들어요.
            </p>
            <ul className="flex flex-wrap items-center gap-2">
              {STATUS_DEMO.map(({ key, label, icon, className }) => (
                <li key={key}>
                  <Badge data-status-badge={key} icon={icon} className={className}>
                    {label}
                  </Badge>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Loading">
            <div className="flex flex-wrap items-center gap-6">
              <Loading data-showcase="Loading:sm" size="sm" />
              <Loading data-showcase="Loading:md" label="매장 정보를 불러오는 중…" />
            </div>
          </Panel>
        </div>

        <Panel title="Skeleton">
          <Skeleton data-showcase="Skeleton:block" className="h-20 w-full" />
          <div data-showcase="Skeleton:text" className="flex flex-col gap-2">
            <Skeleton variant="text" className="w-3/4" />
            <Skeleton variant="text" className="w-1/2" />
          </div>
          <p className="text-body-sm text-muted-foreground">
            묶음은 300ms보다 짧은 로딩에서는 보이지 않아요. 여기서는 바로 보이도록 지연을 0으로
            두었어요.
          </p>
          <SkeletonGroup
            data-showcase="Skeleton:group"
            delayMs={0}
            label="고객 목록을 불러오는 중…"
          >
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </SkeletonGroup>
        </Panel>

        <Panel title="EmptyState">
          <div className="rounded-panel border border-border">
            <EmptyState
              data-showcase="EmptyState:with-action"
              icon={Users}
              title="아직 등록된 고객이 없어요"
              description="첫 고객을 등록하면 바로 예약을 잡을 수 있어요."
              action={<Button>고객 등록</Button>}
            />
          </div>
        </Panel>
      </div>
    </PreviewSection>
  );
}
