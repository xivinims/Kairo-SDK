import type { KairoSkillModule, KairoSkillId } from "./kairo-skills";

export const EXTRA_KAIRO_SKILLS: KairoSkillModule[] = [
  { id: "automation" as KairoSkillId, label: "Automação", description: "Fluxos e tarefas", triggers: /automat|workflow|fluxo|rotina|agend/i, prompt: "Descreva etapas, permissões e confirmações antes de ações externas." },
  { id: "documents" as KairoSkillId, label: "Documentos", description: "Relatórios e documentos", triggers: /documento|relat[oó]rio|pdf|curr[ií]culo|contrato/i, prompt: "Organize o conteúdo em seções claras e indique o formato de saída." },
  { id: "data" as KairoSkillId, label: "Dados", description: "Tabelas e análise", triggers: /planilha|csv|tabela|gr[aá]fico|an[aá]lise de dados/i, prompt: "Explique premissas, transforme dados com rastreabilidade e destaque limitações." },
  { id: "translation" as KairoSkillId, label: "Tradução", description: "Idiomas e localização", triggers: /traduz|tradu[cç][aã]o|ingl[eê]s|espanhol|localiza/i, prompt: "Preserve intenção, tom, contexto e formatação do texto original." },
  { id: "summarize" as KairoSkillId, label: "Resumo", description: "Síntese e extração", triggers: /resum|resuma|s[ií]ntese|pontos principais/i, prompt: "Separe fatos, decisões, pendências e próximos passos de forma concisa." },
];

export function getAllKairoSkillModules() {
  return EXTRA_KAIRO_SKILLS;
}
