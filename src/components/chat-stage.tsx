import { useApp } from "@/lib/store";

export function ChatStage({ children }: { children: React.ReactNode }) {
  const chatBg = useApp((s) => s.prefs.chatBg);
  const currentId = useApp((s) => s.currentId);
  const conversations = useApp((s) => s.conversations);
  const customBots = useApp((s) => s.customBots);

  const conv = conversations.find((c) => c.id === currentId);
  const bot = conv?.botId ? customBots.find((b) => b.id === conv.botId) : null;
  // Use bot photo or user custom chat background
  const activeBg = bot?.photo || chatBg;

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-[#080a0f]">
      {activeBg ? (
        <>
          <img
            src={activeBg}
            alt={bot?.name || ""}
            className="pointer-events-none absolute inset-0 size-full object-cover"
          />
          {/* Subtle soft gradient at top and bottom for contrast with top-bar & input */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/35" />
        </>
      ) : (
        <>
          {/* Gradient background: Dark slate blue (blue-gray) at top, charcoal gray middle, deep dark bottom */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#1a2536] via-[#121722] to-[#08090d]" />
          {/* Soft ambient radial glow in upper middle */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.14),_transparent_70%)]" />
        </>
      )}
      <div className="relative z-10 flex h-full min-h-0 flex-col">{children}</div>
    </div>
  );
}
