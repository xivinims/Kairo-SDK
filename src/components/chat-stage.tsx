import { KairoGlassPanel } from "./kairo-glass-panel";
import { KairoCommandSandbox } from "./kairo-command-sandbox";
import { useApp } from "@/lib/store";

export function ChatStage({ children }: { children: React.ReactNode }) {
  const chatBg = useApp((s) => s.prefs.chatBg);
  const currentId = useApp((s) => s.currentId);
  const conversations = useApp((s) => s.conversations);
  const customBots = useApp((s) => s.customBots);
  const conv = conversations.find((c) => c.id === currentId);
  const bot = conv?.botId ? customBots.find((b) => b.id === conv.botId) : null;
  const activeBg = bot?.photo || chatBg;

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-[#080a0f]">
      {activeBg ? <><img src={activeBg} alt={bot?.name || ""} className="pointer-events-none absolute inset-0 size-full object-cover" /><div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-black/55" /></> : <><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(72,126,255,0.22),_transparent_58%),linear-gradient(145deg,#111927_0%,#0b0d14_48%,#07080c_100%)]" /><div className="pointer-events-none absolute -left-32 top-24 size-80 rounded-full bg-blue-500/10 blur-3xl" /><div className="pointer-events-none absolute -right-28 bottom-20 size-96 rounded-full bg-violet-500/10 blur-3xl" /></>}
      <div className="relative z-10 flex h-full min-h-0 flex-col"><div className="px-2 pt-2 sm:px-4 sm:pt-3"><KairoGlassPanel /></div>{children}<div className="px-2 sm:px-4"><KairoCommandSandbox /></div></div>
    </div>
  );
}
