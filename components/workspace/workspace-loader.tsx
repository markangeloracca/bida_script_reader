"use client";

import dynamic from "next/dynamic";
import type { ViewMode } from "@/lib/store/settings-store";
import { WorkspaceSkeleton } from "./workspace-skeleton";

// The workspace relies on IndexedDB, localStorage and CodeMirror, so it is
// client-only and code-split away from the home page.
const Workspace = dynamic(() => import("./workspace"), { ssr: false, loading: () => <WorkspaceSkeleton /> });

export function WorkspaceLoader(props: { id: string; initialMode?: ViewMode }) {
  return <Workspace {...props} />;
}
