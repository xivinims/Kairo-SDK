import {
  Archive,
  ChevronDown,
  ChevronRight,
  Clock3,
  Cloud,
  FileCode2,
  FileImage,
  FileText,
  Folder,
  FolderOpen,
  Heart,
  Home,
  Image,
  MessageSquare,
  PanelLeftClose,
  Plus,
  Search,
  Settings,
  Share2,
  Trash2,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

export interface ZenoRecentChat {
  id: string;
  title: string;
  group: "Hoje" | "Ontem" | "7 dias";
  favorite?: boolean;
  archived?: boolean;
  shared?: boolean;
}

export type ZenoSidebarMode = "chats" | "files";
export type ZenoSidebarSection = "dashboard" | "recent" | "favorites" | "shared" | "trash" | "archive";

interface FolderItem {
  id: string;
  label: string;
  icon?: "folder" | "cloud";
  children?: Array<{ id: string; label: string; type: "folder" | "code" | "image" | "text" }>;
}

const FOLDERS: FolderItem[] = [
  {
    id: "documents",
    label: "Documentos",
    children: [
      { id: "work", label: "Trabalho", type: "folder" },
      { id: "media", label: "Imagem / Vídeos", type: "image" },
      { id: "docs", label: "Documento", type: "text" },
    ],
  },
  { id: "personal", label: "Pessoal", children: [{ id: "notes", label: "Anotações", type: "text" }] },
  { id: "project", label: "Projeto", children: [{ id: "source", label: "Código", type: "code" }] },
  { id: "cloud", label: "Nuvem", icon: "cloud", children: [{ id: "drive", label: "Google Drive", type: "folder" }] },
  { id: "crypto", label: "Criptomoedas", children: [] },
  { id: "ai", label: "Inteligência Artificial", children: [{ id: "prompts", label: "Prompts", type: "text" }] },
];

const NAV_ITEMS: Array<{ id: ZenoSidebarSection; label: string; icon: typeof Home }> = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "recent", label: "Recentes", icon: Clock3 },
  { id: "favorites", label: "Favoritos", icon: Heart },
  { id: "shared", label: "Compartilhados", icon: Users },
  { id: "trash", label: "Lixeira", icon: Trash2 },
  { id: "archive", label: "Arquivo", icon: Archive },
];

function childIcon(type: "folder" | "code" | "image" | "text") {
  if (type === "code") return FileCode2;
  if (type === "image") return FileImage;
  if (type === "text") return FileText;
  return Folder;
}

export function ZenoSidebar({
  recent = [],
  mode,
  section,
  onModeChange,
  onSectionChange,
  onOpenWorkspace,
  onPickFile,
  onSettings,
  onClose,
}: {
  recent?: ZenoRecentChat[];
  mode: ZenoSidebarMode;
  section: ZenoSidebarSection;
  onModeChange: (mode: ZenoSidebarMode) => void;
  onSectionChange: (section: ZenoSidebarSection) => void;
  onOpenWorkspace: () => void;
  onPickFile: (payload: { label: string; type: "code" | "image" | "text" | "folder" }) => void;
  onSettings: () => void;
  onClose?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    documents: true,
    project: true,
  });

  const filteredChats = useMemo(() => {
    let list = recent;
    if (section === "favorites") list = list.filter((chat) => chat.favorite);
    if (section === "shared") list = list.filter((chat) => chat.shared);
    if (section === "archive") list = list.filter((chat) => chat.archived);
    if (section === "trash") list = [];
    const normalized = query.trim().toLowerCase();
    if (normalized) list = list.filter((chat) => chat.title.toLowerCase().includes(normalized));
    return list;
  }, [query, recent, section]);

  function toggleFolder(folderId: string) {
    setOpenFolders((current) => ({ ...current, [folderId]: !current[folderId] }));
  }

  return (
    <aside className="zeno-sidebar">
      <div className="zeno-sidebar-head">
        <span />
        {onClose && (
          <button type="button" className="side-icon-button" onClick={onClose} aria-label="Fechar menu">
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>

      <p className="sidebar-label">MENU PRINCIPAL</p>
      <nav className="sidebar-main-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={section === item.id ? "sidebar-nav-item is-active" : "sidebar-nav-item"}
            onClick={() => {
              onSectionChange(item.id);
              onModeChange("chats");
            }}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
            {section === item.id && <span className="sidebar-active-line" />}
          </button>
        ))}
      </nav>

      <div className="sidebar-switch">
        <button
          type="button"
          className={mode === "chats" ? "is-active" : ""}
          onClick={() => onModeChange("chats")}
        >
          <MessageSquare size={15} />
          Histórico
        </button>
        <button
          type="button"
          className={mode === "files" ? "is-active" : ""}
          onClick={() => onModeChange("files")}
        >
          <FolderOpen size={15} />
          Arquivos
        </button>
      </div>

      <div className="sidebar-dynamic-panel no-scrollbar">
        {mode === "chats" ? (
          <div className="sidebar-chat-panel">
            <div className="sidebar-search">
              <Search size={14} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar conversas" />
            </div>

            <div className="sidebar-panel-title">
              <span>{section === "favorites" ? "Favoritos" : section === "shared" ? "Compartilhados" : section === "archive" ? "Arquivados" : section === "trash" ? "Lixeira" : "Conversas"}</span>
              <small>{filteredChats.length}</small>
            </div>

            {filteredChats.length ? (
              <div className="sidebar-chat-list">
                {filteredChats.map((chat) => (
                  <button key={chat.id} type="button" className="sidebar-chat-item">
                    <MessageSquare size={13} />
                    <span>{chat.title}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="sidebar-empty-panel">
                <MessageSquare size={20} />
                <span>
                  {section === "trash"
                    ? "A lixeira está vazia."
                    : "Seu histórico aparece aqui conforme você conversa com o Zeno."}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="sidebar-file-panel">
            <div className="sidebar-file-head">
              <span>PASTAS</span>
              <button type="button" onClick={onOpenWorkspace} title="Abrir workspace">
                <Plus size={14} />
              </button>
            </div>

            <button type="button" className="sidebar-workspace-shortcut" onClick={onOpenWorkspace}>
              <Share2 size={15} />
              Abrir workspace visual
            </button>

            <div className="sidebar-folder-tree">
              {FOLDERS.map((folder) => {
                const opened = Boolean(openFolders[folder.id]);
                const FolderIcon = folder.icon === "cloud" ? Cloud : Folder;
                return (
                  <div key={folder.id} className="folder-group">
                    <button type="button" className="folder-row" onClick={() => toggleFolder(folder.id)}>
                      <FolderIcon size={18} className={folder.icon === "cloud" ? "folder-cloud" : ""} />
                      <span>{folder.label}</span>
                      {opened ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>

                    {opened && folder.children?.length ? (
                      <div className="folder-children">
                        {folder.children.map((child) => {
                          const Icon = childIcon(child.type);
                          return (
                            <button
                              type="button"
                              key={child.id}
                              className="folder-child"
                              onClick={() => onPickFile({ label: child.label, type: child.type })}
                            >
                              <Icon size={15} />
                              <span>{child.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <button type="button" className="sidebar-upload-card" onClick={onOpenWorkspace}>
              <Image size={17} />
              <span>
                <strong>Fotos, código e documentos</strong>
                <small>Arraste e organize no canvas</small>
              </span>
            </button>
          </div>
        )}
      </div>

      <div className="sidebar-footer">
        <button type="button" onClick={onSettings}>
          <Settings size={16} />
          Configurações
        </button>
      </div>
    </aside>
  );
}
