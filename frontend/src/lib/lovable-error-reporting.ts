// Clean error reporting module.
export function reportRuntimeError(error: unknown) {
  if (typeof window === "undefined") return;
  console.error("Runtime error:", error);
}
