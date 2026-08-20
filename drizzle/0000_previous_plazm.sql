CREATE TYPE "public"."disponibilidade" AS ENUM('disponivel', 'reservada', 'vendida', 'nao_venal');--> statement-breakpoint
CREATE TYPE "public"."estado" AS ENUM('rascunho', 'publicado', 'arquivado');--> statement-breakpoint
CREATE TYPE "public"."estado_pedido" AS ENUM('novo', 'em_curso', 'fechado');--> statement-breakpoint
CREATE TYPE "public"."estado_subscritor" AS ENUM('pendente', 'activo', 'removido');--> statement-breakpoint
CREATE TYPE "public"."papel" AS ENUM('administrador', 'editor');--> statement-breakpoint
CREATE TYPE "public"."tipo_pedido" AS ENUM('moldura', 'obra', 'contacto', 'visita', 'parede');--> statement-breakpoint
CREATE TABLE "artistas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"nome" text NOT NULL,
	"disciplina" text DEFAULT 'pintura' NOT NULL,
	"naturalidade" text,
	"instagram" text,
	"website" text,
	"retrato_id" uuid,
	"nota" jsonb,
	"biografia" jsonb,
	"citacao" jsonb,
	"estado" "estado" DEFAULT 'rascunho' NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "definicoes" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"valor" jsonb NOT NULL,
	"actualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "descarregaveis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"etiqueta" jsonb,
	"nome" jsonb NOT NULL,
	"descricao" jsonb,
	"ficheiro_id" uuid,
	"data" date,
	"descargas" integer DEFAULT 0 NOT NULL,
	"estado" "estado" DEFAULT 'rascunho' NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exposicoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"titulo" jsonb NOT NULL,
	"subtitulo" jsonb,
	"lugar_id" uuid,
	"data_inicio" date,
	"data_fim" date,
	"permanente" boolean DEFAULT false NOT NULL,
	"curadoria" text,
	"horario" jsonb,
	"reservas" jsonb,
	"inclui" jsonb,
	"imagem_id" uuid,
	"texto" jsonb,
	"citacao" jsonb,
	"citacao_autor" text,
	"destaque" boolean DEFAULT false NOT NULL,
	"estado" "estado" DEFAULT 'rascunho' NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exposicoes_artistas" (
	"exposicao_id" uuid NOT NULL,
	"artista_id" uuid NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "exposicoes_artistas_exposicao_id_artista_id_pk" PRIMARY KEY("exposicao_id","artista_id")
);
--> statement-breakpoint
CREATE TABLE "lugares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"nome" text NOT NULL,
	"localidade" jsonb,
	"tipo" jsonb,
	"morada" text,
	"site" text,
	"mapa" text,
	"fotografia_id" uuid,
	"descricao" jsonb,
	"estado" "estado" DEFAULT 'rascunho' NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chave" text NOT NULL,
	"nome_original" text NOT NULL,
	"tipo_mime" text NOT NULL,
	"tamanho" integer DEFAULT 0 NOT NULL,
	"largura" integer,
	"altura" integer,
	"cor_dominante" text,
	"blur" text,
	"alt" jsonb,
	"legenda" jsonb,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "molduras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"nome" jsonb NOT NULL,
	"cor" text DEFAULT '#2A2320' NOT NULL,
	"espessura_mm" integer DEFAULT 20 NOT NULL,
	"passepartout" boolean DEFAULT false NOT NULL,
	"estado" "estado" DEFAULT 'publicado' NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "obras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"titulo" jsonb NOT NULL,
	"artista_id" uuid,
	"tecnica" jsonb,
	"dimensoes" text,
	"ano" integer,
	"exposicao_id" uuid,
	"fotografia_id" uuid,
	"descricao" jsonb,
	"preco" jsonb,
	"largura_cm" integer,
	"altura_cm" integer,
	"disponibilidade" "disponibilidade" DEFAULT 'disponivel' NOT NULL,
	"destaque" boolean DEFAULT false NOT NULL,
	"estado" "estado" DEFAULT 'rascunho' NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "obras_media" (
	"obra_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "obras_media_obra_id_media_id_pk" PRIMARY KEY("obra_id","media_id")
);
--> statement-breakpoint
CREATE TABLE "pedidos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo" "tipo_pedido" NOT NULL,
	"nome" text,
	"email" text,
	"telefone" text,
	"mensagem" text,
	"dados" jsonb,
	"obra_id" uuid,
	"anexo_id" uuid,
	"idioma" text DEFAULT 'pt' NOT NULL,
	"origem" text,
	"estado" "estado_pedido" DEFAULT 'novo' NOT NULL,
	"nota_interna" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"utilizador_id" uuid,
	"accao" text NOT NULL,
	"entidade" text NOT NULL,
	"entidade_id" text,
	"resumo" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exposicao_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"nome" jsonb NOT NULL,
	"texto" jsonb,
	"fotografia_id" uuid,
	"ordem" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salas_obras" (
	"sala_id" uuid NOT NULL,
	"obra_id" uuid NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "salas_obras_sala_id_obra_id_pk" PRIMARY KEY("sala_id","obra_id")
);
--> statement-breakpoint
CREATE TABLE "subscritores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"nome" text,
	"idioma" text DEFAULT 'pt' NOT NULL,
	"estado" "estado_subscritor" DEFAULT 'pendente' NOT NULL,
	"token" text NOT NULL,
	"origem" text,
	"confirmado_em" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "textos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chave" text NOT NULL,
	"valor" jsonb NOT NULL,
	"nota" text,
	"grupo" text DEFAULT 'geral' NOT NULL,
	"actualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "utilizadores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"nome" text NOT NULL,
	"palavra_passe_hash" text NOT NULL,
	"papel" "papel" DEFAULT 'editor' NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"ultimo_acesso" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "artistas" ADD CONSTRAINT "artistas_retrato_id_media_id_fk" FOREIGN KEY ("retrato_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "descarregaveis" ADD CONSTRAINT "descarregaveis_ficheiro_id_media_id_fk" FOREIGN KEY ("ficheiro_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exposicoes" ADD CONSTRAINT "exposicoes_lugar_id_lugares_id_fk" FOREIGN KEY ("lugar_id") REFERENCES "public"."lugares"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exposicoes" ADD CONSTRAINT "exposicoes_imagem_id_media_id_fk" FOREIGN KEY ("imagem_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exposicoes_artistas" ADD CONSTRAINT "exposicoes_artistas_exposicao_id_exposicoes_id_fk" FOREIGN KEY ("exposicao_id") REFERENCES "public"."exposicoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exposicoes_artistas" ADD CONSTRAINT "exposicoes_artistas_artista_id_artistas_id_fk" FOREIGN KEY ("artista_id") REFERENCES "public"."artistas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lugares" ADD CONSTRAINT "lugares_fotografia_id_media_id_fk" FOREIGN KEY ("fotografia_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obras" ADD CONSTRAINT "obras_artista_id_artistas_id_fk" FOREIGN KEY ("artista_id") REFERENCES "public"."artistas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obras" ADD CONSTRAINT "obras_exposicao_id_exposicoes_id_fk" FOREIGN KEY ("exposicao_id") REFERENCES "public"."exposicoes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obras" ADD CONSTRAINT "obras_fotografia_id_media_id_fk" FOREIGN KEY ("fotografia_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obras_media" ADD CONSTRAINT "obras_media_obra_id_obras_id_fk" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obras_media" ADD CONSTRAINT "obras_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_obra_id_obras_id_fk" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_anexo_id_media_id_fk" FOREIGN KEY ("anexo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registo" ADD CONSTRAINT "registo_utilizador_id_utilizadores_id_fk" FOREIGN KEY ("utilizador_id") REFERENCES "public"."utilizadores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salas" ADD CONSTRAINT "salas_exposicao_id_exposicoes_id_fk" FOREIGN KEY ("exposicao_id") REFERENCES "public"."exposicoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salas" ADD CONSTRAINT "salas_fotografia_id_media_id_fk" FOREIGN KEY ("fotografia_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salas_obras" ADD CONSTRAINT "salas_obras_sala_id_salas_id_fk" FOREIGN KEY ("sala_id") REFERENCES "public"."salas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salas_obras" ADD CONSTRAINT "salas_obras_obra_id_obras_id_fk" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "artistas_slug_idx" ON "artistas" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "artistas_estado_idx" ON "artistas" USING btree ("estado");--> statement-breakpoint
CREATE UNIQUE INDEX "descarregaveis_slug_idx" ON "descarregaveis" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "exposicoes_slug_idx" ON "exposicoes" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "exposicoes_estado_idx" ON "exposicoes" USING btree ("estado");--> statement-breakpoint
CREATE UNIQUE INDEX "lugares_slug_idx" ON "lugares" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "molduras_slug_idx" ON "molduras" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "obras_slug_idx" ON "obras" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "obras_artista_idx" ON "obras" USING btree ("artista_id");--> statement-breakpoint
CREATE INDEX "obras_exposicao_idx" ON "obras" USING btree ("exposicao_id");--> statement-breakpoint
CREATE INDEX "obras_estado_idx" ON "obras" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "pedidos_estado_idx" ON "pedidos" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "pedidos_criado_idx" ON "pedidos" USING btree ("criado_em");--> statement-breakpoint
CREATE INDEX "registo_criado_idx" ON "registo" USING btree ("criado_em");--> statement-breakpoint
CREATE UNIQUE INDEX "salas_exposicao_slug_idx" ON "salas" USING btree ("exposicao_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "subscritores_email_idx" ON "subscritores" USING btree ("email");--> statement-breakpoint
CREATE INDEX "subscritores_token_idx" ON "subscritores" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "textos_chave_idx" ON "textos" USING btree ("chave");--> statement-breakpoint
CREATE UNIQUE INDEX "utilizadores_email_idx" ON "utilizadores" USING btree ("email");