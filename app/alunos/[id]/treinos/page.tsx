"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type Treino = {
  id: string;
  aluno_id: string;
  nome: string;
};

export default function AlunoTreinosPage({ params }: PageProps) {
  const router = useRouter();

  const [alunoId, setAlunoId] = useState("");
  const [nomeTreino, setNomeTreino] = useState("");
  const [busca, setBusca] = useState("");
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function resolverParams() {
      const resolved = await params;
      setAlunoId(resolved.id);
    }

    resolverParams();
  }, [params]);

  async function carregarTreinos(idAluno: string) {
    if (!idAluno) return;

    setCarregando(true);
    setErro("");

    const { data, error } = await supabase
      .from("treinos")
      .select("id, aluno_id, nome")
      .eq("aluno_id", idAluno)
      .order("nome", { ascending: true });

    if (error) {
      console.error("Erro ao carregar treinos:", error);
      setErro("Não foi possível carregar os treinos.");
      setTreinos([]);
      setCarregando(false);
      return;
    }

    setTreinos((data as Treino[]) || []);
    setCarregando(false);
  }

  useEffect(() => {
    if (!alunoId) return;
    carregarTreinos(alunoId);
  }, [alunoId]);

  async function criarTreino(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!alunoId) {
      setErro("Aluno não identificado.");
      return;
    }

    if (!nomeTreino.trim()) {
      setErro("Digite o nome do treino.");
      return;
    }

    setSalvando(true);
    setErro("");

    const { data, error } = await supabase
      .from("treinos")
      .insert({
        aluno_id: alunoId,
        nome: nomeTreino.trim(),
      })
      .select("id, aluno_id, nome")
      .single();

    if (error) {
      console.error("Erro ao criar treino:", error);
      setErro("Não foi possível criar o treino.");
      setSalvando(false);
      return;
    }

    setNomeTreino("");
    await carregarTreinos(alunoId);
    setSalvando(false);

    if (data?.id) {
      router.push(`/alunos/${alunoId}/treinos/${data.id}`);
    }
  }

  async function excluirTreino(treinoId: string) {
    const confirmar = window.confirm("Deseja realmente excluir este treino?");
    if (!confirmar) return;

    setErro("");
    setExcluindoId(treinoId);

    const { error } = await supabase.from("treinos").delete().eq("id", treinoId);

    if (error) {
      console.error("Erro ao excluir treino:", error);
      setErro("Não foi possível excluir o treino.");
      setExcluindoId(null);
      return;
    }

    await carregarTreinos(alunoId);
    setExcluindoId(null);
  }

  const treinosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return treinos;

    return treinos.filter((treino) =>
      treino.nome.toLowerCase().includes(termo)
    );
  }, [treinos, busca]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.10),transparent_30%),linear-gradient(180deg,#020617_0%,#06111f_45%,#020617_100%)] text-white">
      <div className="mx-auto w-full max-w-5xl px-3 py-4 sm:px-4 sm:py-6">
        {/* TOPO */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur sm:p-5">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-300">
                Treinos
              </p>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
                Treinos do aluno
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Crie, busque e abra treinos de forma rápida.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-cyan-400/15 bg-cyan-500/10 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300">
                  Total
                </p>
                <h2 className="mt-1 text-2xl font-black text-white">
                  {treinos.length}
                </h2>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  Busca
                </p>
                <h2 className="mt-1 text-2xl font-black text-white">
                  {treinosFiltrados.length}
                </h2>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/alunos"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                ← Voltar
              </Link>

              <button
                type="button"
                onClick={() => carregarTreinos(alunoId)}
                className="inline-flex items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/15"
              >
                Atualizar
              </button>
            </div>
          </div>
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-[320px_1fr]">
          {/* CRIAR */}
          <aside className="rounded-3xl border border-white/10 bg-white/[0.05] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur">
            <div className="mb-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-300">
                Novo treino
              </p>
              <h2 className="mt-2 text-xl font-black text-white">
                Criar treino
              </h2>
            </div>

            <form onSubmit={criarTreino} className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-200">
                  Nome
                </label>

                <input
                  type="text"
                  value={nomeTreino}
                  onChange={(e) => setNomeTreino(e.target.value)}
                  placeholder="Ex: Treino A"
                  className="w-full rounded-2xl border border-cyan-500/20 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
                />
              </div>

              <button
                type="submit"
                disabled={salvando}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {salvando ? "Criando..." : "Criar treino"}
              </button>
            </form>

            {erro ? (
              <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {erro}
              </div>
            ) : null}

            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-3">
              <p className="text-xs text-slate-300">
                Use nomes curtos como <span className="font-semibold text-white">Treino A</span>,{" "}
                <span className="font-semibold text-white">Treino B</span> ou{" "}
                <span className="font-semibold text-white">Superior</span>.
              </p>
            </div>
          </aside>

          {/* LISTA */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur">
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-300">
                  Lista
                </p>
                <h2 className="mt-2 text-xl font-black text-white">
                  Treinos cadastrados
                </h2>
              </div>

              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar treino..."
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>

            {carregando ? (
              <div className="mt-4 grid gap-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="h-5 w-28 animate-pulse rounded bg-white/10" />
                    <div className="mt-3 h-10 w-full animate-pulse rounded-2xl bg-white/10" />
                  </div>
                ))}
              </div>
            ) : treinos.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-10 text-center">
                <div className="text-3xl">🏋️</div>
                <h3 className="mt-3 text-lg font-black text-white">
                  Nenhum treino cadastrado
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Crie o primeiro treino para esse aluno.
                </p>
              </div>
            ) : treinosFiltrados.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-10 text-center">
                <div className="text-3xl">🔎</div>
                <h3 className="mt-3 text-lg font-black text-white">
                  Nada encontrado
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Tente buscar com outro nome.
                </p>
              </div>
            ) : (
              <div className="mt-4 grid gap-3">
                {treinosFiltrados.map((treino, index) => (
                  <article
                    key={treino.id}
                    className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(17,24,39,0.88))] p-4 transition hover:border-cyan-400/20"
                  >
                    <div className="flex flex-col gap-3">
                      <div>
                        <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300">
                          Treino {index + 1}
                        </span>

                        <h3 className="mt-3 text-lg font-black text-white">
                          {treino.nome}
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          href={`/alunos/${alunoId}/treinos/${treino.id}`}
                          className="inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-3 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-400"
                        >
                          Abrir
                        </Link>

                        <button
                          type="button"
                          onClick={() => excluirTreino(treino.id)}
                          disabled={excluindoId === treino.id}
                          className="inline-flex items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/10 px-3 py-3 text-sm font-bold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {excluindoId === treino.id ? "..." : "Excluir"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}