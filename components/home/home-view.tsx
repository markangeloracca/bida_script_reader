"use client";

import { FilePlusIcon, FolderOpenIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { useOpenScript } from "@/hooks/use-open-script";
import { useIsMac } from "@/hooks/use-platform";
import { useRecents } from "@/hooks/use-recents";
import { useScriptService } from "@/hooks/use-script-service";
import { shortcutLabel } from "@/lib/format";
import { notifyError } from "@/lib/notify";
import { downloadText } from "@/lib/storage";
import { OpenDropzone } from "./open-dropzone";
import { RecentScripts } from "./recent-scripts";

/** Home screen container: wires open actions and recents to presentational parts. */
export function HomeView() {
  const opener = useOpenScript();
  const service = useScriptService();
  const { recents, remove } = useRecents();
  const isMac = useIsMac();

  useHotkeys({ "mod+o": () => opener.openWithPicker() });

  const download = async (id: string) => {
    try {
      const loaded = await service.load(id);
      if (loaded) downloadText(loaded.text, loaded.meta.fileName);
    } catch (error) {
      notifyError(error, "Could not download the script.");
    }
  };

  return (
    <>
      <OpenDropzone onFile={opener.openFile} />
      <section className="mx-auto flex w-full max-w-5xl flex-col items-start gap-6 px-6 pt-16 pb-12 sm:pt-24">
        <p className="rounded-full border px-3 py-1 text-xs text-muted-foreground">Fountain screenplay reader &amp; editor</p>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">Your screenplay, in plain text.</h1>
        <p className="max-w-xl text-lg text-pretty text-muted-foreground">
          Open a <code className="font-screenplay text-foreground">.fountain</code> file to read it as a formatted script, or start writing
          a new one. Everything stays in your browser.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="lg" onClick={() => opener.openWithPicker()}>
            <FolderOpenIcon data-icon="inline-start" /> Open script
            <kbd className="ml-1 rounded bg-primary-foreground/15 px-1.5 font-sans text-xs">{shortcutLabel("mod+o", isMac)}</kbd>
          </Button>
          <Button size="lg" variant="outline" onClick={() => opener.createNew()}>
            <FilePlusIcon data-icon="inline-start" /> New script
          </Button>
          <Button size="lg" variant="ghost" onClick={() => opener.openSample()}>
            <SparklesIcon data-icon="inline-start" /> Try the sample
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">Tip: drop a file anywhere on this page to open it.</p>
      </section>

      <RecentScripts recents={recents} onOpen={opener.reopen} onDownload={download} onRemove={remove} />
    </>
  );
}
