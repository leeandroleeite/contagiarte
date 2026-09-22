/**
 * As imagens que o repositório traz, e a quem pertencem.
 *
 * Vieram do catálogo da galeria, extraídas de um PDF, e estão
 * versionadas em `public/media/local/imagens` para o site poder ser
 * visto e navegado sem depender de contas na nuvem. Faltava ligá-las:
 * uma base semeada de raiz ficava com treze obras e zero fotografias,
 * o que dava um site todo feito de marcadores, e fazia falhar no CI os
 * testes do simulador, que precisam de uma obra com fotografia e
 * medidas.
 *
 * O destino de cada uma sai do nome do ficheiro, que é estável.
 */

export type Semente = {
  ficheiro: string;
  alt: string;
  /** Onde se liga. Sem isto, entra só na mediateca. */
  liga?:
    | { tipo: "obra"; titulo: string }
    | { tipo: "artista"; nome: string }
    | { tipo: "lugar"; slug: string }
    | { tipo: "exposicao"; slug: string };
};

export const MEDIA_SEMENTE: Semente[] = [
  {
    ficheiro: "design-obra-1.png",
    alt: "Reminiscência, de Ana+Betânia, em grés e pigmentos",
    liga: { tipo: "obra", titulo: "Reminiscência" },
  },
  {
    ficheiro: "design-obra-2.png",
    alt: "Wonder Frida, de Mário Ferreira, técnica mista sobre tela",
    liga: { tipo: "obra", titulo: "Wonder Frida" },
  },
  {
    ficheiro: "design-obra-3.png",
    alt: "Honey Gold, de Ana+Betânia, em cerâmica e gesso",
    liga: { tipo: "obra", titulo: "Honey Gold" },
  },
  {
    ficheiro: "design-obra-4.png",
    alt: "Censored Hero, de Mário Ferreira, técnica mista",
    liga: { tipo: "obra", titulo: "Censored Hero" },
  },
  {
    ficheiro: "design-obra-5.png",
    alt: "Egg, de Ana+Betânia, em cerâmica e gesso",
    liga: { tipo: "obra", titulo: "Egg" },
  },
  {
    ficheiro: "design-artista-1.png",
    alt: "Retrato de Ana+Betânia",
    liga: { tipo: "artista", nome: "Ana+Betânia" },
  },
  {
    ficheiro: "design-artista-2.png",
    alt: "Retrato de Mário Ferreira",
    liga: { tipo: "artista", nome: "Mário Ferreira" },
  },
  {
    ficheiro: "design-artista-3.png",
    alt: "Retrato de Vanessa Teodoro",
    liga: { tipo: "artista", nome: "Vanessa Teodoro" },
  },
  {
    ficheiro: "design-artista-4.png",
    alt: "Retrato de Pant.",
    liga: { tipo: "artista", nome: "Pant." },
  },
  {
    ficheiro: "design-lugar-1.png",
    alt: "Quanta Terra, adega em Favaios, Alijó",
    liga: { tipo: "lugar", slug: "quanta-terra" },
  },
  {
    ficheiro: "design-lugar-2.png",
    alt: "Hotel Forte de Gaia, Marriott Autograph Collection",
    liga: { tipo: "lugar", slug: "forte-de-gaia" },
  },
  {
    ficheiro: "design-lugar-3.png",
    alt: "Off Padel, em Leça da Palmeira",
    liga: { tipo: "lugar", slug: "off-padel" },
  },
  {
    ficheiro: "design-lugar-4.png",
    alt: "Café da Praça, em Matosinhos",
    liga: { tipo: "lugar", slug: "cafe-da-praca" },
  },
  {
    ficheiro: "design-expo-pele-da-terra.png",
    alt: "Vista da exposição A Pele da Terra, na adega da Quanta Terra",
    liga: { tipo: "exposicao", slug: "a-pele-da-terra" },
  },
  {
    ficheiro: "design-molduras.png",
    alt: "Moldura produzida em parceria com a MOLDARTPÓVOA",
  },
  {
    ficheiro: "design-hero-obra.png",
    alt: "Obra em destaque da Galeria Contagiarte",
  },
];
