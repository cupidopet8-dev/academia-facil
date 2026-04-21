"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase/client";

type Aluno = {
  id: string;
  user_id: string | null;
  personal_id: string | null;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  data_nascimento: string | null;
  sexo: string | null;
  altura: number | null;
  peso: number | null;
  objetivo: string | null;
  observacoes: string | null;
  created_at: string | null;
  academia_id: string | null;
  plano: string | null;
};

type Treino = {
  id: string;
  aluno_id: string;
  nome: string | null;
  created_at: string | null;
};

type TreinoItem = {
  id: string;
  treino_id: string;
  nome: string | null;
  series: number | null;
  repeticoes: number | null;
  descanso: number | null;
  ordem: number | null;
};

type TreinoComItens = Treino & {
  itens: TreinoItem[];
};

function formatDate(date?: string | null) {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleDateString("pt-BR");
  } catch {
    return "-";
  }
}

function formatDateTime(date?: string | null) {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleString("pt-BR");
  } catch {
    return "-";
  }
}

function getSaudacao() {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

export default function AlunoTreinosPage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [treinos, setTreinos] = useState<TreinoComItens[]>([]);
  const [treinoAbertoId, setTreinoAbertoId] = useState<string | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setLoading(true);
      setErro("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("Erro ao obter usuário logado:", authError);
        setErro("Não foi possível identificar o usuário logado.");
        return;
      }

      if (!user) {
        setErro("Usuário não autenticado.");
        return;
      }

      let alunoEncontrado: Aluno | null = null;

      if (user.email) {
        const { data: alunoPorEmail, error: errorAlunoEmail } = await supabase
          .from("alunos")
          .select("*")
          .eq("email", user.email)
          .maybeSingle();

        if (errorAlunoEmail) {
          console.error("Erro ao buscar aluno por e-mail:", errorAlunoEmail);
        }

        if (alunoPorEmail) {
          alunoEncontrado = alunoPorEmail as Aluno;
        }
      }

      if (!alunoEncontrado) {
        const { data: alunoPorUserId, error: errorAlunoUserId } = await supabase
          .from("alunos")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (errorAlunoUserId) {
          console.error("Erro ao buscar aluno por user_id:", errorAlunoUserId);
        }

        if (alunoPorUserId) {
          alunoEncontrado = alunoPorUserId as Aluno;
        }
      }

      if (!alunoEncontrado) {
        setErro("Aluno não encontrado para este login.");
        return;
      }

      setAluno(alunoEncontrado);

      const { data: treinosData, error: treinosError } = await supabase
        .from("treinos")
        .select("*")
        .eq("aluno_id", alunoEncontrado.id)
        .order("created_at", { ascending: false });

      if (treinosError) {
        console.error("Erro ao buscar treinos:", treinosError);
        setErro("Não foi possível carregar os treinos.");
        return;
      }

      const listaTreinos = (treinosData || []) as Treino[];

      if (listaTreinos.length === 0) {
        setTreinos([]);
        return;
      }

      const treinoIds = listaTreinos.map((treino) => treino.id);

      const { data: itensData, error: itensError } = await supabase
        .from("treino_itens")
        .select("*")
        .in("treino_id", treinoIds)
        .order("ordem", { ascending: true });

      if (itensError) {
        console.error("Erro ao buscar itens dos treinos:", itensError);
        setErro("Os treinos foram encontrados, mas houve erro ao carregar os exercícios.");
        return;
      }

      const itens = (itensData || []) as TreinoItem[];

      const treinosComItens: TreinoComItens[] = listaTreinos.map((treino) => ({
        ...treino,
        itens: itens.filter((item) => item.treino_id === treino.id),
      }));

      setTreinos(treinosComItens);

      if (treinosComItens.length > 0) {
        setTreinoAbertoId(treinosComItens[0].id);
      }
    } catch (error) {
      console.error("Erro inesperado ao carregar treinos:", error);
      setErro("Ocorreu um erro ao carregar a página.");
    } finally {
      setLoading(false);
    }
  }

  const totalTreinos = useMemo(() => treinos.length, [treinos]);

  const totalExercicios = useMemo(() => {
    return treinos.reduce((acc, treino) => acc + treino.itens.length, 0);
  }, [treinos]);

  const ultimoTreino = useMemo(() => {
    if (!treinos.length) return null;
    return treinos[0];
  }, [treinos]);

  function toggleTreino(id: string) {
    setTreinoAbertoId((atual) => (atual === id ? null : id));
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4">
          <Link
            href="/aluno"
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:border-cyan-300/40 hover:bg-cyan-400/20 hover:text-white"
          >
            ← Voltar para área do aluno
          </Link>
        </div>

        <section className="relative overflow-hidden rounded-[28px] border border-cyan-500/10 bg-gradient-to-br from-cyan-500/10 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-cyan-950/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_25%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_30%)]" />
          <div className="relative z-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.25em] text-cyan-300/80">
                  Área do aluno
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                  Meus treinos
                </h1>
                <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
                  {getSaudacao()}, {aluno?.nome || "aluno"}. Aqui você acompanha os
                  treinos que o seu personal já montou para você.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Último treino
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {ultimoTreino?.nome || "Nenhum treino disponível"}
                </p>
                <p className="text-sm text-slate-400">
                  Atualizado em: {formatDateTime(ultimoTreino?.created_at)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-6">
            <p className="text-slate-300">Carregando treinos...</p>
          </div>
        ) : erro ? (
          <div className="mt-6 rounded-[24px] border border-red-500/20 bg-red-500/10 p-6">
            <p className="font-semibold text-red-300">Erro</p>
            <p className="mt-2 text-sm text-red-200">{erro}</p>
          </div>
        ) : (
          <>
            <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur">
                <p className="text-sm text-slate-400">Treinos disponíveis</p>
                <p className="mt-3 text-3xl font-bold text-white">{totalTreinos}</p>
                <p className="mt-2 text-xs text-slate-400">
                  Total de fichas cadastradas para você
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur">
                <p className="text-sm text-slate-400">Exercícios no total</p>
                <p className="mt-3 text-3xl font-bold text-white">{totalExercicios}</p>
                <p className="mt-2 text-xs text-slate-400">
                  Somando todos os treinos cadastrados
                </p>
              </div>

              <div className="rounded-[24px] border border-cyan-500/10 bg-cyan-500/5 p-5 backdrop-blur">
                <p className="text-sm text-cyan-200">Objetivo</p>
                <p className="mt-3 text-2xl font-bold text-white">
                  {aluno?.objetivo?.trim() ? aluno.objetivo : "Não definido"}
                </p>
                <p className="mt-2 text-xs text-slate-300">
                  Informação do cadastro do aluno
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur">
                <p className="text-sm text-slate-400">Plano</p>
                <p className="mt-3 text-2xl font-bold text-white">
                  {aluno?.plano?.trim() ? aluno.plano : "Não definido"}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Plano atualmente vinculado
                </p>
              </div>
            </section>

            <section className="mt-6 rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold">Treinos criados pelo personal</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Toque em um treino para abrir os exercícios.
                  </p>
                </div>
              </div>

              {treinos.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-8 text-center text-slate-400">
                  Nenhum treino foi cadastrado para você ainda.
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  {treinos.map((treino, index) => {
                    const aberto = treinoAbertoId === treino.id;

                    return (
                      <div
                        key={treino.id}
                        className={`overflow-hidden rounded-[24px] border transition ${
                          aberto
                            ? "border-cyan-400/40 bg-cyan-500/10 shadow-lg shadow-cyan-950/20"
                            : "border-white/10 bg-slate-950/40"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleTreino(treino.id)}
                          className="w-full p-5 text-left"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                                  Treino #{index + 1}
                                </span>
                                <span className="text-sm text-slate-400">
                                  {formatDateTime(treino.created_at)}
                                </span>
                              </div>

                              <h3 className="mt-3 text-xl font-bold text-white">
                                {treino.nome?.trim() ? treino.nome : "Treino sem nome"}
                              </h3>

                              <p className="mt-1 text-sm text-slate-400">
                                {treino.itens.length}{" "}
                                {treino.itens.length === 1 ? "exercício" : "exercícios"}
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                                  Status
                                </p>
                                <p className="mt-1 text-sm font-bold text-white">
                                  {aberto ? "Aberto" : "Fechado"}
                                </p>
                              </div>

                              <div className="text-2xl text-cyan-300">
                                {aberto ? "−" : "+"}
                              </div>
                            </div>
                          </div>
                        </button>

                        {aberto && (
                          <div className="border-t border-white/10 bg-slate-950/40 p-5">
                            {treino.itens.length === 0 ? (
                              <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/40 p-6 text-center text-slate-400">
                                Este treino ainda não possui exercícios cadastrados.
                              </div>
                            ) : (
                              <div className="grid gap-4">
                                {treino.itens.map((item, itemIndex) => (
                                  <div
                                    key={item.id}
                                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                                  >
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                      <div>
                                        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                                          Exercício {item.ordem ?? itemIndex + 1}
                                        </p>
                                        <h4 className="mt-2 text-lg font-bold text-white">
                                          {item.nome?.trim()
                                            ? item.nome
                                            : "Exercício sem nome"}
                                        </h4>
                                      </div>

                                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                        <div className="rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3">
                                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                                            Séries
                                          </p>
                                          <p className="mt-1 text-base font-bold text-white">
                                            {item.series ?? "-"}
                                          </p>
                                        </div>

                                        <div className="rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3">
                                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                                            Repetições
                                          </p>
                                          <p className="mt-1 text-base font-bold text-white">
                                            {item.repeticoes ?? "-"}
                                          </p>
                                        </div>

                                        <div className="rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 col-span-2 sm:col-span-1">
                                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                                            Descanso
                                          </p>
                                          <p className="mt-1 text-base font-bold text-white">
                                            {item.descanso ?? "-"}s
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}