// 약관 문서 서식(PageHeader + 문단). 읽기 좋은 폭(max-w-reading)에 문단마다 <p> 하나를 쓴다.
import { PageHeader } from "@/ui-core";

export function LegalDocument({ title, paragraphs }: { title: string; paragraphs: string[] }) {
  return (
    <article className="mx-auto flex w-full max-w-reading flex-col gap-6 py-6">
      <PageHeader title={title} />
      <div className="flex flex-col gap-4 text-body text-foreground">
        {paragraphs.map((paragraph, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: 같은 글의 문단이 둘 있어도 키가 겹치지 않게 순서를 붙인다(문단 목록은 정적이라 순서가 바뀌지 않는다)
          <p key={`${index}-${paragraph}`}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
