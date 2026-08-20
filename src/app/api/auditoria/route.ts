import { NextResponse } from "next/server";

/**
 * Arnês de auditoria responsiva, só para desenvolvimento.
 *
 * Carrega as páginas do site em iframes de larguras fixas e expõe
 * `window.auditar()`, que devolve, por página e por largura, tudo o que
 * transborda a horizontal e todos os textos ou alvos de toque pequenos
 * demais. Serve para ver o site em vinte combinações sem redimensionar
 * a janela vinte vezes.
 *
 * Não existe em produção.
 */
export async function GET(pedido: Request) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Indisponível.", { status: 404 });
  }

  const url = new URL(pedido.url);
  const larguras = (url.searchParams.get("w") ?? "320,390,768,1024,1440")
    .split(",")
    .map((n) => Number(n.trim()))
    .filter((n) => n > 0);
  const paginas = (url.searchParams.get("p") ?? "/")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  const html = `<!doctype html>
<html lang="pt">
<head>
<meta charset="utf-8">
<title>Auditoria responsiva</title>
<style>
  body { margin:0; background:#222; font-family:system-ui,sans-serif; }
  .fila { display:flex; gap:8px; padding:8px; align-items:flex-start; }
  figure { margin:0; background:#111; }
  figcaption { color:#eee; font-size:11px; padding:4px 6px; font-family:monospace; }
  iframe { border:0; display:block; background:#000; }
</style>
</head>
<body>
${paginas
  .map(
    (p) => `<div class="fila">${larguras
      .map(
        (w) =>
          `<figure><figcaption>${w}px ${p}</figcaption><iframe data-p="${p}" data-w="${w}" src="${p}" width="${w}" height="900" loading="eager"></iframe></figure>`,
      )
      .join("")}</div>`,
  )
  .join("\n")}

<script>
window.auditar = function () {
  const relatorio = [];

  document.querySelectorAll('iframe').forEach((f) => {
    const doc = f.contentDocument;
    const win = f.contentWindow;
    if (!doc || !win) {
      relatorio.push({ p: f.dataset.p, w: Number(f.dataset.w), erro: 'sem acesso' });
      return;
    }

    const largura = win.innerWidth;
    const transbordos = [];
    const textoPequeno = [];
    const alvosPequenos = [];

    doc.querySelectorAll('body *').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;

      // O que sai pela direita ou pela esquerda do ecrã. A faixa em
      // movimento e o link de salto são propositados.
      const propositado =
        el.closest('[role="presentation"]') ||
        el.classList.contains('link-saltar') ||
        el.hasAttribute('data-cursor') ||
        el.closest('.faixa-h') ||
        el.closest('.percurso-palco');
      if (!propositado && (r.right > largura + 1 || r.left < -1)) {
        transbordos.push({
          tag: el.tagName,
          cls: String(el.className || '').slice(0, 70),
          left: Math.round(r.left),
          right: Math.round(r.right),
        });
      }

      // Texto abaixo de 12px é difícil de ler num telemóvel.
      const est = win.getComputedStyle(el);
      const tamanho = parseFloat(est.fontSize);
      const temTexto = [...el.childNodes].some(
        (n) => n.nodeType === 3 && n.nodeValue.trim(),
      );
      if (temTexto && tamanho && tamanho < 12) {
        textoPequeno.push({
          tag: el.tagName,
          px: tamanho,
          txt: el.textContent.trim().slice(0, 30),
        });
      }

      // Alvos de toque abaixo de 44px de altura.
      if (
        largura < 900 &&
        (el.tagName === 'BUTTON' ||
          (el.tagName === 'A' && el.getAttribute('href')) ||
          el.tagName === 'INPUT' ||
          el.tagName === 'SELECT') &&
        est.display !== 'none' &&
        r.height > 0 &&
        r.height < 44
      ) {
        alvosPequenos.push({
          tag: el.tagName,
          h: Math.round(r.height),
          txt: el.textContent.trim().slice(0, 30),
        });
      }
    });

    relatorio.push({
      p: f.dataset.p,
      w: largura,
      scrollW: doc.documentElement.scrollWidth,
      transbordos: transbordos.slice(0, 6),
      nTransbordos: transbordos.length,
      textoPequeno: textoPequeno.slice(0, 4),
      nTextoPequeno: textoPequeno.length,
      alvosPequenos: alvosPequenos.slice(0, 4),
      nAlvosPequenos: alvosPequenos.length,
    });
  });

  return relatorio;
};
</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
