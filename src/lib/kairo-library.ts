export type KairoLibraryKind = "chat" | "code" | "html" | "image" | "file";

export interface KairoLibraryItem {
  id: string;
  kind: KairoLibraryKind;
  name: string;
  mimeType: string;
  size: number;
  createdAt: number;
  conversationId?: string;
  content?: string;
  dataUrl?: string;
  tags?: string[];
}

const DB_NAME = "kairo-library";
const STORE_NAME = "items";
const FALLBACK_KEY = "kairo-library-items";

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function readFallback(): KairoLibraryItem[] {
  try {
    const value = localStorage.getItem(FALLBACK_KEY);
    return value ? JSON.parse(value) as KairoLibraryItem[] : [];
  } catch {
    return [];
  }
}

function writeFallback(items: KairoLibraryItem[]) {
  localStorage.setItem(FALLBACK_KEY, JSON.stringify(items.slice(0, 500)));
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function listLibraryItems(): Promise<KairoLibraryItem[]> {
  if (typeof indexedDB === "undefined") return readFallback();
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve((request.result as KairoLibraryItem[]).sort((a, b) => b.createdAt - a.createdAt));
      request.onerror = () => reject(request.error);
    });
  } catch {
    return readFallback();
  }
}

export async function saveLibraryItem(item: Omit<KairoLibraryItem, "id" | "createdAt"> & { createdAt?: number }) {
  const saved: KairoLibraryItem = { ...item, id: makeId(), createdAt: item.createdAt ?? Date.now() };
  if (typeof indexedDB === "undefined") {
    writeFallback([saved, ...readFallback()]);
    return saved;
  }
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const request = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put(saved);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    writeFallback([saved, ...readFallback()]);
  }
  return saved;
}

export async function deleteLibraryItem(id: string) {
  if (typeof indexedDB === "undefined") {
    writeFallback(readFallback().filter((item) => item.id !== id));
    return;
  }
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const request = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    writeFallback(readFallback().filter((item) => item.id !== id));
  }
}

export function libraryKindForFile(file: File): KairoLibraryKind {
  if (file.type.startsWith("image/")) return "image";
  if (file.type === "text/html" || file.name.endsWith(".html")) return "html";
  if (/(javascript|typescript|json|css|python|x-python|shell)/i.test(file.type) || /\.(ts|tsx|js|jsx|py|json|css|sh|sql)$/i.test(file.name)) return "code";
  return "file";
}

export async function fileToLibraryItem(file: File, conversationId?: string) {
  const kind = libraryKindForFile(file);
  const isText = kind === "code" || kind === "html" || file.type.startsWith("text/") || file.type === "application/json";
  if (isText) {
    return saveLibraryItem({ kind, name: file.name, mimeType: file.type || "text/plain", size: file.size, content: await file.text(), conversationId });
  }
  return saveLibraryItem({ kind, name: file.name, mimeType: file.type || "application/octet-stream", size: file.size, dataUrl: await toDataUrl(file), conversationId });
}

function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function downloadLibraryItem(item: KairoLibraryItem) {
  const value = item.content ?? item.dataUrl;
  if (!value) return;
  const url = item.dataUrl ?? URL.createObjectURL(new Blob([value], { type: item.mimeType }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = item.name || `kairo-${item.kind}`;
  anchor.click();
  if (!item.dataUrl) URL.revokeObjectURL(url);
}
