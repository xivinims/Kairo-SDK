import { BrainCircuit, ChevronDown, ListChecks, Sparkles, WandSparkles } from "lucide-react";
import { detectKairoSkills, KAIRO_SKILLS } from "@/lib/kairo-agent";
import { useApp } from "@/lib/store";

const skillLabels: Record<string, string> = { story: "Story", rpg: "RPG", character: "Personagem", worldbuilding: "Mundo", code: "Código", research: "Pesquisa", general: "Kairo" };

export function KairoGlassPanel() {
  const draft = useApp((state) => state.draft);
  const sending = useApp((state) => state.sending);
  const skills = detectKairoSkills(draft || "conversa geral").slice(0, 3);
  const steps = sending ? ["Entendendo pedido", "Executando skill", "Verificando resultado"] : ["Pronto para entender", "Escolhe skills automaticamente", "Valida antes de responder"];

  return (
    <section aria-label="Kairo Agent" className="kairo-glass-panel relative mx-auto mb-3 w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/[0.14] bg-white/[0.07] p-3 text-white shadow-[0_24px_80px_rgba(0,0,0,0.3)] backdrop-blur-2xl backdrop-saturate-150">
      <div className="pointer-events-none absolute -left-12 -top-16 size-36 rounded-full bg-cyan-300/20 blur-3xl" /><div className="pointer-events-none absolute -bottom-20 right-0 size-44 rounded-full bg-violet-400/20 blur-3xl" />
      <div className="relative flex items-center gap-2"><div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 shadow-inner shadow-white/10"><WandSparkles className="size-[17px] text-cyan-100" /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="text-[13px] font-semibold">Kairo Agent</span><span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-0.5 text-[10px] text-emerald-100"><span className="size-1.5 rounded-full bg-emerald-300" /> online</span></div><p className="truncate text-[11px] text-white/50">Plano resumido, skills e verificação</p></div><button type="button" aria-label="Abrir opções" className="press flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.07] text-white/70 transition hover:bg-white/[0.14]"><ChevronDown className="size-4" /></button></div>
      <div className="relative mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar"><div className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-black/15 px-2.5 py-1.5 text-[11px] text-white/65"><BrainCircuit className="size-3.5 text-cyan-200" />{sending ? "verificando" : "dupla verificação"}</div>{skills.map((skill) => <span key={skill} title={KAIRO_SKILLS[skill].description} className="shrink-0 rounded-full border border-white/10 bg-white/[0.08] px-2.5 py-1.5 text-[11px] text-white/70">{skillLabels[skill] ?? skill}</span>)}<Sparkles className="ml-auto size-4 shrink-0 text-violet-200/80" /></div>
      <div className="relative mt-2.5 grid grid-cols-3 gap-1.5 border-t border-white/10 pt-2.5">{steps.map((step, index) => <div key={step} className="flex min-w-0 items-center gap-1 text-[10px] text-white/45"><span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-white/10 text-[9px] text-white/70">{index + 1}</span><span className="truncate">{step}</span></div>)}</div>
      <div className="relative mt-2 flex items-center gap-1 text-[10px] text-white/35"><ListChecks className="size-3.5" /> O raciocínio mostrado é um resumo operacional, não a cadeia privada do modelo.</div>
    </section>
  );
}
