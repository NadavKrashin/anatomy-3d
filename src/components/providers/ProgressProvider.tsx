"use client";

import { useEffect, type ReactNode } from "react";
import { useProgressStore } from "@/store/progressStore";

/** Loads persisted learning progress once on the client. */
export function ProgressProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    void useProgressStore.getState().load();
  }, []);
  return children;
}
