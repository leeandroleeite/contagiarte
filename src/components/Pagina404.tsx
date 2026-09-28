import { Botao } from "@/components/Botao";
import { Prego, type ObraPrego } from "@/components/Prego";
import {
  listarObras,
  obterDefinicoes,
  obterTextos,
  type MapaTextos,
} from "@/lib/dados";
import { DEFINICOES_OMISSAO } from "@/lib/db/omissoes";
import { t, texto } from "@/lib/i18n";
import { caminho, IDIOMA_BASE, type Idioma } from "@/lib/i18n/config";
import { linkWhatsApp } from "@/lib/utils";

/**
 * A página de erro 404, partilhada pelos dois sítios onde o Next a
 * pode pedir: o `not-found` da raiz (endereços que não correspondem a
 * rota nenhuma) e o do segmento de idioma (quando uma página chama
 * `notFound()` por não encontrar o registo).
 *
 * Com `semBase`, não lê a base de dados e usa os contactos de origem.
 * É o que o 404 da raiz precisa: o Next gera-o na compilação, onde não
 * há base nenhuma para ler.
 */
export async function Pagina404({
  idioma = IDIOMA_BASE,
  semBase = false,
}: {
  idioma?: Idioma;
  semBase?: boolean;
}) {
  const [txt, def, disponiveis]: [
    MapaTextos,
    typeof DEFINICOES_OMISSAO,
    Awaited<ReturnType<typeof listarObras>>,
  ] = semBase
    ? [{}, DEFINICOES_OMISSAO, []]
    : await Promise.all([
        obterTextos(),
        obterDefinicoes(),
        listarObras({ soDisponiveis: true, comFotografia: true }),
      ]);
  const paraOPrego: ObraPrego[] = disponiveis.map((o) => ({
    slug: o.slug,
    titulo: texto(o.titulo, idioma) || t("obra.sem_titulo", idioma),
    fotografia: o.fotografia,
  }));

  const titulo = texto(txt["404.titulo"], idioma) || t("404.titulo", idioma);
  const corpo = texto(txt["404.texto"], idioma) || t("404.texto", idioma);
  const mensagem =
    texto(txt["404.whatsapp"], idioma) || t("404.whatsapp", idioma);

  const rotulos = [
    t("404.inicio", idioma),
    t("404.exposicao", idioma),
    t("acao.perguntar_whatsapp", idioma),
  ];

  return (
    <div className="grid min-h-[80dvh] items-center gap-12 px-margem pt-[140px] pb-16 md:grid-cols-[1fr_auto]">
      <div className="flex flex-col gap-8">
        <span className="etiqueta text-claro-55">
          {t("404.etiqueta", idioma)}
        </span>

        <h1 className="titulo max-w-[16ch] d-heroi">{titulo}</h1>

        <p className="lead max-w-[46ch] text-claro-80">{corpo}</p>

        <div className="flex flex-wrap gap-3.5">
          <Botao href={caminho(idioma, "/")}>{rotulos[0]}</Botao>
          <Botao variante="linha" href={caminho(idioma, "/exposicoes")}>
            {rotulos[1]}
          </Botao>
          <Botao
            variante="linha"
            externo
            href={linkWhatsApp(def.whatsapp, mensagem)}
          >
            {rotulos[2]}
          </Botao>
        </div>
      </div>

      <Prego obras={paraOPrego} idioma={idioma} />
    </div>
  );
}
