"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirAdministrador, exigirSessao, registar } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  artistas,
  definicoes,
  descarregaveis,
  exposicoes,
  exposicoesArtistas,
  lugares,
  obras,
  pedidos,
  salas,
  textos,
  utilizadores,
  type Definicoes,
} from "@/lib/db/schema";
import { baralhar } from "@/lib/auth";
import { DEFINICOES_OMISSAO } from "@/lib/db/omissoes";
import {
  lerBool,
  lerData,
  lerEstado,
  lerInteiro,
  lerLocalizado,
  lerLocalizadoObrigatorio,
  lerNumero,
  lerRelacao,
  lerSlug,
  lerTexto,
} from "./formulario";

/**
 * Todas as escritas do backoffice. Cada acção confirma a sessão,
 * grava, deixa rasto no registo e limpa a cache das páginas públicas.
 */

/** O site inteiro depende de conteúdo; mais vale limpar tudo. */
function limparCache() {
  revalidatePath("/", "layout");
}

// --------------------------------------------------------------------
// Obras
// --------------------------------------------------------------------

export async function guardarObra(id: string | null, dados: FormData) {
  const sessao = await exigirSessao();

  const titulo = lerLocalizadoObrigatorio(dados, "titulo", "Sem título");
  const valores = {
    slug: lerSlug(dados, "slug", titulo.pt),
    titulo,
    artistaId: lerRelacao(dados, "artistaId"),
    tecnica: lerLocalizado(dados, "tecnica"),
    dimensoes: lerTexto(dados, "dimensoes"),
    ano: lerNumero(dados, "ano"),
    exposicaoId: lerRelacao(dados, "exposicaoId"),
    fotografiaId: lerRelacao(dados, "fotografiaId"),
    descricao: lerLocalizado(dados, "descricao"),
    preco: lerLocalizado(dados, "preco"),
    larguraCm: lerNumero(dados, "larguraCm"),
    alturaCm: lerNumero(dados, "alturaCm"),
    disponibilidade: (["disponivel", "reservada", "vendida", "nao_venal"].includes(
      String(dados.get("disponibilidade")),
    )
      ? String(dados.get("disponibilidade"))
      : "disponivel") as "disponivel" | "reservada" | "vendida" | "nao_venal",
    destaque: lerBool(dados, "destaque"),
    estado: lerEstado(dados),
    ordem: lerInteiro(dados, "ordem"),
    actualizadoEm: new Date(),
  };

  if (id) {
    await db.update(obras).set(valores).where(eq(obras.id, id));
    await registar(sessao, "editou", "obra", id, titulo.pt);
  } else {
    const [nova] = await db.insert(obras).values(valores).returning();
    await registar(sessao, "criou", "obra", nova.id, titulo.pt);
    id = nova.id;
  }

  limparCache();
  redirect(`/admin/obras?guardado=${id}`);
}

export async function apagarObra(id: string) {
  const sessao = await exigirSessao();
  await db.delete(obras).where(eq(obras.id, id));
  await registar(sessao, "apagou", "obra", id);
  limparCache();
  redirect("/admin/obras");
}

// --------------------------------------------------------------------
// Artistas
// --------------------------------------------------------------------

export async function guardarArtista(id: string | null, dados: FormData) {
  const sessao = await exigirSessao();

  const nome = lerTexto(dados, "nome") ?? "Sem nome";
  const valores = {
    slug: lerSlug(dados, "slug", nome),
    nome,
    disciplina: lerTexto(dados, "disciplina") ?? "pintura",
    naturalidade: lerTexto(dados, "naturalidade"),
    instagram: (lerTexto(dados, "instagram") ?? "").replace(/^@/, "") || null,
    website: lerTexto(dados, "website"),
    retratoId: lerRelacao(dados, "retratoId"),
    nota: lerLocalizado(dados, "nota"),
    biografia: lerLocalizado(dados, "biografia"),
    citacao: lerLocalizado(dados, "citacao"),
    estado: lerEstado(dados),
    ordem: lerInteiro(dados, "ordem"),
    actualizadoEm: new Date(),
  };

  if (id) {
    await db.update(artistas).set(valores).where(eq(artistas.id, id));
    await registar(sessao, "editou", "artista", id, nome);
  } else {
    const [novo] = await db.insert(artistas).values(valores).returning();
    await registar(sessao, "criou", "artista", novo.id, nome);
    id = novo.id;
  }

  limparCache();
  redirect(`/admin/artistas?guardado=${id}`);
}

