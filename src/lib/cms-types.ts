export type Hero = {
  name: string;
  eyebrow: string;
  headline: string;
  description: string;
  primaryCtaText: string;
  primaryCtaUrl: string;
  secondaryCtaText: string;
  secondaryCtaUrl: string;
  statusText: string;
  badgeText: string;
  portraitLabel: string;
  profileImage: string;
};

export type About = {
  heading: string;
  paragraph1: string;
  paragraph2: string;
  timeline: string[];
};

export type SectionHeading = { heading: string; subheading?: string | undefined };

export type Education = {
  heading: string;
  institution: string;
  program: string;
  status: string;
  note: string;
};

export type Contact = {
  heading: string;
  subheading: string;
  primaryCtaText: string;
  email: string;
  secondaryCtaText: string;
  githubUrl: string;
};

export type Social = {
  github: string;
  linkedin: string;
  instagram: string;
  other: string;
};

export type Footer = {
  name: string;
  tagline: string;
  line2: string;
  line3: string;
};

export type Seo = {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  keywords: string;
};

export type Appearance = {
  accent: string;
  accentSecondary: string;
  radius: string;
  animationIntensity: "minimal" | "balanced" | "dynamic";
  threeDIntensity: "low" | "medium" | "high";
  portraitShape: string;
  heroLayout: string;
  preset: string;
};

export type Project = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  status: string;
  technologies: string[];
  project_url: string | null;
  github_url: string | null;
  preview_image: string | null;
  screenshot: string | null;
  gallery: string[];
  preview_title: string | null;
  preview_description: string | null;
  preview_site_name: string | null;
  preview_favicon: string | null;
  cta_text: string;
  featured: boolean;
  visible: boolean;
  published: boolean;
  sort_order: number;
};

export type Skill = { id: string; name: string; category: string; sort_order: number };
export type BuildingItem = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  sort_order: number;
  visible: boolean;
};

export type SiteData = {
  hero: Hero;
  about: About;
  projects_section: SectionHeading;
  building_section: SectionHeading;
  skills_section: SectionHeading;
  education: Education;
  contact: Contact;
  social: Social;
  footer: Footer;
  seo: Seo;
  appearance: Appearance;
  projects: Project[];
  skills: Skill[];
  building: BuildingItem[];
};

export const CONTENT_KEYS = [
  "hero",
  "about",
  "projects_section",
  "building_section",
  "skills_section",
  "education",
  "contact",
  "social",
  "footer",
  "seo",
  "appearance",
] as const;

export function projectPreviewSrc(
  p: Pick<Project, "screenshot" | "preview_image">
) {
  // Prefer a custom uploaded preview image.
  // If there isn't one, use the generated screenshot.
  return p.preview_image || p.screenshot || null;
}
