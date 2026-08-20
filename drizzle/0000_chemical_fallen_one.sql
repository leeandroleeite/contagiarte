CREATE TABLE `artistas` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`nome` text NOT NULL,
	`disciplina` text DEFAULT 'pintura' NOT NULL,
	`naturalidade` text,
	`instagram` text,
	`website` text,
	`retrato_id` text,
	`etiqueta` text,
	`nota` text,
	`biografia` text,
	`citacao` text,
	`citacao_fonte` text,
	`estado` text DEFAULT 'rascunho' NOT NULL,
	`ordem` integer DEFAULT 0 NOT NULL,
	`criado_em` integer NOT NULL,
	`actualizado_em` integer NOT NULL,
	FOREIGN KEY (`retrato_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `artistas_slug_idx` ON `artistas` (`slug`);--> statement-breakpoint
CREATE INDEX `artistas_estado_idx` ON `artistas` (`estado`);--> statement-breakpoint
CREATE TABLE `definicoes` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`valor` text NOT NULL,
	`actualizado_em` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `descarregaveis` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`etiqueta` text,
	`nome` text NOT NULL,
	`descricao` text,
	`ficheiro_id` text,
	`data` text,
	`descargas` integer DEFAULT 0 NOT NULL,
	`estado` text DEFAULT 'rascunho' NOT NULL,
	`ordem` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`ficheiro_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `descarregaveis_slug_idx` ON `descarregaveis` (`slug`);--> statement-breakpoint
CREATE TABLE `exposicoes` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`titulo` text NOT NULL,
	`subtitulo` text,
	`lugar_id` text,
	`data_inicio` text,
	`data_fim` text,
	`permanente` integer DEFAULT false NOT NULL,
	`curadoria` text,
	`horario` text,
	`reservas` text,
	`inclui` text,
	`imagem_id` text,
	`texto` text,
	`citacao` text,
	`citacao_autor` text,
	`destaque` integer DEFAULT false NOT NULL,
	`estado` text DEFAULT 'rascunho' NOT NULL,
	`ordem` integer DEFAULT 0 NOT NULL,
	`criado_em` integer NOT NULL,
	`actualizado_em` integer NOT NULL,
	FOREIGN KEY (`lugar_id`) REFERENCES `lugares`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`imagem_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exposicoes_slug_idx` ON `exposicoes` (`slug`);--> statement-breakpoint
CREATE INDEX `exposicoes_estado_idx` ON `exposicoes` (`estado`);--> statement-breakpoint
CREATE TABLE `exposicoes_artistas` (
	`exposicao_id` text NOT NULL,
	`artista_id` text NOT NULL,
	`ordem` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`exposicao_id`, `artista_id`),
	FOREIGN KEY (`exposicao_id`) REFERENCES `exposicoes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`artista_id`) REFERENCES `artistas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `lugares` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`nome` text NOT NULL,
	`localidade` text,
	`tipo` text,
	`morada` text,
	`site` text,
	`mapa` text,
	`fotografia_id` text,
	`descricao` text,
	`estado` text DEFAULT 'rascunho' NOT NULL,
	`ordem` integer DEFAULT 0 NOT NULL,
	`criado_em` integer NOT NULL,
	`actualizado_em` integer NOT NULL,
	FOREIGN KEY (`fotografia_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lugares_slug_idx` ON `lugares` (`slug`);--> statement-breakpoint
CREATE TABLE `media` (
	`id` text PRIMARY KEY NOT NULL,
	`chave` text NOT NULL,
	`nome_original` text NOT NULL,
	`tipo_mime` text NOT NULL,
	`tamanho` integer DEFAULT 0 NOT NULL,
	`largura` integer,
	`altura` integer,
	`cor_dominante` text,
	`blur` text,
	`alt` text,
	`legenda` text,
	`criado_em` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `molduras` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`nome` text NOT NULL,
	`cor` text DEFAULT '#2A2320' NOT NULL,
	`espessura_mm` integer DEFAULT 20 NOT NULL,
	`passepartout` integer DEFAULT false NOT NULL,
	`estado` text DEFAULT 'publicado' NOT NULL,
	`ordem` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `molduras_slug_idx` ON `molduras` (`slug`);--> statement-breakpoint
CREATE TABLE `obras` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`titulo` text NOT NULL,
	`artista_id` text,
	`tecnica` text,
	`dimensoes` text,
	`ano` integer,
	`exposicao_id` text,
	`fotografia_id` text,
	`descricao` text,
	`preco` text,
	`largura_cm` integer,
	`altura_cm` integer,
	`disponibilidade` text DEFAULT 'disponivel' NOT NULL,
	`destaque` integer DEFAULT false NOT NULL,
	`estado` text DEFAULT 'rascunho' NOT NULL,
	`ordem` integer DEFAULT 0 NOT NULL,
	`criado_em` integer NOT NULL,
	`actualizado_em` integer NOT NULL,
	FOREIGN KEY (`artista_id`) REFERENCES `artistas`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`exposicao_id`) REFERENCES `exposicoes`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`fotografia_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `obras_slug_idx` ON `obras` (`slug`);--> statement-breakpoint
CREATE INDEX `obras_artista_idx` ON `obras` (`artista_id`);--> statement-breakpoint
CREATE INDEX `obras_exposicao_idx` ON `obras` (`exposicao_id`);--> statement-breakpoint
CREATE INDEX `obras_estado_idx` ON `obras` (`estado`);--> statement-breakpoint
CREATE TABLE `obras_media` (
	`obra_id` text NOT NULL,
	`media_id` text NOT NULL,
	`ordem` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`obra_id`, `media_id`),
	FOREIGN KEY (`obra_id`) REFERENCES `obras`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pedidos` (
	`id` text PRIMARY KEY NOT NULL,
	`tipo` text NOT NULL,
	`nome` text,
	`email` text,
	`telefone` text,
	`mensagem` text,
	`dados` text,
	`obra_id` text,
	`anexo_id` text,
	`idioma` text DEFAULT 'pt' NOT NULL,
	`origem` text,
	`estado` text DEFAULT 'novo' NOT NULL,
	`nota_interna` text,
	`criado_em` integer NOT NULL,
	FOREIGN KEY (`obra_id`) REFERENCES `obras`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`anexo_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `pedidos_estado_idx` ON `pedidos` (`estado`);--> statement-breakpoint
CREATE INDEX `pedidos_criado_idx` ON `pedidos` (`criado_em`);--> statement-breakpoint
CREATE TABLE `registo` (
	`id` text PRIMARY KEY NOT NULL,
	`utilizador_id` text,
	`accao` text NOT NULL,
	`entidade` text NOT NULL,
	`entidade_id` text,
	`resumo` text,
	`criado_em` integer NOT NULL,
	FOREIGN KEY (`utilizador_id`) REFERENCES `utilizadores`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `registo_criado_idx` ON `registo` (`criado_em`);--> statement-breakpoint
CREATE TABLE `salas` (
	`id` text PRIMARY KEY NOT NULL,
	`exposicao_id` text NOT NULL,
	`slug` text NOT NULL,
	`nome` text NOT NULL,
	`texto` text,
	`nota_obras` text,
	`fotografia_id` text,
	`ordem` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`exposicao_id`) REFERENCES `exposicoes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`fotografia_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `salas_exposicao_slug_idx` ON `salas` (`exposicao_id`,`slug`);--> statement-breakpoint
CREATE TABLE `salas_obras` (
	`sala_id` text NOT NULL,
	`obra_id` text NOT NULL,
	`ordem` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`sala_id`, `obra_id`),
	FOREIGN KEY (`sala_id`) REFERENCES `salas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`obra_id`) REFERENCES `obras`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `subscritores` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`nome` text,
	`idioma` text DEFAULT 'pt' NOT NULL,
	`estado` text DEFAULT 'pendente' NOT NULL,
	`token` text NOT NULL,
	`origem` text,
	`confirmado_em` integer,
	`criado_em` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscritores_email_idx` ON `subscritores` (`email`);--> statement-breakpoint
CREATE INDEX `subscritores_token_idx` ON `subscritores` (`token`);--> statement-breakpoint
CREATE TABLE `textos` (
	`id` text PRIMARY KEY NOT NULL,
	`chave` text NOT NULL,
	`valor` text NOT NULL,
	`nota` text,
	`grupo` text DEFAULT 'geral' NOT NULL,
	`actualizado_em` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `textos_chave_idx` ON `textos` (`chave`);--> statement-breakpoint
CREATE TABLE `utilizadores` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`nome` text NOT NULL,
	`palavra_passe_hash` text NOT NULL,
	`papel` text DEFAULT 'editor' NOT NULL,
	`activo` integer DEFAULT true NOT NULL,
	`ultimo_acesso` integer,
	`criado_em` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `utilizadores_email_idx` ON `utilizadores` (`email`);