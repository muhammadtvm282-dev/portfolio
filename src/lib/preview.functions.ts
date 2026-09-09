import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 10000;

const PRIVATE_HOST =
  /^(localhost|127\.|0\.|10\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?|.*\.local|.*\.internal|metadata\.google\.internal)/i;

function assertSafeUrl(raw: string): URL {
  let url: URL;

  try {
    url = new URL(raw);
  } catch {
    throw new Error("Invalid URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs are allowed");
  }

  const host = url.hostname.toLowerCase();

  if (
    PRIVATE_HOST.test(host) ||
    host === "0.0.0.0" ||
    host === "::"
  ) {
    throw new Error("This address is not allowed");
  }

  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    const parts = host.split(".").map(Number);

    const a = parts[0] ?? 0;
    const b = parts[1] ?? 0;

    if (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254)
    ) {
      throw new Error("This address is not allowed");
    }
  }

  return url;
}

function pick(html: string, patterns: RegExp[]): string | null {
  for (const re of patterns) {
    const match = html.match(re);

    if (match?.[1]) {
      return match[1].trim().slice(0, 1000);
    }
  }

  return null;
}

function metaTag(prop: string) {
  return [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`,
      "i"
    ),
  ];
}

function absolute(base: URL, value: string | null) {
  if (!value) return null;

  try {
    return new URL(value, base).toString();
  } catch {
    return null;
  }
}

async function isUsableImage(url: string | null): Promise<boolean> {
  if (!url) return false;

  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, 6000);

  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; PortfolioPreviewBot/1.0)",
    },
  });

    if (!response.ok) return false;

    const contentType = response.headers.get("content-type") ?? "";

    return contentType.startsWith("image/");
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function createMshotsUrl(url: URL) {
  return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(
    url.toString()
  )}?w=1280&h=800`;
}

export const generateProjectPreview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { url: string }) => ({
    url: String(data.url ?? "")
      .trim()
      .slice(0, 2048),
  }))
  .handler(async ({ data, context }) => {
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roles) {
      throw new Error("Not authorized");
    }

    let url: URL;

    try {
      url = assertSafeUrl(data.url);
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : "Invalid URL",
      };
    }

    const controller = new AbortController();

    const timer = setTimeout(() => {
      controller.abort();
    }, TIMEOUT_MS);

    try {
      const response = await fetch(url.toString(), {
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; PortfolioPreviewBot/1.0)",
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      if (!response.ok) {
        return {
          ok: true as const,
          partial: true,
          screenshot: createMshotsUrl(url),
          url: url.toString(),
          title: null,
          description: null,
          siteName: null,
          favicon: `${url.origin}/favicon.ico`,
          image: null,
          canonical: null,
        };
      }

      const finalUrl = new URL(response.url || url.toString());

      assertSafeUrl(finalUrl.toString());

      const reader = response.body?.getReader();

      let html = "";

      if (reader) {
        const decoder = new TextDecoder();
        let received = 0;

        for (;;) {
          const { done, value } = await reader.read();

          if (done) break;

          received += value.byteLength;

          html += decoder.decode(value, {
            stream: true,
          });

          if (received > MAX_BYTES) {
            await reader.cancel();
            break;
          }
        }
      }

      const title = pick(html, [
        ...metaTag("og:title"),
        /<title[^>]*>([^<]+)<\/title>/i,
      ]);

      const description = pick(html, [
        ...metaTag("og:description"),
        ...metaTag("description"),
      ]);

      const siteName = pick(html, metaTag("og:site_name"));

      const image = absolute(
        finalUrl,
        pick(html, [
          ...metaTag("og:image"),
          ...metaTag("twitter:image"),
          ...metaTag("twitter:image:src"),
        ])
      );

      const canonical = absolute(
        finalUrl,
        pick(html, [
          /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
          /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i,
        ])
      );

      const favicon =
        absolute(
          finalUrl,
          pick(html, [
            /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i,
            /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*icon[^"']*["']/i,
          ])
        ) ?? `${finalUrl.origin}/favicon.ico`;

      const screenshot = createMshotsUrl(finalUrl);

      const imageIsUsable = await isUsableImage(image);

      return {
        ok: true as const,

        // Metadata was successfully extracted.
        partial: false,

        // Screenshot fallback.
        screenshot,

        // Final URL after redirects.
        url: finalUrl.toString(),

        title,
        description,
        siteName,
        favicon,
        canonical,

        // Only return an OG image if it is actually usable.
        image: imageIsUsable ? image : null,
      };
    } catch (error) {
      console.error("Project preview error:", error);

      return {
        ok: true as const,
        partial: true,
        screenshot: createMshotsUrl(url),
        url: url.toString(),
        title: null,
        description: null,
        siteName: null,
        favicon: `${url.origin}/favicon.ico`,
        image: null,
        canonical: null,
      };
    } finally {
      clearTimeout(timer);
    }
  });