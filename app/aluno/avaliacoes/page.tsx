"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";

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

type Avaliacao = {
  id: string;
  aluno_id: string;
  peso: number | null;
  altura: number | null;
  imc: number | null;
  gordura_corporal: number | null;
  massa_muscular: number | null;
  observacoes: string | null;
  created_at: string | null;
};

type ChartMetric = "peso" | "gordura_corporal" | "massa_muscular" | "imc";

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

function formatNumber(value?: number | null, decimals = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return Number(value).toFixed(decimals).replace(".", ",");
}

function getMetricLabel(metric: ChartMetric) {
  switch (metric) {
    case "peso":
      return "Peso";
    case "gordura_corporal":
      return "Gordura Corporal";
    case "massa_muscular":
      return "Massa Muscular";
    case "imc":
      return "IMC";
    default:
      return "";
  }
}

function getMetricSuffix(metric: ChartMetric) {
  switch (metric) {
    case "peso":
      return "kg";
    case "gordura_corporal":
      return "%";
    case "massa_muscular":
      return "kg";
    case "imc":
      return "";
    default:
      return "";
  }
}

function getMetricValue(item: Avaliacao, metric: ChartMetric) {
  const value = item[metric];
  return typeof value === "number" ? value : null;
}

function getImcStatus(imc?: number | null) {
  if (imc === null || imc === undefined) return "-";
  if (imc < 18.5) return "Abaixo do peso";
  if (imc < 25) return "Peso normal";
  if (imc < 30) return "Sobrepeso";
  if (imc < 35) return "Obesidade grau I";
  if (imc < 40) return "Obesidade grau II";
  return "Obesidade grau III";
}

