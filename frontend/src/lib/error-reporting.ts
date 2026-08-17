import { toast } from "@/components/ui/toast";
import { LogFrontendError } from "../../wailsjs/go/main/App";

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Logs to the browser/webview console AND forwards to the Go-side log
 * stream (so `wails dev`'s console shows frontend and backend errors
 * together, not just whichever side the developer happens to be watching),
 * then surfaces a toast for the user.
 */
export function reportError(context: string, err: unknown): string {
  const message = messageOf(err);
  console.error(`[${context}]`, err);
  LogFrontendError(context, message).catch(() => {}); // best-effort; logging itself must never throw
  toast.add({ type: "error", title: context, description: message, priority: "high" });
  return message;
}

/**
 * Same logging path as reportError, for a summarized condition rather than
 * a caught exception (e.g. "3 repositories failed to scan").
 */
export function reportWarning(title: string, description?: string) {
  console.warn(`[${title}]`, description ?? "");
  LogFrontendError(title, description ?? "").catch(() => {});
  toast.add({ type: "warning", title, description, priority: "high" });
}
