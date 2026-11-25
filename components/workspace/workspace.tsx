"use client";

import { FileQuestionIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useOpenScript } from "@/hooks/use-open-script";
import { useScriptActions } from "@/hooks/use-script-actions";
import { useWorkspaceSession } from "@/hooks/use-workspace-session";
import { useSettingsStore, type ViewMode } from "@/lib/store/settings-store";
import { CommandPalette } from "./command-palette";
import { EditorPanel } from "./editor-panel";
import { OutlinePanel } from "./outline-panel";
import { PreviewPanel } from "./preview-panel";
import { StatsDialog } from "./stats-dialog";
import { StatusBar } from "./status-bar";
import { SHORTCUTS, type WorkspaceCommands } from "./workspace-commands";
import { WorkspaceHeader } from "./workspace-header";
import { WorkspaceSkeleton } from "./workspace-skeleton";

function MissingScript() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <FileQuestionIcon className="size-10 text-muted-foreground" aria-hidden />
      <h1 className="text-lg font-medium">Script not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        It may have been removed from your recent scripts, or it was opened in another browser.
      </p>
      <Button render={<Link href="/" />}>Back to home</Button>
    </div>
  );
}

/** Editor/reader workspace for one script (container: wires stores, hooks and panels). */
export default function Workspace({ id, initialMode }: { id: string; initialMode?: ViewMode }) {
  const status = useWorkspaceSession(id);
  const router = useRouter();
  const actions = useScriptActions();
  const opener = useOpenScript();
  const settings = useSettingsStore();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [outlineSheetOpen, setOutlineSheetOpen] = useState(false);

  useEffect(() => {
    if (initialMode) useSettingsStore.getState().setViewMode(initialMode);
  }, [initialMode]);

  const commands = useMemo<WorkspaceCommands>(
    () => ({
      ...actions,
      open: opener.openWithPicker,
      goHome: () => router.push("/"),
      setViewMode: (mode) => {
        const store = useSettingsStore.getState();
        store.setViewMode(mode);
        if (store.focusMode) store.toggleFocusMode();
      },
      toggleOutline: () => (isDesktop ? useSettingsStore.getState().toggleOutline() : setOutlineSheetOpen((open) => !open)),
      toggleSceneNumbers: () => useSettingsStore.getState().toggleSceneNumbers(),
      toggleFocusMode: () => useSettingsStore.getState().toggleFocusMode(),
      showStats: () => setStatsOpen(true),
      showPalette: () => setPaletteOpen(true),
    }),
    [actions, opener, router, isDesktop],
  );

  useHotkeys({
    [SHORTCUTS.save]: commands.save,
    [SHORTCUTS.saveAs]: commands.saveAs,
    [SHORTCUTS.open]: commands.open,
    [SHORTCUTS.print]: commands.print,
    [SHORTCUTS.palette]: () => setPaletteOpen((open) => !open),
    [SHORTCUTS.togglePreview]: () => commands.setViewMode(settings.viewMode === "split" ? "edit" : "split"),
    [SHORTCUTS.toggleOutline]: commands.toggleOutline,
    [SHORTCUTS.focus]: commands.toggleFocusMode,
    ...(settings.focusMode ? { escape: commands.toggleFocusMode } : {}),
  });

  if (status === "loading") return <WorkspaceSkeleton />;
  if (status === "missing") return <MissingScript />;

  const focus = settings.focusMode;
  // Split view is too cramped on small screens; focus mode always edits full-width.
  const mode: ViewMode = focus ? "edit" : !isDesktop && settings.viewMode === "split" ? "edit" : settings.viewMode;
  const showOutline = isDesktop && settings.showOutline && !focus;

  return (
    <div className="flex h-dvh flex-col">
      {!focus && <WorkspaceHeader commands={commands} canSaveInPlace={actions.canSaveInPlace} viewMode={mode} />}

      <main className="min-h-0 flex-1">
        <ResizablePanelGroup orientation="horizontal">
          {showOutline && (
            <>
              <ResizablePanel id="outline" defaultSize="18%" minSize="12%" maxSize="35%">
                <OutlinePanel />
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}
          {mode !== "read" && (
            <ResizablePanel id="editor" minSize="25%">
              <EditorPanel />
            </ResizablePanel>
          )}
          {mode === "split" && <ResizableHandle withHandle />}
          {mode !== "edit" && (
            <ResizablePanel id="preview" minSize="25%">
              <PreviewPanel split={mode === "split"} />
            </ResizablePanel>
          )}
        </ResizablePanelGroup>
      </main>

      {focus ? (
        <p className="pointer-events-none fixed right-4 bottom-3 text-xs text-muted-foreground">Focus mode · Esc to exit</p>
      ) : (
        <StatusBar />
      )}

      <Sheet open={outlineSheetOpen} onOpenChange={setOutlineSheetOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Outline</SheetTitle>
          <OutlinePanel onNavigate={() => setOutlineSheetOpen(false)} />
        </SheetContent>
      </Sheet>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} commands={commands} />
      <StatsDialog open={statsOpen} onOpenChange={setStatsOpen} />
    </div>
  );
}
