import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, X } from "lucide-react";
import { ChatStage } from "./chat-stage";
import { Composer } from "./composer";
import { Markdown } from "./markdown";
import { TopBar } from "./top-bar";
import { ApiKeyNotification } from "./api-key-notification";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ChatView() {
  const currentId = useApp((s) => s.currentId);
  const conversations = useApp((s) => s.conversations);
  const customBots = useApp((s) => s.customBots);
  const openBotEdit = useApp((s) => s.openBotEdit);
  const sending = useApp((s) => s.sending);
  const deleteConversation = useApp((s) => s.deleteConversation);
  const renameConversation = useApp((s) => s.renameConversation);
  const conv = conversations.find((c) => c.id === currentId);
  const activeBot = conv?.botId ? customBots.find((b) => b.id === conv.botId) : null;
  const scroller = useRef<HTMLDivElement>(null);
  const [renaming, setRenaming] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [conv?.messages.length, sending]);

  if (!conv) return null;

  return (
    <ChatStage>
      <TopBar
        right={
          <div className="flex shrink-0 items-center gap-1.5">
            {/* Native select overlay over 3-dots button inside chat */}
            <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-white/[0.07] hover:bg-white/[0.14] backdrop-blur-xl text-white transition-all cursor-pointer">
              <MoreHorizontal className="size-5" strokeWidth={1.8} />
              <select
                defaultValue=""
                aria-label="Opções do chat"
                style={{ fontSize: "16px" }}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "renomear") {
                    setTitleDraft(conv.title);
                    setRenaming(true);
                  } else if (val === "edit_bot" && activeBot) {
                    openBotEdit(activeBot);
                  } else if (val === "copiar") {
                    const text = conv.messages
                      .map((m) => `${m.role === "user" ? "Você" : "Kairo"}: ${m.content}`)
                      .join("\n\n");
                    void navigator.clipboard.writeText(text);
                  } else if (val === "excluir") {
                    deleteConversation(conv.id);
                  }
                  e.target.value = "";
                }}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
              >
                <option value="" disabled hidden />
                <option value="renomear" className="bg-[#181920] text-white">
                  renomear
                </option>
                {activeBot && (
                  <option value="edit_bot" className="bg-[#181920] text-white">
                    editar bot
                  </option>
                )}
                <option value="copiar" className="bg-[#181920] text-white">
                  copiar conversa
                </option>
                <option value="excluir" className="bg-[#181920] text-red-400 font-semibold">
                  excluir chat
                </option>
              </select>
            </div>
          </div>
        }
      />

      <div
        ref={scroller}
        className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4"
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-3.5">
          {conv.messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex w-full",
                m.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "min-w-0 rounded-[26px] px-5 py-3.5 backdrop-blur-sm shadow-md transition-all",
                  m.role === "user"
                    ? "max-w-[85%] bg-[#25252e]/70 text-white"
                    : "max-w-[88%] bg-[#131317]/70 text-zinc-100",
                )}
              >
                {m.role === "user" ? (
                  <p className="whitespace-pre-wrap text-[16px] leading-relaxed text-white">
                    {m.content}
                  </p>
                ) : (
                  <AssistantMessage content={m.content} />
                )}
              </div>
            </div>
          ))}
          {sending ? (
            <div className="flex w-full justify-start py-2 px-1">
              <div className="flex items-center gap-2 thinking-inverted-diff select-none">
                <span className="text-[15px] font-medium tracking-wide">
                  pensando…
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="size-1.5 rounded-full bg-white animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="size-1.5 rounded-full bg-white animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="size-1.5 rounded-full bg-white animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl px-2 sm:px-4 pb-[max(12px,calc(env(safe-area-inset-bottom)+8px))] flex flex-col gap-2">
        <ApiKeyNotification />
        <Composer compact />
      </div>

      {renaming ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Fechar"
            className="backdrop-in absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setRenaming(false)}
          />
          <div
            role="dialog"
            className="sheet-in relative z-10 w-full max-w-sm rounded-2xl bg-[#1e1f28] p-5 shadow-2xl border border-white/10"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[17px] font-semibold text-white">Renomear conversa</h3>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setRenaming(false)}
                className="press flex size-8 items-center justify-center rounded-full bg-white/10 text-zinc-300 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (titleDraft.trim()) {
                  renameConversation(conv.id, titleDraft.trim());
                }
                setRenaming(false);
              }}
            >
              <input
                autoFocus
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                placeholder="Novo título..."
                className="h-11 w-full rounded-xl bg-black/40 px-3.5 text-[15px] text-white outline-none border border-white/10 focus:border-white/30"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRenaming(false)}
                  className="h-10 rounded-xl px-4 text-[14px] text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-10 rounded-xl bg-white px-5 text-[14px] font-medium text-black hover:bg-zinc-200"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </ChatStage>
  );
}

function AssistantMessage({ content }: { content: string }) {
  const [openThink, setOpenThink] = useState(false);
  const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/i);

  if (thinkMatch) {
    const thought = thinkMatch[1].trim();
    const cleanContent = content.replace(/<think>[\s\S]*?<\/think>/i, "").trim();

    return (
      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={() => setOpenThink(!openThink)}
          className="press inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] backdrop-blur-md px-3.5 py-1 text-left hover:border-white/20 transition-all self-start shadow-sm"
        >
          <span className="thinking-night-wave text-[13px]">pensando…</span>
          <span className="text-[11px] text-zinc-400">
            {openThink ? "ocultar" : "mostrar raciocínio"}
          </span>
        </button>

        {openThink && (
          <div className="rounded-2xl border border-white/10 bg-black/40 p-3 text-[13.5px] leading-relaxed text-zinc-300 italic">
            {thought}
          </div>
        )}

        {cleanContent ? (
          <Markdown text={cleanContent} className="text-[16px] leading-relaxed text-zinc-100" />
        ) : null}
      </div>
    );
  }

  return <Markdown text={content} className="text-[16px] leading-relaxed text-zinc-100" />;
}
