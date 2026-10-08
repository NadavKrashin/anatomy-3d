import { useAnatomyData } from "@/components/providers/AnatomyDataProvider";
import { useMessages } from "@/hooks/useMessages";
import { useViewerStore } from "@/store/viewerStore";
import type { AnatomicalStructure } from "@/types/anatomy";
import { StructureLabel } from "../StructureLabel";

/**
 * Whole ↔ parts navigation: a part names the muscle it belongs to, a muscle
 * lists its parts (heads, parts of deltoid…). Each is a ruled row that
 * selects that structure.
 */
export function StructureRelations({
  structure,
}: {
  structure: AnatomicalStructure;
}) {
  const t = useMessages();
  const { registry } = useAnatomyData();
  const whole = structure.parentId ? registry.get(structure.parentId) : null;
  const parts = registry.partsOf(structure.id);
  const rows = whole ? [whole] : parts;
  if (rows.length === 0) return null;

  return (
    <section>
      <h3 className="text-ink mb-1.5 text-[14px] font-semibold">
        {whole ? t.structure.partOf : t.structure.parts}
      </h3>
      <ul className="divide-rule border-rule divide-y border-y">
        {rows.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              onClick={() => useViewerStore.getState().select(row.id)}
              className="hover:bg-wash font-title flex min-h-10 w-full items-center px-2 py-1.5 text-start text-[16px] transition-colors"
            >
              <StructureLabel structureId={row.id} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
