import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST() {
  if (!await requireAdminApi()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data: issues, error } = await db.from("newsletter_issues").select("id,note_from_sabrina,obsessed_title");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!issues?.length) return NextResponse.json({ ok: true, migrated: 0 });

  let updated = 0;
  for (const issue of issues) {
    const hasOldSignoff = String(issue.note_from_sabrina || "").includes("Until next week");
    const obsessedEmpty = !issue.obsessed_title;

    if (hasOldSignoff && obsessedEmpty) {
      // Move old signoff from note_from_sabrina → obsessed_title, clear note_from_sabrina
      await db.from("newsletter_issues").update({
        obsessed_title: issue.note_from_sabrina,
        note_from_sabrina: "",
        updated_at: new Date().toISOString(),
      }).eq("id", issue.id);
      updated++;
    } else if (obsessedEmpty) {
      // No signoff stored yet, set default
      await db.from("newsletter_issues").update({
        obsessed_title: "Until next week,\nStay CHÉVERE",
        updated_at: new Date().toISOString(),
      }).eq("id", issue.id);
      updated++;
    }
  }

  return NextResponse.json({ ok: true, migrated: updated });
}