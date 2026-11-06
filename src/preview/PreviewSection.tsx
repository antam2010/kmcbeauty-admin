import type { ReactNode } from "react";

interface PreviewSectionProps {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}

/** 미리보기 섹션의 공통 틀: 같은 페이지 앵커(id)와 섹션 제목(h2) */
export function PreviewSection({ id, title, description, children }: PreviewSectionProps) {
  const headingId = `${id}-title`;
  return (
    <section id={id} aria-labelledby={headingId} className="flex scroll-mt-6 flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id={headingId} className="text-title font-semibold">
          {title}
        </h2>
        {description ? <p className="text-body-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
