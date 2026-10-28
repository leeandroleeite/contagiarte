import { eq } from "drizzle-orm";
import Link from "next/link";
import { Aviso, Conteudo } from "@/components/admin/Pecas";
import { levantarLacunas } from "@/lib/admin/lacunas";
import {
  tarefasDaSemana,
  ultimasAlteracoes,
  type Alteracao,
  type Tarefa,
} from "@/lib/admin/painel";
import { exigirSessao } from "@/lib/auth";
import { exposicaoEmDestaque, situacao } from "@/lib/dados";
import { db } from "@/lib/db";
import { pedidos, subscritores } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { texto } from "@/lib/i18n";
import { urlMedia } from "@/lib/media/url";
import { cx } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * O painel, pensado para quem gere a galeria e não para quem fez o
 * site. Antes era uma fila de números e uma lista de faltas; agora
 * responde, por esta ordem, ao que se pergunta ao entrar: o que é que
 * o visitante está a ver, o que vale a pena tratar esta semana, como
 * se faz o habitual, e o que mudou desde a última vez.
 */

const LISBOA = "Europe/Lisbon";

/** Bom dia até ao almoço, boa tarde até ao jantar, como se diz cá. */
function saudacao(agora: Date): string {
  const hora = Number(
    new Intl.DateTimeFormat("pt-PT", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: LISBOA,
    }).format(agora),
  );
  if (hora >= 6 && hora < 13) return "Bom dia";
  if (hora >= 13 && hora < 20) return "Boa tarde";
  return "Boa noite";
}

/** O dia em Lisboa, como AAAA-MM-DD, para comparar "hoje" e "ontem". */
const diaEmLisboa = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: LISBOA }).format(d);

function quando(d: Date, agora: Date): string {
  const dia = diaEmLisboa(d);
  if (dia === diaEmLisboa(agora)) return "hoje";
  if (dia === diaEmLisboa(new Date(agora.getTime() - 864e5))) return "ontem";
  return new Intl.DateTimeFormat("pt-PT", {
    day: "numeric",
    month: "short",
    timeZone: LISBOA,
  }).format(d);
}

