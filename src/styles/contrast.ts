// WCAG 2.x 대비 계산과 토큰 CSS 파서(순수 함수). 대비 회귀 테스트와 토큰 동기화 테스트가 함께 쓴다.

/** 선택자(또는 at-rule 머리) 하나에 들어 있는 선언 `이름: 값`의 모음 */
export type CssDeclarations = Record<string, string>;

function channel(value: number): number {
  const srgb = value / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

/** `#rrggbb`의 상대 휘도(WCAG 2.x 정의) */
export function relativeLuminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) throw new Error(`Expected a #rrggbb color, received "${hex}"`);
  const [red, green, blue] = [0, 2, 4].map((offset) =>
    channel(Number.parseInt(match[1].slice(offset, offset + 2), 16)),
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** 두 색의 대비(1~21). 어느 쪽이 전경인지는 상관없다. */
export function contrastRatio(foreground: string, background: string): number {
  const [lighter, darker] = [relativeLuminance(foreground), relativeLuminance(background)].sort(
    (a, b) => b - a,
  );
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * CSS를 블록 단위로 읽어 블록 머리(공백을 하나로 모은 선택자나 at-rule)별 선언을 모은다.
 * 중첩 블록은 가장 안쪽 머리에 넣고, 같은 머리가 여러 번 나오면 합친다. 주석은 무시한다.
 */
export function parseDeclarationBlocks(css: string): Map<string, CssDeclarations> {
  const blocks = new Map<string, CssDeclarations>();
  const source = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const stack: string[] = [];
  let buffer = "";
  const flushDeclaration = () => {
    const text = buffer.trim();
    buffer = "";
    const current = stack.at(-1);
    if (!current || text === "") return;
    const colon = text.indexOf(":");
    if (colon === -1) return;
    const declarations = blocks.get(current) ?? {};
    declarations[text.slice(0, colon).trim()] = text
      .slice(colon + 1)
      .trim()
      .replace(/\s+/g, " ");
    blocks.set(current, declarations);
  };
  for (const char of source) {
    if (char === "{") {
      stack.push(buffer.trim().replace(/\s+/g, " "));
      buffer = "";
    } else if (char === "}") {
      flushDeclaration();
      stack.pop();
    } else if (char === ";") {
      if (stack.length === 0) buffer = "";
      else flushDeclaration();
    } else {
      buffer += char;
    }
  }
  return blocks;
}

/** `--이름`의 값을 같은 블록 안에서 `var(--다른이름)` 별칭을 따라가며 풀어 돌려준다. */
export function resolveVariable(declarations: CssDeclarations, name: string): string {
  const seen = new Set<string>();
  let key = name.startsWith("--") ? name : `--${name}`;
  for (;;) {
    if (seen.has(key)) throw new Error(`Circular variable alias at ${key}`);
    seen.add(key);
    const value = declarations[key];
    if (value === undefined) throw new Error(`Variable ${key} is not defined`);
    const alias = /^var\((--[\w-]+)\)$/.exec(value);
    if (!alias) return value;
    key = alias[1];
  }
}
