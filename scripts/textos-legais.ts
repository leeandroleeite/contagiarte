import type { Localizado } from "../src/lib/db/schema";

/**
 * Rascunho da política de privacidade.
 *
 * ATENÇÃO: carece de revisão jurídica antes de o site ir para produção,
 * tal como o handoff de design já avisava. Descreve com rigor o que a
 * aplicação faz hoje (formulários, newsletter, alojamento, sem cookies
 * de marketing), mas não substitui parecer de advogado.
 *
 * Fica na base de dados, na chave `privacidade.conteudo`, para poder ser
 * corrigido pelo backoffice sem passar por um deploy. Os marcadores
 * {email} e {telefone} são substituídos pelos contactos das definições.
 */
export const PRIVACIDADE: Localizado = {
  pt: `Esta política explica que dados pessoais a Galeria Contagiarte recolhe através deste site, para que servem e que direitos lhe assistem. Última revisão: à data da publicação do site.

## Quem trata os seus dados

O responsável pelo tratamento é a Galeria Contagiarte. Para qualquer questão sobre dados pessoais, escreva para {email} ou telefone para {telefone}.

## Que dados recolhemos

Só recolhemos o que nos dá de livre vontade nos formulários do site:

Nos pedidos de contacto, orçamento de moldura ou interesse numa obra: nome, email ou telefone, e a mensagem que escrever. Se juntar medidas ou uma descrição da obra, guardamos também esses campos.

Na subscrição da newsletter: o endereço de email e, se o indicar, o nome.

Não pedimos dados bancários, não vendemos online e não recolhemos categorias especiais de dados.

## Para que usamos os dados

Para lhe responder e dar seguimento ao seu pedido. Para lhe enviar a newsletter, quando a subscreveu. Para cumprir obrigações legais, quando aplicável.

O fundamento legal é o seu consentimento, no caso da newsletter, e o interesse legítimo em responder a quem nos contacta, no caso dos pedidos.

## Durante quanto tempo

Os pedidos ficam guardados enquanto forem úteis ao acompanhamento comercial e, no máximo, três anos após o último contacto. A subscrição da newsletter dura até a cancelar, o que pode fazer a qualquer momento pelo link no fim de cada mensagem.

## Com quem partilhamos

Não vendemos nem cedemos os seus dados. Recorremos a prestadores de serviço que tratam dados por nossa conta e apenas para operar o site:

Alojamento da aplicação e da base de dados, em servidores na União Europeia.

Armazenamento de imagens e documentos, em infraestrutura da Cloudflare.

Envio de email transacional e da newsletter.

Todos estes prestadores estão vinculados por contrato de subcontratação e tratam os dados apenas segundo as nossas instruções.

## Cookies

Este site não usa cookies de publicidade nem de perfilagem. Usa apenas armazenamento técnico do navegador para se lembrar do idioma escolhido e para não repetir a animação de abertura na mesma visita. Se e quando forem acrescentadas ferramentas de estatística, esta política é actualizada e passa a existir um pedido de consentimento.

## A fotografia que carrega no simulador

Na página que permite ver uma obra na sua parede, a fotografia que escolhe nunca sai do seu telemóvel ou computador. Não é enviada para os nossos servidores nem guardada em lado nenhum.

## Os seus direitos

Tem direito a aceder aos seus dados, a corrigi-los, a apagá-los, a limitar ou opor-se ao tratamento e à portabilidade. Pode retirar o consentimento a qualquer momento, sem que isso afecte a licitude do tratamento anterior. Basta escrever para {email}.

Se entender que os seus direitos não foram respeitados, pode apresentar reclamação à Comissão Nacional de Protecção de Dados.

## Alterações

Se esta política mudar, publicamos a versão nova nesta página, com a data de revisão actualizada.`,

  en: `This policy explains what personal data Galeria Contagiarte collects through this website, what it is used for, and what rights you have. Last reviewed: at the date the site was published.

## Who processes your data

The data controller is Galeria Contagiarte. For any question about personal data, write to {email} or call {telefone}.

## What we collect

We only collect what you freely provide through the forms on this site:

For contact requests, framing quotes or interest in a work: your name, email or phone number, and the message you write. If you add dimensions or a description of the work, we keep those fields too.

For the newsletter: your email address and, if you give it, your name.

We do not ask for bank details, we do not sell online, and we do not collect special categories of data.

## Why we use it

To reply to you and follow up on your request. To send you the newsletter, when you have subscribed to it. To meet legal obligations, where applicable.

The legal basis is your consent for the newsletter, and our legitimate interest in replying to people who contact us for the requests.

## How long we keep it

Requests are kept for as long as they are useful for commercial follow-up, and at most three years after the last contact. A newsletter subscription lasts until you cancel it, which you can do at any time through the link at the end of every message.

## Who we share it with

We do not sell or pass on your data. We use service providers who process data on our behalf and only to run the site:

Application and database hosting, on servers in the European Union.

Storage of images and documents, on Cloudflare infrastructure.

Sending of transactional email and the newsletter.

All of these providers are bound by a processing agreement and handle the data only on our instructions.

## Cookies

This site uses no advertising or profiling cookies. It uses only technical browser storage, to remember the language you chose and to avoid repeating the opening animation within the same visit. If and when analytics tools are added, this policy will be updated and a consent request will appear.

## The photograph you upload to the simulator

On the page that lets you see a work on your wall, the photograph you choose never leaves your phone or computer. It is not sent to our servers and is not stored anywhere.

## Your rights

You have the right to access your data, correct it, erase it, restrict or object to its processing, and to data portability. You may withdraw consent at any time, without affecting the lawfulness of processing carried out before. Just write to {email}.

If you believe your rights have not been respected, you may lodge a complaint with the Portuguese data protection authority, the Comissão Nacional de Protecção de Dados.

## Changes

If this policy changes, we publish the new version on this page, with an updated review date.`,

  es: `Esta política explica qué datos personales recoge la Galería Contagiarte a través de este sitio, para qué se usan y qué derechos le asisten. Última revisión: a la fecha de publicación del sitio.

## Quién trata sus datos

El responsable del tratamiento es la Galería Contagiarte. Para cualquier cuestión sobre datos personales, escriba a {email} o llame al {telefone}.

## Qué datos recogemos

Solo recogemos lo que usted facilita libremente en los formularios del sitio:

En las solicitudes de contacto, presupuesto de marco o interés en una obra: nombre, email o teléfono, y el mensaje que escriba. Si añade medidas o una descripción de la obra, guardamos también esos campos.

En la suscripción a la newsletter: la dirección de email y, si lo indica, el nombre.

No pedimos datos bancarios, no vendemos en línea y no recogemos categorías especiales de datos.

## Para qué los usamos

Para responderle y dar seguimiento a su solicitud. Para enviarle la newsletter, cuando la ha suscrito. Para cumplir obligaciones legales, cuando corresponda.

La base legal es su consentimiento, en el caso de la newsletter, y el interés legítimo en responder a quien nos contacta, en el caso de las solicitudes.

## Durante cuánto tiempo

Las solicitudes se conservan mientras sean útiles para el seguimiento comercial y, como máximo, tres años después del último contacto. La suscripción a la newsletter dura hasta que la cancele, lo que puede hacer en cualquier momento mediante el enlace al final de cada mensaje.

## Con quién los compartimos

No vendemos ni cedemos sus datos. Recurrimos a proveedores de servicio que tratan datos por nuestra cuenta y únicamente para operar el sitio:

Alojamiento de la aplicación y de la base de datos, en servidores de la Unión Europea.

Almacenamiento de imágenes y documentos, en infraestructura de Cloudflare.

Envío de email transaccional y de la newsletter.

Todos estos proveedores están vinculados por contrato de encargo de tratamiento y tratan los datos solo según nuestras instrucciones.

## Cookies

Este sitio no usa cookies de publicidad ni de perfilado. Usa solo almacenamiento técnico del navegador, para recordar el idioma elegido y para no repetir la animación de apertura en la misma visita. Si se añaden herramientas de estadística, esta política se actualizará y aparecerá una solicitud de consentimiento.

## La fotografía que sube al simulador

En la página que permite ver una obra en su pared, la fotografía que elige nunca sale de su teléfono u ordenador. No se envía a nuestros servidores ni se guarda en ningún sitio.

## Sus derechos

Tiene derecho a acceder a sus datos, rectificarlos, suprimirlos, limitar u oponerse al tratamiento y a la portabilidad. Puede retirar el consentimiento en cualquier momento, sin que ello afecte a la licitud del tratamiento anterior. Basta con escribir a {email}.

Si considera que sus derechos no han sido respetados, puede presentar una reclamación ante la autoridad portuguesa de protección de datos, la Comissão Nacional de Protecção de Dados.

## Cambios

Si esta política cambia, publicamos la nueva versión en esta página, con la fecha de revisión actualizada.`,
};
