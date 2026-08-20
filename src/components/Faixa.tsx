/**
 * Faixa de texto em movimento contínuo. Duas cópias do conteúdo lado a
 * lado e um translateX de 0 a -50% dão o efeito de loop sem costura.
 */
export function Faixa({ palavras }: { palavras: string[] }) {
  const conteudo = (
    <span
      aria-hidden="true"
      className="titulo flex text-[clamp(22px,3vw,44px)] whitespace-nowrap text-[rgba(242,237,228,0.9)]"
      style={{ letterSpacing: "-0.01em" }}
    >
      {palavras.map((p, i) => (
        <span key={i}>
          {p.toUpperCase()}
          <span className="px-2 text-[rgba(242,237,228,0.55)]">·</span>
        </span>
      ))}
    </span>
  );

  return (
    <div
      className="flex overflow-hidden border-t border-b border-[rgba(242,237,228,0.14)] bg-tinta py-[22px]"
      role="presentation"
    >
      <div
        className="flex flex-none"
        style={{ animation: "desliza 38s linear infinite", willChange: "transform" }}
      >
        {conteudo}
        {conteudo}
      </div>
      <span className="so-leitor">{palavras.join(" · ")}</span>
    </div>
  );
}
