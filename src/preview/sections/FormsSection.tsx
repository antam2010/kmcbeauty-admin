import { Clock } from "lucide-react";
import { type ReactNode, useState } from "react";
import {
  Checkbox,
  Field,
  Filter,
  type FilterOption,
  Input,
  Search,
  Select,
  type SelectGroup,
  type SelectOption,
  Textarea,
} from "@/ui-core";
import { PreviewSection } from "../PreviewSection";

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-5 rounded-panel border border-border bg-card p-6">
      <h3 className="text-subtitle font-semibold">{title}</h3>
      {children}
    </div>
  );
}

const noop = () => undefined;

const TREATMENTS: SelectOption[] = [
  { value: "gel", label: "젤 네일" },
  { value: "lash", label: "속눈썹 연장" },
  { value: "care", label: "손톱 관리" },
];

const GROUPED_TREATMENTS: Array<SelectOption | SelectGroup> = [
  {
    label: "네일",
    options: [
      { value: "gel", label: "젤 네일" },
      { value: "care", label: "손톱 관리" },
    ],
  },
  {
    label: "속눈썹",
    options: [
      { value: "lash", label: "속눈썹 연장" },
      { value: "perm", label: "속눈썹 펌(준비 중)", disabled: true },
    ],
  },
];

const PERIODS: FilterOption[] = [
  { value: "all", label: "전체" },
  { value: "today", label: "오늘" },
  { value: "week", label: "이번 주" },
];

const PERIODS_WITH_COUNT: FilterOption[] = [
  { value: "all", label: "전체", count: 128 },
  { value: "today", label: "오늘", count: 12 },
  { value: "week", label: "이번 주", count: 47 },
];

