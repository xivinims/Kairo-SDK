import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowUp,
  AudioLines,
  Check,
  ChevronDown,
  Github,
  KeyRound,
  LayoutGrid,
  Menu,
  Mic,
  Paperclip,
  PencilLine,
  Plug,
  Plus,
  Settings,
  Unplug,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import { Markdown } from "./markdown";
import {
  ZenoSidebar,
  type ZenoRecentChat,
  type ZenoSidebarMode,
  type ZenoSidebarSection,
} from "./zeno-home";
import { ZenoWorkspace, type WorkspaceNodeType } from "./zeno-workspace";
import { askZenoAgent, type ZenoMessage } from "@/lib/zeno-agent";
import { detectZenoSkills } from "@/lib/zeno-skills";
import { buildThinkingPreview, streamZenoText } from "@/lib/zeno-stream";
import {
  connectGitHub,
  connectGoogleWorkspace,
  isFirebaseConfigured,
  signInWithGoogle,
  signOutZeno,
  subscribeZenoAuth,
  type ZenoUser,
} from "@/lib/zeno-auth";
import { disconnectConnector, getConnectorState, getConnectorTokens } from "@/lib/zeno-connectors";
import type { ZenoToolEvent } from "@/lib/zeno-tools";

interface UiMessage extends ZenoMessage {
  tools?: ZenoToolEvent[];
}

interface WorkspaceSeed {
  id: number;
  type: WorkspaceNodeType;
  label: string;
}

const TOOL_SKILLS = new Set(["research", "web", "github", "google", "terminal", "files", "automation"]);

const MODEL_OPTIONS = [
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
];

function loadRecentChats(): ZenoRecentChat[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem("zeno.recentChats") ?? "[]") as ZenoRecentChat[];
    return Array.isArray(parsed) ? parsed.slice(0, 30) : [];
  } catch {
    return [];
  }
}

