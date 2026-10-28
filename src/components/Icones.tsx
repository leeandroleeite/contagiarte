import { cx } from "@/lib/utils";

/**
 * Ícones dos contactos: WhatsApp, email, telefone, Instagram e morada.
 *
 * Pedido da galeria, a pensar em quem lê melhor um símbolo conhecido do
 * que uma palavra: o logótipo do WhatsApp ao lado do WhatsApp, o do
 * Instagram ao lado do Instagram. Pequenos e de traço, na cor do link
 * (`currentColor`), sem as cores das marcas: ao lado do texto, e não
 * em vez dele, para não fazer barulho.
 *
 * São decorativos. O texto do link já diz tudo, por isso ficam fora da
 * árvore de acessibilidade, e um leitor de ecrã não lê "imagem" antes
 * de cada contacto.
 *
 * Os desenhos seguem os glifos oficiais, redesenhados a traço numa
 * grelha de 24: o balão com o auscultador do WhatsApp e a câmara do
 * Instagram são os das marcas, só sem cor.
 */
const DESENHOS = {
  whatsapp: (
    <>
      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
      <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
    </>
  ),
  email: (
    <>
      <rect x="3" y="5" width="18" height="14" />
      <path d="M3 6l9 7 9-7" />
    </>
  ),
  telefone: (
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  ),
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5h.01" />
    </>
  ),
  morada: (
    <>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
} as const;

export type NomeIcone = keyof typeof DESENHOS;

/**
 * Um ícone do tamanho da letra à volta (1em), que nunca encolhe: numa
 * coluna estreita, quem muda de linha é a morada, e o pino fica inteiro.
 */
export function Icone({
  nome,
  className,
}: {
  nome: NomeIcone;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cx("inline-block shrink-0", className)}
    >
      {DESENHOS[nome]}
    </svg>
  );
}
