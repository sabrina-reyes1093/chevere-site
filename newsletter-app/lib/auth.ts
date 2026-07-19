import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { config } from "@/lib/config";

export async function getAdminUser() {
  const store = await cookies();
  const supabase = createServerClient(config.supabaseUrl, config.supabaseAnonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (items) => {
        try { items.forEach(({ name, value, options }) => store.set(name, value, options)); }
        catch { /* Server components cannot always refresh cookies. */ }
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email?.toLowerCase() === config.adminEmail ? user : null;
}

export async function requireAdminPage() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}

export async function requireAdminApi() {
  return Boolean(await getAdminUser());
}
