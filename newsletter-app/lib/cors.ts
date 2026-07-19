import { config } from "@/lib/config";

export function corsHeaders(origin: string | null) {
  const allowed = new Set([config.siteUrl, "http://localhost:3000", "http://127.0.0.1:3000"]);
  return {
    "Access-Control-Allow-Origin": origin && allowed.has(origin) ? origin : config.siteUrl,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}
