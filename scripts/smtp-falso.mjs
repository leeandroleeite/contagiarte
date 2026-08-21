/**
 * Servidor SMTP de mentira, para provar que os pedidos do site saem
 * mesmo por email sem mandar nada para ninguém.
 *
 * O caminho SMTP existia desde o início e nunca tinha sido exercitado.
 * Com a Brevo é este o caminho que conta, por isso vale a pena poder
 * repetir a prova:
 *
 *   node scripts/smtp-falso.mjs /tmp/emails.txt &
 *   SMTP_URL="smtp://u:p@127.0.0.1:2526" PORT=3101 \
 *     DADOS_DIR=var APP_ENV=local PUBLIC_URL=http://127.0.0.1:3101 \
 *     node .next/standalone/server.js &
 *   # preencher o formulário em http://127.0.0.1:3101/contactos
 *   cat /tmp/emails.txt
 *
 * Verificado a 21 de agosto de 2026: chega com o From da galeria, o To
 * do destinatário configurado, e o Reply-To de quem escreveu, que é o
 * que deixa responder carregando em responder.
 */
import net from "node:net";
import fs from "node:fs";
const ALVO = process.argv[2];
fs.writeFileSync(ALVO, "");
net.createServer((socket) => {
  let dados = "", emDados = false;
  socket.write("220 localhost SMTP falso\r\n");
  socket.on("data", (b) => {
    const texto = b.toString();
    if (emDados) {
      dados += texto;
      if (dados.includes("\r\n.\r\n")) { emDados = false; socket.write("250 OK\r\n"); fs.appendFileSync(ALVO, dados + "\n=== FIM ===\n"); dados = ""; }
      return;
    }
    for (const linha of texto.split("\r\n").filter(Boolean)) {
      const c = linha.toUpperCase();
      if (c.startsWith("EHLO") || c.startsWith("HELO")) socket.write("250-localhost\r\n250 AUTH PLAIN LOGIN\r\n");
      else if (c.startsWith("AUTH")) socket.write("235 ok\r\n");
      else if (c.startsWith("MAIL") || c.startsWith("RCPT")) socket.write("250 OK\r\n");
      else if (c.startsWith("DATA")) { emDados = true; socket.write("354 manda\r\n"); }
      else if (c.startsWith("QUIT")) { socket.write("221 adeus\r\n"); socket.end(); }
      else socket.write("250 OK\r\n");
    }
  });
}).listen(2526, () => console.log("sink SMTP em 2526"));
