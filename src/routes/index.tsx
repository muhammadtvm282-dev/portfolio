import { createFileRoute } from "@tanstack/react-router";
import { getSiteData } from "@/lib/site.functions";
import { Background3D } from "@/components/site/Background3D";
import { Nav } from "@/components/site/Nav";
import { Hero } from "@/components/site/Hero";
import { ProjectCard } from "@/components/site/ProjectCard";
import {
  AboutSection,
  BuildingSection,
  ContactSection,
  EducationSection,
  SectionTitle,
  SiteFooter,
  SkillsSection,
} from "@/components/site/Sections";

export const Route = createFileRoute("/")({
  loader: () => getSiteData(),
  head: ({ loaderData }) => {
    const seo = loaderData?.seo;
    const title = seo?.title || "Muhammad | AI Specialist & Software Engineer";
    const description =
      seo?.description ||
      "Muhammad is an Artificial Intelligence & Data Science student at MGM Polytechnic College, building AI systems, software products, and data-driven applications.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "keywords", content: seo?.keywords || "" },
        { property: "og:title", content: seo?.ogTitle || title },
        { property: "og:description", content: seo?.ogDescription || description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: "/" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: "/" }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: "Muhammad",
            jobTitle: "AI Specialist, Software Engineer, WordPress Developer",
            alumniOf: "MGM Polytechnic College, Kilimanoor",
          }),
        },
      ],
    };
  },
  errorComponent: () => (
    <main className="flex min-h-screen items-center justify-center px-6 text-center">
      <p className="text-muted-foreground">This page didn&apos;t load. Please refresh.</p>
    </main>
  ),
  component: Index,
});

function Index() {
  const data = Route.useLoaderData();
  const featured = data.projects.filter((p) => p.visible && p.published);

  return (
    <>
      <Background3D intensity={data.appearance?.threeDIntensity ?? "medium"} />
      <Nav name={data.hero?.name ?? "MUHAMMAD"} />
      <main>
        {data.hero && <Hero hero={data.hero} />}
        <AboutSection about={data.about} />

        {featured.length > 0 && (
          <section id="projects" className="relative px-6 py-24">
            <div className="mx-auto max-w-6xl">
              <SectionTitle
                heading={data.projects_section?.heading || "Things I'm building."}
                subheading={data.projects_section?.subheading}
              />
              <div className="grid gap-6 md:grid-cols-2">
                {featured.map((p, i) => (
                  <ProjectCard key={p.id} project={p} index={i} />
                ))}
              </div>
            </div>
          </section>
        )}

        <BuildingSection section={data.building_section} items={data.building} />
        <SkillsSection section={data.skills_section} skills={data.skills} />
        <EducationSection education={data.education} />
        <ContactSection contact={data.contact} />
      </main>
      <SiteFooter footer={data.footer} social={data.social} />
    </>
  );
}
