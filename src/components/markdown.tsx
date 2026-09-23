import { Check, Clipboard, Download, ExternalLink } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const amp = String.fromCharCode(38);
const ENT: Record<string, string> = {
  "&": `${amp}amp;`,
  "<": `${amp}lt;`,
  ">": `${amp}gt;`,
  '"': `${amp}quot;`,
};

function escapeHtml(s: string) {
  return s.replace(/[&<>\"]/g, (ch) => ENT[ch] ?? ch);
}

function inline(text: string) {
  let s = escapeHtml(text);
  s = s.replace(/`([^`]+)`/g, '<code class="md-inline">$1</code>');
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
        items.push(`<li>${inline(lines[i].replace(/^\s*(?:[-*]|\d+\.)\s+/, ""))}</li>`);
        i += 1;
      }
      out.push(ordered ? `<ol class="md-ol">${items.join("")}</ol>` : `<ul class="md-ul">${items.join("")}</ul>`);
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

function CodeBlock({ body, lang }: { body: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(body);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function download() {
    const extension = lang.toLowerCase() === "typescript" ? "ts" : lang.toLowerCase() || "txt";
    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `kairo-snippet.${extension}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function share() {
    if (navigator.share) {
      await navigator.share({ title: "Código criado pelo Kairo", text: body });
    } else {
      await copy();
    }
  }

  return (
    <div className="group relative my-3 overflow-hidden rounded-2xl border border-white/10 bg-black/35 shadow-inner shadow-black/20">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.045] px-3 py-2">
        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/45">{lang || "texto"}</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => void copy()} className="code-action" title="Copiar código">
            {copied ? <Check className="size-3.5 text-emerald-300" /> : <Clipboard className="size-3.5" />}
            <span>{copied ? "copiado" : "copiar"}</span>
          </button>
          <button type="button" onClick={download} className="code-action" title="Baixar código">
            <Download className="size-3.5" /><span>baixar</span>
          </button>
          <button type="button" onClick={() => void share()} className="code-action" title="Compartilhar código">
            <ExternalLink className="size-3.5" /><span>compartilhar</span>
          </button>
        </div>
      </div>
      <pre className="md-pre !my-0 !rounded-none !border-0 !bg-transparent px-4 py-3"><code>{body}</code></pre>
    </div>
  );
}

export function Markdown({ text, className }: { text: string; className?: string }) {
  const parts: { type: "code" | "md"; lang?: string; body: string }[] = [];
  const re = /```([a-zA-Z0-9_+-]*)\n?([\s\S]*?)```/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ type: "md", body: text.slice(last, m.index) });
    parts.push({ type: "code", lang: m[1] || "", body: m[2].replace(/\n$/, "") });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ type: "md", body: text.slice(last) });

  return (
    <div className={cn("md-body", className)}>
      {parts.map((part, index) =>
        part.type === "code" ? <CodeBlock key={index} lang={part.lang || ""} body={part.body} /> : (
          <div key={index} dangerouslySetInnerHTML={{ __html: renderBlock(part.body) }} />
        ),
      )}
    </div>
  );
}
