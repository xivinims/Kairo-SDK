import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowUp, CalendarClock, Check, ListTodo, MessageSquare, Play, Plus, Puzzle, Sparkles, Trash2 } from "lucide-react";
import { askKairoAgent, type KairoMessage } from "@/lib/kairo-agent";
import { KAIRO_SKILLS, detectKairoSkills } from "@/lib/kairo-skills";
import { cn, uid } from "@/lib/utils";
import { Markdown } from "./markdown";

type View = "chat" | "tasks" | "skills";
type Repeat = "none" | "daily" | "weekly";
interface Chat { id: string; title: string; messages: KairoMessage[] }
interface Task { id: string; title: string; prompt: string; status: "backlog" | "scheduled" | "done"; runAt?: number; repeat: Repeat; result?: string; lastRun?: number }

function usePersisted<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const loaded = useRef(false);
  useEffect(() => {
    try { const raw = localStorage.getItem(key); if (raw) setValue(JSON.parse(raw) as T); } catch { /* ignore */ }
    loaded.current = true;
  }, [key]);
  useEffect(() => {
    if (!loaded.current) return;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  }, [key, value]);
  return [value, setValue] as const;
}

function nextRun(at: number, repeat: Repeat) {
  const step = (repeat === "weekly" ? 7 : 1) * 86400000;
  let n = at + step;
  while (n <= Date.now()) n += step;
  return n;
}

