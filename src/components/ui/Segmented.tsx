import { clsx } from "clsx";

interface SegmentedProps<T extends string | number> {
  name: string;
  legend: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** A pill track of mutually exclusive choices (native radios, so it is keyboard and screen-reader friendly). */
export function Segmented<T extends string | number>({
  name,
  legend,
  options,
  value,
  onChange,
}: SegmentedProps<T>) {
  return (
    <fieldset>
      <legend className="text-graphite mb-2.5 text-[14px]">{legend}</legend>
      <div className="bg-wash inline-flex flex-wrap gap-1 rounded-full p-1">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <label
              key={option.value}
              className={clsx(
                "has-[:focus-visible]:ring-scrub/50 cursor-pointer rounded-full px-4 py-2 text-[14px] transition-colors has-[:focus-visible]:ring-2",
                selected
                  ? "bg-sheet text-ink shadow-[0_1px_2px_rgb(24_34_45/0.12)]"
                  : "text-graphite hover:text-ink",
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
