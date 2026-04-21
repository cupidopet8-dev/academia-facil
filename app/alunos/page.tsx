"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase/client";

type Aluno = {
  id: string;
  nome: string | null;
  telefone: string | null;
  plano: string | null;
  objetivo: string | null;
};

export default function AlunosPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    carregarAlunos();
  }, []);

  async function carregarAlunos() {
    try {
      setLoading(true);
      setErro("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setErro("Usuário não autenticado.");
        setAlunos([]);
        return;
      }

      const { data: perfil, error: perfilError } = await supabase
        .from("usuarios")
        .select("academia_id")
        .eq("id", user.id)
        .single();

      if (perfilError || !perfil?.academia_id) {
        setErro("Erro ao identificar a academia.");
        setAlunos([]);
        return;
      }

      const { data, error } = await supabase
        .from("alunos")
        .select("id, nome, telefone, plano, objetivo")
        .eq("academia_id", perfil.academia_id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setErro("Erro ao carregar alunos.");
        setAlunos([]);
        return;
      }

      setAlunos(data || []);
    } catch (e) {
      console.error(e);
      setErro("Erro inesperado ao carregar alunos.");
      setAlunos([]);
    } finally {
      setLoading(false);
    }
  }

  async function excluirAluno(id: string, nome?: string | null) {
    const confirmar = window.confirm(
      `Tem certeza que deseja excluir o aluno ${nome || "selecionado"}?\n\nEssa ação não poderá ser desfeita.`
    );

    if (!confirmar) return;

    try {
      setExcluindoId(id);

      const { error } = await supabase.from("alunos").delete().eq("id", id);

      if (error) {
        console.error(error);
        alert("Erro ao excluir aluno.");
        return;
      }

      setAlunos((prev) => prev.filter((aluno) => aluno.id !== id));
      alert("Aluno excluído com sucesso.");
    } catch (e) {
      console.error(e);
      alert("Erro inesperado ao excluir aluno.");
    } finally {
      setExcluindoId(null);
    }
  }

  const alunosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return alunos;

    return alunos.filter((aluno) => {
      const nome = aluno.nome?.toLowerCase() || "";
      const telefone = aluno.telefone?.toLowerCase() || "";
      const plano = aluno.plano?.toLowerCase() || "";
      const objetivo = aluno.objetivo?.toLowerCase() || "";

      return (
        nome.includes(termo) ||
        telefone.includes(termo) ||
        plano.includes(termo) ||
        objetivo.includes(termo)
      );
    });
  }, [alunos, busca]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(8,145,178,0.16),transparent_28%),linear-gradient(180deg,#020617_0%,#07112b_55%,#0a1738_100%)] text-white">
      <Header />

      <section className="mx-auto max-w-7xl px-6 pb-16 pt-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm uppercase tracking-[0.35em] text-cyan-300/90">
              Academia Fácil
            </p>

            <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
              Alunos
            </h1>

            <p className="mt-4 text-base text-slate-300 md:text-lg">
              Gerencie os alunos cadastrados, acesse avaliações, treinos,
              financeiro e edição completa do cadastro.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/alunos/novo"
              className="inline-flex h-14 items-center justify-center rounded-2xl bg-cyan-500 px-7 text-base font-bold text-slate-950 shadow-[0_0_30px_rgba(6,182,212,0.35)] transition hover:bg-cyan-400"
            >
              + Novo aluno
            </Link>
          </div>
        </div>

        <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="w-full md:max-w-xl">
              <label
                htmlFor="busca-aluno"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Buscar aluno
              </label>

              <input
                id="busca-aluno"
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Digite nome, telefone, plano ou objetivo..."
                className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                Total:{" "}
                <span className="font-bold text-white">{alunos.length}</span>
              </div>

              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3">
                Exibindo:{" "}
                <span className="font-bold text-cyan-300">
                  {alunosFiltrados.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-slate-300">
            Carregando alunos...
          </div>
        )}

        {!loading && erro && (
          <div className="mt-10 rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
            {erro}
          </div>
        )}

        {!loading && !erro && alunos.length === 0 && (
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
            <h2 className="text-2xl font-bold text-white">
              Nenhum aluno cadastrado
            </h2>
            <p className="mt-2 text-slate-300">
              Cadastre o primeiro aluno para começar a gerenciar treinos,
              avaliações e pagamentos.
            </p>

            <Link
              href="/alunos/novo"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-cyan-500 px-6 font-bold text-slate-950 transition hover:bg-cyan-400"
            >
              Cadastrar aluno
            </Link>
          </div>
        )}

        {!loading && !erro && alunos.length > 0 && alunosFiltrados.length === 0 && (
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
            <h2 className="text-2xl font-bold text-white">
              Nenhum aluno encontrado
            </h2>
            <p className="mt-2 text-slate-300">
              Tente buscar por nome, telefone, plano ou objetivo.
            </p>
          </div>
        )}

        {!loading && !erro && alunosFiltrados.length > 0 && (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {alunosFiltrados.map((aluno) => (
              <article
                key={aluno.id}
                className="rounded-[28px] border border-white/10 bg-white/[0.05] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.30)] backdrop-blur"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-3xl font-black uppercase tracking-tight text-white">
                      {aluno.nome || "Sem nome"}
                    </h2>
                  </div>

                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                    Aluno
                  </span>
                </div>

                <div className="space-y-3 text-[15px] text-slate-300">
                  <p>
                    <span className="text-slate-400">Telefone:</span>{" "}
                    <span className="font-medium text-white">
                      {aluno.telefone || "Não informado"}
                    </span>
                  </p>

                  <p>
                    <span className="text-slate-400">Plano:</span>{" "}
                    <span className="font-medium text-white">
                      {aluno.plano || "Não informado"}
                    </span>
                  </p>

                  <p>
                    <span className="text-slate-400">Objetivo:</span>{" "}
                    <span className="font-medium text-white">
                      {aluno.objetivo || "Não informado"}
                    </span>
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <ActionLink href={`/alunos/${aluno.id}`} label="Ver aluno" />

                  <ActionLink
                    href={`/alunos/${aluno.id}/editar`}
                    label="Editar"
                    variant="secondary"
                  />

                  <ActionLink
                   href={`/alunos/${aluno.id}/avaliar`}
                    label="Avaliar"
                    variant="blue"
                  />

                  <ActionLink
                    href={`/alunos/${aluno.id}/treinos`}
                    label="Treinos"
                    variant="green"
                  />

                  <ActionLink
                    href={`/alunos/${aluno.id}/financeiro`}
                    label="Financeiro"
                    variant="green"
                  />

                  <button
                    type="button"
                    onClick={() => excluirAluno(aluno.id, aluno.nome)}
                    disabled={excluindoId === aluno.id}
                    className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {excluindoId === aluno.id ? "Excluindo..." : "Excluir"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function ActionLink({
  href,
  label,
  variant = "primary",
}: {
  href: string;
  label: string;
  variant?: "primary" | "secondary" | "blue" | "green";
}) {
  const styles = {
    primary:
      "border-cyan-400/20 bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30",
    secondary:
      "border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]",
    blue: "border-blue-400/20 bg-blue-500/20 text-blue-200 hover:bg-blue-500/30",
    green:
      "border-emerald-400/20 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25",
  };

  return (
    <Link
      href={href}
      className={`inline-flex min-h-[48px] items-center justify-center rounded-2xl border px-4 py-3 text-sm font-bold transition ${styles[variant]}`}
    >
      {label}
    </Link>
  );
}