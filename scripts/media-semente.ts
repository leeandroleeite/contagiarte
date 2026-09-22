/**
 * As imagens que o repositório traz, e a quem pertencem.
 *
 * Estão versionadas em `public/media/local/imagens` para o site poder
 * ser visto e navegado sem depender de contas na nuvem. Sem isto, uma
 * base semeada de raiz ficava com treze obras e zero fotografias.
 *
 * Só entram aqui atribuições verificadas. As `design-*.png`, que
 * vieram do protótipo, não entram nenhuma: comparadas por impressão
 * digital com as 503 imagens do catálogo da galeria, provou-se que são
 * fotografias tiradas de outras secções dele e atribuídas a esmo. Os
 * quatro retratos eram de Armanda Passos, Júlio Pomar, Joan Miró e
 * Sagrasse; a "Quanta Terra" era uma oficina de molduras; o "Off
 * Padel" um atelier de pintura; e as cinco obras mostravam obras
 * diferentes do que o título dizia. Ficam na mediateca, por atribuir,
 * porque são fotografias verdadeiras de alguma coisa, mas ninguém lhes
 * pode pôr um nome sem confirmar qual.
 *
 * As fotografias das obras saem do dossier da exposição, que mostra
 * cada uma com o título impresso ao lado, e foram conferidas uma a
 * uma contra as páginas.
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

/** Recortadas do dossier "A Pele da Terra", onde têm o nome ao lado. */
const OBRAS: Array<[string, string]> = [
  ["wonder-frida", "Wonder Frida"],
  ["reminiscencia", "Reminiscência"],
  ["honey-gold", "Honey Gold"],
  ["censored-hero", "Censored Hero"],
  ["they-put-a-man-on-the-moon", "They put a man on the moon"],
  ["tonup", "TonUp"],
  ["spider-li", "Spider-Li"],
  ["its-a-mens-job", "It’s a men’s job"],
  ["paraiso-perdido", "Paraíso Perdido"],
  ["egg", "Egg"],
  ["forever", "Forever"],
  ["sonhos-molhados", "Sonhos Molhados"],
];

export const MEDIA_SEMENTE: Semente[] = [
  ...OBRAS.map(([chave, titulo]): Semente => ({
    ficheiro: `obra-${chave}.jpg`,
    alt: `${titulo}, obra da exposição A Pele da Terra`,
    liga: { tipo: "obra", titulo },
  })),

  // Do catálogo da galeria, onde cada um aparece ao lado do seu nome.
  // Os dois que lá estavam, do protótipo, eram de Armanda Passos e de
  // Júlio Pomar. Para a Vanessa Teodoro e o Pant. não há fotografia
  // verificada, e um marcador com o nome é melhor do que a cara de
  // outra pessoa.
  {
    ficheiro: "retrato-ana-betania.jpg",
    alt: "Retrato de Ana+Betânia",
    liga: { tipo: "artista", nome: "Ana+Betânia" },
  },
  {
    ficheiro: "retrato-mario-ferreira.jpg",
    alt: "Retrato de Mário Ferreira",
    liga: { tipo: "artista", nome: "Mário Ferreira" },
  },

  // O catálogo da galeria traz esta fotografia na página da parceria
  // com o hotel, que é onde a exposição permanente do Mário Ferreira
  // está montada.
  {
    ficheiro: "design-lugar-2.png",
    alt: "Hotel Forte de Gaia, Marriott Autograph Collection",
    liga: { tipo: "lugar", slug: "forte-de-gaia" },
  },
  {
    ficheiro: "off-padel-01.jpg",
    alt: "Obras da Contagiarte nas paredes do Off Padel, em Leça da Palmeira",
    liga: { tipo: "lugar", slug: "off-padel" },
  },

  // Entram na mediateca sem dono: são fotografias verdadeiras, mas o
  // que o protótipo dizia sobre elas não se confirma.
  { ficheiro: "design-obra-1.png", alt: "Escultura em cerâmica, obra por identificar" },
  { ficheiro: "design-obra-2.png", alt: "Colagem sobre painel, obra por identificar" },
  { ficheiro: "design-obra-3.png", alt: "Escultura em cerâmica, obra por identificar" },
  { ficheiro: "design-obra-4.png", alt: "Desenho, obra por identificar" },
  { ficheiro: "design-obra-5.png", alt: "Serigrafia, obra por identificar" },
  { ficheiro: "design-artista-1.png", alt: "Retrato de artista, pessoa por identificar" },
  { ficheiro: "design-artista-2.png", alt: "Retrato de artista, pessoa por identificar" },
  { ficheiro: "design-artista-3.png", alt: "Retrato de artista, pessoa por identificar" },
  { ficheiro: "design-artista-4.png", alt: "Retrato de artista, pessoa por identificar" },
  { ficheiro: "design-lugar-1.png", alt: "Oficina de molduras, lugar por identificar" },
  { ficheiro: "design-lugar-3.png", alt: "Atelier de pintura, lugar por identificar" },
  { ficheiro: "design-lugar-4.png", alt: "Vista de exposição, lugar por identificar" },
  { ficheiro: "design-expo-pele-da-terra.png", alt: "Obra com asas, por identificar" },
  { ficheiro: "design-molduras.png", alt: "Moldura produzida em parceria com a MOLDARTPÓVOA" },
  { ficheiro: "design-hero-obra.png", alt: "Pintura, obra por identificar" },
];
