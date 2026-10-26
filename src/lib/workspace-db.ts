import type { ProductionProject } from "./studio-core";
import type { TranslationMemoryEntry } from "./translation-memory";

const DB_NAME = "kairo-gamehub";
const DB_VERSION = 1;
const PROJECTS = "projects";
const MEMORIES = "memories";
const CHUNKS = "chunks";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PROJECTS)) db.createObjectStore(PROJECTS, { keyPath: "id" });
      if (!db.objectStoreNames.contains(MEMORIES)) db.createObjectStore(MEMORIES, { keyPath: "id" });
      if (!db.objectStoreNames.contains(CHUNKS)) db.createObjectStore(CHUNKS, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveProductionProject(project: ProductionProject) {
  const db = await openDb();
  const tx = db.transaction(PROJECTS, "readwrite");
  tx.objectStore(PROJECTS).put(project);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
  db.close();
}

export async function loadProductionProject(id: string) {
  const db = await openDb();
  const tx = db.transaction(PROJECTS, "readonly");
  const value = await requestToPromise(tx.objectStore(PROJECTS).get(id)) as ProductionProject | undefined;
  db.close();
  return value;
}

export async function listProductionProjects() {
  const db = await openDb();
  const tx = db.transaction(PROJECTS, "readonly");
  const value = await requestToPromise(tx.objectStore(PROJECTS).getAll()) as ProductionProject[];
  db.close();
  return value.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveTranslationMemory(projectId: string, memory: TranslationMemoryEntry[]) {
  const db = await openDb();
  const tx = db.transaction(MEMORIES, "readwrite");
  tx.objectStore(MEMORIES).put({ id: projectId, entries: memory, savedAt: new Date().toISOString() });
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadTranslationMemory(projectId: string) {
  const db = await openDb();
  const tx = db.transaction(MEMORIES, "readonly");
  const value = await requestToPromise(tx.objectStore(MEMORIES).get(projectId)) as { entries?: TranslationMemoryEntry[] } | undefined;
  db.close();
  return value?.entries ?? [];
}

export interface WorkspaceChunk<T = unknown> {
  id: string;
  projectId: string;
  kind: "strings" | "subtitles" | "dubbing" | "scenes";
  index: number;
  data: T;
  updatedAt: string;
}

export async function saveWorkspaceChunk<T>(chunk: WorkspaceChunk<T>) {
  const db = await openDb();
  const tx = db.transaction(CHUNKS, "readwrite");
  tx.objectStore(CHUNKS).put(chunk);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function listWorkspaceChunks<T>(projectId: string, kind?: WorkspaceChunk["kind"]) {
  const db = await openDb();
  const tx = db.transaction(CHUNKS, "readonly");
  const all = await requestToPromise(tx.objectStore(CHUNKS).getAll()) as WorkspaceChunk<T>[];
  db.close();
  return all
    .filter((chunk) => chunk.projectId === projectId && (!kind || chunk.kind === kind))
    .sort((a, b) => a.index - b.index);
}
