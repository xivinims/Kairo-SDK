export type DesktopPermissionScope =
  | "filesystem"
  | "terminal"
  | "network"
  | "processes"
  | "notifications"
  | "camera"
  | "microphone"
  | "screen";

export interface DesktopPermission {
  scope: DesktopPermissionScope;
  enabled: boolean;
  paths?: string[];
  reason?: string;
}

export const DEFAULT_DESKTOP_PERMISSIONS: DesktopPermission[] = [
  { scope: "filesystem", enabled: true, paths: ["$HOME/Documents", "$HOME/Projects"], reason: "Permitir leitura e escrita em pastas do usuário" },
  { scope: "terminal", enabled: false, reason: "Execução de terminal precisa de autorização explícita" },
  { scope: "network", enabled: false, reason: "Rede e uploads externos devem ser confirmados" },
  { scope: "processes", enabled: false, reason: "Gerenciar processos requer atenção especial" },
  { scope: "notifications", enabled: true, reason: "Notificações do sistema" },
  { scope: "camera", enabled: false, reason: "Câmera exige consentimento explícito" },
  { scope: "microphone", enabled: false, reason: "Microfone exige consentimento explícito" },
  { scope: "screen", enabled: false, reason: "Captura de tela deve ser opt-in" },
];

export function isDesktopRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function getDesktopInfo() {
  if (!isDesktopRuntime()) return { platform: "web", runtime: "browser" } as const;

  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const platform = await invoke<string>("get_runtime");
    return { platform, runtime: "tauri" } as const;
  } catch {
    return { platform: "unknown", runtime: "tauri" } as const;
  }
}

export async function listDesktopDirectory(path: string) {
  if (!isDesktopRuntime()) return [] as string[];
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    return (await invoke<string[]>("list_directory", { path })) ?? [];
  } catch {
    return [];
  }
}

export async function readDesktopFile(path: string) {
  if (!isDesktopRuntime()) return "";
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    return (await invoke<string>("read_file", { path })) ?? "";
  } catch {
    return "";
  }
}

export async function writeDesktopFile(path: string, content: string) {
  if (!isDesktopRuntime()) return false;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("write_file", { path, content });
    return true;
  } catch {
    return false;
  }
}

export async function runAllowedDesktopCommand(command: string, args: string[], cwd: string) {
  if (!isDesktopRuntime()) return { ok: false, output: "Desktop runtime unavailable" };
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const output = await invoke<string>("run_allowed_command", { command, args, cwd });
    return { ok: true, output };
  } catch (error) {
    return { ok: false, output: error instanceof Error ? error.message : "Comando bloqueado" };
  }
}
