import type { Idioma } from "./config";

/**
 * Dicionário da interface. Só entram aqui strings de chrome: navegação,
 * botões, etiquetas e mensagens de sistema. Todo o conteúdo editorial
 * (títulos de obra, textos curatoriais, biografias) vem da base de
 * dados, já traduzido campo a campo.
 *
 * As traduções EN e ES foram herdadas de `traducoes.js` do design.
 */
export const DICIONARIO = {
  // Navegação -------------------------------------------------------
  "nav.exposicoes": { pt: "Exposições", en: "Exhibitions", es: "Exposiciones" },
  "nav.obras": { pt: "Obras", en: "Works", es: "Obras" },
  "nav.artistas": { pt: "Artistas", en: "Artists", es: "Artistas" },
  "nav.arquivo": { pt: "Arquivo", en: "Archive", es: "Archivo" },
  "nav.molduras": { pt: "Molduras", en: "Framing", es: "Marcos" },
  "nav.lugares": { pt: "Lugares", en: "Places", es: "Lugares" },
  "nav.galeria": { pt: "A galeria", en: "The gallery", es: "La galería" },
  "nav.descarregar": { pt: "Descarregar", en: "Downloads", es: "Descargas" },
  "nav.contactos": { pt: "Contactos", en: "Contact", es: "Contacto" },
  "nav.parede": {
    pt: "Ver na parede",
    en: "See it on your wall",
    es: "Ver en su pared",
  },
  "nav.ativo": {
    pt: "A obra como ativo",
    en: "Art as an asset",
    es: "La obra como activo",
  },
  "nav.abrir": { pt: "Menu ☰", en: "Menu ☰", es: "Menú ☰" },
  "nav.fechar": { pt: "Fechar ✕", en: "Close ✕", es: "Cerrar ✕" },
  "nav.saltar": {
    pt: "Saltar para o conteúdo",
    en: "Skip to content",
    es: "Saltar al contenido",
  },
  "nav.inicio": {
    pt: "← Voltar ao início",
    en: "← Back to home",
    es: "← Volver al inicio",
  },
  "nav.principal": {
    pt: "Navegação principal",
    en: "Main navigation",
    es: "Navegación principal",
  },
  "nav.idioma": { pt: "Idioma", en: "Language", es: "Idioma" },

  // Herói -----------------------------------------------------------
  "hero.desca": { pt: "Desça", en: "Scroll", es: "Baje" },
  "faixa.disrupcao": { pt: "Disrupção", en: "Disruption", es: "Disrupción" },
  "faixa.vinho": { pt: "Arte e vinho", en: "Art and wine", es: "Arte y vino" },
  "faixa.molduras": {
    pt: "Molduras à medida",
    en: "Bespoke framing",
    es: "Marcos a medida",
  },
  "faixa.curadoria": { pt: "Curadoria", en: "Curation", es: "Curaduría" },

  // Estados e etiquetas ---------------------------------------------
  "estado.em_curso": { pt: "Em curso", en: "On view", es: "En curso" },
  "estado.permanente": { pt: "Permanente", en: "Permanent", es: "Permanente" },
  "estado.arquivo": { pt: "Arquivo", en: "Archive", es: "Archivo" },
  "estado.proxima": { pt: "Brevemente", en: "Upcoming", es: "Próximamente" },
  "estado.curadoria": { pt: "Curadoria", en: "Curation", es: "Curaduría" },
  "estado.reservada": { pt: "Reservada", en: "Reserved", es: "Reservada" },
  "estado.vendida": { pt: "Vendida", en: "Sold", es: "Vendida" },
  "estado.em_breve": { pt: "Em breve", en: "Coming soon", es: "Muy pronto" },

  // Acções ----------------------------------------------------------
  "acao.ver": { pt: "Ver →", en: "View →", es: "Ver →" },
  "acao.ver_exposicao": {
    pt: "Ver a exposição",
    en: "View the exhibition",
    es: "Ver la exposición",
  },
  "acao.ver_artista": {
    pt: "Ver artista →",
    en: "View artist →",
    es: "Ver artista →",
  },
  "acao.ver_obra": {
    pt: "Ver a ficha completa →",
    en: "See the full record →",
    es: "Ver la ficha completa →",
  },
  "acao.ver_todas": { pt: "Ver todas →", en: "See all →", es: "Ver todas →" },
  "acao.atravessar": {
    pt: "Atravessar a adega →",
    en: "Walk through the winery →",
    es: "Recorrer la bodega →",
  },
  "acao.whatsapp": {
    pt: "Falar por WhatsApp",
    en: "Message us on WhatsApp",
    es: "Hablar por WhatsApp",
  },
  "acao.email": {
    pt: "Escrever por email",
    en: "Write us an email",
    es: "Escribir por email",
  },
  "acao.orcamento": {
    pt: "Pedir orçamento",
    en: "Request a quote",
    es: "Pedir presupuesto",
  },
  "acao.parede": {
    pt: "Ver uma obra na sua parede →",
    en: "See a work on your wall →",
    es: "Ver una obra en su pared →",
  },
  "acao.descarregar": {
    pt: "Descarregar ↓",
    en: "Download ↓",
    es: "Descargar ↓",
  },
  "acao.subscrever": { pt: "Subscrever", en: "Subscribe", es: "Suscribirse" },
  "acao.enviar": {
    pt: "Enviar pedido",
    en: "Send request",
    es: "Enviar solicitud",
  },
  "acao.arrastar": {
    pt: "Arraste para o lado →",
    en: "Drag sideways →",
    es: "Arrastre hacia un lado →",
  },
  "acao.avaliar": {
    pt: "Como avaliamos isso →",
    en: "How we assess that →",
    es: "Cómo lo evaluamos →",
  },
  "acao.visita": {
    pt: "Marcar visita",
    en: "Book a visit",
    es: "Reservar visita",
  },
  "acao.escolher": { pt: "Escolher ↑", en: "Choose ↑", es: "Elegir ↑" },
  "acao.anterior": { pt: "Anterior", en: "Previous", es: "Anterior" },
  "acao.seguinte": { pt: "Seguinte", en: "Next", es: "Siguiente" },
  "acao.ver_obras": {
    pt: "Ver as obras →",
    en: "See the works →",
    es: "Ver las obras →",
  },
  "acao.pedir_catalogo": {
    pt: "Pedir o catálogo por WhatsApp",
    en: "Ask for the catalogue on WhatsApp",
    es: "Pedir el catálogo por WhatsApp",
  },
  "acao.limpar_filtros": {
    pt: "Limpar os filtros",
    en: "Clear the filters",
    es: "Quitar los filtros",
  },
  // Recurso quando o texto editável ainda não existe na base: a
  // página não pode ficar só com o título.
  "descarregar.vazio": {
    pt: "Ainda não há documentos publicados. Enquanto o catálogo não chega, peça-o e mandamos o PDF.",
    en: "No documents published yet. Until the catalogue is up, ask for it and we will send you the PDF.",
    es: "Todavía no hay documentos publicados. Mientras llega el catálogo, pídalo y le enviamos el PDF.",
  },
  // Mensagens pré-escritas para WhatsApp e email. Iam sempre em
  // português, também a quem estava a ler o site em inglês ou espanhol.
  "whatsapp.obra": {
    pt: "Olá, tenho interesse na obra “{titulo}”{autor}. Podem dizer-me o preço?",
    en: "Hello, I am interested in the work “{titulo}”{autor}. Could you tell me the price?",
    es: "Hola, me interesa la obra “{titulo}”{autor}. ¿Pueden decirme el precio?",
  },
  "whatsapp.obra_autor": { pt: " de {autor}", en: " by {autor}", es: " de {autor}" },
  "whatsapp.obra_assunto": {
    pt: "Interesse na obra: {titulo}",
    en: "Interest in the work: {titulo}",
    es: "Interés en la obra: {titulo}",
  },
  "whatsapp.artista": {
    pt: "Olá, queria saber mais sobre as obras de {artista}.",
    en: "Hello, I would like to know more about the works by {artista}.",
    es: "Hola, me gustaría saber más sobre las obras de {artista}.",
  },
  "whatsapp.exposicao": {
    pt: "Olá, queria saber mais sobre a exposição {titulo}.",
    en: "Hello, I would like to know more about the exhibition {titulo}.",
    es: "Hola, me gustaría saber más sobre la exposición {titulo}.",
  },
  "whatsapp.visita": {
    pt: "Olá, queria marcar uma visita à exposição {titulo}.",
    en: "Hello, I would like to book a visit to the exhibition {titulo}.",
    es: "Hola, me gustaría reservar una visita a la exposición {titulo}.",
  },
  // Verbo e objecto, sempre: o botão diz o que se pede e por onde.
  "acao.preco_whatsapp": {
    pt: "Pedir o preço por WhatsApp",
    en: "Ask the price on WhatsApp",
    es: "Pedir el precio por WhatsApp",
  },
  "acao.preco_email": {
    pt: "Pedir o preço por email",
    en: "Ask the price by email",
    es: "Pedir el precio por email",
  },
  "acao.perguntar_whatsapp": {
    pt: "Perguntar por WhatsApp",
    en: "Ask on WhatsApp",
    es: "Preguntar por WhatsApp",
  },
  "acao.obras_artista": {
    pt: "Ver as obras ↓",
    en: "See the works ↓",
    es: "Ver las obras ↓",
  },
  "whatsapp.catalogo": {
    pt: "Olá, gostava de receber o catálogo da Galeria Contagiarte.",
    en: "Hello, I would like to receive the Galeria Contagiarte catalogue.",
    es: "Hola, me gustaría recibir el catálogo de la Galeria Contagiarte.",
  },

  // Obras -----------------------------------------------------------
  "obra.sob_consulta": {
    pt: "Sob consulta",
    en: "Price on request",
    es: "Precio a consultar",
  },
  "obra.tecnica": { pt: "Técnica", en: "Medium", es: "Técnica" },
  "obra.dimensoes": { pt: "Dimensões", en: "Dimensions", es: "Dimensiones" },
  "obra.ano": { pt: "Ano", en: "Year", es: "Año" },
  "obra.exposicao": { pt: "Exposição", en: "Exhibition", es: "Exposición" },
  "obra.preco": { pt: "Preço", en: "Price", es: "Precio" },
  "obra.artista": { pt: "Artista", en: "Artist", es: "Artista" },
  "obra.relacionadas": {
    pt: "Obras relacionadas",
    en: "Related works",
    es: "Obras relacionadas",
  },
  "obra.sem_titulo": { pt: "Sem título", en: "Untitled", es: "Sin título" },
  "obra.artista_por_atribuir": {
    pt: "artista por atribuir",
    en: "artist to be confirmed",
    es: "artista por confirmar",
  },
  // Texto alternativo de uma obra: o "de" era escrito à mão em
  // português e saía também nas páginas inglesa e espanhola.
  "obra.alt": {
    pt: "{titulo}, de {autor}",
    en: "{titulo}, by {autor}",
    es: "{titulo}, de {autor}",
  },
  "obra.relacionadas_artista": {
    pt: "Do mesmo artista",
    en: "By the same artist",
    es: "Del mismo artista",
  },
  "obra.em_exposicao": {
    pt: "Obras em exposição",
    en: "Works on show",
    es: "Obras en exposición",
  },
  // O rótulo que o cursor mostra por cima de uma obra.
  "cursor.ver": { pt: "Ver", en: "View", es: "Ver" },
  // Entre duas datas: "maio de 2026 a dezembro de 2026".
  "periodo.ate": { pt: "a", en: "to", es: "a" },
  "obra.interesse": {
    pt: "Tenho interesse nesta obra",
    en: "I am interested in this work",
    es: "Me interesa esta obra",
  },

  // Filtros ---------------------------------------------------------
  "filtro.todos": { pt: "Todos", en: "All", es: "Todos" },
  "filtro.todas": { pt: "Todas", en: "All", es: "Todas" },
  "filtro.disponivel": {
    pt: "Disponíveis",
    en: "Available",
    es: "Disponibles",
  },

  // Disciplinas -----------------------------------------------------
  "disciplina.pintura": { pt: "Pintura", en: "Painting", es: "Pintura" },
  "disciplina.escultura": { pt: "Escultura", en: "Sculpture", es: "Escultura" },
  "disciplina.colagem": { pt: "Colagem", en: "Collage", es: "Collage" },
  "disciplina.tecnica_mista": {
    pt: "Técnica mista",
    en: "Mixed media",
    es: "Técnica mixta",
  },
  "disciplina.ceramica": { pt: "Cerâmica", en: "Ceramics", es: "Cerámica" },
  "disciplina.fotografia": {
    pt: "Fotografia",
    en: "Photography",
    es: "Fotografía",
  },
  "disciplina.desenho": { pt: "Desenho", en: "Drawing", es: "Dibujo" },
  "disciplina.instalacao": {
    pt: "Instalação",
    en: "Installation",
    es: "Instalación",
  },

  // Formulários -----------------------------------------------------
  "campo.nome": { pt: "Nome", en: "Name", es: "Nombre" },
  "campo.email": { pt: "Email", en: "Email", es: "Email" },
  "campo.contacto": {
    pt: "Email ou telemóvel",
    en: "Email or phone",
    es: "Email o teléfono",
  },
  "campo.medidas": {
    pt: "Medidas (ex. 70 × 50 cm)",
    en: "Dimensions (e.g. 70 × 50 cm)",
    es: "Medidas (p. ej. 70 × 50 cm)",
  },
  "campo.emoldurar": {
    pt: "O que quer emoldurar?",
    en: "What would you like framed?",
    es: "¿Qué desea enmarcar?",
  },
  "campo.mensagem": { pt: "Mensagem", en: "Message", es: "Mensaje" },
  "campo.anexo": {
    pt: "Anexar fotografia da obra",
    en: "Attach a photo of the work",
    es: "Adjuntar fotografía de la obra",
  },
  "campo.email_exemplo": {
    pt: "o.seu@email.pt",
    en: "your@email.com",
    es: "su@email.es",
  },
  "campo.rgpd": {
    pt: "Guardamos estes dados só para lhe responder. Ver a política de privacidade.",
    en: "We keep these details only to reply to you. See the privacy policy.",
    es: "Guardamos estos datos solo para responderle. Ver la política de privacidad.",
  },

  // Mensagens de sistema --------------------------------------------
  "msg.enviado": {
    pt: "Recebemos o seu pedido. Respondemos em breve.",
    en: "We have received your request. We will reply shortly.",
    es: "Hemos recibido su solicitud. Le responderemos en breve.",
  },
  "msg.subscrito": {
    pt: "Obrigado, está subscrito.",
    en: "Thank you, you are subscribed.",
    es: "Gracias, está suscrito.",
  },
  "msg.newsletter_nota": {
    pt: "Uma mensagem por mês, sem mais.",
    en: "One message a month, no more.",
    es: "Un mensaje al mes, nada más.",
  },
  "msg.erro": {
    pt: "Não foi possível enviar. Tente de novo ou fale connosco por WhatsApp.",
    en: "We could not send this. Try again or reach us on WhatsApp.",
    es: "No fue posible enviarlo. Inténtelo de nuevo o contáctenos por WhatsApp.",
  },
  "msg.email_invalido": {
    pt: "Verifique o endereço de email.",
    en: "Please check the email address.",
    es: "Compruebe la dirección de email.",
  },
  "msg.obrigatorio": {
    pt: "Este campo é obrigatório.",
    en: "This field is required.",
    es: "Este campo es obligatorio.",
  },
  "msg.a_enviar": { pt: "A enviar…", en: "Sending…", es: "Enviando…" },
  "msg.sem_resultados": {
    pt: "Com estes filtros a parede fica nua.",
    en: "With these filters the wall is bare.",
    es: "Con estos filtros la pared se queda desnuda.",
  },
  "msg.sem_imagem": {
    pt: "Fotografia por publicar",
    en: "Photograph pending",
    es: "Fotografía pendiente",
  },

  // Ver na parede ---------------------------------------------------
  "parede.titulo": {
    pt: "A obra na sua parede",
    en: "The work on your wall",
    es: "La obra en su pared",
  },
  "parede.etiqueta": {
    pt: "Experimente antes de decidir",
    en: "Try before you decide",
    es: "Pruebe antes de decidir",
  },
  "parede.intro": {
    pt: "Carregue uma fotografia da sua parede, escolha a obra, o tamanho e a moldura. Depois arraste a peça para o sítio certo.",
    en: "Upload a photograph of your wall, then choose the work, its size and the frame. Drag the piece into place.",
    es: "Suba una fotografía de su pared, elija la obra, el tamaño y el marco. Después arrastre la pieza al sitio adecuado.",
  },
  "parede.arraste": {
    pt: "Arraste a obra para a posicionar",
    en: "Drag the work to position it",
    es: "Arrastre la obra para colocarla",
  },
  "parede.carregar": {
    pt: "Carregar fotografia da parede",
    en: "Upload a photo of your wall",
    es: "Subir fotografía de la pared",
  },
  "parede.obra": { pt: "Obra", en: "Work", es: "Obra" },
  "parede.largura_obra": {
    pt: "Largura da obra",
    en: "Width of the work",
    es: "Ancho de la obra",
  },
  "parede.largura_parede": {
    pt: "Largura da parede",
    en: "Width of the wall",
    es: "Ancho de la pared",
  },
  "parede.escala": {
    pt: "Diga-nos a largura real da parede na fotografia para a escala ficar correta.",
    en: "Tell us the real width of the wall in the photograph so the scale is correct.",
    es: "Indíquenos el ancho real de la pared en la fotografía para que la escala sea correcta.",
  },
  "parede.moldura": { pt: "Moldura", en: "Frame", es: "Marco" },
  "parede.pedir": {
    pt: "Pedir preço desta combinação",
    en: "Request a price for this combination",
    es: "Pedir precio de esta combinación",
  },
  "parede.nota_preco": {
    pt: "Enviamos preço da obra e da moldura, com entrega e instalação.",
    en: "We send the price of the work and the frame, with delivery and installation.",
    es: "Enviamos el precio de la obra y del marco, con entrega e instalación.",
  },
  "parede.privado": {
    pt: "A fotografia não sai do seu telemóvel ou computador. Nada é enviado para nós.",
    en: "The photograph never leaves your device. Nothing is uploaded to us.",
    es: "La fotografía no sale de su dispositivo. No se nos envía nada.",
  },

  // Rodapé ----------------------------------------------------------
  "rodape.privacidade": {
    pt: "Privacidade",
    en: "Privacy",
    es: "Privacidad",
  },
  "rodape.fale": {
    pt: "Fale connosco",
    en: "Get in touch",
    es: "Hable con nosotros",
  },
  "rodape.direto": { pt: "Direto", en: "Direct", es: "Directo" },
  "rodape.seguir": { pt: "Seguir", en: "Follow", es: "Seguir" },
  "rodape.visitar": { pt: "Visitar", en: "Visit", es: "Visitar" },
  "rodape.explorar": { pt: "Explorar", en: "Explore", es: "Explorar" },
  "rodape.parceiros": { pt: "Parceiros", en: "Partners", es: "Socios" },
  "rodape.direitos": {
    pt: "Todos os direitos reservados",
    en: "All rights reserved",
    es: "Todos los derechos reservados",
  },

  // Privacidade -----------------------------------------------------
  "privacidade.titulo": {
    pt: "Política de privacidade",
    en: "Privacy policy",
    es: "Política de privacidad",
  },

  // 404 -------------------------------------------------------------
  "404.titulo": {
    pt: "Esta parede está vazia.",
    en: "This wall is empty.",
    es: "Esta pared está vacía.",
  },
  "404.texto": {
    pt: "O que procurava já foi para casa de alguém, ou nunca esteve pendurado aqui. Estas saídas levam-no de volta.",
    en: "What you were looking for has gone to someone's home, or was never hung here. These ways out will take you back.",
    es: "Lo que buscaba ya se fue a casa de alguien, o nunca estuvo colgado aquí. Estas salidas le llevan de vuelta.",
  },
  "404.etiqueta": { pt: "Erro 404", en: "Error 404", es: "Error 404" },
  "404.inicio": {
    pt: "Voltar ao início",
    en: "Back to home",
    es: "Volver al inicio",
  },
  "404.exposicao": {
    pt: "Exposição em curso",
    en: "Current exhibition",
    es: "Exposición en curso",
  },
  // O prego do 404: carregar nele pendura lá uma obra ao acaso.
  "404.prego": {
    pt: "Pendurar aqui uma obra",
    en: "Hang a work here",
    es: "Colgar aquí una obra",
  },
  "404.prego_legenda": {
    pt: "Esta está cá.",
    en: "This one is here.",
    es: "Esta sí está.",
  },

  // Segredos: para quem repara ---------------------------------------
  "segredo.consola": {
    pt: "Olá, curioso. Quem abre a consola também vira os quadros para ler o verso.\nSe quer ver o resto do ateliê, escreva-nos: galeria@contagiarte.pt",
    en: "Hello, curious one. People who open the console also turn paintings round to read the back.\nIf you want to see the rest of the studio, write to us: galeria@contagiarte.pt",
    es: "Hola, curioso. Quien abre la consola también da la vuelta a los cuadros para leer el reverso.\nSi quiere ver el resto del taller, escríbanos: galeria@contagiarte.pt",
  },
  "segredo.separador": {
    pt: "A obra fica à sua espera · Contagiarte",
    en: "The work will wait for you · Contagiarte",
    es: "La obra le espera · Contagiarte",
  },
  "segredo.torto": {
    pt: "Alguém mexeu nos quadros.",
    en: "Someone touched the pictures.",
    es: "Alguien ha tocado los cuadros.",
  },
  "segredo.direito": {
    pt: "Tudo a direito.",
    en: "All straight again.",
    es: "Todo derecho.",
  },

  // Erro ------------------------------------------------------------
  "erro.etiqueta": { pt: "Erro", en: "Error", es: "Error" },
  "erro.titulo": {
    pt: "Caiu um quadro",
    en: "A picture fell",
    es: "Se cayó un cuadro",
  },
  "erro.texto": {
    pt: "Esta página soltou-se da parede. Tente outra vez; se voltar a cair, diga-nos e penduramo-la nós.",
    en: "This page came off the wall. Try again; if it falls again, tell us and we will hang it back.",
    es: "Esta página se soltó de la pared. Inténtelo de nuevo; si vuelve a caer, díganoslo y la colgamos nosotros.",
  },
  "erro.tentar": {
    pt: "Tentar outra vez",
    en: "Try again",
    es: "Intentar de nuevo",
  },
  "erro.referencia": {
    pt: "Referência {codigo}",
    en: "Reference {codigo}",
    es: "Referencia {codigo}",
  },
  "404.whatsapp": {
    pt: "Olá, andava à procura de algo no site.",
    en: "Hello, I was looking for something on the website.",
    es: "Hola, estaba buscando algo en el sitio.",
  },
  "parede.erro.ficheiro": {
    pt: "Não conseguimos ler esse ficheiro. Tente um JPG ou um PNG.",
    en: "We could not read that file. Try a JPG or a PNG.",
    es: "No pudimos leer ese archivo. Pruebe un JPG o un PNG.",
  },
  "parede.naocabe": {
    pt: "Com moldura fica com {conjunto} cm e não cabe numa parede de {parede} cm.",
    en: "At {conjunto} cm framed, this does not fit a {parede} cm wall.",
    es: "Con marco mide {conjunto} cm y no cabe en una pared de {parede} cm.",
  },
  "parede.forma.aviso": {
    pt: "A forma vem da fotografia da peça; o tamanho é o que escolher. Pergunte-nos as medidas exactas.",
    en: "The shape comes from the photograph of the piece; the size is the one you choose. Ask us for the exact measurements.",
    es: "La forma viene de la fotografía de la pieza; el tamaño es el que usted elija. Pregúntenos las medidas exactas.",
  },
  "parede.grupo.tamanho": {
    pt: "O tamanho",
    en: "Size",
    es: "Tamaño",
  },
  "parede.medidas.propria": {
    pt: "As medidas da própria peça.",
    en: "The measurements of the piece itself.",
    es: "Las medidas de la propia pieza.",
  },
  "parede.grupo.enquadramento": {
    pt: "O enquadramento",
    en: "Framing",
    es: "Enmarcado",
  },
  "parede.margem": {
    pt: "Margem",
    en: "Mount",
    es: "Pasepartú",
  },
  "parede.grupo.parede": {
    pt: "A parede",
    en: "The wall",
    es: "La pared",
  },
  "parede.centrar": {
    pt: "Centrar",
    en: "Centre",
    es: "Centrar",
  },
  "parede.altura.olhar": {
    pt: "Altura do olhar",
    en: "Eye level",
    es: "Altura de los ojos",
  },
  "parede.exemplo": {
    pt: "Esta é uma parede da galeria. Use uma fotografia sua para ver a peça em casa.",
    en: "This is a wall at the gallery. Use a photograph of yours to see the piece at home.",
    es: "Esta es una pared de la galería. Use una fotografía suya para ver la pieza en su casa.",
  },
  "parede.whatsapp.semobra": {
    pt: "Olá, queria saber o preço de uma obra com moldura.",
    en: "Hello, I would like the price of a framed work.",
    es: "Hola, quería saber el precio de una obra con marco.",
  },
  "parede.medidas.semficha": {
    pt: "As medidas desta peça ainda não estão na ficha. Escolha um tamanho para a imaginar, que a galeria confirma o verdadeiro.",
    en: "The measurements of this piece are not on file yet. Choose a size to picture it; the gallery will confirm the real one.",
    es: "Las medidas de esta pieza aún no están en la ficha. Elija un tamaño para imaginarla; la galería confirmará el real.",
  },
  "parede.molduras.nota": {
    pt: "Produzidas com a MOLDARTPÓVOA: vidro museu Tru-Vue®, madeiras naturais e alumínio de precisão.",
    en: "Made with MOLDARTPÓVOA: Tru-Vue® museum glass, natural woods and precision aluminium.",
    es: "Producidos con MOLDARTPÓVOA: vidrio museo Tru-Vue®, maderas naturales y aluminio de precisión.",
  },
  "parede.passe.sem-passe": {
    pt: "Sem margem",
    en: "No mount",
    es: "Sin pasepartú",
  },
  "parede.passe.estreita": {
    pt: "Margem estreita, 4 cm",
    en: "Narrow mount, 4 cm",
    es: "Margen estrecho, 4 cm",
  },
  "parede.passe.larga": {
    pt: "Margem larga, 10 cm",
    en: "Wide mount, 10 cm",
    es: "Margen ancho, 10 cm",
  },
  "parede.passe.dupla": {
    pt: "Dupla margem",
    en: "Double mount",
    es: "Doble margen",
  },
  "parede.passe.filete": {
    pt: "Filete azul",
    en: "Navy fillet",
    es: "Filete azul",
  },
  "parede.medidas.com_margem": {
    pt: "{obra} · com margem, {conjunto} no total",
    en: "{obra} · with mount, {conjunto} overall",
    es: "{obra} · con paspartú, {conjunto} en total",
  },
  "parede.medidas.emoldurada": {
    pt: "{obra} · emoldurada {conjunto}",
    en: "{obra} · framed {conjunto}",
    es: "{obra} · enmarcada {conjunto}",
  },
  "parede.peca.alt": {
    pt: "{obra}, na sua parede",
    en: "{obra}, on your wall",
    es: "{obra}, en su pared",
  },
  "parede.whatsapp.comobra": {
    pt: "Olá, experimentei no site: “{obra}”{autor}, a {medidas}{escolhido}{moldura}. Podem dizer-me o preço?",
    en: "Hello, I tried it on the website: “{obra}”{autor}, at {medidas}{escolhido}{moldura}. Could you tell me the price?",
    es: "Hola, lo probé en el sitio: “{obra}”{autor}, a {medidas}{escolhido}{moldura}. ¿Me pueden decir el precio?",
  },
  "parede.whatsapp.autor": {
    pt: " de {autor}",
    en: " by {autor}",
    es: " de {autor}",
  },
  "parede.whatsapp.escolhido": {
    pt: ", tamanho que escolhi para simular",
    en: ", a size I chose to picture it",
    es: ", tamaño que elegí para simular",
  },
  "parede.whatsapp.commoldura": {
    pt: ", que com {moldura} fica {conjunto}",
    en: ", which with {moldura} becomes {conjunto}",
    es: ", que con {moldura} queda {conjunto}",
  },
  "parede.whatsapp.semmoldura": {
    pt: ", sem moldura",
    en: ", no frame",
    es: ", sin marco",
  },
} as const satisfies Record<string, Record<Idioma, string>>;

export type ChaveTexto = keyof typeof DICIONARIO;
