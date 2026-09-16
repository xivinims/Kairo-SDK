import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useApp } from "./store";
import type { CustomBot, ChatPersona } from "./types";

export async function syncUserDataFromCloud(userId: string) {
  if (!userId) return;
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      const state = useApp.getState();
      
      const cloudBots: CustomBot[] = Array.isArray(data.customBots) ? data.customBots : [];
      const cloudPersonas: ChatPersona[] = Array.isArray(data.personas) ? data.personas : [];

      // Merge cloud bots with local bots (avoiding duplicates by id)
      const localBots = state.customBots || [];
      const botMap = new Map<string, CustomBot>();
      localBots.forEach((b) => botMap.set(b.id, b));
      cloudBots.forEach((b) => botMap.set(b.id, b));
      const mergedBots = Array.from(botMap.values());

      // Merge cloud personas with local personas
      const localPersonas = state.prefs.personas || [];
      const personaMap = new Map<string, ChatPersona>();
      localPersonas.forEach((p) => personaMap.set(p.id, p));
      cloudPersonas.forEach((p) => personaMap.set(p.id, p));
      const mergedPersonas = Array.from(personaMap.values());

      useApp.setState({
        customBots: mergedBots,
        prefs: {
          ...state.prefs,
          personas: mergedPersonas,
        },
      });

      // Also save the merged set back to Firestore if needed
      if (mergedBots.length > cloudBots.length || mergedPersonas.length > cloudPersonas.length) {
        await saveUserDataToCloud(userId, mergedBots, mergedPersonas);
      }
    } else {
      // First time logging in for this user, upload existing local bots & personas
      const state = useApp.getState();
      await saveUserDataToCloud(userId, state.customBots || [], state.prefs.personas || []);
    }
  } catch (err) {
    console.error("Erro ao sincronizar dados com o Firestore:", err);
  }
}

export async function saveUserDataToCloud(
  userId: string,
  customBots?: CustomBot[],
  personas?: ChatPersona[]
) {
  if (!userId) return;
  try {
    const state = useApp.getState();
    const botsToSave = customBots ?? state.customBots ?? [];
    const personasToSave = personas ?? state.prefs.personas ?? [];

    const userRef = doc(db, "users", userId);
    await setDoc(
      userRef,
      {
        customBots: botsToSave,
        personas: personasToSave,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error("Erro ao salvar dados no Firestore:", err);
  }
}
