#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const target = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
if (!fs.existsSync(target)) {
  console.error("Caminho não encontrado:", target);
  process.exit(2);
}

const signatures = [
  { id: "redkit-csv", test: (p) => /\.csv$/i.test(p), note: "CSV: possível export do REDkit/localização tabular." },
  { id: "json", test: (p) => /\.json$/i.test(p), note: "JSON: importação profunda suportada." },
  { id: "srt", test: (p) => /\.srt$/i.test(p), note: "SRT: legendas suportadas." },
  { id: "vtt", test: (p) => /\.vtt$/i.test(p), note: "WebVTT: legendas suportadas." },
  { id: "po", test: (p) => /\.po$/i.test(p), note: "Gettext PO: suportado." },
  { id: "xliff", test: (p) => /\.(xlf|xliff)$/i.test(p), note: "XLIFF 1.2/2.0: suportado." },
  { id: "renpy", test: (p) => /\.rpy$/i.test(p), note: "Ren'Py detectado; requer adaptador de script." },
  { id: "godot", test: (p) => /\.(tscn|tres|translation)$/i.test(p), note: "Godot detectado." },
  { id: "bethesda", test: (p) => /\.(esm|esp|esl|strings|dlstrings|ilstrings)$/i.test(p), note: "Bethesda/Creation Kit detectado; use export oficial ou adaptador local." },
];

const files = [];
function walk(dir, depth = 0) {
  if (files.length >= 5000 || depth > 8) return;
  const stat = fs.statSync(dir);
  if (stat.isFile()) {
    files.push(dir);
    return;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules",".git","target","dist","build"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, depth + 1);
    else files.push(full);
    if (files.length >= 5000) break;
  }
}
walk(target);

const counts = {};
const notes = new Set();
for (const file of files) {
  for (const signature of signatures) {
    if (signature.test(file)) {
      counts[signature.id] = (counts[signature.id] || 0) + 1;
      notes.add(signature.note);
    }
  }
}

console.log(JSON.stringify({
  path: target,
  scannedFiles: files.length,
  detected: counts,
  recommendations: [...notes],
  next: Object.keys(counts).length
    ? "Importe os formatos suportados no Kairo Production Studio ou exporte dados pela ferramenta oficial do jogo."
    : "Nenhum formato conhecido detectado. Use a ferramenta oficial do jogo para exportar texto/legendas primeiro."
}, null, 2));
