import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://academiafacil.vercel.app"
).replace(/\/$/, "");

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  throw new Error(
    "Faltam NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY ou SUPABASE_SERVICE_ROLE_KEY no .env.local"
  );
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
const supabasePublic = createClient(supabaseUrl, anonKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const nome = body?.nome?.trim();
    const email = body?.email?.trim()?.toLowerCase();
    const telefone = body?.telefone?.trim() || null;
    const dataNascimento = body?.dataNascimento || null;
    const sexo = body?.sexo || null;
    const plano = body?.plano?.trim() || null;
    const objetivo = body?.objetivo || null;
    const personal_id = body?.personal_id || null;

    const peso =
      body?.peso !== undefined &&
      body?.peso !== null &&
      String(body.peso).trim() !== ""
        ? Number(body.peso)
        : null;

    const altura =
      body?.altura !== undefined &&
      body?.altura !== null &&
      String(body.altura).trim() !== ""
        ? Number(body.altura)
        : null;

    if (!nome) {
      return NextResponse.json(
        { error: "Nome é obrigatório." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "E-mail é obrigatório." },
        { status: 400 }
      );
    }

    if (!personal_id) {
      return NextResponse.json(
        { error: "Personal não identificado." },
        { status: 400 }
      );
    }

    if (peso !== null && Number.isNaN(peso)) {
      return NextResponse.json(
        { error: "Peso inválido." },
        { status: 400 }
      );
    }

    if (altura !== null && Number.isNaN(altura)) {
      return NextResponse.json(
        { error: "Altura inválida." },
        { status: 400 }
      );
    }

    // 1) Busca personal corretamente na tabela usuarios
    const { data: personal, error: personalError } = await supabaseAdmin
      .from("usuarios")
      .select("id, nome, email, academia_id, tipo")
      .eq("id", personal_id)
      .eq("tipo", "personal")
      .maybeSingle();

    console.log("personal_id recebido:", personal_id);
    console.log("personal encontrado:", personal);
    console.log("erro ao buscar personal:", personalError);

    if (personalError || !personal) {
      return NextResponse.json(
        {
          error: "Personal inválido ou não encontrado.",
          debug: {
            personal_id_recebido: personal_id,
          },
        },
        { status: 400 }
      );
    }

    // 2) Busca nome da academia
    let nomeAcademia = "Sua academia";

    if (personal.academia_id) {
      const { data: academia, error: academiaError } = await supabaseAdmin
        .from("academias")
        .select("id, nome")
        .eq("id", personal.academia_id)
        .maybeSingle();

      if (academiaError) {
        console.error("Erro ao buscar academia:", academiaError);
      }

      if (academia?.nome) {
        nomeAcademia = academia.nome;
      }
    }

    // 3) Busca usuário no Auth
    const { data: usersData, error: listUsersError } =
      await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

    if (listUsersError) {
      console.error("Erro ao listar usuários do auth:", listUsersError);
      return NextResponse.json(
        { error: "Erro ao verificar usuários do auth." },
        { status: 500 }
      );
    }

    const authUserExistente = usersData?.users?.find(
      (user) => user.email?.toLowerCase() === email
    );

    if (!authUserExistente) {
      const { error: createAuthError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
        });

      if (createAuthError) {
        console.error("Erro ao criar usuário no auth:", createAuthError);
        return NextResponse.json(
          { error: "Não foi possível criar o usuário de acesso." },
          { status: 500 }
        );
      }
    }

    // 4) Upsert do usuário interno
    const { data: usuarioInterno, error: upsertUsuarioError } =
      await supabaseAdmin
        .from("usuarios")
        .upsert(
          {
            nome,
            email,
            tipo: "aluno",
            academia_id: personal.academia_id,
          },
          { onConflict: "email" }
        )
        .select("id")
        .single();

    if (upsertUsuarioError || !usuarioInterno) {
      console.error("Erro ao criar usuário interno:", upsertUsuarioError);
      return NextResponse.json(
        { error: "Não foi possível criar o usuário interno do aluno." },
        { status: 500 }
      );
    }

    // 5) Verifica se aluno já existe
    const { data: alunoExistente, error: alunoExistenteError } =
      await supabaseAdmin
        .from("alunos")
        .select("id")
        .eq("user_id", usuarioInterno.id)
        .maybeSingle();

    if (alunoExistenteError) {
      console.error("Erro ao verificar aluno existente:", alunoExistenteError);
      return NextResponse.json(
        { error: "Erro ao verificar aluno existente." },
        { status: 500 }
      );
    }

    if (alunoExistente) {
      return NextResponse.json(
        { error: "Aluno já cadastrado." },
        { status: 409 }
      );
    }

    // 6) Insere aluno
    const { error: insertAlunoError } = await supabaseAdmin
      .from("alunos")
      .insert({
        user_id: usuarioInterno.id,
        personal_id: personal.id,
        academia_id: personal.academia_id,
        nome,
        email,
        telefone,
        data_nascimento: dataNascimento,
        sexo,
        plano,
        objetivo,
        peso,
        altura,
      });

    if (insertAlunoError) {
      console.error("Erro ao inserir aluno:", insertAlunoError);
      return NextResponse.json(
        { error: "Erro ao salvar aluno." },
        { status: 500 }
      );
    }

    // 7) Envia email padrão do Supabase para definir/redefinir senha
    const { error: resetPasswordError } =
      await supabasePublic.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/criar-senha`,
      });

    console.log("siteUrl usado no email:", siteUrl);
    console.log("redirectTo usado no email:", `${siteUrl}/criar-senha`);
    console.log("RESET PASSWORD ERROR:", resetPasswordError);

    if (resetPasswordError) {
      return NextResponse.json(
        {
          error: "Aluno criado, mas houve erro ao enviar o e-mail padrão.",
          details: resetPasswordError.message ?? null,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Aluno criado com sucesso e e-mail padrão enviado por ${nomeAcademia}.`,
    });
  } catch (error) {
    console.error("Erro inesperado na rota:", error);
    return NextResponse.json(
      {
        error: "Erro interno no servidor.",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}