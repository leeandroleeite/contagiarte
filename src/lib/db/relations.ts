import { relations } from "drizzle-orm";
import {
  artistas,
  descarregaveis,
  exposicoes,
  exposicoesArtistas,
  lugares,
  media,
  obras,
  obrasMedia,
  pedidos,
  salas,
  salasObras,
} from "./schema";

export const artistasRel = relations(artistas, ({ one, many }) => ({
  retrato: one(media, { fields: [artistas.retratoId], references: [media.id] }),
  obras: many(obras),
  exposicoes: many(exposicoesArtistas),
}));

export const lugaresRel = relations(lugares, ({ one, many }) => ({
  fotografia: one(media, {
    fields: [lugares.fotografiaId],
    references: [media.id],
  }),
  exposicoes: many(exposicoes),
}));

export const exposicoesRel = relations(exposicoes, ({ one, many }) => ({
  lugar: one(lugares, {
    fields: [exposicoes.lugarId],
    references: [lugares.id],
  }),
  imagem: one(media, {
    fields: [exposicoes.imagemId],
    references: [media.id],
  }),
  artistas: many(exposicoesArtistas),
  obras: many(obras),
  salas: many(salas),
}));

export const exposicoesArtistasRel = relations(
  exposicoesArtistas,
  ({ one }) => ({
    exposicao: one(exposicoes, {
      fields: [exposicoesArtistas.exposicaoId],
      references: [exposicoes.id],
    }),
    artista: one(artistas, {
      fields: [exposicoesArtistas.artistaId],
      references: [artistas.id],
    }),
  }),
);

export const obrasRel = relations(obras, ({ one, many }) => ({
  artista: one(artistas, {
    fields: [obras.artistaId],
    references: [artistas.id],
  }),
  exposicao: one(exposicoes, {
    fields: [obras.exposicaoId],
    references: [exposicoes.id],
  }),
  fotografia: one(media, {
    fields: [obras.fotografiaId],
    references: [media.id],
  }),
  galeria: many(obrasMedia),
  salas: many(salasObras),
}));

export const obrasMediaRel = relations(obrasMedia, ({ one }) => ({
  obra: one(obras, { fields: [obrasMedia.obraId], references: [obras.id] }),
  media: one(media, { fields: [obrasMedia.mediaId], references: [media.id] }),
}));

export const salasRel = relations(salas, ({ one, many }) => ({
  exposicao: one(exposicoes, {
    fields: [salas.exposicaoId],
    references: [exposicoes.id],
  }),
  fotografia: one(media, {
    fields: [salas.fotografiaId],
    references: [media.id],
  }),
  obras: many(salasObras),
}));

export const salasObrasRel = relations(salasObras, ({ one }) => ({
  sala: one(salas, { fields: [salasObras.salaId], references: [salas.id] }),
  obra: one(obras, { fields: [salasObras.obraId], references: [obras.id] }),
}));

export const descarregaveisRel = relations(descarregaveis, ({ one }) => ({
  ficheiro: one(media, {
    fields: [descarregaveis.ficheiroId],
    references: [media.id],
  }),
}));

export const pedidosRel = relations(pedidos, ({ one }) => ({
  obra: one(obras, { fields: [pedidos.obraId], references: [obras.id] }),
  anexo: one(media, { fields: [pedidos.anexoId], references: [media.id] }),
}));
