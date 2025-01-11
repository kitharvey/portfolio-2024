// src/pages/sitemap.xml.ts
import type { APIRoute } from "astro";

interface SitemapURL {
  loc: string;
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
}

// Example function to get URLs for the sitemap
function getSitemapUrls(): SitemapURL[] {
  return [
    {
      loc: "/",
      lastmod: new Date().toISOString(),
      changefreq: "daily",
      priority: 1.0,
    },
  ];
}

export const GET: APIRoute = async ({ url }) => {
  const siteUrl = url.origin; // Dynamically get the site URL from the request
  const urls = getSitemapUrls();

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `    <url>
        <loc>${siteUrl}${url.loc}</loc>
        ${url.lastmod ? `        <lastmod>${url.lastmod}</lastmod>\n` : ""}${url.changefreq ? `        <changefreq>${url.changefreq}</changefreq>\n` : ""}${url.priority ? `        <priority>${url.priority}</priority>\n` : ""}    </url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
};
