"use client";

import { DownloadIcon, FileTextIcon, LinkIcon, MoreHorizontalIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { plural, timeAgo } from "@/lib/format";
import type { RecentScript } from "@/lib/storage";

interface RecentScriptCardProps {
  script: RecentScript;
  onOpen(id: string): void;
  onDownload(id: string): void;
  onRemove(id: string): void;
}

/** One recent script. Presentational: all behaviour arrives through props. */
export function RecentScriptCard({ script, onOpen, onDownload, onRemove }: RecentScriptCardProps) {
  const [confirming, setConfirming] = useState(false);

  return (
    <article className="group relative flex w-full flex-col rounded-xl border bg-card text-card-foreground shadow-xs transition hover:border-foreground/20 hover:shadow-md focus-within:ring-2 focus-within:ring-ring/50">
      <button
        type="button"
        onClick={() => onOpen(script.id)}
        className="flex flex-1 flex-col gap-3 rounded-xl p-4 pr-12 text-left outline-none"
        aria-label={`Open ${script.title}`}
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <FileTextIcon className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-medium">{script.title}</h3>
            <p className="truncate text-xs text-muted-foreground">{script.fileName}</p>
          </div>
        </div>
        <p className="line-clamp-3 min-h-[3lh] font-screenplay text-xs leading-relaxed text-muted-foreground">
          {script.preview || "Empty script"}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">{plural(script.pageCount, "page")}</Badge>
          {script.hasHandle && (
            <Badge variant="outline" title="Saves go back to the original file">
              <LinkIcon aria-hidden /> Linked
            </Badge>
          )}
          <span className="ml-auto">Opened {timeAgo(script.lastOpenedAt)}</span>
        </div>
      </button>

      <div className="absolute top-3 right-3">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`More actions for ${script.title}`} />}>
            <MoreHorizontalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onOpen(script.id)}>
              <FileTextIcon /> Open
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownload(script.id)}>
              <DownloadIcon /> Download copy
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => setConfirming(true)}>
              <Trash2Icon /> Remove from recents
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove “{script.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              {script.hasHandle
                ? "The original file on your computer is not affected."
                : "This script only exists in this browser. Download a copy first if you want to keep it."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setConfirming(false);
                onRemove(script.id);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}
