import { Code2, Download, ExternalLink, FolderCode, Package, Play, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { buildWebProject, downloadArtifact, downloadProject, type KairoWebProject } from "@/lib/kairo-artifacts";

export function KairoArtifactDock() {
  const artifacts = useApp((state) => state.artifacts);
  const currentId = useApp((state) => state.currentId);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<KairoWebProject | null>(null);
  const current = useMemo(() => artifacts.filter((artifact) => !currentId || artifact.conversationId === currentId), [artifacts, currentId]);

  if (current.length === 0) return null;

  const project = buildWebProject(current, currentId || undefined);
  const html = project.files.find((file) => file.language === "html")?.content || "";

  return (
    <>
      <div className="mx-auto mb-2 flex w-full max-w-2xl items-center gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.05] p-2 text-white backdrop-blur-xl">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-violet-300/10 text-violet-100"><FolderCode className="size-3.5" /></div>
        <div className="min-w-0 flex-1"><p className="text-[11px] font-medium">Artefatos desta conversa</p><p className="truncate text-[10px] text-white/40">{current.length} arquivo(s) pronto(s) para reutilizar</p></div>
        <button type="button" onClick={() => setOpen((value) => !value)} className="shrink-0 rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-white/65 hover:bg-white/10">{open ? "fechar" : "ver arquivos"}</button>
        <button type="button" onClick={() => setPreview(project)} className="glass-icon-button shrink-0" title="Preview do projeto"><Play className="size-3.5" /></button>
        <button type="button" onClick={() => downloadProject(project)} className="glass-icon-button shrink-0" title="Baixar projeto"><Package className="size-3.5" /></button>
      </div>
      {open ? <div className="mx-auto mb-2 w-full max-w-2xl space-y-1.5 rounded-2xl border border-white/10 bg-black/20 p-2 backdrop-blur-xl">{current.map((artifact) => <div key={artifact.id} className="flex items-center gap-2 rounded-xl bg-white/[0.05] px-2.5 py-2 text-white"><Code2 className="size-3.5 text-cyan-200" /><span className="min-w-0 flex-1 truncate text-[11px]">{artifact.title}</span><span className="text-[10px] text-white/35">{artifact.language || artifact.kind}</span><button type="button" onClick={() => downloadArtifact(artifact)} className="glass-icon-button" title="Baixar arquivo"><Download className="size-3" /></button></div>)}</div> : null}
      {preview ? <div className="fixed inset-0 z-[90] flex items-end justify-center p-2 sm:items-center sm:p-6"><button type="button" className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setPreview(null)} aria-label="Fechar preview" /><section className="relative flex h-[86dvh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-white/15 bg-[#111520]/95 p-3 shadow-2xl backdrop-blur-3xl"><header className="flex items-center gap-2 border-b border-white/10 pb-2 text-white"><FolderCode className="size-4 text-violet-200" /><span className="flex-1 text-sm font-medium">Preview seguro do projeto</span><button type="button" onClick={() => setPreview(null)} className="glass-icon-button" aria-label="Fechar"><X className="size-4" /></button><button type="button" onClick={() => downloadProject(preview)} className="glass-icon-button" title="Baixar"><ExternalLink className="size-4" /></button></header><div className="min-h-0 flex-1 pt-3">{html ? <iframe title="Preview do site criado pelo Kairo" sandbox="allow-scripts" srcDoc={html} className="size-full rounded-2xl bg-white" /> : <div className="flex h-full items-center justify-center text-sm text-white/45">Este projeto ainda não possui um index.html para preview.</div>}</div></section></div> : null}
    </>
  );
}
