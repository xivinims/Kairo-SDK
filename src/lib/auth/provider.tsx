import { useEffect, type ReactNode } from "react";
import { auth, onAuthStateChanged } from "@/lib/firebase";
import { useApp } from "@/lib/store";

export function AuthProvider({ children }: { children: ReactNode }) {
  const setAuthUser = useApp((s) => s.setAuthUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthUser({
          id: user.uid,
          name: user.displayName || user.email?.split("@")[0] || "Usuário",
          email: user.email || "",
          avatar: user.photoURL || "",
          isLoggedIn: true,
        });
      } else {
        setAuthUser(null);
      }
    });
    return () => unsubscribe();
  }, [setAuthUser]);

  return <>{children}</>;
}
