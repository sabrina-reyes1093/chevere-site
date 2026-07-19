import Link from "next/link";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return <>
    <header className="admin-header">
      <Link href="/admin" className="wordmark">Chévere</Link>
      <div><span>The Edit, Delivered</span><form action="/api/auth/logout" method="post"><button className="text-button">Sign out</button></form></div>
    </header>
    <main className="admin-main">{children}</main>
  </>;
}
