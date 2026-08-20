import { linkWhatsApp } from "@/lib/utils";

/** Botão flutuante permanente. É o canal preferido da galeria. */
export function BotaoWhatsApp({
  numero,
  rotulo,
  mensagem,
}: {
  numero: string;
  rotulo: string;
  mensagem: string;
}) {
  return (
    <a
      href={linkWhatsApp(numero, mensagem)}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-4 bottom-4 z-[110] inline-flex min-h-12 items-center bg-ouro px-[22px] py-4 text-[12px] tracking-[0.16em] text-tinta uppercase transition-colors hover:bg-papel"
      style={{ boxShadow: "0 14px 44px rgba(0,0,0,0.5)" }}
    >
      {rotulo}
    </a>
  );
}
