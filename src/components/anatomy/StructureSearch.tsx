"use client";

import { clsx } from "clsx";
import { Search, X } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";
import { useAnatomyData } from "@/components/providers/AnatomyDataProvider";
import { useMessages } from "@/hooks/useMessages";
import { useRevealStructure } from "@/hooks/useRevealStructure";
import { useStructureNames } from "@/hooks/useStructureNames";
import type { AnatomicalStructure } from "@/types/anatomy";
import { Kbd } from "@/components/ui/Kbd";
import { SYSTEM_COLORS } from "./systemColors";
import { TermText } from "./TermText";

export const STRUCTURE_SEARCH_INPUT_ID = "structure-search";

function SearchResult({ structure }: { structure: AnatomicalStructure }) {
  const t = useMessages();
  const { primary, secondary } = useStructureNames(structure);
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: SYSTEM_COLORS[structure.system] }}
      />
      <span className="flex min-w-0 flex-col">
        <TermText name={primary} className="text-ink truncate text-sm" />
        {secondary && (
          <TermText name={secondary} className="text-muted truncate text-xs" />
        )}
      </span>
      <span className="text-faint ms-auto shrink-0 text-xs">
        {t.systems[structure.system]}
      </span>
    </div>
  );
}

export function StructureSearch() {
  const t = useMessages();
  const { search } = useAnatomyData();
  const reveal = useRevealStructure();
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo(() => search.search(query), [search, query]);
  const showList = open && query.trim().length > 0;
  const activeId = results[activeIndex]
    ? `${listboxId}-${results[activeIndex].id}`
    : undefined;

  const choose = (structure: AnatomicalStructure) => {
    reveal(structure);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div className="relative w-full">
      <div className="border-line bg-raised focus-within:border-accent/60 flex h-10 items-center gap-2 rounded-[10px] border px-3">
        <Search className="text-muted size-4 shrink-0" aria-hidden />
        <input
          ref={inputRef}
          id={STRUCTURE_SEARCH_INPUT_ID}
          type="search"
          role="combobox"
          aria-label={t.search.label}
          aria-expanded={showList}
          aria-controls={listboxId}
          aria-activedescendant={showList ? activeId : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck={false}
          dir="auto"
          placeholder={t.search.placeholder}
          value={query}
          className="text-ink placeholder:text-faint h-full min-w-0 flex-1 bg-transparent text-sm outline-none [&::-webkit-search-cancel-button]:hidden"
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((i) => Math.min(i + 1, results.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (event.key === "Enter") {
              const structure = results[activeIndex];
              if (structure) choose(structure);
            } else if (event.key === "Escape") {
              event.stopPropagation();
              setQuery("");
              inputRef.current?.blur();
            }
          }}
        />
        {query ? (
          <button
            type="button"
            aria-label={t.viewer.close}
            className="text-muted hover:text-ink"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setQuery("")}
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : (
          <span className="max-md:hidden">
            <Kbd>/</Kbd>
          </span>
        )}
      </div>

      {showList && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={t.search.label}
          className="panel absolute inset-x-0 top-12 z-30 max-h-[min(60dvh,420px)] overflow-y-auto p-1.5"
        >
          {results.length === 0 && (
            <li className="text-muted px-3 py-3 text-sm">
              {t.search.noResults}
            </li>
          )}
          {results.map((structure, index) => (
            <li
              key={structure.id}
              id={`${listboxId}-${structure.id}`}
              role="option"
              aria-selected={index === activeIndex}
              className={clsx(
                "cursor-pointer rounded-[9px] px-3 py-2",
                index === activeIndex ? "bg-raised" : "hover:bg-raised/60",
              )}
              // mousedown, not click: fires before the input's blur closes the list.
              onMouseDown={(event) => {
                event.preventDefault();
                choose(structure);
              }}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <SearchResult structure={structure} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
