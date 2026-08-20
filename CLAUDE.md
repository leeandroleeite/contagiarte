# Contagiarte

Site e backoffice da Galeria Contagiarte. Next.js 16 (App Router),
SQLite com Drizzle, replicado para o R2 pelo Litestream, Cloudflare R2
para ficheiros, Fly.io para alojamento. Ver `README.md` para a
documentação completa.

## Convenções deste repositório

- **Tudo em português de Portugal**: nomes de ficheiros, funções,
  variáveis, colunas da base de dados e comentários. `obras`, não
  `works`; `guardarObra`, não `saveArtwork`.
- **Nunca usar travessão (—) em texto visível.** Nem em copy, nem em
  documentação, nem em comentários. Usar vírgula, dois pontos ou
  reescrever a frase.
- **Cores só dos tokens** definidos em `src/app/globals.css`, dentro de
  `@theme`. A paleta vem do handoff de design e não se inventa fora
  dela.
- **Raio de canto zero e sem sombras**, por decisão de design. A única
  excepção é o botão flutuante do WhatsApp.
- **Leituras do site público** passam todas por `src/lib/dados.ts`, que
  filtra por `estado = 'publicado'`. Não consultar as tabelas
  directamente a partir de uma página.
- **Escritas do backoffice** passam por `src/lib/admin/accoes.ts`, que
  confirma a sessão, deixa rasto no `registo` e limpa a cache.
- **Campos de texto traduzíveis** são JSON com `{ pt, en, es }`. O
  português é obrigatório; EN e ES caem para ele quando vazios. Ler
  sempre com `texto()` de `src/lib/i18n`.
- **Movimento** vive todo em `src/components/Movimento.tsx`. Qualquer
  animação nova tem de respeitar `prefers-reduced-motion`.

## Antes de dar trabalho por terminado

```bash
npm run tipos
npm run lint -- --max-warnings=0
npm run build
```
