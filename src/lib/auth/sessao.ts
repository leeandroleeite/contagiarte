import { jwtVerify, SignJWT } from "jose";

export const COOKIE_SESSAO = "contagiarte_sessao";
const DURACAO_DIAS = 7;

export type Sessao = {
  id: string;
  email: string;
  nome: string;
  papel: "administrador" | "editor";
};

function chave(): Uint8Array {
  const segredo = process.env.SESSION_SECRET;
  if (!segredo || segredo.length < 32) {
    throw new Error(
      "SESSION_SECRET em falta ou demasiado curto (mínimo 32 caracteres).",
    );
  }
  return new TextEncoder().encode(segredo);
}

export async function assinarSessao(sessao: Sessao): Promise<string> {
  return new SignJWT({ ...sessao })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("contagiarte")
    .setAudience("backoffice")
    .setExpirationTime(`${DURACAO_DIAS}d`)
    .sign(chave());
}

export async function lerToken(token: string): Promise<Sessao | null> {
  try {
    const { payload } = await jwtVerify(token, chave(), {
      issuer: "contagiarte",
      audience: "backoffice",
    });
    if (typeof payload.id !== "string" || typeof payload.email !== "string") {
      return null;
    }
    return {
      id: payload.id,
      email: payload.email,
      nome: String(payload.nome ?? ""),
      papel: payload.papel === "administrador" ? "administrador" : "editor",
    };
  } catch {
    return null;
  }
}

export const OPCOES_COOKIE = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: DURACAO_DIAS * 24 * 60 * 60,
};
