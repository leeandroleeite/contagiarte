import type { Metadata } from "next";
import { Seccao } from "@/components/Seccao";
import { VerNaParede } from "@/components/VerNaParede";
import { listarMolduras, listarObras, obterDefinicoes } from "@/lib/dados";
import { t, texto, type Idioma } from "@/lib/i18n";
import { comMarca, metadados } from "@/lib/metadados";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Idioma }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return metadados({
    idioma: lang,
    path: "/ver-na-parede",
    titulo: comMarca(t("parede.titulo", lang)),
    descricao: t("parede.intro", lang),
  });
}

export default async function PaginaVerNaParede({
  params,
  searchParams,
}: {
  params: Promise<{ lang: Idioma }>;
  searchParams: Promise<{ obra?: string }>;
}) {
  const { lang: idioma } = await params;
  const { obra: obraInicial } = await searchParams;

  const [obras, molduras, def] = await Promise.all([
    // Só obras fotografadas: pôr um rectângulo vazio na parede de
    // alguém não ajuda a decidir nada.
    listarObras({ soDisponiveis: true, comFotografia: true }),
    listarMolduras(),
    obterDefinicoes(),
  ]);

  return (
    <Seccao className="pt-[160px]" semFio>
      <span className="etiqueta">{t("parede.etiqueta", idioma)}</span>
      <h1 className="titulo d-1 mt-4">{t("parede.titulo", idioma)}</h1>
      <p className="mt-6 mb-14 max-w-[54ch] text-[18px] leading-[1.6] text-[rgba(242,237,228,0.8)]">
        {t("parede.intro", idioma)}
      </p>

      {obras.length === 0 ? (
        <p className="text-[16px] text-claro-55">
          {t("msg.sem_resultados", idioma)}
        </p>
      ) : (
        <VerNaParede
          idioma={idioma}
          whatsapp={def.whatsapp}
          obraInicial={obraInicial}
          obras={obras.map((o) => {
            // A forma da obra sai das medidas da ficha quando existem.
            // Quando não existem, sai dos pixéis da fotografia, que é
            // uma fotografia da peça e por isso tem a forma dela.
            //
            // O quadrado por omissão que aqui estava antes não era
            // neutro: fazia a Censored Hero, que é um retrato 0,64:1,
            // aparecer quadrada, e essa medida errada seguia dentro da
            // mensagem de WhatsApp para a galeria.
            const porMedidas = Boolean(o.larguraCm && o.alturaCm);
            const foto = o.fotografia;
            const porFoto = Boolean(foto?.largura && foto?.altura);
            return {
              slug: o.slug,
              titulo: texto(o.titulo, idioma) || t("obra.sem_titulo", idioma),
              autor: o.artista?.nome ?? "",
              chave: foto?.chave ?? null,
              larguraCm: o.larguraCm,
              alturaCm: o.alturaCm,
              proporcao: porMedidas
                ? o.alturaCm! / o.larguraCm!
                : porFoto
                  ? foto!.altura! / foto!.largura!
                  : 1,
              origemProporcao: (porMedidas ? "medidas" : "fotografia") as
                | "medidas"
                | "fotografia",
            };
          })}
          molduras={molduras.map((m) => ({
            slug: m.slug,
            nome: texto(m.nome, idioma),
            cor: m.cor,
            espessuraMm: m.espessuraMm,
          }))}
        />
      )}
    </Seccao>
  );
}
