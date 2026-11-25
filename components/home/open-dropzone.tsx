"use client";

import { FileUpIcon } from "lucide-react";
import { useEffect, useState } from "react";

/** Resolves the file (and its handle where supported) from a drop event. */
async function droppedFile(event: DragEvent): Promise<{ file: File; handle?: FileSystemFileHandle } | null> {
  const item = event.dataTransfer?.items?.[0];
  const file = event.dataTransfer?.files?.[0];
  if (!file) return null;
  const handle = await item?.getAsFileSystemHandle?.().catch(() => null);
  return { file, handle: handle?.kind === "file" ? (handle as FileSystemFileHandle) : undefined };
}

/** Full-window drag-and-drop target for opening a script. */
export function OpenDropzone({ onFile }: { onFile: (file: File, handle?: FileSystemFileHandle) => void }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let depth = 0;
    const hasFiles = (event: DragEvent) => event.dataTransfer?.types.includes("Files") ?? false;
    const onEnter = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      depth++;
      setActive(true);
    };
    const onLeave = () => {
      depth = Math.max(0, depth - 1);
      if (depth === 0) setActive(false);
    };
    const onOver = (event: DragEvent) => {
      if (hasFiles(event)) event.preventDefault();
    };
    const onDrop = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth = 0;
      setActive(false);
      // getAsFileSystemHandle must be called synchronously within the drop event.
      void droppedFile(event).then((result) => result && onFile(result.file, result.handle));
    };
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("dragover", onOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("drop", onDrop);
    };
  }, [onFile]);

  if (!active) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-6 backdrop-blur-sm">
      <div className="flex w-full max-w-lg flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary/40 p-12 text-center">
        <FileUpIcon className="size-10 text-muted-foreground" aria-hidden />
        <p className="text-lg font-medium">Drop to open your script</p>
        <p className="text-sm text-muted-foreground">.fountain, .spmd or .txt</p>
      </div>
    </div>
  );
}
