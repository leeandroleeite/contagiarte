-- Tipologias editáveis no backoffice. Até aqui, a disciplina de um
-- artista era uma chave de texto com o rótulo no dicionário do código,
-- e mudar a lista pedia um programador. Passa a ser uma tabela, com as
-- quatro tipologias que a galeria pediu, por esta ordem, e os artistas
-- que já existem convertidos para elas.
CREATE TABLE `disciplinas` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`nome` text NOT NULL,
	`nota` text,
	`ordem` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `disciplinas_slug_idx` ON `disciplinas` (`slug`);--> statement-breakpoint
INSERT INTO `disciplinas` (`id`, `slug`, `nome`, `nota`, `ordem`) VALUES
  ('c80ae303-b0b3-46d1-9f7d-ce93295df192', 'obra-grafica',
   '{"pt":"Obra gráfica","en":"Prints","es":"Obra gráfica"}',
   '{"pt":"serigrafia, gravura, litografia, giclée","en":"screen print, etching, lithograph, giclée","es":"serigrafía, grabado, litografía, giclée"}',
   1),
  ('fdd44e29-cec3-469d-9d02-a21183a230cb', 'pintura',
   '{"pt":"Pintura","en":"Painting","es":"Pintura"}',
   '{"pt":"obras originais","en":"original works","es":"obras originales"}',
   2),
  ('a978c3b5-aa47-4e6a-9233-a1ea1a4cdcfe', 'escultura',
   '{"pt":"Escultura","en":"Sculpture","es":"Escultura"}',
   NULL,
   3),
  ('669fa7c4-89e5-4354-8bb6-0b82adfe68c3', 'tecnica-mista',
   '{"pt":"Técnica mista","en":"Mixed media","es":"Técnica mixta"}',
   NULL,
   4)
ON CONFLICT (`slug`) DO NOTHING;
--> statement-breakpoint
-- O `ON DELETE RESTRICT` vai escrito à mão porque o drizzle-kit o deixa
-- cair num `ADD` de SQLite. O backoffice já recusa apagar uma tipologia
-- em uso; isto é a rede por baixo.
ALTER TABLE `artistas` ADD `disciplina_id` text REFERENCES disciplinas(id) ON DELETE restrict;
--> statement-breakpoint
-- Conversão das chaves antigas. A pintura fica pintura; a escultura e a
-- cerâmica passam a escultura; tudo o resto (colagem, técnica mista,
-- fotografia, desenho, instalação, ou uma chave que ninguém previu)
-- passa a técnica mista, para nenhum artista ficar sem tipologia.
UPDATE `artistas` SET `disciplina_id` = (
  SELECT `id` FROM `disciplinas` WHERE `slug` = CASE
    WHEN `artistas`.`disciplina` = 'pintura' THEN 'pintura'
    WHEN `artistas`.`disciplina` IN ('escultura', 'ceramica') THEN 'escultura'
    ELSE 'tecnica-mista'
  END
);
--> statement-breakpoint
ALTER TABLE `artistas` DROP COLUMN `disciplina`;
