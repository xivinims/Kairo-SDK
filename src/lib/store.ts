import { create } from "zustand";
import { persist } from "zustand/middleware";
import { syncUserDataFromCloud, saveUserDataToCloud } from "./firestore-sync";
import type {
  AiProvider,
  Artifact,
  AuthUser,
  ChatMessage,
  ChatPersona,
  Conversation,
  CustomBot,
  MainView,
  Project,
  RemoteModel,
  SettingsPage,
} from "./types";
import { uid } from "./utils";

export interface UserProfile {
  displayName: string;
  age: string;
  gender: string;
  description: string;
}

export interface StoryPrefs {
  enabled: boolean;
  title: string;
  body: string;
  character: string;
}

export interface ApiPrefs {
  provider: AiProvider;
  keys: Partial<Record<AiProvider, string>>;
  groqFreeOnly: boolean;
}

export const DEFAULT_PERSONAS: ChatPersona[] = [];

export function getActivePersona(prefs: Prefs): ChatPersona {
  const list = Array.isArray(prefs.personas) ? prefs.personas : [];
  const found = list.find((p) => p.id === prefs.activePersonaId);
  if (found) return found;
  if (list.length > 0) return list[0];
  return {
    id: "",
    name: "Sem Persona",
    avatar: "",
    age: "",
    gender: "",
    bio: "",
    isOriginal: true,
  };
}

export interface Prefs {
  notifications: {
    replies: boolean;
    tips: boolean;
    product: boolean;
  };
  focus: {
    dnd: boolean;
    usageLimit: boolean;
  };
  privacy: {
    train: boolean;
    improve: boolean;
  };
  features: {
    artifacts: boolean;
    research: boolean;
    analysis: boolean;
  };
  appearance: "system" | "light" | "dark";
  language: "pt-BR" | "en";
  connectors: Record<string, boolean>;
  permissions: {
    camera: boolean;
    mic: boolean;
    photos: boolean;
  };
  profile: UserProfile;
  personas: ChatPersona[];
  activePersonaId: string;
  instructions: string;
  story: StoryPrefs;
  chatBg: string | null;
  api: ApiPrefs;
}

const defaultPrefs: Prefs = {
  notifications: { replies: true, tips: true, product: false },
  focus: { dnd: false, usageLimit: false },
  privacy: { train: false, improve: true },
  features: { artifacts: true, research: true, analysis: true },
  appearance: "dark",
  language: "pt-BR",
  connectors: {},
  permissions: { camera: true, mic: true, photos: true },
  profile: {
    displayName: "",
    age: "",
    gender: "",
    description: "",
  },
  personas: [],
  activePersonaId: "",
  instructions: "",
  story: { enabled: false, title: "", body: "", character: "" },
  chatBg: null,
  api: { provider: "grok", keys: {}, groqFreeOnly: true },
};

interface AppState {
  hydrated: boolean;
  authUser: AuthUser | null;
  welcomeUser: AuthUser | null;
  authModalOpen: boolean;
  authModalMode: "login" | "register";
  termsModalOpen: boolean;
  termsTab: "terms" | "privacy";
  view: MainView;
  sidebarOpen: boolean;
  settingsOpen: boolean;
  settingsPage: SettingsPage;
  modelPickerOpen: boolean;
  upgradeOpen: boolean;
  attachOpen: boolean;
  personaSheetOpen: boolean;
  personaSheetMode: "list" | "create" | "manage" | "edit";
  voiceOpen: boolean;
  infoOpen: boolean;
  botCreationOpen: boolean;
  editingBot: CustomBot | null;
  customBots: CustomBot[];
  activeBotId: string | null;
  model: string;
  remoteModels: RemoteModel[];
  conversations: Conversation[];
  currentId: string | null;
  projects: Project[];
  currentProjectId: string | null;
  artifacts: Artifact[];
  currentArtifactId: string | null;
  sending: boolean;
  prefs: Prefs;
  draft: string;

