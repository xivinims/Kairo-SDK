import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  applyActionCode,
  checkActionCode,
  signOut,
  onAuthStateChanged,
  type User,
  type ActionCodeSettings,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBvif7ThRlLQdysBAe80kJLh0SlvueGCzg",
  authDomain: "kaise.space",
  databaseURL: "https://kaise-space-w-default-rtdb.firebaseio.com",
  projectId: "kaise-space-w",
  storageBucket: "kaise-space-w.firebasestorage.app",
  messagingSenderId: "662774835226",
  appId: "1:662774835226:web:54896074a775199a4649a3"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account",
});

export function translateAuthError(error: any): string {
  const code = error?.code || "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-mail ou senha incorretos. Verifique suas credenciais.";
    case "auth/email-already-in-use":
      return "Este e-mail já está cadastrado. Tente entrar ou recupere sua senha.";
    case "auth/invalid-email":
      return "Endereço de e-mail inválido.";
    case "auth/weak-password":
      return "A senha deve ter pelo menos 6 caracteres.";
    case "auth/popup-closed-by-user":
      return "O pop-up de login do Google foi fechado antes de concluir.";
    case "auth/popup-blocked":
      return "O navegador bloqueou a janela pop-up do Google. Permita pop-ups para este site.";
    case "auth/unauthorized-domain": {
      const currentDomain = typeof window !== "undefined" ? window.location.hostname : "este domínio";
      return `O domínio "${currentDomain}" precisa ser adicionado aos Domínios Autorizados no Firebase Console do projeto kaise-space-w.`;
    }
    case "auth/operation-not-allowed":
      return "Este método de login precisa ser ativado no console do Firebase.";
    case "auth/invalid-action-code":
      return "O código ou link de recuperação é inválido ou já foi utilizado.";
    case "auth/expired-action-code":
      return "O código ou link de recuperação expirou. Solicite um novo link.";
    case "auth/missing-action-code":
      return "Nenhum código de recuperação foi fornecido.";
    case "auth/too-many-requests":
      return "Muitas tentativas consecutivas. Aguarde alguns instantes antes de tentar novamente.";
    case "auth/user-disabled":
      return "Esta conta de usuário foi temporariamente desativada.";
    default:
      return error?.message || "Ocorreu um erro na autenticação.";
  }
}

/**
 * Extracts the recovery code (oobCode) from either raw code or full Firebase action URL
 * Handles full URLs (e.g. https://kaise.space/__/auth/action?mode=action&oobCode=code),
 * quotes (" ' “ ”), angle brackets, and spaces.
 */
