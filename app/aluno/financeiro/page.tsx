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
};

type Aluno = {
  id: string;
  nome: string | null;
  email: string | null;
  user_id: string | null;
  academia_id: string | null;
  personal_id: string | null;
};

type RegistroFinanceiro = {
  id: string;
  descricao: string | null;
  status: string | null;
  valor: number | null;
  vencimento: string | null;
  pagamento_em: string | null;
  referencia: string | null;
};

function formatarMoeda(valor?: number | null) {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) {
    return "R$ 0,00";
  }

  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data?: string | null) {
  if (!data) return "—";
  const dt = new Date(data);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("pt-BR");
}

function normalizarStatus(status?: string | null) {
  const valor = (status || "").trim().toLowerCase();

  if (
    valor.includes("pago") ||
    valor.includes("recebido") ||
    valor.includes("quitado")
  ) {
    return "pago";
  }

  if (
    valor.includes("pend") ||
    valor.includes("aberto") ||
    valor.includes("aguard")
  ) {
    return "pendente";
  }

  if (
    valor.includes("venc") ||
    valor.includes("atras") ||
    valor.includes("overdue")
  ) {
    return "vencido";
  }

  return valor || "sem status";
}

function classeStatus(status?: string | null) {
  const s = normalizarStatus(status);

  if (s === "pago") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
  }

  if (s === "pendente") {
    return "border-amber-400/20 bg-amber-500/10 text-amber-300";
  }

  if (s === "vencido") {
    return "border-red-400/20 bg-red-500/10 text-red-300";
  }

  return "border-white/10 bg-white/5 text-slate-300";
}

function textoStatus(status?: string | null) {
  const s = normalizarStatus(status);

  if (s === "pago") return "Pago";
  if (s === "pendente") return "Pendente";
  if (s === "vencido") return "Vencido";
  return "Sem status";
}

async function buscarAluno(userId: string, email?: string | null) {
  const { data: porUser } = await supabase
    .from("alunos")
    .select("*")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (porUser) return porUser as Aluno;

  if (email) {
    const { data: porEmail } = await supabase
      .from("alunos")
      .select("*")
      .eq("email", email)
      .limit(1)
      .maybeSingle();

    if (porEmail) {
      if (!porEmail.user_id) {
        await supabase.from("alunos").update({ user_id: userId }).eq("id", porEmail.id);
      }

      return {
        ...porEmail,
        user_id: porEmail.user_id || userId,
      } as Aluno;
    }
  }

  return null;
}

