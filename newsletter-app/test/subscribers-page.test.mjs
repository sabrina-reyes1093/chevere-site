import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("subscriber list is protected and includes email and status", () => {
  const page = read("app/admin/subscribers/page.tsx");
  assert.match(page, /await requireAdminPage\(\)/);
  assert.match(page, /select\("id,email,status,created_at,updated_at,unsubscribed_at"\)/);
  assert.match(page, /subscriber\.email/);
  assert.match(page, /subscriber\.status/);
});

test("admin navigation links to subscribers", () => {
  assert.match(read("components/admin-shell.tsx"), /href="\/admin\/subscribers"/);
});
