export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="border-line bg-raised flex flex-col gap-1 rounded-[12px] border p-4">
      <span className="text-muted text-xs">{label}</span>
      <span className="text-2xl font-semibold tabular-nums" dir="ltr">
        {value}
      </span>
      {hint && <span className="text-faint text-xs">{hint}</span>}
    </div>
  );
}
