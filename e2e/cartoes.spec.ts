import { expect, test, type APIResponse } from "@playwright/test";

/**
 * Cartões de partilha.
 *
 * O `/og` compõe a imagem que aparece quando alguém deita um endereço
 * do site no WhatsApp ou no LinkedIn. Aceitou texto livre durante algum
 * tempo, e com isso qualquer pessoa punha a frase que quisesse debaixo
 * da marca "Contagiarte®" e partilhava o resultado como se tivesse
 * saído da galeria. Agora só aceita identificadores, e o que o cartão
 * diz vem da base de dados.
 */

/** Os caminhos públicos e o identificador que cada um deve pedir. */
const PAGINAS: Array<[caminho: string, identificador: string]> = [
  ["/", "pagina=inicio"],
  ["/exposicoes", "pagina=exposicoes"],
  ["/exposicoes/a-pele-da-terra", "exposicao=a-pele-da-terra"],
  ["/exposicoes/a-pele-da-terra/percurso", "percurso=a-pele-da-terra"],
  ["/obras", "pagina=obras"],
  ["/obras/wonder-frida", "obra=wonder-frida"],
  ["/artistas", "pagina=artistas"],
  ["/artistas/mario-ferreira", "artista=mario-ferreira"],
  ["/arquivo", "pagina=arquivo"],
  ["/lugares", "pagina=lugares"],
  ["/molduras", "pagina=molduras"],
  ["/a-galeria", "pagina=a-galeria"],
  ["/descarregar", "pagina=descarregar"],
  ["/contactos", "pagina=contactos"],
  ["/ver-na-parede", "pagina=ver-na-parede"],
  ["/a-obra-como-ativo", "pagina=a-obra-como-ativo"],
  ["/privacidade", "pagina=privacidade"],
];

/** O endereço do cartão declarado no `og:image` de uma página. */
async function cartaoDe(
  pedir: (caminho: string) => Promise<APIResponse>,
  caminho: string,
): Promise<string> {
  const resposta = await pedir(caminho);
  expect(resposta.status(), `${caminho} devolveu erro`).toBe(200);
  const html = await resposta.text();
  const achado = html.match(
    /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/,
  );
  expect(achado, `${caminho} não declara og:image`).not.toBeNull();
  return achado![1].replace(/&amp;/g, "&");
}

/** Diz se a resposta acabou no cartão fixo da galeria. */
function eCartaoFixo(resposta: APIResponse): boolean {
  return new URL(resposta.url()).pathname === "/og.png";
}

test.describe("Cartões de partilha", () => {
  test("cada página pede o cartão por identificador, sem texto solto", async ({
    request,
  }) => {
    for (const [caminho, identificador] of PAGINAS) {
      const cartao = await cartaoDe((c) => request.get(c), caminho);
      const endereco = new URL(cartao);

      expect(endereco.pathname, `${caminho} não aponta ao /og`).toBe("/og");
      expect(
        endereco.search,
        `${caminho} devia pedir ${identificador}`,
      ).toContain(identificador);

      for (const solto of ["titulo", "sub", "img"]) {
        expect(
          endereco.searchParams.has(solto),
          `${caminho} ainda leva "${solto}" no endereço do cartão`,
        ).toBe(false);
      }
    }
  });

  test("o endereço do cartão devolve mesmo uma imagem", async ({ request }) => {
    for (const [caminho] of PAGINAS) {
      const cartao = await cartaoDe((c) => request.get(c), caminho);
      const imagem = await request.get(cartao);

      expect(imagem.status(), `o cartão de ${caminho} falhou`).toBe(200);
      expect(imagem.headers()["content-type"]).toContain("image/png");
      expect(
        eCartaoFixo(imagem),
        `o cartão de ${caminho} caiu no cartão fixo`,
      ).toBe(false);
    }
  });

  test("texto escrito à mão não chega a cartão", async ({ request }) => {
    const inventado = await request.get(
      "/og?titulo=Obra+vendida+por+dois+milhoes&sub=Contagiarte&img=local/imagens/portfolio-armanda-passos.jpg",
    );
    expect(eCartaoFixo(inventado), inventado.url()).toBe(true);

    // Nem sequer com um identificador válido à mistura.
    const misturado = await request.get(
      "/og?obra=wonder-frida&titulo=Obra+vendida+por+dois+milhoes",
    );
    const corpo = await misturado.body();
    const limpo = await request.get("/og?obra=wonder-frida");
    expect(corpo.length).toBe((await limpo.body()).length);
  });

  test("um identificador que não existe cai no cartão fixo", async ({
    request,
  }) => {
    for (const endereco of [
      "/og",
      "/og?obra=isto-nao-existe",
      "/og?exposicao=isto-nao-existe",
      "/og?artista=isto-nao-existe",
      "/og?percurso=isto-nao-existe",
      "/og?pagina=admin",
    ]) {
      const resposta = await request.get(endereco);
      expect(eCartaoFixo(resposta), `${endereco} compôs um cartão`).toBe(true);
    }
  });

  test("o cartão leva a fotografia da obra e fala o idioma pedido", async ({
    request,
  }) => {
    // Uma obra tem fotografia, uma página fixa não: a diferença de
    // tamanho é a prova de que a imagem entrou mesmo no cartão.
    const comFoto = (await (await request.get("/og?obra=wonder-frida")).body())
      .length;
    const semFoto = (await (await request.get("/og?pagina=contactos")).body())
      .length;
    expect(comFoto).toBeGreaterThan(semFoto * 3);

    const pt = await (
      await request.get("/og?exposicao=a-pele-da-terra&lang=pt")
    ).body();
    const en = await (
      await request.get("/og?exposicao=a-pele-da-terra&lang=en")
    ).body();
    expect(pt.equals(en)).toBe(false);
  });
});
