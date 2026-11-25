import { HistoryIcon } from "lucide-react";
import type { RecentScript } from "@/lib/storage";
import { RecentScriptCard } from "./recent-script-card";

interface RecentScriptsProps {
  recents: RecentScript[] | null;
  onOpen(id: string): void;
  onDownload(id: string): void;
  onRemove(id: string): void;
}

/** Grid of recent scripts with loading and empty states. */
export function RecentScripts({ recents, ...actions }: RecentScriptsProps) {
  return (
    <section aria-labelledby="recents-heading" className="mx-auto w-full max-w-5xl px-6 pb-24">
      <h2 id="recents-heading" className="mb-4 text-sm font-medium text-muted-foreground">
        Recent scripts
      </h2>

      {recents === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy>
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl border bg-muted/40" />
          ))}
        </div>
      ) : recents.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-14 text-center">
          <HistoryIcon className="size-8 text-muted-foreground" aria-hidden />
          <p className="font-medium">No recent scripts yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Scripts you open or create will show up here so you can pick up where you left off.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recents.map((script) => (
            <li key={script.id} className="flex">
              <RecentScriptCard script={script} {...actions} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
