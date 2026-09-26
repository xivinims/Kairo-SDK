import {
  BookOpen,
  Code2,
  Compass,
  FileText,
  Globe2,
  Home,
  MessagesSquare,
  Palette,
  Plug,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { KAIRO_SKILLS, type KairoSkillId } from "@/lib/kairo-skills";

/**
 * Sidebar + welcome layout for Kairo Agent.
 *
 * Same near-black #09090b surface as the rest of the app, now with a
 * violet→fuchsia→sky gradient reserved for the logo mark, hero icon and
 * primary actions — one accent, used consistently, instead of scattered
 * color. Content still comes straight from kairo-skills.ts, not static copy.
 */

const SKILL_ICON: Partial<Record<KairoSkillId, typeof Code2>> = {
  code: Code2,
  research: Search,
  web: Globe2,
  design: Palette,
  documents: FileText,
  story: BookOpen,
};

const NAV_ITEMS = [
  { id: "home", label: "Início", icon: Home },
  { id: "chat", label: "Conversas", icon: MessagesSquare },
  { id: "skills", label: "Skills", icon: Compass },
  { id: "connectors", label: "Conectores", icon: Plug },
];

export interface KairoRecentChat {
  id: string;
  title: string;
  group: "Hoje" | "Ontem" | "7 dias";
}

interface KairoHomeProps {
  recent?: KairoRecentChat[];
  onNewChat: () => void;
  onPickPrompt: (prompt: string) => void;
  collapsed?: boolean;
}

const STARTER_PROMPTS = [
  "Monte o esqueleto de uma API em TypeScript",
  "Pesquise as notícias de hoje sobre IA",
  "Crie uma persona para um RPG de fantasia",
  "Resuma este documento em tópicos",
];

export function KairoSidebar({ recent = [], onNewChat, active = "home" }: {
  recent?: KairoRecentChat[];
  onNewChat: () => void;
  active?: string;
}) {
  const groups: KairoRecentChat["group"][] = ["Hoje", "Ontem", "7 dias"];

  return (
    <aside className="flex h-dvh w-64 shrink-0 flex-col border-r border-white/[0.06] bg-[#0c0c0e] text-white">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 via-fuchsia-500 to-sky-400 text-white shadow-[0_0_12px_-3px_rgba(168,85,247,0.6)]">
          <Sparkles className="size-3.5" />
        </div>
        <span className="text-sm font-semibold tracking-tight">Kairo</span>
        <span className="ml-auto rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/40">
          gemini-2.5-flash
        </span>
      </div>

      <div className="px-3">
        <button
          type="button"
          onClick={onNewChat}
          className="flex w-full items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/[0.06]"
        >
          <Plus className="size-4" /> Novo chat
        </button>
      </div>

      <nav className="mt-4 flex flex-col gap-0.5 px-3">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] ${
              active === item.id ? "bg-white/[0.08] text-white" : "text-white/55 hover:bg-white/[0.05] hover:text-white/85"
            }`}
          >
            <item.icon className="size-4" /> {item.label}
          </button>
        ))}
      </nav>

      <div className="mt-5 min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {groups.map((group) => {
          const items = recent.filter((chat) => chat.group === group);
          if (!items.length) return null;
          return (
            <div key={group} className="mb-4">
              <p className="px-3 pb-1.5 text-[10px] font-medium uppercase tracking-wide text-white/30">{group}</p>
              {items.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  className="block w-full truncate rounded-lg px-3 py-1.5 text-left text-[13px] text-white/55 hover:bg-white/[0.05] hover:text-white/85"
                >
                  {chat.title}
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

export function KairoWelcome({ onPickPrompt }: { onPickPrompt: (prompt: string) => void }) {
  const featured = KAIRO_SKILLS.filter((skill) =>
    (["code", "research", "web", "design", "documents", "story"] as KairoSkillId[]).includes(skill.id),
  );

  return (
    <div className="m-auto w-full max-w-2xl py-14 text-center">
      <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-[20px] bg-gradient-to-br from-violet-500 via-fuchsia-500 to-sky-400 text-white shadow-[0_0_30px_-6px_rgba(168,85,247,0.55)]">
        <Sparkles className="size-6" />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight">Como posso ajudar?</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/40">
        Kairo Agent combina pesquisa nativa e um registro de skills — código, design, documentos, mundos e mais.
      </p>

      <div className="mx-auto mt-8 grid max-w-xl grid-cols-2 gap-2.5 sm:grid-cols-3">
        {featured.map((skill) => {
          const Icon = SKILL_ICON[skill.id] ?? Sparkles;
          return (
            <button
              key={skill.id}
              type="button"
              onClick={() => onPickPrompt(`Preciso de ajuda com ${skill.label.toLowerCase()}: `)}
              className="flex flex-col items-start gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3.5 text-left transition hover:border-white/[0.14] hover:bg-white/[0.06]"
            >
              <Icon className="size-4 text-white/70" />
              <span className="text-[13px] font-medium text-white/85">{skill.label}</span>
              <span className="text-[11px] leading-snug text-white/35">{skill.description}</span>
            </button>
          );
        })}
      </div>

      <div className="mx-auto mt-6 flex max-w-xl flex-wrap justify-center gap-2">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onPickPrompt(prompt)}
            className="rounded-full border border-white/10 px-3 py-1.5 text-[12px] text-white/55 hover:bg-white/[0.06] hover:text-white/85"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
