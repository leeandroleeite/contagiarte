import { asc } from "drizzle-orm";
import { BarraGuardar } from "@/components/admin/BarraGuardar";
import { BotaoApagar } from "@/components/admin/BotaoApagar";
import {
  CampoInterruptor,
  CampoSelect,
  CampoTexto,
} from "@/components/admin/Campos";
import {
  Aviso,
  Celula,
  Estado,
  Grelha,
  Tabela,
  Titulo,
} from "@/components/admin/Pecas";
import { apagarUtilizador, guardarUtilizador } from "@/lib/admin/accoes";
import { exigirAdministrador } from "@/lib/auth";
import { db } from "@/lib/db";
import { utilizadores } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const ERROS: Record<string, string> = {
  email: "Falta o email.",
  "palavra-passe-curta": "A palavra-passe precisa de pelo menos 12 caracteres.",
  proprio: "Não pode apagar a sua própria conta.",
};

export default async function PaginaUtilizadores({
  searchParams,
}: {
  searchParams: Promise<{ guardado?: string; erro?: string }>;
}) {
  const sessao = await exigirAdministrador();
  const { guardado, erro } = await searchParams;

  const lista = await db
    .select()
    .from(utilizadores)
    .orderBy(asc(utilizadores.nome));

  const criar = guardarUtilizador.bind(null, null);

  return (
    <>
      <Titulo nota="Quem pode entrar no backoffice.">Utilizadores</Titulo>

      {guardado && <Aviso tom="bom">Utilizador guardado.</Aviso>}
      {erro && <Aviso tom="erro">{ERROS[erro] ?? "Algo correu mal."}</Aviso>}

      <Tabela colunas={["Nome", "Email", "Papel", "Estado", "Último acesso", ""]}>
        {lista.map((u) => {
          const apagar = apagarUtilizador.bind(null, u.id);
          return (
            <tr key={u.id}>
              <Celula>{u.nome}</Celula>
              <Celula className="text-adm-suave">{u.email}</Celula>
              <Celula>
                {u.papel === "administrador" ? "Administrador" : "Editor"}
              </Celula>
              <Celula>
                <Estado valor={u.activo ? "activo" : "removido"} />
              </Celula>
              <Celula className="text-adm-suave">
                {u.ultimoAcesso
                  ? new Intl.DateTimeFormat("pt-PT", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(u.ultimoAcesso)
                  : "nunca"}
              </Celula>
              <Celula>
                {u.id !== sessao.id && (
                  <BotaoApagar
                    accao={apagar}
                    rotulo="Apagar"
                    pergunta={`Apagar o acesso de ${u.email}?`}
                  />
                )}
              </Celula>
            </tr>
          );
        })}
      </Tabela>

      <h2 className="titulo-med mt-12 mb-5 text-[20px]">Novo utilizador</h2>

      <form action={criar}>
        <Grelha>
          <CampoTexto nome="nome" rotulo="Nome" obrigatorio />
          <CampoTexto nome="email" rotulo="Email" tipo="email" obrigatorio />
          <CampoTexto
            nome="palavraPasse"
            rotulo="Palavra-passe"
            tipo="password"
            obrigatorio
            nota="Pelo menos 12 caracteres. Combine-a por um canal seguro."
          />
          <CampoSelect
            nome="papel"
            rotulo="Papel"
            valor="editor"
            opcoes={[
              { valor: "editor", rotulo: "Editor (conteúdo)" },
              {
                valor: "administrador",
                rotulo: "Administrador (também gere utilizadores)",
              },
            ]}
          />
          <CampoInterruptor nome="activo" rotulo="Pode entrar" valor />
        </Grelha>

        <BarraGuardar voltarPara="/admin" />
      </form>
    </>
  );
}
