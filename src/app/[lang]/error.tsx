"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Botao } from "@/components/Botao";
import { t } from "@/lib/i18n";
import { caminho, IDIOMA_BASE, IDIOMAS, type Idioma } from "@/lib/i18n/config";

/**
 * Quando uma página rebenta a sério.
 *
 * Sem isto, o Next mostrava o seu ecrã de erro cru: fundo branco, uma
 * frase em inglês sobre uma excepção do servidor, e nenhuma saída. Um
 * visitante que apanhe uma falha da base de dados merece a mesma
 * cortesia que o 404 já lhe dava, e a galeria merece que o erro não
 * pareça um site abandonado.
 *
 * É cliente por obrigação do Next, e por isso não lê a base: os textos
 * vêm do dicionário, e o idioma do endereço. Uma página de erro que
 * depende da base é uma página de erro que também falha.
 */
export default function Erro({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const primeiro = usePathname()?.split("/")[1] ?? "";
  const idioma: Idioma = (IDIOMAS as readonly string[]).includes(primeiro)
    ? (primeiro as Idioma)
    : IDIOMA_BASE;

  useEffect(() => {
    // O `digest` é o que liga este ecrã à linha certa nos registos do
    // servidor. Sem ele, um relato de "deu erro" não se investiga.
    console.error("Erro na página:", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-[80dvh] flex-col justify-center gap-8 px-margem pt-[140px] pb-16">
      <span className="etiqueta text-claro-55">{t("erro.etiqueta", idioma)}</span>

      <h1 className="titulo max-w-[16ch] d-heroi uppercase">
        {t("erro.titulo", idioma)}
      </h1>

      <p className="lead max-w-[46ch] text-claro-80">{t("erro.texto", idioma)}</p>

      <div className="flex flex-wrap gap-3.5">
        <Botao aoClicar={reset}>{t("erro.tentar", idioma)}</Botao>
        <Botao variante="linha" href={caminho(idioma, "/")}>
          {t("404.inicio", idioma)}
        </Botao>
      </div>

      {error.digest && (
        <p className="meta text-claro-55">
          {t("erro.referencia", idioma, { codigo: error.digest })}
        </p>
      )}
    </div>
  );
}
