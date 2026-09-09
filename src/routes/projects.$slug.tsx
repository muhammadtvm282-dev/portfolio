import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, Github } from "lucide-react";
import { getProjectBySlug } from "@/lib/site.functions";
import { Background3D } from "@/components/site/Background3D";
import { projectPreviewSrc } from "@/lib/cms-types";

export const Route = createFileRoute("/projects/$slug")({
  loader: async ({ params }) => {
    const { project } = await getProjectBySlug({ data: { slug: params.slug } });
    if (!project) throw notFound();
    return { project };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return { meta: [{ title: "Project unavailable" }, { name: "robots", content: "noindex" }] };
    }
    const p = loaderData.project;
    return {
      meta: [
        { title: `${p.name} — Muhammad` },
        { name: "description", content: p.description.slice(0, 155) },
        { property: "og:title", content: `${p.name} — Muhammad` },
        { property: "og:description", content: p.description.slice(0, 155) },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/projects/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `/projects/${params.slug}` }],
    };
  },
  notFoundComponent: ProjectMissing,
  errorComponent: ProjectMissing,
  component: ProjectDetail,
});

function ProjectMissing() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-2xl font-semibold">Project not found</h1>
      <Link to="/" className="text-sm text-primary">
        Back to portfolio
      </Link>
    </main>
  );
}

function ProjectDetail() {
  const { project } = Route.useLoaderData();
  const preview = projectPreviewSrc(project);

  return (
    <>
      <Background3D intensity="low" />
      <main className="mx-auto max-w-5xl px-6 py-24">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back
        </Link>

        <header className="mt-10">
          <p className="eyebrow">{project.category}</p>
          <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">{project.name}</h1>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5">
            <span className="status-dot size-1.5 rounded-full bg-primary" />
            <span className="eyebrow">{project.status}</span>
          </div>
        </header>

        {preview && (
          <div className="glass mt-10 overflow-hidden rounded-3xl">
            <img src={preview} alt={`${project.name} preview`} className="w-full object-cover" />
          </div>
        )}

        <p className="mt-10 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {project.description}
        </p>

        {project.technologies.length > 0 && (
          <ul className="mt-8 flex flex-wrap gap-2">
            {project.technologies.map((t) => (
              <li key={t} className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground">
                {t}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10 flex flex-wrap gap-3">
          {project.project_url && (
            <a
              href={project.project_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
            >
              {project.cta_text || "Visit Project"} <ArrowUpRight className="size-4" />
            </a>
          )}
          {project.github_url && (
            <a
              href={project.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium hover:bg-accent"
            >
              <Github className="size-4" /> GitHub
            </a>
          )}
        </div>

        {project.gallery.length > 0 && (
          <div className="mt-14 grid gap-4 sm:grid-cols-2">
            {project.gallery.map((src) => (
              <img key={src} src={src} alt="" className="rounded-2xl border border-border" loading="lazy" />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
