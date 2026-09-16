import { useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User as UserIcon,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  ArrowLeft,
  Sparkles,
  ShieldAlert,
  Globe,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  resetPassword,
  verifyResetCode,
  confirmPasswordResetWithCode,
  extractRecoveryCode,
  FIREBASE_PROJECT_ID,
} from "@/lib/firebase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "login" | "register";
}

export function AuthModal({ isOpen, onClose, defaultMode = "login" }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register" | "forgot">(defaultMode);
  const [recoveryMethod, setRecoveryMethod] = useState<"link" | "code">("link");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Recovery with code
  const [recoveryCodeInput, setRecoveryCodeInput] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Unauthorized Domain Guidance State
  const [unauthorizedDomainInfo, setUnauthorizedDomainInfo] = useState<{
    domain: string;
    projectId: string;
  } | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  if (!isOpen) return null;

  const resetState = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(false);
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

  const handleGoogle = async () => {
    resetState();
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
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
      setErrorMsg(err.message || "Falha ao autenticar com o Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();
    setLoading(true);

    try {
      if (mode === "login") {
        if (!email.trim() || !password) {
          throw new Error("Preencha e-mail e senha para entrar.");
        }
        await loginWithEmail(email, password);
        onClose();
      } else if (mode === "register") {
        if (!email.trim() || !password) {
          throw new Error("Preencha e-mail e senha para criar sua conta.");
        }
        if (password.length < 6) {
          throw new Error("A senha deve ter pelo menos 6 caracteres.");
        }
        await registerWithEmail(email, password, name.trim());
        setSuccessMsg("Conta criada com sucesso! Entrando...");
        setTimeout(() => onClose(), 800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Ocorreu um erro ao processar sua solicitação.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendRecoveryLink = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();
    if (!email.trim()) {
      setErrorMsg("Informe o seu e-mail para receber as instruções de recuperação.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSuccessMsg(`Link de recuperação enviado para ${email.trim()}!`);
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao enviar link de recuperação.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCodeOnly = async () => {
    resetState();
    const code = extractRecoveryCode(recoveryCodeInput);
    if (!code) {
      setErrorMsg("Cole o código ou o link de recuperação.");
      return;
    }
    setLoading(true);
    try {
      const emailFound = await verifyResetCode(code);
      setVerifiedEmail(emailFound);
      setSuccessMsg(`Código válido para a conta: ${emailFound}`);
    } catch (err: any) {
      setVerifiedEmail(null);
      setErrorMsg(err.message || "Código ou link de recuperação inválido.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();
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
      setSuccessMsg("Senha redefinida com sucesso! Você já pode entrar.");
      setNewPassword("");
      setConfirmPassword("");
      setRecoveryCodeInput("");
      setVerifiedEmail(null);
      setTimeout(() => {
        setMode("login");
        resetState();
      }, 1800);
    } catch (err: any) {
      setErrorMsg(err.message || "Falha ao redefinir a senha com o código.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Fechar modal"
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
      />

      {/* Modal Card */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 my-auto w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-3xl bg-[#14151b] border border-white/[0.12] p-6 shadow-2xl text-white animate-in fade-in zoom-in-95 duration-150"
      >
        <button
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className="press absolute right-4 top-4 flex size-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/15 text-zinc-400 hover:text-white"
        >
          <X className="size-4" />
        </button>

        <div className="mb-5 text-center">
          <h2 className="text-[22px] font-bold tracking-tight text-white">
            {mode === "login" && "Entrar no Kairo"}
            {mode === "register" && "Criar Conta no Kairo"}
            {mode === "forgot" && "Recuperação de Conta"}
          </h2>
          <p className="mt-1 text-[13.5px] text-zinc-400">
            {mode === "login" && "Acesse suas conversas e configurações personalizadas"}
            {mode === "register" && "Crie sua conta e sincronize suas preferências em nuvem"}
            {mode === "forgot" && "Redefina sua senha com link por e-mail ou código de recuperação"}
          </p>
        </div>

        {/* Tab Switcher */}
        {mode !== "forgot" ? (
          <div className="mb-5 flex rounded-2xl bg-white/[0.06] p-1 border border-white/[0.06]">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                resetState();
              }}
              className={`flex-1 rounded-xl py-2 text-center text-[13.5px] font-medium transition-all ${
                mode === "login" ? "bg-white text-zinc-950 font-semibold shadow-sm" : "text-zinc-400 hover:text-white"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                resetState();
              }}
              className={`flex-1 rounded-xl py-2 text-center text-[13.5px] font-medium transition-all ${
                mode === "register" ? "bg-white text-zinc-950 font-semibold shadow-sm" : "text-zinc-400 hover:text-white"
              }`}
            >
              Cadastrar
            </button>
          </div>
        ) : (
          <div className="mb-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                resetState();
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
                  resetState();
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
                  resetState();
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

        {/* Feedback Alerts */}
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
                        const emailInput = document.getElementById("modal-email-input");
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
          <div className="mb-4 flex items-center gap-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 p-3 text-[13.5px] text-emerald-200">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Direct Form: Login / Register */}
        {mode !== "forgot" && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {mode === "register" && (
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-zinc-300">
                  Nome de exibição
                </label>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11 w-full rounded-2xl bg-white/[0.06] pl-10 pr-3.5 text-[14px] text-white placeholder-zinc-500 outline-none border border-white/[0.12] focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-zinc-300">E-mail</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                <input
                  id="modal-email-input"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 w-full rounded-2xl bg-white/[0.06] pl-10 pr-3.5 text-[14px] text-white placeholder-zinc-500 outline-none border border-white/[0.12] focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[13px] font-medium text-zinc-300">Senha</label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setRecoveryMethod("link");
                      resetState();
                    }}
                    className="text-[12px] font-medium text-blue-400 hover:text-blue-300 hover:underline transition-colors"
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
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 w-full rounded-2xl bg-white/[0.06] pl-10 pr-10 text-[14px] text-white placeholder-zinc-500 outline-none border border-white/[0.12] focus:border-blue-500 transition-all"
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

            <button
              type="submit"
              disabled={loading}
              className="press mt-1.5 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-semibold text-[14.5px] shadow-lg shadow-blue-600/25 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : mode === "login" ? (
                "Entrar"
              ) : (
                "Criar Conta"
              )}
            </button>
          </form>
        )}

        {/* Recovery Form */}
        {mode === "forgot" && (
          <div>
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
                      className="h-11 w-full rounded-2xl bg-white/[0.06] pl-10 pr-3.5 text-[14px] text-white placeholder-zinc-500 outline-none border border-white/[0.12] focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <p className="text-[12.5px] text-zinc-400 leading-relaxed">
                  Enviaremos o link oficial para você redefinir a sua senha. Você também poderá colar o código recebido no aplicativo.
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="press mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-semibold text-[14.5px] shadow-lg shadow-blue-600/25 disabled:opacity-50 transition-all"
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
                    resetState();
                  }}
                  className="mt-1 flex items-center justify-center gap-1.5 text-[13px] text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                >
                  <KeyRound className="size-3.5" />
                  <span>Já tenho o código ou o link</span>
                </button>
              </form>
            )}

            {recoveryMethod === "code" && (
              <form onSubmit={handleConfirmResetPassword} className="flex flex-col gap-3.5">
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
                      placeholder="Cole o código ou o link recebido..."
                      value={recoveryCodeInput}
                      onChange={(e) => {
                        setRecoveryCodeInput(e.target.value);
                        setVerifiedEmail(null);
                      }}
                      className="h-11 w-full rounded-2xl bg-white/[0.06] pl-10 pr-3.5 text-[13.5px] font-mono text-white placeholder-zinc-500 outline-none border border-white/[0.12] focus:border-blue-500 transition-all"
                    />
                  </div>
                  {verifiedEmail && (
                    <p className="mt-1 text-[12px] text-emerald-400 flex items-center gap-1">
                      <Sparkles className="size-3" />
                      Código válido para {verifiedEmail}
                    </p>
                  )}
                </div>

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
                      className="h-11 w-full rounded-2xl bg-white/[0.06] pl-10 pr-10 text-[14px] text-white placeholder-zinc-500 outline-none border border-white/[0.12] focus:border-blue-500 transition-all"
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
                      className="h-11 w-full rounded-2xl bg-white/[0.06] pl-10 pr-3.5 text-[14px] text-white placeholder-zinc-500 outline-none border border-white/[0.12] focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="press mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-semibold text-[14.5px] shadow-lg shadow-emerald-600/25 disabled:opacity-50 transition-all"
                >
                  {loading ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    "Enviar Código e Redefinir Senha"
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Google Login Button */}
        {mode !== "forgot" && (
          <>
            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[12px] font-medium uppercase tracking-wider text-zinc-500">
                ou com o Google
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleGoogle}
              className="press flex w-full items-center justify-center gap-3 rounded-2xl bg-white/10 hover:bg-white/15 py-2.5 text-[14px] font-semibold text-white transition-all border border-white/10 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="size-4.5 animate-spin text-white" />
              ) : (
                <svg className="size-4.5" viewBox="0 0 24 24">
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
              <span>Continuar com o Google</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

