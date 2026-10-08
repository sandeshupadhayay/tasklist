import { useState } from "react";

export const MIN_REMINDER = 5;
export const MAX_REMINDER = 10080;

const PRESETS = [
  { label: "10 minutes before", value: 10 },
  { label: "15 minutes before", value: 15 },
  { label: "30 minutes before", value: 30 },
  { label: "1 hour before", value: 60 },
  { label: "3 hours before", value: 180 },
  { label: "1 day before", value: 1440 },
];

const UNITS = { minutes: 1, hours: 60, days: 1440 } as const;
type Unit = keyof typeof UNITS;

interface Props {
  value: number;
  onChange: (minutes: number) => void;
}

function splitMinutes(total: number): { amount: string; unit: Unit } {
  if (total % 1440 === 0) return { amount: String(total / 1440), unit: "days" };
  if (total % 60 === 0) return { amount: String(total / 60), unit: "hours" };
  return { amount: String(total), unit: "minutes" };
}

export function ReminderPicker({ value, onChange }: Props) {
  const isPreset = PRESETS.some((p) => p.value === value);
  const initial = isPreset ? { amount: "2", unit: "hours" as Unit } : splitMinutes(value);
  const [custom, setCustom] = useState(!isPreset);
  const [amount, setAmount] = useState(initial.amount);
  const [unit, setUnit] = useState<Unit>(initial.unit);

  function handleSelect(selected: string) {
    if (selected === "custom") {
      setCustom(true);
      onChange(Math.round(Number(amount) * UNITS[unit]));
    } else {
      setCustom(false);
      onChange(Number(selected));
    }
  }

  function handleCustom(nextAmount: string, nextUnit: Unit) {
    setAmount(nextAmount);
    setUnit(nextUnit);
    onChange(Math.round(Number(nextAmount) * UNITS[nextUnit]));
  }

  const invalid = !Number.isFinite(value) || value < MIN_REMINDER || value > MAX_REMINDER;

  return (
    <div className="reminder-picker">
      <select value={custom ? "custom" : String(value)} onChange={(e) => handleSelect(e.target.value)}>
        {PRESETS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
        <option value="custom">Custom...</option>
      </select>

      {custom && (
        <div className="reminder-custom">
          <input
            type="number"
            min={1}
            step={1}
            value={amount}
            onChange={(e) => handleCustom(e.target.value, unit)}
            aria-label="Reminder amount"
          />
          <select value={unit} onChange={(e) => handleCustom(amount, e.target.value as Unit)} aria-label="Reminder unit">
            <option value="minutes">minutes</option>
            <option value="hours">hours</option>
            <option value="days">days</option>
          </select>
          <span className="muted">before</span>
        </div>
      )}

      <p className={invalid ? "hint hint-error" : "hint"}>Allowed range: 5 minutes to 7 days.</p>
    </div>
  );
}