export async function apagarArtista(id: string) {
  const sessao = await exigirSessao();
  await db.delete(artistas).where(eq(artistas.id, id));
  await registar(sessao, "apagou", "artista", id);
  limparCache();
  redirect("/admin/artistas");
}

// --------------------------------------------------------------------
// Exposições
// --------------------------------------------------------------------

export async function guardarExposicao(id: string | null, dados: FormData) {
  const sessao = await exigirSessao();

  const titulo = lerLocalizadoObrigatorio(dados, "titulo", "Sem título");
  const destaque = lerBool(dados, "destaque");

  const valores = {
    slug: lerSlug(dados, "slug", titulo.pt),
    titulo,
    subtitulo: lerLocalizado(dados, "subtitulo"),
    lugarId: lerRelacao(dados, "lugarId"),
    dataInicio: lerData(dados, "dataInicio"),
    dataFim: lerData(dados, "dataFim"),
    permanente: lerBool(dados, "permanente"),
    curadoria: lerTexto(dados, "curadoria"),
    horario: lerLocalizado(dados, "horario"),
    reservas: lerLocalizado(dados, "reservas"),
    inclui: lerLocalizado(dados, "inclui"),
    imagemId: lerRelacao(dados, "imagemId"),
    texto: lerLocalizado(dados, "texto"),
    citacao: lerLocalizado(dados, "citacao"),
    citacaoAutor: lerTexto(dados, "citacaoAutor"),
    destaque,
    estado: lerEstado(dados),
    ordem: lerInteiro(dados, "ordem"),
    actualizadoEm: new Date(),
  };

  if (id) {
    await db.update(exposicoes).set(valores).where(eq(exposicoes.id, id));
    await registar(sessao, "editou", "exposicao", id, titulo.pt);
  } else {
    const [nova] = await db.insert(exposicoes).values(valores).returning();
    await registar(sessao, "criou", "exposicao", nova.id, titulo.pt);
    id = nova.id;
  }

  // Só uma exposição pode estar em destaque na homepage.
  if (destaque) {
    await db
      .update(exposicoes)
      .set({ destaque: false })
      .where(eq(exposicoes.destaque, true));
    await db
      .update(exposicoes)
      .set({ destaque: true })
      .where(eq(exposicoes.id, id));
  }

  // Artistas participantes: substitui a lista inteira.
  const escolhidos = dados.getAll("artistas").map(String).filter(Boolean);
  await db
    .delete(exposicoesArtistas)
    .where(eq(exposicoesArtistas.exposicaoId, id));
  if (escolhidos.length > 0) {
    await db.insert(exposicoesArtistas).values(
      escolhidos.map((artistaId, ordem) => ({
        exposicaoId: id!,
        artistaId,
        ordem,
      })),
    );
  }

  limparCache();
  redirect(`/admin/exposicoes?guardado=${id}`);
}

export async function apagarExposicao(id: string) {
  const sessao = await exigirSessao();
  await db.delete(exposicoes).where(eq(exposicoes.id, id));
  await registar(sessao, "apagou", "exposicao", id);
  limparCache();
  redirect("/admin/exposicoes");
}

// --------------------------------------------------------------------
// Lugares
// --------------------------------------------------------------------

export async function guardarLugar(id: string | null, dados: FormData) {
  const sessao = await exigirSessao();

  const nome = lerTexto(dados, "nome") ?? "Sem nome";
  const valores = {
    slug: lerSlug(dados, "slug", nome),
    nome,
    localidade: lerLocalizado(dados, "localidade"),
    tipo: lerLocalizado(dados, "tipo"),
    morada: lerTexto(dados, "morada"),
    site: lerTexto(dados, "site"),
    mapa: lerTexto(dados, "mapa"),
    fotografiaId: lerRelacao(dados, "fotografiaId"),
    descricao: lerLocalizado(dados, "descricao"),
    estado: lerEstado(dados),
    ordem: lerInteiro(dados, "ordem"),
    actualizadoEm: new Date(),
  };

  if (id) {
    await db.update(lugares).set(valores).where(eq(lugares.id, id));
    await registar(sessao, "editou", "lugar", id, nome);
  } else {
    const [novo] = await db.insert(lugares).values(valores).returning();
    await registar(sessao, "criou", "lugar", novo.id, nome);
    id = novo.id;
  }

  limparCache();
  redirect(`/admin/lugares?guardado=${id}`);
}

