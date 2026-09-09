import { ArrowDown, ArrowUpRight, Github, GraduationCap, Instagram, Linkedin, Link2, Mail } from "lucide-react";
import type {
  About,
  BuildingItem,
  Contact,
  Education,
  Footer as FooterData,
  SectionHeading,
  Skill,
  Social,
} from "@/lib/cms-types";

export function SectionTitle({ heading, subheading }: SectionHeading) {
  return (
    <div className="mb-12 max-w-2xl">
      <h2 className="text-balance font-display text-3xl font-bold sm:text-4xl">{heading}</h2>
      {subheading && <p className="mt-3 text-muted-foreground">{subheading}</p>}
    </div>
  );
}

export function AboutSection({ about }: { about: About }) {
  if (!about?.heading && !about?.paragraph1) return null;
  return (
    <section id="about" className="relative px-6 py-24">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <h2 className="text-balance font-display text-3xl font-bold sm:text-4xl">{about.heading}</h2>
          {about.paragraph1 && (
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">{about.paragraph1}</p>
          )}
          {about.paragraph2 && (
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">{about.paragraph2}</p>
          )}
        </div>
        {about.timeline?.length > 0 && (
          <ol className="flex flex-col items-start gap-3 self-center">
            {about.timeline.map((step, i) => (
              <li key={step} className="w-full">
                <div className="glass flex items-center gap-3 rounded-2xl px-5 py-4 transition-transform hover:translate-x-1">
                  <span className="font-mono text-xs text-primary">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-display text-sm font-semibold tracking-[0.14em]">{step}</span>
                </div>
                {i < about.timeline.length - 1 && (
                  <ArrowDown className="mx-6 my-1 size-4 text-muted-foreground" aria-hidden />
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

export function BuildingSection({
  section,
  items,
}: {
  section: SectionHeading;
  items: BuildingItem[];
}) {
  if (!items.length) return null;
  return (
    <section id="building" className="relative px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionTitle heading={section?.heading || "Currently Building"} />
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.id} className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-display text-lg font-semibold">{item.title}</h3>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1">
                  <span className="status-dot size-1.5 rounded-full bg-primary" />
                  <span className="eyebrow">{item.status}</span>
                </span>
              </div>
              {item.subtitle && <p className="mt-2 text-sm text-muted-foreground">{item.subtitle}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SkillsSection({ section, skills }: { section: SectionHeading; skills: Skill[] }) {
  if (!skills.length) return null;
  const grouped = skills.reduce<Record<string, Skill[]>>((acc, s) => {
    (acc[s.category] ||= []).push(s);
    return acc;
  }, {});
  return (
    <section id="skills" className="relative px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionTitle heading={section?.heading || "What I work with."} />
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(grouped).map(([category, list]) => (
            <div key={category} className="glass rounded-2xl p-6">
              <p className="eyebrow">{category}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {list.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-sm text-foreground/90"
                  >
                    {s.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function EducationSection({ education }: { education: Education }) {
  if (!education?.institution) return null;
  return (
    <section id="education" className="relative px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionTitle heading={education.heading || "Education"} />
        <div className="glass flex flex-col gap-4 rounded-2xl p-8 sm:flex-row sm:items-center sm:gap-8">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/12">
            <GraduationCap className="size-6 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold">{education.institution}</h3>
            <p className="mt-1 text-muted-foreground">{education.program}</p>
            {education.status && <p className="eyebrow mt-3">{education.status}</p>}
            {education.note && <p className="mt-3 text-sm text-muted-foreground">{education.note}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ContactSection({ contact }: { contact: Contact }) {
  if (!contact?.heading) return null;
  return (
    <section id="contact" className="relative px-6 py-32">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-balance font-display text-4xl font-bold sm:text-5xl">{contact.heading}</h2>
        {contact.subheading && (
          <p className="mt-4 text-lg text-muted-foreground">{contact.subheading}</p>
        )}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {contact.email && contact.primaryCtaText && (
            <a
              href={`mailto:${contact.email}`}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-shadow hover:shadow-[var(--glow-primary)]"
            >
              <Mail className="size-4" />
              {contact.primaryCtaText}
            </a>
          )}
          {contact.githubUrl && contact.secondaryCtaText && (
            <a
              href={contact.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium hover:bg-accent"
            >
              <Github className="size-4" />
              {contact.secondaryCtaText}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

export function SiteFooter({ footer, social }: { footer: FooterData; social: Social }) {
  const links = [
    { href: social?.github, label: "GitHub", Icon: Github },
    { href: social?.linkedin, label: "LinkedIn", Icon: Linkedin },
    { href: social?.instagram, label: "Instagram", Icon: Instagram },
    { href: social?.other, label: "Website", Icon: Link2 },
  ].filter((l) => !!l.href);

  return (
    <footer className="relative border-t border-border px-6 py-14">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-sm font-bold tracking-[0.28em]">{footer?.name}</p>
          <p className="mt-3 text-sm text-muted-foreground">{footer?.tagline}</p>
          <p className="text-sm text-muted-foreground">{footer?.line2}</p>
          <p className="text-sm text-muted-foreground">{footer?.line3}</p>
        </div>
        {links.length > 0 && (
          <ul className="flex gap-2">
            {links.map(({ href, label, Icon }) => (
              <li key={label}>
                <a
                  href={href as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex size-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Icon className="size-4" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </footer>
  );
}

export { ArrowUpRight };