export function ZenoAgentApp() {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [thinkingPreview, setThinkingPreview] = useState("");
  const [error, setError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<ZenoSidebarMode>("chats");
  const [sidebarSection, setSidebarSection] = useState<ZenoSidebarSection>("dashboard");
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [workspaceSeed, setWorkspaceSeed] = useState<WorkspaceSeed | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gemini-2.5-flash");
  const [user, setUser] = useState<ZenoUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [connectorState, setConnectorState] = useState(() => getConnectorState());
  const [connectorBusy, setConnectorBusy] = useState<"google" | "github" | "">("");
  const [recentChats, setRecentChats] = useState<ZenoRecentChat[]>([]);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const activeSkills = useMemo(() => detectZenoSkills(draft), [draft]);
  const currentModel = MODEL_OPTIONS.find((item) => item.id === model) ?? MODEL_OPTIONS[0];

  useEffect(() => {
    setApiKey(localStorage.getItem("zeno.gemini.apiKey") ?? "");
    setModel(localStorage.getItem("zeno.gemini.model") ?? "gemini-2.5-flash");
    setRecentChats(loadRecentChats());

    let stop = () => {};
    void subscribeZenoAuth((nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    })
      .then((unsubscribe) => {
        stop = unsubscribe;
        setAuthReady(true);
      })
      .catch(() => setAuthReady(true));

    return () => stop();
  }, []);

  useEffect(() => {
    if (workspaceOpen) return;
    const node = scrollerRef.current;
    if (node) node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messages, sending, workspaceOpen]);

  function rememberChat(title: string) {
    const next: ZenoRecentChat[] = [
      {
        id: `chat-${Date.now()}`,
        title: title.slice(0, 52),
        group: "Hoje",
      },
      ...recentChats,
    ].slice(0, 30);
    setRecentChats(next);
    localStorage.setItem("zeno.recentChats", JSON.stringify(next));
  }

  function saveApiKey(value: string) {
    setApiKey(value);
    if (value.trim()) localStorage.setItem("zeno.gemini.apiKey", value.trim());
    else localStorage.removeItem("zeno.gemini.apiKey");
  }

  function saveModel(value: string) {
    setModel(value);
    localStorage.setItem("zeno.gemini.model", value);
  }

  async function send(event?: FormEvent) {
    event?.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    if (!messages.length) rememberChat(text);

    const nextMessages: UiMessage[] = [...messages, { role: "user", content: text }];
    const requestMessages = nextMessages.map(({ role, content }) => ({ role, content }));
    const requestSkills = detectZenoSkills(text);
    const needsAgentTools = requestSkills.some((skill) => TOOL_SKILLS.has(skill));

    setMessages(nextMessages);
    setDraft("");
    setError("");
    setThinkingPreview("…");
    setSending(true);
    setWorkspaceOpen(false);

    try {
      const canStreamText =
        import.meta.env.MODE !== "desktop" &&
        Boolean(apiKey.trim()) &&
        !needsAgentTools;

      if (canStreamText) {
        try {
          const answer = await streamZenoText({
            messages: requestMessages,
            apiKey: apiKey.trim(),
            model,
            onText: (partialText) => {
              setThinkingPreview(buildThinkingPreview(partialText));
            },
          });

          setMessages((current) => [
            ...current,
            { role: "assistant", content: answer },
          ]);
          return;
        } catch {
          // Se o streaming do navegador não estiver disponível, volta para o runtime normal do agente.
        }
      }

      const result = await askZenoAgent({
        data: {
          messages: requestMessages,
          contentLevel: "safe",
          apiKey: apiKey.trim() || undefined,
          model,
          connectors: getConnectorTokens(),
        },
      });

      if (result.ok && result.answer) {
        setThinkingPreview(buildThinkingPreview(result.answer));
        await new Promise((resolve) => window.setTimeout(resolve, 180));
        setMessages((current) => [
          ...current,
          { role: "assistant", content: result.answer!, tools: result.tools },
        ]);
      } else {
        setError(result.error ?? "O Zeno não conseguiu responder agora.");
        if ((result.error ?? "").toLowerCase().includes("api key")) setSettingsOpen(true);
      }
    } catch {
      setError("Não foi possível conectar ao Zeno agora.");
    } finally {
      setSending(false);
      setThinkingPreview("");
    }
  }

  function newChat() {
    setMessages([]);
    setDraft("");
    setError("");
    setWorkspaceOpen(false);
    setSidebarSection("dashboard");
    setSidebarMode("chats");
    setMobileSidebar(false);
  }

  function openWorkspace(seed?: { label: string; type: "code" | "image" | "text" | "folder" }) {
    setWorkspaceOpen(true);
    setMobileSidebar(false);
    if (seed && seed.type !== "folder") {
      setWorkspaceSeed({
        id: Date.now(),
        label: seed.label,
        type: seed.type === "image" ? "image" : seed.type === "code" ? "code" : "text",
      });
    }
  }

  function useWorkspaceText(text: string) {
    setDraft((current) => (current.trim() ? `${current}\n\n${text}` : text));
    setWorkspaceOpen(false);
  }

  async function handleGoogleLogin() {
    try {
      setError("");
      await signInWithGoogle();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível entrar com Google.");
    }
  }

  async function handleConnector(id: "google" | "github") {
    try {
      setConnectorBusy(id);
      setError("");
      if (id === "google") await connectGoogleWorkspace();
      else await connectGitHub();
      setConnectorState(getConnectorState());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível conectar.");
    } finally {
      setConnectorBusy("");
    }
  }

  function disconnect(id: "google" | "github") {
    disconnectConnector(id);
    setConnectorState(getConnectorState());
  }

  return (
    <div className="zeno-app">
      <div className="desktop-sidebar">
        <ZenoSidebar
          recent={recentChats}
          mode={sidebarMode}
          section={sidebarSection}
          onModeChange={setSidebarMode}
          onSectionChange={setSidebarSection}
          onOpenWorkspace={() => openWorkspace()}
          onPickFile={openWorkspace}
          onSettings={() => setSettingsOpen(true)}
        />
      </div>

      {mobileSidebar && (
        <div className="mobile-sidebar-layer">
          <button className="mobile-sidebar-backdrop" onClick={() => setMobileSidebar(false)} aria-label="Fechar menu" />
          <ZenoSidebar
            recent={recentChats}
            mode={sidebarMode}
            section={sidebarSection}
            onModeChange={setSidebarMode}
            onSectionChange={setSidebarSection}
            onOpenWorkspace={() => openWorkspace()}
            onPickFile={openWorkspace}
            onSettings={() => {
              setMobileSidebar(false);
              setSettingsOpen(true);
            }}
            onClose={() => setMobileSidebar(false)}
          />
        </div>
      )}

      <section className="zeno-main">
        <div className="zeno-background-glow" />

        <header className="zeno-topbar">
          <button type="button" className="topbar-menu-button" onClick={() => setMobileSidebar(true)} aria-label="Abrir menu">
            <Menu size={20} />
          </button>

          <strong className="topbar-brand">Zeno</strong>

          <button type="button" className="model-button" onClick={() => setSettingsOpen(true)}>
            <span>{currentModel.label}</span>
            <ChevronDown size={15} />
          </button>

          <div className="topbar-spacer" />

          <button type="button" className="topbar-action" onClick={newChat} aria-label="Nova conversa" title="Nova conversa">
            <PencilLine size={20} />
          </button>

          <button
            type="button"
            className={workspaceOpen ? "topbar-action is-active" : "topbar-action"}
            onClick={() => setWorkspaceOpen((current) => !current)}
            aria-label="Workspace"
            title="Workspace"
          >
            <LayoutGrid size={19} />
          </button>

          {authReady && user ? (
            <button type="button" className="avatar-button" onClick={() => setSettingsOpen(true)} title={user.email ?? "Conta Google"}>
              {user.photoURL ? <img src={user.photoURL} alt="" /> : <UserRound size={18} />}
            </button>
          ) : (
            <button
              type="button"
              className="avatar-button avatar-letter"
              onClick={handleGoogleLogin}
              disabled={!authReady || !isFirebaseConfigured()}
              title="Entrar com Google"
            >
              M
            </button>
          )}
        </header>

        {workspaceOpen ? (
          <div className="workspace-shell">
            <ZenoWorkspace
              key={workspaceSeed?.id ?? "workspace"}
              initialNode={workspaceSeed ? { type: workspaceSeed.type, title: workspaceSeed.label } : undefined}
              onClose={() => setWorkspaceOpen(false)}
              onUseInChat={useWorkspaceText}
            />
          </div>
        ) : (
          <div className="zeno-scroll no-scrollbar" ref={scrollerRef}>
            {messages.length === 0 ? (
              <div className="zeno-welcome">
                <div className="gemini-star" aria-hidden="true" />
                <h1>Por onde<br />começamos?</h1>
              </div>
            ) : (
              <div className="message-list">
                {messages.map((message, index) => (
                  <article key={index} className={message.role === "user" ? "message-row user" : "message-row assistant"}>
                    {message.role === "assistant" && <div className="assistant-star" />}
                    <div className={message.role === "user" ? "user-bubble" : "assistant-body"}>
                      {message.role === "assistant" && message.tools?.length ? (
                        <div className="tool-events">
                          {message.tools.map((tool, toolIndex) => (
                            <div key={`${tool.name}-${toolIndex}`} className={tool.ok ? "tool-event" : "tool-event failed"}>
                              <Wrench size={13} />
                              <span>{tool.label}</span>
                              {tool.detail && <small>{tool.detail}</small>}
                              {tool.ok ? <Check size={13} /> : <X size={13} />}
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {message.role === "user" ? (
                        <p>{message.content}</p>
                      ) : (
                        <Markdown text={message.content} className="zeno-markdown" />
                      )}
                    </div>
                  </article>
                ))}

                {sending && (
                  <div className="thinking-text-row" aria-live="polite">
                    <span className="thinking-text-preview">{thinkingPreview || "…"}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!workspaceOpen && (
          <div className="composer-zone">
            {error && <div className="zeno-error">{error}</div>}
            <form onSubmit={send} className="zeno-composer">
              <button
                type="button"
                className="composer-plus"
                onClick={() => {
                  setSidebarMode("files");
                  if (typeof window !== "undefined" && window.innerWidth <= 900) {
                    setMobileSidebar(true);
                  }
                }}
                aria-label="Adicionar"
              >
                <Plus size={24} />
              </button>

              <textarea
                value={draft}
                disabled={sending}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void send();
                  }
                }}
                rows={1}
                placeholder="Peça ao Zeno..."
              />

              <button type="button" className="composer-mic" aria-label="Microfone">
                <Mic size={20} />
              </button>

              <button
                type="submit"
                className="composer-primary"
                disabled={sending || (!draft.trim() && !messages.length)}
                aria-label={draft.trim() ? "Enviar" : "Voz"}
              >
                {draft.trim() ? <ArrowUp size={21} /> : <AudioLines size={22} />}
              </button>
            </form>

            <div className="composer-quick-tools">
              <button type="button" onClick={() => setSettingsOpen(true)}>
                <Wrench size={13} />
                {activeSkills.length > 1 ? `${activeSkills.length} skills` : "Ferramentas"}
              </button>
              <button type="button" onClick={() => openWorkspace()}>
                <LayoutGrid size={13} />
                Workspace
              </button>
              <button type="button" onClick={() => setSidebarMode("files")}>
                <Paperclip size={13} />
                Arquivos
              </button>
            </div>
          </div>
        )}
      </section>

      {settingsOpen && (
        <div className="settings-layer">
          <button className="settings-backdrop" onClick={() => setSettingsOpen(false)} aria-label="Fechar configurações" />
          <aside className="settings-panel">
            <div className="settings-head">
              <div>
                <h2>Configurações</h2>
                <p>Modelo, conta, conectores e ferramentas.</p>
              </div>
              <button type="button" className="settings-close" onClick={() => setSettingsOpen(false)} aria-label="Fechar">
                <X size={19} />
              </button>
            </div>

            <section className="settings-section">
              <div className="settings-title"><KeyRound size={16} /> Gemini</div>
              <label>
                <span>API key</span>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(event) => saveApiKey(event.target.value)}
                  placeholder="AIza..."
                  autoComplete="off"
                />
              </label>
              <label>
                <span>Modelo</span>
                <select value={model} onChange={(event) => saveModel(event.target.value)}>
                  {MODEL_OPTIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </label>
              <p className="settings-help">
                A chave fica no navegador e é enviada ao backend apenas quando o Zeno usa o Gemini.
              </p>
            </section>

            <section className="settings-section">
              <div className="settings-title"><UserRound size={16} /> Conta</div>
              {user ? (
                <div className="account-card">
                  {user.photoURL ? <img src={user.photoURL} alt="" /> : <div className="account-placeholder"><UserRound size={18} /></div>}
                  <div>
                    <strong>{user.displayName ?? "Conta Google"}</strong>
                    <span>{user.email}</span>
                  </div>
                  <button type="button" onClick={() => void signOutZeno().then(() => setUser(null))}>Sair</button>
                </div>
              ) : (
                <button type="button" className="settings-action" onClick={handleGoogleLogin} disabled={!isFirebaseConfigured()}>
                  Entrar com Google
                </button>
              )}
              {!isFirebaseConfigured() && (
                <p className="settings-help">Configure VITE_FIREBASE_* para ativar o Google Auth.</p>
              )}
            </section>

            <section className="settings-section">
              <div className="settings-title"><Plug size={16} /> Conectores</div>

              <div className="connector-card">
                <div className="connector-icon google">G</div>
                <div className="connector-copy">
                  <strong>Google Drive</strong>
                  <span>Pesquisa e leitura de arquivos quando você pedir.</span>
                </div>
                {connectorState.google ? (
                  <button type="button" className="disconnect-button" onClick={() => disconnect("google")}><Unplug size={14} /> Desconectar</button>
                ) : (
                  <button type="button" onClick={() => void handleConnector("google")} disabled={!user || connectorBusy === "google"}>
                    {connectorBusy === "google" ? "Conectando…" : "Conectar"}
                  </button>
                )}
              </div>

              <div className="connector-card">
                <div className="connector-icon"><Github size={18} /></div>
                <div className="connector-copy">
                  <strong>GitHub</strong>
                  <span>Pesquisa código e lê arquivos dos repositórios autorizados.</span>
                </div>
                {connectorState.github ? (
                  <button type="button" className="disconnect-button" onClick={() => disconnect("github")}><Unplug size={14} /> Desconectar</button>
                ) : (
                  <button type="button" onClick={() => void handleConnector("github")} disabled={!user || connectorBusy === "github"}>
                    {connectorBusy === "github" ? "Conectando…" : "Conectar"}
                  </button>
                )}
              </div>
            </section>

            <section className="settings-section compact">
              <div className="settings-title"><Settings size={16} /> Agente</div>
              <div className="capability-list">
                <span><Check size={14} /> Pesquisa web</span>
                <span><Check size={14} /> Skills automáticas</span>
                <span><Check size={14} /> Loop de ferramentas</span>
                <span><Check size={14} /> Workspace visual movível</span>
                <span><Check size={14} /> Terminal restrito no desktop</span>
                <span><Check size={14} /> GitHub + Google Drive</span>
              </div>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
