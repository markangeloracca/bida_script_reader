"use client";

import {
  BarChart3Icon,
  BookOpenIcon,
  Columns2Icon,
  DownloadIcon,
  FocusIcon,
  FolderOpenIcon,
  HashIcon,
  HomeIcon,
  ListTreeIcon,
  MonitorIcon,
  MoonIcon,
  PencilLineIcon,
  PrinterIcon,
  SaveIcon,
  SunIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useIsMac } from "@/hooks/use-platform";
import { shortcutLabel } from "@/lib/format";
import { useDocumentStore } from "@/lib/store/document-store";
import { SHORTCUTS, type WorkspaceCommands } from "./workspace-commands";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  commands: WorkspaceCommands;
}

/** ⌘K palette: jump to any scene or run any workspace command. */
export function CommandPalette({ open, onOpenChange, commands }: CommandPaletteProps) {
  const outline = useDocumentStore((s) => s.outline);
  const navigateTo = useDocumentStore((s) => s.navigateTo);
  const { setTheme } = useTheme();
  const isMac = useIsMac();

  const run = (action: () => void) => () => {
    onOpenChange(false);
    action();
  };

  const item = (label: string, icon: ReactNode, action: () => void, shortcut?: string) => (
    <CommandItem key={label} value={label} onSelect={run(action)}>
      {icon}
      {label}
      {shortcut && <CommandShortcut>{shortcutLabel(shortcut, isMac)}</CommandShortcut>}
    </CommandItem>
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Command palette" description="Jump to a scene or run a command">
      <Command>
        <CommandInput placeholder="Jump to a scene or run a command…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Scenes">
            {outline
              .filter((entry) => entry.kind === "scene")
              .map((scene) => (
                <CommandItem
                  key={scene.line}
                  value={`scene ${scene.kind === "scene" ? scene.sceneNumber : ""} ${scene.text}`}
                  onSelect={run(() => navigateTo(scene.line))}
                >
                  <span className="w-6 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                    {scene.kind === "scene" && scene.sceneNumber}
                  </span>
                  <span className="truncate font-screenplay">{scene.text}</span>
                </CommandItem>
              ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="File">
            {item("Save", <SaveIcon />, commands.save, SHORTCUTS.save)}
            {item("Save as…", <SaveIcon />, commands.saveAs, SHORTCUTS.saveAs)}
            {item("Download copy", <DownloadIcon />, commands.download)}
            {item("Print / Save as PDF", <PrinterIcon />, commands.print, SHORTCUTS.print)}
            {item("Open script…", <FolderOpenIcon />, commands.open, SHORTCUTS.open)}
            {item("Go to home", <HomeIcon />, commands.goHome)}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="View">
            {item("Edit view", <PencilLineIcon />, () => commands.setViewMode("edit"))}
            {item("Split view", <Columns2Icon />, () => commands.setViewMode("split"))}
            {item("Read view", <BookOpenIcon />, () => commands.setViewMode("read"))}
            {item("Toggle outline", <ListTreeIcon />, commands.toggleOutline, SHORTCUTS.toggleOutline)}
            {item("Toggle scene numbers", <HashIcon />, commands.toggleSceneNumbers)}
            {item("Toggle focus mode", <FocusIcon />, commands.toggleFocusMode, SHORTCUTS.focus)}
            {item("Script statistics", <BarChart3Icon />, commands.showStats)}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Theme">
            {item("Light theme", <SunIcon />, () => setTheme("light"))}
            {item("Dark theme", <MoonIcon />, () => setTheme("dark"))}
            {item("System theme", <MonitorIcon />, () => setTheme("system"))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
