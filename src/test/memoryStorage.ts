import type { KeyValueStorage } from "@/lib/progress/localProgressRepository";

/** In-memory stand-in for localStorage. */
export function createMemoryStorage(
  initial: Record<string, string> = {},
): KeyValueStorage & { dump(): Record<string, string> } {
  const items = new Map(Object.entries(initial));
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => void items.set(key, value),
    dump: () => Object.fromEntries(items),
  };
}