  setHydrated: () => void;
  setAuthUser: (u: AuthUser | null) => void;
  clearWelcome: () => void;
  openAuthModal: (mode?: "login" | "register") => void;
  closeAuthModal: () => void;
  logout: () => void;
  setTermsModalOpen: (open: boolean, tab?: "terms" | "privacy") => void;
  setTermsTab: (tab: "terms" | "privacy") => void;
  setDraft: (v: string) => void;
  setView: (v: MainView) => void;
  setSidebar: (open: boolean) => void;
  openSettings: (page?: SettingsPage) => void;
  closeSettings: () => void;
  setSettingsPage: (p: SettingsPage) => void;
  setModelPicker: (open: boolean) => void;
  setUpgrade: (open: boolean) => void;
  setAttach: (open: boolean) => void;
  setPersonaSheet: (
    open: boolean,
    mode?: "list" | "create" | "manage" | "edit",
  ) => void;
  setActivePersona: (id: string) => void;
  addPersona: (p: Omit<ChatPersona, "id">) => string;
  updatePersona: (id: string, p: Partial<ChatPersona>) => void;
  deletePersona: (id: string) => void;
  setVoice: (open: boolean) => void;
  setInfo: (open: boolean) => void;
  setModel: (m: string) => void;
  setRemoteModels: (m: RemoteModel[]) => void;
  setBotCreationOpen: (open: boolean, editingBot?: CustomBot | null) => void;
  openBotCreation: () => void;
  openBotEdit: (bot: CustomBot) => void;
  addBot: (b: Omit<CustomBot, "id" | "createdAt" | "messageCount">) => string;
  updateBot: (id: string, b: Partial<CustomBot>) => void;
  deleteBot: (id: string) => void;
  startBotChat: (botId: string) => string;
  newChat: (opts?: { temporary?: boolean; projectId?: string; botId?: string; title?: string }) => string;
  openConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  pinConversation: (id: string, pinned: boolean) => void;
  addUserMessage: (content: string) => { convId: string; messages: ChatMessage[] };
  finishAssistant: (convId: string, content: string) => void;
  failAssistant: (convId: string, message?: string) => void;
  setSending: (v: boolean) => void;
  addProject: (name: string, description: string) => string;
  openProject: (id: string) => void;
  deleteProject: (id: string) => void;
  addArtifact: (a: Omit<Artifact, "id" | "createdAt">) => void;
  openArtifact: (id: string) => void;
  deleteArtifact: (id: string) => void;
  patchPrefs: (p: Partial<Prefs> | ((prev: Prefs) => Prefs)) => void;
  resetAll: () => void;
}

function titleFrom(text: string) {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > 42 ? `${t.slice(0, 42)}…` : t || "Novo bate-papo";
}

