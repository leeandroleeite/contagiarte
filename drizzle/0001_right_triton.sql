ALTER TABLE "artistas" ADD COLUMN "etiqueta" jsonb;--> statement-breakpoint
ALTER TABLE "artistas" ADD COLUMN "citacao_fonte" text;--> statement-breakpoint
ALTER TABLE "salas" ADD COLUMN "nota_obras" jsonb;