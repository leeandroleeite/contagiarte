import { sql as bruto } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * Onde é que cada ficheiro da mediateca está a ser usado.
 *
 * O botão de apagar avisava que o ficheiro "sai das páginas que o
 * usam", e não dizia quais. Quem está a arrumar a mediateca não tem
 * como saber se aquela fotografia é a capa da exposição ou uma
 * repetida que ficou de um carregamento falhado.
 */

export type Uso = { onde: string; nome: string };

/** Uma consulta só para todos os ficheiros da página. */
export async function usosDeMedia(
  ids: string[],
): Promise<Map<string, Uso[]>> {
  const mapa = new Map<string, Uso[]>();
  if (ids.length === 0) return mapa;

  const marcas = bruto.join(
    ids.map((id) => bruto`${id}`),
    bruto`, `,
  );

  // Cada tabela contribui com as suas linhas. O nome sai do JSON
  // traduzível, ou da coluna de texto quando não é traduzível.
  const linhas = await db.all<{ media_id: string; onde: string; nome: string }>(
    bruto`
      select fotografia_id as media_id, 'Obra' as onde,
             json_extract(titulo, '$.pt') as nome
        from obras where fotografia_id in (${marcas})
      union all
      select media_id, 'Obra, galeria' as onde,
             (select json_extract(titulo, '$.pt') from obras o where o.id = obra_id) as nome
        from obras_media where media_id in (${marcas})
      union all
      select imagem_id, 'Exposição', json_extract(titulo, '$.pt')
        from exposicoes where imagem_id in (${marcas})
      union all
      select retrato_id, 'Artista', nome
        from artistas where retrato_id in (${marcas})
      union all
      select fotografia_id, 'Lugar', nome
        from lugares where fotografia_id in (${marcas})
      union all
      select fotografia_id, 'Sala do percurso', json_extract(nome, '$.pt')
        from salas where fotografia_id in (${marcas})
      union all
      select ficheiro_id, 'Descarregável', json_extract(nome, '$.pt')
        from descarregaveis where ficheiro_id in (${marcas})
      union all
      select anexo_id, 'Anexo de pedido', coalesce(nome, email, 'sem nome')
        from pedidos where anexo_id in (${marcas})
    `,
  );

  for (const l of linhas) {
    mapa.set(l.media_id, [
      ...(mapa.get(l.media_id) ?? []),
      { onde: l.onde, nome: l.nome ?? "" },
    ]);
  }
  return mapa;
}

/**
 * Retrato da mediateca, para o backoffice dizer como ela está em vez
 * de repetir uma nota escrita à mão que envelhece.
 */
export async function retratoDaMediateca() {
  const [linha] = await db.all<{
    total: number;
    pequenas: number;
    orfas: number;
  }>(bruto`
    select
      count(*) as total,
      sum(case when largura is not null and max(largura, altura) < 800 then 1 else 0 end) as pequenas,
      sum(case when id not in (
        select fotografia_id from obras where fotografia_id is not null
        union select media_id from obras_media
        union select imagem_id from exposicoes where imagem_id is not null
        union select retrato_id from artistas where retrato_id is not null
        union select fotografia_id from lugares where fotografia_id is not null
        union select fotografia_id from salas where fotografia_id is not null
        union select ficheiro_id from descarregaveis where ficheiro_id is not null
        union select anexo_id from pedidos where anexo_id is not null
      ) then 1 else 0 end) as orfas
    from media
  `);
  return linha ?? { total: 0, pequenas: 0, orfas: 0 };
}
