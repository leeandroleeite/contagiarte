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
    pt: "Não há nada a mostrar com estes filtros.",
    en: "Nothing to show with these filters.",
    es: "No hay nada que mostrar con estos filtros.",
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
    pt: "Esta obra já não está aqui.",
    en: "This work is no longer here.",
    es: "Esta obra ya no está aquí.",
  },
  "404.texto": {
    pt: "A página que procurava mudou de sítio ou nunca existiu. Estas três saídas levam-no de volta.",
    en: "The page you were looking for has moved or never existed. These three ways out will take you back.",
    es: "La página que buscaba cambió de sitio o nunca existió. Estas tres salidas le llevan de vuelta.",
  },
  "404.whatsapp": {
    pt: "Olá, andava à procura de algo no site.",
    en: "Hello, I was looking for something on the website.",
    es: "Hola, estaba buscando algo en el sitio.",
  },
} as const satisfies Record<string, Record<Idioma, string>>;

export type ChaveTexto = keyof typeof DICIONARIO;
