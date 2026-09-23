import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { loadRemoteModels } from "@/lib/load-models";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { HomeView } from "./home-view";
import { ChatView } from "./chat-view";
import { SettingsSheet } from "./settings";
import { LoginView } from "./login-view";
import { BotsView, BotCreationModal } from "./bots-view";
import { TermsModal } from "./terms-modal";
import { AuthModal } from "./auth-modal";
import { WelcomeOverlay } from "./welcome-overlay";
import { KairoDesktopShell } from "./kairo-desktop-shell";
import { ArtifactDetail, ArtifactsView, CodeView, ConversationsView, ProjectDetail, ProjectsView } from "./views";
import { InfoSheet, ModelPicker, UpgradeSheet, VoiceSheet } from "./sheets";
import { PersonaSheet } from "./persona-sheet";

export function ClaudeApp() {
  const [initialLoading, setInitialLoading] = useState(true);
  const hydrated = useApp((s) => s.hydrated);
  const authUser = useApp((s) => s.authUser);
  const welcomeUser = useApp((s) => s.welcomeUser);
  const clearWelcome = useApp((s) => s.clearWelcome);
  const view = useApp((s) => s.view);
  const sidebarOpen = useApp((s) => s.sidebarOpen);
  const appearance = useApp((s) => s.prefs.appearance);
  const botCreationOpen = useApp((s) => s.botCreationOpen);
  const editingBot = useApp((s) => s.editingBot);
  const authModalOpen = useApp((s) => s.authModalOpen);
  const authModalMode = useApp((s) => s.authModalMode);
  const closeAuthModal = useApp((s) => s.closeAuthModal);
  const setBotCreationOpen = useApp((s) => s.setBotCreationOpen);
  const setHydrated = useApp((s) => s.setHydrated);

  useEffect(() => {
    void Promise.resolve(useApp.persist.rehydrate()).then(() => {
      const state = useApp.getState();
      const conv = state.conversations.find((item) => item.id === state.currentId);
      if (conv && conv.messages.length > 0) useApp.setState({ view: "chat", hydrated: true });
      else setHydrated();
      void loadRemoteModels();
    });
  }, [setHydrated]);

  useEffect(() => {
    const root = document.documentElement;
    const apply = (value: string) => root.classList.toggle("dark", value !== "light");
    apply(appearance || "dark");
    if (appearance !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [appearance]);

  if (hydrated && (!authUser || !authUser.isLoggedIn)) return <div className="h-dvh w-full overflow-y-auto overflow-x-hidden bg-[#000000]"><LoginView /><TermsModal /></div>;

  return <KairoDesktopShell>
    <div className="flex h-full min-w-0 flex-1 overflow-hidden bg-bg">
      <Sidebar />
      <div className={cn("relative flex min-w-0 flex-1 flex-col transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]", sidebarOpen && "max-md:translate-x-[min(320px,86vw)]")}>
        <main className="min-h-0 min-w-0 flex-1">{view === "home" ? <HomeView /> : null}{view === "chat" ? <ChatView /> : null}{view === "bots" ? <BotsView /> : null}{view === "conversations" ? <ConversationsView /> : null}{view === "projects" ? <ProjectsView /> : null}{view === "project" ? <ProjectDetail /> : null}{view === "code" ? <CodeView /> : null}{view === "artifacts" ? <ArtifactsView /> : null}{view === "artifact" ? <ArtifactDetail /> : null}</main>
      </div>
      <SettingsSheet /><ModelPicker /><UpgradeSheet /><PersonaSheet /><VoiceSheet /><InfoSheet /><TermsModal />
      <AuthModal isOpen={authModalOpen} onClose={closeAuthModal} defaultMode={authModalMode} />
      {botCreationOpen ? <BotCreationModal editingBot={editingBot} onClose={() => setBotCreationOpen(false)} /> : null}
      {initialLoading ? <WelcomeOverlay user={authUser} onComplete={() => setInitialLoading(false)} /> : welcomeUser ? <WelcomeOverlay user={welcomeUser} onComplete={clearWelcome} /> : null}
    </div>
  </KairoDesktopShell>;
}
