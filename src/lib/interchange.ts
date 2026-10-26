import type { LocalizationRow } from "./gamehub";

function unquotePo(value: string) {
  const match = value.trim().match(/^"(.*)"$/);
  if (!match) return "";
  try {
    return JSON.parse(`"${match[1].replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`);
  } catch {
    return match[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
  }
}

function quotePo(value: string) {
  return JSON.stringify(value);
}

export function parsePo(input: string): LocalizationRow[] {
  const lines = input.replace(/^\uFEFF/, "").split(/\r?\n/);
  const rows: LocalizationRow[] = [];
  let msgid = "";
  let msgstr = "";
  let context = "";
  let mode: "id" | "str" | null = null;
  let index = 0;

  const flush = () => {
    if (msgid) {
      rows.push({
        id: context || `po-${++index}`,
        source: msgid,
        ptBR: msgstr,
        context: context || undefined,
      });
    }
    msgid = "";
    msgstr = "";
    context = "";
    mode = null;
  };

  for (const line of lines) {
    if (!line.trim()) {
      flush();
      continue;
    }
    if (line.startsWith("msgctxt ")) {
      context = unquotePo(line.slice(8));
      continue;
    }
    if (line.startsWith("msgid ")) {
      msgid = unquotePo(line.slice(6));
      mode = "id";
      continue;
    }
    if (line.startsWith("msgstr ")) {
      msgstr = unquotePo(line.slice(7));
      mode = "str";
      continue;
    }
    if (line.trim().startsWith('"')) {
      const part = unquotePo(line);
      if (mode === "id") msgid += part;
      if (mode === "str") msgstr += part;
    }
  }
  flush();
  return rows;
}

export function exportPo(rows: LocalizationRow[], language = "pt_BR") {
  const header = [
    'msgid ""',
    'msgstr ""',
    '"Content-Type: text/plain; charset=UTF-8\\n"',
    `"Language: ${language}\\n"`,
    "",
  ].join("\n");

  return header + rows.map((row) => {
    const parts = [];
    if (row.context) parts.push(`msgctxt ${quotePo(row.context)}`);
    parts.push(`msgid ${quotePo(row.source)}`);
    parts.push(`msgstr ${quotePo(row.ptBR || "")}`);
    return parts.join("\n");
  }).join("\n\n");
}

export interface XliffDocument {
  version: "1.2" | "2.0";
  rows: LocalizationRow[];
}

export function parseXliff(input: string): XliffDocument {
  const parser = new DOMParser();
  const doc = parser.parseFromString(input, "application/xml");
  if (doc.querySelector("parsererror")) throw new Error("XLIFF inválido.");
  const root = doc.documentElement;
  const version = root.getAttribute("version")?.startsWith("2") ? "2.0" : "1.2";
  const rows: LocalizationRow[] = [];

  if (version === "2.0") {
    doc.querySelectorAll("unit").forEach((unit, index) => {
      const segment = unit.querySelector("segment");
      const source = segment?.querySelector("source")?.textContent ?? "";
      const target = segment?.querySelector("target")?.textContent ?? "";
      if (!source) return;
      rows.push({
        id: unit.getAttribute("id") || `xliff2-${index + 1}`,
        source,
        ptBR: target,
        context: unit.getAttribute("name") || undefined,
      });
    });
  } else {
    doc.querySelectorAll("trans-unit").forEach((unit, index) => {
      const source = unit.querySelector("source")?.textContent ?? "";
      const target = unit.querySelector("target")?.textContent ?? "";
      if (!source) return;
      rows.push({
        id: unit.getAttribute("id") || `xliff1-${index + 1}`,
        source,
        ptBR: target,
        context: unit.getAttribute("resname") || undefined,
      });
    });
  }

  return { version, rows };
}

function xmlEscape(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function exportXliff(rows: LocalizationRow[], version: "1.2" | "2.0" = "1.2") {
  if (version === "2.0") {
    const units = rows.map((row) =>
      `    <unit id="${xmlEscape(row.id)}"><segment><source>${xmlEscape(row.source)}</source><target>${xmlEscape(row.ptBR)}</target></segment></unit>`
    ).join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>\n<xliff version="2.0" srcLang="en" trgLang="pt-BR">\n  <file id="kairo">\n${units}\n  </file>\n</xliff>\n`;
  }

  const units = rows.map((row) =>
    `      <trans-unit id="${xmlEscape(row.id)}"><source>${xmlEscape(row.source)}</source><target>${xmlEscape(row.ptBR)}</target></trans-unit>`
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<xliff version="1.2">\n  <file source-language="en" target-language="pt-BR" datatype="plaintext" original="kairo">\n    <body>\n${units}\n    </body>\n  </file>\n</xliff>\n`;
}