function mergePrefs(saved: Prefs | undefined): Prefs {
  if (!saved) return defaultPrefs;
  const rawPersonas = Array.isArray(saved.personas) ? saved.personas : [];
  // Keep only personas created by the user (filter out legacy hardcoded ones)
  const personas = rawPersonas.filter(
    (p) => p.id !== "original" && p.id !== "raphael" && p.id !== "kakeru",
  );
  const activePersonaId = personas.some((p) => p.id === saved.activePersonaId)
    ? saved.activePersonaId
    : personas[0]?.id || "";

  const profile = { ...defaultPrefs.profile, ...saved.profile };
  if (
    profile.displayName === "Murilo" ||
    profile.displayName === "Muri" ||
    profile.displayName === "Murilo Silva da Costa" ||
    profile.displayName === "Kakeru"
  ) {
    profile.displayName = "";
  }

  return {
    ...defaultPrefs,
    ...saved,
    notifications: { ...defaultPrefs.notifications, ...saved.notifications },
    focus: { ...defaultPrefs.focus, ...saved.focus },
    privacy: { ...defaultPrefs.privacy, ...saved.privacy },
    features: { ...defaultPrefs.features, ...saved.features },
    permissions: { ...defaultPrefs.permissions, ...saved.permissions },
    profile,
    personas,
    activePersonaId,
    story: { ...defaultPrefs.story, ...saved.story },
    api: {
      ...defaultPrefs.api,
      ...saved.api,
      keys: { ...defaultPrefs.api.keys, ...saved.api?.keys },
    },
    connectors: saved.connectors ?? {},
    instructions: saved.instructions ?? "",
    chatBg: saved.chatBg ?? null,
  };
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      authUser: null,
      welcomeUser: null,
      authModalOpen: false,
      authModalMode: "login",
      termsModalOpen: false,
      termsTab: "terms",
      view: "home",
      sidebarOpen: false,
      settingsOpen: false,
      settingsPage: "index",
      modelPickerOpen: false,
      upgradeOpen: false,
      attachOpen: false,
      personaSheetOpen: false,
      personaSheetMode: "list",
      voiceOpen: false,
      infoOpen: false,
      botCreationOpen: false,
      editingBot: null,
      customBots: [],
      activeBotId: null,
      model: "none",
      remoteModels: [],
      conversations: [],
      currentId: null,
      projects: [],
      currentProjectId: null,
      artifacts: [],
      currentArtifactId: null,
      sending: false,
      prefs: defaultPrefs,
      draft: "",

      setHydrated: () => set({ hydrated: true }),
      setAuthUser: (authUser) => {
        const prev = get().authUser;
        // If user just logged in (transitioned from null to logged in), trigger welcome overlay
        if (authUser && (!prev || prev.id !== authUser.id)) {
          set({ authUser, welcomeUser: authUser });
          void syncUserDataFromCloud(authUser.id);
        } else if (authUser) {
          set({ authUser });
          void syncUserDataFromCloud(authUser.id);
        } else {
          set({ authUser });
        }
      },
      clearWelcome: () => set({ welcomeUser: null }),
      openAuthModal: (mode = "login") => set({ authModalOpen: true, authModalMode: mode }),
      closeAuthModal: () => set({ authModalOpen: false }),
      logout: () => set({ authUser: null }),
      setTermsModalOpen: (termsModalOpen, tab) =>
        set({ termsModalOpen, ...(tab ? { termsTab: tab } : {}) }),
      setTermsTab: (termsTab) => set({ termsTab }),
      setDraft: (draft) => set({ draft }),
      setView: (view) => set({ view, sidebarOpen: false }),
      setSidebar: (sidebarOpen) => set({ sidebarOpen }),
      openSettings: (page = "index") =>
        set({ settingsOpen: true, settingsPage: page, sidebarOpen: false }),
      closeSettings: () => set({ settingsOpen: false, settingsPage: "index" }),
      setSettingsPage: (settingsPage) => set({ settingsPage }),
      setModelPicker: (modelPickerOpen) => set({ modelPickerOpen }),
      setUpgrade: (upgradeOpen) => set({ upgradeOpen }),
      setAttach: (attachOpen) => set({ attachOpen }),
      setPersonaSheet: (personaSheetOpen, mode = "list") =>
        set({ personaSheetOpen, personaSheetMode: mode }),
      setBotCreationOpen: (botCreationOpen, editingBot = null) =>
        set({ botCreationOpen, editingBot: botCreationOpen ? (editingBot ?? null) : null }),
      openBotCreation: () => set({ botCreationOpen: true, editingBot: null }),
      openBotEdit: (bot) => set({ botCreationOpen: true, editingBot: bot }),
      setActivePersona: (id) =>
        set((s) => {
          const list =
            Array.isArray(s.prefs.personas) && s.prefs.personas.length > 0
              ? s.prefs.personas
              : [];
          const persona = list.find((p) => p.id === id) || list[0];
          const newProfile =
            persona && !persona.isOriginal
              ? {
                  displayName: persona.name,
                  age: persona.age,
                  gender: persona.gender,
                  description: persona.bio,
                }
              : {
                  displayName: "",
                  age: "",
                  gender: "",
                  description: "",
                };
          return {
            prefs: {
              ...s.prefs,
              activePersonaId: id,
              profile: newProfile,
            },
          };
        }),
      addPersona: (p) => {
        const id = uid();
        const newPersona: ChatPersona = { ...p, id };
        set((s) => ({
          prefs: {
            ...s.prefs,
            personas: [...s.prefs.personas, newPersona],
            activePersonaId: id,
            profile: {
              displayName: newPersona.name,
              age: newPersona.age,
              gender: newPersona.gender,
              description: newPersona.bio,
            },
          },
        }));
        const uidVal = get().authUser?.id;
        if (uidVal) void saveUserDataToCloud(uidVal);
        return id;
      },
      updatePersona: (id, p) => {
        set((s) => {
          const personas = s.prefs.personas.map((item) =>
            item.id === id ? { ...item, ...p } : item,
          );
          const isActive = s.prefs.activePersonaId === id;
          const updated = personas.find((item) => item.id === id);
          return {
            prefs: {
              ...s.prefs,
              personas,
              profile:
                isActive && updated && !updated.isOriginal
                  ? {
                      displayName: updated.name,
                      age: updated.age,
                      gender: updated.gender,
                      description: updated.bio,
                    }
                  : s.prefs.profile,
            },
          };
        });
        const uidVal = get().authUser?.id;
        if (uidVal) void saveUserDataToCloud(uidVal);
      },
      deletePersona: (id) => {
        set((s) => {
          const personas = s.prefs.personas.filter((item) => item.id !== id);
          const activePersonaId =
            s.prefs.activePersonaId === id ? "" : s.prefs.activePersonaId;
          const remainingActive = personas.find((x) => x.id === activePersonaId);
          return {
            prefs: {
              ...s.prefs,
              personas,
              activePersonaId,
              profile:
                remainingActive && !remainingActive.isOriginal
                  ? {
                      displayName: remainingActive.name,
                      age: remainingActive.age,
                      gender: remainingActive.gender,
                      description: remainingActive.bio,
                    }
                  : {
                      displayName: "",
                      age: "",
                      gender: "",
                      description: "",
                    },
            },
          };
        });
        const uidVal = get().authUser?.id;
        if (uidVal) void saveUserDataToCloud(uidVal);
      },
      setVoice: (voiceOpen) => set({ voiceOpen }),
      setInfo: (infoOpen) => set({ infoOpen }),
      setModel: (model) => set({ model, modelPickerOpen: false }),
      setRemoteModels: (remoteModels) => set({ remoteModels }),

      addBot: (b) => {
        const id = uid();
        const newBot: CustomBot = {
          ...b,
          id,
          createdAt: Date.now(),
          messageCount: 0,
        };
        set((s) => ({
          customBots: [newBot, ...s.customBots],
          botCreationOpen: false,
          editingBot: null,
        }));
        const uidVal = get().authUser?.id;
        if (uidVal) void saveUserDataToCloud(uidVal);
        return id;
      },

      updateBot: (id, b) => {
        set((s) => {
          const customBots = s.customBots.map((bot) =>
            bot.id === id ? { ...bot, ...b } : bot,
          );
          const conversations = b.name
            ? s.conversations.map((c) =>
                c.botId === id ? { ...c, title: b.name! } : c,
              )
            : s.conversations;
          return {
            customBots,
            conversations,
            botCreationOpen: false,
            editingBot: null,
          };
        });
        const uidVal = get().authUser?.id;
        if (uidVal) void saveUserDataToCloud(uidVal);
      },

      deleteBot: (id) => {
        set((s) => ({
          customBots: s.customBots.filter((bot) => bot.id !== id),
          activeBotId: s.activeBotId === id ? null : s.activeBotId,
          conversations: s.conversations.filter((c) => c.botId !== id),
          currentId:
            s.conversations.find((c) => c.id === s.currentId)?.botId === id
              ? null
              : s.currentId,
          view:
            s.conversations.find((c) => c.id === s.currentId)?.botId === id
              ? "home"
              : s.view,
        }));
        const uidVal = get().authUser?.id;
        if (uidVal) void saveUserDataToCloud(uidVal);
      },

      startBotChat: (botId) => {
        const bot = get().customBots.find((b) => b.id === botId);
        if (!bot) return "";
        // Persistent 1:1 binding: check if existing conversation exists for this bot
        const existing = get().conversations.find((c) => c.botId === botId);
        if (existing) {
          set({
            currentId: existing.id,
            activeBotId: bot.id,
            view: "chat",
            sidebarOpen: false,
            draft: "",
          });
          return existing.id;
        }

        // Only create new conversation if none exists (e.g. first time or previous was deleted)
        const id = uid();
        const conv: Conversation = {
          id,
          title: bot.name,
          messages: bot.welcomeMsg
            ? [
                {
                  id: uid(),
                  role: "assistant",
                  content: bot.welcomeMsg,
                  createdAt: Date.now(),
                },
              ]
            : [],
          updatedAt: Date.now(),
          botId: bot.id,
        };
        set((s) => ({
          conversations: [conv, ...s.conversations],
          currentId: id,
          activeBotId: bot.id,
          view: "chat",
          sidebarOpen: false,
          draft: "",
        }));
        return id;
      },

      newChat: (opts) => {
        if (opts?.botId) {
          return get().startBotChat(opts.botId);
        }
        // Remove any unused empty conversations from state
        set((s) => ({
          conversations: s.conversations.filter((c) => c.messages.length > 0),
          currentId: null,
          activeBotId: null,
          view: "home",
          sidebarOpen: false,
          draft: "",
        }));
        return "";
      },

      openConversation: (id) => {
        const conv = get().conversations.find((c) => c.id === id);
        set({
          currentId: id,
          activeBotId: conv?.botId || null,
          view: conv && conv.messages.length > 0 ? "chat" : "home",
          sidebarOpen: false,
        });
      },

      deleteConversation: (id) =>
        set((s) => {
          const conversations = s.conversations.filter((c) => c.id !== id);
          const currentId = s.currentId === id ? null : s.currentId;
          return {
            conversations,
            currentId,
            activeBotId: currentId ? s.activeBotId : null,
            view: currentId ? s.view : "home",
          };
        }),

      renameConversation: (id, title) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, title } : c,
          ),
        })),

      pinConversation: (id, pinned) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, pinned } : c,
          ),
        })),

      addUserMessage: (content) => {
        const text = content.trim();
        let convId = get().currentId;
        const msg: ChatMessage = {
          id: uid(),
          role: "user",
          content: text,
          createdAt: Date.now(),
        };
        if (!convId) {
          convId = uid();
          const conv: Conversation = {
            id: convId,
            title: titleFrom(text),
            messages: [msg],
            updatedAt: Date.now(),
          };
          set((s) => ({
            conversations: [conv, ...s.conversations],
            currentId: convId,
            view: "chat",
            draft: "",
            sending: true,
          }));
          return { convId, messages: [msg] };
        }
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  title:
                    c.messages.length === 0 ? titleFrom(text) : c.title,
                  messages: [...c.messages, msg],
                  updatedAt: Date.now(),
                }
              : c,
          ),
          view: "chat",
          draft: "",
          sending: true,
        }));
        const conv = get().conversations.find((c) => c.id === convId);
        return { convId, messages: conv?.messages ?? [msg] };
      },

      finishAssistant: (convId, content) => {
        const msg: ChatMessage = {
          id: uid(),
          role: "assistant",
          content,
          createdAt: Date.now(),
        };
        set((s) => ({
          sending: false,
          conversations: s.conversations.map((c) =>
            c.id === convId
              ? { ...c, messages: [...c.messages, msg], updatedAt: Date.now() }
              : c,
          ),
        }));
      },

      failAssistant: (convId, message) => {
        const msg: ChatMessage = {
          id: uid(),
          role: "assistant",
          content:
            message ||
            "Não consegui responder agora. Verifique a chave de API em Configurações → API.",
          createdAt: Date.now(),
        };
        set((s) => ({
          sending: false,
          conversations: s.conversations.map((c) =>
            c.id === convId
              ? { ...c, messages: [...c.messages, msg], updatedAt: Date.now() }
              : c,
          ),
        }));
      },

      setSending: (sending) => set({ sending }),

      addProject: (name, description) => {
        const id = uid();
        const project: Project = {
          id,
          name,
          description,
          createdAt: Date.now(),
        };
        set((s) => ({
          projects: [project, ...s.projects],
          currentProjectId: id,
          view: "project",
        }));
        return id;
      },

      openProject: (id) =>
        set({ currentProjectId: id, view: "project", sidebarOpen: false }),

      deleteProject: (id) =>
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          view: s.currentProjectId === id ? "projects" : s.view,
          currentProjectId:
            s.currentProjectId === id ? null : s.currentProjectId,
        })),

      addArtifact: (a) => {
        const art: Artifact = { ...a, id: uid(), createdAt: Date.now() };
        set((s) => ({ artifacts: [art, ...s.artifacts] }));
      },

      openArtifact: (id) =>
        set({ currentArtifactId: id, view: "artifact", sidebarOpen: false }),

      deleteArtifact: (id) =>
        set((s) => ({
          artifacts: s.artifacts.filter((a) => a.id !== id),
          view: s.currentArtifactId === id ? "artifacts" : s.view,
          currentArtifactId:
            s.currentArtifactId === id ? null : s.currentArtifactId,
        })),

      patchPrefs: (p) =>
        set((s) => ({
          prefs: typeof p === "function" ? p(s.prefs) : { ...s.prefs, ...p },
        })),

      resetAll: () =>
        set({
          conversations: [],
          currentId: null,
          projects: [],
          artifacts: [],
          view: "home",
          settingsOpen: false,
          draft: "",
        }),
    }),
    {
      name: "claude-muri",
      skipHydration: true,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        return {
          ...current,
          ...p,
          authUser: p.authUser ?? current.authUser,
          customBots: Array.isArray(p.customBots) ? p.customBots : current.customBots,
          prefs: mergePrefs(p.prefs),
          model: typeof p.model === "string" ? p.model : current.model,
        };
      },
      partialize: (s) => ({
        authUser: s.authUser,
        customBots: s.customBots,
        conversations: s.conversations.filter((c) => !c.temporary),
        currentId: s.currentId,
        projects: s.projects,
        artifacts: s.artifacts,
        model: s.model,
        prefs: s.prefs,
      }),
    },
  ),
);

export function currentConversation() {
  const { conversations, currentId } = useApp.getState();
  return conversations.find((c) => c.id === currentId) ?? null;
}