const fmt = (ts: number) => new Date(ts).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export function KairoAgentApp() {
  const [view, setView] = useState<View>("chat");
  const [chats, setChats] = usePersisted<Chat[]>("kairo:chats", []);
  const [activeId, setActiveId] = usePersisted<string>("kairo:active", "");
  const [tasks, setTasks] = usePersisted<Task[]>("kairo:tasks", []);
  const [disabled, setDisabled] = usePersisted<string[]>("kairo:disabled-skills", []);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [running, setRunning] = useState<string[]>([]);
  const [form, setForm] = useState({ title: "", prompt: "", when: "", repeat: "none" as Repeat });

  const tasksRef = useRef(tasks); tasksRef.current = tasks;
  const disabledRef = useRef(disabled); disabledRef.current = disabled;
  const runningRef = useRef(new Set<string>());

  const active = chats.find((c) => c.id === activeId);
  const messages = active?.messages ?? [];
  const skills = useMemo(() => detectKairoSkills(draft, disabled), [draft, disabled]);

  async function send(event?: FormEvent) {
    event?.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    const id = active?.id ?? uid();
    const next = [...messages, { role: "user" as const, content: text }];
    setChats((cur) => active ? cur.map((c) => (c.id === id ? { ...c, messages: next } : c)) : [{ id, title: text.slice(0, 40), messages: next }, ...cur]);
    setActiveId(id); setDraft(""); setError(""); setSending(true);
    try {
      const r = await askKairoAgent({ data: { messages: next, contentLevel: "safe", disabledSkills: disabled } });
      if (r.ok && r.answer) {
        const answer = r.answer;
        setChats((cur) => cur.map((c) => (c.id === id ? { ...c, messages: [...next, { role: "assistant" as const, content: answer }] } : c)));
      } else setError(r.error ?? "O Kairo não conseguiu responder agora.");
    } catch { setError("Não foi possível conectar ao Kairo agora."); }
    finally { setSending(false); }
  }

  async function runTask(id: string) {
    const t = tasksRef.current.find((x) => x.id === id);
    if (!t || runningRef.current.has(id)) return;
    runningRef.current.add(id); setRunning([...runningRef.current]);
    let result = "";
    try {
      const r = await askKairoAgent({ data: { messages: [{ role: "user", content: t.prompt }], contentLevel: "safe", disabledSkills: disabledRef.current } });
      result = r.ok && r.answer ? r.answer : r.error ?? "Falha ao executar.";
    } catch { result = "Falha ao executar."; }
    runningRef.current.delete(id); setRunning([...runningRef.current]);
    setTasks((cur) => cur.map((x) => x.id !== id ? x : {
      ...x, result, lastRun: Date.now(),
      ...(x.repeat !== "none" && x.runAt ? { runAt: nextRun(x.runAt, x.repeat), status: "scheduled" as const } : { status: "done" as const }),
    }));
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      tasksRef.current.filter((t) => t.status === "scheduled" && t.runAt && t.runAt <= now).forEach((t) => void runTask(t.id));
    }, 15000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addTask(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim() || !form.prompt.trim()) return;
    const runAt = form.when ? new Date(form.when).getTime() : undefined;
    setTasks((cur) => [{ id: uid(), title: form.title.trim(), prompt: form.prompt.trim(), repeat: runAt ? form.repeat : "none", runAt, status: runAt ? "scheduled" : "backlog" }, ...cur]);
    setForm({ title: "", prompt: "", when: "", repeat: "none" });
  }

  const rail: Array<[View, typeof MessageSquare, string]> = [["chat", MessageSquare, "Chat"], ["tasks", ListTodo, "Tarefas"], ["skills", Puzzle, "Skills"]];
  const columns: Array<[Task["status"], string]> = [["backlog", "Backlog"], ["scheduled", "Agendadas"], ["done", "Concluídas"]];
  const field = "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-violet-400/60";

  return (
    <div className="flex h-dvh w-full bg-[#09090b] text-white">
      <nav className="flex w-14 shrink-0 flex-col items-center gap-2 border-r border-white/[0.06] py-3">
        <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-violet-500 text-white"><Sparkles className="size-4" /></div>
        {rail.map(([id, Icon, label]) => (
          <button key={id} type="button" aria-label={label} title={label} onClick={() => setView(id)} className={cn("press flex size-9 items-center justify-center rounded-xl text-white/45 hover:bg-white/10 hover:text-white", view === id && "bg-white/10 text-white")}><Icon className="size-[18px]" /></button>
        ))}
      </nav>

      {view === "chat" && (
        <aside className="hidden w-64 shrink-0 flex-col border-r border-white/[0.06] p-3 md:flex">
          <div className="mb-3 flex items-center justify-between"><div><p className="text-sm font-semibold">Kairo App</p><p className="text-[10px] text-white/35">Agente Kairo</p></div>
            <button type="button" onClick={() => { setActiveId(""); setDraft(""); setError(""); }} className="flex size-8 items-center justify-center rounded-full text-white/55 hover:bg-white/10" aria-label="Novo chat"><Plus className="size-4" /></button></div>
          <div className="no-scrollbar flex flex-col gap-1 overflow-y-auto">
            {chats.map((c) => (
              <div key={c.id} className={cn("group flex items-center justify-between rounded-lg px-3 py-2 text-sm text-white/60 hover:bg-white/[0.06]", c.id === activeId && "bg-white/10 text-white")}>
                <button type="button" className="min-w-0 flex-1 truncate text-left" onClick={() => setActiveId(c.id)}>{c.title}</button>
                <button type="button" aria-label="Apagar chat" className="ml-2 hidden text-white/30 hover:text-red-300 group-hover:block" onClick={() => { setChats((cur) => cur.filter((x) => x.id !== c.id)); if (c.id === activeId) setActiveId(""); }}><Trash2 className="size-3.5" /></button>
              </div>
            ))}
            {chats.length === 0 && <p className="px-3 py-2 text-xs text-white/30">Nenhuma conversa ainda.</p>}
          </div>
        </aside>
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        {view === "chat" && (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 py-8 sm:px-6">
                {messages.length === 0 ? (
                  <div className="m-auto w-full max-w-2xl py-16 text-center">
                    <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-[20px] bg-violet-500 shadow-2xl"><Sparkles className="size-6" /></div>
                    <h1 className="text-3xl font-semibold tracking-tight">Oi, eu sou o Kairo</h1>
                    <p className="mx-auto mt-2 max-w-md text-sm text-white/40">Código, pesquisa, estudo, textos, planejamento e tarefas agendadas. Pergunte qualquer coisa.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6 pb-8">
                    {messages.map((m, i) => (
                      <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                        <div className={m.role === "user" ? "max-w-[82%] rounded-[24px] bg-white/[0.09] px-4 py-3" : "min-w-0 max-w-full"}>
                          {m.role === "user" ? <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{m.content}</p> : <Markdown text={m.content} className="text-[15px] leading-7 text-white/85" />}
                        </div>
                      </div>
                    ))}
                    {sending && <p className="text-sm text-white/45">Kairo está trabalhando…</p>}
                  </div>
                )}
              </div>
            </div>
            <div className="mx-auto w-full max-w-3xl px-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:px-6">
              {error && <div className="mb-2 rounded-2xl bg-red-400/10 px-3 py-2 text-xs text-red-200">{error}</div>}
              <form onSubmit={send} className="rounded-[28px] bg-white/[0.07] p-2 shadow-2xl">
                <textarea value={draft} disabled={sending} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }} rows={2} placeholder="Pergunte qualquer coisa ao Kairo…" className="w-full resize-none bg-transparent px-3 py-2 text-[15px] outline-none placeholder:text-white/30" />
                <div className="flex items-center justify-between gap-2 px-1 pb-1">
                  <span className="truncate text-[10px] text-white/30">{skills.join(" · ")}</span>
                  <button type="submit" disabled={!draft.trim() || sending} className="flex size-9 items-center justify-center rounded-full bg-violet-500 disabled:bg-white/10 disabled:text-white/25" aria-label="Enviar"><ArrowUp className="size-4" /></button>
                </div>
              </form>
              <p className="mt-2 text-center text-[10px] text-white/20">Kairo pode cometer erros. Verifique informações importantes.</p>
            </div>
          </>
        )}

        {view === "tasks" && (
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            <h1 className="text-xl font-semibold">Tarefas do Kairo</h1>
            <p className="mb-4 mt-1 text-xs text-white/40">Agende um pedido e o Kairo executa no horário. As execuções rodam enquanto o Kairo App estiver aberto.</p>
            <form onSubmit={addTask} className="mb-6 grid gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 md:grid-cols-2">
              <input className={field} placeholder="Título (ex.: Resumo de notícias)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <div className="flex gap-2">
                <input type="datetime-local" className={field} value={form.when} onChange={(e) => setForm({ ...form, when: e.target.value })} />
                <select className={field} value={form.repeat} onChange={(e) => setForm({ ...form, repeat: e.target.value as Repeat })}><option value="none" className="bg-zinc-900">Uma vez</option><option value="daily" className="bg-zinc-900">Todo dia</option><option value="weekly" className="bg-zinc-900">Toda semana</option></select>
              </div>
              <textarea className={cn(field, "md:col-span-2")} rows={2} placeholder="O que o Kairo deve fazer?" value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} />
              <button type="submit" className="press flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-2 text-sm font-medium md:col-span-2"><CalendarClock className="size-4" />{form.when ? "Agendar tarefa" : "Adicionar ao backlog"}</button>
            </form>
            <div className="grid gap-4 md:grid-cols-3">
              {columns.map(([status, label]) => (
                <section key={status} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-white/40">{label} · {tasks.filter((t) => t.status === status).length}</h2>
                  <div className="flex flex-col gap-2">
                    {tasks.filter((t) => t.status === status).map((t) => (
                      <article key={t.id} className="rounded-xl bg-white/[0.06] p-3">
                        <p className="text-sm font-medium">{t.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-white/45">{t.prompt}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                          {t.runAt && <span className="rounded-md bg-violet-500/20 px-1.5 py-0.5 text-violet-200">{fmt(t.runAt)}</span>}
                          {t.repeat !== "none" && <span className="rounded-md bg-sky-500/20 px-1.5 py-0.5 text-sky-200">{t.repeat === "daily" ? "diária" : "semanal"}</span>}
                        </div>
                        {t.result && <details className="mt-2"><summary className="cursor-pointer text-xs text-white/50">Resultado{t.lastRun ? ` · ${fmt(t.lastRun)}` : ""}</summary><Markdown text={t.result} className="mt-2 text-xs leading-6 text-white/80" /></details>}
                        <div className="mt-2 flex gap-1">
                          <button type="button" disabled={running.includes(t.id)} onClick={() => void runTask(t.id)} className="code-action"><Play className="size-3" />{running.includes(t.id) ? "executando…" : "executar agora"}</button>
                          <button type="button" onClick={() => setTasks((cur) => cur.filter((x) => x.id !== t.id))} className="code-action"><Trash2 className="size-3" />apagar</button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}

        {view === "skills" && (
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            <h1 className="text-xl font-semibold">Skills do Kairo</h1>
            <p className="mb-4 mt-1 text-xs text-white/40">O Kairo ativa as skills automaticamente pelo assunto. Desligue as que não quiser.</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {KAIRO_SKILLS.map((s) => {
                const on = !disabled.includes(s.id);
                return (
                  <button key={s.id} type="button" onClick={() => setDisabled((cur) => on ? [...cur, s.id] : cur.filter((x) => x !== s.id))} className={cn("press flex items-start gap-3 rounded-2xl border p-3 text-left", on ? "border-violet-400/40 bg-violet-500/10" : "border-white/10 bg-white/[0.03] opacity-60")}>
                    <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border", on ? "border-violet-300 bg-violet-500" : "border-white/30")}>{on && <Check className="size-3" />}</span>
                    <span><span className="block text-sm font-medium">{s.label}</span><span className="block text-xs text-white/45">{s.description}</span></span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
