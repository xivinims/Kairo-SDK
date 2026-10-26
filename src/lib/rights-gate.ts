export type RightsStatus =
  | "open-license"
  | "official-mod-policy"
  | "permission-required"
  | "review-required";

export interface RightsProfile {
  gameId: string;
  title: string;
  status: RightsStatus;
  canTranslateLocally: boolean;
  canPublishPatch: boolean;
  commercialAllowed: boolean;
  requiresOriginalGame: boolean;
  distributionMode: "patch-only" | "mod-only" | "license-defined" | "do-not-publish";
  policyUrl?: string;
  notes: string[];
}

export const RIGHTS_PROFILES: RightsProfile[] = [
  {
    gameId: "witcher-3",
    title: "The Witcher 3: Wild Hunt",
    status: "official-mod-policy",
    canTranslateLocally: true,
    canPublishPatch: true,
    commercialAllowed: false,
    requiresOriginalGame: true,
    distributionMode: "mod-only",
    policyUrl: "https://www.thewitcher.com/us/pt-br/redkit/user-agreement",
    notes: [
      "Mods do REDkit são para uso junto de The Witcher 3.",
      "Distribuição deve seguir as Diretrizes de Conteúdo de Fãs e o EULA.",
      "Dublagem de fã pode usar voz própria, locutores ou TTS permitido.",
      "Não usar a voz dos atores sem autorização nem treinar IA com os áudios do jogo.",
    ],
  },
  {
    gameId: "cyberpunk-2077",
    title: "Cyberpunk 2077",
    status: "official-mod-policy",
    canTranslateLocally: true,
    canPublishPatch: true,
    commercialAllowed: false,
    requiresOriginalGame: true,
    distributionMode: "mod-only",
    policyUrl: "https://www.cyberpunk.net/pt-br/modding-support",
    notes: [
      "REDmod oferece suporte oficial a mods.",
      "Antes de publicar, o mod precisa respeitar as Fan Content Guidelines, EULA e User Agreement.",
      "O pacote publicado deve ser o mod, não uma cópia do jogo.",
    ],
  },
  {
    gameId: "fallout-4",
    title: "Fallout 4",
    status: "review-required",
    canTranslateLocally: true,
    canPublishPatch: false,
    commercialAllowed: false,
    requiresOriginalGame: true,
    distributionMode: "patch-only",
    notes: [
      "Creation Kit oferece caminho técnico para localização.",
      "A política/EULA aplicável ao pacote final precisa ser verificada na versão atual antes de publicar.",
    ],
  },
  {
    gameId: "skyrim-se",
    title: "The Elder Scrolls V: Skyrim Special Edition",
    status: "review-required",
    canTranslateLocally: true,
    canPublishPatch: false,
    commercialAllowed: false,
    requiresOriginalGame: true,
    distributionMode: "patch-only",
    notes: [
      "Creation Kit e sistema de mods dão suporte técnico.",
      "A distribuição final precisa passar pela política aplicável da Bethesda/Creations.",
    ],
  },
  {
    gameId: "starfield",
    title: "Starfield",
    status: "review-required",
    canTranslateLocally: true,
    canPublishPatch: false,
    commercialAllowed: false,
    requiresOriginalGame: true,
    distributionMode: "patch-only",
    notes: [
      "Creation Kit oficial existe.",
      "O Kairo só libera publicação depois de confirmar os termos vigentes do mod/pacote.",
    ],
  },
  {
    gameId: "bannerlord",
    title: "Mount & Blade II: Bannerlord",
    status: "review-required",
    canTranslateLocally: true,
    canPublishPatch: false,
    commercialAllowed: false,
    requiresOriginalGame: true,
    distributionMode: "patch-only",
    notes: [
      "Modding Tools oficiais existem.",
      "Publicação fica bloqueada até a licença/política da distribuição ser confirmada.",
    ],
  },
  {
    gameId: "baldurs-gate-3",
    title: "Baldur's Gate 3",
    status: "review-required",
    canTranslateLocally: true,
    canPublishPatch: false,
    commercialAllowed: false,
    requiresOriginalGame: true,
    distributionMode: "patch-only",
    notes: [
      "Toolkit oficial existe.",
      "O Kairo precisa validar os termos específicos antes de marcar o projeto como publicável.",
    ],
  },
  {
    gameId: "epic-of-inanna",
    title: "The Epic of Inanna",
    status: "open-license",
    canTranslateLocally: true,
    canPublishPatch: true,
    commercialAllowed: true,
    requiresOriginalGame: false,
    distributionMode: "license-defined",
    notes: [
      "Projeto publicado sob CC BY-SA 4.0 conforme a página do criador.",
      "Adaptações precisam manter atribuição e cumprir share-alike.",
    ],
  },
  {
    gameId: "quantangled",
    title: "Quantangled",
    status: "open-license",
    canTranslateLocally: true,
    canPublishPatch: true,
    commercialAllowed: true,
    requiresOriginalGame: false,
    distributionMode: "license-defined",
    notes: [
      "Código MIT e assets CC BY 4.0 conforme declaração do projeto.",
      "Atribuições devem ser preservadas.",
    ],
  },
];

export function rightsFor(gameId: string) {
  return RIGHTS_PROFILES.find((profile) => profile.gameId === gameId);
}

export function canEnterPublicRelease(gameId: string) {
  const profile = rightsFor(gameId);
  return Boolean(profile?.canPublishPatch);
}

export function rightsLabel(status: RightsStatus) {
  const labels: Record<RightsStatus, string> = {
    "open-license": "Licença aberta",
    "official-mod-policy": "Mod oficial permitido",
    "permission-required": "Precisa de autorização",
    "review-required": "Revisar termos",
  };
  return labels[status];
}

export function validateReleaseRights(gameId: string) {
  const profile = rightsFor(gameId);
  if (!profile) {
    return {
      ok: false,
      reason: "Sem perfil de direitos. Verifique licença, EULA ou política de mods antes de publicar.",
    };
  }
  if (!profile.canPublishPatch) {
    return {
      ok: false,
      reason: profile.status === "permission-required"
        ? "A publicação depende de autorização do detentor dos direitos."
        : "A política aplicável ainda precisa ser confirmada antes da publicação.",
    };
  }
  return {
    ok: true,
    reason: profile.distributionMode === "mod-only"
      ? "Publicação permitida somente como mod compatível com a cópia original, respeitando os termos aplicáveis."
      : "Publicação permitida dentro das condições da licença declarada.",
  };
}
