import type { KairoSkillId } from "./kairo-skills";

export type KairoContentLevel = "safe" | "mature";

export interface KairoMessage {
  role: "user" | "assistant";
  content: string;
}

export interface KairoAgentResult {
  ok: boolean;
  answer?: string;
  skills: KairoSkillId[];
  error?: string;
}

// A UI continua importando daqui; a implementação (chave do usuário, modelo e acesso ao PC) vive em kairo-client.
export { askKairoAgent } from "./kairo-client";
