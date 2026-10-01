import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, PointerEvent as ReactPointerEvent } from "react";
import {
  Braces,
  Check,
  Code2,
  Copy,
  FileImage,
  FileText,
  ImagePlus,
  Link2,
  Plus,
  Send,
  Trash2,
  Type,
  Upload,
  X,
} from "lucide-react";

export type WorkspaceNodeType = "image" | "code" | "text" | "prompt";

export interface WorkspaceNode {
  id: string;
  type: WorkspaceNodeType;
  title: string;
  content: string;
  imageUrl?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Connection {
  id: string;
  from: string;
  to: string;
}

interface DragState {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
}

const starterNodes: WorkspaceNode[] = [
  {
    id: "prompt",
    type: "prompt",
    title: "Prompt",
    content: "Descreva o que você quer criar ou analisar usando os blocos conectados.",
    x: 410,
    y: 92,
    width: 310,
    height: 185,
  },
  {
    id: "config",
    type: "text",
    title: "Contexto",
    content: "Organize referências, requisitos, anotações ou instruções para o Zeno.",
    x: 80,
    y: 250,
    width: 300,
    height: 190,
  },
  {
    id: "code",
    type: "code",
    title: "Código",
    content: "export function example() {\n  return \"Arraste, edite e conecte este bloco\";\n}",
    x: 440,
    y: 360,
    width: 360,
    height: 230,
  },
];

function id(prefix = "node") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function iconFor(type: WorkspaceNodeType) {
  if (type === "image") return FileImage;
  if (type === "code") return Code2;
  if (type === "prompt") return Braces;
  return FileText;
}

export function ZenoWorkspace({
  initialNode,
  onClose,
  onUseInChat,
}: {
  initialNode?: { type: WorkspaceNodeType; title: string };
  onClose: () => void;
  onUseInChat: (text: string) => void;
}) {
  const [nodes, setNodes] = useState<WorkspaceNode[]>(() => {
    if (!initialNode) return starterNodes;
    const imported: WorkspaceNode = {
      id: id("imported"),
      type: initialNode.type,
      title: initialNode.title,
      content:
        initialNode.type === "code"
          ? "// Abra este bloco e cole ou importe seu código."
          : initialNode.type === "image"
            ? "Imagem"
            : "Adicione conteúdo a este arquivo.",
      x: 185,
      y: 150,
      width: initialNode.type === "code" ? 360 : 300,
      height: initialNode.type === "image" ? 330 : 210,
    };
    return [imported, ...starterNodes.map((node) => ({ ...node, x: node.x + 170 }))];
  });
  const [connections, setConnections] = useState<Connection[]>([
    { id: "c1", from: "config", to: "prompt" },
    { id: "c2", from: "prompt", to: "code" },
  ]);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [linkingFrom, setLinkingFrom] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>("prompt");
  const uploadRef = useRef<HTMLInputElement>(null);

  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  function addNode(type: WorkspaceNodeType, partial?: Partial<WorkspaceNode>) {
    const offset = (nodes.length % 5) * 32;
    const next: WorkspaceNode = {
      id: id(type),
      type,
      title:
        partial?.title ??
        (type === "image" ? "Imagem" : type === "code" ? "Código" : type === "prompt" ? "Prompt" : "Anotação"),
      content:
        partial?.content ??
        (type === "code"
          ? "// Cole ou escreva seu código aqui"
          : type === "prompt"
            ? "Escreva uma instrução para o Zeno."
            : "Escreva suas anotações aqui."),
      imageUrl: partial?.imageUrl,
      x: partial?.x ?? 140 + offset,
      y: partial?.y ?? 120 + offset,
      width: partial?.width ?? (type === "image" ? 300 : type === "code" ? 360 : 300),
      height: partial?.height ?? (type === "image" ? 330 : type === "code" ? 230 : 190),
    };
    setNodes((current) => [...current, next]);
    setSelected(next.id);
  }

  function removeNode(nodeId: string) {
    setNodes((current) => current.filter((node) => node.id !== nodeId));
    setConnections((current) => current.filter((connection) => connection.from !== nodeId && connection.to !== nodeId));
    if (selected === nodeId) setSelected(null);
    if (linkingFrom === nodeId) setLinkingFrom(null);
  }

  function duplicateNode(node: WorkspaceNode) {
    addNode(node.type, {
      ...node,
      id: undefined,
      x: node.x + 28,
      y: node.y + 28,
      title: `${node.title} cópia`,
    });
  }

  function updateNode(nodeId: string, patch: Partial<WorkspaceNode>) {
    setNodes((current) => current.map((node) => (node.id === nodeId ? { ...node, ...patch } : node)));
  }

  function beginDrag(event: ReactPointerEvent<HTMLDivElement>, node: WorkspaceNode) {
    const target = event.target as HTMLElement;
    if (target.closest("button, textarea, input")) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    setSelected(node.id);
    setDrag({
      id: node.id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: node.x,
      originY: node.y,
    });
  }

  function moveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    updateNode(drag.id, {
      x: Math.max(16, drag.originX + dx),
      y: Math.max(16, drag.originY + dy),
    });
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    setDrag(null);
  }

