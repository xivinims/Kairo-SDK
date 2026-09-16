import { useEffect, useState } from "react";
import { AnimatedFace } from "./animated-face";
import { ChatStage } from "./chat-stage";
import { Composer } from "./composer";
import { TopBar } from "./top-bar";
import { ApiKeyNotification } from "./api-key-notification";
import { useApp } from "@/lib/store";
import { USER } from "@/lib/types";
import { greetingForHour } from "@/lib/utils";

export function HomeView() {
  const [greet, setGreet] = useState("Boa tarde");
  const authUser = useApp((s) => s.authUser);
  const prefs = useApp((s) => s.prefs);

  useEffect(() => {
    setGreet(greetingForHour(new Date().getHours()));
  }, []);

  const personas = prefs.personas || [];
  const activePersona = personas.find(
    (p) => p.id === prefs.activePersonaId && !p.isOriginal
  );

  let headerText = "";
  if (activePersona && activePersona.name.trim()) {
    headerText = `Bem vindo, ${activePersona.name.trim()}`;
  } else {
    const rawName = authUser?.name?.trim() || prefs.profile.displayName?.trim() || USER.firstName;
    // Extract first name for a friendly greeting if full name is provided
    const firstName = rawName.split(" ")[0] || rawName;
    headerText = `${greet}, ${firstName}`;
  }

  return (
    <ChatStage>
      <TopBar />

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6">
        <div className="greeting-in flex flex-col items-center">
          <AnimatedFace className="mb-4" size="md" lookAngle="right" />
          <h2 className="font-display text-center text-[26px] font-medium leading-[1.15] tracking-[-0.02em] text-white md:text-[28px]">
            {headerText}
          </h2>
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl px-2 sm:px-4 pb-[max(16px,calc(env(safe-area-inset-bottom)+12px))] flex flex-col gap-2">
        <ApiKeyNotification />
        <Composer />
      </div>
    </ChatStage>
  );
}
