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
import {
  ArtifactDetail,
  ArtifactsView,
  CodeView,
  ConversationsView,
  ProjectDetail,
  ProjectsView,
} from "./views";
import {
  InfoSheet,
  ModelPicker,
  UpgradeSheet,
  VoiceSheet,
} from "./sheets";
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
      const s = useApp.getState();
      const conv = s.conversations.find((c) => c.id === s.currentId);
      if (conv && conv.messages.length > 0) {
        useApp.setState({ view: "chat", hydrated: true });
      } else {
        setHydrated();
      }
      void loadRemoteModels();
    });
  }, [setHydrated]);

  useEffect(() => {
    const root = document.documentElement;
    const apply = (a: string) => {
      const dark = a !== "light";
      root.classList.toggle("dark", dark);
    };
    apply(appearance || "dark");
    if (appearance !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [appearance]);

  // Show login screen if user is not authenticated
  if (hydrated && (!authUser || !authUser.isLoggedIn)) {
    return (
      <div className="h-dvh w-full overflow-y-auto overflow-x-hidden bg-[#000000]">
        <LoginView />
        <TermsModal />
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-bg">
      <Sidebar />
      <div
        className={cn(
          "relative flex min-w-0 flex-1 flex-col transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
          sidebarOpen && "max-md:translate-x-[min(320px,86vw)]",
        )}
      >
        <main className="min-h-0 min-w-0 flex-1">
          {view === "home" ? <HomeView /> : null}
          {view === "chat" ? <ChatView /> : null}
          {view === "bots" ? <BotsView /> : null}
          {view === "conversations" ? <ConversationsView /> : null}
          {view === "projects" ? <ProjectsView /> : null}
          {view === "project" ? <ProjectDetail /> : null}
          {view === "code" ? <CodeView /> : null}
          {view === "artifacts" ? <ArtifactsView /> : null}
          {view === "artifact" ? <ArtifactDetail /> : null}
        </main>
      </div>
      <SettingsSheet />
      <ModelPicker />
      <UpgradeSheet />
      <PersonaSheet />
      <VoiceSheet />
      <InfoSheet />
      <TermsModal />
      <AuthModal
        isOpen={authModalOpen}
        onClose={closeAuthModal}
        defaultMode={authModalMode}
      />
      {botCreationOpen && (
        <BotCreationModal
          editingBot={editingBot}
          onClose={() => setBotCreationOpen(false)}
        />
      )}
      {initialLoading ? (
        <WelcomeOverlay
          user={authUser}
          onComplete={() => setInitialLoading(false)}
        />
      ) : welcomeUser ? (
        <WelcomeOverlay user={welcomeUser} onComplete={clearWelcome} />
      ) : null}
    </div>
  );
}