/** "2026-12-31" para "31 de dezembro". As datas da base não têm hora. */
const dataLonga = (iso: string) =>
  new Intl.DateTimeFormat("pt-PT", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${iso}T12:00:00Z`));

export default async function Painel({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const [
    sessao,
    destaque,
    pedidosNovos,
    subscritoresActivos,
    lacunas,
    alteracoes,
  ] = await Promise.all([
    exigirSessao(),
    exposicaoEmDestaque(),
    db.$count(pedidos, eq(pedidos.estado, "novo")),
    db.$count(subscritores, eq(subscritores.estado, "activo")),
    levantarLacunas(),
    ultimasAlteracoes(),
  ]);
  const tarefas = await tarefasDaSemana(lacunas);

  const agora = new Date();
  const nome = sessao.nome.split(/\s+/)[0];
  const hoje = new Intl.DateTimeFormat("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: LISBOA,
  })
    .format(agora)
    .replace("-feira", "");

  const porFazer: string[] = [];
  if (!env.r2.configurado) {
    porFazer.push(
      "O armazenamento R2 ainda não está configurado: não é possível carregar fotografias nem PDFs.",
    );
  }
  if (!env.email.configurado) {
    porFazer.push(
      "Não há serviço de email configurado: os pedidos ficam guardados aqui, mas não chega aviso à caixa de correio.",
    );
  }

  // A frase de cima diz quantas coisas há, sem as listar: o resto da
  // página é que as mostra.
  const resumo: string[] = [];
  if (pedidosNovos > 0) {
    resumo.push(
      pedidosNovos === 1
        ? "Há 1 pedido por ver"
        : `Há ${pedidosNovos} pedidos por ver`,
    );
  }
  if (tarefas.length > 0) {
    const coisas =
      tarefas.length === 1
        ? "1 coisa que deixava o site melhor"
        : `${tarefas.length} coisas que deixavam o site melhor`;
    resumo.push(resumo.length ? coisas : `Há ${coisas}`);
  }
  const frase =
    resumo.length > 0
      ? `${resumo.join(" e ")}.`
      : "Está tudo em dia. Não há nada por tratar.";

  const destacadas = tarefas.slice(0, 3);

  return (
    <Conteudo>
      <div className="flex max-w-[1208px] flex-col gap-9">
        <header className="flex flex-wrap items-end justify-between gap-5">
          <div className="flex flex-col gap-2">
            <span className="text-[11px] tracking-[0.2em] text-adm-suave uppercase">
              {hoje}
            </span>
            <h1 className="titulo text-[clamp(32px,4vw,44px)] leading-none">
              {saudacao(agora)}
              {nome ? `, ${nome}` : ""}.
            </h1>
            <p className="m-0 text-[16px] text-escuro-78">{frase}</p>
          </div>
          <Link
            href="/"
            target="_blank"
            rel="noopener"
            className="adm-botao adm-botao-linha no-underline"
          >
            Ver o site <span aria-hidden="true">↗</span>
          </Link>
        </header>

        {erro === "sem-permissao" && (
          <Aviso tom="erro">
            Essa parte do backoffice é só para administradores.
          </Aviso>
        )}

        {porFazer.length > 0 && (
          // Avisos para quem instala, não para quem gere: ficam
          // discretos, mas à vista, para ninguém estranhar o porquê.
          <ul className="-mt-4 flex flex-col gap-1 text-[13px] text-adm-suave">
            {porFazer.map((p) => (
              <li key={p} className="flex items-baseline gap-2.5">
                <span aria-hidden="true" className="inline-block size-1.5 shrink-0 bg-ouro" />
                {p}
              </li>
            ))}
          </ul>
        )}

        {/* O que está à porta --------------------------------------- */}
        <section
          aria-labelledby="t-site"
          className="grid grid-cols-1 gap-4 lg:grid-cols-3"
        >
          <h2
            id="t-site"
            className="text-[11px] font-medium tracking-[0.2em] text-adm-suave uppercase lg:col-span-3"
          >
            O que o visitante vê agora
          </h2>
          <Destaque expo={destaque} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <Numero
              rotulo="Pedidos novos"
              valor={pedidosNovos}
              href="/admin/pedidos"
              nota={
                pedidosNovos > 0
                  ? "À espera de resposta. Abra para ver quem escreveu."
                  : env.email.configurado
                    ? "Quando alguém escrever pelo site, aparece aqui e no email."
                    : "Quando alguém escrever pelo site, aparece aqui."
              }
            />
            <Numero
              rotulo="Subscritores da newsletter"
              valor={subscritoresActivos}
              href="/admin/pedidos"
              nota="Quem pediu para receber as novidades da galeria."
            />
          </div>
        </section>

        {/* Para esta semana ---------------------------------------- */}
        <section aria-labelledby="t-falta" className="flex flex-col gap-3.5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="t-falta" className="titulo-med text-[24px]">
              Para esta semana
            </h2>
            {tarefas.length > 0 && (
              <span className="text-[13px] text-adm-suave">
                Ordenado pelo que mais se nota no site
              </span>
            )}
          </div>

          {tarefas.length === 0 ? (
            <p className="border border-adm-fio bg-adm-cartao p-5 text-[15px] text-adm-suave">
              Nada. Todas as fichas publicadas estão completas.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {destacadas.map((t, i) => (
                <CartaoTarefa key={t.id} tarefa={t} primeira={i === 0} />
              ))}
            </div>
          )}

          {tarefas.length > 0 && (
            <details id="tudo-o-que-falta" className="group border-t border-adm-fio pt-1">
              <summary className="flex min-h-11 cursor-pointer items-center gap-2 text-[14px]">
                <span aria-hidden="true" className="inline-block w-3 group-open:rotate-90">
                  ›
                </span>
                Ver tudo o que falta
                {tarefas.length > destacadas.length &&
                  ` (mais ${tarefas.length - destacadas.length} ${
                    tarefas.length - destacadas.length === 1 ? "assunto" : "assuntos"
                  })`}
              </summary>
              <div className="mt-3 flex flex-col gap-6">
                {tarefas.length > destacadas.length && (
                  <ul className="flex flex-col border-t border-adm-fio">
                    {tarefas.slice(destacadas.length).map((t) => (
                      <li
                        key={t.id}
                        className="flex flex-wrap items-baseline gap-x-3 border-b border-adm-fio py-2.5"
                      >
                        <Link href={t.accao.href} className="font-medium">
                          {t.titulo}
                        </Link>
                        <span className="text-[14px] text-adm-suave">{t.efeito}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <OQueFalta {...lacunas} />
              </div>
            </details>
          )}
        </section>

        {/* Fazer agora --------------------------------------------- */}
        <section aria-labelledby="t-atalhos" className="flex flex-col gap-3.5">
          <h2
            id="t-atalhos"
            className="text-[11px] font-medium tracking-[0.2em] text-adm-suave uppercase"
          >
            Fazer agora
          </h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Atalho href="/admin/obras/novo" marca="+" escuro>
              Acrescentar obra
            </Atalho>
            <Atalho href="/admin/exposicoes/novo" marca="+">
              Nova exposição
            </Atalho>
            <Atalho href="/admin/textos" marca="Aa">
              Mudar um texto do site
            </Atalho>
            <Atalho href="/admin/definicoes" marca="☏">
              Telefone e email
            </Atalho>
          </div>
        </section>

        {/* Últimas alterações -------------------------------------- */}
        <section aria-labelledby="t-recente" className="flex flex-col">
          <h2
            id="t-recente"
            className="mb-3.5 text-[11px] font-medium tracking-[0.2em] text-adm-suave uppercase"
          >
            Últimas alterações
          </h2>
          {alteracoes.length === 0 ? (
            <p className="text-[15px] text-adm-suave">
              Ainda ninguém mudou nada pelo backoffice.
            </p>
          ) : (
            <ul className="flex flex-col border-b border-adm-fio">
              {alteracoes.map((a) => (
                <LinhaAlteracao key={a.id} alteracao={a} agora={agora} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </Conteudo>
  );
}

// --------------------------------------------------------------------
// Peças
// --------------------------------------------------------------------

type ExposicaoDestaque = Awaited<ReturnType<typeof exposicaoEmDestaque>>;

/**
 * A exposição que abre o site, como o visitante a vê: a capa, o título
 * por cima, e onde e até quando. É o que `exposicaoEmDestaque` devolve
 * à homepage, por isso não há maneira de os dois discordarem.
 */
function Destaque({ expo }: { expo: ExposicaoDestaque }) {
  if (!expo) {
    return (
      <div className="flex min-h-[260px] flex-col justify-end gap-3 bg-tinta p-7 text-papel lg:col-span-2">
        <span className="text-[11px] tracking-[0.2em] text-claro-80 uppercase">
          Entrada
        </span>
        <p className="m-0 max-w-[48ch] text-[15px] text-claro-80">
          Nenhuma exposição está em destaque: a entrada do site abre só com
          a frase grande, sem fotografia.
        </p>
        <Link
          href="/admin/exposicoes"
          className="self-start bg-papel px-3.5 py-2.5 text-[12px] tracking-[0.14em] text-tinta uppercase no-underline hover:bg-ouro hover:text-tinta"
        >
          Escolher uma exposição
        </Link>
      </div>
    );
  }

  const fase = situacao(expo);
  const quandoExpo =
    fase === "permanente"
      ? "permanente"
      : fase === "proxima" && expo.dataInicio
        ? `a partir de ${dataLonga(expo.dataInicio)}`
        : fase === "arquivo" && expo.dataFim
          ? `terminou a ${dataLonga(expo.dataFim)}`
          : expo.dataFim
            ? `até ${dataLonga(expo.dataFim)}`
            : expo.dataInicio
              ? `desde ${dataLonga(expo.dataInicio)}`
              : null;
  const etiqueta = {
    em_curso: "Em cartaz",
    permanente: "Permanente",
    proxima: "Brevemente",
    arquivo: "Já terminou",
  }[fase];
  const capa = urlMedia(expo.imagem?.chave);

  return (
    <div className="relative flex min-h-[260px] overflow-hidden bg-tinta lg:col-span-2">
      {capa && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={capa}
          alt=""
          className="absolute inset-0 size-full object-cover opacity-55"
        />
      )}
      <div className="relative mt-auto flex flex-col gap-2 px-7 pt-16 pb-6 text-papel">
        <span className="text-[11px] tracking-[0.2em] text-claro-80 uppercase">
          Entrada · {etiqueta}
        </span>
        <span className="titulo text-[clamp(26px,3vw,34px)] leading-none uppercase">
          {texto(expo.titulo, "pt")}
        </span>
        <span className="text-[14px] text-claro-80">
          {[expo.lugar?.nome, quandoExpo].filter(Boolean).join(" · ")}
        </span>
        {fase === "arquivo" && (
          <span className="text-[13px] text-erro-claro">
            A entrada continua a mostrá-la. Vale a pena pôr outra em destaque.
          </span>
        )}
        {!capa && (
          <span className="text-[13px] text-claro-65">
            Sem capa: a entrada abre com um marcador no lugar da fotografia.
          </span>
        )}
      </div>
      <Link
        href={`/admin/exposicoes/${expo.id}`}
        className="absolute top-[18px] right-[18px] bg-papel px-3.5 py-2.5 text-[12px] tracking-[0.14em] text-tinta uppercase no-underline hover:bg-ouro hover:text-tinta"
      >
        Editar destaque
      </Link>
    </div>
  );
}

function Numero({
  rotulo,
  valor,
  href,
  nota,
}: {
  rotulo: string;
  valor: number;
  href: string;
  nota: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-1 flex-col gap-1.5 border border-adm-fio bg-adm-cartao p-5 no-underline hover:border-adm-fio-forte hover:text-tinta"
    >
      <span className="text-[11px] tracking-[0.2em] text-adm-suave uppercase">
        {rotulo}
      </span>
      <span className="titulo text-[40px] leading-none">{valor}</span>
      <span className="text-[13px] text-adm-suave">{nota}</span>
    </Link>
  );
}

/**
 * Um cartão de "Para esta semana": de que se trata, à vista, e uma
 * frase sobre o que muda no site. As miniaturas abrem cada ficha; o
 * link de baixo trata de todas.
 */
function CartaoTarefa({
  tarefa: t,
  primeira,
}: {
  tarefa: Tarefa;
  primeira: boolean;
}) {
  return (
    <article
      data-tarefa={t.id}
      className="flex flex-col border border-adm-fio bg-adm-cartao"
    >
      <FaixaTarefa tarefa={t} />
      <div className="flex flex-1 flex-col gap-2 px-5 pt-[18px] pb-5">
        <span
          className={cx(
            "text-[11px] tracking-[0.2em] uppercase",
            primeira ? "text-erro" : "text-adm-suave",
          )}
        >
          {primeira ? "Mais visível" : t.onde}
        </span>
        <h3 className="text-[17px] font-semibold">{t.titulo}</h3>
        <p className="m-0 text-[14px] leading-[1.5] text-escuro-78">
          {t.efeito}
        </p>
        <Link
          href={t.accao.href}
          className="mt-auto self-start pt-2 text-[13px] tracking-[0.12em] uppercase"
        >
          {t.accao.rotulo} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

function FaixaTarefa({ tarefa: t }: { tarefa: Tarefa }) {
  if (t.linguas) {
    return (
      <div className="flex h-[110px] flex-wrap content-center items-center gap-2.5 bg-tinta-elevada px-[18px]">
        {(["pt", "en", "es"] as const).map((l) => (
          <span
            key={l}
            className={cx(
              "px-2.5 py-1.5 text-[11px] tracking-[0.14em] uppercase",
              t.linguas![l] === 100
                ? "bg-papel text-tinta"
                : "border border-fio-controlo text-papel",
            )}
          >
            {l} {t.linguas![l]}%
          </span>
        ))}
      </div>
    );
  }

  if (t.miniaturas.length === 0) {
    return (
      <div
        aria-hidden="true"
        className="flex h-[110px] items-center bg-tinta-elevada px-[18px] text-papel"
      >
        <span className="titulo text-[44px]">{t.vazio}</span>
      </div>
    );
  }

  const casas = t.miniaturas.length + (t.resto > 0 ? 1 : 0);
  return (
    <div
      className="grid h-[110px] gap-0.5 bg-tinta"
      style={{ gridTemplateColumns: `repeat(${casas}, minmax(0, 1fr))` }}
    >
      {t.miniaturas.map((m) => (
        <Link
          key={m.href + m.nome}
          href={m.href}
          aria-label={m.nome}
          title={m.nome}
          className="relative flex items-center justify-center overflow-hidden bg-tinta-elevada text-[10px] tracking-[0.14em] text-claro-55 uppercase no-underline hover:text-papel"
        >
          {m.url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={m.url} alt="" className="size-full object-cover" />
          ) : (
            t.vazio
          )}
        </Link>
      ))}
      {t.resto > 0 && (
        <Link
          href={t.accao.href}
          aria-label={`Mais ${t.resto}`}
          className="flex items-center justify-center bg-tinta-elevada text-[14px] text-papel no-underline hover:text-ouro"
        >
          +{t.resto}
        </Link>
      )}
    </div>
  );
}

function Atalho({
  href,
  marca,
  escuro = false,
  children,
}: {
  href: string;
  marca: string;
  escuro?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cx(
        "flex min-h-[88px] flex-col justify-between gap-3 border p-[18px] no-underline",
        escuro
          ? "border-tinta bg-tinta text-papel hover:border-ouro hover:bg-ouro hover:text-tinta"
          : "border-adm-fio-forte hover:border-tinta hover:text-tinta",
      )}
    >
      <span aria-hidden="true" className="text-[22px] leading-none">
        {marca}
      </span>
      <span className="text-[15px]">{children}</span>
    </Link>
  );
}

function LinhaAlteracao({
  alteracao: a,
  agora,
}: {
  alteracao: Alteracao;
  agora: Date;
}) {
  return (
    <li className="flex items-center gap-3.5 border-t border-adm-fio py-3 text-[14px]">
      {a.url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={a.url} alt="" className="size-11 shrink-0 object-cover" />
      ) : (
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center bg-tinta-elevada text-[11px] text-papel"
        >
          {a.marca}
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-4">
        <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
          {a.frase}
          {a.nome && " "}
          {a.nome &&
            (a.href ? (
              <Link href={a.href} className="font-semibold">
                {a.nome}
              </Link>
            ) : (
              <strong className="font-semibold">{a.nome}</strong>
            ))}
        </span>
        <span className="shrink-0 text-[13px] text-adm-suave">
          <time
            dateTime={a.quando.toISOString()}
            title={new Intl.DateTimeFormat("pt-PT", {
              dateStyle: "long",
              timeStyle: "short",
              timeZone: LISBOA,
            }).format(a.quando)}
          >
            {quando(a.quando, agora)}
          </time>{" "}
          · {a.quem}
        </span>
      </div>
    </li>
  );
}

/**
 * A lista completa do que falta, com o nome de cada coisa e o caminho
 * para a corrigir. Fica por baixo dos cartões, fechada: os cartões
 * dizem por onde começar, esta diz tudo.
 */
function OQueFalta({
  lista,
  mediaSemDescricao,
  totalMedia,
  provisorios,
  traducoes,
}: Awaited<ReturnType<typeof levantarLacunas>>) {
  const semTraducao = Math.max(traducoes.en, traducoes.es);

  const grupos = new Map<string, typeof lista>();
  for (const l of lista) {
    grupos.set(l.grupo, [...(grupos.get(l.grupo) ?? []), l]);
  }

  return (
    <div className="border border-adm-fio bg-adm-cartao p-5">
      <p className="mb-5 text-[14px] text-adm-suave">
        {lista.length} ficha(s) publicada(s) por completar. Só conta o que já
        está no site: um rascunho por acabar é um rascunho.
      </p>

      {[...grupos.entries()].map(([grupo, itens]) => {
        // A explicação é a mesma para todos os itens com a mesma
        // falha. Repetida doze vezes seguidas deixa de se ler, por
        // isso vai uma vez no topo do grupo.
        const porques = [...new Set(itens.map((l) => l.porque).filter(Boolean))];
        return (
          <section key={grupo} className="mb-5 last:mb-0">
            <h3 className="mb-2 text-[11px] tracking-[0.2em] text-adm-suave uppercase">
              {grupo} · {itens.length}
            </h3>
            {porques.map((p) => (
              <p key={p} className="mb-2 text-[13px] text-adm-suave">
                {p}
              </p>
            ))}
            <ul className="flex flex-col border-t border-adm-fio">
              {itens.map((l) => (
                <li
                  key={l.href + l.nome}
                  className="flex flex-wrap items-baseline gap-x-3 border-b border-adm-fio py-2.5"
                >
                  <Link href={l.href} className="font-medium">
                    {l.nome}
                  </Link>
                  <span className="text-[14px] text-adm-suave">
                    falta {l.falta.join(", ")}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {provisorios.length > 0 && (
        <section className="mb-5">
          <h3 className="mb-2 text-[11px] tracking-[0.2em] text-adm-suave uppercase">
            Textos provisórios · {provisorios.length}
          </h3>
          <p className="mb-2 text-[13px] text-adm-suave">
            Escritos durante o desenho, à espera da versão da galeria. Estão
            no site como se fossem definitivos.
          </p>
          <ul className="flex flex-col border-t border-adm-fio">
            {provisorios.map((t) => (
              <li
                key={t.chave}
                className="flex flex-wrap items-baseline gap-x-3 border-b border-adm-fio py-2.5"
              >
                <Link href="/admin/textos" className="font-medium">
                  {t.chave}
                </Link>
                {t.nota && (
                  <span className="text-[14px] text-adm-suave">{t.nota}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {semTraducao > 0 && (
        <section className="mb-5">
          <h3 className="mb-2 text-[11px] tracking-[0.2em] text-adm-suave uppercase">
            Traduções · {semTraducao}
          </h3>
          {/* Sem esta conta, uma página inglesa abre cheia de frases
              portuguesas e parece completa: o texto() cai para o
              português quando falta o resto, por isso nada aparece
              vazio. Os títulos das obras e os nomes não entram aqui,
              porque não se traduzem. */}
          <p className="mb-2 text-[13px] text-adm-suave">
            {traducoes.total - traducoes.en} de {traducoes.total} campos em
            inglês, {traducoes.total - traducoes.es} em espanhol. O que falta
            aparece no site em português, sem avisar ninguém.
          </p>
          <ul className="flex flex-col border-t border-adm-fio">
            {traducoes.onde.map((t) => (
              <li
                key={t.href + t.nome}
                className="flex flex-wrap items-baseline gap-x-3 border-b border-adm-fio py-2.5"
              >
                <Link href={t.href} className="font-medium">
                  {t.nome}
                </Link>
                <span className="text-[14px] text-adm-suave">
                  {t.grupo} · {t.campos.join(", ")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {mediaSemDescricao > 0 && (
        <p className="mt-5 text-[14px] text-adm-suave">
          <Link href="/admin/media">{mediaSemDescricao}</Link> de {totalMedia}{" "}
          ficheiros da mediateca sem descrição. Sem ela não se encontram pela
          pesquisa, e um leitor de ecrã não os sabe anunciar.
        </p>
      )}
    </div>
  );
}
