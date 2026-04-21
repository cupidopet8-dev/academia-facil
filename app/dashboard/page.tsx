"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  const [totalAlunos, setTotalAlunos] = useState(0);
  const [totalAvaliacoes, setTotalAvaliacoes] = useState(0);
  const [totalCobrancas, setTotalCobrancas] = useState(0);

  useEffect(() => {
    async function carregarDados() {
      setLoading(true);

      // 🔥 pega usuário logado
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // 🔥 pega academia do usuário (MULTI TENANT)
      const { data: perfil } = await supabase
        .from("usuarios")
        .select("academia_id")
        .eq("id", user.id)
        .single();

      const academiaId = perfil?.academia_id;

      // 🔥 ALUNOS
      const { count: alunosCount } = await supabase
        .from("alunos")
        .select("*", { count: "exact", head: true })
        .eq("academia_id", academiaId);

      // 🔥 AVALIAÇÕES
      const { count: avaliacoesCount } = await supabase
        .from("avaliacoes")
        .select("*", { count: "exact", head: true })
        .eq("academia_id", academiaId);

      // 🔥 COBRANÇAS
      const { count: cobrancasCount } = await supabase
        .from("cobrancas")
        .select("*", { count: "exact", head: true })
        .eq("academia_id", academiaId);

      setTotalAlunos(alunosCount || 0);
      setTotalAvaliacoes(avaliacoesCount || 0);
      setTotalCobrancas(cobrancasCount || 0);

      setLoading(false);
    }

    carregarDados();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-block rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">
                Painel principal
              </span>

              <h1 className="mt-4 text-4xl font-extrabold">
                Dashboard Academia Fácil
              </h1>

              <p className="mt-3 max-w-2xl text-white/70">
                Controle total da sua academia em um só lugar.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/alunos/novo"
                className="rounded-2xl bg-blue-600 px-5 py-3 text-center font-semibold transition hover:bg-blue-700"
              >
                Novo aluno
              </Link>

              <Link
                href="/alunos"
                className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-center font-semibold transition hover:bg-white/15"
              >
                Ver alunos
              </Link>
            </div>
          </div>

          {/* STATS */}
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card
              title="Alunos"
              value={loading ? "..." : totalAlunos}
            />

            <Card
              title="Avaliações"
              value={loading ? "..." : totalAvaliacoes}
            />

            <Card
              title="Cobranças"
              value={loading ? "..." : totalCobrancas}
            />

            <Card
              title="Sistema"
              value="Online"
            />
          </div>

          {/* AÇÕES */}
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Link
              href="/alunos"
              className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
            >
              <h3 className="text-xl font-bold">Gerenciar alunos</h3>
              <p className="mt-2 text-white/65">
                Visualize, edite e acompanhe seus alunos.
              </p>
            </Link>

            <Link
              href="/cobrancas"
              className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
            >
              <h3 className="text-xl font-bold">Financeiro</h3>
              <p className="mt-2 text-white/65">
                Controle completo das cobranças.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

/* COMPONENTE CARD */
function Card({ title, value }: any) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-white/60">{title}</p>
      <h2 className="mt-3 text-3xl font-bold">{value}</h2>
    </div>
  );
}