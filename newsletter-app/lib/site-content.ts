import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

import { config } from "./config";
import { commitFiles, readFileFromRepo } from "./publish-github";
import { siteRoot } from "./publish-post";

export const siteContentSchema = z.object({
  seasonal_banner: z.object({
    enabled: z.boolean(),
    label: z.string().max(80),
    headline: z.string().max(160),
    description: z.string().max(320),
    href: z.string().max(500),
    cta_label: z.string().max(80).default("EXPLORE THE GUIDE"),
    publish_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")).default(""),
    expiration_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")).default(""),
  }),
});

export type SiteContent = z.infer<typeof siteContentSchema>;

const localPath = path.join(siteRoot(), "site-content.json");

export async function loadSiteContent(): Promise<SiteContent> {
  let source: string;
  if (config.githubToken && config.githubRepo) {
    const remote = await readFileFromRepo("site-content.json");
    if (remote === null) throw new Error("site-content.json was not found in the repository.");
    source = remote;
  } else {
    source = await fs.readFile(localPath, "utf8");
  }
  return siteContentSchema.parse(JSON.parse(source));
}

export async function saveSiteContent(content: SiteContent) {
  const parsed = siteContentSchema.parse(content);
  const source = `${JSON.stringify(parsed, null, 2)}\n`;
  if (config.githubToken && config.githubRepo) {
    await commitFiles(
      [{ path: "site-content.json", content: source }],
      "content: update homepage editorial modules",
    );
  } else {
    await fs.writeFile(localPath, source, "utf8");
  }
}
