import { cn } from "@/lib/utils";

function tone(confidence: number) {
  if (confidence >= 85) return "text-fact-foreground";
  if (confidence >= 65) return "text-inference-foreground";
  return "text-conflict-foreground";
}

function barTone(confidence: number) {
  if (confidence >= 85) return "bg-fact";
  if (confidence >= 65) return "bg-inference";
  return "bg-conflict";
}

export function ConfidenceBadge({
  confidence,
  className,
  showBar = true,
}: {
  confidence: number;
  className?: string;
  showBar?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {showBar && (
        <span className="h-1.5 w-12 overflow-hidden rounded-full bg-border" aria-hidden>
          <span
            className={cn("block h-full rounded-full transition-all", barTone(confidence))}
            style={{ width: `${confidence}%` }}
          />
        </span>
      )}
      <span className={cn("tabular text-sm font-semibold", tone(confidence))}>
        {confidence}%
      </span>
    </span>
  );
}

export function QualityScore({
  score,
  size = "md",
  className,
}: {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dimension = size === "lg" ? 96 : size === "md" ? 64 : 44;
  const stroke = size === "lg" ? 8 : size === "md" ? 6 : 4;
  const radius = (dimension - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const color =
    score >= 85 ? "var(--fact)" : score >= 70 ? "var(--inference)" : "var(--conflict)";

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: dimension, height: dimension }}
      role="img"
      aria-label={`Quality score ${score} out of 100`}
    >
      <svg width={dimension} height={dimension} className="-rotate-90">
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (circumference * score) / 100}
          className="transition-all duration-700"
        />
      </svg>
      <span
        className={cn(
          "tabular absolute font-semibold",
          size === "lg" ? "text-2xl" : size === "md" ? "text-base" : "text-xs",
        )}
      >
        {score}
      </span>
    </div>
  );
}

export function MetricBar({
  label,
  value,
  suffix = "%",
  toneClass = "bg-primary",
}: {
  label: string;
  value: number;
  suffix?: string;
  toneClass?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="tabular text-sm font-semibold">
          {value}
          {suffix}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className={cn("h-full rounded-full transition-all duration-700", toneClass)}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}
