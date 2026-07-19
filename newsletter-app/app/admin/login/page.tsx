import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getAdminUser()) redirect("/admin");
  const query = await searchParams;
  return <main className="login-page">
    <section className="login-card">
      <p className="eyebrow">Private editor</p>
      <h1>The Edit, Delivered</h1>
      <p>Create, preview, approve, and schedule the Friday newsletter.</p>
      {query.error && <p className="message error">The username or password was not accepted.</p>}
      <form action="/api/auth/login" method="post" className="stack">
        <label>Username<input name="username" type="text" autoComplete="username" required /></label>
        <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
        <button className="primary">Sign in</button>
      </form>
    </section>
  </main>;
}
