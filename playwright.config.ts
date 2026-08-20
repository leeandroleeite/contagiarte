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
  retries: process.env.CI ? 1 : 0,
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
      testIgnore: /admin\.spec\.ts/,
    },
  ],

  webServer: {
    // O mesmo servidor que a imagem de produção corre: a saída
    // standalone, não o `next start`, que avisa e não é o que vai para
    // o ar.
    command: `npm run build && npm run prestart && node .next/standalone/server.js`,
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
