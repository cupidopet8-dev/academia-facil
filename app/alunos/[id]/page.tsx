"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase/client";

type Aluno = {
  id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  data_nascimento: string | null;
  sexo: string | null;
  plano: string | null;
  objetivo: string | null;
  peso: number | null;
  altura: number | null;
  observacoes: string | null;
};

type Treino = {
  id: string;
  nome: string | null;
  objetivo: string | null;
  observacoes: string | null;
  ativo: boolean | null;
};

type TreinoItem = {
  id: string;
  ordem: number | null;
  series: string | null;
  repeticoes: string | null;
  carga: string | null;
  descanso: string | null;
  observacoes: string | null;
  exercicio_nome: string | null;
  grupo_muscular: string | null;
  video_url: string | null;
};

export default function AlunoDetalhePage() {
  const params = useParams();
  const alunoId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [treino, setTreino] = useState<Treino | null>(null);
  const [itensTreino, setItensTreino] = useState<TreinoItem[]>([]);

  useEffect(() => {
    async function carregarPagina() {
      try {
        setLoading(true);
        setErro("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setErro("Usuário não autenticado.");
          return;
        }

        const { data: perfil, error: perfilError } = await supabase
          .from("usuarios")
          .select("academia_id")
          .eq("id", user.id)
          .single();

        if (perfilError || !perfil?.academia_id) {
          console.error("Erro ao buscar academia:", perfilError);
          setErro("Erro ao identificar a academia do usuário.");
          return;
        }

        const { data: alunoData, error: alunoError } = await supabase
          .from("alunos")
          .select("*")
          .eq("id", alunoId)
          .eq("academia_id", perfil.academia_id)
          .single();

        if (alunoError || !alunoData) {
          console.error("Erro ao buscar aluno:", alunoError);
          setErro("Aluno não encontrado.");
          return;
        }

        setAluno(alunoData);

        const { data: treinoData, error: treinoError } = await supabase
          .from("treinos")
          .select("*")
          .eq("aluno_id", alunoId)
          .eq("academia_id", perfil.academia_id)
          .eq("ativo", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (treinoError) {
          console.error("Erro ao buscar treino:", treinoError);
        }

        if (treinoData) {
          setTreino(treinoData);

          const { data: itensData, error: itensError } = await supabase
            .from("treino_itens")
            .select(`
              id,
              ordem,
              series,
              repeticoes,
              carga,
              descanso,
              observacoes,
              exercicios (
                nome,
                grupo_muscular,
                video_url
              )
            `)
            .eq("treino_id", treinoData.id)
            .order("ordem", { ascending: true });

          if (itensError) {
            console.error("Erro ao buscar itens do treino:", itensError);
          } else {
            const itensFormatados: TreinoItem[] =
              itensData?.map((item: any) => ({
                id: item.id,
                ordem: item.ordem,
                series: item.series,
                repeticoes: item.repeticoes,
                carga: item.carga,
                descanso: item.descanso,
                observacoes: item.observacoes,
                exercicio_nome: item.exercicios?.nome || null,
                grupo_muscular: item.exercicios?.grupo_muscular || null,
                video_url: item.exercicios?.video_url || null,
              })) || [];

            setItensTreino(itensFormatados);
          }
        } else {
          setTreino(null);
          setItensTreino([]);
        }
      } catch (err) {
        console.error("Erro inesperado:", err);
        setErro("Erro ao carregar dados do aluno.");
      } finally {
        setLoading(false);
      }
    }

    if (alunoId) {
      carregarPagina();
    }
  }, [alunoId]);

  const idade = useMemo(() => {
    if (!aluno?.data_nascimento) return null;

    const nascimento = new Date(aluno.data_nascimento);
    const hoje = new Date();

    let anos = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();

    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      anos--;
    }

    return anos;
  }, [aluno?.data_nascimento]);

  const imc = useMemo(() => {
    if (!aluno?.peso || !aluno?.altura) return null;

    const alturaM = Number(aluno.altura) / 100;
    if (!alturaM) return null;

    const resultado = Number(aluno.peso) / (alturaM * alturaM);
    return resultado.toFixed(2);
  }, [aluno?.peso, aluno?.altura]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.16),_transparent_28%),linear-gradient(to_bottom_right,#020617,#081127,#0f172a)] text-white">
      <Header />

      <section className="mx-auto max-w-7xl px-6 py-10">
        {loading ? (
          <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-10 text-center backdrop-blur-xl">
            <h2 className="text-2xl font-semibold">Carregando aluno...</h2>
          </div>
        ) : erro ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
            {erro}
          </div>
        ) : !aluno ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
            <h2 className="text-2xl font-semibold">Aluno não encontrado</h2>
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-cyan-200">
                  Perfil do aluno
                </div>

                <h1 className="text-4xl font-semibold tracking-tight text-white">
                  {aluno.nome || "Aluno"}
                </h1>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge label={aluno.objetivo || "Objetivo não definido"} />
                  <Badge label={aluno.plano || "Plano não definido"} />
                  <Badge label={aluno.sexo || "Sexo não informado"} />
                </div>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/55">
                  Visualize dados completos, treino atual, ações rápidas e
                  informações importantes para o acompanhamento do aluno.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <ActionLink
                  href={`/alunos/${aluno.id}/editar`}
                  label="Editar aluno"
                  variant="default"
                />
                <ActionLink
                  href={`/avaliacoes/nova?alunoId=${aluno.id}`}
                  label="Nova avaliação"
                  variant="blue"
                />
                <ActionLink
                  href={`/financeiro/aluno/${aluno.id}`}
                  label="Financeiro"
                  variant="green"
                />
                <ActionLink
                  href="/alunos"
                  label="Voltar"
                  variant="ghost"
                />
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-6">
                <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight">
                        Dados do aluno
                      </h2>
                      <p className="mt-1 text-sm text-white/50">
                        Informações principais do cadastro.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
                      ID: {aluno.id}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoBox label="E-mail" value={aluno.email || "Não informado"} />
                    <InfoBox
                      label="Telefone / WhatsApp"
                      value={aluno.telefone || "Não informado"}
                    />
                    <InfoBox
                      label="Data de nascimento"
                      value={formatarData(aluno.data_nascimento)}
                    />
                    <InfoBox
                      label="Idade"
                      value={idade !== null ? `${idade} anos` : "Não calculada"}
                    />
                    <InfoBox
                      label="Peso"
                      value={aluno.peso ? `${aluno.peso} kg` : "Não informado"}
                    />
                    <InfoBox
                      label="Altura"
                      value={aluno.altura ? `${aluno.altura} cm` : "Não informado"}
                    />
                    <InfoBox
                      label="IMC"
                      value={imc ? imc : "Não calculado"}
                    />
                    <InfoBox
                      label="Objetivo"
                      value={aluno.objetivo || "Não informado"}
                    />
                  </div>

                  <div className="mt-4 rounded-3xl border border-white/10 bg-slate-950/30 p-4">
                    <p className="mb-2 text-sm text-white/55">Observações</p>
                    <p className="text-sm leading-7 text-white/75">
                      {aluno.observacoes || "Nenhuma observação cadastrada."}
                    </p>
                  </div>

                  {aluno.telefone ? (
                    <div className="mt-4">
                      <a
                        href={`https://wa.me/55${somenteNumeros(aluno.telefone)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/15"
                      >
                        Abrir no WhatsApp
                      </a>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                  <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight">
                        Treino atual
                      </h2>
                      <p className="mt-1 text-sm text-white/50">
                        Ficha ativa vinculada a este aluno.
                      </p>
                    </div>

                    {treino ? (
                      <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200">
                        {treino.nome || "Treino"}
                      </div>
                    ) : null}
                  </div>

                  {!treino ? (
                    <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-6 text-center">
                      <h3 className="text-xl font-semibold">
                        Nenhum treino ativo
                      </h3>
                      <p className="mt-2 text-sm text-white/60">
                        Esse aluno ainda não possui treino ativo cadastrado.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-5 grid gap-4 md:grid-cols-2">
                        <InfoBox
                          label="Nome do treino"
                          value={treino.nome || "Não informado"}
                        />
                        <InfoBox
                          label="Objetivo do treino"
                          value={treino.objetivo || "Não informado"}
                        />
                      </div>

                      <div className="space-y-3">
                        {itensTreino.length === 0 ? (
                          <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-6 text-center text-white/65">
                            Nenhum exercício vinculado a este treino.
                          </div>
                        ) : (
                          itensTreino.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-3xl border border-white/10 bg-slate-950/30 p-5 transition hover:bg-slate-950/40"
                            >
                              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                  <div className="mb-2 inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-200">
                                    Exercício {item.ordem ?? "-"}
                                  </div>

                                  <h3 className="text-xl font-semibold text-white">
                                    {item.exercicio_nome || "Exercício"}
                                  </h3>

                                  <p className="mt-1 text-sm text-white/45">
                                    {item.grupo_muscular || "Grupo não informado"}
                                  </p>
                                </div>

                                {item.video_url ? (
                                  <a
                                    href={item.video_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/15"
                                  >
                                    Ver exercício
                                  </a>
                                ) : null}
                              </div>

                              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                <MiniInfo label="Séries" value={item.series || "-"} />
                                <MiniInfo
                                  label="Repetições"
                                  value={item.repeticoes || "-"}
                                />
                                <MiniInfo label="Carga" value={item.carga || "-"} />
                                <MiniInfo
                                  label="Descanso"
                                  value={item.descanso || "-"}
                                />
                              </div>

                              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                <p className="mb-1 text-sm text-white/50">
                                  Observações do exercício
                                </p>
                                <p className="text-sm leading-6 text-white/75">
                                  {item.observacoes || "Sem observações."}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Resumo rápido
                  </h2>
                  <p className="mt-2 text-sm text-white/55">
                    Visão rápida para consulta no atendimento.
                  </p>

                  <div className="mt-5 grid gap-3">
                    <SummaryCard
                      title="Plano"
                      value={aluno.plano || "Não definido"}
                    />
                    <SummaryCard
                      title="Objetivo"
                      value={aluno.objetivo || "Não definido"}
                    />
                    <SummaryCard
                      title="IMC"
                      value={imc || "Não calculado"}
                    />
                    <SummaryCard
                      title="Treino ativo"
                      value={treino?.nome || "Sem treino"}
                    />
                  </div>
                </div>

                <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Próximos módulos
                  </h2>
                  <p className="mt-2 text-sm text-white/55">
                    Espaço pronto para evoluir a tela.
                  </p>

                  <div className="mt-5 space-y-3">
                    <FutureItem text="Histórico de avaliações" />
                    <FutureItem text="Histórico financeiro do aluno" />
                    <FutureItem text="Envio de treino por WhatsApp" />
                    <FutureItem text="Evolução de carga por exercício" />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function formatarData(data: string | null) {
  if (!data) return "Não informada";

  const partes = data.split("-");
  if (partes.length !== 3) return data;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function somenteNumeros(valor: string) {
  return valor.replace(/\D/g, "");
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/75">
      {label}
    </span>
  );
}

function ActionLink({
  href,
  label,
  variant,
}: {
  href: string;
  label: string;
  variant: "default" | "blue" | "green" | "ghost";
}) {
  const styles = {
    default:
      "border-white/10 bg-white/[0.04] text-white/85 hover:bg-white/[0.07]",
    blue:
      "border-blue-400/20 bg-blue-500/10 text-blue-100 hover:bg-blue-500/15",
    green:
      "border-emerald-400/20 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15",
    ghost:
      "border-white/10 bg-white/[0.04] text-white/75 hover:bg-white/[0.07]",
  };

  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-2xl border px-4 py-3 text-sm font-semibold transition ${styles[variant]}`}
    >
      {label}
    </Link>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-4">
      <p className="text-sm text-white/45">{label}</p>
      <p className="mt-2 text-base font-medium text-white">{value}</p>
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs uppercase tracking-[0.15em] text-white/40">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-4">
      <p className="text-sm text-white/45">{title}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function FutureItem({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-white/70">
      {text}
    </div>
  );
}