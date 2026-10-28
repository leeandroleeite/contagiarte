/**
 * Situação de uma exposição face à data de hoje.
 *
 * Vive à parte de `dados.ts` porque a ficha da exposição no
 * backoffice a calcula no navegador, enquanto se mudam as datas, e
 * `dados.ts` fala com a base de dados.
 */
export function situacao(e: {
  dataInicio: string | null;
  dataFim: string | null;
  permanente: boolean;
}): "em_curso" | "permanente" | "proxima" | "arquivo" {
  if (e.permanente) return "permanente";
  const hoje = new Date().toISOString().slice(0, 10);
  if (e.dataInicio && e.dataInicio > hoje) return "proxima";
  if (e.dataFim && e.dataFim < hoje) return "arquivo";
  if (e.dataInicio && e.dataInicio <= hoje) return "em_curso";
  return "arquivo";
}
