import { useRef, useState } from "react";
import type { ChangeEvent, PointerEvent as ReactPointerEvent } from "react";
import {
  Braces,
  Code2,
  FileImage,
  FileText,
  ImagePlus,
  Plus,
  Sparkles,
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
    title: "Ideia",
    content: "Descreva aqui o que você está montando.",
    x: 410,
    y: 92,
    width: 300,
    height: 180,
  },
  {
    id: "context",
    type: "text",
    title: "Contexto",
    content: "Organize referências e anotações movendo os blocos pelo canvas.",
    x: 90,
    y: 245,
    width: 290,
    height: 185,
  },
  {
    id: "code",
    type: "code",
    title: "Código",
    content: "export function example() {\n  return \"Mova este bloco livremente\";\n}",
    x: 450,
    y: 365,
    width: 355,
    height: 225,
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
          ? "// Cole ou importe seu código aqui."
          : initialNode.type === "image"
            ? "Imagem"
            : "Adicione seu conteúdo aqui.",
      x: 180,
      y: 145,
      width: initialNode.type === "code" ? 355 : 300,
      height: initialNode.type === "image" ? 320 : 205,
    };
    return [imported, ...starterNodes.map((node) => ({ ...node, x: node.x + 170 }))];
  });
  const [drag, setDrag] = useState<DragState | null>(null);
  const [selected, setSelected] = useState<string | null>(initialNode ? "imported" : "prompt");
  const uploadRef = useRef<HTMLInputElement>(null);

  function addNode(type: WorkspaceNodeType, partial?: Partial<WorkspaceNode>) {
    const offset = (nodes.length % 5) * 34;
    const next: WorkspaceNode = {
      id: id(type),
      type,
      title:
        partial?.title ??
        (type === "image" ? "Imagem" : type === "code" ? "Código" : type === "prompt" ? "Ideia" : "Anotação"),
      content:
        partial?.content ??
        (type === "code"
          ? "// Cole ou escreva seu código aqui"
          : type === "prompt"
            ? "Escreva o que você quer fazer."
            : "Escreva suas anotações aqui."),
      imageUrl: partial?.imageUrl,
      x: partial?.x ?? 130 + offset,
      y: partial?.y ?? 110 + offset,
      width: partial?.width ?? (type === "image" ? 300 : type === "code" ? 355 : 290),
      height: partial?.height ?? (type === "image" ? 320 : type === "code" ? 225 : 185),
    };
    setNodes((current) => [...current, next]);
    setSelected(next.id);
  }

  function updateNode(nodeId: string, patch: Partial<WorkspaceNode>) {
    setNodes((current) => current.map((node) => (node.id === nodeId ? { ...node, ...patch } : node)));
  }

  function beginDrag(event: ReactPointerEvent<HTMLDivElement>, node: WorkspaceNode) {
    const target = event.target as HTMLElement;
    if (target.closest("textarea, input")) return;

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
    updateNode(drag.id, {
      x: Math.max(16, drag.originX + event.clientX - drag.startX),
      y: Math.max(16, drag.originY + event.clientY - drag.startY),
    });
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    setDrag(null);
  }

  function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    files.forEach((file, index) => {
      const reader = new FileReader();
      const x = 115 + ((nodes.length + index) % 4) * 58;
      const y = 105 + ((nodes.length + index) % 5) * 50;

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

  function askZenoAboutWorkspace() {
    const textNodes = nodes
      .filter((node) => node.type !== "image")
      .map((node) => `[${node.title}]\n${node.content}`)
      .join("\n\n");

    const images = nodes
      .filter((node) => node.type === "image")
      .map((node) => node.title)
      .filter(Boolean);

    const imageContext = images.length
      ? `\n\nImagens organizadas no workspace: ${images.join(", ")}.`
      : "";

    onUseInChat(
      `Estou organizando estas ideias no workspace. Me ajude a continuar a partir deste contexto:\n\n${textNodes || "Ainda não adicionei texto."}${imageContext}`,
    );
  }

  function clearWorkspace() {
    setNodes([]);
    setSelected(null);
  }

  return (
    <div className="zeno-workspace">
      <div className="workspace-toolbar">
        <div className="workspace-title">
          <span className="workspace-status-dot" />
          <div>
            <strong>Workspace</strong>
            <span>Mova os blocos como quiser e depois peça ajuda ao Zeno</span>
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
          <button type="button" onClick={() => addNode("prompt")}><Plus size={15} /> Ideia</button>
          <button type="button" className="workspace-ask" onClick={askZenoAboutWorkspace}><Sparkles size={15} /> Pedir ajuda</button>
          <button type="button" className="workspace-danger" onClick={clearWorkspace} title="Limpar workspace"><Trash2 size={15} /></button>
          <button type="button" className="workspace-close" onClick={onClose} title="Fechar workspace"><X size={16} /></button>
        </div>
      </div>

      <div className="workspace-canvas">
        <div className="workspace-grid" />

        {nodes.map((node) => {
          const Icon = iconFor(node.type);
          const isSelected = selected === node.id;

          return (
            <div
              key={node.id}
              className={[
                "workspace-node",
                `workspace-node-${node.type}`,
                isSelected ? "is-selected" : "",
              ].join(" ")}
              style={{
                left: node.x,
                top: node.y,
                width: node.width,
                height: node.height,
                zIndex: isSelected ? 8 : 4,
              }}
              onPointerDown={(event) => beginDrag(event, node)}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onClick={() => setSelected(node.id)}
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
              </div>

              <div className="workspace-node-content workspace-node-content-simple">
                {node.type === "image" ? (
                  node.imageUrl ? (
                    <img src={node.imageUrl} alt={node.title} draggable={false} />
                  ) : (
                    <div className="workspace-image-placeholder">
                      <ImagePlus size={23} />
                      <span>Importe uma imagem pela barra acima</span>
                    </div>
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
            </div>
          );
        })}

        {!nodes.length && (
          <button type="button" className="workspace-empty" onClick={() => addNode("prompt")}>
            <Plus size={22} />
            <strong>Adicionar primeiro bloco</strong>
            <span>Depois você pode mover tudo livremente pelo canvas.</span>
          </button>
        )}
      </div>
    </div>
  );
}
