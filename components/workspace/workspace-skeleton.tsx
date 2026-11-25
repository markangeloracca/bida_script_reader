export function WorkspaceSkeleton() {
  return (
    <div className="flex h-dvh flex-col" aria-busy aria-label="Loading script">
      <div className="h-12 border-b" />
      <div className="flex flex-1 justify-center bg-(--script-paper) pt-12">
        <div className="flex w-full max-w-xl flex-col gap-3 px-6">
          {[40, 90, 75, 30, 60].map((width, i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-muted" style={{ width: `${width}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
