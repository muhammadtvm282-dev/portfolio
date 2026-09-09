import { Suspense, lazy, useEffect, useState } from "react";

const Scene3D = lazy(() => import("./Scene3D"));

export function Background3D({ intensity = "medium" }: { intensity?: "low" | "medium" | "high" }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const weak = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const lowPower = typeof weak === "number" && weak <= 2;
    if (reduced || lowPower) return;
    const id = window.setTimeout(() => setEnabled(true), 300);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
      <div className="absolute inset-0 grid-bg opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--primary)_16%,transparent),transparent_60%)]" />
      {enabled && (
        <Suspense fallback={null}>
          <Scene3D intensity={intensity} />
        </Suspense>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
    </div>
  );
}
