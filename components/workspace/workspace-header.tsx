"use client";

import {
  ArrowLeftIcon,
  BarChart3Icon,
  BookOpenIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  Columns2Icon,
  DownloadIcon,
  FocusIcon,
  HashIcon,
  LoaderIcon,
  MoreVerticalIcon,
  PanelLeftIcon,
  PencilLineIcon,
  PrinterIcon,
  SaveIcon,
  SearchIcon,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMac } from "@/hooks/use-platform";
import { PAPER_SIZES } from "@/lib/fountain";
import { shortcutLabel } from "@/lib/format";
import { useDocumentStore } from "@/lib/store/document-store";
import { FONT_SIZES, useSettingsStore, type FontSize, type ViewMode } from "@/lib/store/settings-store";
import { SHORTCUTS, type WorkspaceCommands } from "./workspace-commands";

const VIEW_MODES = [
  { value: "edit", label: "Edit", Icon: PencilLineIcon },
  { value: "split", label: "Split", Icon: Columns2Icon },
  { value: "read", label: "Read", Icon: BookOpenIcon },
] as const satisfies ReadonlyArray<{ value: ViewMode; label: string; Icon: unknown }>;

function SaveStatus({ canSaveInPlace }: { canSaveInPlace: boolean }) {
  const autosave = useDocumentStore((s) => s.autosave);
  const dirty = useDocumentStore((s) => s.dirty);
  const hasHandle = useDocumentStore((s) => s.meta?.hasHandle ?? false);

  if (autosave === "error") {
    return (
      <span className="flex items-center gap-1 text-destructive">
        <CircleAlertIcon className="size-3" aria-hidden /> Autosave failed
      </span>
    );
  }
  if (autosave === "pending") {
    return (
      <span className="flex items-center gap-1">
        <LoaderIcon className="size-3 animate-spin" aria-hidden /> Saving…
      </span>
    );
  }
  const linked = canSaveInPlace && hasHandle;
  return (
    <span
      className="flex items-center gap-1"
      title={linked ? "Changes are kept in this browser until you save to the file" : "Changes are kept in this browser"}
    >
      <CircleCheckIcon className="size-3" aria-hidden />
      {dirty ? (linked ? "Saved in browser · unsaved to file" : "Saved in browser") : "All changes saved"}
    </span>
  );
}

function IconButton({
  label,
  shortcut,
  onClick,
  children,
  pressed,
}: {
  label: string;
  shortcut?: string;
  onClick(): void;
  children: React.ReactNode;
  pressed?: boolean;
}) {
  const isMac = useIsMac();
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="ghost" size="icon" aria-label={label} aria-pressed={pressed} onClick={onClick} />}>
        {children}
      </TooltipTrigger>
      <TooltipContent>
        {label}
        {shortcut && <span className="ml-2 opacity-70">{shortcutLabel(shortcut, isMac)}</span>}
      </TooltipContent>
    </Tooltip>
  );
}

interface WorkspaceHeaderProps {
  commands: WorkspaceCommands;
  canSaveInPlace: boolean;
  viewMode: ViewMode;
}

/** Workspace toolbar: navigation, title and save state, view switcher, commands. */
export function WorkspaceHeader({ commands, canSaveInPlace, viewMode }: WorkspaceHeaderProps) {
  const title = useDocumentStore((s) => s.meta?.title ?? "");
  const fileName = useDocumentStore((s) => s.meta?.fileName ?? "");
  const settings = useSettingsStore();
  const isMac = useIsMac();
  const sc = (combo: string) => shortcutLabel(combo, isMac);

  return (
    <header className="flex h-12 shrink-0 items-center gap-1 border-b bg-background px-2">
      <IconButton label="Back to home" onClick={commands.goHome}>
        <ArrowLeftIcon />
      </IconButton>
      <IconButton label="Toggle outline" shortcut={SHORTCUTS.toggleOutline} onClick={commands.toggleOutline} pressed={settings.showOutline}>
        <PanelLeftIcon />
      </IconButton>

      <div className="ml-1 flex min-w-0 flex-col leading-tight">
        <h1 className="truncate text-sm font-medium" title={fileName}>
          {title}
        </h1>
        <div className="truncate text-xs text-muted-foreground">
          <SaveStatus canSaveInPlace={canSaveInPlace} />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <ToggleGroup
          variant="outline"
          size="sm"
          spacing={0}
          value={[viewMode]}
          onValueChange={(value: string[]) => value[0] && commands.setViewMode(value[0] as ViewMode)}
          aria-label="View mode"
          className="hidden sm:flex"
        >
          {VIEW_MODES.map(({ value, label, Icon }) => (
            <ToggleGroupItem key={value} value={value} aria-label={`${label} view`}>
              <Icon />
              <span className="hidden md:inline">{label}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <IconButton label="Command palette" shortcut={SHORTCUTS.palette} onClick={commands.showPalette}>
          <SearchIcon />
        </IconButton>

        <Button variant="outline" size="sm" onClick={commands.save} className="hidden sm:inline-flex">
          <SaveIcon data-icon="inline-start" />
          {canSaveInPlace ? "Save" : "Download"}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="More options" />}>
            <MoreVerticalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={commands.save}>
                <SaveIcon /> {canSaveInPlace ? "Save" : "Save (download)"}
                <DropdownMenuShortcut>{sc(SHORTCUTS.save)}</DropdownMenuShortcut>
              </DropdownMenuItem>
              {canSaveInPlace && (
                <DropdownMenuItem onClick={commands.saveAs}>
                  <SaveIcon /> Save as…
                  <DropdownMenuShortcut>{sc(SHORTCUTS.saveAs)}</DropdownMenuShortcut>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={commands.download}>
                <DownloadIcon /> Download copy
              </DropdownMenuItem>
              <DropdownMenuItem onClick={commands.print}>
                <PrinterIcon /> Print / Save as PDF
                <DropdownMenuShortcut>{sc(SHORTCUTS.print)}</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={commands.showStats}>
                <BarChart3Icon /> Statistics
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuCheckboxItem checked={settings.showSceneNumbers} onCheckedChange={commands.toggleSceneNumbers}>
                <HashIcon /> Scene numbers
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={settings.focusMode} onCheckedChange={commands.toggleFocusMode} closeOnClick>
                <FocusIcon /> Focus mode
                <DropdownMenuShortcut>{sc(SHORTCUTS.focus)}</DropdownMenuShortcut>
              </DropdownMenuCheckboxItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Editor text size</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={settings.fontSize} onValueChange={(value: FontSize) => settings.setFontSize(value)}>
                {FONT_SIZES.map((size) => (
                  <DropdownMenuRadioItem key={size} value={size}>
                    {size}px
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Paper size</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={settings.paper} onValueChange={(value: keyof typeof PAPER_SIZES) => settings.setPaper(value)}>
                {Object.values(PAPER_SIZES).map((paper) => (
                  <DropdownMenuRadioItem key={paper.id} value={paper.id}>
                    {paper.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeToggle />
      </div>
    </header>
  );
}
