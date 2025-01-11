import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url }) => {
  const siteUrl = url.origin; // Dynamically get the site URL from the request

  const robotsTxt = `# ${siteUrl}
User-agent: *
Allow: /

# Sitemaps
Sitemap: ${siteUrl}/sitemap.xml`;

  return new Response(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
};
