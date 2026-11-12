import { MapEditor } from "@/components/MapEditor";
import { sampleMap } from "@/lib/map/sampleMap";

export default function Home() {
  return (
    <main className="h-dvh overflow-hidden">
      <MapEditor initialMap={sampleMap} />
    </main>
  );
}