export async function apagarLugar(id: string) {
  const sessao = await exigirSessao();
  await db.delete(lugares).where(eq(lugares.id, id));
  await registar(sessao, "apagou", "lugar", id);
  limparCache();
  redirect("/admin/lugares");
}

// --------------------------------------------------------------------
// Salas do percurso
// --------------------------------------------------------------------

export async function guardarSala(id: string | null, dados: FormData) {
  const sessao = await exigirSessao();

  const nome = lerLocalizadoObrigatorio(dados, "nome", "Sala");
  const exposicaoId = lerRelacao(dados, "exposicaoId");
  if (!exposicaoId) redirect("/admin/percurso?erro=sem-exposicao");

  const valores = {
    exposicaoId,
    slug: lerSlug(dados, "slug", nome.pt),
    nome,
    texto: lerLocalizado(dados, "texto"),
    fotografiaId: lerRelacao(dados, "fotografiaId"),
    ordem: lerInteiro(dados, "ordem"),
  };

  if (id) {
    await db.update(salas).set(valores).where(eq(salas.id, id));
    await registar(sessao, "editou", "sala", id, nome.pt);
  } else {
    const [nova] = await db.insert(salas).values(valores).returning();
    await registar(sessao, "criou", "sala", nova.id, nome.pt);
  }

  limparCache();
  redirect(`/admin/percurso?exposicao=${exposicaoId}`);
}

export async function apagarSala(id: string, exposicaoId: string) {
  const sessao = await exigirSessao();
  await db.delete(salas).where(eq(salas.id, id));
  await registar(sessao, "apagou", "sala", id);
  limparCache();
  redirect(`/admin/percurso?exposicao=${exposicaoId}`);
}

// --------------------------------------------------------------------
// Descarregáveis
// --------------------------------------------------------------------

export async function guardarDescarregavel(
  id: string | null,
  dados: FormData,
) {
  const sessao = await exigirSessao();

  const nome = lerLocalizadoObrigatorio(dados, "nome", "Documento");
  const valores = {
    slug: lerSlug(dados, "slug", nome.pt),
    etiqueta: lerLocalizado(dados, "etiqueta"),
    nome,
    descricao: lerLocalizado(dados, "descricao"),
    ficheiroId: lerRelacao(dados, "ficheiroId"),
    data: lerData(dados, "data"),
    estado: lerEstado(dados),
    ordem: lerInteiro(dados, "ordem"),
  };

  if (id) {
    await db
      .update(descarregaveis)
      .set(valores)
      .where(eq(descarregaveis.id, id));
    await registar(sessao, "editou", "descarregavel", id, nome.pt);
  } else {
    const [novo] = await db
      .insert(descarregaveis)
      .values(valores)
      .returning();
    await registar(sessao, "criou", "descarregavel", novo.id, nome.pt);
  }

  limparCache();
  redirect("/admin/descarregaveis");
}

export async function apagarDescarregavel(id: string) {
  const sessao = await exigirSessao();
  await db.delete(descarregaveis).where(eq(descarregaveis.id, id));
  await registar(sessao, "apagou", "descarregavel", id);
  limparCache();
  redirect("/admin/descarregaveis");
}

// --------------------------------------------------------------------
// Textos do site
// --------------------------------------------------------------------

export async function guardarTextos(dados: FormData) {
  const sessao = await exigirSessao();

  const chaves = dados.getAll("chaves").map(String);
  for (const chave of chaves) {
    const valor = lerLocalizado(dados, `t.${chave}`);
    if (!valor) continue;
    await db
      .update(textos)
      .set({ valor, actualizadoEm: new Date() })
      .where(eq(textos.chave, chave));
  }

  await registar(
    sessao,
    "editou",
    "textos",
    null,
    `${chaves.length} chaves revistas`,
  );
  limparCache();
  redirect("/admin/textos?guardado=1");
}

// --------------------------------------------------------------------
// Definições
// --------------------------------------------------------------------

