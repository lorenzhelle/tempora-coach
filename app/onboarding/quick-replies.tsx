"use client";

export function QuickReplies({
  options,
  onSelect,
  disabled,
}: {
  options: string[];
  onSelect: (option: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="max-w-[80%] self-start flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className="cursor-pointer rounded-chip border border-border bg-surface px-3 py-1.5 font-heading text-[13px] hover:border-accent disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => onSelect(option)}
          disabled={disabled}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
