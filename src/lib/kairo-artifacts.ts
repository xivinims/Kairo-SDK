import type { Artifact } from "./types";

export interface KairoProjectFile {
  path: string;
  language: string;
  content: string;
}

export interface KairoWebProject {
  id: string;
  name: string;
  createdAt: number;
  conversationId?: string;
  files: KairoProjectFile[];
}

const LANGUAGE_EXTENSIONS: Record<string, string> = {
  html: "html", htm: "html", css: "css", scss: "scss", js: "js", javascript: "js",
  jsx: "jsx", ts: "ts", typescript: "ts", tsx: "tsx", json: "json", py: "py",
  python: "py", md: "md", markdown: "md", sql: "sql", sh: "sh", bash: "sh",
};

export function normalizeArtifactLanguage(language?: string) {
  const normalized = (language || "text").toLowerCase().trim();
  return LANGUAGE_EXTENSIONS[normalized] || normalized.replace(/[^a-z0-9]+/g, "") || "txt";
}

export function artifactToFile(artifact: Artifact, index: number): KairoProjectFile {
  const extension = normalizeArtifactLanguage(artifact.language || (artifact.kind === "html" ? "html" : "txt"));
  const fallback = artifact.kind === "html" ? "index.html" : `file-${index + 1}.${extension}`;
  const title = artifact.title.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  const path = title.includes(".") ? title : fallback;
  return { path, language: extension, content: artifact.content };
}

export function buildWebProject(artifacts: Artifact[], conversationId?: string): KairoWebProject {
  const files = artifacts.map(artifactToFile);
  const hasHtml = files.some((file) => file.language === "html");
  if (!hasHtml && files.length > 0) {
    files.unshift({
      path: "README.md",
      language: "md",
      content: "# Projeto Kairo\n\nArquivos gerados pelo Kairo Agent.\n",
    });
  }
  return {
    id: `kairo-project-${Date.now().toString(36)}`,
    name: "Projeto criado pelo Kairo",
    createdAt: Date.now(),
    conversationId,
    files,
  };
}

export function downloadProject(project: KairoWebProject) {
  for (const file of project.files) {
    const blob = new Blob([file.content], { type: mimeForLanguage(file.language) });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.path.replace(/\//g, "-");
    anchor.click();
    URL.revokeObjectURL(url);
  }
}

export function downloadArtifact(artifact: Artifact) {
  const extension = normalizeArtifactLanguage(artifact.language || artifact.kind);
  const filename = artifact.title.includes(".") ? artifact.title : `${artifact.title || "kairo-artifact"}.${extension}`;
  const blob = new Blob([artifact.content], { type: mimeForLanguage(extension) });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.replace(/[^a-zA-Z0-9._-]+/g, "-");
  anchor.click();
  URL.revokeObjectURL(url);
}

export function mimeForLanguage(language: string) {
  switch (normalizeArtifactLanguage(language)) {
    case "html": return "text/html;charset=utf-8";
    case "css": return "text/css;charset=utf-8";
    case "js": return "text/javascript;charset=utf-8";
    case "json": return "application/json;charset=utf-8";
    case "svg": return "image/svg+xml";
    default: return "text/plain;charset=utf-8";
  }
}

export function extractCodeArtifacts(text: string): Array<{ language: string; content: string }> {
  const found: Array<{ language: string; content: string }> = [];
  const pattern = /```([a-zA-Z0-9_+-]*)\n?([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    const content = match[2].replace(/\n$/, "").trim();
    if (content) found.push({ language: normalizeArtifactLanguage(match[1]), content });
  }
  return found;
}

export function isWebsiteRequest(message: string) {
  return /(crie|criar|faça|fazer|mont(e|ar)|desenvolv).*\b(site|p[aá]gina|landing|website|web app)\b/i.test(message);
}
