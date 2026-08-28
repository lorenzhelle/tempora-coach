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
    <div className="quick-replies">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className="quick-reply-chip"
          onClick={() => onSelect(option)}
          disabled={disabled}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
