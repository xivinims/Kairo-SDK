import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowUp,
  Check,
  ChevronDown,
  Github,
  KeyRound,
  Menu,
  Paperclip,
  Plug,
  Settings,
  Sparkles,
  Unplug,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import { Markdown } from "./markdown";
import { ZenoSidebar, type ZenoRecentChat } from "./zeno-home";
import { askZenoAgent, type ZenoMessage } from "@/lib/zeno-agent";
import { detectZenoSkills } from "@/lib/zeno-skills";
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

const PLACEHOLDER_RECENT: ZenoRecentChat[] = [];

const MODEL_OPTIONS = [
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
];

const STARTERS = [
  "Analise meu projeto e diga o próximo passo",
  "Pesquise isso na web e traga as fontes",
  "Leia um arquivo do meu GitHub",
  "Encontre um documento no meu Google Drive",
];

export function ZenoAgentApp() {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gemini-2.5-flash");
  const [user, setUser] = useState<ZenoUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [connectorState, setConnectorState] = useState(() => getConnectorState());
  const [connectorBusy, setConnectorBusy] = useState<"google" | "github" | "">("");
  const scrollerRef = useRef<HTMLDivElement>(null);

  const activeSkills = useMemo(() => detectZenoSkills(draft), [draft]);
  const currentModel = MODEL_OPTIONS.find((item) => item.id === model) ?? MODEL_OPTIONS[0];

  useEffect(() => {
    setApiKey(localStorage.getItem("zeno.gemini.apiKey") ?? "");
    setModel(localStorage.getItem("zeno.gemini.model") ?? "gemini-2.5-flash");

    let stop = () => {};
    void subscribeZenoAuth((nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    }).then((unsubscribe) => {
      stop = unsubscribe;
      setAuthReady(true);
    }).catch(() => setAuthReady(true));

    return () => stop();
  }, []);

  useEffect(() => {
    const node = scrollerRef.current;
    if (node) node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

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

    const nextMessages: UiMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setDraft("");
    setError("");
    setSending(true);

    try {
      const result = await askZenoAgent({
        data: {
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
          contentLevel: "safe",
          apiKey: apiKey.trim() || undefined,
          model,
          connectors: getConnectorTokens(),
        },
      });

      if (result.ok && result.answer) {
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
    }
  }

  function newChat() {
    setMessages([]);
    setDraft("");
    setError("");
    setMobileSidebar(false);
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
      <div className="hidden lg:block">
        <ZenoSidebar
          recent={PLACEHOLDER_RECENT}
          onNewChat={newChat}
          onSettings={() => setSettingsOpen(true)}
        />
      </div>

      {mobileSidebar && (
        <div className="mobile-sidebar-layer">
          <button className="mobile-sidebar-backdrop" onClick={() => setMobileSidebar(false)} aria-label="Fechar menu" />
          <ZenoSidebar
            recent={PLACEHOLDER_RECENT}
            onNewChat={newChat}
            onSettings={() => {
              setMobileSidebar(false);
              setSettingsOpen(true);
            }}
            onClose={() => setMobileSidebar(false)}
          />
        </div>
      )}

      <section className="zeno-main">
        <header className="zeno-topbar">
          <button type="button" className="icon-button lg:hidden" onClick={() => setMobileSidebar(true)} aria-label="Abrir menu">
            <Menu size={20} />
          </button>

          <button type="button" className="model-button" onClick={() => setSettingsOpen(true)}>
            <span>{currentModel.label}</span>
            <ChevronDown size={14} />
          </button>

          <div className="topbar-spacer" />

          {authReady && user ? (
            <button type="button" className="avatar-button" onClick={() => setSettingsOpen(true)} title={user.email ?? "Conta Google"}>
              {user.photoURL ? <img src={user.photoURL} alt="" /> : <UserRound size={18} />}
            </button>
          ) : (
            <button
              type="button"
              className="google-login-button"
              onClick={handleGoogleLogin}
              disabled={!authReady || !isFirebaseConfigured()}
            >
              Entrar com Google
            </button>
          )}
        </header>

        <div className="zeno-scroll no-scrollbar" ref={scrollerRef}>
          {messages.length === 0 ? (
            <div className="zeno-welcome">
              <div className="hero-mark"><Sparkles size={25} /></div>
              <h1>Como posso ajudar?</h1>
              <p>
                Zeno usa Gemini, skills e ferramentas reais quando você conecta suas contas.
              </p>
              <div className="starter-grid">
                {STARTERS.map((prompt) => (
                  <button key={prompt} type="button" onClick={() => setDraft(prompt)}>
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="message-list">
              {messages.map((message, index) => (
                <article key={index} className={message.role === "user" ? "message-row user" : "message-row assistant"}>
                  {message.role === "assistant" && <div className="assistant-mark"><Sparkles size={15} /></div>}
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
                <div className="message-row assistant">
                  <div className="assistant-mark is-thinking"><Sparkles size={15} /></div>
                  <div className="thinking-line">
                    <span />
                    <span />
                    <span />
                    Zeno está trabalhando
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="composer-zone">
          {error && <div className="zeno-error">{error}</div>}
          <form onSubmit={send} className="zeno-composer">
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
              placeholder="Peça qualquer coisa ao Zeno"
            />
            <div className="composer-bottom">
              <div className="composer-left">
                <button type="button" className="composer-icon" aria-label="Anexar arquivo" title="Anexos entram na próxima etapa">
                  <Paperclip size={18} />
                </button>
                <button type="button" className="tool-chip" onClick={() => setSettingsOpen(true)}>
                  <Wrench size={14} />
                  {activeSkills.length > 1 ? `${activeSkills.length} skills` : activeSkills[0] === "general" ? "Ferramentas" : activeSkills[0]}
                </button>
              </div>
              <button type="submit" className="send-button" disabled={!draft.trim() || sending} aria-label="Enviar">
                <ArrowUp size={18} />
              </button>
            </div>
          </form>
          <p className="composer-note">Zeno pode errar. Revise informações importantes.</p>
        </div>
      </section>

      {settingsOpen && (
        <div className="settings-layer">
          <button className="settings-backdrop" onClick={() => setSettingsOpen(false)} aria-label="Fechar configurações" />
          <aside className="settings-panel">
            <div className="settings-head">
              <div>
                <h2>Configurações</h2>
                <p>Modelo, conta e ferramentas do Zeno.</p>
              </div>
              <button type="button" className="icon-button" onClick={() => setSettingsOpen(false)} aria-label="Fechar">
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
                A chave fica salva apenas neste navegador e é enviada ao backend do Zeno somente para chamar o Gemini.
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
                <p className="settings-help">Preencha as variáveis VITE_FIREBASE_* para ativar o Google Auth.</p>
              )}
            </section>

            <section className="settings-section">
              <div className="settings-title"><Plug size={16} /> Conectores</div>

              <div className="connector-card">
                <div className="connector-icon google">G</div>
                <div className="connector-copy">
                  <strong>Google Drive</strong>
                  <span>Permite ao Zeno pesquisar e ler seus arquivos quando você pedir.</span>
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
                  <span>Permite pesquisar código e ler arquivos de repositórios autorizados.</span>
                </div>
                {connectorState.github ? (
                  <button type="button" className="disconnect-button" onClick={() => disconnect("github")}><Unplug size={14} /> Desconectar</button>
                ) : (
                  <button type="button" onClick={() => void handleConnector("github")} disabled={!user || connectorBusy === "github"}>
                    {connectorBusy === "github" ? "Conectando…" : "Conectar"}
                  </button>
                )}
              </div>
              <p className="settings-help">
                Os tokens dos conectores ficam somente na sessão do navegador; o Zeno os usa apenas durante a solicitação atual.
              </p>
            </section>

            <section className="settings-section compact">
              <div className="settings-title"><Settings size={16} /> Agente</div>
              <div className="capability-list">
                <span><Check size={14} /> Pesquisa web nativa</span>
                <span><Check size={14} /> Skills automáticas</span>
                <span><Check size={14} /> Loop de ferramentas</span>
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
