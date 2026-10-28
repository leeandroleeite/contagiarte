-- A descrição de /artistas nos motores de busca acompanha as tipologias
-- novas. Só muda se ainda tiver o texto de origem: uma versão escrita no
-- backoffice fica como está.
UPDATE textos SET valor = '{"pt":"Os artistas representados pela Galeria Contagiarte, entre obra gráfica, pintura, escultura e técnica mista.","en":"The artists represented by Galeria Contagiarte, across prints, painting, sculpture and mixed media.","es":"Los artistas representados por la Galería Contagiarte, entre obra gráfica, pintura, escultura y técnica mixta."}'
WHERE chave = 'artistas.descricao' AND valor LIKE '%cerâmica e colagem%';
