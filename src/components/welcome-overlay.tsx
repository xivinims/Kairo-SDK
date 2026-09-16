import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { loadRemoteModels } from "@/lib/load-models";
import { useApp } from "@/lib/store";
import type { AuthUser } from "@/lib/types";

interface WelcomeOverlayProps {
  user?: AuthUser | null;
  onComplete: () => void;
}

export function WelcomeOverlay({ user, onComplete }: WelcomeOverlayProps) {
  const [phase, setPhase] = useState<"loading" | "completed" | "fading">("loading");
  const prefs = useApp((s) => s.prefs);

  useEffect(() => {
    // Preload user data and models during the 2 seconds loading phase
    void loadRemoteModels();

    // After 1.8 seconds, complete the green circle ring
    const timer1 = setTimeout(() => {
      setPhase("completed");
    }, 1800);

    // After 2.5 seconds, start fading out overlay
    const timer2 = setTimeout(() => {
      setPhase("fading");
    }, 2500);

    // After 2.8 seconds, complete and unmount
    const timer3 = setTimeout(() => {
      onComplete();
    }, 2800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  const personas = prefs?.personas || [];
  const activePersona = personas.find(
    (p) => p.id === prefs?.activePersonaId && !p.isOriginal
  );

  const displayName = activePersona?.name || user?.name || prefs?.profile?.displayName;
  const displayAvatar = activePersona?.avatar || user?.avatar;

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#07080c] transition-opacity duration-300 ${
        phase === "fading" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="relative flex flex-col items-center text-center p-6">
        {/* Avatar Container with Spinning / Green Circle */}
        <div className="relative flex size-32 items-center justify-center">
          {/* SVG Animated Circular Ring */}
          <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 100 100">
            {/* Background track circle */}
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="4"
            />
            {/* Animated Ring */}
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke={phase === "completed" || phase === "fading" ? "#22c55e" : "#3b82f6"}
              strokeWidth="4"
              strokeDasharray="276"
              strokeDashoffset={phase === "completed" || phase === "fading" ? "0" : "80"}
              strokeLinecap="round"
              className={`transition-all duration-700 ease-out ${
                phase === "loading" ? "animate-spin origin-center duration-1000" : ""
              }`}
            />
          </svg>

          {/* User Photo or Kairo Logo in Center */}
          <div className="size-24 overflow-hidden rounded-full bg-[#181922] border-2 border-white/10 shadow-2xl flex items-center justify-center">
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt={displayName || "Perfil"}
                className="size-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="h-6 w-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                <span className="h-6 w-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
              </div>
            )}
          </div>

          {/* Green checkmark badge when complete */}
          {(phase === "completed" || phase === "fading") && (
            <div className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full bg-emerald-500 text-black shadow-lg animate-in zoom-in duration-200">
              <Check className="size-5 stroke-[3]" />
            </div>
          )}
        </div>

        {/* Welcome Text */}
        <div className="mt-6 space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {phase === "completed" || phase === "fading"
              ? displayName
                ? `Bem vindo, ${displayName}!`
                : "Kairo IA pronto!"
              : "Carregando seus dados..."}
          </h2>
          <p className="text-[14px] text-zinc-400 font-medium">
            {phase === "completed" || phase === "fading"
              ? "Sua sessão foi iniciada com sucesso"
              : "Preparando o Kairo IA para você"}
          </p>
        </div>
      </div>
    </div>
  );
}
