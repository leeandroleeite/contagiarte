import { BarraGuardar } from "@/components/admin/BarraGuardar";
import { CampoLocalizado, CampoTexto } from "@/components/admin/Campos";
import { Aviso, Grelha, CabecalhoSeccao, Conteudo } from "@/components/admin/Pecas";
import { guardarDefinicoes } from "@/lib/admin/accoes";
import { obterDefinicoes } from "@/lib/dados";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function PaginaDefinicoes({
  searchParams,
}: {
  searchParams: Promise<{ guardado?: string }>;
}) {
  const { guardado } = await searchParams;
  const d = await obterDefinicoes();

  return (
    <>
      <CabecalhoSeccao descricao="Contactos, redes e cartão de partilha. Aparecem no rodapé de todas as páginas.">
        Definições
      </CabecalhoSeccao>

      <Conteudo>
      {guardado && <Aviso tom="bom">Definições guardadas.</Aviso>}

      <Aviso>
        Ambiente actual: <strong>{env.ambiente}</strong>. Endereço público:{" "}
        <strong>{env.urlPublico}</strong>.
      </Aviso>

      <form action={guardarDefinicoes}>
        <Grelha>
          <CampoTexto
            nome="email"
            rotulo="Email"
            tipo="email"
            valor={d.email}
          />
          <CampoTexto
            nome="telefone"
            rotulo="Telefone"
            valor={d.telefone}
            nota="Como aparece escrito no site."
          />
          <CampoTexto
            nome="whatsapp"
            rotulo="Número de WhatsApp"
            valor={d.whatsapp}
            nota="Só dígitos, com indicativo. Ex. 351914152451."
          />
          <CampoTexto
            nome="instagram"
            rotulo="Instagram"
            valor={d.instagram}
            nota="Só o nome de utilizador, sem @."
          />
          <CampoTexto nome="morada" rotulo="Morada" valor={d.morada} />
          <CampoTexto
            nome="responsavel"
            rotulo="Responsável"
            valor={d.responsavel}
          />

          <div className="sm:col-span-2">
            <label className="adm-rotulo" htmlFor="parceiros">
              Parceiros
            </label>
            <textarea
              id="parceiros"
              name="parceiros"
              rows={3}
              defaultValue={d.parceiros.join("\n")}
            />
            <span className="mt-1.5 block text-[13px] text-adm-suave">
              Um por linha. Aparecem na última linha do rodapé.
            </span>
          </div>

          <CampoLocalizado
            nome="ogTitulo"
            rotulo="Título de partilha"
            valor={d.ogTitulo}
            nota="O que aparece quando alguém partilha o site."
            largo
          />

          <CampoLocalizado
            nome="ogDescricao"
            rotulo="Descrição de partilha"
            valor={d.ogDescricao}
            linhas={3}
            nota="Até 155 caracteres, para não ficar cortada."
            largo
          />

          <CampoLocalizado
            nome="avisoTopo"
            rotulo="Aviso no topo do site"
            valor={d.avisoTopo}
            nota="Deixe vazio para não mostrar nada. Ex. inauguração, encerramento temporário."
            largo
          />
        </Grelha>

        <BarraGuardar voltarPara="/admin" />
      </form>
      </Conteudo>
    </>
  );
}
