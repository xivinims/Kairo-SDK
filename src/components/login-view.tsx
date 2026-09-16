import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  resetPassword,
  verifyResetCode,
  confirmPasswordResetWithCode,
  applyEmailActionCode,
  extractRecoveryCode,
  inspectActionCode,
  FIREBASE_PROJECT_ID,
} from "@/lib/firebase";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User as UserIcon,
  AlertCircle,
  Loader2,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
  Sparkles,
  ShieldAlert,
  Globe,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";

export function LoginView() {
  const setTermsModalOpen = useApp((s) => s.setTermsModalOpen);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Unauthorized Domain Guidance State
  const [unauthorizedDomainInfo, setUnauthorizedDomainInfo] = useState<{
    domain: string;
    projectId: string;
  } | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  // Modes: "login" | "register" | "forgot"
  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot">("login");
  // Recovery tabs: "link" (send link to email) | "code" (enter code / link + new password)
  const [recoveryMethod, setRecoveryMethod] = useState<"link" | "code">("link");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Recovery with code states
  const [recoveryCodeInput, setRecoveryCodeInput] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Auto-detect recovery code and account actions from URL query params and hash
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        let oobCode = searchParams.get("oobCode") || searchParams.get("code");
        let mode = searchParams.get("mode");

        // Also check hash (e.g. /#/auth/action?mode=...&oobCode=...)
        if (!oobCode && window.location.hash.includes("?")) {
          const hashSearch = window.location.hash.split("?")[1];
          const hashParams = new URLSearchParams(hashSearch);
          oobCode = hashParams.get("oobCode") || hashParams.get("code");
          mode = mode || hashParams.get("mode");
        }

        if (oobCode) {
          const cleanCode = extractRecoveryCode(oobCode);

          // Action 1: Email Verification Link
          if (mode === "verifyEmail") {
            setLoading(true);
            void (async () => {
              try {
                await applyEmailActionCode(cleanCode);
                setSuccessMsg("E-mail verificado com sucesso no kaise.space! Você já pode entrar na sua conta.");
                setAuthMode("login");
              } catch (err: any) {
                setErrorMsg(err.message || "Não foi possível verificar seu e-mail com este link.");
              } finally {
                setLoading(false);
              }
            })();
            return;
          }

          // Action 2: Password Reset / Action Code
          setAuthMode("forgot");
          setRecoveryMethod("code");
          setRecoveryCodeInput(cleanCode);
          void (async () => {
            try {
              const info = await inspectActionCode(cleanCode);
              if (info.email) {
                setVerifiedEmail(info.email);
                setSuccessMsg(`Código verificado para: ${info.email}. Digite sua nova senha abaixo.`);
              }
            } catch {
              try {
                const recovered = await verifyResetCode(cleanCode);
                setVerifiedEmail(recovered);
                setSuccessMsg(`Código verificado para: ${recovered}. Digite sua nova senha abaixo.`);
              } catch {
                // ignore auto-verification error on mount
              }
            }
          })();
        }
      } catch (e) {
        console.error("Erro ao verificar parâmetros de URL:", e);
      }
    }
  }, []);

  const resetMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleCopyDomain = async () => {
    if (!unauthorizedDomainInfo?.domain) return;
    try {
      await navigator.clipboard.writeText(unauthorizedDomainInfo.domain);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    } catch (e) {
      console.error("Erro ao copiar domínio:", e);
    }
  };

  const handleGoogleLogin = async () => {
    resetMessages();
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Erro no login do Google:", err);
      const isUnauthorizedDomain =
        err?.code === "auth/unauthorized-domain" ||
        err?.message?.includes("unauthorized-domain") ||
        err?.message?.includes("Domínios Autorizados") ||
        err?.message?.includes("domínio");

      if (isUnauthorizedDomain) {
        setUnauthorizedDomainInfo({
          domain: typeof window !== "undefined" ? window.location.hostname : "",
          projectId: FIREBASE_PROJECT_ID,
        });
      }
      setErrorMsg(err.message || "Erro ao conectar com o Google via Firebase.");
    } finally {
      setLoading(false);
    }
  };

  const handleDirectAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      if (authMode === "login") {
        if (!email.trim() || !password) {
          throw new Error("Por favor, preencha o e-mail e a senha.");
        }
        await loginWithEmail(email, password);
      } else if (authMode === "register") {
        if (!email.trim() || !password) {
          throw new Error("Por favor, preencha o e-mail e a senha para criar sua conta.");
        }
        if (password.length < 6) {
          throw new Error("A senha deve ter pelo menos 6 caracteres.");
        }
        await registerWithEmail(email, password, name.trim());
        setSuccessMsg("Conta criada com sucesso! Entrando...");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Falha na autenticação.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendRecoveryLink = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!email.trim()) {
      setErrorMsg("Informe seu e-mail para enviarmos o link de recuperação.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSuccessMsg(
        `Enviamos um link com o código de recuperação para ${email.trim()}. Verifique sua caixa de entrada e spam.`
      );
    } catch (err: any) {
      setErrorMsg(err.message || "Falha ao enviar o link de recuperação.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCodeOnly = async () => {
    resetMessages();
    const code = extractRecoveryCode(recoveryCodeInput);
    if (!code) {
      setErrorMsg("Cole o código ou o link de recuperação no campo acima.");
      return;
    }
    setLoading(true);
    try {
      try {
        const info = await inspectActionCode(code);
        if (info.operation === "PASSWORD_RESET") {
          setVerifiedEmail(info.email || "sua conta");
          setSuccessMsg(`Código válido para a conta: ${info.email || ""}. Digite sua nova senha abaixo.`);
          return;
        } else if (info.operation === "VERIFY_EMAIL") {
          await applyEmailActionCode(code);
          setSuccessMsg("E-mail verificado com sucesso no Firebase! Você já pode entrar.");
          setAuthMode("login");
          return;
        }
      } catch {
        // Fallback to direct reset code verification
      }

      const emailFound = await verifyResetCode(code);
      setVerifiedEmail(emailFound);
      setSuccessMsg(`Código válido para a conta: ${emailFound}. Digite sua nova senha abaixo.`);
    } catch (err: any) {
      setVerifiedEmail(null);
      setErrorMsg(err.message || "Código ou link de recuperação inválido.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    const code = extractRecoveryCode(recoveryCodeInput);
    if (!code) {
      setErrorMsg("Cole o código ou o link de recuperação.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("As senhas digitadas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordResetWithCode(code, newPassword);
      setSuccessMsg("Senha redefinida com sucesso! Você já pode entrar com sua nova senha.");
      setNewPassword("");
      setConfirmPassword("");
      setRecoveryCodeInput("");
      setVerifiedEmail(null);
      setTimeout(() => {
        setAuthMode("login");
        resetMessages();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || "Falha ao redefinir a senha com o código.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-full w-full flex-col items-center justify-between bg-[#000000] px-4 py-6 sm:px-6 sm:py-8 text-white overflow-hidden">
      {/* Background: Max Dark Theme with 40% Capacity Colored Gradients */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {/* Base dark canvas */}
        <div className="absolute inset-0 bg-[#000000]" />

        {/* 40% Capacity Atmospheric Colored Gradients */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -top-[15%] -left-[10%] h-[580px] w-[580px] rounded-full bg-gradient-to-br from-indigo-600 via-purple-600 to-transparent blur-[120px]" />
          <div className="absolute top-[18%] -right-[15%] h-[620px] w-[620px] rounded-full bg-gradient-to-bl from-blue-600 via-cyan-500 to-transparent blur-[130px]" />
          <div className="absolute -bottom-[20%] left-[15%] h-[640px] w-[640px] rounded-full bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-transparent blur-[140px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[420px] rounded-full bg-gradient-to-r from-blue-600/70 to-indigo-600/70 blur-[110px]" />
        </div>

        {/* Deep dark vignette for maximum black depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/85" />
      </div>

      {/* Top spacer */}
      <div className="w-full h-2 shrink-0" />

      {/* Main Login Card - Direct & Focused */}
      <div className="relative z-10 my-auto flex w-full max-w-[400px] flex-col items-center">
        {/* Headline */}
        <h1 className="text-[26px] font-bold tracking-tight text-white sm:text-[28px]">
          {authMode === "forgot"
            ? "Recuperar Conta"
            : authMode === "register"
            ? "Criar Conta no Kairo"
            : "Bem-vindo ao Kairo"}
        </h1>

        <p className="mt-1 text-[14px] text-zinc-400 text-center max-w-[320px]">
          {authMode === "forgot"
            ? "Envie o link por e-mail ou use seu código para redefinir a senha"
            : authMode === "register"
            ? "Preencha suas informações para começar instantaneamente"
            : "Seu companheiro de conversas, inteligente e conectado"}
        </p>

        {/* Card Body */}
        <div className="mt-6 w-full rounded-3xl bg-[#13141a]/85 border border-white/[0.1] p-5 sm:p-6 shadow-[0_16px_48px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
          {/* Mode Switcher Tabs (Entrar / Cadastrar) */}
          {authMode !== "forgot" ? (
            <div className="mb-5 flex rounded-2xl bg-white/[0.06] p-1 border border-white/[0.06]">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  resetMessages();
                }}
                className={`flex-1 rounded-xl py-2 text-center text-[14px] font-medium transition-all ${
                  authMode === "login"
                    ? "bg-white text-zinc-950 font-semibold shadow-md"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("register");
                  resetMessages();
                }}
                className={`flex-1 rounded-xl py-2 text-center text-[14px] font-medium transition-all ${
                  authMode === "register"
                    ? "bg-white text-zinc-950 font-semibold shadow-md"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Cadastrar
              </button>
            </div>
          ) : (
            /* Recovery Header / Sub-tabs */
            <div className="mb-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  resetMessages();
                }}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-blue-400 hover:text-blue-300 transition-colors self-start"
              >
                <ArrowLeft className="size-3.5" />
                <span>Voltar ao login</span>
              </button>

              <div className="flex rounded-xl bg-white/[0.06] p-1 border border-white/[0.06] mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setRecoveryMethod("link");
                    resetMessages();
                  }}
                  className={`flex-1 rounded-lg py-1.5 text-center text-[13px] font-medium transition-all ${
                    recoveryMethod === "link"
                      ? "bg-white text-zinc-950 font-semibold shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Enviar Link
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRecoveryMethod("code");
                    resetMessages();
                  }}
                  className={`flex-1 rounded-lg py-1.5 text-center text-[13px] font-medium transition-all ${
                    recoveryMethod === "code"
                      ? "bg-white text-zinc-950 font-semibold shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Enviar Código / Link
                </button>
              </div>
            </div>
          )}

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="mb-4 flex items-start gap-2.5 rounded-2xl bg-red-500/15 border border-red-500/30 p-3 text-[13.5px] text-red-200">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-red-400" />
              <div className="flex-1 leading-snug">
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Domain Authorization Assistance Card */}
          {unauthorizedDomainInfo && (
            <div className="mb-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 p-4 text-white animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                  <ShieldAlert className="size-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[14px] font-semibold text-amber-300">
                    Como autorizar o login com Google
                  </h4>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-zinc-300">
                    O Google OAuth exige que o domínio do aplicativo esteja na lista de domínios autorizados do seu projeto Firebase (
                    <span className="font-mono text-amber-200">{unauthorizedDomainInfo.projectId}</span>).
                  </p>

                  {/* Domain pill & Copy Button */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 rounded-xl bg-black/50 border border-white/10 px-3 py-1.5 text-[12.5px] font-mono text-zinc-200 break-all select-all">
                      <Globe className="size-3.5 text-zinc-400 shrink-0" />
                      <span>{unauthorizedDomainInfo.domain}</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyDomain}
                      className="press inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold px-3 py-1.5 text-[12px] shadow-sm transition-all"
                    >
                      {copiedDomain ? (
                        <>
                          <Check className="size-3.5" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3.5" />
                          <span>Copiar Domínio</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Steps */}
                  <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-2.5 text-[12px] text-zinc-400">
                    <ol className="list-decimal list-inside space-y-1 text-zinc-300">
                      <li>Acesse o Firebase Console &gt; <strong>Authentication</strong> &gt; <strong>Configurações</strong></li>
                      <li>Abra a aba <strong>Domínios autorizados</strong> e clique em <strong>Adicionar domínio</strong></li>
                      <li>Cole o domínio copiado acima e salve.</li>
                    </ol>

                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <a
                        href={`https://console.firebase.google.com/project/${unauthorizedDomainInfo.projectId}/authentication/settings`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="press inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 px-3 py-1.5 text-[12px] font-medium text-white border border-white/10 transition-colors"
                      >
                        <ExternalLink className="size-3.5" />
                        <span>Abrir Console do Firebase</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          const emailInput = document.getElementById("auth-email-input");
                          emailInput?.focus();
                        }}
                        className="inline-flex items-center gap-1 text-[12px] text-blue-400 hover:text-blue-300 underline"
                      >
                        💡 Ou entre com E-mail e Senha abaixo
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 flex items-start gap-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 p-3 text-[13.5px] text-emerald-200">
              <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Direct Login / Register Form */}
          {authMode !== "forgot" && (
            <form onSubmit={handleDirectAuthSubmit} className="flex flex-col gap-3.5">
              {/* Barra de Nome (quando em Cadastro) */}
              {authMode === "register" && (
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-zinc-300">
                    Nome de exibição
                  </label>
                  <div className="relative">
                    <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Como você gostaria de ser chamado?"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12 w-full rounded-2xl bg-white/[0.06] pl-10 pr-4 text-[14.5px] text-white placeholder-zinc-500 outline-none border border-white/[0.12] focus:border-blue-500/80 focus:bg-white/[0.09] transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Barra de E-mail */}
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-zinc-300">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    id="auth-email-input"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="seu.email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 w-full rounded-2xl bg-white/[0.06] pl-10 pr-4 text-[14.5px] text-white placeholder-zinc-500 outline-none border border-white/[0.12] focus:border-blue-500/80 focus:bg-white/[0.09] transition-all"
                  />
                </div>
              </div>

              {/* Barra de Senha */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-[13px] font-medium text-zinc-300">Senha</label>
                  {authMode === "login" && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("forgot");
                        setRecoveryMethod("link");
                        resetMessages();
                      }}
                      className="text-[12.5px] font-medium text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete={authMode === "login" ? "current-password" : "new-password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 w-full rounded-2xl bg-white/[0.06] pl-10 pr-11 text-[14.5px] text-white placeholder-zinc-500 outline-none border border-white/[0.12] focus:border-blue-500/80 focus:bg-white/[0.09] transition-all"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                    onClick={() => setShowPassword(!showPassword)}
                    className="press absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Botão Principal de Envio Direto */}
              <button
                type="submit"
                disabled={loading}
                className="press mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-semibold text-[15px] shadow-[0_8px_24px_rgba(37,99,235,0.35)] transition-all disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : authMode === "login" ? (
                  "Entrar no Kairo"
                ) : (
                  "Criar Minha Conta"
                )}
              </button>
            </form>
          )}

          {/* Account Recovery Flow */}
          {authMode === "forgot" && (
            <div>
              {/* Option 1: Send link to email */}
              {recoveryMethod === "link" && (
                <form onSubmit={handleSendRecoveryLink} className="flex flex-col gap-3.5">
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-zinc-300">
                      E-mail cadastrado
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="seu.email@exemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 w-full rounded-2xl bg-white/[0.06] pl-10 pr-4 text-[14.5px] text-white placeholder-zinc-500 outline-none border border-white/[0.12] focus:border-blue-500/80 focus:bg-white/[0.09] transition-all"
                      />
                    </div>
                  </div>

                  <p className="text-[12.5px] text-zinc-400 leading-relaxed">
                    Você receberá um e-mail oficial com o link de recuperação. Você poderá clicar diretamente nele ou copiar o código para colar aqui.
                  </p>

                  <button
                    type="submit"
                    disabled={loading}
                    className="press mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-semibold text-[15px] shadow-[0_8px_24px_rgba(37,99,235,0.35)] transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      "Enviar Link de Recuperação"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryMethod("code");
                      resetMessages();
                    }}
                    className="mt-1 flex items-center justify-center gap-1.5 text-[13px] text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                  >
                    <KeyRound className="size-3.5" />
                    <span>Já tenho o código ou o link</span>
                  </button>
                </form>
              )}

              {/* Option 2: Enter code or link + new password */}
              {recoveryMethod === "code" && (
                <form onSubmit={handleConfirmResetPassword} className="flex flex-col gap-3.5">
                  {/* Recovery Code or Full Link Bar */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-[13px] font-medium text-zinc-300">
                        Código ou Link de Recuperação
                      </label>
                      {recoveryCodeInput.trim().length > 0 && (
                        <button
                          type="button"
                          onClick={handleVerifyCodeOnly}
                          disabled={loading}
                          className="text-[12px] font-medium text-blue-400 hover:text-blue-300 hover:underline"
                        >
                          Verificar
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="text"
                        required
                        placeholder="Cole o código oobCode ou o link completo do e-mail..."
                        value={recoveryCodeInput}
                        onChange={(e) => {
                          setRecoveryCodeInput(e.target.value);
                          setVerifiedEmail(null);
                        }}
                        className="h-12 w-full rounded-2xl bg-white/[0.06] pl-10 pr-4 text-[13.5px] font-mono text-white placeholder-zinc-500 outline-none border border-white/[0.12] focus:border-blue-500/80 focus:bg-white/[0.09] transition-all"
                      />
                    </div>
                    {recoveryCodeInput.includes("oobCode=") && (
                      <div className="mt-1.5 flex items-center gap-1.5 rounded-xl bg-blue-500/15 border border-blue-500/25 px-2.5 py-1 text-[12px] text-blue-200">
                        <Check className="size-3.5 text-blue-400 shrink-0" />
                        <span>Link do Firebase detectado · Código <strong>{extractRecoveryCode(recoveryCodeInput).slice(0, 12)}…</strong> extraído automaticamente</span>
                      </div>
                    )}
                    {verifiedEmail && (
                      <p className="mt-1 text-[12px] text-emerald-400 flex items-center gap-1">
                        <Sparkles className="size-3" />
                        Código confirmado para {verifiedEmail}
                      </p>
                    )}
                    <p className="mt-1.5 text-[11.5px] text-zinc-400 leading-relaxed">
                      💡 <strong>Aceita qualquer formato:</strong> cole o link completo (ex: <code className="text-blue-300 font-mono text-[11px] break-all">https://kaise.space/__/auth/action?...</code>) ou apenas o código.
                    </p>
                  </div>

                  {/* New Password Bar */}
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-zinc-300">
                      Nova Senha
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        autoComplete="new-password"
                        placeholder="Mínimo 6 caracteres"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-12 w-full rounded-2xl bg-white/[0.06] pl-10 pr-11 text-[14.5px] text-white placeholder-zinc-500 outline-none border border-white/[0.12] focus:border-blue-500/80 focus:bg-white/[0.09] transition-all"
                      />
                      <button
                        type="button"
                        aria-label={showNewPassword ? "Ocultar senha" : "Ver senha"}
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="press absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white"
                      >
                        {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Bar */}
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-zinc-300">
                      Confirmar Nova Senha
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        autoComplete="new-password"
                        placeholder="Repita a nova senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-12 w-full rounded-2xl bg-white/[0.06] pl-10 pr-4 text-[14.5px] text-white placeholder-zinc-500 outline-none border border-white/[0.12] focus:border-blue-500/80 focus:bg-white/[0.09] transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="press mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-semibold text-[15px] shadow-[0_8px_24px_rgba(16,185,129,0.35)] transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      "Enviar Código e Redefinir Senha"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryMethod("link");
                      resetMessages();
                    }}
                    className="mt-1 text-center text-[13px] text-zinc-400 hover:text-white transition-colors"
                  >
                    Ainda não recebeu o link? Clique aqui para enviar
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Divider & Google Login (available in login/register) */}
          {authMode !== "forgot" && (
            <div className="mt-5">
              <div className="relative flex items-center justify-center mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.1]" />
                </div>
                <span className="relative bg-[#13141a] px-3 text-[12px] uppercase tracking-wider text-zinc-500">
                  ou continue com
                </span>
              </div>

              {/* Direct Google Login Button */}
              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleLogin}
                className="press group relative flex h-12 w-full items-center justify-center gap-3 rounded-2xl bg-white/[0.07] hover:bg-white/[0.12] active:scale-[0.99] border border-white/[0.12] px-5 text-white transition-all disabled:opacity-60 shadow-sm"
              >
                {loading ? (
                  <Loader2 className="size-5 animate-spin text-white" />
                ) : (
                  <svg
                    className="size-4.5 shrink-0"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}

                <span className="text-[14.5px] font-medium text-white">
                  Continuar com o Google
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer disclaimer */}
      <div className="relative z-10 w-full max-w-sm text-center pt-4 pb-2">
        <p className="text-[12.5px] leading-relaxed text-zinc-400">
          Ao continuar, você concorda com nossos
          <br />
          <button
            type="button"
            onClick={() => setTermsModalOpen(true, "terms")}
            className="font-medium text-blue-400 hover:text-blue-300 hover:underline"
          >
            Termos de Serviço
          </button>{" "}
          e{" "}
          <button
            type="button"
            onClick={() => setTermsModalOpen(true, "privacy")}
            className="font-medium text-blue-400 hover:text-blue-300 hover:underline"
          >
            Política de Privacidade
          </button>
          .
        </p>
      </div>
    </div>
  );
}


