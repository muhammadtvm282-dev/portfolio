import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Github } from "lucide-react";
import type { Project } from "@/lib/cms-types";
import { projectPreviewSrc } from "@/lib/cms-types";

export function ProjectCard({ project, index }: { project: Project; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, lx: 50, ly: 50 });
  const [failed, setFailed] = useState(false);
  const preview = projectPreviewSrc(project);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setTilt({ x: (px - 0.5) * 8, y: -(py - 0.5) * 8, lx: px * 100, ly: py * 100 });
  };

  return (
    <article
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0, lx: 50, ly: 50 })}
      className="group relative overflow-hidden rounded-3xl border border-border bg-card/60 backdrop-blur-sm transition-shadow duration-300 hover:shadow-[var(--shadow-depth)]"
      style={{
        transform: `perspective(1200px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
        transition: "transform 300ms cubic-bezier(0.22,1,0.36,1), box-shadow 300ms",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(400px circle at ${tilt.lx}% ${tilt.ly}%, color-mix(in oklab, var(--primary) 14%, transparent), transparent 60%)`,
        }}
      />

      <div className="relative aspect-16/10 overflow-hidden border-b border-border bg-secondary/40">
        {preview && !failed ? (
          <img
            src={preview}
            alt={`${project.name} preview`}
            loading="lazy"
            onError={() => setFailed(true)}
            className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="eyebrow">Preview unavailable</span>
          </div>
        )}
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="glass rounded-full px-2.5 py-1 font-mono text-[0.65rem] tracking-widest">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="glass inline-flex items-center gap-1.5 rounded-full px-2.5 py-1">
            <span className="status-dot size-1.5 rounded-full bg-primary" />
            <span className="eyebrow">{project.status}</span>
          </span>
        </div>
      </div>

      <div className="relative p-6">
        <p className="eyebrow">{project.category}</p>
        <h3 className="mt-2 font-display text-xl font-semibold">{project.name}</h3>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {project.description}
        </p>

        {project.technologies.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-2">
            {project.technologies.map((t) => (
              <li
                key={t}
                className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground"
              >
                {t}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            to="/projects/$slug"
            params={{ slug: project.slug }}
            className="group/cta inline-flex items-center gap-1.5 text-sm font-medium text-foreground"
          >
            {project.cta_text || "View Project"}
            <ArrowUpRight className="size-4 transition-transform group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5" />
          </Link>
          {project.github_url && (
            <a
              href={project.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <Github className="size-4" /> GitHub
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
