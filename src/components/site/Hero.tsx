import { useEffect, useRef, useState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import type { Hero as HeroData } from "@/lib/cms-types";

function useParallax(enabled: boolean) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: MouseEvent) => {
      setPos({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [enabled]);
  return pos;
}

export function Hero({ hero }: { hero: HeroData }) {
  const [interactive, setInteractive] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    setInteractive(!reduced && fine);
  }, []);

  const { x, y } = useParallax(interactive);

  const scrollTo = (target: string) => {
    if (target.startsWith("#")) {
      document.getElementById(target.slice(1))?.scrollIntoView({ behavior: "smooth" });
    } else if (target) {
      window.open(target, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <section id="home" className="relative flex min-h-[100svh] items-center px-6 pt-28 pb-16">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div className="reveal">
          {hero.eyebrow && <p className="eyebrow">{hero.eyebrow}</p>}
          <h1 className="mt-5 text-balance font-display text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
            {hero.headline}
          </h1>
          {hero.description && (
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              {hero.description}
            </p>
          )}

          <div className="mt-9 flex flex-wrap items-center gap-3">
            {hero.primaryCtaText && (
              <button
                onClick={() => scrollTo(hero.primaryCtaUrl || "#projects")}
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:shadow-[var(--glow-primary)]"
              >
                {hero.primaryCtaText}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </button>
            )}
            {hero.secondaryCtaText && (
              <button
                onClick={() => scrollTo(hero.secondaryCtaUrl || "#contact")}
                className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <Mail className="size-4" />
                {hero.secondaryCtaText}
              </button>
            )}
          </div>

          {hero.statusText && (
            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5">
              <span className="status-dot size-1.5 rounded-full bg-primary" />
              <span className="eyebrow">{hero.statusText}</span>
            </div>
          )}
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div
            ref={frameRef}
            className="relative aspect-4/5 w-full transition-transform duration-300 ease-out will-change-transform"
            style={
              interactive
                ? { transform: `perspective(1200px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg) translate3d(${x * 6}px, ${y * 6}px, 0)` }
                : undefined
            }
          >
            <div className="absolute -inset-8 rounded-[3rem] bg-[radial-gradient(circle_at_50%_35%,color-mix(in_oklab,var(--primary)_22%,transparent),transparent_65%)] blur-xl" />
            <div className="pointer-events-none absolute -inset-6 hidden rounded-full border border-border/60 sm:block" />
            <div className="pointer-events-none absolute -inset-12 hidden rounded-full border border-border/30 lg:block" />

            <div className="glass relative h-full overflow-hidden rounded-[2rem] shadow-[var(--shadow-depth)]">
              {hero.profileImage ? (
                <img
                  src={hero.profileImage}
                  alt={`${hero.name || "Muhammad"} — portrait`}
                  className="h-full w-full object-cover"
                  loading="eager"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[linear-gradient(160deg,color-mix(in_oklab,var(--primary)_10%,transparent),transparent)] text-center">
                  <span className="font-display text-6xl font-bold text-gradient">
                    {(hero.name || "M").charAt(0)}
                  </span>
                  <span className="eyebrow">Portrait not uploaded yet</span>
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
            </div>

            {hero.badgeText && (
              <div className="glass absolute -left-3 top-8 flex items-center gap-2 rounded-full px-3 py-1.5 sm:-left-6">
                <span className="status-dot size-1.5 rounded-full bg-primary" />
                <span className="eyebrow">{hero.badgeText}</span>
              </div>
            )}
            {hero.portraitLabel && (
              <div className="glass absolute -bottom-4 right-0 rounded-xl px-3 py-2 sm:-right-4">
                <span className="eyebrow">{hero.portraitLabel}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
