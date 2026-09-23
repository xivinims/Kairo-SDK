import { FileCode2, FileImage, FolderOpen, ImagePlus, Search, Trash2, Upload, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { deleteLibraryItem, downloadLibraryItem, fileToLibraryItem, listLibraryItems, type KairoLibraryItem } from "@/lib/kairo-library";

function dateLabel(timestamp: number) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(timestamp);
}

export function KairoLibrary() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<KairoLibraryItem[]>([]);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const currentId = useApp((state) => state.currentId);
  const conversations = useApp((state) => state.conversations);
  const artifacts = useApp((state) => state.artifacts);

  async function refresh() {
    setItems(await listLibraryItems());
  }

  useEffect(() => { if (open) void refresh(); }, [open]);

  const visible = useMemo(() => {
    const term = query.toLowerCase().trim();
    return items.filter((item) => !term || `${item.name} ${item.kind} ${item.mimeType}`.toLowerCase().includes(term));
  }, [items, query]);

  async function saveChatAndArtifacts() {
    const conversation = conversations.find((item) => item.id === currentId);
    if (conversation) {
      const transcript = conversation.messages.map((message) => `${message.role === "user" ? "Você" : "Kairo"}: ${message.content}`).join("\n\n");
      const chat = await import("@/lib/kairo-library").then(({ saveLibraryItem }) => saveLibraryItem({ kind: "chat", name: `${conversation.title || "conversa"}.txt`, mimeType: "text/plain", size: transcript.length, content: transcript, conversationId: conversation.id, tags: ["chat", new Date().toISOString().slice(0, 10)] }));
      setItems((previous) => [chat, ...previous]);
    }
    for (const artifact of artifacts.filter((item) => !currentId || item.conversationId === currentId)) {
      const saved = await import("@/lib/kairo-library").then(({ saveLibraryItem }) => saveLibraryItem({ kind: artifact.kind, name: artifact.title || `artefato.${artifact.language || "txt"}`, mimeType: artifact.kind === "html" ? "text/html" : "text/plain", size: artifact.content.length, content: artifact.content, conversationId: artifact.conversationId, tags: ["artefato", new Date().toISOString().slice(0, 10)] }));
      setItems((previous) => [saved, ...previous]);
    }
  }

  async function onFiles(event: React.ChangeEvent<HTMLInputElement>) {
    for (const file of Array.from(event.target.files ?? [])) {
      const saved = await fileToLibraryItem(file, currentId ?? undefined);
      setItems((previous) => [saved, ...previous]);
    }
    event.target.value = "";
  }

  async function remove(id: string) {
    await deleteLibraryItem(id);
    setItems((previous) => previous.filter((item) => item.id !== id));
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="glass-tool-button" title="Abrir biblioteca">
        <FolderOpen className="size-3.5" /> Biblioteca
      </button>
      {open ? <div className="fixed inset-0 z-[80] flex items-end justify-center p-2 sm:items-center sm:p-6">
        <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-md" aria-label="Fechar biblioteca" onClick={() => setOpen(false)} />
        <section className="relative flex max-h-[86dvh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-white/15 bg-[#111520]/90 p-4 text-white shadow-2xl backdrop-blur-3xl">
          <header className="flex items-center gap-3 border-b border-white/10 pb-3"><div className="flex size-9 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-100"><FolderOpen className="size-4" /></div><div className="min-w-0 flex-1"><h2 className="text-[15px] font-semibold">Biblioteca do Kairo</h2><p className="text-[11px] text-white/45">Chats, fotos, HTML e código organizados por data</p></div><button type="button" onClick={() => setOpen(false)} className="glass-icon-button" aria-label="Fechar"><X className="size-4" /></button></header>
          <div className="flex flex-wrap gap-2 border-b border-white/10 py-3"><button type="button" onClick={() => inputRef.current?.click()} className="glass-tool-button"><Upload className="size-3.5" /> importar arquivos</button><button type="button" onClick={() => void saveChatAndArtifacts()} className="glass-tool-button"><ImagePlus className="size-3.5" /> salvar chat e artefatos</button><div className="relative min-w-[150px] flex-1"><Search className="absolute left-3 top-2.5 size-3.5 text-white/35" /><input ref={inputRef} type="file" multiple accept="image/*,.html,.htm,.css,.js,.jsx,.ts,.tsx,.py,.json,.txt,.md,.sql" onChange={onFiles} className="hidden" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="filtrar por nome, tipo ou data" className="w-full rounded-xl border border-white/10 bg-black/20 py-2 pl-9 pr-3 text-[11px] outline-none placeholder:text-white/30" /></div></div>
          <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto py-1">{visible.length === 0 ? <div className="py-12 text-center text-[12px] text-white/35">Nenhum arquivo salvo ainda.</div> : visible.map((item) => <article key={item.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3"><div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-cyan-100">{item.kind === "image" ? <FileImage className="size-4" /> : <FileCode2 className="size-4" />}</div><div className="min-w-0 flex-1"><p className="truncate text-[12px] font-medium">{item.name}</p><p className="text-[10px] text-white/40">{item.kind} · {dateLabel(item.createdAt)} · {Math.max(1, Math.round(item.size / 1024))} KB</p></div><button type="button" onClick={() => downloadLibraryItem(item)} className="glass-icon-button" title="Baixar"><Upload className="size-3.5 rotate-180" /></button><button type="button" onClick={() => void remove(item.id)} className="glass-icon-button text-red-200/70" title="Apagar"><Trash2 className="size-3.5" /></button></article>)}</div>
        </section>
      </div> : null}
    </>
  );
}