export async function guardarDefinicoes(dados: FormData) {
  const sessao = await exigirSessao();

  const valor: Definicoes = {
    ...DEFINICOES_OMISSAO,
    email: lerTexto(dados, "email") ?? DEFINICOES_OMISSAO.email,
    telefone: lerTexto(dados, "telefone") ?? DEFINICOES_OMISSAO.telefone,
    whatsapp: (lerTexto(dados, "whatsapp") ?? DEFINICOES_OMISSAO.whatsapp)
      .replace(/[^0-9]/g, ""),
    instagram: (lerTexto(dados, "instagram") ?? "").replace(/^@/, "") ||
      DEFINICOES_OMISSAO.instagram,
    morada: lerTexto(dados, "morada") ?? "",
    responsavel: lerTexto(dados, "responsavel") ?? "",
    parceiros: (lerTexto(dados, "parceiros") ?? "")
      .split(/[\n,·]/)
      .map((p) => p.trim())
      .filter(Boolean),
    ogTitulo:
      lerLocalizado(dados, "ogTitulo") ?? DEFINICOES_OMISSAO.ogTitulo,
    ogDescricao:
      lerLocalizado(dados, "ogDescricao") ?? DEFINICOES_OMISSAO.ogDescricao,
    ogImagemId: lerRelacao(dados, "ogImagemId"),
    molduraImagemId: lerRelacao(dados, "molduraImagemId"),
    galeriaImagemId: lerRelacao(dados, "galeriaImagemId"),
    avisoTopo: lerLocalizado(dados, "avisoTopo"),
    inversaoHeroi: Math.min(
      100,
      Math.max(0, Number(lerTexto(dados, "inversaoHeroi") ?? 0) || 0),
    ),
  };

  await db
    .insert(definicoes)
    .values({ id: 1, valor })
    .onConflictDoUpdate({
      target: definicoes.id,
      set: { valor, actualizadoEm: new Date() },
    });

  await registar(sessao, "editou", "definicoes", "1");
  limparCache();
  redirect("/admin/definicoes?guardado=1");
}

// --------------------------------------------------------------------
// Pedidos
// --------------------------------------------------------------------

export async function actualizarPedido(id: string, dados: FormData) {
  await exigirSessao();

  const estado = String(dados.get("estado") ?? "novo");
  await db
    .update(pedidos)
    .set({
      estado: (["novo", "em_curso", "fechado"].includes(estado)
        ? estado
        : "novo") as "novo" | "em_curso" | "fechado",
      notaInterna: lerTexto(dados, "notaInterna"),
    })
    .where(eq(pedidos.id, id));

  revalidatePath("/admin/pedidos");
  redirect("/admin/pedidos");
}

export async function apagarPedido(id: string) {
  const sessao = await exigirSessao();
  await db.delete(pedidos).where(eq(pedidos.id, id));
  await registar(sessao, "apagou", "pedido", id);
  revalidatePath("/admin/pedidos");
  redirect("/admin/pedidos");
}

// --------------------------------------------------------------------
// Utilizadores (só administradores)
// --------------------------------------------------------------------

export async function guardarUtilizador(id: string | null, dados: FormData) {
  const sessao = await exigirAdministrador();

  const email = (lerTexto(dados, "email") ?? "").toLowerCase();
  const nome = lerTexto(dados, "nome") ?? email;
  const papel = dados.get("papel") === "administrador" ? "administrador" : "editor";
  const activo = lerBool(dados, "activo");
  const palavraPasse = String(dados.get("palavraPasse") ?? "");

  if (!email) redirect("/admin/utilizadores?erro=email");

  if (id) {
    const base = { email, nome, papel, activo } as const;
    // A palavra-passe só muda quando o campo vem preenchido.
    await db
      .update(utilizadores)
      .set(
        palavraPasse
          ? { ...base, palavraPasseHash: await baralhar(palavraPasse) }
          : base,
      )
      .where(eq(utilizadores.id, id));
    await registar(sessao, "editou", "utilizador", id, email);
  } else {
    if (palavraPasse.length < 12) {
      redirect("/admin/utilizadores?erro=palavra-passe-curta");
    }
    const [novo] = await db
      .insert(utilizadores)
      .values({
        email,
        nome,
        papel,
        activo,
        palavraPasseHash: await baralhar(palavraPasse),
      })
      .returning();
    await registar(sessao, "criou", "utilizador", novo.id, email);
  }

  redirect("/admin/utilizadores?guardado=1");
}

export async function apagarUtilizador(id: string) {
  const sessao = await exigirAdministrador();
  // Ninguém se apaga a si próprio: ficaria sem quem administra.
  if (sessao.id === id) redirect("/admin/utilizadores?erro=proprio");
  await db.delete(utilizadores).where(eq(utilizadores.id, id));
  await registar(sessao, "apagou", "utilizador", id);
  redirect("/admin/utilizadores");
}
