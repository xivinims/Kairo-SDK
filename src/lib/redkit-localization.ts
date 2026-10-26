import type { LocalizationRow } from "./gamehub";

export interface CsvTable {
  headers: string[];
  records: string[][];
  delimiter: string;
}

function detectDelimiter(firstLine: string) {
  const candidates = [",", ";", "\t"];
  let best = ",";
  let score = -1;
  for (const delimiter of candidates) {
    const count = firstLine.split(delimiter).length;
    if (count > score) {
      best = delimiter;
      score = count;
    }
  }
  return best;
}

export function parseCsv(input: string): CsvTable {
  const normalized = input.replace(/^\uFEFF/, "");
  const firstLine = normalized.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = detectDelimiter(firstLine);
  const records: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    if (quoted) {
      if (char === '"') {
        if (normalized[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      records.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ""));
    records.push(row);
  }

  const headers = records.shift() ?? [];
  return { headers, records, delimiter };
}

function normalizedHeader(value: string) {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function findColumn(headers: string[], names: string[]) {
  const wanted = new Set(names.map(normalizedHeader));
  return headers.findIndex((header) => wanted.has(normalizedHeader(header)));
}

export function parseRedkitLocalizationCsv(input: string): {
  table: CsvTable;
  rows: LocalizationRow[];
  textColumn: number;
  keyColumn: number;
  categoryColumn: number;
} {
  const table = parseCsv(input);
  const textColumn = findColumn(table.headers, ["value", "text", "string", "localized string", "localizedstring"]);
  const keyColumn = findColumn(table.headers, ["key", "string key", "stringkey", "name"]);
  const categoryColumn = findColumn(table.headers, ["category", "group", "type"]);

  if (textColumn < 0) {
    throw new Error("Não encontrei a coluna de texto no CSV.");
  }

  const rows: LocalizationRow[] = table.records
    .map((record, index) => {
      const source = record[textColumn] ?? "";
      const key = keyColumn >= 0 ? record[keyColumn] : "";
      const category = categoryColumn >= 0 ? record[categoryColumn] : "";
      return {
        id: key || `redkit-row-${index + 1}`,
        source,
        ptBR: "",
        context: [category, key].filter(Boolean).join(" / ") || `Linha ${index + 2}`,
      };
    })
    .filter((row) => row.source.trim());

  return { table, rows, textColumn, keyColumn, categoryColumn };
}

function quoteCsv(value: string, delimiter: string) {
  const needsQuotes = value.includes(delimiter) || /["\r\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export function stringifyCsv(table: CsvTable) {
  const lines = [
    table.headers.map((value) => quoteCsv(value, table.delimiter)).join(table.delimiter),
    ...table.records.map((record) => record.map((value) => quoteCsv(value ?? "", table.delimiter)).join(table.delimiter)),
  ];
  return lines.join("\r\n");
}

export function buildLocalizedRedkitCsv(
  sourceCsv: string,
  rows: LocalizationRow[],
) {
  const parsed = parseRedkitLocalizationCsv(sourceCsv);
  const byId = new Map(rows.filter((row) => row.ptBR.trim()).map((row) => [row.id, row.ptBR] as const));

  parsed.table.records = parsed.table.records.map((record, index) => {
    const next = [...record];
    const key = parsed.keyColumn >= 0 ? record[parsed.keyColumn] : "";
    const id = key || `redkit-row-${index + 1}`;
    const translated = byId.get(id);
    if (translated) next[parsed.textColumn] = translated;
    return next;
  });

  return stringifyCsv(parsed.table);
}

export interface QaIssue {
  rowId: string;
  severity: "erro" | "aviso";
  message: string;
}

export function runLocalizationQa(rows: LocalizationRow[]): QaIssue[] {
  const issues: QaIssue[] = [];

  for (const row of rows) {
    const source = row.source.trim();
    const target = row.ptBR.trim();
    if (!target) {
      issues.push({ rowId: row.id, severity: "aviso", message: "Sem tradução." });
      continue;
    }
    if (source === target && /[A-Za-z]/.test(source)) {
      issues.push({ rowId: row.id, severity: "aviso", message: "Tradução idêntica ao inglês." });
    }

    const sourceTokens = source.match(/\{[^{}]+\}|%\w+|<[^<>]+>|\\[A-Za-z]+\[[^\]]*\]/g) ?? [];
    const missing = sourceTokens.filter((token) => !target.includes(token));
    if (missing.length) {
      issues.push({
        rowId: row.id,
        severity: "erro",
        message: `Tokens ausentes: ${missing.join(", ")}`,
      });
    }

    const sourceQuotes = (source.match(/"/g) ?? []).length;
    const targetQuotes = (target.match(/"/g) ?? []).length;
    if (sourceQuotes % 2 === 0 && targetQuotes % 2 !== 0) {
      issues.push({ rowId: row.id, severity: "erro", message: "Aspas desbalanceadas." });
    }
  }

  return issues;
}

export function buildTranslationBatches(rows: LocalizationRow[], batchSize = 120) {
  const cleanSize = Math.max(10, Math.min(500, Math.floor(batchSize)));
  const pending = rows.filter((row) => !row.ptBR.trim());
  const batches: Array<Array<{ id: string; source: string; context?: string }>> = [];
  for (let index = 0; index < pending.length; index += cleanSize) {
    batches.push(
      pending.slice(index, index + cleanSize).map((row) => ({
        id: row.id,
        source: row.source,
        context: row.context,
      })),
    );
  }
  return batches;
}
