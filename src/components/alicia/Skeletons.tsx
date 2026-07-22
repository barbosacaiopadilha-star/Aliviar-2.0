export function MapSkeleton() {
  return (
    <div className="card animate-pulse overflow-hidden">
      <div className="h-[420px] bg-sage-soft/40 md:h-[560px]" />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="card animate-pulse p-8">
        <div className="h-8 w-2/3 rounded bg-line" />
        <div className="mt-3 h-4 w-1/3 rounded bg-line" />
        <div className="mt-6 space-y-2">
          <div className="h-3 w-full rounded bg-line" />
          <div className="h-3 w-full rounded bg-line" />
          <div className="h-3 w-4/5 rounded bg-line" />
        </div>
      </div>
      <div className="card animate-pulse p-8">
        <div className="h-5 w-1/4 rounded bg-line" />
        <div className="mt-4 h-3 w-full rounded bg-line" />
        <div className="mt-2 h-3 w-full rounded bg-line" />
      </div>
    </div>
  );
}
