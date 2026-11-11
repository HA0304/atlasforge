import { MapEditor } from "@/components/MapEditor";
import { sampleMap } from "@/lib/map/sampleMap";

export default function Home() {
  return (
    <main className="flex h-dvh flex-col bg-zinc-950 text-zinc-50">
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">AtlasForge</h1>
          <p className="text-xs text-zinc-400">
            {sampleMap.name} · {sampleMap.width} × {sampleMap.height}
          </p>
        </div>
        <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-zinc-300">
          Preview
        </span>
      </header>

      <section className="relative min-h-0 flex-1 overflow-hidden">
        <MapEditor initialMap={sampleMap} />
      </section>
    </main>
  );
}