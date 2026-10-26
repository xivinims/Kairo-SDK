export interface SubtitleCue {
  id: string;
  index: number;
  startMs: number;
  endMs: number;
  source: string;
  ptBR: string;
  speaker?: string;
}

export interface SubtitleQaIssue {
  cueId: string;
  severity: "erro" | "aviso";
  message: string;
}

function parseTimestamp(value: string) {
  const match = value.trim().match(/(\d{1,2}):(\d{2}):(\d{2})[,.](\d{3})/);
  if (!match) return 0;
  const [, h, m, s, ms] = match;
  return (((Number(h) * 60 + Number(m)) * 60 + Number(s)) * 1000) + Number(ms);
}

function formatTimestamp(ms: number, separator = ",") {
  const safe = Math.max(0, Math.floor(ms));
  const hours = Math.floor(safe / 3_600_000);
  const minutes = Math.floor((safe % 3_600_000) / 60_000);
  const seconds = Math.floor((safe % 60_000) / 1000);
  const millis = safe % 1000;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, "0")).join(":")
    + separator + String(millis).padStart(3, "0");
}

export function parseSrt(input: string): SubtitleCue[] {
  const blocks = input.replace(/^\uFEFF/, "").trim().split(/\r?\n\r?\n+/);
  const cues: SubtitleCue[] = [];
  for (const block of blocks) {
    const lines = block.split(/\r?\n/);
    let cursor = 0;
    let index = Number(lines[0]);
    if (Number.isFinite(index)) cursor = 1;
    else index = cues.length + 1;

    const timing = lines[cursor]?.match(/(.+?)\s*-->\s*(.+)/);
    if (!timing) continue;
    cursor++;
    const source = lines.slice(cursor).join("\n").trim();
    cues.push({
      id: `srt-${index}`,
      index,
      startMs: parseTimestamp(timing[1]),
      endMs: parseTimestamp(timing[2]),
      source,
      ptBR: "",
    });
  }
  return cues;
}

export function parseVtt(input: string): SubtitleCue[] {
  const content = input.replace(/^\uFEFF/, "").replace(/^WEBVTT[^\n]*\r?\n/i, "").trim();
  const blocks = content.split(/\r?\n\r?\n+/);
  const cues: SubtitleCue[] = [];
  for (const block of blocks) {
    const lines = block.split(/\r?\n/);
    let cursor = 0;
    let id = "";
    if (!lines[0]?.includes("-->")) {
      id = lines[0] ?? "";
      cursor = 1;
    }
    const timing = lines[cursor]?.match(/(.+?)\s*-->\s*([^\s]+)(?:\s+.*)?/);
    if (!timing) continue;
    cursor++;
    const index = cues.length + 1;
    cues.push({
      id: id || `vtt-${index}`,
      index,
      startMs: parseTimestamp(timing[1]),
      endMs: parseTimestamp(timing[2]),
      source: lines.slice(cursor).join("\n").trim(),
      ptBR: "",
    });
  }
  return cues;
}

export function exportSrt(cues: SubtitleCue[]) {
  return cues.map((cue, i) => [
    i + 1,
    `${formatTimestamp(cue.startMs)} --> ${formatTimestamp(cue.endMs)}`,
    cue.ptBR.trim() || cue.source,
  ].join("\r\n")).join("\r\n\r\n");
}

export function exportVtt(cues: SubtitleCue[]) {
  return "WEBVTT\n\n" + cues.map((cue) => [
    cue.id,
    `${formatTimestamp(cue.startMs, ".")} --> ${formatTimestamp(cue.endMs, ".")}`,
    cue.ptBR.trim() || cue.source,
  ].join("\n")).join("\n\n");
}

export function cueDurationSeconds(cue: SubtitleCue) {
  return Math.max(0.1, (cue.endMs - cue.startMs) / 1000);
}

export function charactersPerSecond(cue: SubtitleCue, useTarget = true) {
  const text = (useTarget ? cue.ptBR : cue.source).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  return text.length / cueDurationSeconds(cue);
}

export function runSubtitleQa(cues: SubtitleCue[]): SubtitleQaIssue[] {
  const issues: SubtitleQaIssue[] = [];
  for (let index = 0; index < cues.length; index++) {
    const cue = cues[index];
    const text = cue.ptBR.trim();
    if (!text) {
      issues.push({ cueId: cue.id, severity: "aviso", message: "Legenda ainda não traduzida." });
      continue;
    }
    const cps = charactersPerSecond(cue);
    if (cps > 22) issues.push({ cueId: cue.id, severity: "erro", message: `Leitura muito rápida: ${cps.toFixed(1)} caracteres/s.` });
    else if (cps > 18) issues.push({ cueId: cue.id, severity: "aviso", message: `Leitura rápida: ${cps.toFixed(1)} caracteres/s.` });

    const lines = text.split("\n");
    if (lines.length > 2) issues.push({ cueId: cue.id, severity: "aviso", message: "Mais de duas linhas." });
    if (lines.some((line) => line.length > 48)) issues.push({ cueId: cue.id, severity: "aviso", message: "Linha acima de 48 caracteres." });
    if (cue.endMs <= cue.startMs) issues.push({ cueId: cue.id, severity: "erro", message: "Tempo final inválido." });

    const next = cues[index + 1];
    if (next && cue.endMs > next.startMs) {
      issues.push({ cueId: cue.id, severity: "erro", message: "Sobreposição com a próxima legenda." });
    }
  }
  return issues;
}
