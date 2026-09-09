import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/public/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        let slugs: string[] = [];
        try {
          const supabase = createClient(
            process.env["SUPABASE_URL"]!,
            process.env["SUPABASE_PUBLISHABLE_KEY"]!,
            { auth: { persistSession: false } },
          );
          const { data } = await supabase.from("projects").select("slug");
          slugs = (data ?? []).map((r) => r.slug as string);
        } catch {
          slugs = [];
        }
        const urls = ["", ...slugs.map((s) => `/projects/${s}`)]
          .map((p) => `<url><loc>${origin}${p || "/"}</loc></url>`)
          .join("");
        return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
          headers: { "content-type": "application/xml" },
        });
      },
    },
  },
});
