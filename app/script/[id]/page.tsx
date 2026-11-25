import type { Metadata } from "next";
import { Suspense } from "react";
import { WorkspaceLoader } from "@/components/workspace/workspace-loader";
import { WorkspaceSkeleton } from "@/components/workspace/workspace-skeleton";
import type { ViewMode } from "@/lib/store/settings-store";

export const metadata: Metadata = { title: "Script" };

const MODES: readonly ViewMode[] = ["edit", "split", "read"];

async function Workspace({ params, searchParams }: Pick<PageProps<"/script/[id]">, "params" | "searchParams">) {
  const [{ id }, { mode }] = await Promise.all([params, searchParams]);
  return <WorkspaceLoader id={id} initialMode={MODES.find((value) => value === mode)} />;
}

/** Static shell (skeleton) with the client-only workspace streamed in once params resolve. */
export default function ScriptPage({ params, searchParams }: PageProps<"/script/[id]">) {
  return (
    <Suspense fallback={<WorkspaceSkeleton />}>
      <Workspace params={params} searchParams={searchParams} />
    </Suspense>
  );
}
