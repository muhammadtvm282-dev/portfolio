import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { SiteData } from "./cms-types";

function publicClient() {
  return createClient(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export const getSiteData = createServerFn({ method: "GET" }).handler(async (): Promise<SiteData> => {
  const supabase = publicClient();
  const [content, projects, skills, building] = await Promise.all([
    supabase.from("site_content").select("key,data"),
    supabase.from("projects").select("*").order("sort_order", { ascending: true }),
    supabase.from("skills").select("*").order("sort_order", { ascending: true }),
    supabase.from("building_items").select("*").order("sort_order", { ascending: true }),
  ]);

  const map: Record<string, unknown> = {};
  for (const row of content.data ?? []) map[row.key as string] = row.data;

  return {
    ...(map as Omit<SiteData, "projects" | "skills" | "building">),
    projects: (projects.data ?? []) as SiteData["projects"],
    skills: (skills.data ?? []) as SiteData["skills"],
    building: (building.data ?? []) as SiteData["building"],
  } as SiteData;
});

export const getProjectBySlug = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => ({ slug: String(data.slug).slice(0, 200) }))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    return { project: (project ?? null) as SiteData["projects"][number] | null };
  });