  function handleLink(nodeId: string) {
    if (!linkingFrom) {
      setLinkingFrom(nodeId);
      setSelected(nodeId);
      return;
    }

    if (linkingFrom === nodeId) {
      setLinkingFrom(null);
      return;
    }

    const exists = connections.some(
      (connection) =>
        (connection.from === linkingFrom && connection.to === nodeId) ||
        (connection.from === nodeId && connection.to === linkingFrom),
    );

    if (!exists) {
      setConnections((current) => [...current, { id: id("connection"), from: linkingFrom, to: nodeId }]);
    }
    setLinkingFrom(null);
  }

  function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    files.forEach((file, index) => {
      const reader = new FileReader();
      const x = 120 + ((nodes.length + index) % 4) * 55;
      const y = 110 + ((nodes.length + index) % 5) * 48;

      if (file.type.startsWith("image/")) {
        reader.onload = () => {
          addNode("image", {
            title: file.name,
            content: file.type,
            imageUrl: String(reader.result ?? ""),
            x,
            y,
          });
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = () => {
          const text = String(reader.result ?? "");
          const looksLikeCode = /\.(js|jsx|ts|tsx|py|css|html|json|rs|go|java|cpp|c|sh)$/i.test(file.name);
          addNode(looksLikeCode ? "code" : "text", {
            title: file.name,
            content: text.slice(0, 30000),
            x,
            y,
          });
        };
        reader.readAsText(file);
      }
    });

    event.target.value = "";
  }

  function useNode(node: WorkspaceNode) {
    const text =
      node.type === "image"
        ? `Use a imagem "${node.title}" como referência no workspace.`
        : `Contexto do workspace — ${node.title}:\n\n${node.content}`;
    onUseInChat(text);
  }

  function clearWorkspace() {
    setNodes([]);
    setConnections([]);
    setSelected(null);
    setLinkingFrom(null);
  }

