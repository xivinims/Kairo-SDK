import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Pin,
  Search,
  Settings,
  SquarePen,
  User,
} from "lucide-react";
import { AnimatedFace } from "./animated-face";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { loginWithGoogle, logoutFirebase } from "@/lib/firebase";

export function Sidebar() {
  const open = useApp((s) => s.sidebarOpen);
  const setSidebar = useApp((s) => s.setSidebar);
  const conversations = useApp((s) => s.conversations);
  const currentId = useApp((s) => s.currentId);
  const openConversation = useApp((s) => s.openConversation);
  const newChat = useApp((s) => s.newChat);
  const deleteConversation = useApp((s) => s.deleteConversation);
  const renameConversation = useApp((s) => s.renameConversation);
  const pinConversation = useApp((s) => s.pinConversation);
  const openSettings = useApp((s) => s.openSettings);
  const setView = useApp((s) => s.setView);
  const customBots = useApp((s) => s.customBots);
  const openBotEdit = useApp((s) => s.openBotEdit);
  const authUser = useApp((s) => s.authUser);
  const logout = useApp((s) => s.logout);
  const displayName = useApp((s) => s.prefs.profile.displayName);
  const userName = authUser?.name || displayName.trim() || "Usuário";

  const [searchQuery, setSearchQuery] = useState("");
  const [renameModalId, setRenameModalId] = useState<string | null>(null);
  const [renameTitleDraft, setRenameTitleDraft] = useState("");

  const formatChatTime = (timestamp?: number) => {
    if (!timestamp) return "Recente";
    const date = new Date(timestamp);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    const isYesterday =
      now.getDate() - date.getDate() === 1 &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();
    if (isYesterday) return "Ontem";
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const processedConversations = useMemo(() => {
    // Only show chats that have at least 1 message in history
    const validChats = conversations.filter((c) => c.messages && c.messages.length > 0);

    // Sort pinned conversations to the top first, then by updatedAt
    const sorted = [...validChats].sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) {
        return a.pinned ? -1 : 1;
      }
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });

    return sorted.map((c) => ({
      id: c.id,
      title: c.title || "Nova conversa",
      time: formatChatTime(c.updatedAt),
      pinned: Boolean(c.pinned),
      botId: c.botId,
    }));
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return processedConversations;
    const q = searchQuery.toLowerCase();
    return processedConversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [processedConversations, searchQuery]);

  return (
    <>
      {/* Backdrop overlay for mobile */}
      <button
        type="button"
        aria-label="Fechar menu"
        onClick={() => {
          setSidebar(false);
        }}
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden",
          open ? "block" : "hidden",
        )}
      />

      <aside
        className={cn(
          "sidebar-drawer fixed inset-y-0 left-0 z-50 flex w-[min(320px,86vw)] flex-col bg-[#08080c]/95 backdrop-blur-2xl text-white pt-[max(12px,env(safe-area-inset-top))] pb-[max(12px,env(safe-area-inset-bottom))] border-r border-white/10 md:w-[290px]",
          open && "is-open",
        )}
      >
        {/* Top Header: Taller Search bar + Arrow collapse button */}
        <div className="flex items-center gap-2.5 px-3 pb-2 pt-1.5">
          <div className="relative flex flex-1 items-center rounded-full bg-white/[0.07] hover:bg-white/[0.1] focus-within:bg-white/[0.12] px-3.5 h-11 transition-all">
            <Search className="size-4 shrink-0 text-zinc-400 mr-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar..."
              suppressHydrationWarning
              className="w-full bg-transparent text-[14px] text-white placeholder:text-zinc-400 outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setSidebar(false)}
            aria-label="Recolher menu"
            className="press flex size-11 items-center justify-center rounded-full bg-white/[0.07] hover:bg-white/[0.14] text-zinc-300 hover:text-white transition-all shrink-0"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        {/* Scrollable middle area: Bots Button + Separated chat histories */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-3 pt-2 space-y-3">
          {/* Bots button with exact same background color as sidebar */}
          <div>
            <button
              type="button"
              onClick={() => {
                setView("bots");
                setSidebar(false);
              }}
              className="press flex w-full items-center justify-between rounded-full bg-transparent hover:bg-white/[0.06] px-4 py-2.5 text-left transition-all text-zinc-300 hover:text-white group"
            >
              <div className="flex items-center gap-2.5">
                <AnimatedFace size="xs" />
                <span className="text-[15px] font-medium text-zinc-200 group-hover:text-white">
                  Bots
                </span>
              </div>
              <ChevronRight className="size-4.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
            </button>
          </div>

          {/* Unified Chat History (No separated Bot category header, only mascot next to bot chat names) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 pb-1.5">
              <span className="text-[12px] font-semibold text-zinc-400 uppercase tracking-wider">
                Conversas
              </span>
            </div>

            {filteredConversations.length === 0 ? (
              <div className="px-3 py-3 text-center text-[12.5px] text-zinc-600">
                Nenhuma conversa recente
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isActive = c.id === currentId;

                return (
                  <div
                    key={c.id}
                    className={cn(
                      "group relative flex items-center rounded-xl transition-all",
                      isActive
                        ? "bg-white/[0.12] text-white"
                        : "text-zinc-300 hover:bg-white/[0.06] hover:text-white",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        openConversation(c.id);
                        setSidebar(false);
                      }}
                      className="flex-1 min-w-0 px-3 py-2 text-left outline-none"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {/* If it's a bot chat, show mascot before name */}
                        {c.botId && (
                          <AnimatedFace size="xs" className="shrink-0" />
                        )}

                        {c.pinned && (
                          <Pin className="size-3 text-blue-400 shrink-0 fill-blue-400" />
                        )}

                        <span
                          className={cn(
                            "truncate leading-snug min-w-0",
                            isActive
                              ? "text-[14px] font-medium text-white"
                              : "text-[13.5px] font-normal text-zinc-300",
                          )}
                        >
                          {c.title}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-zinc-500">
                        {c.time}
                      </div>
                    </button>

                    {/* iOS style select overlay over clean 3-dots icon */}
                    <div
                      className="relative flex size-7 shrink-0 items-center justify-center rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-all mr-1.5 opacity-70 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="size-4" />
                      <select
                        defaultValue=""
                        style={{ fontSize: "16px" }}
                        aria-label={`Opções de ${c.title}`}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "pin") {
                            pinConversation(c.id, !c.pinned);
                          } else if (val === "rename") {
                            setRenameModalId(c.id);
                            setRenameTitleDraft(c.title);
                          } else if (val === "edit_bot") {
                            const bot = c.botId
                              ? customBots.find((b) => b.id === c.botId)
                              : null;
                            if (bot) {
                              openBotEdit(bot);
                              setSidebar(false);
                            }
                          } else if (val === "delete") {
                            deleteConversation(c.id);
                          }
                          e.target.value = "";
                        }}
                        className="absolute inset-0 size-full cursor-pointer opacity-0"
                      >
                        <option value="" disabled hidden />
                        <option value="pin" className="bg-[#181920] text-white">
                          {c.pinned ? "Desafixar do topo" : "Fixar no topo"}
                        </option>
                        {c.botId && (
                          <option value="edit_bot" className="bg-[#181920] text-white">
                            Editar bot
                          </option>
                        )}
                        <option value="rename" className="bg-[#181920] text-white">
                          Renomear
                        </option>
                        <option value="delete" className="bg-[#181920] text-red-400 font-semibold">
                          Deletar
                        </option>
                      </select>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom bar: User Profile on Left, Settings & New Chat on Right */}
        <div className="mt-auto flex items-center justify-between gap-2 px-3 pt-2 pb-1.5 bg-transparent backdrop-blur-sm">
          {/* User Profile dropdown or Google Login button */}
          {authUser ? (
            <div className="relative group flex items-center gap-2.5 py-1.5 px-2 rounded-full hover:bg-white/[0.06] transition-all cursor-pointer min-w-0 max-w-[160px]">
              <div className="size-9 overflow-hidden rounded-full bg-[#0080ff] flex items-center justify-center shrink-0 pointer-events-none">
                {authUser.avatar ? (
                  <img src={authUser.avatar} alt={userName} className="size-full object-cover" />
                ) : (
                  <User className="size-5 text-white" />
                )}
              </div>
              <div className="flex items-center gap-1 min-w-0 pointer-events-none">
                <span className="text-[14.5px] font-semibold text-white tracking-tight group-hover:text-zinc-100 truncate">
                  {userName}
                </span>
                <ChevronDown className="size-4 text-zinc-400 shrink-0" />
              </div>

              <select
                suppressHydrationWarning
                value=""
                aria-label="Opções da conta"
                style={{ fontSize: "16px" }}
                onChange={async (e) => {
                  const val = e.target.value;
                  if (val === "gerenciar Google") {
                    openSettings("profile");
                  } else if (val === "sair") {
                    setSidebar(false);
                    await logoutFirebase();
                    logout();
                  }
                }}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
              >
                <option value="" disabled className="bg-[#1f2029] text-white font-semibold">
                  {userName} ({authUser.email})
                </option>
                <option value="gerenciar Google" className="bg-[#1f2029] text-white">
                  Gerenciar conta Google
                </option>
                <option value="sair" className="bg-[#1f2029] text-red-400">
                  Sair do Google
                </option>
              </select>
            </div>
          ) : (
            <button
              type="button"
              onClick={async () => {
                try {
                  await loginWithGoogle();
                } catch (err) {
                  console.error("Erro ao fazer login Google:", err);
                }
              }}
              className="press flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 px-3 py-1.5 text-[13.5px] font-medium text-white transition-all border border-white/10 shadow-sm"
            >
              <svg className="size-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Entrar com Google</span>
            </button>
          )}

          {/* Settings & New Chat buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => openSettings()}
              aria-label="Configurações"
              className="press flex size-10 shrink-0 items-center justify-center rounded-full bg-white/[0.07] hover:bg-white/[0.14] text-zinc-200 hover:text-white transition-all"
            >
              <Settings className="size-5" />
            </button>

            <button
              type="button"
              onClick={() => {
                newChat();
                setSidebar(false);
              }}
              aria-label="Novo bate-papo"
              className="press flex size-10 shrink-0 items-center justify-center rounded-full bg-white/[0.07] hover:bg-white/[0.14] text-zinc-200 hover:text-white transition-all"
            >
              <SquarePen className="size-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Rename Dialog */}
      {renameModalId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            onClick={() => setRenameModalId(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-sm rounded-2xl bg-[#16171d] border border-white/10 p-4 text-white shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          >
            <h3 className="text-[16px] font-semibold text-white mb-2">
              Renomear conversa
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (renameTitleDraft.trim()) {
                  renameConversation(renameModalId, renameTitleDraft.trim());
                }
                setRenameModalId(null);
              }}
            >
              <input
                type="text"
                autoFocus
                value={renameTitleDraft}
                onChange={(e) => setRenameTitleDraft(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-[14.5px] text-white outline-none focus:border-blue-500 mb-4"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRenameModalId(null)}
                  className="press flex-1 h-9 rounded-xl bg-white/10 hover:bg-white/15 text-[13.5px] font-medium text-zinc-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!renameTitleDraft.trim()}
                  className="press flex-1 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-[13.5px] disabled:opacity-40"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
