import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/ui-core";
import { PreviewSection } from "../PreviewSection";

const TODAY = [
  { time: "10:00", customer: "김민지", treatment: "젤 네일" },
  { time: "13:30", customer: "박서연", treatment: "속눈썹 연장" },
  { time: "16:00", customer: "이수민", treatment: "젤 네일 제거" },
];

/** 데이터 표시의 첫 모습: Card 조합 부품. 표와 쪽 이동은 같은 섹션에 이어서 더한다(plan.md §F M5). */
export function DataSection() {
  return (
    <PreviewSection
      id="data"
      title="데이터"
      description="목록 패널에 쓰는 Card의 조합 부품을 보여 줘요. 카드 안에 카드를 넣지 않아요."
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
    </PreviewSection>
  );
}
