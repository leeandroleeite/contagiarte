import type { Metadata } from "next";
import Link from "next/link";
import { Botao } from "@/components/Botao";
import { CartaoObra } from "@/components/CartaoObra";
import { Cortina } from "@/components/Cortina";
import { Faixa } from "@/components/Faixa";
import { FormularioNewsletter } from "@/components/FormularioNewsletter";
import { FormularioPedido } from "@/components/FormularioPedido";
import { Imagem } from "@/components/Imagem";
import { ListaArtistas } from "@/components/ListaArtistas";
import { Seccao, TituloSeccao } from "@/components/Seccao";
import { DadosEstruturados, galeria, sitio } from "@/lib/dados-estruturados";
import {
  exposicaoEmDestaque,
  listarArtistas,
  listarDescarregaveis,
  listarExposicoes,
  listarLugares,
  listarObras,
  obterDefinicoes,
  obterTextos,
  situacao,
} from "@/lib/dados";
import { anos, periodo, t, texto, type Idioma } from "@/lib/i18n";
import { caminho } from "@/lib/i18n/config";
import { metadados } from "@/lib/metadados";
import { camadaInvertida, VEU_HEROI } from "@/lib/veu";
import { colunas, linkWhatsApp } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Idioma }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const def = await obterDefinicoes();
  return metadados({
    idioma: lang,
    path: "/",
    titulo: texto(def.ogTitulo, lang),
    descricao: texto(def.ogDescricao, lang),
  });
}

