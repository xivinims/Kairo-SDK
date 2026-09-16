import { useEffect, useState } from "react";
import {
  Check,
  Mic,
  X,
} from "lucide-react";
import { ClaudeMark, WaveformIcon } from "./claude-mark";
import { useApp } from "@/lib/store";
import { loadRemoteModels } from "@/lib/load-models";
import { visibleModels } from "@/lib/types";
import { cn } from "@/lib/utils";

function Overlay({
  open,
  onClose,
  children,
  labelledBy,
  panelClassName,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  labelledBy?: string;
  panelClassName?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <button
        type="button"
        aria-label="Fechar"
        className="backdrop-in absolute inset-0 bg-fg/30"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={cn(
          "sheet-in relative z-10 w-full max-w-[430px] overflow-hidden rounded-t-sheet md:rounded-sheet",
          panelClassName ?? "bg-bg",
        )}
        style={{ boxShadow: "var(--shadow-sheet)" }}
      >
        {children}
      </div>
    </div>
  );
}

export function ModelPicker() {
  const open = useApp((s) => s.modelPickerOpen);
  const setOpen = useApp((s) => s.setModelPicker);
  const model = useApp((s) => s.model);
  const setModel = useApp((s) => s.setModel);
  const remote = useApp((s) => s.remoteModels);
  const openSettings = useApp((s) => s.openSettings);
  const models = visibleModels(remote);

  useEffect(() => {
    if (open) void loadRemoteModels();
  }, [open]);

  return (
    <Overlay
      open={open}
      onClose={() => setOpen(false)}
      labelledBy="model-title"
      panelClassName="bg-[#121318] border border-white/10"
    >
      <div className="p-4 text-white">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="model-title" className="text-[15px] font-semibold text-white">
            Selecionar Modelo de IA
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-[13px] text-zinc-400 hover:text-white"
          >
            Fechar
          </button>
        </div>
        <div
          role="listbox"
          aria-label="Modelo"
          className="no-scrollbar max-h-[55vh] overflow-y-auto divide-y divide-white/5 rounded-xl bg-white/5"
        >
          {models.map((m) => {
            const isSelected = model === m.id;
            return (
              <button
                key={m.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  if (m.id === "none") {
                    setOpen(false);
                    openSettings("api");
                  } else {
                    setModel(m.id);
                    setOpen(false);
                  }
                }}
                className={cn(
                  "flex w-full items-center justify-between px-3.5 py-3 text-left transition-colors",
                  isSelected ? "bg-white/10 text-white" : "hover:bg-white/5 text-zinc-200",
                )}
              >
                <div>
                  <span className="block text-[14.5px] font-medium">{m.name}</span>
                  {m.blurb && (
                    <span className="block text-[12px] text-zinc-400">{m.blurb}</span>
                  )}
                </div>
                {isSelected ? (
                  <Check className="size-4 text-blue-400 shrink-0 ml-2" strokeWidth={2.5} />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </Overlay>
  );
}

export function UpgradeSheet() {
  const open = useApp((s) => s.upgradeOpen);
  const setOpen = useApp((s) => s.setUpgrade);

  return (
    <Overlay open={open} onClose={() => setOpen(false)} labelledBy="up-title">
      <div className="px-5 pb-8 pt-4">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted-2" />
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 id="up-title" className="font-display text-[28px] font-medium">
              Obter mais Kairo
            </h2>
            <p className="mt-1 text-[15px] text-fg-muted">
              Faça upgrade para mais uso e recursos
            </p>
          </div>
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setOpen(false)}
            className="press flex size-9 items-center justify-center rounded-full bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>
        <ul className="mb-5 space-y-2.5 text-[15px] text-fg">
          {[
            "Mais mensagens por dia",
            "Acesso a Opus e esforço alto",
            "Projetos e artefatos ilimitados",
            "Prioridade nos horários de pico",
          ].map((t) => (
            <li key={t} className="flex gap-2">
              <ClaudeMark className="mt-0.5 size-4 shrink-0 text-accent" />
              {t}
            </li>
          ))}
        </ul>
        <div className="rounded-group bg-surface p-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-[16px] font-semibold">Kairo Pro</span>
            <span className="text-[16px] font-medium">US$ 20/mês</span>
          </div>
          <p className="mb-4 text-[13px] text-fg-muted">Cancele quando quiser</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="press flex h-12 w-full items-center justify-center rounded-pill bg-ink text-[16px] font-medium text-surface"
          >
            Fazer upgrade
          </button>
        </div>
      </div>
    </Overlay>
  );
}

export function VoiceSheet() {
  const open = useApp((s) => s.voiceOpen);
  const setOpen = useApp((s) => s.setVoice);
  const setDraft = useApp((s) => s.setDraft);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");

  useEffect(() => {
    if (!open) {
      setListening(false);
      setHeard("");
    }
  }, [open]);

  function start() {
    const w = window as unknown as {
      SpeechRecognition?: new () => Rec;
      webkitSpeechRecognition?: new () => Rec;
    };
    const Speech = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Speech) {
      setHeard("O microfone não está disponível neste navegador.");
      return;
    }
    const rec = new Speech();
    rec.lang = "pt-BR";
    rec.interimResults = true;
    rec.onresult = (ev) => {
      const t = ev.results[0]?.[0]?.transcript ?? "";
      setHeard(t);
    };
    setListening(true);
    rec.start();
  }

  return (
    <Overlay open={open} onClose={() => setOpen(false)} labelledBy="voice-title">
      <div className="flex flex-col items-center px-6 pb-10 pt-6">
        <h2 id="voice-title" className="font-display text-[24px] font-medium">
          Fale com o Kairo
        </h2>
        <p className="mt-1 text-[14px] text-fg-muted">
          {listening ? "Ouvindo…" : "Toque no microfone para começar"}
        </p>
        <ClaudeMark
          thinking={listening}
          className="my-8 size-16 text-accent"
        />
        <p className="mb-8 min-h-12 text-center text-[16px] text-fg">
          {heard}
        </p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="press flex size-14 items-center justify-center rounded-full bg-muted"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
          <button
            type="button"
            onClick={start}
            className="press flex size-16 items-center justify-center rounded-full bg-ink text-surface"
            aria-label="Ouvir"
          >
            {listening ? (
              <WaveformIcon className="size-7" />
            ) : (
              <Mic className="size-7" />
            )}
          </button>
          <button
            type="button"
            disabled={!heard}
            onClick={() => {
              if (heard) setDraft(heard);
              setOpen(false);
            }}
            className="press flex h-14 items-center rounded-full bg-muted px-5 text-[15px] font-medium disabled:opacity-40"
          >
            Usar texto
          </button>
        </div>
      </div>
    </Overlay>
  );
}

export function InfoSheet() {
  const open = useApp((s) => s.infoOpen);
  const setOpen = useApp((s) => s.setInfo);

  return (
    <Overlay open={open} onClose={() => setOpen(false)} labelledBy="info-title">
      <div className="px-6 pb-8 pt-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="info-title" className="text-[18px] font-semibold">
            Sobre
          </h2>
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setOpen(false)}
            className="press flex size-9 items-center justify-center rounded-full bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex flex-col items-center py-4">
          <ClaudeMark className="mb-3 size-12 text-accent" />
          <p className="font-display text-[28px] font-medium">Kairo</p>
          <p className="mt-1 text-[14px] text-fg-muted">Versão 1.0 · iOS</p>
        </div>
        <p className="text-[15px] leading-relaxed text-fg-muted">
          Assistente de IA para conversar, escrever, programar e criar artefatos.
          Esta é uma recriação fiel da experiência móvel, em português.
        </p>
      </div>
    </Overlay>
  );
}

type Rec = {
  lang: string;
  interimResults: boolean;
  start: () => void;
  onresult: ((ev: { results: { 0?: { 0?: { transcript?: string } } } }) => void) | null;
};

