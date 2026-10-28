"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  ASPECTO_BOTAO_WHATSAPP,
  SOMBRA_BOTAO_WHATSAPP,
} from "@/components/BotaoWhatsApp";
import { Icone, type NomeIcone } from "@/components/Icones";
import {
  CorpoRodape,
  type ContactosRodape,
  type ParteRodape,
} from "@/components/Rodape";
import {
  CampoMedia,
  type MediaEscolhivel,
} from "@/components/admin/CampoMedia";
import { CampoEscala, CampoLocalizado } from "@/components/admin/Campos";
import type { Definicoes } from "@/lib/db/schema";
import { t, texto } from "@/lib/i18n";
import { urlMedia } from "@/lib/media/url";
import { cx } from "@/lib/utils";

/**
 * Os contactos da galeria e as outras definições do site, no backoffice.
 *
 * Como na ficha da obra, o dono da galeria queria ver o que está a
 * mudar. Por isso, aqui:
 * - os contactos vêm primeiro, cada um com o seu ícone e uma ajuda
 *   curta, e o rodapé do site aparece ao lado e muda enquanto se
 *   escreve, com o contacto em edição marcado a dourado;
 * - o resto vem agrupado pelo que faz, com o cartão de partilha
 *   desenhado, e o que raramente se mexe fechado em "Mais opções";
 * - a barra de baixo diz sempre o que está por guardar.
 *
 * Os campos são os de sempre, com os nomes de sempre (`whatsapp`,
 * `ogTitulo.pt`, `inversaoHeroi`...), e a acção `guardarDefinicoes` não
 * mudou. Para saber o que mudou lê-se o próprio formulário, em vez de
 * espelhar cada campo num estado: os campos traduzíveis, o cursor e as
 * fotografias já guardam o seu valor por dentro.
 */

/** Nomes dos campos como aparecem na barra de alterações, por esta ordem. */
const ROTULOS: Array<[string, string]> = [
  ["whatsapp", "WhatsApp"],
  ["email", "Email"],
  ["telefone", "Telefone"],
  ["instagram", "Instagram"],
  ["morada", "Onde estamos"],
  ["responsavel", "Responsável"],
  ["parceiros", "Parceiros"],
  ["ogTitulo", "Título de partilha"],
  ["ogDescricao", "Descrição de partilha"],
  ["molduraImagemId", "Fotografia das molduras"],
  ["galeriaImagemId", "Retrato dos art dealers"],
  ["inversaoHeroi", "Destaque do título na entrada"],
  ["ogImagemId", "Imagem de partilha"],
  ["avisoTopo", "Aviso no topo"],
];

/** O mesmo limite que a nota do campo dá. */
const LIMITE_DESCRICAO = 155;

type Valores = Record<string, string>;

/** Tudo o que o formulário enviaria agora, campo a campo. */
function ler(formulario: HTMLFormElement): Valores {
  const valores: Valores = {};
  new FormData(formulario).forEach((v, k) => {
    if (typeof v === "string") valores[k] = v;
  });
  return valores;
}

/** Lista os campos que mudaram, com a língua quando não é o português. */
function alteracoes(antes: Valores, agora: Valores): string[] {
  const nomes = new Set([...Object.keys(antes), ...Object.keys(agora)]);
  const lista: string[] = [];
  for (const [campo, rotulo] of ROTULOS) {
    for (const nome of nomes) {
      const [base, lingua] = nome.split(".");
      if (base !== campo || antes[nome] === agora[nome]) continue;
      lista.push(lingua && lingua !== "pt" ? `${rotulo} (${lingua.toUpperCase()})` : rotulo);
    }
  }
  return lista;
}

/** Os parceiros como a acção os guarda: um por linha, vírgula ou ponto. */
const parceiros = (v: string) =>
  v
    .split(/[\n,·]/)
    .map((p) => p.trim())
    .filter(Boolean);

