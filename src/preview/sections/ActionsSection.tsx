import { Plus, Trash } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/ui-core";
import { PreviewSection } from "../PreviewSection";

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-body font-semibold">{title}</h3>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

/** Button의 변형·크기·상태를 보여 준다(acceptance.md AC-UI-001-14 전시 목록의 Button 행). */
export function ActionsSection() {
  return (
    <PreviewSection
      id="actions"
      title="동작"
      description="버튼의 변형·크기·상태를 보여 줘요. 주요 동작(default)은 페이지 머리와 대화상자 바닥마다 하나만 둬요."
    >
      <div className="flex flex-col gap-6 rounded-panel border border-border bg-card p-6">
        <Group title="변형">
          <Button data-showcase="Button:default">저장</Button>
          <Button variant="outline" data-showcase="Button:outline">
            취소
          </Button>
          <Button variant="ghost" data-showcase="Button:ghost">
            더보기
          </Button>
          <Button variant="destructive" data-showcase="Button:destructive">
            <Trash />
            삭제
          </Button>
          <Button variant="link" data-showcase="Button:link">
            시술 이력 보기
          </Button>
        </Group>
        <Group title="크기">
          <Button size="sm" data-showcase="Button:sm">
            <Plus />
            예약 추가
          </Button>
          <Button>
            <Plus />
            예약 추가
          </Button>
          <Button size="lg" data-showcase="Button:lg">
            <Plus />
            예약 추가
          </Button>
          <Button size="icon" aria-label="고객 추가" data-showcase="Button:icon">
            <Plus />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="김민지 고객 삭제"
            data-showcase="Button:icon-sm"
          >
            <Trash />
          </Button>
        </Group>
        <Group title="상태">
          <Button loading data-showcase="Button:loading">
            저장
          </Button>
          <Button disabled data-showcase="Button:disabled">
            보내기
          </Button>
          <Button asChild variant="outline" data-showcase="Button:as-child">
            <a href="#tokens">토큰 섹션으로 이동</a>
          </Button>
        </Group>
      </div>
    </PreviewSection>
  );
}