function buildChartPoints(data: Avaliacao[], metric: ChartMetric) {
  const valid = data
    .map((item) => ({
      id: item.id,
      date: item.created_at,
      value: getMetricValue(item, metric),
    }))
    .filter((item) => item.value !== null) as {
    id: string;
    date: string | null;
    value: number;
  }[];

  if (valid.length === 0) {
    return {
      points: "",
      dots: [] as {
        x: number;
        y: number;
        value: number;
        label: string;
        id: string;
      }[],
      min: 0,
      max: 0,
    };
  }

  const width = 100;
  const height = 100;
  const padding = 10;

  const values = valid.map((item) => item.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const dots = valid.map((item, index) => {
    const x =
      valid.length === 1
        ? width / 2
        : padding + (index * (width - padding * 2)) / (valid.length - 1);

    const normalized = (item.value - min) / range;
    const y = height - padding - normalized * (height - padding * 2);

    return {
      x,
      y,
      value: item.value,
      label: formatDate(item.date),
      id: item.id,
    };
  });

  const points = dots.map((dot) => `${dot.x},${dot.y}`).join(" ");

  return { points, dots, min, max };
}

function normalizeText(value?: string | null) {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getObjetivoLabel(objetivo?: string | null) {
  const value = normalizeText(objetivo);

  if (!value) return "Sem objetivo definido";

  if (value.includes("emag")) return "Emagrecimento";
  if (value.includes("hiper")) return "Hipertrofia";
  if (value.includes("cond")) return "Condicionamento";
  if (value.includes("recom")) return "Recomposição corporal";

  return objetivo || "Sem objetivo definido";
}

function getTargetWeight(
  objetivo?: string | null,
  pesoAtual?: number | null
): number | null {
  if (pesoAtual === null || pesoAtual === undefined) return null;

  const value = normalizeText(objetivo);

  if (value.includes("emag")) {
    return Number((pesoAtual - 5).toFixed(1));
  }

  if (value.includes("hiper")) {
    return Number((pesoAtual + 3).toFixed(1));
  }

  if (value.includes("cond")) {
    return Number(pesoAtual.toFixed(1));
  }

  if (value.includes("recom")) {
    return Number((pesoAtual - 2).toFixed(1));
  }

  return null;
}

function getMetaTexto(objetivo?: string | null, pesoAtual?: number | null) {
  const alvo = getTargetWeight(objetivo, pesoAtual);
  const objetivoLabel = getObjetivoLabel(objetivo);

  if (alvo === null) {
    return {
      titulo: objetivoLabel,
      descricao: "Meta estimada indisponível",
      pesoAlvo: null as number | null,
    };
  }

  return {
    titulo: objetivoLabel,
    descricao: `Meta estimada baseada no objetivo atual`,
    pesoAlvo: alvo,
  };
}

function getDeltaClass(delta: number | null, betterWhenLower = false) {
  if (delta === null) return "text-white";

  if (betterWhenLower) {
    return delta <= 0 ? "text-emerald-400" : "text-amber-300";
  }

  return delta >= 0 ? "text-emerald-400" : "text-amber-300";
}

function getDeltaText(delta: number | null, suffix = "", decimals = 1) {
  if (delta === null) return "-";
  const signal = delta > 0 ? "+" : "";
  return `${signal}${formatNumber(delta, decimals)}${suffix ? ` ${suffix}` : ""}`;
}

export default function AlunoAvaliacoesPage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<ChartMetric>("peso");
  const [selectedAvaliacaoId, setSelectedAvaliacaoId] = useState<string | null>(
    null
  );

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

      const { data: avaliacoesData, error: avaliacoesError } = await supabase
        .from("avaliacoes")
        .select("*")
        .eq("aluno_id", alunoEncontrado.id)
        .order("created_at", { ascending: true });

      if (avaliacoesError) {
        console.error("Erro ao buscar avaliações:", avaliacoesError);
        setErro("Não foi possível carregar as avaliações.");
        return;
      }

      const lista = (avaliacoesData || []) as Avaliacao[];
      setAvaliacoes(lista);

      if (lista.length > 0) {
        setSelectedAvaliacaoId(lista[lista.length - 1].id);
      }
    } catch (error) {
      console.error("Erro inesperado ao carregar avaliações:", error);
      setErro("Ocorreu um erro ao carregar a página.");
    } finally {
      setLoading(false);
    }
  }

  const ultimaAvaliacao = useMemo(() => {
    if (!avaliacoes.length) return null;
    return avaliacoes[avaliacoes.length - 1];
  }, [avaliacoes]);

  const primeiraAvaliacao = useMemo(() => {
    if (!avaliacoes.length) return null;
    return avaliacoes[0];
  }, [avaliacoes]);

  const avaliacaoSelecionada = useMemo(() => {
    if (!avaliacoes.length) return null;
    return (
      avaliacoes.find((item) => item.id === selectedAvaliacaoId) ||
      ultimaAvaliacao
    );
  }, [avaliacoes, selectedAvaliacaoId, ultimaAvaliacao]);

  const chart = useMemo(
    () => buildChartPoints(avaliacoes, selectedMetric),
    [avaliacoes, selectedMetric]
  );

  const resumo = useMemo(() => {
    if (!ultimaAvaliacao) {
      return {
        pesoAtual: aluno?.peso ?? null,
        alturaAtual: aluno?.altura ?? null,
        gorduraAtual: null as number | null,
        massaAtual: null as number | null,
        imcAtual: null as number | null,
        variacaoPeso: null as number | null,
      };
    }

    const pesoAtual = ultimaAvaliacao.peso ?? aluno?.peso ?? null;
    const alturaAtual = ultimaAvaliacao.altura ?? aluno?.altura ?? null;
    const gorduraAtual = ultimaAvaliacao.gordura_corporal ?? null;
    const massaAtual = ultimaAvaliacao.massa_muscular ?? null;
    const imcAtual = ultimaAvaliacao.imc ?? null;

    let variacaoPeso: number | null = null;
    if (
      primeiraAvaliacao?.peso !== null &&
      primeiraAvaliacao?.peso !== undefined &&
      ultimaAvaliacao?.peso !== null &&
      ultimaAvaliacao?.peso !== undefined
    ) {
      variacaoPeso =
        Number(ultimaAvaliacao.peso) - Number(primeiraAvaliacao.peso);
    }

    return {
      pesoAtual,
      alturaAtual,
      gorduraAtual,
      massaAtual,
      imcAtual,
      variacaoPeso,
    };
  }, [aluno, ultimaAvaliacao, primeiraAvaliacao]);

  const comparativo = useMemo(() => {
    if (!primeiraAvaliacao || !ultimaAvaliacao) {
      return {
        peso: null as number | null,
        gordura: null as number | null,
        massa: null as number | null,
        imc: null as number | null,
      };
    }

    const peso =
      primeiraAvaliacao.peso !== null &&
      primeiraAvaliacao.peso !== undefined &&
      ultimaAvaliacao.peso !== null &&
      ultimaAvaliacao.peso !== undefined
        ? Number(ultimaAvaliacao.peso) - Number(primeiraAvaliacao.peso)
        : null;

    const gordura =
      primeiraAvaliacao.gordura_corporal !== null &&
      primeiraAvaliacao.gordura_corporal !== undefined &&
      ultimaAvaliacao.gordura_corporal !== null &&
      ultimaAvaliacao.gordura_corporal !== undefined
        ? Number(ultimaAvaliacao.gordura_corporal) -
          Number(primeiraAvaliacao.gordura_corporal)
        : null;

    const massa =
      primeiraAvaliacao.massa_muscular !== null &&
      primeiraAvaliacao.massa_muscular !== undefined &&
      ultimaAvaliacao.massa_muscular !== null &&
      ultimaAvaliacao.massa_muscular !== undefined
        ? Number(ultimaAvaliacao.massa_muscular) -
          Number(primeiraAvaliacao.massa_muscular)
        : null;

    const imc =
      primeiraAvaliacao.imc !== null &&
      primeiraAvaliacao.imc !== undefined &&
      ultimaAvaliacao.imc !== null &&
      ultimaAvaliacao.imc !== undefined
        ? Number(ultimaAvaliacao.imc) - Number(primeiraAvaliacao.imc)
        : null;

    return {
      peso,
      gordura,
      massa,
      imc,
    };
  }, [primeiraAvaliacao, ultimaAvaliacao]);

  const meta = useMemo(() => {
    return getMetaTexto(aluno?.objetivo, resumo.pesoAtual);
  }, [aluno?.objetivo, resumo.pesoAtual]);

  const distanciaMeta = useMemo(() => {
    if (
      meta.pesoAlvo === null ||
      resumo.pesoAtual === null ||
      resumo.pesoAtual === undefined
    ) {
      return null;
    }

    return Number((resumo.pesoAtual - meta.pesoAlvo).toFixed(1));
  }, [meta.pesoAlvo, resumo.pesoAtual]);

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
                  Minhas avaliações
                </h1>
                <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
                  Acompanhe sua evolução física, compare os resultados anteriores
                  e visualize de forma clara o seu progresso.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Aluno
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {aluno?.nome || "Aluno"}
                </p>
                <p className="text-sm text-slate-400">
                  Última atualização: {formatDateTime(ultimaAvaliacao?.created_at)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="mt-6 grid gap-6">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-6">
              <p className="text-slate-300">Carregando avaliações...</p>
            </div>
          </div>
        ) : erro ? (
          <div className="mt-6 rounded-[24px] border border-red-500/20 bg-red-500/10 p-6">
            <p className="font-semibold text-red-300">Erro</p>
            <p className="mt-2 text-sm text-red-200">{erro}</p>
          </div>
        ) : (
          <>
            <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur">
                <p className="text-sm text-slate-400">Peso atual</p>
                <p className="mt-3 text-3xl font-bold text-white">
                  {formatNumber(resumo.pesoAtual)}{" "}
                  <span className="text-base font-medium text-cyan-300">kg</span>
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Última avaliação registrada
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur">
                <p className="text-sm text-slate-400">IMC</p>
                <p className="mt-3 text-3xl font-bold text-white">
                  {formatNumber(resumo.imcAtual)}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  {getImcStatus(resumo.imcAtual)}
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur">
                <p className="text-sm text-slate-400">Gordura corporal</p>
                <p className="mt-3 text-3xl font-bold text-white">
                  {formatNumber(resumo.gorduraAtual)}{" "}
                  <span className="text-base font-medium text-cyan-300">%</span>
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Percentual mais recente
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur">
                <p className="text-sm text-slate-400">Massa muscular</p>
                <p className="mt-3 text-3xl font-bold text-white">
                  {formatNumber(resumo.massaAtual)}{" "}
                  <span className="text-base font-medium text-cyan-300">kg</span>
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Valor mais recente
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur">
                <p className="text-sm text-slate-400">Variação de peso</p>
                <p
                  className={`mt-3 text-3xl font-bold ${
                    resumo.variacaoPeso === null
                      ? "text-white"
                      : resumo.variacaoPeso <= 0
                      ? "text-emerald-400"
                      : "text-amber-300"
                  }`}
                >
                  {resumo.variacaoPeso === null
                    ? "-"
                    : `${resumo.variacaoPeso > 0 ? "+" : ""}${formatNumber(
                        resumo.variacaoPeso
                      )}`}
                  {resumo.variacaoPeso !== null && (
                    <span className="ml-1 text-base font-medium text-slate-300">
                      kg
                    </span>
                  )}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Da primeira até a última avaliação
                </p>
              </div>
            </section>

            <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="rounded-[24px] border border-cyan-500/10 bg-cyan-500/5 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                  Objetivo
                </p>
                <p className="mt-3 text-2xl font-bold text-white">
                  {getObjetivoLabel(aluno?.objetivo)}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Foco principal atual do acompanhamento.
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Plano
                </p>
                <p className="mt-3 text-2xl font-bold text-white">
                  {aluno?.plano?.trim() ? aluno.plano : "Não definido"}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Plano atual vinculado ao seu cadastro.
                </p>
              </div>

              <div className="rounded-[24px] border border-emerald-500/10 bg-emerald-500/5 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">
                  Meta estimada
                </p>
                <p className="mt-3 text-2xl font-bold text-white">
                  {meta.pesoAlvo !== null ? `${formatNumber(meta.pesoAlvo)} kg` : "-"}
                </p>
                <p className="mt-2 text-sm text-slate-300">{meta.descricao}</p>
                <p className="mt-3 text-xs text-slate-400">
                  {distanciaMeta === null
                    ? "Sem cálculo disponível."
                    : distanciaMeta === 0
                    ? "Você está exatamente na meta estimada."
                    : distanciaMeta > 0
                    ? `Faltam ${formatNumber(distanciaMeta)} kg para atingir a meta estimada.`
                    : `Você está ${formatNumber(Math.abs(distanciaMeta))} kg abaixo da meta estimada.`}
                </p>
              </div>
            </section>

            <section className="mt-6 rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold">Comparação automática</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Comparativo entre a primeira e a última avaliação registrada.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[22px] border border-white/10 bg-slate-950/50 p-5">
                  <p className="text-sm text-slate-400">Peso</p>
                  <p className={`mt-3 text-3xl font-bold ${getDeltaClass(comparativo.peso, true)}`}>
                    {getDeltaText(comparativo.peso, "kg")}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Menor tende a ser melhor em emagrecimento
                  </p>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-slate-950/50 p-5">
                  <p className="text-sm text-slate-400">Gordura corporal</p>
                  <p className={`mt-3 text-3xl font-bold ${getDeltaClass(comparativo.gordura, true)}`}>
                    {getDeltaText(comparativo.gordura, "%")}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Queda indica melhora na composição corporal
                  </p>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-slate-950/50 p-5">
                  <p className="text-sm text-slate-400">Massa muscular</p>
                  <p className={`mt-3 text-3xl font-bold ${getDeltaClass(comparativo.massa, false)}`}>
                    {getDeltaText(comparativo.massa, "kg")}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Aumento tende a representar evolução muscular
                  </p>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-slate-950/50 p-5">
                  <p className="text-sm text-slate-400">IMC</p>
                  <p className={`mt-3 text-3xl font-bold ${getDeltaClass(comparativo.imc, true)}`}>
                    {getDeltaText(comparativo.imc)}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Comparativo geral do índice corporal
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Evolução</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Compare os resultados ao longo das avaliações.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(["peso", "gordura_corporal", "massa_muscular", "imc"] as ChartMetric[]).map(
                      (metric) => {
                        const active = selectedMetric === metric;
                        return (
                          <button
                            key={metric}
                            type="button"
                            onClick={() => setSelectedMetric(metric)}
                            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                              active
                                ? "bg-cyan-400 text-slate-950"
                                : "border border-white/10 bg-slate-900/60 text-slate-300 hover:bg-slate-800"
                            }`}
                          >
                            {getMetricLabel(metric)}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  {chart.dots.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-8 text-center text-slate-400">
                      Ainda não há dados suficientes para exibir o gráfico.
                    </div>
                  ) : (
                    <div className="rounded-[24px] border border-white/10 bg-slate-950/50 p-4">
                      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                        <div>
                          <p className="text-sm text-slate-400">
                            Métrica selecionada
                          </p>
                          <p className="text-2xl font-bold">
                            {getMetricLabel(selectedMetric)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-slate-400">Faixa</p>
                          <p className="text-sm font-medium text-slate-200">
                            {formatNumber(chart.min)} {getMetricSuffix(selectedMetric)} até{" "}
                            {formatNumber(chart.max)} {getMetricSuffix(selectedMetric)}
                          </p>
                        </div>
                      </div>

                      <div className="h-72 w-full">
                        <svg
                          viewBox="0 0 100 100"
                          className="h-full w-full overflow-visible"
                          preserveAspectRatio="none"
                        >
                          <defs>
                            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#22d3ee" />
                              <stop offset="100%" stopColor="#3b82f6" />
                            </linearGradient>
                          </defs>

                          {[20, 40, 60, 80].map((line) => (
                            <line
                              key={line}
                              x1="0"
                              y1={line}
                              x2="100"
                              y2={line}
                              stroke="rgba(255,255,255,0.08)"
                              strokeWidth="0.5"
                              strokeDasharray="2 2"
                            />
                          ))}

                          {chart.points && (
                            <polyline
                              fill="none"
                              stroke="url(#lineGradient)"
                              strokeWidth="2.5"
                              points={chart.points}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          )}

                          {chart.dots.map((dot) => (
                            <g key={dot.id}>
                              <circle
                                cx={dot.x}
                                cy={dot.y}
                                r="2.2"
                                fill="#22d3ee"
                                stroke="#082f49"
                                strokeWidth="1"
                              />
                            </g>
                          ))}
                        </svg>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                        {chart.dots.map((dot, index) => (
                          <div
                            key={`${dot.id}-${index}`}
                            className="rounded-2xl border border-white/10 bg-white/5 p-3"
                          >
                            <p className="text-xs text-slate-400">{dot.label}</p>
                            <p className="mt-1 text-lg font-semibold">
                              {formatNumber(dot.value)} {getMetricSuffix(selectedMetric)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur">
                <h2 className="text-xl font-bold">Detalhes da avaliação</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Selecione uma avaliação no histórico para ver os dados completos.
                </p>

                {!avaliacaoSelecionada ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-6 text-center text-slate-400">
                    Nenhuma avaliação disponível.
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
                    <div className="rounded-2xl border border-cyan-500/10 bg-cyan-500/5 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                        Avaliação selecionada
                      </p>
                      <p className="mt-2 text-lg font-bold">
                        {formatDateTime(avaliacaoSelecionada.created_at)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                        <p className="text-xs text-slate-400">Peso</p>
                        <p className="mt-1 text-xl font-bold">
                          {formatNumber(avaliacaoSelecionada.peso)} kg
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                        <p className="text-xs text-slate-400">Altura</p>
                        <p className="mt-1 text-xl font-bold">
                          {formatNumber(avaliacaoSelecionada.altura, 2)} m
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                        <p className="text-xs text-slate-400">IMC</p>
                        <p className="mt-1 text-xl font-bold">
                          {formatNumber(avaliacaoSelecionada.imc)}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {getImcStatus(avaliacaoSelecionada.imc)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                        <p className="text-xs text-slate-400">Gordura corporal</p>
                        <p className="mt-1 text-xl font-bold">
                          {formatNumber(avaliacaoSelecionada.gordura_corporal)} %
                        </p>
                      </div>

                      <div className="col-span-2 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                        <p className="text-xs text-slate-400">Massa muscular</p>
                        <p className="mt-1 text-xl font-bold">
                          {formatNumber(avaliacaoSelecionada.massa_muscular)} kg
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                      <p className="text-xs text-slate-400">Observações</p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-200">
                        {avaliacaoSelecionada.observacoes?.trim()
                          ? avaliacaoSelecionada.observacoes
                          : "Nenhuma observação registrada nesta avaliação."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="mt-6 rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold">Histórico de avaliações</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {avaliacoes.length}{" "}
                    {avaliacoes.length === 1
                      ? "registro encontrado"
                      : "registros encontrados"}
                  </p>
                </div>
              </div>

              {avaliacoes.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-8 text-center text-slate-400">
                  Você ainda não possui avaliações cadastradas.
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  {[...avaliacoes].reverse().map((avaliacao, index) => {
                    const selecionada = avaliacao.id === avaliacaoSelecionada?.id;

                    return (
                      <button
                        key={avaliacao.id}
                        type="button"
                        onClick={() => setSelectedAvaliacaoId(avaliacao.id)}
                        className={`w-full rounded-[24px] border p-5 text-left transition ${
                          selecionada
                            ? "border-cyan-400/50 bg-cyan-500/10 shadow-lg shadow-cyan-950/20"
                            : "border-white/10 bg-slate-950/40 hover:border-cyan-500/30 hover:bg-slate-900/70"
                        }`}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                                Avaliação #{avaliacoes.length - index}
                              </span>
                              <span className="text-sm text-slate-400">
                                {formatDateTime(avaliacao.created_at)}
                              </span>
                            </div>

                            <p className="mt-3 text-lg font-bold">
                              {avaliacao.observacoes?.trim()
                                ? "Avaliação com observações registradas"
                                : "Avaliação física registrada"}
                            </p>

                            <p className="mt-1 text-sm text-slate-400">
                              Clique para ver os detalhes completos.
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                                Peso
                              </p>
                              <p className="mt-1 text-base font-bold">
                                {formatNumber(avaliacao.peso)} kg
                              </p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                                IMC
                              </p>
                              <p className="mt-1 text-base font-bold">
                                {formatNumber(avaliacao.imc)}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                                Gordura
                              </p>
                              <p className="mt-1 text-base font-bold">
                                {formatNumber(avaliacao.gordura_corporal)} %
                              </p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                                Massa muscular
                              </p>
                              <p className="mt-1 text-base font-bold">
                                {formatNumber(avaliacao.massa_muscular)} kg
                              </p>
                            </div>
                          </div>
                        </div>
                      </button>
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