/** Field와 입력 컨트롤의 상태를 보여 준다(acceptance.md AC-UI-001-14 전시 목록의 Field~Filter 행). */
export function FormsSection() {
  const [customerName, setCustomerName] = useState("김민지");
  const [phone, setPhone] = useState("");
  const [memo, setMemo] = useState("");
  const [marketing, setMarketing] = useState(false);
  const [reminder, setReminder] = useState(true);
  const [allTreatments, setAllTreatments] = useState<boolean | "indeterminate">("indeterminate");
  const [consent, setConsent] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");
  const [menuQuery, setMenuQuery] = useState("젤 네일");
  const [treatment, setTreatment] = useState<string | undefined>("gel");
  const [groupedTreatment, setGroupedTreatment] = useState<string | undefined>(undefined);
  const [designer, setDesigner] = useState<string | undefined>(undefined);
  const [period, setPeriod] = useState("all");
  const [countedPeriod, setCountedPeriod] = useState("today");

  return (
    <PreviewSection
      id="forms"
      title="폼"
      description="Field가 라벨·설명·오류를 컨트롤과 연결해요. 오류 문장은 무엇이 잘못됐는지와 고치는 방법을 함께 알려 줘요."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Field">
          <Field
            data-showcase="Field:description"
            label="고객명"
            description="예약 목록에 보이는 이름이에요."
          >
            <Input value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
          </Field>
          <Field
            data-showcase="Field:error"
            label="전화번호"
            description="010-1234-5678 형식으로 입력해요."
            error="전화번호를 입력해 주세요."
          >
            <Input
              inputMode="tel"
              placeholder="010-1234-5678"
              className="tabular-nums"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </Field>
          <Field data-showcase="Field:required" label="시술 메뉴명" required>
            <Input defaultValue="젤 네일" />
          </Field>
        </Panel>

        <Panel title="Input">
          <Input
            data-showcase="Input:sm"
            size="sm"
            aria-label="작은 입력"
            placeholder="작은 입력"
          />
          <Input data-showcase="Input:default" aria-label="기본 입력" placeholder="기본 입력" />
          <Input data-showcase="Input:lg" size="lg" aria-label="큰 입력" placeholder="큰 입력" />
          <Field label="시작 시각">
            <Input
              data-showcase="Input:start-adornment"
              startAdornment={<Clock />}
              defaultValue="14:30"
              className="tabular-nums"
            />
          </Field>
          <Field label="가격">
            <Input
              data-showcase="Input:end-adornment"
              endAdornment="원"
              inputMode="numeric"
              defaultValue="35,000"
              className="tabular-nums"
            />
          </Field>
          <Input
            data-showcase="Input:invalid"
            invalid
            aria-label="잘못 입력한 전화번호"
            defaultValue="010-12"
            className="tabular-nums"
          />
          <Field label="고객 번호">
            <Input data-showcase="Input:read-only" readOnly defaultValue="C-1024" />
          </Field>
          <Field label="매장명">
            <Input data-showcase="Input:disabled" disabled defaultValue="강남점" />
          </Field>
        </Panel>

        <Panel title="Textarea">
          <Field label="예약 메모" description="120자까지 쓸 수 있어요.">
            <Textarea
              data-showcase="Textarea:default"
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
            />
          </Field>
          <Field label="취소 사유" error="취소 사유를 입력해 주세요.">
            <Textarea data-showcase="Textarea:invalid" />
          </Field>
          <Field label="관리자 메모">
            <Textarea
              data-showcase="Textarea:disabled"
              disabled
              defaultValue="이 메모는 원장만 고칠 수 있어요."
            />
          </Field>
        </Panel>

        <Panel title="Checkbox">
          <Checkbox
            data-showcase="Checkbox:unchecked"
            checked={marketing}
            onCheckedChange={setMarketing}
            label="마케팅 알림 받기"
          />
          <Checkbox
            data-showcase="Checkbox:checked"
            checked={reminder}
            onCheckedChange={setReminder}
            label="예약 알림 받기"
          />
          <Checkbox
            data-showcase="Checkbox:indeterminate"
            checked={allTreatments}
            onCheckedChange={setAllTreatments}
            label="시술 항목 전체 선택"
          />
          <Checkbox
            data-showcase="Checkbox:disabled"
            disabled
            checked
            onCheckedChange={noop}
            label="기본 알림(변경 불가)"
          />
          <Field label="개인정보 수집 동의" error="동의해야 예약 알림을 보낼 수 있어요." required>
            <Checkbox
              data-showcase="Checkbox:invalid"
              checked={consent}
              onCheckedChange={setConsent}
            />
          </Field>
        </Panel>

        <Panel title="Search">
          <Search
            data-showcase="Search:empty"
            aria-label="고객 검색"
            placeholder="이름·전화번호"
            value={customerQuery}
            onValueChange={setCustomerQuery}
          />
          <Search
            data-showcase="Search:filled"
            aria-label="시술 메뉴 검색"
            value={menuQuery}
            onValueChange={setMenuQuery}
          />
        </Panel>

        <Panel title="Select">
          <Field label="시술">
            <Select
              data-showcase="Select:default"
              options={TREATMENTS}
              value={treatment}
              onValueChange={setTreatment}
            />
          </Field>
          <Field label="시술 분류" description="분류별로 묶어 보여 줘요.">
            <Select
              data-showcase="Select:grouped"
              options={GROUPED_TREATMENTS}
              placeholder="시술을 골라요"
              value={groupedTreatment}
              onValueChange={setGroupedTreatment}
            />
          </Field>
          <Field label="담당자" error="담당자를 골라 주세요." required>
            <Select
              data-showcase="Select:invalid"
              options={[
                { value: "kim", label: "김하늘" },
                { value: "lee", label: "이서준" },
              ]}
              value={designer}
              onValueChange={setDesigner}
            />
          </Field>
          <Field label="매장">
            <Select
              data-showcase="Select:disabled"
              disabled
              options={[{ value: "gangnam", label: "강남점" }]}
              value="gangnam"
              onValueChange={noop}
            />
          </Field>
        </Panel>

        <Panel title="Filter">
          <Filter
            data-showcase="Filter:default"
            aria-label="예약 기간"
            options={PERIODS}
            value={period}
            onValueChange={setPeriod}
          />
          <Filter
            data-showcase="Filter:count"
            aria-label="예약 기간(개수 표시)"
            options={PERIODS_WITH_COUNT}
            value={countedPeriod}
            onValueChange={setCountedPeriod}
          />
          <p className="text-body-sm text-muted-foreground">
            방향키로 옮기면 선택도 함께 바뀌어요. 선택한 항목을 다시 눌러도 해제되지 않아요.
          </p>
        </Panel>
      </div>
    </PreviewSection>
  );
}
