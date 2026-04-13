"use client";

const TRADES = [
  "All trades",
  "Electrical",
  "Plumbing",
  "Ironwork",
  "Carpentry",
  "HVAC",
  "Concrete",
  "Pipefitting",
] as const;

type TradeFilterChipsProps = {
  active: string;
  onChange: (trade: string) => void;
};

export function TradeFilterChips({ active, onChange }: TradeFilterChipsProps) {
  return (
    <div className="filterRow">
      {TRADES.map((t) => {
        const isActive = active === t;
        return (
          <button
            key={t}
            type="button"
            className={`filterChip ${isActive ? "filterChipActive" : ""}`}
            onClick={() => onChange(t)}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}
