import { defineConfig, devices } from "@playwright/test";

const PORTA = Number(process.env.PORTA_TESTES ?? 3100);
const BASE = `http://127.0.0.1:${PORTA}`;

/**
 * Testes ponta a ponta.
 *
 * Correm contra uma compilação de produção, não contra o servidor de
 * desenvolvimento: é a versão que vai para o ar, e é onde os efeitos
 * do React deixam de correr duas vezes. A base de dados é a local; os
 * testes que escrevem limpam o que criam.
 *
 *   npm run e2e            corre tudo
 *   npm run e2e:ver        abre o inspector
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  // Uma repetição também fora do CI. Numa corrida completa, ao fim de
  // cento e tal contextos de browser, uma página que responde em 300ms
  // ficava parada meio minuto. Mediu-se: durante esse tempo, uma sonda
  // externa recebeu a mesma página em menos de um segundo, nas 251
  // amostras. O servidor nunca esteve preso, engasga-se o browser dos
  // testes. A repetição parte de um contexto novo e passa.
  //
  // Uma página realmente partida falha as duas vezes, e o relatório
  // mostra sempre que houve repetição: o defeito não se esconde.
  retries: 1,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  timeout: 45_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "pt-PT",
    timezoneId: "Europe/Lisbon",
  },

  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "telemovel",
      use: { ...devices["iPhone 13"] },
      testIgnore: /(admin|backoffice|ficheiros-grandes)\.spec\.ts/,
    },
  ],

  webServer: {
    // O mesmo servidor que a imagem de produção corre: a saída
    // standalone, não o `next start`, que avisa e não é o que vai para
    // o ar.
    // A preparação corre aqui e não só no `npm run e2e`: assim, uma
    // corrida directa do Playwright encontra sempre a base limpa dos
    // restos de uma corrida anterior interrompida.
    // O `--env-file-if-exists` não é um pormenor: o servidor standalone
    // não lê ficheiros `.env`, porque em produção as variáveis vêm do
    // `fly.toml`. Sem isto arranca sem SESSION_SECRET e todo o
    // backoffice responde 500. Passou despercebido porque
    // `reuseExistingServer` apanhava sempre um `next dev` já de pé,
    // que lê o ficheiro, e este caminho nunca chegou a correr.
    //
    // O sufixo `-if-exists` também não: na máquina de integração não
    // há `.env.local`, as variáveis vêm do próprio trabalho, e o
    // `--env-file` sem ele recusa arrancar por o ficheiro faltar.
    command: `npm run e2e:preparar && npm run build && npm run prestart && node --env-file-if-exists=.env.local .next/standalone/server.js`,
    url: `${BASE}/api/saude`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      APP_ENV: "local",
      PUBLIC_URL: BASE,
      PORT: String(PORTA),
      HOSTNAME: "127.0.0.1",
    },
  },
});
