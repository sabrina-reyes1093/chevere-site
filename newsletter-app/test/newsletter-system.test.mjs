import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  chicagoLocalToIso,
  isFridaySendWindow,
  nextFridayAtChicagoTime,
  nextSundayAtChicagoTime,
  parseSendTime,
} from "../lib/schedule.ts";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(projectRoot, file), "utf8");

test("Friday scheduling follows America/Chicago across daylight-saving changes", () => {
  assert.equal(nextFridayAtChicagoTime(new Date("2026-01-01T12:00:00Z"), "08:30").toISOString(), "2026-01-02T14:30:00.000Z");
  assert.equal(nextFridayAtChicagoTime(new Date("2026-07-01T12:00:00Z"), "08:30").toISOString(), "2026-07-03T13:30:00.000Z");
  assert.equal(isFridaySendWindow(new Date("2026-07-03T13:30:00Z"), "08:30"), true);
  assert.equal(isFridaySendWindow(new Date("2026-07-03T13:29:00Z"), "08:30"), false);
  assert.deepEqual(parseSendTime("15:45"), { hour: 15, minute: 45 });
  assert.throws(() => parseSendTime("25:00"));
});

test("homepage roundup scheduling resolves Sunday at 8 AM in America/Chicago", () => {
  assert.equal(nextSundayAtChicagoTime(new Date("2026-01-01T12:00:00Z")).toISOString(), "2026-01-04T14:00:00.000Z");
  assert.equal(nextSundayAtChicagoTime(new Date("2026-07-01T12:00:00Z")).toISOString(), "2026-07-05T13:00:00.000Z");
  assert.equal(chicagoLocalToIso("2026-01-04T08:00"), "2026-01-04T14:00:00.000Z");
  assert.equal(chicagoLocalToIso("2026-07-05T08:00"), "2026-07-05T13:00:00.000Z");
});

test("live delivery remains disabled by default and requires approval", () => {
  assert.match(read(".env.example"), /NEWSLETTER_CRON_ENABLED=false/);
  assert.match(read("app/api/cron/newsletter/route.ts"), /NEWSLETTER_CRON_ENABLED|cronEnabled/);
  assert.match(read("supabase/migrations/001_newsletter.sql"), /approved_at is not null/);
  assert.match(read("components/issue-editor.tsx"), /I reviewed this specific issue and approve it for delivery/);
});

test("emails include mobile styles, unsubscribe, and business footer", () => {
  const template = read("lib/email-template.ts");
  assert.match(template, /@media\(max-width:600px\)/);
  assert.match(template, /Unsubscribe/);
  assert.match(template, /<strong>Chévere<\/strong>/);
  assert.match(template, /config\.businessAddress/);
});

test("provider events are signature-verified and deduplicated", () => {
  const webhook = read("app/api/webhooks/resend/route.ts");
  const migration = read("supabase/migrations/003_delivery_tracking.sql");
  assert.match(webhook, /webhooks\.verify/);
  assert.match(webhook, /svix-id/);
  assert.match(webhook, /23505/);
  assert.match(migration, /webhook_id text primary key/);
});

test("test sends are restricted to the administrator's own email", () => {
  const route = read("app/api/admin/issues/[id]/test/route.ts");
  const env = read(".env.example");
  assert.match(route, /to: config\.adminEmail/);
  assert.doesNotMatch(route, /config\.testEmail/);
  assert.doesNotMatch(env, /NEWSLETTER_TEST_EMAIL/);
});
