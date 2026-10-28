-- Um descarregável pode ser o catálogo de uma exposição. A coluna é
-- opcional e começa vazia: o PDF e a ligação fazem-se no backoffice.
-- O `ON DELETE SET NULL` vai escrito à mão porque o drizzle-kit o
-- deixa cair num `ADD` de SQLite: apagar a exposição solta o
-- documento em vez de impedir que se apague.
ALTER TABLE `descarregaveis` ADD `exposicao_id` text REFERENCES exposicoes(id) ON DELETE set null;
