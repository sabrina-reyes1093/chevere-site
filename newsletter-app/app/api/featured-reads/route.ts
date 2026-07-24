import { NextResponse } from "next/server";

import { loadFeaturedReads } from "@/lib/featured-reads";

export const dynamic = "force-dynamic";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

export async function GET() {
  try {
    const items = await loadFeaturedReads();
    const isComplete = items.length === 3
      && new Set(items.map((item) => item.slug)).size === 3
      && items.every((item, index) => item.display_order === index + 1);

    return NextResponse.json(
      { items: isComplete ? items : [] },
      { headers: { ...cors, "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
    );
  } catch (error) {
    console.error("Unable to load Featured Reads.", error);
    return NextResponse.json(
      { items: [] },
      { headers: { ...cors, "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
    );
  }
}
