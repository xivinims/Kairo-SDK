import { cn } from "@/lib/utils";

const amp = String.fromCharCode(38);
const ENT: Record<string, string> = {
  "&": `${amp}amp;`,
  "<": `${amp}lt;`,
  ">": `${amp}gt;`,
  '"': `${amp}quot;`,
};

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (ch) => ENT[ch] ?? ch);
}

function inline(text: string) {
  let s = escapeHtml(text);
  s = s.replace(
    /`([^`]+)`/g,
    '<code class="md-inline">$1</code>',
  );
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  s = s.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer" class="md-link">$1</a>',
  );
  return s;
}

function renderBlock(src: string) {
  const lines = src.replace(/\r/g, "").split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }
    if (/^[-*]{3,}$/.test(line.trim())) {
      out.push('<hr class="md-hr" />');
      i += 1;
      continue;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      const n = h[1].length;
      out.push(`<h${n} class="md-h${n}">${inline(h[2])}</h${n}>`);
      i += 1;
      continue;
    }
    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items: string[] = [];
      while (
        i < lines.length &&
        (ordered ? /^\s*\d+\.\s+/.test(lines[i]) : /^\s*[-*]\s+/.test(lines[i]))
      ) {
        items.push(
          `<li>${inline(lines[i].replace(/^\s*(?:[-*]|\d+\.)\s+/, ""))}</li>`,
        );
        i += 1;
      }
      out.push(
        ordered
          ? `<ol class="md-ol">${items.join("")}</ol>`
          : `<ul class="md-ul">${items.join("")}</ul>`,
      );
      continue;
    }
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^#{1,3}\s/.test(lines[i]) &&
      !/^```/.test(lines[i])
    ) {
      if (/^\s*[-*]\s+/.test(lines[i]) || /^\s*\d+\.\s+/.test(lines[i])) break;
      para.push(lines[i]);
      i += 1;
    }
    out.push(`<p class="md-p">${inline(para.join(" "))}</p>`);
  }
  return out.join("");
}

export function Markdown({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const parts: { type: "code" | "md"; lang?: string; body: string }[] = [];
  const re = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) {
      parts.push({ type: "md", body: text.slice(last, m.index) });
    }
    parts.push({
      type: "code",
      lang: m[1] || "",
      body: m[2].replace(/\n$/, ""),
    });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ type: "md", body: text.slice(last) });

  return (
    <div className={cn("md-body", className)}>
      {parts.map((p, i) =>
        p.type === "code" ? (
          <pre key={i} className="md-pre">
            {p.lang ? <span className="md-lang">{p.lang}</span> : null}
            <code>{p.body}</code>
          </pre>
        ) : (
          <div
            key={i}
            dangerouslySetInnerHTML={{ __html: renderBlock(p.body) }}
          />
        ),
      )}
    </div>
  );
}
