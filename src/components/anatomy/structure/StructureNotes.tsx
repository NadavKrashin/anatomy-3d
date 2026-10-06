import { useMessages } from "@/hooks/useMessages";
import type { AnatomicalStructure } from "@/types/anatomy";

const HEBREW = /[\u0590-\u05FF]/;

/** Study notes from her course summary, in her own words (Hebrew). */
export function StructureNotes({
  structure,
}: {
  structure: AnatomicalStructure;
}) {
  const t = useMessages();
  const notes = structure.studyNotes ?? [];
  if (notes.length === 0) return null;

  return (
    <section>
      <h3 className="text-ink mb-1.5 text-[14px] font-semibold">
        {t.structure.studyNotes}
      </h3>
      <div className="flex flex-col gap-3 text-[15px] leading-relaxed">
        {notes.map((note) => (
          <div key={`${note.term}|${note.text}`}>
            {/* An entry about more than this structure says which one it is. */}
            {note.shared && (
              <p className="text-graphite font-serif text-[14px]">
                {/* Her entry names are English, sometimes with her Hebrew. */}
                <bdi lang={HEBREW.test(note.term) ? undefined : "en"}>
                  {note.term}
                </bdi>
              </p>
            )}
            <p lang={note.language} dir="rtl" className="text-ink">
              {note.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
