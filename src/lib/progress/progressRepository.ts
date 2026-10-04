import type { ProgressData } from "@/types/progress";

/**
 * Persistence boundary for learning progress. The app only talks to this
 * interface, so localStorage can later be replaced by IndexedDB or a backend
 * (Supabase/Postgres) without touching UI or domain logic.
 */
export interface ProgressRepository {
  load(): Promise<ProgressData>;
  save(data: ProgressData): Promise<void>;
}
