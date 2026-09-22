"use client";

/**
 * O último recurso: um erro no próprio layout de raiz.
 *
 * Aqui não há layout por cima, nem fontes, nem estilos do site: o Next
 * substitui o documento inteiro. Por isso este ficheiro traz o seu
 * próprio `html` e `body` e não depende de nada, nem de CSS, nem da
 * base de dados. Se dependesse, falhava também.
 */
export default function ErroGlobal({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "24px",
          padding: "40px 28px",
          background: "#0E0C0B",
          color: "#F2EDE4",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <span
          style={{
            fontSize: 11,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(242,237,228,0.55)",
          }}
        >
          Galeria Contagiarte
        </span>

        <h1 style={{ margin: 0, fontSize: "clamp(32px,7vw,72px)", lineHeight: 0.95 }}>
          O site não conseguiu abrir
        </h1>

        <p style={{ margin: 0, maxWidth: "46ch", fontSize: 17, lineHeight: 1.6, color: "rgba(242,237,228,0.75)" }}>
          Tente outra vez daqui a pouco. Se precisar de falar connosco,
          galeria@contagiarte.pt ou +351 914 152 451.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={reset}
            style={{
              minHeight: 48,
              padding: "0 22px",
              border: "1px solid #B4884A",
              background: "#B4884A",
              color: "#0E0C0B",
              fontSize: 12,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Tentar outra vez
          </button>
          {/* Um `<a>` e não um `<Link>`: se o erro é no layout de raiz,
              o router do Next pode estar partido, e só um carregamento
              inteiro da página tira o visitante daqui. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            style={{
              minHeight: 48,
              display: "inline-flex",
              alignItems: "center",
              padding: "0 22px",
              border: "1px solid rgba(242,237,228,0.35)",
              color: "#F2EDE4",
              fontSize: 12,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              textDecoration: "none",
            }}
          >
            Voltar ao início
          </a>
        </div>

        {error.digest && (
          <p style={{ margin: 0, fontSize: 12, color: "rgba(242,237,228,0.4)" }}>
            Referência {error.digest}
          </p>
        )}
      </body>
    </html>
  );
}