export default async function Homepage({
  params,
}: {
  params: Promise<{ lang: Idioma }>;
}) {
  const { lang: idioma } = await params;

  const [def, txt, expo, obras, artistas, lugares, exposicoes, ficheiros] =
    await Promise.all([
      obterDefinicoes(),
      obterTextos(),
      exposicaoEmDestaque(),
      listarObras({ destaque: true, limite: 8 }),
      listarArtistas(),
      listarLugares(),
      listarExposicoes(),
      listarDescarregaveis(),
    ]);

  const T = (chave: string, omissao = "") =>
    texto(txt[chave], idioma) || omissao;

  const arquivo = exposicoes.filter((e) => !e.destaque).slice(0, 5);

  // Quanto destacar o título da fotografia. Regula-se em Definições.
  const inversao = camadaInvertida(def.inversaoHeroi);

  return (
    <>
      <DadosEstruturados dados={galeria(def, idioma)} />
      <DadosEstruturados dados={sitio(idioma)} />

      <Cortina />

      {/* 1. Herói ------------------------------------------------------ */}
      <section
        id="topo"
        className="relative min-h-[600px] overflow-hidden"
        style={{ height: "100dvh" }}
      >
        <div
          data-paralaxe="scroll"
          data-factor="0.22"
          className="absolute inset-x-0 -inset-y-[8%]"
        >
          <Imagem
            media={expo?.imagem ?? null}
            alt={
              expo
                ? `${texto(expo.titulo, idioma)}, exposição em curso`
                : "Obra em destaque da Galeria Contagiarte"
            }
            legenda="Obra em destaque"
            prioridade
            revelar={false}
            sizes="100vw"
            className="h-full"
          />
        </div>

        {inversao && (
          /* A mesma fotografia outra vez, escurecida e saturada, a
             aparecer só na banda do título. Dá cor às letras, que são
             desenhadas com o inverso do que têm por baixo. Vai numa
             camada de paralaxe igual à de cima para as duas andarem
             sempre alinhadas. Ver `src/lib/veu.ts`. */
          <div
            aria-hidden="true"
            data-camada="inversao"
            data-paralaxe="scroll"
            data-factor="0.22"
            className="pointer-events-none absolute inset-x-0 -inset-y-[8%]"
            style={{
              filter: inversao.filtro,
              maskImage: inversao.mascara,
              WebkitMaskImage: inversao.mascara,
            }}
          >
            <Imagem
              media={expo?.imagem ?? null}
              alt=""
              legenda=""
              revelar={false}
              sizes="100vw"
              className="h-full"
            />
          </div>
        )}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: VEU_HEROI,
          }}
        />

        {/* Título e linha de rodapé numa coluna só: em ecrãs estreitos
            o título ocupa três linhas e não pode tapar o "Desça". */}
        <div className="absolute inset-x-7 bottom-9 flex flex-col gap-6">
          <h1
            className="titulo d-hero pointer-events-none text-papel"
            style={{ mixBlendMode: "difference" }}
          >
            {T("home.hero.titulo", "FOR THE NEXT GENERATION OF ART LOVERS")}
          </h1>

          <div className="flex flex-wrap items-center gap-5">
            <span className="flex items-center gap-3.5 text-[11px] tracking-[0.24em] text-[rgba(242,237,228,0.7)] uppercase">
              <span className="h-px w-11 bg-[rgba(242,237,228,0.5)]" />
              {t("hero.desca", idioma)}
            </span>
            <span className="max-w-[44ch] text-[14px] leading-relaxed text-claro-75">
              {T(
                "home.hero.posicionamento",
                "Galeria de arte contemporânea. Porto, Douro e onde mais fizer sentido expor.",
              )}
            </span>
          </div>
        </div>
      </section>

      {/* 2. Faixa em movimento ----------------------------------------- */}
      <Faixa
        palavras={[
          t("faixa.disrupcao", idioma),
          t("faixa.vinho", idioma),
          t("faixa.molduras", idioma),
          t("faixa.curadoria", idioma),
        ]}
      />

      {/* 3. Exposição em curso ----------------------------------------- */}
      {expo && (
        <Seccao id="exposicao">
          <div className="grid items-center gap-16" style={colunas(380)}>
            <div className="flex flex-col gap-[26px]" data-surge="">
              <span className="text-[11px] tracking-[0.3em] text-[rgba(242,237,228,0.55)] uppercase">
                {[
                  t(`estado.${situacao(expo)}`, idioma),
                  periodo(
                    expo.dataInicio,
                    expo.dataFim,
                    idioma,
                    expo.permanente,
                  ),
                  expo.lugar?.nome,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>

              <h2 className="titulo d-1 uppercase">
                {texto(expo.titulo, idioma)}
              </h2>

              <p className="max-w-[46ch] text-[19px] leading-[1.55] text-[rgba(242,237,228,0.82)]">
                {texto(expo.texto, idioma)}
              </p>

              {expo.artistas.length > 0 && (
                <div className="flex flex-wrap gap-4 text-[13px] tracking-[0.1em] text-[rgba(242,237,228,0.6)]">
                  {expo.artistas.map((ea, i) => (
                    <span key={ea.artista.id} className="flex gap-4">
                      {i > 0 && (
                        <span className="text-[rgba(242,237,228,0.55)]">·</span>
                      )}
                      {ea.artista.nome}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-2 flex flex-wrap gap-3.5">
                <Botao href={caminho(idioma, `/exposicoes/${expo.slug}`)}>
                  {t("acao.ver_exposicao", idioma)}
                </Botao>
                {expo.salas.length > 0 && (
                  <Botao
                    variante="linha"
                    href={caminho(idioma, `/exposicoes/${expo.slug}/percurso`)}
                  >
                    {t("acao.atravessar", idioma)}
                  </Botao>
                )}
              </div>
            </div>

            <div data-paralaxe="centro" data-factor="-38">
              <Imagem
                media={expo.imagem}
                alt={`Vista da exposição ${texto(expo.titulo, idioma)}`}
                proporcao="4/5"
                legenda="Vista da exposição"
                sizes="(max-width: 900px) 100vw, 45vw"
              />
            </div>
          </div>
        </Seccao>
      )}

      {/* 4. Obras ------------------------------------------------------- */}
      {obras.length > 0 && (
        <Seccao id="obras" semPadding>
          <div className="mb-14 flex flex-wrap items-baseline justify-between gap-5 px-7">
            <h2 className="titulo d-2">{t("nav.obras", idioma)}</h2>
            <span className="etiqueta">{t("acao.arrastar", idioma)}</span>
          </div>

          <ul
            className="faixa-h flex gap-8 overflow-x-auto px-7 pb-8"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {obras.map((obra, i) => (
              <li key={obra.id} className="contents">
                <CartaoObra
                  obra={obra}
                  idioma={idioma}
                  numero={i + 1}
                  largura="min(78vw,440px)"
                />
              </li>
            ))}
          </ul>

          <div className="px-7">
            <Link
              href={caminho(idioma, "/obras")}
              className="inline-flex min-h-11 items-center text-[12px] tracking-[0.18em] uppercase"
            >
              {t("acao.ver_todas", idioma)}
            </Link>
          </div>
        </Seccao>
      )}

      {/* 5. Porque se compra arte --------------------------------------- */}
      <Seccao claro className="px-7 py-[140px]">
        <span className="text-[11px] tracking-[0.3em] text-[rgba(14,12,11,0.62)] uppercase">
          {T("home.porque.etiqueta", "PORQUE SE COMPRA ARTE")}
        </span>
        <h2 className="titulo mt-7 max-w-[16ch] text-[clamp(38px,6.5vw,110px)] leading-[0.9]">
          {T("home.porque.titulo", "UMA OBRA NÃO É SÓ O QUE FICA NA PAREDE.")}
        </h2>
        <div
          className="mt-[72px] grid gap-12"
          style={colunas(260)}
          data-surge=""
        >
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="flex flex-col gap-4 border-t-2 border-tinta pt-6"
            >
              <span className="titulo text-[14px] tracking-[0.1em]">
                {T(`home.porque.${n}.titulo`)}
              </span>
              <p className="text-[17px] leading-[1.6] text-escuro-78">
                {T(`home.porque.${n}.texto`)}{" "}
                {n === 2 && (
                  <Link
                    href={caminho(idioma, "/a-obra-como-ativo")}
                    className="border-b border-[rgba(14,12,11,0.4)] text-tinta"
                  >
                    {t("acao.avaliar", idioma)}
                  </Link>
                )}
              </p>
            </div>
          ))}
        </div>
      </Seccao>

      {/* 6. Citação ------------------------------------------------------ */}
      <Seccao className="px-7 py-[140px]">
        <blockquote className="titulo mx-auto max-w-[22ch] text-center text-[clamp(30px,5vw,80px)] leading-[1.02]">
          {T("home.citacao")}
        </blockquote>
        <p className="mt-9 text-center text-[11px] tracking-[0.24em] text-[rgba(242,237,228,0.55)]">
          {T("home.citacao.autor")}
        </p>
      </Seccao>

      {/* 7. Artistas ----------------------------------------------------- */}
      {artistas.length > 0 && (
        <Seccao id="artistas">
          <div
            className="mb-3 flex flex-wrap items-baseline gap-5"
            data-surge=""
          >
            <h2 className="titulo d-2">{t("nav.artistas", idioma)}</h2>
            <span className="text-[13px] tracking-[0.2em] text-[rgba(242,237,228,0.55)]">
              {String(artistas.length).padStart(2, "0")}
            </span>
          </div>
          <ListaArtistas
            idioma={idioma}
            nota={T("artistas.nota")}
            artistas={artistas.map((a) => ({
              slug: a.slug,
              nome: a.nome,
              disciplina: a.disciplina,
              nota: texto(a.nota, idioma),
              temPagina: true,
            }))}
          />
        </Seccao>
      )}

      {/* 8. Molduras ----------------------------------------------------- */}
      <Seccao id="molduras">
        <div className="grid items-center gap-16" style={colunas(360)}>
          <div className="flex flex-col gap-[26px]" data-surge="">
            <span className="text-[11px] tracking-[0.3em] text-[rgba(242,237,228,0.55)] uppercase">
              {T("molduras.etiqueta", "PARCERIA MOLDARTPÓVOA")}
            </span>
            <h2 className="titulo d-apoio">{t("faixa.molduras", idioma)}</h2>
            <p className="max-w-[48ch] text-[18px] leading-[1.6] text-[rgba(242,237,228,0.8)]">
              {T("molduras.texto")}
            </p>

            <div className="flex flex-wrap gap-3.5">
              <Botao
                variante="linha"
                externo
                href={linkWhatsApp(
                  def.whatsapp,
                  "Olá, queria um orçamento de moldura.",
                )}
              >
                {t("acao.whatsapp", idioma)}
              </Botao>
              <Botao href={caminho(idioma, "/ver-na-parede")}>
                {t("acao.parede", idioma)}
              </Botao>
            </div>

            <div className="mt-3 flex flex-col gap-4 border border-[rgba(242,237,228,0.2)] p-7">
              <span className="text-[10px] tracking-[0.24em] text-[rgba(242,237,228,0.55)] uppercase">
                {t("acao.orcamento", idioma)}
              </span>
              <FormularioPedido
                idioma={idioma}
                tipo="moldura"
                comMedidas
                origem="homepage-molduras"
              />
            </div>
          </div>

          <Imagem
            media={null}
            alt="Moldura produzida em parceria com a MOLDARTPÓVOA"
            proporcao="1/1"
            legenda="Molduras MOLDARTPÓVOA"
            sizes="(max-width: 900px) 100vw, 45vw"
          />
        </div>
      </Seccao>

      {/* 9. Os lugares --------------------------------------------------- */}
      {lugares.length > 0 && (
        <Seccao id="lugares">
          <TituloSeccao
            nivel={2}
            escala="apoio"
            nota={
              <span className="max-w-[40ch] text-[16px] leading-relaxed normal-case">
                {T("lugares.intro")}
              </span>
            }
          >
            {t("nav.lugares", idioma).toUpperCase()}
          </TituloSeccao>

          <ul className="grid gap-6" style={colunas(220)} data-surge="">
            {lugares.map((l) => (
              <li key={l.id} className="flex flex-col gap-3.5">
                <Imagem
                  media={l.fotografia}
                  alt={`${l.nome}, ${texto(l.localidade, idioma)}`}
                  proporcao="3/4"
                  legenda={l.nome}
                  sizes="(max-width: 900px) 50vw, 22vw"
                />
                <span className="titulo-med text-[16px] uppercase">
                  {l.nome}
                </span>
                <span className="text-[14px] text-claro-55">
                  {[texto(l.localidade, idioma), texto(l.tipo, idioma)]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        </Seccao>
      )}

      {/* 10. Arquivo ----------------------------------------------------- */}
      {arquivo.length > 0 && (
        <Seccao id="arquivo">
          <TituloSeccao
            nivel={2}
            escala="apoio"
            nota={
              idioma === "pt"
                ? "EXPOSIÇÕES E CURADORIAS"
                : idioma === "en"
                  ? "EXHIBITIONS AND CURATION"
                  : "EXPOSICIONES Y CURADURÍAS"
            }
          >
            {t("nav.arquivo", idioma).toUpperCase()}
          </TituloSeccao>

          <div className="flex flex-col" data-surge="">
            {arquivo.map((e) => (
              <Link
                key={e.id}
                href={caminho(idioma, `/exposicoes/${e.slug}`)}
                className="grid grid-cols-[54px_minmax(0,1fr)_auto] items-baseline gap-4 border-t border-[rgba(242,237,228,0.16)] py-6 text-papel transition-colors hover:text-ouro sm:gap-7 sm:py-[30px] lg:grid-cols-[90px_minmax(0,1.7fr)_minmax(0,1fr)_auto]"
              >
                <span className="text-[13px] tracking-[0.1em] text-[rgba(242,237,228,0.55)]">
                  {anos(e.dataInicio, e.dataFim)}
                </span>
                <span className="titulo-med text-[clamp(20px,2.4vw,34px)] leading-none">
                  {texto(e.titulo, idioma)}
                </span>
                <span className="hidden text-[14px] text-claro-55 lg:block">
                  {e.lugar
                    ? `${e.lugar.nome} · ${texto(e.lugar.localidade, idioma)}`
                    : ""}
                </span>
                <span className="text-[11px] tracking-[0.2em] text-[rgba(242,237,228,0.55)] uppercase">
                  {t(`estado.${situacao(e)}`, idioma)}
                </span>
              </Link>
            ))}
            <span className="border-t border-[rgba(242,237,228,0.16)] pt-6 text-[13px] text-[rgba(242,237,228,0.55)]">
              {T("arquivo.nota")}
            </span>
          </div>
        </Seccao>
      )}

      {/* 11. A galeria --------------------------------------------------- */}
      <Seccao id="galeria">
        <div className="grid gap-16" style={colunas(320)}>
          <Imagem
            media={null}
            alt="Rui Pedro e Maria João, art dealers da Galeria Contagiarte"
            proporcao="4/5"
            legenda="Rui Pedro & Maria João, art dealers"
            sizes="(max-width: 900px) 100vw, 45vw"
          />
          <div
            className="flex flex-col justify-center gap-[26px]"
            data-surge=""
          >
            <span className="text-[11px] tracking-[0.3em] text-[rgba(242,237,228,0.55)] uppercase">
              {t("nav.galeria", idioma).toUpperCase()}
            </span>
            <h2 className="titulo d-apoio">{T("home.galeria.titulo")}</h2>
            <p className="max-w-[48ch] text-[18px] leading-[1.6] text-[rgba(242,237,228,0.8)]">
              {T("home.galeria.texto")}
            </p>
            <p className="text-[14px] tracking-[0.06em] text-[rgba(242,237,228,0.55)]">
              {T("home.galeria.assinatura")}
            </p>
          </div>
        </div>
      </Seccao>

      {/* 12. Descarregar -------------------------------------------------- */}
      {ficheiros.length > 0 && (
        <Seccao id="descarregar">
          <h2 className="titulo d-apoio mb-12">
            {t("nav.descarregar", idioma).toUpperCase()}
          </h2>
          <ul className="grid gap-6" style={colunas(260)} data-surge="">
            {ficheiros.map((f) => (
              <li key={f.id} className="contents">
                <a
                  href={`/api/descarregar/${f.slug}`}
                  className="flex flex-col gap-4 border border-[rgba(242,237,228,0.2)] p-8 text-papel transition-colors hover:border-ouro hover:bg-[rgba(180,136,74,0.08)]"
                >
                  <span className="text-[10px] tracking-[0.24em] text-[rgba(242,237,228,0.55)] uppercase">
                    {texto(f.etiqueta, idioma)}
                  </span>
                  <span className="titulo-med text-[24px]">
                    {texto(f.nome, idioma)}
                  </span>
                  <span className="text-[14px] text-claro-55">
                    {texto(f.descricao, idioma)}
                  </span>
                  <span className="mt-auto pt-5 text-[12px] tracking-[0.18em] text-ouro uppercase">
                    {t("acao.descarregar", idioma)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Seccao>
      )}

      {/* 13. Newsletter ---------------------------------------------------- */}
      <Seccao id="newsletter" claro semFio>
        <div className="grid items-center gap-16" style={colunas(340)}>
          <div className="flex flex-col gap-5">
            <span className="text-[11px] tracking-[0.3em] text-[rgba(14,12,11,0.62)] uppercase">
              {texto(txt["newsletter.etiqueta"], idioma)}
            </span>
            <h2 className="titulo d-apoio max-w-[14ch]">
              {T("newsletter.titulo")}
            </h2>
            <p className="max-w-[44ch] text-[17px] leading-[1.6] text-[rgba(14,12,11,0.7)]">
              {T("newsletter.texto")}
            </p>
          </div>
          <FormularioNewsletter idioma={idioma} origem="homepage" />
        </div>
      </Seccao>
    </>
  );
}