export function extractRecoveryCode(rawInput: string): string {
  if (!rawInput) return "";
  let cleaned = rawInput.trim();
  // Strip outer quotes (both straight and curly quotes: " ' “ ” ‘ ’, brackets < >)
  cleaned = cleaned.replace(/^["'“‘<[\s]+|["'”’>\]\s]+$/g, "").trim();
  if (!cleaned) return "";

  // If input contains oobCode parameter from Firebase action URL
  if (cleaned.includes("oobCode=")) {
    try {
      // Find full URL inside string if user pasted mixed text
      const urlMatch = cleaned.match(/https?:\/\/[^\s"'”’<>]+/);
      const urlToParse = urlMatch ? urlMatch[0] : cleaned;
      const url = new URL(urlToParse);
      const code = url.searchParams.get("oobCode");
      if (code) {
        return code.replace(/["'”’\s]+$/, "").trim();
      }
    } catch {
      // Fallback regex if URL constructor fails
      const match = cleaned.match(/oobCode=([^&"'\s”’`<>]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]).trim();
      }
    }
  }

  // Also handle code= parameter if provided in custom redirects
  if (cleaned.includes("code=")) {
    const match = cleaned.match(/(?:[?&])code=([^&"'\s”’`<>]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]).trim();
    }
  }

  return cleaned;
}

/**
 * Inspects a Firebase Auth action code to discover its operation type (PASSWORD_RESET, VERIFY_EMAIL, etc.) and email.
 */
export async function inspectActionCode(codeOrLink: string): Promise<{
  operation: string;
  email?: string;
  code: string;
}> {
  const code = extractRecoveryCode(codeOrLink);
  if (!code) {
    throw new Error("Código ou link de ação inválido.");
  }
  try {
    const info = await checkActionCode(auth, code);
    return {
      operation: info.operation,
      email: info.data?.email || undefined,
      code,
    };
  } catch (error) {
    console.error("Erro ao inspecionar código de ação:", error);
    throw new Error(translateAuthError(error));
  }
}

export const FIREBASE_PROJECT_ID = "kaise-space-w";

export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Erro no login Google com Firebase:", error);
    const customError: any = new Error(translateAuthError(error));
    customError.code = error?.code;
    customError.originalError = error;
    throw customError;
  }
}

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  try {
    const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return res.user;
  } catch (error: any) {
    console.error("Erro no login por email:", error);
    const customError: any = new Error(translateAuthError(error));
    customError.code = error?.code;
    throw customError;
  }
}

export async function registerWithEmail(
  email: string,
  pass: string,
  name?: string
): Promise<User> {
  try {
    const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (name?.trim() && res.user) {
      await updateProfile(res.user, { displayName: name.trim() });
    }
    return res.user;
  } catch (error: any) {
    console.error("Erro no cadastro:", error);
    const customError: any = new Error(translateAuthError(error));
    customError.code = error?.code;
    throw customError;
  }
}

export const OFFICIAL_SITE_URL = "https://www.kaise.space";
export const OFFICIAL_DOMAINS = ["www.kaise.space", "kaise.space"];

/**
 * Creates directional ActionCodeSettings for Firebase Auth actions
 * (password reset, email verification, etc.) targeting exclusively https://www.kaise.space.
 */
export function getActionCodeSettings(customPath = "/?mode=resetPassword"): ActionCodeSettings {
  let targetOrigin = OFFICIAL_SITE_URL;

  if (typeof window !== "undefined") {
    const currentHost = window.location.hostname;
    if (
      currentHost.includes("localhost") ||
      currentHost.includes(".run.app")
    ) {
      // In dev environment or cloud preview, preserve window.location.origin for internal testing
      targetOrigin = window.location.origin;
    } else {
      // For all production and live access, enforce https://www.kaise.space
      targetOrigin = OFFICIAL_SITE_URL;
    }
  }

  const normalizedPath = customPath.startsWith("/") ? customPath : `/${customPath}`;
  return {
    url: `${targetOrigin}${normalizedPath}`,
    handleCodeInApp: true,
  };
}

export async function resetPassword(email: string): Promise<{ directionalUrl?: string }> {
  const trimmed = email.trim();
  try {
    // Send standard native Firebase Auth reset email
    // This generates: https://kaise-space-w.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=...
    await sendPasswordResetEmail(auth, trimmed);
    return { directionalUrl: `https://${FIREBASE_PROJECT_ID}.firebaseapp.com/__/auth/action` };
  } catch (error: any) {
    console.error("Erro ao enviar email de redefinição:", error);
    const customError: any = new Error(translateAuthError(error));
    customError.code = error?.code;
    throw customError;
  }
}

export async function applyEmailActionCode(codeOrLink: string): Promise<void> {
  const code = extractRecoveryCode(codeOrLink);
  if (!code) {
    throw new Error("Código ou link de ação inválido.");
  }
  try {
    await applyActionCode(auth, code);
  } catch (error: any) {
    console.error("Erro ao aplicar código de verificação/ação:", error);
    throw new Error(translateAuthError(error));
  }
}

export async function verifyResetCode(codeOrLink: string): Promise<string> {
  const code = extractRecoveryCode(codeOrLink);
  if (!code) {
    throw new Error("Informe o código ou link de recuperação.");
  }
  try {
    const email = await verifyPasswordResetCode(auth, code);
    return email;
  } catch (error) {
    console.error("Erro ao verificar código de recuperação:", error);
    throw new Error(translateAuthError(error));
  }
}

export async function confirmPasswordResetWithCode(
  codeOrLink: string,
  newPass: string
): Promise<void> {
  const code = extractRecoveryCode(codeOrLink);
  if (!code) {
    throw new Error("Informe o código ou link de recuperação.");
  }
  if (!newPass || newPass.length < 6) {
    throw new Error("A nova senha deve ter no mínimo 6 caracteres.");
  }
  try {
    await confirmPasswordReset(auth, code, newPass);
  } catch (error) {
    console.error("Erro ao redefinir senha com código:", error);
    throw new Error(translateAuthError(error));
  }
}

export async function logoutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Erro ao realizar logout:", error);
    throw error;
  }
}

export { onAuthStateChanged, type User };

