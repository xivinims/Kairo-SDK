import { listModels } from "./ask";
import { useApp } from "./store";
import { GEMINI_DEFAULT_MODELS } from "./types";

export async function loadRemoteModels() {
  const s = useApp.getState();
  const provider = s.prefs.api.provider;
  const apiKey = (s.prefs.api.keys[provider] ?? "").trim();

  if (!apiKey && provider !== "grok" && provider !== "gemini") {
    s.setRemoteModels([]);
    s.setModel("none");
    return { ok: false as const, error: "missing-key", models: [] };
  }

  try {
    const res = await listModels({
      data: {
        provider,
        apiKey,
        groqFreeOnly: s.prefs.api.groqFreeOnly,
      },
    });
    if (res.ok && res.models.length) {
      s.setRemoteModels(res.models);
      if (!res.models.some((m) => m.id === s.model)) {
        s.setModel(res.models[0]!.id);
      }
      return res;
    }

    if (provider === "gemini") {
      s.setRemoteModels(GEMINI_DEFAULT_MODELS);
      if (!GEMINI_DEFAULT_MODELS.some((m) => m.id === s.model)) {
        s.setModel(GEMINI_DEFAULT_MODELS[0]!.id);
      }
      return { ok: true as const, models: GEMINI_DEFAULT_MODELS };
    }

    s.setRemoteModels([]);
    s.setModel("none");
    return res;
  } catch {
    if (provider === "gemini") {
      s.setRemoteModels(GEMINI_DEFAULT_MODELS);
      if (!GEMINI_DEFAULT_MODELS.some((m) => m.id === s.model)) {
        s.setModel(GEMINI_DEFAULT_MODELS[0]!.id);
      }
      return { ok: true as const, models: GEMINI_DEFAULT_MODELS };
    }

    s.setRemoteModels([]);
    s.setModel("none");
    return { ok: false as const, error: "network", models: [] };
  }
}
