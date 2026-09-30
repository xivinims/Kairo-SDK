import type { ZenoConnectorTokens } from "./zeno-tools";

export interface ZenoConnectorState {
  google: boolean;
  github: boolean;
}

export function getConnectorTokens(): ZenoConnectorTokens {
  if (typeof window === "undefined") return {};
  return {
    google: sessionStorage.getItem("zeno.connector.google") ?? undefined,
    github: sessionStorage.getItem("zeno.connector.github") ?? undefined,
  };
}

export function getConnectorState(): ZenoConnectorState {
  const tokens = getConnectorTokens();
  return { google: Boolean(tokens.google), github: Boolean(tokens.github) };
}

export function disconnectConnector(id: "google" | "github") {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(`zeno.connector.${id}`);
}
