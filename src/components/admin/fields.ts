export type Field = {
  key: string;
  label: string;
  type: "text" | "textarea" | "image" | "list" | "select";
  options?: string[];
  help?: string;
};

export const CONTENT_SCHEMAS: Record<string, { title: string; fields: Field[] }> = {
  hero: {
    title: "Hero",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "eyebrow", label: "Professional title line", type: "text" },
      { key: "headline", label: "Main headline", type: "textarea" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "primaryCtaText", label: "Primary button text", type: "text" },
      { key: "primaryCtaUrl", label: "Primary button target", type: "text", help: "Use #projects or a full link" },
      { key: "secondaryCtaText", label: "Secondary button text", type: "text" },
      { key: "secondaryCtaUrl", label: "Secondary button target", type: "text" },
      { key: "statusText", label: "Status text", type: "text" },
      { key: "badgeText", label: "Portrait badge", type: "text" },
      { key: "portraitLabel", label: "Portrait label", type: "text" },
      { key: "profileImage", label: "Profile photo", type: "image" },
    ],
  },
  about: {
    title: "About",
    fields: [
      { key: "heading", label: "Heading", type: "text" },
      { key: "paragraph1", label: "First paragraph", type: "textarea" },
      { key: "paragraph2", label: "Second paragraph", type: "textarea" },
      { key: "timeline", label: "Timeline steps", type: "list" },
    ],
  },
  projects_section: {
    title: "Projects section",
    fields: [
      { key: "heading", label: "Heading", type: "text" },
      { key: "subheading", label: "Subheading", type: "text" },
    ],
  },
  building_section: {
    title: "Currently Building heading",
    fields: [{ key: "heading", label: "Heading", type: "text" }],
  },
  skills_section: {
    title: "Skills heading",
    fields: [{ key: "heading", label: "Heading", type: "text" }],
  },
  education: {
    title: "Education",
    fields: [
      { key: "heading", label: "Heading", type: "text" },
      { key: "institution", label: "Institution", type: "text" },
      { key: "program", label: "Program", type: "text" },
      { key: "status", label: "Status", type: "text" },
      { key: "note", label: "Note", type: "textarea" },
    ],
  },
  contact: {
    title: "Contact",
    fields: [
      { key: "heading", label: "Headline", type: "text" },
      { key: "subheading", label: "Supporting text", type: "text" },
      { key: "primaryCtaText", label: "Primary button text", type: "text" },
      { key: "email", label: "Email address", type: "text" },
      { key: "secondaryCtaText", label: "Secondary button text", type: "text" },
      { key: "githubUrl", label: "GitHub URL", type: "text" },
    ],
  },
  social: {
    title: "Social links",
    fields: [
      { key: "github", label: "GitHub", type: "text" },
      { key: "linkedin", label: "LinkedIn", type: "text" },
      { key: "instagram", label: "Instagram", type: "text" },
      { key: "other", label: "Other", type: "text" },
    ],
  },
  footer: {
    title: "Footer",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "tagline", label: "Tagline", type: "text" },
      { key: "line2", label: "Line 2", type: "text" },
      { key: "line3", label: "Line 3", type: "text" },
    ],
  },
  seo: {
    title: "SEO",
    fields: [
      { key: "title", label: "Page title", type: "text" },
      { key: "description", label: "Meta description", type: "textarea" },
      { key: "ogTitle", label: "Open Graph title", type: "text" },
      { key: "ogDescription", label: "Open Graph description", type: "textarea" },
      { key: "ogImage", label: "Open Graph image", type: "image" },
      { key: "keywords", label: "Keywords", type: "text" },
    ],
  },
  appearance: {
    title: "Appearance",
    fields: [
      { key: "accent", label: "Accent colour", type: "text", help: "Hex value, e.g. #3B82F6" },
      { key: "accentSecondary", label: "Secondary accent", type: "text" },
      { key: "radius", label: "Corner rounding", type: "text", help: "e.g. 1rem" },
      { key: "animationIntensity", label: "Animation intensity", type: "select", options: ["minimal", "balanced", "dynamic"] },
      { key: "threeDIntensity", label: "3D intensity", type: "select", options: ["low", "medium", "high"] },
      { key: "portraitShape", label: "Portrait shape", type: "select", options: ["organic", "rounded", "square"] },
      { key: "heroLayout", label: "Hero layout", type: "select", options: ["two-column", "centered"] },
      { key: "preset", label: "Preset", type: "select", options: ["Minimal", "Futuristic", "Cinematic 3D"] },
    ],
  },
};
