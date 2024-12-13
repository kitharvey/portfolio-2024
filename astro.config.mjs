import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

import tailwind from "@astrojs/tailwind";

export default defineConfig({
  adapter: cloudflare(),
  output: "server",
  integrations: [tailwind()],
});
