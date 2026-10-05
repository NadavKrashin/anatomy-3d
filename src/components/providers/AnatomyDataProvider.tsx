"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { activeDataset } from "@/data/anatomy";
import {
  createMeshMapAdapter,
  type AnatomyModelAdapter,
} from "@/lib/anatomy/modelAdapter";
import { createRegistry, type AnatomyRegistry } from "@/lib/anatomy/registry";
import {
  createStructureSearch,
  type StructureSearch,
} from "@/lib/anatomy/search";
import type { AnatomyDataset } from "@/types/anatomy";

interface AnatomyData {
  dataset: AnatomyDataset;
  registry: AnatomyRegistry;
  adapter: AnatomyModelAdapter;
  search: StructureSearch;
}

const AnatomyDataContext = createContext<AnatomyData | null>(null);

export function AnatomyDataProvider({
  dataset = activeDataset,
  children,
}: {
  dataset?: AnatomyDataset;
  children: ReactNode;
}) {
  const value = useMemo<AnatomyData>(() => {
    const registry = createRegistry(dataset.structures);
    return {
      dataset,
      registry,
      adapter: createMeshMapAdapter(
        registry,
        dataset.meshMap,
        dataset.partMeshMap,
      ),
      search: createStructureSearch(dataset.structures),
    };
  }, [dataset]);

  return (
    <AnatomyDataContext.Provider value={value}>
      {children}
    </AnatomyDataContext.Provider>
  );
}

export function useAnatomyData(): AnatomyData {
  const value = useContext(AnatomyDataContext);
  if (!value)
    throw new Error("useAnatomyData must be used inside <AnatomyDataProvider>");
  return value;
}
