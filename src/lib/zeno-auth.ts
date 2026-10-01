export interface ZenoUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export function isFirebaseConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId);
}

async function getFirebaseAuth() {
  if (typeof window === "undefined") throw new Error("Firebase Auth só está disponível no cliente.");
  if (!isFirebaseConfigured()) throw new Error("Configure as variáveis VITE_FIREBASE_* para ativar o login.");

  const [{ getApps, initializeApp }, authModule] = await Promise.all([
    import("firebase/app"),
    import("firebase/auth"),
  ]);
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  return { auth: authModule.getAuth(app), authModule };
}

function toUser(user: { uid: string; displayName: string | null; email: string | null; photoURL: string | null } | null): ZenoUser | null {
  return user ? {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  } : null;
}

export async function subscribeZenoAuth(onChange: (user: ZenoUser | null) => void) {
  if (!isFirebaseConfigured()) {
    onChange(null);
    return () => {};
  }
  const { auth, authModule } = await getFirebaseAuth();
  return authModule.onAuthStateChanged(auth, (user) => onChange(toUser(user)));
}

export async function signInWithGoogle() {
  const { auth, authModule } = await getFirebaseAuth();
  const provider = new authModule.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await authModule.signInWithPopup(auth, provider);
  return toUser(result.user);
}

export async function signOutZeno() {
  const { auth, authModule } = await getFirebaseAuth();
  sessionStorage.removeItem("zeno.connector.google");
  sessionStorage.removeItem("zeno.connector.github");
  await authModule.signOut(auth);
}

export async function connectGoogleWorkspace() {
  const { auth, authModule } = await getFirebaseAuth();
  if (!auth.currentUser) throw new Error("Entre com Google antes de conectar o Workspace.");

  const provider = new authModule.GoogleAuthProvider();
  provider.addScope("https://www.googleapis.com/auth/drive.readonly");
  provider.setCustomParameters({ prompt: "consent" });
  const result = await authModule.reauthenticateWithPopup(auth.currentUser, provider);
  const credential = authModule.GoogleAuthProvider.credentialFromResult(result);
  if (!credential?.accessToken) throw new Error("O Google não retornou um token de acesso.");
  sessionStorage.setItem("zeno.connector.google", credential.accessToken);
  return true;
}

export async function connectGitHub() {
  const { auth, authModule } = await getFirebaseAuth();
  if (!auth.currentUser) throw new Error("Entre com Google antes de conectar o GitHub.");

  const provider = new authModule.GithubAuthProvider();
  provider.addScope("read:user");
  provider.addScope("repo");
  const result = await authModule.linkWithPopup(auth.currentUser, provider);
  const credential = authModule.GithubAuthProvider.credentialFromResult(result);
  if (!credential?.accessToken) throw new Error("O GitHub não retornou um token de acesso.");
  sessionStorage.setItem("zeno.connector.github", credential.accessToken);
  return true;
}
