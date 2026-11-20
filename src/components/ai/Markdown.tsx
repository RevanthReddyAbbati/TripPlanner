// Tiny, safe Markdown renderer for model replies. Builds React nodes only (no raw HTML),
// so anything the model writes is rendered as text. Supports paragraphs, headings (as bold
// lines), bullet and numbered lists, **bold**, *italic* and `code`.
import type { ReactNode } from 'react';

type Block =
  | { kind: 'p'; text: string }
  | { kind: 'h'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[]; start: number };

function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  const blocks: Block[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ kind: 'p', text: para.join(' ') });
    para = [];
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
    const numbered = /^\s*(\d+)[.)]\s+(.*)$/.exec(line);
    const heading = /^\s*#{1,6}\s+(.*)$/.exec(line);
    if (!line.trim()) {
      flush();
    } else if (heading) {
      flush();
      blocks.push({ kind: 'h', text: heading[1] });
    } else if (bullet) {
      flush();
      const last = blocks[blocks.length - 1];
      if (last?.kind === 'ul') last.items.push(bullet[1]);
      else blocks.push({ kind: 'ul', items: [bullet[1]] });
    } else if (numbered) {
      flush();
      const last = blocks[blocks.length - 1];
      if (last?.kind === 'ol') last.items.push(numbered[2]);
      else blocks.push({ kind: 'ol', items: [numbered[2]], start: Number(numbered[1]) || 1 });
    } else if (/^\s{2,}\S/.test(raw) && (blocks[blocks.length - 1]?.kind === 'ul' || blocks[blocks.length - 1]?.kind === 'ol') && !para.length) {
      // Continuation line of the previous list item.
      const last = blocks[blocks.length - 1] as Extract<Block, { kind: 'ul' | 'ol' }>;
      last.items[last.items.length - 1] += ' ' + line.trim();
    } else {
      para.push(line.trim());
    }
  }
  flush();
  return blocks;
}

/** Inline formatting: `code`, **bold**, *italic* / _italic_. Everything else is plain text. */
function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(__[^_]+__)|(\*[^*\s][^*]*\*)|(_[^_\s][^_]*_)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const k = `${keyBase}-${i++}`;
    if (tok.startsWith('`')) {
      out.push(
        <code key={k} className="rounded bg-sunken px-1 py-0.5 font-mono text-[12.5px]">
          {tok.slice(1, -1)}
        </code>,
      );
    } else if (tok.startsWith('**') || tok.startsWith('__')) {
      out.push(
        <strong key={k} className="font-semibold">
          {tok.slice(2, -2)}
        </strong>,
      );
    } else {
      out.push(<em key={k}>{tok.slice(1, -1)}</em>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ text }: { text: string }) {
  const blocks = parseBlocks(text);
  return (
    <div className="space-y-2.5 text-[14px] leading-relaxed [overflow-wrap:anywhere]">
      {blocks.map((b, i) => {
        const k = `b${i}`;
        if (b.kind === 'p') return <p key={k}>{inline(b.text, k)}</p>;
        if (b.kind === 'h')
          return (
            <p key={k} className="pt-1 font-semibold text-ink">
              {inline(b.text.replace(/\*\*/g, ''), k)}
            </p>
          );
        if (b.kind === 'ul')
          return (
            <ul key={k} className="list-disc space-y-1 pl-5 marker:text-muted">
              {b.items.map((it, j) => (
                <li key={j}>{inline(it, `${k}-${j}`)}</li>
              ))}
            </ul>
          );
        return (
          <ol key={k} start={b.start} className="list-decimal space-y-1 pl-5 marker:text-muted">
            {b.items.map((it, j) => (
              <li key={j}>{inline(it, `${k}-${j}`)}</li>
            ))}
          </ol>
        );
      })}
    </div>
  );
}

