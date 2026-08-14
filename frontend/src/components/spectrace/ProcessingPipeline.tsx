import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type StageState = "pending" | "processing" | "complete";

export function ProcessingPipeline({
  stages,
  states,
}: {
  stages: readonly string[];
  states: StageState[];
}) {
  return (
    <ol className="relative space-y-0">
      {stages.map((stage, index) => {
        const state = states[index] ?? "pending";
        const isLast = index === stages.length - 1;
        return (
          <li key={stage} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full border transition-colors",
                  state === "complete" && "border-fact/30 bg-fact-surface text-fact-foreground",
                  state === "processing" && "border-primary bg-primary text-primary-foreground",
                  state === "pending" && "border-border bg-card text-muted-foreground",
                )}
                aria-hidden
              >
                {state === "complete" ? (
                  <Check className="size-3.5" />
                ) : state === "processing" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <span className="size-1.5 rounded-full bg-current" />
                )}
              </span>
              {!isLast && (
                <span
                  className={cn(
                    "w-px flex-1 transition-colors",
                    state === "complete" ? "bg-fact/40" : "bg-border",
                  )}
                />
              )}
            </div>
            <div className={cn("pb-5", isLast && "pb-0")}>
              <p
                className={cn(
                  "text-sm transition-colors",
                  state === "pending" ? "text-muted-foreground" : "font-medium text-foreground",
                )}
              >
                {stage}
              </p>
              <p className="text-xs text-muted-foreground">
                {state === "complete"
                  ? "Completed"
                  : state === "processing"
                    ? "Processing…"
                    : "Pending"}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
