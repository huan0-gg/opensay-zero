import { del, get, keys, set } from 'idb-keyval';

export interface StoredRecording {
  id: string;
  createdAt: string;
  blob: Blob;
}

const PREFIX = 'rec:';
const memory = new Map<string, StoredRecording>();

function hasIndexedDb(): boolean {
  return typeof indexedDB !== 'undefined';
}

export function isExpired(createdAt: string, now: Date, maxAgeDays = 30): boolean {
  const created = new Date(createdAt).getTime();
  return now.getTime() - created > maxAgeDays * 24 * 60 * 60 * 1000;
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `rec-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const recordings = {
  async save(blob: Blob): Promise<string> {
    const id = newId();
    const record: StoredRecording = { id, createdAt: new Date().toISOString(), blob };
    if (hasIndexedDb()) await set(PREFIX + id, record);
    else memory.set(id, record);
    return id;
  },

  async get(id: string): Promise<StoredRecording | undefined> {
    if (hasIndexedDb()) return (await get<StoredRecording>(PREFIX + id)) ?? memory.get(id);
    return memory.get(id);
  },

  async url(id: string): Promise<string | null> {
    const record = await recordings.get(id);
    if (!record) return null;
    return URL.createObjectURL(record.blob);
  },

  async remove(id: string): Promise<void> {
    if (hasIndexedDb()) await del(PREFIX + id);
    memory.delete(id);
  },

  async cleanup(now = new Date()): Promise<number> {
    let removed = 0;
    if (hasIndexedDb()) {
      const allKeys = (await keys()) as string[];
      for (const key of allKeys) {
        if (typeof key !== 'string' || !key.startsWith(PREFIX)) continue;
        const record = await get<StoredRecording>(key);
        if (record && isExpired(record.createdAt, now)) {
          await del(key);
          removed += 1;
        }
      }
    }
    for (const [id, record] of memory) {
      if (isExpired(record.createdAt, now)) {
        memory.delete(id);
        removed += 1;
      }
    }
    return removed;
  },

  async clear(): Promise<void> {
    if (hasIndexedDb()) {
      const allKeys = (await keys()) as string[];
      for (const key of allKeys) {
        if (typeof key === 'string' && key.startsWith(PREFIX)) await del(key);
      }
    }
    memory.clear();
  },
};

export async function startRecording(): Promise<{ stop: () => Promise<Blob | null> } | null> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return null;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.start();

    return {
      stop: () =>
        new Promise<Blob | null>((resolve) => {
          recorder.onstop = () => {
            stream.getTracks().forEach((track) => track.stop());
            resolve(chunks.length ? new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }) : null);
          };
          recorder.stop();
        }),
    };
  } catch {
    return null;
  }
}
