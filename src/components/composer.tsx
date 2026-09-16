import { useRef } from "react";
import { ArrowUp, Ban, User } from "lucide-react";
import { useApp, getActivePersona } from "@/lib/store";
import { cn } from "@/lib/utils";
import { askClaude } from "@/lib/ask";

export function Composer({ compact: _compact }: { compact?: boolean }) {
  const draft = useApp((s) => s.draft);
  const setDraft = useApp((s) => s.setDraft);
  const sending = useApp((s) => s.sending);
  const setPersonaSheet = useApp((s) => s.setPersonaSheet);
  const setActivePersona = useApp((s) => s.setActivePersona);
  const conversations = useApp((s) => s.conversations);
  const currentId = useApp((s) => s.currentId);
  const customBots = useApp((s) => s.customBots);
  const prefs = useApp((s) => s.prefs);
  const personas = (prefs.personas || []).filter(
    (p) => !p.isOriginal && p.id !== "original" && p.id !== "raphael" && p.id !== "kakeru",
  );
  const activePersona = getActivePersona(prefs);
  const onSend = useSend();
  const ref = useRef<HTMLTextAreaElement>(null);
  const hasText = draft.trim().length > 0;
  const conv = conversations.find((c) => c.id === currentId);
  const bot = conv?.botId ? customBots.find((b) => b.id === conv.botId) : null;
  const replyTo = bot ? bot.name : (conv?.title && conv.messages.length > 0 ? conv.title : "Kairo");

  function resize() {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  return (
    <div className="relative w-full">
      {/* Composer search & input bar - perfectly centered inline layout */}
      <div className="relative z-10 flex min-h-[52px] items-center gap-2 rounded-full bg-black/60 hover:bg-black/70 focus-within:bg-black/75 backdrop-blur-2xl backdrop-saturate-150 p-1.5 pl-2 pr-2 shadow-2xl transition-all">
        {/* Left: Persona round photo avatar bubble with native select options */}
        <div className="relative size-10 shrink-0 flex items-center justify-center my-auto">
          <div
            title={activePersona.name ? `Perfil: ${activePersona.name}` : "Perfil"}
            className="size-10 overflow-hidden rounded-full bg-[#24252e] ring-1 ring-white/10 hover:ring-2 hover:ring-white/20 transition-all flex items-center justify-center pointer-events-none"
          >
            {activePersona.avatar ? (
              <img
                src={activePersona.avatar}
                alt={activePersona.name}
                className="size-full object-cover"
              />
            ) : activePersona.isOriginal ? (
              <Ban className="size-4 text-zinc-400" />
            ) : (
              <User className="size-4 text-zinc-300" />
            )}
          </div>

          <select
            suppressHydrationWarning
            value={activePersona.id || ""}
            aria-label="Opções de perfil"
            style={{ fontSize: "16px" }}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "gerenciar perfils" || val === "manage") {
                setPersonaSheet(true, "manage");
              } else if (val === "criar perfil" || val === "create" || val === "pro") {
                setPersonaSheet(true, "create");
              } else if (val) {
                setActivePersona(val);
              }
            }}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          >
            {personas.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#1f2029] text-white">
                {p.name}
              </option>
            ))}
            <option value="criar perfil" className="bg-[#1f2029] text-white">
              criar perfil
            </option>
            <option value="gerenciar perfils" className="bg-[#1f2029] text-white">
              gerenciar perfils
            </option>
          </select>
        </div>

        {/* Center: Textarea inline in a single row, perfectly centered vertically */}
        <textarea
          ref={ref}
          rows={1}
          value={draft}
          disabled={sending}
          placeholder={`Responder · ${replyTo}.`}
          suppressHydrationWarning
          onChange={(e) => {
            setDraft(e.target.value);
            resize();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (hasText && !sending) onSend();
            }
          }}
          className="max-h-[110px] flex-1 resize-none self-center bg-transparent py-2 px-2 text-[15.5px] leading-normal text-white outline-none placeholder:text-zinc-400 disabled:opacity-60 overflow-y-auto no-scrollbar my-auto"
        />

        {/* Right: Send button formatted as a rounded pill button */}
        <button
          type="button"
          aria-label="Enviar mensagem"
          disabled={sending || !hasText}
          onClick={onSend}
          className={cn(
            "press flex size-10 shrink-0 items-center justify-center rounded-full text-white transition-all my-auto",
            hasText && !sending
              ? "bg-white text-black hover:bg-zinc-200 active:scale-95 font-semibold cursor-pointer"
              : "bg-white/10 text-zinc-500 opacity-60 cursor-not-allowed",
          )}
        >
          <ArrowUp className={cn("size-5 stroke-[2.5]", hasText && !sending ? "text-black" : "text-zinc-500")} />
        </button>
      </div>
    </div>
  );
}

function useSend() {
  const addUserMessage = useApp((s) => s.addUserMessage);
  const finishAssistant = useApp((s) => s.finishAssistant);
  const failAssistant = useApp((s) => s.failAssistant);
  const addArtifact = useApp((s) => s.addArtifact);
  const draft = useApp((s) => s.draft);
  const sending = useApp((s) => s.sending);
  const model = useApp((s) => s.model);
  const prefs = useApp((s) => s.prefs);
  const conversations = useApp((s) => s.conversations);
  const customBots = useApp((s) => s.customBots);

  return async function send() {
    const text = draft.trim();
    if (!text || sending) return;
    const { convId, messages } = addUserMessage(text);
    const provider = prefs.api.provider;
    const activePersona = getActivePersona(prefs);

    const conv = conversations.find((c) => c.id === convId);
    const bot = conv?.botId ? customBots.find((b) => b.id === conv.botId) : null;

    try {
      const res = await askClaude({
        data: {
          messages,
          model,
          provider,
          apiKey: prefs.api.keys[provider],
          instructions: prefs.instructions,
          profile: prefs.profile,
          persona: activePersona,
          story: prefs.story,
          bot: bot
            ? {
                id: bot.id,
                name: bot.name,
                gender: bot.gender,
                intro: bot.intro,
                personality: bot.personality,
                welcomeMsg: bot.welcomeMsg,
                scenario: bot.scenario,
                instructions: bot.instructions,
                storyMode: bot.storyMode,
                storyTitle: bot.storyTitle,
                storyBody: bot.storyBody,
                storyCharacter: bot.storyCharacter,
                likes: bot.likes,
                tags: bot.tags,
              }
            : undefined,
        },
      });
      if (res.ok) {
        finishAssistant(convId, res.text);
        if (prefs.features.artifacts) {
          const blocks = [...res.text.matchAll(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g)];
          for (const b of blocks) {
            const body = b[2].trim();
            if (body.split("\n").length < 6) continue;
            const lang = b[1] || "text";
            const kind = lang === "html" ? "html" : "code";
            const first = body.split("\n").find((l) => l.trim()) ?? "Artefato";
            addArtifact({
              title: first.replace(/^[#/\s*]+/, "").slice(0, 48) || "Artefato",
              kind,
              language: lang,
              content: body,
              conversationId: convId,
            });
          }
        }
      } else if (res.error === "missing-key") {
        failAssistant(
          convId,
          "Coloque uma chave de API em Configurações → API para falar com a IA.",
        );
      } else {
        failAssistant(
          convId,
          `Não consegui responder agora (${res.error}). Verifique a chave e o modelo em Configurações → API.`,
        );
      }
    } catch {
      failAssistant(convId);
    }
  };
}
