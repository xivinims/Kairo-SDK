import { MessageSquare, PanelLeftClose, Plus, Settings, Sparkles } from "lucide-react";

export interface ZenoRecentChat {
  id: string;
  title: string;
  group: "Hoje" | "Ontem" | "7 dias";
}

export function ZenoSidebar({
  recent = [],
  onNewChat,
  onSettings,
  onClose,
}: {
  recent?: ZenoRecentChat[];
  onNewChat: () => void;
  onSettings: () => void;
  onClose?: () => void;
}) {
  const groups: ZenoRecentChat["group"][] = ["Hoje", "Ontem", "7 dias"];

  return (
    <aside className="zeno-sidebar">
      <div className="zeno-sidebar-head">
        <div className="zeno-brand">
          <span className="zeno-mark"><Sparkles size={15} /></span>
          <span>Zeno</span>
        </div>
        {onClose && (
          <button type="button" className="icon-button lg:hidden" onClick={onClose} aria-label="Fechar menu">
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>

      <button type="button" className="new-chat-button" onClick={onNewChat}>
        <Plus size={16} />
        Novo chat
      </button>

      <div className="zeno-sidebar-section">
        <div className="sidebar-link is-active">
          <MessageSquare size={16} />
          Conversas
        </div>
      </div>

      <div className="zeno-history no-scrollbar">
        {groups.map((group) => {
          const chats = recent.filter((chat) => chat.group === group);
          if (!chats.length) return null;
          return (
            <div key={group} className="history-group">
              <p>{group}</p>
              {chats.map((chat) => (
                <button type="button" key={chat.id} className="history-item">
                  {chat.title}
                </button>
              ))}
            </div>
          );
        })}
        {!recent.length && (
          <p className="history-empty">
            Suas conversas vão aparecer aqui quando a persistência estiver conectada.
          </p>
        )}
      </div>

      <button type="button" className="sidebar-settings" onClick={onSettings}>
        <Settings size={16} />
        Configurações
      </button>
    </aside>
  );
}
