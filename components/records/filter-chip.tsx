import { cn } from "@/lib/utils";

const chipClass =
  "inline-flex h-11 min-w-11 cursor-pointer touch-manipulation items-center justify-center rounded-lg border px-3 text-sm font-medium";

export function FilterChip({
  href,
  selected,
  children,
}: {
  href: string;
  selected: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-current={selected ? "page" : undefined}
      className={cn(
        chipClass,
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground",
      )}
    >
      {children}
    </a>
  );
}

export function FilterButton({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        chipClass,
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground",
      )}
      onClick={onSelect}
      onPointerUp={(event) => {
        if (event.pointerType === "touch") onSelect();
      }}
    >
      {children}
    </button>
  );
}
