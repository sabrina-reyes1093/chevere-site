import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chévere Weekly — Admin",
  description: "Create and schedule Chévere’s weekly newsletter.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
