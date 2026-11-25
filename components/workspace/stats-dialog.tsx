"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDocumentStore } from "@/lib/store/document-store";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-2xl font-semibold tabular-nums">{value.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/** Script statistics: totals plus dialogue per character. */
export function StatsDialog({ open, onOpenChange }: { open: boolean; onOpenChange(open: boolean): void }) {
  const stats = useDocumentStore((s) => s.stats);
  const pageCount = useDocumentStore((s) => s.pages.length);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Script statistics</DialogTitle>
          <DialogDescription>Page count is approximate (one page ≈ one minute of screen time).</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Pages" value={pageCount} />
          <Stat label="Scenes" value={stats.scenes} />
          <Stat label="Words" value={stats.words} />
        </div>
        <ScrollArea className="max-h-64 rounded-lg border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-popover text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Character</th>
                <th className="px-3 py-2 text-right font-medium">Cues</th>
                <th className="px-3 py-2 text-right font-medium">Words</th>
              </tr>
            </thead>
            <tbody>
              {stats.characters.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">
                    No dialogue yet
                  </td>
                </tr>
              ) : (
                stats.characters.map((character) => (
                  <tr key={character.name} className="border-t">
                    <td className="px-3 py-1.5 font-screenplay">{character.name}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{character.cues}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{character.words.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
