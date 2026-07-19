import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("admin login maps the configured username to the private admin email", () => {
  const route = read("app/api/auth/login/route.ts");
  assert.match(route, /username !== config\.adminUsername/);
  assert.match(route, /const email = config\.adminEmail/);
  assert.doesNotMatch(route, /form\.get\("email"\)/);
});

test("the login screen requests a username", () => {
  const page = read("app/admin/login/page.tsx");
  assert.match(page, /name="username"/);
  assert.doesNotMatch(page, /name="email"/);
});