async function buscarFinanceiroAluno(alunoId: string): Promise<RegistroFinanceiro[]> {
  const tabelas = ["financeiro", "financeiro_alunos", "mensalidades"];

  for (const tabela of tabelas) {
    const { data, error } = await supabase
      .from(tabela)
      .select("*")
      .eq("aluno_id", alunoId)
      .order("vencimento", { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((item: any) => ({
        id: item.id,
        descricao: item.descricao ?? item.referencia ?? "Mensalidade",
        status: item.status ?? item.situacao ?? "pendente",
        valor: item.valor ?? item.valor_total ?? null,
        vencimento: item.vencimento ?? item.data_vencimento ?? null,
        pagamento_em: item.pagamento_em ?? item.data_pagamento ?? null,
        referencia: item.referencia ?? item.descricao ?? null,
      }));
    }
  }

  return [];
}

export default function AlunoFinanceiroPage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [registros, setRegistros] = useState<RegistroFinanceiro[]>([]);

  useEffect(() => {
    async function carregar() {
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
          throw new Error("Usuário não encontrado.");
        }

        setUsuario(usuarioData as Usuario);

        const alunoData = await buscarAluno(user.id, user.email);

        if (!alunoData) {
          throw new Error("Aluno não encontrado para este usuário.");
        }

        setAluno(alunoData);

        const financeiro = await buscarFinanceiroAluno(alunoData.id);
        setRegistros(financeiro);
      } catch (e) {
        console.error("Erro ao carregar financeiro do aluno:", e);
        setErro(
          e instanceof Error ? e.message : "Erro ao carregar a área financeira."
        );
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  const resumo = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const totalPago = registros
      .filter((item) => normalizarStatus(item.status) === "pago")
      .reduce((acc, item) => acc + Number(item.valor || 0), 0);

    const totalPendente = registros
      .filter((item) => {
        const s = normalizarStatus(item.status);
        return s === "pendente" || s === "vencido";
      })
      .reduce((acc, item) => acc + Number(item.valor || 0), 0);

    const proximoVencimento =
      [...registros]
        .filter((item) => item.vencimento)
        .sort((a, b) => {
          const da = new Date(a.vencimento || 0).getTime();
          const db = new Date(b.vencimento || 0).getTime();
          return da - db;
        })
        .find((item) => new Date(item.vencimento || 0).getTime() >= hoje.getTime()) ||
      [...registros]
        .filter((item) => item.vencimento)
        .sort((a, b) => {
          const da = new Date(a.vencimento || 0).getTime();
          const db = new Date(b.vencimento || 0).getTime();
          return da - db;
        })[0] ||
      null;

    const ultimaBaixa =
      [...registros]
        .filter((item) => normalizarStatus(item.status) === "pago")
        .sort((a, b) => {
          const da = new Date(a.pagamento_em || a.vencimento || 0).getTime();
          const db = new Date(b.pagamento_em || b.vencimento || 0).getTime();
          return db - da;
        })[0] || null;

    return {
      totalPago,
      totalPendente,
      proximoVencimento,
      ultimaBaixa,
    };
  }, [registros]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-slate-950 px-6 pb-16 pt-28 text-white">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
                Financeiro do aluno
              </p>
              <h1 className="mt-4 text-3xl font-black md:text-5xl">
                Carregando seu financeiro...
              </h1>
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
                Erro ao carregar o financeiro
              </h2>
              <p className="mt-3 text-red-100/90">{erro}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/aluno"
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-cyan-400 px-6 font-bold text-slate-950 transition hover:bg-cyan-300"
                >
                  Voltar ao painel
                </Link>
              </div>
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
                Financeiro do aluno
              </p>

              <h1 className="mt-4 text-4xl font-black leading-tight text-white md:text-6xl">
                Olá, {(aluno?.nome || usuario?.nome || "Aluno").toUpperCase()}
              </h1>

              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
                Consulte mensalidades, vencimentos, histórico de pagamentos e
                acompanhe sua situação financeira com clareza.
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
                  <span className="text-slate-400">Próximo vencimento:</span>{" "}
                  <span className="font-semibold text-white">
                    {formatarData(resumo.proximoVencimento?.vencimento)}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400">Status atual:</span>{" "}
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${classeStatus(
                      resumo.proximoVencimento?.status
                    )}`}
                  >
                    {textoStatus(resumo.proximoVencimento?.status)}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400">Último pagamento:</span>{" "}
                  <span className="font-semibold text-white">
                    {formatarData(resumo.ultimaBaixa?.pagamento_em)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300">
                Próximo vencimento
              </p>
              <h3 className="mt-4 text-2xl font-black text-white">
                {formatarData(resumo.proximoVencimento?.vencimento)}
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                {formatarMoeda(resumo.proximoVencimento?.valor)}
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300">
                Status atual
              </p>
              <div className="mt-4">
                <span
                  className={`inline-flex rounded-full border px-4 py-2 text-sm font-bold uppercase tracking-wide ${classeStatus(
                    resumo.proximoVencimento?.status
                  )}`}
                >
                  {textoStatus(resumo.proximoVencimento?.status)}
                </span>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300">
                Total pago
              </p>
              <h3 className="mt-4 text-3xl font-black text-white">
                {formatarMoeda(resumo.totalPago)}
              </h3>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300">
                Total pendente
              </p>
              <h3 className="mt-4 text-3xl font-black text-white">
                {formatarMoeda(resumo.totalPendente)}
              </h3>
            </div>
          </section>

          <section className="mt-8 grid gap-5 lg:grid-cols-3">
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300">
                Resumo financeiro
              </p>
              <h2 className="mt-4 text-3xl font-black text-white">
                Sua situação atual
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Veja rapidamente seu próximo vencimento, status da cobrança e o
                último pagamento registrado.
              </p>

              <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-400">Próxima cobrança</span>
                  <span className="text-sm font-semibold text-white">
                    {resumo.proximoVencimento?.descricao || "Mensalidade"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-400">Valor</span>
                  <span className="text-sm font-semibold text-white">
                    {formatarMoeda(resumo.proximoVencimento?.valor)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-400">Vencimento</span>
                  <span className="text-sm font-semibold text-white">
                    {formatarData(resumo.proximoVencimento?.vencimento)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-400">Último pagamento</span>
                  <span className="text-sm font-semibold text-white">
                    {formatarData(resumo.ultimaBaixa?.pagamento_em)}
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <Link
                  href="/aluno"
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-5 font-bold text-cyan-300 transition hover:bg-cyan-500/20"
                >
                  Voltar ao painel
                </Link>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl lg:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300">
                Histórico financeiro
              </p>
              <h2 className="mt-4 text-3xl font-black text-white">
                Seus lançamentos
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Acompanhe mensalidades, pagamentos realizados e cobranças em aberto.
              </p>

              {registros.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-slate-950/30 p-8 text-center text-slate-400">
                  Nenhum registro financeiro encontrado ainda.
                </div>
              ) : (
                <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
                  <div className="hidden grid-cols-[1.3fr_0.9fr_0.8fr_0.8fr_0.8fr] gap-4 border-b border-white/10 bg-slate-900/60 px-5 py-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-400 md:grid">
                    <div>Referência</div>
                    <div>Valor</div>
                    <div>Vencimento</div>
                    <div>Pagamento</div>
                    <div>Status</div>
                  </div>

                  <div className="divide-y divide-white/10">
                    {registros.map((item) => (
                      <div
                        key={item.id}
                        className="grid gap-4 bg-white/[0.03] px-5 py-5 md:grid-cols-[1.3fr_0.9fr_0.8fr_0.8fr_0.8fr] md:items-center"
                      >
                        <div>
                          <p className="text-sm font-bold text-white">
                            {item.descricao || item.referencia || "Mensalidade"}
                          </p>
                          <p className="mt-1 text-xs text-slate-400 md:hidden">
                            Valor: {formatarMoeda(item.valor)}
                          </p>
                        </div>

                        <div className="text-sm font-semibold text-white">
                          {formatarMoeda(item.valor)}
                        </div>

                        <div className="text-sm text-slate-300">
                          {formatarData(item.vencimento)}
                        </div>

                        <div className="text-sm text-slate-300">
                          {formatarData(item.pagamento_em)}
                        </div>

                        <div>
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${classeStatus(
                              item.status
                            )}`}
                          >
                            {textoStatus(item.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}