export function EditorDefinicoes({
  definicoes: d,
  omissoes,
  imagens,
  biblioteca,
  mensagemWhatsApp,
  capaPartilha,
  endereco,
  ambiente,
  guardado,
  guardar,
}: {
  definicoes: Definicoes;
  /** O que a acção guarda quando um contacto obrigatório fica vazio. */
  omissoes: Pick<Definicoes, "email" | "telefone" | "whatsapp" | "instagram">;
  imagens: {
    og: MediaEscolhivel | null;
    moldura: MediaEscolhivel | null;
    galeria: MediaEscolhivel | null;
  };
  biblioteca: MediaEscolhivel[];
  /** A frase que o WhatsApp abre já escrita, em português. */
  mensagemWhatsApp: string;
  /** A fotografia que o cartão de partilha da entrada leva. */
  capaPartilha: string | null;
  /** O endereço público, sem o protocolo, como o cartão o mostra. */
  endereco: string;
  ambiente: string;
  guardado: boolean;
  guardar: (dados: FormData) => Promise<void>;
}) {
  const formulario = useRef<HTMLFormElement>(null);
  const aEnviar = useRef(false);
  // O que estava guardado, lido do formulário acabado de desenhar, e o
  // que lá está agora. Antes da primeira leitura valem as definições.
  const [inicial, setInicial] = useState<Valores | null>(null);
  const [valores, setValores] = useState<Valores | null>(null);
  const [foco, setFoco] = useState<ParteRodape | null>(null);
  // Desfazer volta a desenhar os campos com os valores de origem: os
  // traduzíveis, o cursor e as fotografias guardam a escolha por dentro.
  const [geracao, setGeracao] = useState(0);
  // As fotografias mudam um campo escondido, que não avisa ninguém.
  const [releitura, setReleitura] = useState(0);

  useLayoutEffect(() => {
    if (!formulario.current) return;
    const agora = ler(formulario.current);
    setInicial((i) => i ?? agora);
    setValores(agora);
  }, [geracao, releitura]);

  const mudancas = inicial && valores ? alteracoes(inicial, valores) : [];
  const porGuardar = mudancas.length > 0;

  // Sair com alterações por guardar pede confirmação, como na ficha da
  // obra: ao fechar o separador ou recarregar, e ao carregar num link
  // do painel, que muda de página sem o navegador perguntar nada.
  useEffect(() => {
    if (!porGuardar) return;
    const aoSair = (e: BeforeUnloadEvent) => {
      if (aEnviar.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    const aoClicar = (e: MouseEvent) => {
      if (aEnviar.current || e.defaultPrevented) return;
      const link = (e.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      if (link.target === "_blank" || link.origin !== location.origin) return;
      if (!window.confirm("Tem alterações por guardar. Sair sem guardar?")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", aoSair);
    document.addEventListener("click", aoClicar, true);
    return () => {
      window.removeEventListener("beforeunload", aoSair);
      document.removeEventListener("click", aoClicar, true);
    };
  }, [porGuardar]);

  const valor = (nome: string, omissao: string) => valores?.[nome] ?? omissao;

  // O rodapé com o que está escrito agora, limpo como a acção o limpa:
  // o WhatsApp só com algarismos, o Instagram sem o @, e os contactos
  // obrigatórios com o valor de origem quando ficam vazios.
  const whatsappEscrito = valor("whatsapp", d.whatsapp);
  const instagramEscrito = valor("instagram", d.instagram);
  const contactos: ContactosRodape = {
    whatsapp: whatsappEscrito.trim().replace(/[^0-9]/g, "") || omissoes.whatsapp,
    email: valor("email", d.email).trim() || omissoes.email,
    telefone: valor("telefone", d.telefone).trim() || omissoes.telefone,
    instagram: instagramEscrito.trim().replace(/^@/, "") || omissoes.instagram,
    morada: valor("morada", d.morada).trim(),
    responsavel: valor("responsavel", d.responsavel).trim(),
    parceiros: parceiros(valor("parceiros", d.parceiros.join("\n"))),
  };

  const ogTitulo = valor("ogTitulo.pt", texto(d.ogTitulo, "pt"));
  const ogDescricao = valor("ogDescricao.pt", texto(d.ogDescricao, "pt"));

  const desfazer = () => {
    setGeracao((g) => g + 1);
    setFoco(null);
  };

  // O foco de qualquer campo marca a parte correspondente do rodapé:
  // cada contacto diz qual é a sua em `data-parte`.
  const aoFocar = (e: React.FocusEvent<HTMLFormElement>) => {
    const parte = (e.target as HTMLElement).closest<HTMLElement>(
      "[data-parte]",
    )?.dataset.parte;
    setFoco((parte as ParteRodape | undefined) ?? null);
  };

  return (
    <form
      ref={formulario}
      action={guardar}
      onSubmit={() => {
        aEnviar.current = true;
      }}
      onInput={() => formulario.current && setValores(ler(formulario.current))}
      onFocus={aoFocar}
      onBlur={() => setFoco(null)}
      className="flex min-h-[calc(100dvh-56px)] flex-col lg:min-h-dvh"
    >
      <header className="flex flex-col gap-1.5 border-b border-adm-fio bg-adm-cartao px-6 py-[26px] lg:px-8">
        <h1
          className="titulo text-[clamp(24px,3vw,30px)]"
          style={{ fontStretch: "112%" }}
        >
          Contactos da galeria
        </h1>
        <p className="m-0 max-w-[70ch] text-[14px] text-adm-suave">
          Aparecem no rodapé de todas as páginas, nos Contactos, no botão
          do WhatsApp, nos botões de cada obra e na política de privacidade.
        </p>
      </header>

      <div key={geracao} className="flex flex-1 flex-col gap-14 px-6 pt-7 pb-14 lg:px-8">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <div className="flex min-w-0 flex-col">
            <CampoContacto
              nome="whatsapp"
              icone="whatsapp"
              rotulo="WhatsApp"
              ajuda="só números, com o 351 à frente"
              valor={d.whatsapp}
              inputMode="numeric"
              aviso={
                /[^0-9]/.test(whatsappEscrito.trim())
                  ? `Ao guardar fica ${contactos.whatsapp}.`
                  : undefined
              }
            />
            <CampoContacto
              nome="email"
              icone="email"
              rotulo="Email"
              ajuda="para onde chegam os pedidos"
              valor={d.email}
              tipo="email"
            />
            <CampoContacto
              nome="telefone"
              icone="telefone"
              rotulo="Telefone"
              ajuda="como deve aparecer escrito"
              valor={d.telefone}
              tipo="tel"
            />
            <CampoContacto
              nome="instagram"
              icone="instagram"
              rotulo="Instagram"
              ajuda="sem o @"
              valor={d.instagram}
              aviso={
                instagramEscrito.trim().startsWith("@")
                  ? "O @ sai ao guardar: o site já o põe."
                  : undefined
              }
            />
            <CampoContacto
              nome="morada"
              icone="morada"
              rotulo="Onde estamos"
              ajuda="cidade ou morada"
              valor={d.morada}
            />

            <h2 className="titulo mt-9 mb-4 text-[22px]">Também no rodapé</h2>
            <div className="flex flex-col gap-5">
              <div data-parte="responsavel" className="flex flex-col">
                <label className="adm-rotulo" htmlFor="responsavel">
                  Responsável
                </label>
                <input id="responsavel" name="responsavel" defaultValue={d.responsavel} />
                <span className="mt-1.5 text-[13px] text-adm-suave">
                  Por baixo da morada. Vazio não mostra nada.
                </span>
              </div>
              <div data-parte="parceiros" className="flex flex-col">
                <label className="adm-rotulo" htmlFor="parceiros">
                  Parceiros
                </label>
                <textarea
                  id="parceiros"
                  name="parceiros"
                  rows={3}
                  defaultValue={d.parceiros.join("\n")}
                />
                <span className="mt-1.5 text-[13px] text-adm-suave">
                  Um por linha. Aparecem na última linha do rodapé.
                </span>
              </div>
            </div>
          </div>

          <aside
            aria-label="Pré-visualização do rodapé"
            className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-6"
          >
            <span className="text-[11px] tracking-[0.16em] text-adm-suave uppercase">
              Assim fica o rodapé
            </span>
            {/* Em ecrã largo tem a altura da janela e faz scroll por
                dentro. O conteúdo não se carrega (`inert`), por isso é
                a própria caixa que recebe o Tab, para se poder rolar
                com o teclado. */}
            <div
              tabIndex={0}
              className="previa-site @container border border-adm-fio bg-tinta p-6 text-papel lg:max-h-[calc(100dvh-260px)] lg:overflow-y-auto"
            >
              <div inert>
                <CorpoRodape
                  idioma="pt"
                  definicoes={contactos}
                  mensagemWhatsApp={mensagemWhatsApp}
                  marcado={foco}
                  nivelTitulo="p"
                  classeTitulo="uppercase text-[length:clamp(32px,9cqi,72px)] leading-[0.9]"
                  surge={false}
                />
                {/* O botão flutuante. Em ecrã largo fica preso ao canto
                    da caixa enquanto o rodapé passa por baixo, como no
                    site; no telemóvel fica no fim, para não tapar a
                    barra de guardar. */}
                <div className="mt-8 flex justify-end lg:sticky lg:bottom-0">
                  <span
                    className={cx(
                      ASPECTO_BOTAO_WHATSAPP,
                      foco === "whatsapp" && "outline-2 outline-offset-4 outline-ouro",
                    )}
                    style={{ boxShadow: SOMBRA_BOTAO_WHATSAPP }}
                  >
                    {t("acao.whatsapp", "pt")}
                  </span>
                </div>
              </div>
            </div>
            <p className="m-0 text-[13px] text-adm-suave">
              O contacto em que está a escrever fica marcado a dourado.
            </p>
          </aside>
        </div>

        <section className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <h2 className="titulo text-[22px]">Quando alguém partilha o site</h2>
            <p className="m-0 max-w-[70ch] text-[14px] text-adm-suave">
              O cartão que aparece no WhatsApp, no Facebook ou no LinkedIn
              quando alguém manda o endereço da entrada.
            </p>
          </div>
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
            <div className="flex min-w-0 flex-col gap-5">
              <CampoLocalizado
                nome="ogTitulo"
                rotulo="Título de partilha"
                valor={d.ogTitulo}
                nota="Também é o nome da entrada no separador do navegador e no Google."
              />
              <CampoLocalizado
                nome="ogDescricao"
                rotulo="Descrição de partilha"
                valor={d.ogDescricao}
                linhas={3}
                nota={`Até ${LIMITE_DESCRICAO} caracteres, para não ficar cortada.`}
              />
            </div>
            <CartaoPartilha
              titulo={ogTitulo}
              descricao={ogDescricao}
              capa={capaPartilha}
              endereco={endereco}
            />
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <h2 className="titulo text-[22px]">Fotografias das páginas fixas</h2>
            <p className="m-0 max-w-[70ch] text-[14px] text-adm-suave">
              Não pertencem a uma obra nem a um lugar. Sem elas, o site
              mostra um marcador vazio do tamanho certo.
            </p>
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            <CampoMedia
              nome="molduraImagemId"
              rotulo="Fotografia das molduras"
              valor={imagens.moldura}
              biblioteca={biblioteca}
              nota="Aparece na entrada e na página das molduras."
              aoMudar={() => setReleitura((r) => r + 1)}
            />
            <CampoMedia
              nome="galeriaImagemId"
              rotulo="Retrato dos art dealers"
              valor={imagens.galeria}
              biblioteca={biblioteca}
              nota="Aparece na entrada e na página A galeria."
              aoMudar={() => setReleitura((r) => r + 1)}
            />
          </div>
        </section>

        <details className="group border-t border-adm-fio pt-2">
          <summary className="flex min-h-11 cursor-pointer items-center gap-2 text-[15px]">
            <span aria-hidden="true" className="inline-block w-3 group-open:rotate-90">
              ›
            </span>
            Mais opções: destaque do título na entrada, imagem de partilha e
            aviso no topo
          </summary>

          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <CampoEscala
              nome="inversaoHeroi"
              rotulo="Destaque do título na entrada"
              valor={d.inversaoHeroi ?? 0}
              legendas={["fundido na fotografia", "destacado"]}
              nota="O título da entrada é desenhado com o inverso da fotografia que tem por baixo, e por isso funde-se com ela. Em zero fica o desenho original. Subir escurece e satura a fotografia só na faixa do título, o que separa as letras sem lhes tirar a cor. Sobre capas claras e movimentadas, 70 costuma chegar."
              largo
            />

            <CampoMedia
              nome="ogImagemId"
              rotulo="Imagem de partilha"
              valor={imagens.og}
              biblioteca={biblioteca}
              nota="Fica guardada, mas o site ainda não a usa: o cartão de partilha da entrada leva a fotografia da exposição em destaque."
              largo
              aoMudar={() => setReleitura((r) => r + 1)}
            />

            <CampoLocalizado
              nome="avisoTopo"
              rotulo="Aviso no topo do site"
              valor={d.avisoTopo}
              nota="Fica guardado, mas o site ainda não o mostra em página nenhuma."
              largo
            />

            <p className="m-0 text-[13px] text-adm-suave sm:col-span-2">
              Ambiente actual: <strong>{ambiente}</strong>. Endereço público:{" "}
              <strong>{endereco}</strong>.
            </p>
          </div>
        </details>
      </div>

      {/* A barra de baixo diz sempre em que pé se está. */}
      <div className="sticky bottom-0 z-20 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-adm-fio-forte bg-adm-cartao px-6 py-3.5 lg:px-8">
        {porGuardar ? (
          <p
            role="status"
            className="m-0 flex min-w-0 flex-1 basis-64 items-baseline gap-2.5 text-[14px]"
          >
            <span aria-hidden="true" className="inline-block size-2.5 shrink-0 bg-ouro" />
            <span>
              <strong className="font-semibold">
                {mudancas.length === 1
                  ? "1 alteração por guardar:"
                  : `${mudancas.length} alterações por guardar:`}
              </strong>{" "}
              {mudancas.join(", ")}
            </span>
          </p>
        ) : (
          <p role="status" className="m-0 min-w-0 flex-1 basis-64 text-[14px] text-adm-suave">
            {guardado ? "Definições guardadas. " : "Tudo guardado. "}O que vê no
            rodapé ao lado é o que está no site.
          </p>
        )}
        <div className="flex flex-wrap gap-2.5">
          {porGuardar && (
            <button type="button" onClick={desfazer} className="adm-botao adm-botao-linha">
              Desfazer
            </button>
          )}
          <BotaoGuardar />
        </div>
      </div>
    </form>
  );
}

/**
 * Um contacto: o ícone que o site lhe põe à frente, o nome, uma ajuda
 * curta ao lado do nome, e o campo. A ajuda é lida com o campo.
 */
function CampoContacto({
  nome,
  icone,
  rotulo,
  ajuda,
  valor,
  tipo = "text",
  inputMode,
  aviso,
}: {
  nome: ParteRodape;
  icone: NomeIcone;
  rotulo: string;
  ajuda: string;
  valor: string;
  tipo?: "text" | "email" | "tel";
  inputMode?: "numeric";
  /** O que vai acontecer ao valor escrito quando se guardar. */
  aviso?: string;
}) {
  return (
    <div
      data-parte={nome}
      className="flex items-start gap-4 border-b border-adm-fio py-3.5"
    >
      <span
        aria-hidden="true"
        className="mt-[22px] flex size-11 shrink-0 items-center justify-center bg-tinta text-[20px] text-papel"
      >
        <Icone nome={icone} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-1.5 flex flex-wrap items-baseline gap-x-2">
          <label className="adm-rotulo mb-0" htmlFor={nome}>
            {rotulo}
          </label>
          <span id={`ajuda-${nome}`} className="text-[13px] text-adm-suave">
            {ajuda}
          </span>
        </div>
        <input
          id={nome}
          name={nome}
          type={tipo}
          inputMode={inputMode}
          defaultValue={valor}
          aria-describedby={`ajuda-${nome}${aviso ? ` aviso-${nome}` : ""}`}
        />
        {aviso && (
          <span id={`aviso-${nome}`} className="mt-1.5 text-[13px]">
            {aviso}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * O cartão que uma conversa mostra quando recebe o endereço da
 * entrada: a imagem composta pelo site (fotografia à esquerda, título
 * à direita) e, por baixo, o título, a descrição e o endereço.
 */
function CartaoPartilha({
  titulo,
  descricao,
  capa,
  endereco,
}: {
  titulo: string;
  descricao: string;
  capa: string | null;
  endereco: string;
}) {
  const url = urlMedia(capa);
  const comprida = descricao.length > LIMITE_DESCRICAO;
  // O corpo que o cartão composto dá ao título (54, 68 ou 84px em
  // 1200), aqui em fracção da largura da caixa.
  const linha = titulo.slice(0, 90);
  const corpo = (linha.length > 46 ? 54 : linha.length > 28 ? 68 : 84) / 12;

  return (
    <aside aria-label="Pré-visualização do cartão de partilha" className="flex min-w-0 flex-col gap-3">
      <span className="text-[11px] tracking-[0.16em] text-adm-suave uppercase">
        Assim aparece numa conversa · em português
      </span>
      <div className="max-w-[520px] border border-adm-fio bg-white">
        <div className="@container flex aspect-[1200/630] bg-tinta text-papel">
          {url && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={url} alt="" className="h-full w-[39%] object-cover" />
          )}
          <div className="flex min-w-0 flex-1 flex-col justify-between p-[5cqi]">
            <span className="text-[length:1.8cqi] tracking-[0.3em] uppercase">Contagiarte®</span>
            <span
              className="titulo leading-[1.04]"
              style={{ fontSize: `${corpo}cqi` }}
            >
              {linha}
            </span>
            <span className="flex items-center gap-[1.3cqi] text-[length:1.7cqi] text-claro-65">
              <span className="inline-block h-px w-[4.6cqi] bg-ouro" />
              Arte contemporânea, Porto e Douro
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1 px-4 py-3">
          <span className="text-[12px] text-adm-suave">{endereco}</span>
          <span className="text-[15px] font-semibold">{titulo}</span>
          <span className="line-clamp-2 text-[14px] text-adm-suave">{descricao}</span>
        </div>
      </div>
      <p className={cx("m-0 text-[13px]", !comprida && "text-adm-suave")}>
        Descrição com {descricao.length} de {LIMITE_DESCRICAO} caracteres
        {comprida ? ": vai aparecer cortada." : "."} A fotografia é a da
        exposição em destaque.
      </p>
    </aside>
  );
}

/** Enquanto a acção corre, o botão diz que está a guardar. */
function BotaoGuardar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="adm-botao">
      {pending ? "A guardar…" : "Guardar e publicar"}
    </button>
  );
}
