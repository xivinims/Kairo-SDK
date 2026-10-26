#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function usage() {
  console.log("Kairo AAA Localization CLI");
  console.log("Uso:");
  console.log("  node scripts/kairo-localize.mjs inspect <arquivo>");
  console.log("  node scripts/kairo-localize.mjs batch <arquivo.json> [tamanho]");
  console.log("  node scripts/kairo-localize.mjs merge <projeto.json> <pasta-de-lotes>");
  process.exit(1);
}

const [command, file, sizeArg] = process.argv.slice(2);
if (!command || !file) usage();

const absolute = path.resolve(file);
if (!fs.existsSync(absolute)) {
  console.error("Arquivo não encontrado:", absolute);
  process.exit(2);
}

const text = fs.readFileSync(absolute, "utf8").replace(/^\uFEFF/, "");

if (command === "inspect") {
  const ext = path.extname(absolute).toLowerCase();
  const stats = fs.statSync(absolute);
  console.log(JSON.stringify({
    file: path.basename(absolute),
    extension: ext,
    bytes: stats.size,
    probableFormat: ext === ".csv" ? "REDkit/CSV" : ext === ".json" ? "JSON" : "desconhecido",
    targetLocale: "pt-BR"
  }, null, 2));
  process.exit(0);
}

if (command === "batch") {
  if (path.extname(absolute).toLowerCase() !== ".json") {
    console.error("O comando batch recebe um projeto JSON exportado pelo Kairo.");
    process.exit(3);
  }
  const project = JSON.parse(text);
  const strings = Array.isArray(project.strings) ? project.strings : [];
  const size = Math.max(10, Math.min(500, Number(sizeArg) || 120));
  const pending = strings.filter((row) => !(row.translation || "").trim());
  const outDir = path.resolve(path.dirname(absolute), path.basename(absolute, ".json") + "-batches");
  fs.mkdirSync(outDir, { recursive: true });

  let count = 0;
  for (let i = 0; i < pending.length; i += size) {
    const chunk = pending.slice(i, i + size);
    const out = {
      format: "kairo-translation-batch",
      targetLocale: "pt-BR",
      rules: [
        "Preserve placeholders, tags, ids e códigos exatamente.",
        "Traduza naturalmente para português brasileiro.",
        "Não altere nomes próprios sem glossário explícito.",
        "Retorne a mesma lista de ids com o campo translation preenchido."
      ],
      strings: chunk.map(({ id, source, context }) => ({ id, source, context, translation: "" }))
    };
    count++;
    fs.writeFileSync(path.join(outDir, `batch-${String(count).padStart(4, "0")}.json`), JSON.stringify(out, null, 2));
  }

  console.log(JSON.stringify({ batches: count, pending: pending.length, output: outDir }, null, 2));
  process.exit(0);
}


if (command === "merge") {
  const batchesDir = sizeArg ? path.resolve(sizeArg) : "";
  if (!batchesDir || !fs.existsSync(batchesDir) || !fs.statSync(batchesDir).isDirectory()) {
    console.error("Pasta de lotes não encontrada:", batchesDir || "(vazia)");
    process.exit(4);
  }
  if (path.extname(absolute).toLowerCase() !== ".json") {
    console.error("O projeto principal precisa ser JSON.");
    process.exit(5);
  }

  const project = JSON.parse(text);
  const strings = Array.isArray(project.strings) ? project.strings : [];
  const translated = new Map();

  for (const name of fs.readdirSync(batchesDir).filter((name) => name.endsWith(".json")).sort()) {
    const batchPath = path.join(batchesDir, name);
    const batch = JSON.parse(fs.readFileSync(batchPath, "utf8"));
    for (const row of Array.isArray(batch.strings) ? batch.strings : []) {
      if (row?.id && typeof row.translation === "string" && row.translation.trim()) {
        translated.set(String(row.id), row.translation);
      }
    }
  }

  let applied = 0;
  for (const row of strings) {
    const next = translated.get(String(row.id));
    if (next) {
      row.translation = next;
      applied++;
    }
  }

  const out = path.join(path.dirname(absolute), path.basename(absolute, ".json") + "-merged.json");
  fs.writeFileSync(out, JSON.stringify(project, null, 2));
  console.log(JSON.stringify({ applied, output: out }, null, 2));
  process.exit(0);
}

usage();
