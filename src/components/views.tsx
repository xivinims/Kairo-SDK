import { useState } from "react";
import { ChevronLeft, Menu, Plus, Trash2 } from "lucide-react";
import { BubbleIcon, CodeGlyph, PuzzleIcon, TrayIcon } from "./claude-mark";
import { Markdown } from "./markdown";
import { useApp } from "@/lib/store";
import { formatRelative } from "@/lib/utils";

function Screen({
  title,
  children,
  onBack,
  action,
}: {
  title: string;
  children: React.ReactNode;
  onBack?: () => void;
  action?: React.ReactNode;
}) {
  const setSidebar = useApp((s) => s.setSidebar);
  return (
    <div className="flex h-full min-h-0 flex-col bg-bg-warm">
      <header className="flex items-center gap-1 border-b border-hairline px-2 pb-2 pt-[max(8px,env(safe-area-inset-top))]">
        {onBack ? (
          <button
            type="button"
            aria-label="Voltar"
            onClick={onBack}
            className="press flex size-11 items-center justify-center"
          >
            <ChevronLeft className="size-6" strokeWidth={1.7} />
          </button>
        ) : (
          <button
            type="button"
            aria-label="Menu"
            onClick={() => setSidebar(true)}
            className="press flex size-11 items-center justify-center md:hidden"
          >
            <Menu className="size-6" strokeWidth={1.7} />
          </button>
        )}
        <h1 className="flex-1 truncate px-1 font-display text-[26px] font-medium tracking-tight">
          {title}
        </h1>
        {action}
      </header>
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-8">
        {children}
      </div>
    </div>
  );
}

function Blank({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-20 text-center">
      <div className="mb-4 text-fg-muted">{icon}</div>
      <p className="text-[17px] font-medium">{title}</p>
      <p className="mt-1 max-w-xs text-[14px] leading-relaxed text-fg-muted">
        {body}
      </p>
    </div>
  );
}

