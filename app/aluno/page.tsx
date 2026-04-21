"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase/client";

type Usuario = {
  id: string;
  nome: string | null;
  email: string | null;
  tipo: string | null;
  academia_id?: string | null;
};

type Aluno = {
  id: string;
  nome: string | null;
  email: string | null;
  user_id: string | null;
  academia_id: string | null;
  personal_id: string | null;
  objetivo?: string | null;
  peso?: number | null;
  altura?: number | null;
};

type AvaliacaoResumo = {
  id: string;
  data: string | null;
  peso: number | null;
  altura: number | null;
  imc: number | null;
  gordura: number | null;
  observacoes: string | null;
};

type TreinoResumo = {
  id: string;
  nome: string | null;
  descricao: string | null;
  status: string | null;
  data_inicio: string | null;
};

type FinanceiroResumo = {
  id: string;
  descricao: string | null;
  status: string | null;
  valor: number | null;
  vencimento: string | null;
};

function formatarData(data?: string | null) {
  if (!data) return "—";
  const dt = new Date(data);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("pt-BR");
}

function formatarMoeda(valor?: number | null) {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) {
    return "—";
  }

  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function calcularImc(peso?: number | null, alturaCm?: number | null) {
  if (!peso || !alturaCm) return null;
  const alturaM = alturaCm / 100;
  if (!alturaM) return null;
  const imc = peso / (alturaM * alturaM);
  return Number(imc.toFixed(1));
}

function formatarAltura(altura?: number | null) {
  if (!altura) return "— cm";
  return `${altura} cm`;
}

function formatarPeso(peso?: number | null) {
  if (!peso) return "— kg";
  return `${peso} kg`;
}

function corStatusPagamento(status?: string | null) {
  const valor = (status || "").toLowerCase();

  if (valor.includes("pago")) {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
  }

  if (valor.includes("venc")) {
    return "border-red-400/20 bg-red-500/10 text-red-300";
  }

  if (valor.includes("pend")) {
    return "border-amber-400/20 bg-amber-500/10 text-amber-300";
  }

  return "border-white/10 bg-white/5 text-slate-300";
}

async function buscarAluno(userId: string, email?: string | null) {
  let query = supabase
    .from("alunos")
    .select("*")
    .eq("user_id", userId)
    .limit(1);

  const { data: porUser, error: erroUser } = await query.maybeSingle();

  if (!erroUser && porUser) return porUser as Aluno;

  if (email) {
    const { data: porEmail, error: erroEmail } = await supabase
      .from("alunos")
      .select("*")
      .eq("email", email)
      .limit(1)
      .maybeSingle();

    if (!erroEmail && porEmail) {
      if (!porEmail.user_id) {
        await supabase
          .from("alunos")
          .update({ user_id: userId })
          .eq("id", porEmail.id);
      }
      return {
        ...porEmail,
        user_id: porEmail.user_id || userId,
      } as Aluno;
    }
  }

  return null;
}

async function buscarUltimaAvaliacao(alunoId: string): Promise<AvaliacaoResumo | null> {
  const tabelas = ["avaliacoes", "avaliacoes_fisicas"];

  for (const tabela of tabelas) {
    const { data, error } = await supabase
      .from(tabela)
      .select("*")
      .eq("aluno_id", alunoId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      const peso = data.peso ?? data.peso_atual ?? null;
      const altura = data.altura ?? data.altura_atual ?? null;
      const imc = data.imc ?? calcularImc(peso, altura);

      return {
        id: data.id,
        data: data.data_avaliacao ?? data.created_at ?? null,
        peso,
        altura,
        imc,
        gordura: data.percentual_gordura ?? data.gordura_corporal ?? null,
        observacoes: data.observacoes ?? data.obs ?? null,
      };
    }
  }

  return null;
}

async function buscarTreinoAtual(alunoId: string): Promise<TreinoResumo | null> {
  const { data, error } = await supabase
    .from("treinos")
    .select("*")
    .eq("aluno_id", alunoId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    nome: data.nome ?? data.titulo ?? "Treino atual",
    descricao: data.descricao ?? data.objetivo ?? null,
    status: data.status ?? "ativo",
    data_inicio: data.data_inicio ?? data.created_at ?? null,
  };
}

async function buscarFinanceiroAtual(alunoId: string): Promise<FinanceiroResumo | null> {
  const tabelas = ["financeiro", "financeiro_alunos", "mensalidades"];

  for (const tabela of tabelas) {
    const { data, error } = await supabase
      .from(tabela)
      .select("*")
      .eq("aluno_id", alunoId)
      .order("vencimento", { ascending: true })
      .limit(10);

    if (!error && data && data.length > 0) {
      const hoje = new Date();

      const ordenados = [...data].sort((a, b) => {
        const da = new Date(a.vencimento || a.data_vencimento || a.created_at || 0).getTime();
        const db = new Date(b.vencimento || b.data_vencimento || b.created_at || 0).getTime();
        return da - db;
      });

      const proximo =
        ordenados.find((item) => {
          const dataBase = item.vencimento || item.data_vencimento || item.created_at;
          if (!dataBase) return false;
          return new Date(dataBase).getTime() >= hoje.setHours(0, 0, 0, 0);
        }) || ordenados[0];

      return {
        id: proximo.id,
        descricao: proximo.descricao ?? proximo.referencia ?? "Mensalidade",
        status: proximo.status ?? proximo.situacao ?? "pendente",
        valor: proximo.valor ?? proximo.valor_total ?? null,
        vencimento: proximo.vencimento ?? proximo.data_vencimento ?? null,
      };
    }
  }

  return null;
}

