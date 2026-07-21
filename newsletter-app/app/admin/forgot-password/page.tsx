export default async function ForgotPassword({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const query = await searchParams;
  return <main className="login-page">
    <section className="login-card">
      <p className="eyebrow">Private editor</p>
      <h1>Reset your password</h1>
      <p>Enter the admin email and we&rsquo;ll send a reset link.</p>
      {query.sent === "ok" && <p className="message ok">Check your email for the reset link.</p>}
      {query.sent === "error" && <p className="message error">Something went wrong. Try again.</p>}
      <form action="/api/auth/forgot-password" method="post" className="stack">
        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
        <button className="primary">Send reset link</button>
      </form>
      <p style={{ marginTop: 16, fontSize: 14, textAlign: 'center' }}>
        <a href="/admin/login" style={{ color: 'var(--brown)', textDecoration: 'underline' }}>Back to sign in</a>
      </p>
    </section>
  </main>;
}