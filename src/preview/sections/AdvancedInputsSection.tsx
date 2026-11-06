import { type ReactNode, useEffect, useRef, useState } from "react";
import { Calendar, Combobox, type ComboboxOption, Field } from "@/ui-core";
import { PreviewSection } from "../PreviewSection";

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-5 rounded-panel border border-border bg-card p-6">
      <h3 className="text-subtitle font-semibold">{title}</h3>
      {children}
    </div>
  );
}

// 시연용 목업 데이터다. 네트워크를 쓰지 않는다(design.md §9).
const CUSTOMERS: ComboboxOption[] = [
  { value: "c1", label: "김민지", description: "010-1234-5678", keywords: ["01012345678"] },
  { value: "c2", label: "김민수", description: "010-2345-6789", keywords: ["01023456789"] },
  { value: "c3", label: "박서연", description: "010-3456-7890", keywords: ["01034567890"] },
  { value: "c4", label: "이하은", description: "010-4567-8901", keywords: ["01045678901"] },
];

const GROUPS: ComboboxOption[] = [
  { value: "regular", label: "단골" },
  { value: "new", label: "신규" },
  { value: "vip", label: "VIP" },
];

/** 로컬 거르기: 이름·전화번호 부분 일치 */
function LocalDemo() {
  const [value, setValue] = useState<string | null>(null);
  return (
    <Field label="고객" description="이름이나 전화번호로 찾아요.">
      <Combobox
        data-showcase="Combobox:local"
        options={CUSTOMERS}
        value={value}
        onValueChange={setValue}
        placeholder="이름 또는 전화번호"
      />
    </Field>
  );
}

/** 원격 검색: 지연 응답 목업(400ms 뒤 결과). 디바운스·요청은 소비 측의 몫이라 여기서 흉내만 낸다. */
function RemoteDemo() {
  const [value, setValue] = useState<string | null>(null);
  const [valueLabel, setValueLabel] = useState<string | undefined>(undefined);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ComboboxOption[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const search = (next: string) => {
    setText(next);
    clearTimeout(timer.current);
    if (next.trim() === "") {
      setLoading(false);
      setResults([]);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(() => {
      setResults(CUSTOMERS.filter((customer) => customer.label.includes(next.trim())));
      setLoading(false);
    }, 400);
  };

  return (
    <Field label="고객 검색(원격)" description="입력을 멈추면 결과를 불러와요.">
      <Combobox
        data-showcase="Combobox:remote"
        filtering="remote"
        options={results}
        loading={loading}
        inputValue={text}
        onInputValueChange={search}
        value={value}
        valueLabel={valueLabel}
        onValueChange={(next) => {
          setValue(next);
          setValueLabel(results.find((customer) => customer.value === next)?.label);
        }}
        emptyText={`‘${text.trim()}’과 일치하는 고객이 없어요.`}
        placeholder="이름을 입력해요"
      />
    </Field>
  );
}

/** 빈 결과와 새 값 만들기("새 고객 등록") */
function CreateDemo() {
  const [groups, setGroups] = useState(GROUPS);
  const [value, setValue] = useState<string | null>(null);
  return (
    <Field label="고객 그룹" description="목록에 없으면 새로 만들어요.">
      <Combobox
        data-showcase="Combobox:create"
        options={groups}
        value={value}
        onValueChange={setValue}
        createAction={{
          label: (text) => `‘${text}’ 새 고객 등록`,
          onSelect: (text) => {
            setGroups((prev) => [...prev, { value: text, label: text }]);
            setValue(text);
          },
        }}
        placeholder="그룹 이름"
      />
    </Field>
  );
}

/** 휴무일(월요일)을 고를 수 없게 막는 시연 */
const isClosedDay = (date: Date) => date.getDay() === 1;

function CalendarDemo({
  showcase,
  label,
  disabled,
}: {
  showcase: string;
  label: string;
  disabled?: boolean;
}) {
  const [value, setValue] = useState<Date | null>(null);
  return (
    <div data-showcase={showcase} className="rounded-panel border border-border">
      <Calendar
        aria-label={label}
        value={value}
        onValueChange={setValue}
        isDateDisabled={disabled ? isClosedDay : undefined}
      />
    </div>
  );
}

/** 고급 입력 섹션: Combobox(design.md §7.1), Calendar(design.md §7.2). */
export function AdvancedInputsSection() {
  return (
    <PreviewSection
      id="advanced-inputs"
      title="고급 입력"
      description="검색해서 고르기와 예약 일시 입력이에요."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Combobox">
          <LocalDemo />
          <RemoteDemo />
          <CreateDemo />
        </Panel>
        <Panel title="Calendar">
          <div className="flex flex-wrap gap-4">
            <CalendarDemo showcase="Calendar:default" label="기본 달력" />
            <div className="flex flex-col gap-2">
              <CalendarDemo showcase="Calendar:disabled-dates" label="휴무일 달력" disabled />
              <p className="text-body-sm text-muted-foreground">월요일은 휴무라 고를 수 없어요.</p>
            </div>
          </div>
        </Panel>
      </div>
    </PreviewSection>
  );
}
