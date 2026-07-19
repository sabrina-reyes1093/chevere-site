import Link from "next/link";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return <>
    <header className="admin-header">
      <Link href="/admin" className="wordmark">Chévere</Link>
      <nav className="admin-nav" aria-label="Newsletter administration"><Link href="/admin">Issues</Link><Link href="/admin/subscribers">Subscribers</Link><form action="/api/auth/logout" method="post"><button className="text-button">Sign out</button></form></nav>
    </header>
    <main className="admin-main">{children}</main>
  </>;
}
