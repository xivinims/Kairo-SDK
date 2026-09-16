import { useState, useMemo } from "react";
import {
  BookOpen,
  Check,
  Copy,
  FileText,
  Search,
  Shield,
  X,
} from "lucide-react";
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from "@/lib/terms-data";
import { useApp } from "@/lib/store";

export function TermsModal() {
  const open = useApp((s) => s.termsModalOpen);
  const tab = useApp((s) => s.termsTab);
  const setOpen = useApp((s) => s.setTermsModalOpen);
  const setTab = useApp((s) => s.setTermsTab);

  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const currentSections = tab === "terms" ? TERMS_OF_SERVICE : PRIVACY_POLICY;

  const filteredSections = useMemo(() => {
    if (!search.trim()) return currentSections;
    const q = search.toLowerCase();
    return currentSections
      .map((sec) => {
        const titleMatch = sec.title.toLowerCase().includes(q);
        const matchingLines = sec.content.filter((line) =>
          line.toLowerCase().includes(q),
        );
        if (titleMatch || matchingLines.length > 0) {
          return {
            ...sec,
            content: titleMatch ? sec.content : matchingLines,
          };
        }
        return null;
      })
      .filter(Boolean) as typeof currentSections;
  }, [currentSections, search]);

  const totalWords = useMemo(() => {
    return currentSections.reduce((acc, sec) => {
      const titleWords = sec.title.split(/\s+/).length;
      const contentWords = sec.content.reduce(
        (cAcc, line) => cAcc + line.split(/\s+/).length,
        0,
      );
      return acc + titleWords + contentWords;
    }, 0);
  }, [currentSections]);

  if (!open) return null;

  const handleCopy = () => {
    const fullText = currentSections
      .map((s) => `${s.title}\n\n${s.content.join("\n\n")}`)
      .join("\n\n" + "-".repeat(40) + "\n\n");
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className="fixed inset-0 bg-black/80 backdrop-blur-xl transition-opacity animate-in fade-in"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-title"
        className="relative z-10 flex h-full max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-[#141418] border border-white/10 text-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              {tab === "terms" ? (
                <FileText className="size-5" />
              ) : (
                <Shield className="size-5" />
              )}
            </div>
            <div>
              <h2 id="legal-title" className="text-[17px] font-bold text-white tracking-tight">
                {tab === "terms"
                  ? "Termos de Serviço do Kairo AI"
                  : "Política de Privacidade e LGPD"}
              </h2>
              <p className="text-[12.5px] text-zinc-400">
                {totalWords.toLocaleString("pt-BR")} palavras de conformidade jurídica
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              title="Copiar texto completo"
              className="press flex items-center gap-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] px-3 py-1.5 text-[12.5px] font-medium text-zinc-300 transition-all"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span>Copiar</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar termos"
              className="press flex size-9 items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.14] text-zinc-400 hover:text-white transition-all"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Tab switcher + search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-white/[0.06] bg-[#101014] px-5 py-3">
          <div className="flex rounded-full bg-[#1c1d22] p-1 border border-white/5 self-start">
            <button
              type="button"
              onClick={() => {
                setTab("terms");
                setSearch("");
              }}
              className={`press rounded-full px-4 py-1.5 text-[13px] font-medium transition-all ${
                tab === "terms"
                  ? "bg-white text-black font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Termos de Serviço
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("privacy");
                setSearch("");
              }}
              className={`press rounded-full px-4 py-1.5 text-[13px] font-medium transition-all ${
                tab === "privacy"
                  ? "bg-white text-black font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Política de Privacidade
            </button>
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cláusula ou artigo..."
              className="w-full rounded-full bg-[#1a1b20] border border-white/10 pl-8 pr-3 py-1.5 text-[13px] text-white placeholder:text-zinc-500 outline-none focus:border-blue-500/60"
            />
          </div>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-6 space-y-7 text-zinc-300 text-[14px] leading-relaxed">
          {filteredSections.length === 0 ? (
            <div className="py-12 text-center text-zinc-500">
              <Search className="size-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma cláusula encontrada para &quot;{search}&quot;</p>
            </div>
          ) : (
            filteredSections.map((section) => (
              <div
                key={section.id}
                id={section.id}
                className="space-y-3 rounded-xl bg-white/[0.02] border border-white/[0.05] p-4 sm:p-5"
              >
                <h3 className="text-[15px] font-bold text-white tracking-wide border-b border-white/[0.06] pb-2">
                  {section.title}
                </h3>
                <div className="space-y-2.5">
                  {section.content.map((paragraph, idx) => (
                    <p key={idx} className="text-zinc-300 text-[13.5px] leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Legal Footer Note */}
          <div className="border-t border-white/10 pt-6 text-center text-[12px] text-zinc-500 space-y-1 pb-4">
            <p>Kairo AI © 2026. Todos os direitos reservados.</p>
            <p>
              Documento elaborado em estrita conformidade com a LGPD (Lei nº 13.709/2018),
              Marco Civil da Internet (Lei nº 12.965/2014) e Código de Defesa do Consumidor (Lei nº 8.078/1990).
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-white/[0.08] bg-[#101014] px-5 py-3">
          <div className="flex items-center gap-1.5 text-[12px] text-zinc-400">
            <BookOpen className="size-3.5 text-blue-400" />
            <span>Versão jurídica 2026.2</span>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="press rounded-full bg-white px-5 py-1.5 text-[13px] font-semibold text-black hover:bg-zinc-200 transition-all shadow-sm"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