export default function AlunoPage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [avaliacao, setAvaliacao] = useState<AvaliacaoResumo | null>(null);
  const [treino, setTreino] = useState<TreinoResumo | null>(null);
  const [financeiro, setFinanceiro] = useState<FinanceiroResumo | null>(null);

  useEffect(() => {
    async function carregarPainelAluno() {
      try {
        setLoading(true);
        setErro("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error("Usuário não autenticado.");
        }

        const { data: usuarioData, error: usuarioError } = await supabase
          .from("usuarios")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (usuarioError || !usuarioData) {
          console.error("Erro ao buscar usuário:", usuarioError);
          throw new Error("Usuário não encontrado.");
        }

        setUsuario(usuarioData as Usuario);

        const alunoData = await buscarAluno(user.id, user.email);

        if (!alunoData) {
          throw new Error("Aluno não encontrado para este usuário.");
        }

        setAluno(alunoData);

        const [ultimaAvaliacao, treinoAtual, financeiroAtual] = await Promise.all([
          buscarUltimaAvaliacao(alunoData.id),
          buscarTreinoAtual(alunoData.id),
          buscarFinanceiroAtual(alunoData.id),
        ]);

        setAvaliacao(ultimaAvaliacao);
        setTreino(treinoAtual);
        setFinanceiro(financeiroAtual);
      } catch (e) {
        console.error(e);
        setErro(e instanceof Error ? e.message : "Erro ao carregar a área do aluno.");
      } finally {
        setLoading(false);
      }
    }

    carregarPainelAluno();
  }, []);

  const pesoExibicao = useMemo(() => {
    return avaliacao?.peso ?? aluno?.peso ?? null;
  }, [avaliacao, aluno]);

  const alturaExibicao = useMemo(() => {
    return avaliacao?.altura ?? aluno?.altura ?? null;
  }, [avaliacao, aluno]);

  const imcExibicao = useMemo(() => {
    return avaliacao?.imc ?? calcularImc(pesoExibicao, alturaExibicao);
  }, [avaliacao, pesoExibicao, alturaExibicao]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-slate-950 px-6 pb-16 pt-28 text-white">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
              <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">
                Área do aluno
              </p>
              <h1 className="mt-4 text-3xl font-black md:text-5xl">
                Carregando seu painel...
              </h1>
              <p className="mt-3 text-slate-400">
                Aguarde enquanto buscamos suas informações.
              </p>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (erro) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-slate-950 px-6 pb-16 pt-28 text-white">
          <div className="mx-auto max-w-5xl">
            <div className="rounded-[28px] border border-red-500/30 bg-[linear-gradient(135deg,rgba(127,29,29,0.22),rgba(15,23,42,0.92))] p-8">
              <h2 className="text-2xl font-black text-white">
                Erro ao carregar a área do aluno
              </h2>
              <p className="mt-3 text-red-100/90">{erro}</p>
              <Link
                href="/login"
                className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-cyan-400 px-6 font-bold text-slate-950 transition hover:bg-cyan-300"
              >
                Voltar para login
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="relative min-h-screen overflow-hidden bg-slate-950 px-6 pb-16 pt-28 text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.14),transparent_30%),linear-gradient(to_bottom_right,#020617,#050b1a,#0f172a)]" />
        <div className="absolute inset-0 -z-10 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:42px_42px]" />

        <div className="mx-auto max-w-7xl">
          <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">
                Área do aluno
              </p>

              <h1 className="mt-4 text-4xl font-black leading-tight text-white md:text-6xl">
                Olá, {(aluno?.nome || usuario?.nome || "Aluno").toUpperCase()}
              </h1>

              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
                Acompanhe sua evolução, visualize seus treinos, confira sua área
                financeira e acesse rapidamente o que importa no seu dia a dia.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="grid gap-3 text-sm text-slate-300">
                <div>
                  <span className="text-slate-400">E-mail:</span>{" "}
                  <span className="font-semibold text-white">
                    {aluno?.email || usuario?.email || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Objetivo:</span>{" "}
                  <span className="font-semibold text-white">
                    {aluno?.objetivo || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Próximo vencimento:</span>{" "}
                  <span className="font-semibold text-white">
                    {formatarData(financeiro?.vencimento)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Situação:</span>{" "}
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${corStatusPagamento(
                      financeiro?.status
                    )}`}
                  >
                    {financeiro?.status || "sem registro"}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300">
                Peso atual
              </p>
              <h3 className="mt-4 text-4xl font-black text-white">
                {formatarPeso(pesoExibicao)}
              </h3>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300">
                Altura
              </p>
              <h3 className="mt-4 text-4xl font-black text-white">
                {formatarAltura(alturaExibicao)}
              </h3>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300">
                Último IMC
              </p>
              <h3 className="mt-4 text-4xl font-black text-white">
                {imcExibicao ? imcExibicao : "—"}
              </h3>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300">
                Próximo vencimento
              </p>
              <h3 className="mt-4 text-2xl font-black text-white">
                {formatarData(financeiro?.vencimento)}
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                {financeiro?.valor ? formatarMoeda(financeiro.valor) : "Sem valor informado"}
              </p>
            </div>
          </section>

          <section className="mt-8 grid gap-5 lg:grid-cols-3">
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300">
                Treinos
              </p>
              <h2 className="mt-4 text-3xl font-black text-white">Seu treino atual</h2>
              <p className="mt-3 min-h-[48px] text-sm leading-7 text-slate-300">
                {treino?.nome
                  ? `${treino.nome}${treino.descricao ? ` — ${treino.descricao}` : ""}`
                  : "Você ainda não tem um treino vinculado no sistema."}
              </p>

              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-400">Status</span>
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-cyan-300">
                    {treino?.status || "sem treino"}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-400">Início</span>
                  <span className="text-sm font-semibold text-white">
                    {formatarData(treino?.data_inicio)}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/aluno/treinos"
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-5 font-bold text-cyan-300 transition hover:bg-cyan-500/20"
                >
                  Abrir treinos
                </Link>

                <Link
                  href="/aluno/treinos"
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 font-bold text-slate-950 transition hover:brightness-110"
                >
                  Iniciar treino
                </Link>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300">
                Avaliações
              </p>
              <h2 className="mt-4 text-3xl font-black text-white">Sua evolução</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Veja sua última avaliação física, dados corporais e acompanhe sua evolução.
              </p>

              <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Última avaliação</span>
                  <span className="text-sm font-semibold text-white">
                    {formatarData(avaliacao?.data)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Peso</span>
                  <span className="text-sm font-semibold text-white">
                    {formatarPeso(avaliacao?.peso)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">IMC</span>
                  <span className="text-sm font-semibold text-white">
                    {avaliacao?.imc ? avaliacao.imc : "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">% gordura</span>
                  <span className="text-sm font-semibold text-white">
                    {avaliacao?.gordura ? `${avaliacao.gordura}%` : "—"}
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <Link
                  href="/aluno/avaliacoes"
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 font-bold text-white transition hover:bg-white/10"
                >
                  Abrir avaliações
                </Link>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300">
                Financeiro
              </p>
              <h2 className="mt-4 text-3xl font-black text-white">Seus pagamentos</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Consulte mensalidades, próximos vencimentos e o status do seu financeiro.
              </p>

              <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-400">Referência</span>
                  <span className="text-right text-sm font-semibold text-white">
                    {financeiro?.descricao || "Mensalidade"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-400">Valor</span>
                  <span className="text-sm font-semibold text-white">
                    {formatarMoeda(financeiro?.valor)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-400">Vencimento</span>
                  <span className="text-sm font-semibold text-white">
                    {formatarData(financeiro?.vencimento)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-400">Status</span>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${corStatusPagamento(
                      financeiro?.status
                    )}`}
                  >
                    {financeiro?.status || "sem registro"}
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <Link
                  href="/aluno/financeiro"
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 font-bold text-white transition hover:bg-white/10"
                >
                  Abrir financeiro
                </Link>
              </div>
            </div>
          </section>

          <section className="mt-8 rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-3xl font-black text-white">Resumo da última avaliação</h2>
                <p className="mt-2 text-slate-400">
                  Um resumo rápido da sua última medição registrada.
                </p>
              </div>

              <Link
                href="/aluno/avaliacoes"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-5 text-sm font-bold text-cyan-300 transition hover:bg-cyan-500/20"
              >
                Ver histórico completo
              </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
                <p className="text-sm text-slate-400">Data</p>
                <p className="mt-2 text-2xl font-black text-white">
                  {formatarData(avaliacao?.data)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
                <p className="text-sm text-slate-400">Peso</p>
                <p className="mt-2 text-2xl font-black text-white">
                  {formatarPeso(avaliacao?.peso)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
                <p className="text-sm text-slate-400">IMC</p>
                <p className="mt-2 text-2xl font-black text-white">
                  {avaliacao?.imc ? avaliacao.imc : "—"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
                <p className="text-sm text-slate-400">% gordura</p>
                <p className="mt-2 text-2xl font-black text-white">
                  {avaliacao?.gordura ? `${avaliacao.gordura}%` : "—"}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-slate-950/30 p-5">
              <p className="text-sm text-slate-400">Observações</p>
              <p className="mt-2 leading-7 text-slate-200">
                {avaliacao?.observacoes || "Nenhuma avaliação encontrada ainda."}
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}