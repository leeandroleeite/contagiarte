import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Backoffice · Galeria Contagiarte",
  robots: { index: false, follow: false },
};

/** Casca clara do backoffice. A navegação vive no grupo (painel). */
export default function LayoutAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="admin">{children}</div>;
}
