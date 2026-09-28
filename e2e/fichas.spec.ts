import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { FICHAS } from "../src/lib/fichas";

/**
 * A imagem de partilha, o manifesto e a página de erro fatal não leem
 * CSS e têm as cores em `src/lib/fichas.ts`. Este teste garante que uma
 * mudança de marca no `@theme` não os deixa para trás.
 */
test("as fichas em JS são as mesmas do @theme", () => {
  test.skip(test.info().project.name !== "desktop", "basta uma vez");
  const css = readFileSync("src/app/globals.css", "utf8");
  const ficha = (nome: string) =>
    css.match(new RegExp(`--color-${nome}:\\s*([^;]+);`))?.[1].trim().toLowerCase();

  expect(ficha("tinta")).toBe(FICHAS.tinta);
  expect(ficha("papel")).toBe(FICHAS.papel);
  expect(ficha("ouro")).toBe(FICHAS.ouro);
  expect(ficha("claro-80")).toBe(FICHAS.claro80);
  expect(ficha("claro-65")).toBe(FICHAS.claro65);
  expect(ficha("claro-55")).toBe(FICHAS.claro55);
  expect(ficha("fio-controlo")).toBe(FICHAS.fioControlo);
});
