import { MapSkeleton } from "@/components/alicia/Skeletons";

export default function MapLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse space-y-2">
        <div className="h-8 w-1/3 rounded bg-line" />
        <div className="h-4 w-2/3 rounded bg-line" />
      </div>
      <MapSkeleton />
    </div>
  );
}
