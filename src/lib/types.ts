export type Role = "user" | "assistant";

export interface CustomBot {
  id: string;
  name: string;
  gender: string;
  intro?: string;
  personality: string;
  welcomeMsg?: string;
  scenario?: string;
  instructions?: string;
  storyMode?: boolean;
  storyTitle?: string;
  storyBody?: string;
  storyCharacter?: string;
  likes?: string;
  tags?: string[];
  photo: string;
  messageCount?: number;
  createdAt: number;
}

export interface ChatPersona {
  id: string;
  name: string;
  avatar: string;
  age: string;
  gender: string;
  bio: string;
  isOriginal?: boolean;
}

export type MainView =
  | "home"
  | "chat"
  | "conversations"
  | "projects"
  | "project"
  | "code"
  | "artifacts"
  | "artifact"
  | "bots";

export type SettingsPage =
  | "index"
  | "profile"
  | "billing"
  | "notifications"
  | "focus"
  | "privacy"
  | "shared"
  | "features"
  | "connectors"
  | "permissions"
  | "appearance"
  | "language"
  | "instructions"
  | "story"
  | "api"
  | "background"
  | "about";

export type AiProvider =
  | "grok"
  | "openai"
  | "gemini"
  | "groq"
  | "anthropic"
  | "openrouter";

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
  temporary?: boolean;
  projectId?: string;
  pinned?: boolean;
  botId?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: number;
}

export interface Artifact {
  id: string;
  title: string;
  kind: "code" | "doc" | "html";
  language?: string;
  content: string;
  conversationId?: string;
  createdAt: number;
}

export interface RemoteModel {
  id: string;
  name: string;
  blurb?: string;
}

export const NONE_MODEL: RemoteModel = {
  id: "none",
  name: "Nenhum selecionado",
  blurb: "Adicione uma chave de API nas configurações",
};

export const FALLBACK_MODELS: RemoteModel[] = [NONE_MODEL];

export const MODELS = [NONE_MODEL];

export const PROVIDERS: { id: AiProvider; label: string }[] = [
  { id: "grok", label: "Grok" },
  { id: "openai", label: "ChatGPT" },
  { id: "gemini", label: "Gemini" },
  { id: "groq", label: "Groq" },
  { id: "anthropic", label: "Claude" },
  { id: "openrouter", label: "OpenRouter" },
];

export const GROQ_FREE_MODELS: RemoteModel[] = [
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant", blurb: "Free · rápido" },
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", blurb: "Free · forte" },
  { id: "gemma2-9b-it", name: "Gemma 2 9B", blurb: "Free" },
  { id: "meta-llama/llama-4-scout-17b-16e-instruct", name: "Llama 4 Scout", blurb: "Free" },
  { id: "qwen/qwen3-32b", name: "Qwen 3 32B", blurb: "Free" },
  { id: "moonshotai/kimi-k2-instruct", name: "Kimi K2", blurb: "Free" },
  { id: "openai/gpt-oss-20b", name: "GPT-OSS 20B", blurb: "Free" },
];

export const GEMINI_DEFAULT_MODELS: RemoteModel[] = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", blurb: "Recomendado · Rápido e inteligente" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", blurb: "Multimodal · Equilibrado" },
  { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash-Lite", blurb: "Ultrarrápido · Baixa latência" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", blurb: "Raciocínio profundo · Contexto longo" },
];

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isLoggedIn: boolean;
}

export const USER = {
  firstName: "Usuário",
  fullName: "Usuário Kairo",
  email: "usuario@kairo.ai",
  initials: "U",
};

export function modelLabel(id: string, remote: RemoteModel[]) {
  if (!id || id === "none") return "Nenhum selecionado";
  const r = remote.find((m) => m.id === id);
  if (r) return r.name;
  return id;
}

export function visibleModels(remote: RemoteModel[]) {
  return remote.length > 0 ? remote : [NONE_MODEL];
}
