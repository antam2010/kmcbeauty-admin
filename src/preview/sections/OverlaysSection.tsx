import { CircleQuestionMark, RefreshCw } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  Button,
  Field,
  Input,
  Modal,
  type ModalProps,
  showConfirm,
  Textarea,
  Tooltip,
  toast,
} from "@/ui-core";
import { PreviewSection } from "../PreviewSection";

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-panel border border-border bg-card p-6">
      <h3 className="text-subtitle font-semibold">{title}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

/** 크기만 다른 안내용 대화상자 */
function SizeDemo({ size, label }: { size: NonNullable<ModalProps["size"]>; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" data-showcase={`Modal:${size}`} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        size={size}
        title="예약 메모"
        description="고객에게는 보이지 않는 매장 메모예요."
        footer={<Button onClick={() => setOpen(false)}>확인</Button>}
      >
        <Field label="메모">
          <Textarea defaultValue="첫 방문 고객이에요. 젤 네일 60분 35,000원으로 안내했어요." />
        </Field>
      </Modal>
    </>
  );
}

/** 입력이 바뀌면 작성 중(dirty)이 되어 닫을 때 확인한다. */
function DirtyDemo() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const close = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setName("");
      setPhone("");
    }
  };
  return (
    <>
      <Button variant="outline" data-showcase="Modal:dirty" onClick={() => setOpen(true)}>
        작성 중 닫기 확인
      </Button>
      <Modal
        open={open}
        onOpenChange={close}
        title="고객 등록"
        description="이름이나 전화번호를 입력한 뒤 닫아 보세요."
        dirty={name !== "" || phone !== ""}
        footer={<Button onClick={() => close(false)}>저장</Button>}
      >
        <Field label="이름">
          <Input value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label="전화번호">
          <Input
            inputMode="tel"
            placeholder="010-1234-5678"
            className="tabular-nums"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </Field>
      </Modal>
    </>
  );
}

/** 저장하는 동안(closeDisabled)에는 닫기 요청을 모두 무시한다. */
function SubmittingDemo() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const submit = () => {
    setSubmitting(true);
    // 미리보기 전용: 네트워크 없이 2초 뒤 저장이 끝난 것처럼 닫는다.
    timerRef.current = window.setTimeout(() => {
      setSubmitting(false);
      setOpen(false);
    }, 2000);
  };

  return (
    <>
      <Button variant="outline" data-showcase="Modal:submitting" onClick={() => setOpen(true)}>
        제출 중 닫기 막기
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="시술 메뉴 수정"
        dirty
        closeDisabled={submitting}
        footer={
          <Button loading={submitting} onClick={submit}>
            저장
          </Button>
        }
      >
        <Field label="메뉴명">
          <Input defaultValue="젤 네일" />
        </Field>
        <p className="text-body-sm text-muted-foreground">
          저장을 누르면 2초 동안 닫기 버튼·Esc·바깥 누르기가 모두 막혀요.
        </p>
      </Modal>
    </>
  );
}

/** 모달·확인 대화상자·알림·툴팁을 보여 준다(acceptance.md AC-UI-001-14 전시 목록의 Modal~Tooltip 행). */
export function OverlaysSection() {
  return (
    <PreviewSection
      id="overlays"
      title="오버레이"
      description="대화상자는 열리면 첫 입력에 포커스를 두고, 닫히면 연 버튼으로 포커스를 돌려줘요."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Modal">
          <SizeDemo size="sm" label="작은 대화상자" />
          <SizeDemo size="md" label="기본 대화상자" />
          <SizeDemo size="lg" label="큰 대화상자" />
          <DirtyDemo />
          <SubmittingDemo />
        </Panel>

        <Panel title="ConfirmDialog">
          <Button
            variant="outline"
            data-showcase="ConfirmDialog:default"
            onClick={() =>
              void showConfirm({
                title: "예약을 확정할까요?",
                description: "확정하면 고객에게 예약 알림 문자가 가요.",
                confirmLabel: "확정",
              })
            }
          >
            기본 확인
          </Button>
          <Button
            variant="outline"
            data-showcase="ConfirmDialog:destructive"
            onClick={() =>
              void showConfirm({
                title: "김민지 고객을 삭제할까요?",
                description: "고객 정보와 시술 이력이 모두 삭제되고 되돌릴 수 없어요.",
                confirmLabel: "삭제",
                tone: "destructive",
              })
            }
          >
            위험 동작 확인
          </Button>
          <Button
            variant="outline"
            data-showcase="ConfirmDialog:async-failure"
            onClick={() =>
              void showConfirm({
                title: "예약 알림을 다시 보낼까요?",
                description: "김민지 고객(010-1234-5678)에게 문자를 다시 보내요.",
                confirmLabel: "다시 보내기",
                // 미리보기 전용: 네트워크 없이 1초 뒤 실패해 대화상자 안 오류를 보인다.
                onConfirm: () =>
                  new Promise<void>((_, reject) => {
                    window.setTimeout(() => reject(new Error("preview")), 1000);
                  }),
              })
            }
          >
            비동기 실패
          </Button>
        </Panel>

        <Panel title="Toast">
          <Button
            variant="outline"
            data-showcase="Toast:success"
            onClick={() => toast.success("예약을 저장했어요.")}
          >
            성공
          </Button>
          <Button
            variant="outline"
            data-showcase="Toast:info"
            onClick={() =>
              toast.info("새 예약이 들어왔어요.", { description: "김민지 · 젤 네일 60분 · 14:30" })
            }
          >
            안내
          </Button>
          <Button
            variant="outline"
            data-showcase="Toast:warning"
            onClick={() => toast.warning("영업시간이 30분 남았어요.")}
          >
            주의
          </Button>
          <Button
            variant="outline"
            data-showcase="Toast:destructive"
            onClick={() => toast.error("예약을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.")}
          >
            오류(닫을 때까지 유지)
          </Button>
          <Button
            variant="outline"
            data-showcase="Toast:queue"
            onClick={() => {
              for (const time of ["10:00", "11:30", "13:00", "14:30", "16:00"]) {
                toast.info(`${time} 예약이 확정됐어요.`);
              }
            }}
          >
            대기열(5개)
          </Button>
          <Button
            variant="outline"
            data-showcase="Toast:action"
            onClick={() =>
              toast.success("예약을 취소했어요.", {
                action: {
                  label: "되돌리기",
                  onClick: () => toast.info("취소를 되돌렸어요."),
                },
              })
            }
          >
            동작 하나
          </Button>
        </Panel>

        <Panel title="Tooltip">
          <Tooltip content="예약 목록을 새로 불러와요.">
            <Button
              variant="outline"
              size="icon"
              aria-label="새로고침"
              data-showcase="Tooltip:default"
            >
              <RefreshCw />
            </Button>
          </Tooltip>
          <Tooltip content="F8을 누르면 알림 영역으로 바로 갈 수 있어요." side="right">
            <Button variant="ghost" size="icon" aria-label="도움말">
              <CircleQuestionMark />
            </Button>
          </Tooltip>
        </Panel>
      </div>
    </PreviewSection>
  );
}
