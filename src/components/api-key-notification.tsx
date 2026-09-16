import { KeyRound } from "lucide-react";
import { useApp } from "@/lib/store";

export function ApiKeyNotification() {
  const prefs = useApp((s) => s.prefs);
  const openSettings = useApp((s) => s.openSettings);

  const provider = prefs.api.provider;
  const currentKey = prefs.api.keys[provider] ?? "";
  const hasKey = currentKey.trim().length > 0;

  // Don't show if key is already present
  if (hasKey) return null;

  return (
    <div className="mx-auto w-full max-w-2xl px-3 py-2 animate-in fade-in duration-200">
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#1c1d28]/90 border border-amber-500/40 p-3.5 text-amber-200 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20">
            <KeyRound className="size-5" />
          </div>
          <p className="text-[13.5px] font-medium leading-snug text-zinc-200">
            Coloque a sua API key nas configurações em API key e selecione o modelo que irá usar e comece a usar kairo IA
          </p>
        </div>
        <button
          type="button"
          onClick={() => openSettings("api")}
          className="press shrink-0 rounded-xl bg-amber-500 hover:bg-amber-400 px-3.5 py-2 text-[13px] font-semibold text-black transition-all shadow-md"
        >
          Configurações
        </button>
      </div>
    </div>
  );
}