export function ConversationsView() {
  const conversations = useApp((s) => s.conversations);
  const openConversation = useApp((s) => s.openConversation);
  const deleteConversation = useApp((s) => s.deleteConversation);
  const list = conversations.filter((c) => !c.temporary);

  return (
    <Screen title="Conversas">
      {list.length === 0 ? (
        <Blank
          icon={<BubbleIcon className="size-8" />}
          title="Nenhuma conversa ainda"
          body="Toque em Novo bate-papo para começar a falar com o Kairo."
        />
      ) : (
        <ul className="overflow-hidden rounded-group bg-muted">
          {list.map((c, i) => (
            <li
              key={c.id}
              className={i !== list.length - 1 ? "border-b border-hairline" : ""}
            >
              <div className="flex items-stretch">
                <button
                  type="button"
                  onClick={() => openConversation(c.id)}
                  className="min-w-0 flex-1 px-4 py-3.5 text-left"
                >
                  <p className="truncate text-[16px] font-medium">{c.title}</p>
                  <p className="mt-0.5 text-[13px] text-fg-muted">
                    {formatRelative(c.updatedAt)}
                    {c.messages.length
                      ? ` · ${c.messages.length} msgs`
                      : ""}
                  </p>
                </button>
                <button
                  type="button"
                  aria-label="Excluir"
                  onClick={() => deleteConversation(c.id)}
                  className="press px-3 text-fg-muted"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}

export function ProjectsView() {
  const projects = useApp((s) => s.projects);
  const addProject = useApp((s) => s.addProject);
  const openProject = useApp((s) => s.openProject);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  return (
    <Screen
      title="Projetos"
      action={
        <button
          type="button"
          aria-label="Novo projeto"
          onClick={() => setCreating(true)}
          className="press flex size-11 items-center justify-center"
        >
          <Plus className="size-5" />
        </button>
      }
    >
      {creating ? (
        <form
          className="mb-5 rounded-group bg-muted p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            addProject(name.trim(), desc.trim());
            setName("");
            setDesc("");
            setCreating(false);
          }}
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do projeto"
            className="mb-2 h-11 w-full rounded-xl bg-surface px-3 text-[16px] outline-none"
          />
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Descrição (opcional)"
            rows={3}
            className="mb-3 w-full resize-none rounded-xl bg-surface px-3 py-2 text-[15px] outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="press h-10 flex-1 rounded-pill bg-surface text-[14px] font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="press h-10 flex-1 rounded-pill bg-ink text-[14px] font-medium text-surface"
            >
              Criar
            </button>
          </div>
        </form>
      ) : null}

      {projects.length === 0 && !creating ? (
        <Blank
          icon={<TrayIcon className="size-8" />}
          title="Nenhum projeto"
          body="Agrupe conversas, arquivos e instruções em um só lugar."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {projects.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => openProject(p.id)}
                className="press w-full rounded-group bg-muted px-4 py-4 text-left"
              >
                <p className="text-[16px] font-medium">{p.name}</p>
                {p.description ? (
                  <p className="mt-1 line-clamp-2 text-[13px] text-fg-muted">
                    {p.description}
                  </p>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}

export function ProjectDetail() {
  const id = useApp((s) => s.currentProjectId);
  const projects = useApp((s) => s.projects);
  const conversations = useApp((s) => s.conversations);
  const setView = useApp((s) => s.setView);
  const newChat = useApp((s) => s.newChat);
  const deleteProject = useApp((s) => s.deleteProject);
  const openConversation = useApp((s) => s.openConversation);
  const project = projects.find((p) => p.id === id);
  const related = conversations.filter((c) => c.projectId === id);

  if (!project) return null;

  return (
    <Screen title={project.name} onBack={() => setView("projects")}>
      {project.description ? (
        <p className="mb-5 text-[15px] leading-relaxed text-fg-muted">
          {project.description}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => newChat({ projectId: project.id })}
        className="press mb-5 flex h-12 w-full items-center justify-center rounded-pill bg-ink text-[15px] font-medium text-surface"
      >
        Novo bate-papo neste projeto
      </button>
      {related.length === 0 ? (
        <p className="text-[14px] text-fg-muted">
          Ainda não há conversas neste projeto.
        </p>
      ) : (
        <ul className="overflow-hidden rounded-group bg-muted">
          {related.map((c, i) => (
            <li key={c.id} className={i ? "border-t border-hairline" : ""}>
              <button
                type="button"
                onClick={() => openConversation(c.id)}
                className="w-full px-4 py-3.5 text-left text-[16px]"
              >
                {c.title}
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={() => deleteProject(project.id)}
        className="press mt-8 text-[14px] text-fg-muted"
      >
        Excluir projeto
      </button>
    </Screen>
  );
}

export function CodeView() {
  const artifacts = useApp((s) => s.artifacts.filter((a) => a.kind === "code"));
  const openArtifact = useApp((s) => s.openArtifact);
  const setView = useApp((s) => s.setView);

  return (
    <Screen title="Código">
      {artifacts.length === 0 ? (
        <Blank
          icon={<CodeGlyph className="size-8" />}
          title="Nenhum código ainda"
          body="Peça ao Kairo para escrever, revisar ou explicar código. Os trechos longos viram artefatos aqui."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {artifacts.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => openArtifact(a.id)}
                className="press w-full rounded-group bg-muted px-4 py-4 text-left"
              >
                <p className="text-[16px] font-medium">{a.title}</p>
                <p className="mt-1 font-mono text-[12px] text-fg-muted">
                  {a.language ?? "code"}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={() => setView("home")}
        className="press mx-auto mt-6 block text-[14px] font-medium text-fg-muted"
      >
        Ir para o chat
      </button>
    </Screen>
  );
}

export function ArtifactsView() {
  const artifacts = useApp((s) => s.artifacts);
  const openArtifact = useApp((s) => s.openArtifact);

  return (
    <Screen title="Artefatos">
      {artifacts.length === 0 ? (
        <Blank
          icon={<PuzzleIcon className="size-8" />}
          title="Nenhum artefato"
          body="Quando o Kairo gerar documentos ou código mais longos, eles aparecem aqui."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {artifacts.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => openArtifact(a.id)}
                className="press w-full rounded-group bg-muted px-4 py-4 text-left"
              >
                <p className="text-[16px] font-medium">{a.title}</p>
                <p className="mt-1 text-[13px] text-fg-muted">
                  {a.kind === "html"
                    ? "Página"
                    : a.kind === "code"
                      ? a.language ?? "Código"
                      : "Documento"}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}

export function ArtifactDetail() {
  const id = useApp((s) => s.currentArtifactId);
  const artifacts = useApp((s) => s.artifacts);
  const setView = useApp((s) => s.setView);
  const deleteArtifact = useApp((s) => s.deleteArtifact);
  const art = artifacts.find((a) => a.id === id);
  if (!art) return null;

  return (
    <Screen title={art.title} onBack={() => setView("artifacts")}>
      {art.kind === "html" ? (
        <iframe
          title={art.title}
          className="h-[60vh] w-full rounded-group bg-surface"
          sandbox=""
          srcDoc={art.content}
        />
      ) : art.kind === "code" ? (
        <pre className="overflow-x-auto rounded-group bg-muted p-4 font-mono text-[13px] leading-relaxed">
          {art.content}
        </pre>
      ) : (
        <Markdown text={art.content} />
      )}
      <button
        type="button"
        onClick={() => deleteArtifact(art.id)}
        className="press mt-6 text-[14px] text-fg-muted"
      >
        Excluir artefato
      </button>
    </Screen>
  );
}