  return (
    <div className="zeno-workspace">
      <div className="workspace-toolbar">
        <div className="workspace-title">
          <span className="workspace-status-dot" />
          <div>
            <strong>Workspace</strong>
            <span>Organize arquivos, código, imagens e ideias</span>
          </div>
        </div>

        <div className="workspace-actions">
          <input
            ref={uploadRef}
            hidden
            multiple
            type="file"
            accept="image/*,.txt,.md,.json,.js,.jsx,.ts,.tsx,.css,.html,.py,.rs,.go,.java,.cpp,.c,.sh"
            onChange={handleUpload}
          />
          <button type="button" onClick={() => uploadRef.current?.click()}><Upload size={15} /> Importar</button>
          <button type="button" onClick={() => addNode("image")}><ImagePlus size={15} /> Imagem</button>
          <button type="button" onClick={() => addNode("code")}><Code2 size={15} /> Código</button>
          <button type="button" onClick={() => addNode("text")}><Type size={15} /> Texto</button>
          <button type="button" onClick={() => addNode("prompt")}><Plus size={15} /> Prompt</button>
          <button type="button" className="workspace-danger" onClick={clearWorkspace}><Trash2 size={15} /></button>
          <button type="button" className="workspace-close" onClick={onClose}><X size={16} /></button>
        </div>
      </div>

      {linkingFrom && (
        <div className="workspace-link-hint">
          <Link2 size={14} />
          Selecione outro bloco para criar uma conexão
          <button type="button" onClick={() => setLinkingFrom(null)}>Cancelar</button>
        </div>
      )}

      <div className="workspace-canvas">
        <div className="workspace-grid" />

        <svg className="workspace-connections" aria-hidden="true">
          <defs>
            <linearGradient id="zeno-connection" x1="0" x2="1">
              <stop offset="0%" stopColor="#2ee88a" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#3cff9b" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#2ee88a" stopOpacity="0.35" />
            </linearGradient>
            <filter id="zeno-glow">
              <feGaussianBlur stdDeviation="2.6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {connections.map((connection) => {
            const from = nodeMap.get(connection.from);
            const to = nodeMap.get(connection.to);
            if (!from || !to) return null;
            const x1 = from.x + from.width;
            const y1 = from.y + from.height / 2;
            const x2 = to.x;
            const y2 = to.y + to.height / 2;
            const curve = Math.max(70, Math.abs(x2 - x1) * 0.45);
            return (
              <path
                key={connection.id}
                d={`M ${x1} ${y1} C ${x1 + curve} ${y1}, ${x2 - curve} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke="url(#zeno-connection)"
                strokeWidth="2"
                filter="url(#zeno-glow)"
              />
            );
          })}
        </svg>

        {nodes.map((node) => {
          const Icon = iconFor(node.type);
          const isSelected = selected === node.id;
          const isLinking = linkingFrom === node.id;

          return (
            <div
              key={node.id}
              className={[
                "workspace-node",
                `workspace-node-${node.type}`,
                isSelected ? "is-selected" : "",
                isLinking ? "is-linking" : "",
              ].join(" ")}
              style={{
                left: node.x,
                top: node.y,
                width: node.width,
                height: node.height,
              }}
              onPointerDown={(event) => beginDrag(event, node)}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onClick={() => {
                setSelected(node.id);
                if (linkingFrom && linkingFrom !== node.id) handleLink(node.id);
              }}
            >
              <div className="workspace-node-header">
                <div className="workspace-node-title">
                  <span><Icon size={14} /></span>
                  <input
                    value={node.title}
                    onChange={(event) => updateNode(node.id, { title: event.target.value })}
                    aria-label="Nome do bloco"
                  />
                </div>
                <div className="workspace-node-controls">
                  <button type="button" className={isLinking ? "is-active" : ""} onClick={() => handleLink(node.id)} title="Conectar">
                    <Link2 size={13} />
                  </button>
                  <button type="button" onClick={() => duplicateNode(node)} title="Duplicar">
                    <Copy size={13} />
                  </button>
                  <button type="button" onClick={() => useNode(node)} title="Usar no chat">
                    <Send size={13} />
                  </button>
                  <button type="button" onClick={() => removeNode(node.id)} title="Remover">
                    <X size={13} />
                  </button>
                </div>
              </div>

              <div className="workspace-node-content">
                {node.type === "image" ? (
                  node.imageUrl ? (
                    <img src={node.imageUrl} alt={node.title} draggable={false} />
                  ) : (
                    <button type="button" className="workspace-image-empty" onClick={() => uploadRef.current?.click()}>
                      <ImagePlus size={22} />
                      <span>Adicionar imagem</span>
                    </button>
                  )
                ) : (
                  <textarea
                    value={node.content}
                    spellCheck={node.type !== "code"}
                    className={node.type === "code" ? "workspace-code-editor" : ""}
                    onChange={(event) => updateNode(node.id, { content: event.target.value })}
                  />
                )}
              </div>

              <div className="workspace-node-footer">
                <span>{node.type === "image" ? "Visual" : node.type === "code" ? "Código" : node.type === "prompt" ? "Prompt" : "Texto"}</span>
                {isSelected && <span className="workspace-selected"><Check size={11} /> selecionado</span>}
              </div>
            </div>
          );
        })}

        {!nodes.length && (
          <button type="button" className="workspace-empty" onClick={() => addNode("prompt")}>
            <Plus size={22} />
            <strong>Adicionar primeiro bloco</strong>
            <span>Crie prompts, texto, código ou importe imagens e arquivos.</span>
          </button>
        )}
      </div>
    </div>
  );
}
