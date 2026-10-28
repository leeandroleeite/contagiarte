-- Conteúdo pedido pela galeria a 28/10/2026. Corre uma vez, no arranque
-- da versão que o traz, e chega à produção sem ninguém mexer na base à
-- mão. Tudo o que muda aqui continua editável no backoffice.

-- A Vanessa Teodoro deixou de fazer parte de A Pele da Terra. Sai da
-- exposição, das salas e do texto. A ficha dela e as obras passam a
-- rascunho em vez de serem apagadas: deixam de aparecer no site, e
-- apagá-las de vez é um clique no backoffice se for essa a decisão.
DELETE FROM exposicoes_artistas
WHERE artista_id IN (SELECT id FROM artistas WHERE slug = 'vanessa-teodoro');
--> statement-breakpoint
DELETE FROM salas_obras
WHERE obra_id IN (
  SELECT o.id FROM obras o JOIN artistas a ON a.id = o.artista_id
  WHERE a.slug = 'vanessa-teodoro'
);
--> statement-breakpoint
UPDATE obras SET estado = 'rascunho'
WHERE artista_id IN (SELECT id FROM artistas WHERE slug = 'vanessa-teodoro');
--> statement-breakpoint
UPDATE artistas SET estado = 'rascunho' WHERE slug = 'vanessa-teodoro';
--> statement-breakpoint
UPDATE exposicoes SET texto = replace(replace(replace(texto,
  'quatro artistas portugueses, Vanessa Teodoro, Ana+Betânia, Mário Ferreira e Pant.',
  'três artistas portugueses, Ana+Betânia, Mário Ferreira e Pant.'),
  'four Portuguese artists, Vanessa Teodoro, Ana+Betânia, Mário Ferreira and Pant.',
  'three Portuguese artists, Ana+Betânia, Mário Ferreira and Pant.'),
  'a cuatro artistas portugueses, Vanessa Teodoro, Ana+Betânia, Mário Ferreira y Pant.',
  'a tres artistas portugueses, Ana+Betânia, Mário Ferreira y Pant.')
WHERE texto LIKE '%Vanessa Teodoro%';
--> statement-breakpoint
UPDATE salas SET nota_obras = replace(replace(replace(nota_obras,
  'Obras de Ana+Betânia e Vanessa Teodoro', 'Obras de Ana+Betânia'),
  'Works by Ana+Betânia and Vanessa Teodoro', 'Works by Ana+Betânia'),
  'Obras de Ana+Betânia y Vanessa Teodoro', 'Obras de Ana+Betânia')
WHERE nota_obras LIKE '%Vanessa Teodoro%';
--> statement-breakpoint

-- Reservas de A Pele da Terra: o telefone passa a ser o do Rui Pedro,
-- o email fica o da Quanta Terra.
UPDATE exposicoes SET reservas = replace(reservas,
  '+351 93 590 75 57', '(+351) 914 152 451')
WHERE slug = 'a-pele-da-terra';
--> statement-breakpoint

-- Passo 3 das molduras.
UPDATE textos SET valor = '{"pt":"Em parceria com a fábrica MOLDARTPÓVOA, produzimos a moldura à medida.","en":"In partnership with the MOLDARTPÓVOA factory, we make the frame to measure.","es":"En colaboración con la fábrica MOLDARTPÓVOA, producimos el marco a medida."}'
WHERE chave = 'molduras.passo3.texto';
