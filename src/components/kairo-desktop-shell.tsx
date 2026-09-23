import { Activity, ChevronDown, Command, FolderKanban, Minus, PanelRight, Plus, Square, X } from "lucide-react";
import { useState } from "react";
import { isDesktopRuntime } from "@/lib/kairo-desktop";
import { useApp } from "@/lib/store";

export function KairoDesktopShell({ children }: { children: React.ReactNode }) {
  const [tasksOpen, setTasksOpen] = useState(true);
  const projects = useApp((state) => state.projects);
  const conversations = useApp((state) => state.conversations);
  const currentId = useApp((state) => state.currentId);
  const current = conversations.find((item) => item.id === currentId);
  const runtime = isDesktopRuntime() ? "Desktop" : "Web preview";

  return (
    <div className="kairo-desktop-window flex h-dvh w-full flex-col overflow-hidden bg-[#0d0e10] text-white">
      <header className="kairo-titlebar flex h-11 shrink-0 items-center gap-3 border-b border-white/[0.08] bg-black/40 px-3 backdrop-blur-2xl">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-300 to-violet-400 text-[11px] font-black text-black shadow-[0_0_18px_rgba(103,232,249,0.35)]">K</div>
          <span className="text-[12px] font-semibold tracking-tight">Kairo</span>
          <span className="hidden rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[10px] text-white/40 sm:inline">{runtime}</span>
        </div>
        <div className="mx-auto hidden min-w-0 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] text-white/45 md:flex">
          <Command className="size-3" />
          <span className="truncate">{current?.title || "Workspace do Kairo Agent"}</span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button type="button" className="kairo-window-button hidden sm:flex" title="Atividade"><Activity className="size-3.5" /></button>
          <button type="button" onClick={() => setTasksOpen((value) => !value)} className="kairo-window-button" title="Painel de tarefas"><PanelRight className="size-3.5" /></button>
          <button type="button" className="kairo-window-button hidden sm:flex" title="Minimizar"><Minus className="size-3.5" /></button>
          <button type="button" className="kairo-window-button hidden sm:flex" title="Maximizar"><Square className="size-3" /></button>
          <button type="button" className="kairo-window-button hidden sm:flex hover:!bg-red-400/20 hover:!text-red-200" title="Fechar"><X className="size-3.5" /></button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        <aside className="kairo-workspace-rail hidden w-12 shrink-0 flex-col items-center gap-2 border-r border-white/[0.07] bg-black/20 py-3 md:flex">
          <button type="button" className="kairo-rail-button is-active" title="Workspace"><FolderKanban className="size-4" /></button>
          <button type="button" className="kairo-rail-button" title="Novo projeto"><Plus className="size-4" /></button>
          <div className="mt-auto flex size-7 items-center justify-center rounded-full bg-white/10 text-[10px] text-white/60">U</div>
        </aside>

        <div className="flex min-w-0 flex-1">{children}</div>

        {tasksOpen ? (
          <aside className="kairo-tasks-panel hidden w-[280px] shrink-0 border-l border-white/[0.07] bg-black/20 p-3 xl:block">
            <div className="mb-3 flex items-center gap-2">
              <div className="min-w-0 flex-1"><p className="text-[12px] font-medium">Tasks</p><p className="text-[10px] text-white/35">Acompanhamento do agente</p></div>
              <ChevronDown className="size-3.5 text-white/35" />
            </div>
            <div className="space-y-2">
              <TaskCard title="Contexto" body={current ? `${current.messages.length} mensagens nesta conversa` : "Nenhuma conversa ativa"} tone="blue" />
              <TaskCard title="Projetos" body={`${projects.length} projeto(s) disponível(is)`} tone="violet" />
              <TaskCard title="Permissões" body={runtime === "Desktop" ? "Acesso local sob autorização" : "Disponível no app desktop"} tone="green" />
            </div>
            <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.035] p-3 text-[10px] leading-relaxed text-white/35">O Kairo pede confirmação antes de ler arquivos fora das pastas autorizadas ou executar comandos locais.</div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

function TaskCard({ title, body, tone }: { title: string; body: string; tone: "blue" | "violet" | "green" }) {
  return <article className="rounded-xl border border-white/[0.07] bg-white/[0.045] p-3 transition hover:bg-white/[0.07]"><div className="mb-2 flex items-center justify-between"><span className="text-[11px] font-medium text-white/75">{title}</span><span className={`size-2 rounded-full ${tone === "blue" ? "bg-cyan-300" : tone === "violet" ? "bg-violet-300" : "bg-emerald-300"}`} /></div><p className="text-[10px] leading-relaxed text-white/40">{body}</p></article>;
}
