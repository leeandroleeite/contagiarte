"use client";

import { Botao } from "@/components/Botao";
import { BotoesCatalogo } from "@/components/BotoesCatalogo";
import type { MediaLeve } from "@/components/Imagem";
import {
  ArtistasExposicao,
  CabecalhoExposicao,
  CitacaoExposicao,
  TextoExposicao,
  type ArtistaEmExposicao,
} from "@/components/PecasExposicao";
import type { Localizado } from "@/lib/db/schema";
import { t } from "@/lib/i18n";
import { caminho, type Idioma } from "@/lib/i18n/config";
import { cx, linkWhatsApp } from "@/lib/utils";

/**
 * A página da exposição como o visitante a vê, para o "Ver no site"
 * do telemóvel. Desenham-na as peças da própria página
 * (`PecasExposicao`), e não uma imitação.
 *
 * Os links e botões estão lá, mas não se carregam (`inert`): um clique
 * no WhatsApp a meio da edição saía do backoffice.
 */
export function PreviaExposicao({
  idioma,
  publicada,
  slug,
  className,
  imagem,
  titulo,
  etiqueta,
  texto,
  curadoria,
  ficha,
  citacao,
  citacaoAutor,
  artistas,
  catalogos,
  temPercurso,
  whatsapp,
}: {
  idioma: Idioma;
  /** Se a versão guardada já está no site. */
  publicada: boolean;
  slug: string;
  className?: string;
  imagem: MediaLeve;
  titulo: string;
  etiqueta: string;
  texto: string;
  curadoria: string | null;
  ficha: Array<[string, string]>;
  citacao: string;
  citacaoAutor: string | null;
  artistas: ArtistaEmExposicao[];
  catalogos: Array<{ id: string; slug: string; nome: Localizado }>;
  temPercurso: boolean;
  whatsapp: string;
}) {
  return (
    <aside
      aria-label="Pré-visualização da página da exposição"
      className={cx("flex min-w-0 flex-col gap-3", className)}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-[11px] tracking-[0.16em] text-adm-suave uppercase">
        <span>
          {publicada ? "Assim está no site" : "Assim vai ficar no site"} ·{" "}
          {idioma}
        </span>
        <span className="tracking-normal normal-case">
          {caminho(idioma, `/exposicoes/${slug || "…"}`)}
        </span>
      </div>

      <div className="previa-site @container border border-adm-fio bg-tinta text-papel">
        <div inert>
          <CabecalhoExposicao
            imagem={imagem}
            titulo={titulo}
            etiqueta={etiqueta}
            nivelTitulo="p"
            classeTitulo="text-[length:clamp(36px,9cqi,112px)] leading-[0.88]"
            className="h-[clamp(420px,110cqi,640px)] min-h-0"
          />

          <div className="border-b border-fio px-5 py-14">
            <TextoExposicao
              texto={texto}
              curadoria={curadoria}
              ficha={ficha}
              botoes={
                <>
                  <Botao
                    externo
                    className="px-6 py-[15px]"
                    href={linkWhatsApp(
                      whatsapp,
                      t("whatsapp.exposicao", idioma, { titulo }),
                    )}
                  >
                    {t("acao.perguntar_whatsapp", idioma)}
                  </Botao>
                  {temPercurso && (
                    <Botao
                      variante="linha"
                      className="px-6 py-[15px]"
                      href={caminho(idioma, `/exposicoes/${slug}/percurso`)}
                    >
                      {t("acao.atravessar", idioma)}
                    </Botao>
                  )}
                  <BotoesCatalogo
                    catalogos={catalogos}
                    idioma={idioma}
                    className="px-6 py-[15px]"
                  />
                </>
              }
            />
          </div>

          {citacao && (
            <div className="bg-papel px-5 py-14 text-tinta">
              <CitacaoExposicao citacao={citacao} autor={citacaoAutor} />
            </div>
          )}

          {artistas.length > 0 && (
            <div className="px-5 py-14">
              <ArtistasExposicao
                artistas={artistas}
                idioma={idioma}
                nivelTitulo="p"
                revelar={false}
              />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
