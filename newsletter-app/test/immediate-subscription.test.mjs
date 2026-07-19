import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("the subscribe API activates an address without sending confirmation", () => {
  const route = fs.readFileSync(path.join(projectRoot, "app/api/subscribe/route.ts"), "utf8");

  assert.match(route, /status: "active"/);
  assert.match(route, /confirmed_at: now/);
  assert.doesNotMatch(route, /new Resend|randomToken|confirmation email|Check your inbox to confirm/);
});

test("the public form reports immediate subscription", () => {
  const site = fs.readFileSync(path.resolve(projectRoot, "../site.js"), "utf8");

  assert.match(site, /You&(?:rsquo|#39);re subscribed to The Edit, Delivered\./);
  assert.doesNotMatch(site, /Confirm your email to join/);
});

test("the migration activates existing pending subscribers", () => {
  const migration = fs.readFileSync(path.join(projectRoot, "supabase/migrations/002_immediate_subscription.sql"), "utf8");

  assert.match(migration, /where status = 'pending'/i);
  assert.match(migration, /set status = 'active'/i);
});
