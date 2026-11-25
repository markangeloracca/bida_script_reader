import { toast } from "sonner";
import { ScriptError } from "@/lib/storage/types";

/** Shows an error as a toast; never surfaces raw exceptions to the user. */
export function notifyError(error: unknown, fallback = "Something went wrong."): void {
  const message = error instanceof ScriptError ? error.message : fallback;
  if (!(error instanceof ScriptError)) console.error(error);
  toast.error(message);
}
