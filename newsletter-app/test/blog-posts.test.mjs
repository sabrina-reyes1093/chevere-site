import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { CATEGORY_GROUPS, slugify, displayDate, categoryLabel, categorySection, normalizeCategory, normalizePostCategory, validateForPublish } from "../lib/post-schema.ts";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(projectRoot, file), "utf8");

test("slugs and dates match the conventions already used on the site", () => {
  assert.equal(slugify("My Current Obsessions"), "my-current-obsessions");
  assert.equal(slugify("The Chévere Guide to Chicago Patio Season"), "the-chevere-guide-to-chicago-patio-season");
  assert.equal(slugify("  Trailing & Symbols!  "), "trailing-symbols");
  assert.equal(displayDate("2026-07-18"), "Jul 18, 2026");
  assert.equal(displayDate("2026-01-02"), "Jan 2, 2026");
  assert.equal(categoryLabel("film-tv"), "Film & TV");
  assert.equal(categoryLabel("tv-film"), "Film & TV");
  assert.equal(categorySection("reading-lists"), "guides");
  assert.equal(categorySection("introduction"), "");
  assert.equal(normalizeCategory("food-drink"), "food");
  assert.equal(normalizeCategory("wellness"), "life-wellness");
  assert.equal(normalizePostCategory("food-drink", "best-chicago-patios-2026"), "restaurant-roundups");
  assert.equal(normalizePostCategory("pop-culture", "about-chevere"), "introduction");
  assert.equal(normalizePostCategory("pop-culture", "maybe-women-should-be-more-difficult"), "life-wellness");
  assert.equal(normalizePostCategory("everyday-favorites", "my-current-obsessions"), "pop-culture");
  assert.deepEqual(CATEGORY_GROUPS.map((group) => group.label), ["Culture", "Style", "Life", "Guides"]);
  const activeCategories = CATEGORY_GROUPS.flatMap((group) => group.categories.map((category) => category.slug));
  assert.equal(activeCategories.includes("everyday-favorites"), false);
  assert.equal(activeCategories.includes("hosting"), false);
  assert.equal(activeCategories.includes("evergreen-guides"), false);
});

test("a post cannot be published until it would render correctly", () => {
  const complete = {
    slug: "a-post", title: "A Post", category: "culture", dek: "A description.",
    body: "Some words.", cover_image_url: "https://example.com/c.png", hero_image_url: "",
    signoff: "", published_on: "2026-07-19",
  };
  assert.equal(validateForPublish(complete), null);
  assert.match(validateForPublish({ ...complete, cover_image_url: "" }), /cover image/i);
  assert.match(validateForPublish({ ...complete, dek: "" }), /description/i);
  assert.match(validateForPublish({ ...complete, body: "" }), /body/i);
  assert.match(validateForPublish({ ...complete, title: "" }), /title/i);
});

test("generated pages carry the same shell as the hand-written posts", () => {
  const template = read("lib/post-template.ts");
  assert.match(template, /\.\.\/styles\.css\?v=/);
  assert.match(template, /\.\.\/site\.js\?v=/);
  assert.match(template, /class="site-header"/);
  assert.match(template, /class="site-nav"/);
  assert.match(template, />CULTURE</);
  assert.match(template, />STYLE</);
  assert.match(template, />LIFE</);
  assert.match(template, />GUIDES</);
  assert.match(template, /JOIN THE LIST/);
  assert.match(template, /mobile-menu-toggle/);
  assert.match(template, /class="page-main"/);
  assert.match(template, /class="post-body"/);
  assert.match(template, /Back to Blog/);
});

test("authored markdown is escaped before any formatting is applied", () => {
  const template = read("lib/post-template.ts");
  // escape() must run first inside inline(), so raw HTML in a post cannot inject markup.
  assert.match(template, /return escape\(value\)/);
});

test("publishing edits blog.html in place rather than reserialising it", () => {
  const publish = read("lib/publish-post.ts");
  assert.match(publish, /post-grid/);
  assert.match(publish, /post-card/);
  assert.match(publish, /data-featured/);
  assert.doesNotMatch(publish, /cheerio|\$\.html\(\)/);
  assert.match(publish, /unpublishPost/);
});

test("every blog admin route requires the administrator", () => {
  for (const route of [
    "app/api/admin/posts/route.ts",
    "app/api/admin/posts/[id]/route.ts",
    "app/api/admin/posts/[id]/publish/route.ts",
    "app/api/admin/posts/preview/route.ts",
  ]) {
    assert.match(read(route), /requireAdminApi/, `${route} is unguarded`);
    assert.match(read(route), /Unauthorized/, `${route} does not reject`);
  }
});

test("the portal links the blog editor alongside the newsletter", () => {
  assert.match(read("components/admin-shell.tsx"), /\/admin\/posts/);
  assert.match(read("components/post-editor.tsx"), /ImageField/);
});

test("publishing commits to GitHub when the host cannot write files", () => {
  const route = read("app/api/admin/posts/[id]/publish/route.ts");
  assert.match(route, /githubConfigured/);
  assert.match(route, /publishPostToGitHub/);
  assert.match(route, /unpublishPostFromGitHub/);
  // The filesystem path must remain for running locally.
  assert.match(route, /publishPost\(/);
});

test("a read-only filesystem explains itself instead of leaking EROFS", () => {
  const route = read("app/api/admin/posts/[id]/publish/route.ts");
  assert.match(route, /EROFS\|read-only file system/);
  assert.match(route, /GITHUB_TOKEN and GITHUB_REPO/);
});

test("both files land in a single commit so the blog never links to a missing page", () => {
  const github = read("lib/publish-github.ts");
  // One tree, one commit, one ref update - not two content-API writes.
  assert.match(github, /git\/trees/);
  assert.match(github, /git\/commits/);
  assert.match(github, /git\/refs\/heads/);
  assert.match(github, /base_tree/);
  assert.match(github, /parents: \[headSha\]/);
  assert.match(github, /posts\/\$\{post\.slug\}\.html/);
  assert.match(github, /"blog\.html"/);
});

test("GitHub credentials are optional and never assumed present", () => {
  const configSource = read("lib/config.ts");
  // required() would throw at import time on a local setup with no token.
  assert.match(configSource, /githubToken\(\) \{ return process\.env\.GITHUB_TOKEN \|\| ""/);
  assert.match(configSource, /githubConfigured/);
  assert.match(read(".env.example"), /GITHUB_TOKEN=/);
});
