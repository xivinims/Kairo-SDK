export interface ZenoConnectorTokens {
  github?: string;
  google?: string;
}

export interface ZenoToolEvent {
  name: string;
  label: string;
  ok: boolean;
  detail?: string;
}

export const ZENO_TOOL_DECLARATIONS = [
  {
    name: "connector_status",
    description: "Verifica quais conectores do usuário estão disponíveis nesta conversa.",
    parameters: { type: "OBJECT", properties: {} },
  },
  {
    name: "github_read_file",
    description: "Lê um arquivo de um repositório GitHub que o usuário conectou.",
    parameters: {
      type: "OBJECT",
      properties: {
        owner: { type: "STRING" },
        repo: { type: "STRING" },
        path: { type: "STRING" },
        ref: { type: "STRING", description: "Branch, tag ou commit opcional." },
      },
      required: ["owner", "repo", "path"],
    },
  },
  {
    name: "github_search_code",
    description: "Pesquisa código dentro de um repositório GitHub conectado.",
    parameters: {
      type: "OBJECT",
      properties: {
        owner: { type: "STRING" },
        repo: { type: "STRING" },
        query: { type: "STRING" },
      },
      required: ["owner", "repo", "query"],
    },
  },
  {
    name: "google_drive_search",
    description: "Pesquisa arquivos no Google Drive conectado do usuário.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "Texto para procurar no nome ou conteúdo dos arquivos." },
      },
      required: ["query"],
    },
  },
  {
    name: "google_drive_read_text",
    description: "Lê texto de um arquivo do Google Drive conectado. Funciona melhor com Google Docs e arquivos de texto.",
    parameters: {
      type: "OBJECT",
      properties: {
        fileId: { type: "STRING" },
        mimeType: { type: "STRING" },
      },
      required: ["fileId", "mimeType"],
    },
  },
] as const;

function safeSegment(value: unknown, label: string) {
  const text = String(value ?? "").trim();
  if (!text || !/^[a-zA-Z0-9_.-]+$/.test(text)) throw new Error(`${label} inválido.`);
  return text;
}

function safePath(value: unknown) {
  const path = String(value ?? "").trim().replace(/^\/+/, "");
  if (!path || path.includes("..")) throw new Error("Caminho inválido.");
  return path;
}

function truncate(text: string, max = 80000) {
  return text.length > max ? `${text.slice(0, max)}\n\n[conteúdo truncado]` : text;
}

async function githubJson(url: string, token: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`GitHub HTTP ${response.status}`);
  return response.json();
}

async function executeGithubReadFile(args: Record<string, unknown>, token: string) {
  const owner = safeSegment(args.owner, "owner");
  const repo = safeSegment(args.repo, "repo");
  const path = safePath(args.path);
  const ref = args.ref ? `?ref=${encodeURIComponent(String(args.ref))}` : "";
  const body = await githubJson(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path.split("/").map(encodeURIComponent).join("/")}${ref}`,
    token,
  ) as { type?: string; encoding?: string; content?: string; html_url?: string };

  if (body.type !== "file" || body.encoding !== "base64" || !body.content) {
    throw new Error("O caminho não retornou um arquivo de texto legível.");
  }
  const text = Buffer.from(body.content.replace(/\n/g, ""), "base64").toString("utf8");
  return { path, url: body.html_url, content: truncate(text) };
}

async function executeGithubSearch(args: Record<string, unknown>, token: string) {
  const owner = safeSegment(args.owner, "owner");
  const repo = safeSegment(args.repo, "repo");
  const query = String(args.query ?? "").trim();
  if (!query) throw new Error("Consulta vazia.");
  const q = encodeURIComponent(`${query} repo:${owner}/${repo}`);
  const body = await githubJson(`https://api.github.com/search/code?q=${q}&per_page=12`, token) as {
    items?: Array<{ name?: string; path?: string; html_url?: string }>;
  };
  return {
    results: (body.items ?? []).map((item) => ({
      name: item.name,
      path: item.path,
      url: item.html_url,
    })),
  };
}

async function googleFetch(url: string, token: string) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`Google HTTP ${response.status}`);
  return response;
}

async function executeGoogleDriveSearch(args: Record<string, unknown>, token: string) {
  const query = String(args.query ?? "").trim().replace(/'/g, "\\'");
  if (!query) throw new Error("Consulta vazia.");
  const q = encodeURIComponent(`trashed = false and (name contains '${query}' or fullText contains '${query}')`);
  const fields = encodeURIComponent("files(id,name,mimeType,modifiedTime,webViewLink,owners(displayName))");
  const response = await googleFetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&pageSize=15&orderBy=modifiedTime%20desc&fields=${fields}`,
    token,
  );
  return response.json();
}

async function executeGoogleDriveReadText(args: Record<string, unknown>, token: string) {
  const fileId = safeSegment(args.fileId, "fileId");
  const mimeType = String(args.mimeType ?? "");
  const url = mimeType === "application/vnd.google-apps.document"
    ? `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text%2Fplain`
    : `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const response = await googleFetch(url, token);
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text") && !mimeType.startsWith("text/")) {
    throw new Error("Esse arquivo não pode ser lido como texto por esta ferramenta.");
  }
  return { fileId, content: truncate(await response.text()) };
}

export async function executeZenoTool(
  name: string,
  args: Record<string, unknown>,
  tokens: ZenoConnectorTokens,
): Promise<{ response: unknown; event: ZenoToolEvent }> {
  try {
    if (name === "connector_status") {
      const response = { github: Boolean(tokens.github), google: Boolean(tokens.google), desktopTerminal: false };
      return { response, event: { name, label: "Conectores", ok: true, detail: "Status verificado" } };
    }
    if (name === "github_read_file") {
      if (!tokens.github) throw new Error("GitHub não está conectado.");
      const response = await executeGithubReadFile(args, tokens.github);
      return { response, event: { name, label: "GitHub", ok: true, detail: `Arquivo lido: ${String(args.path)}` } };
    }
    if (name === "github_search_code") {
      if (!tokens.github) throw new Error("GitHub não está conectado.");
      const response = await executeGithubSearch(args, tokens.github);
      return { response, event: { name, label: "GitHub", ok: true, detail: "Pesquisa de código concluída" } };
    }
    if (name === "google_drive_search") {
      if (!tokens.google) throw new Error("Google Drive não está conectado.");
      const response = await executeGoogleDriveSearch(args, tokens.google);
      return { response, event: { name, label: "Google Drive", ok: true, detail: "Pesquisa concluída" } };
    }
    if (name === "google_drive_read_text") {
      if (!tokens.google) throw new Error("Google Drive não está conectado.");
      const response = await executeGoogleDriveReadText(args, tokens.google);
      return { response, event: { name, label: "Google Drive", ok: true, detail: "Arquivo lido" } };
    }
    throw new Error("Ferramenta desconhecida.");
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Falha ao executar ferramenta.";
    return {
      response: { error: detail },
      event: { name, label: name.replaceAll("_", " "), ok: false, detail },
    };
  }
}
