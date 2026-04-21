"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type PageProps = {
  params: Promise<{
    id: string;
    treinoId: string;
  }>;
};

type Treino = {
  id: string;
  nome: string;
};

type Exercicio = {
  id: string;
  nome: string;
  grupo_muscular: string | null;
  descricao: string | null;
  video_url: string | null;
  imagem_url: string | null;
  ativo: boolean | null;
};

type TreinoItem = {
  id: string;
  treino_id: string;
  nome: string;
  series: string | null;
  repeticoes: string | null;
  descanso: string | null;
  ordem: number | null;
};

export default function TreinoDetalhePage({ params }: PageProps) {
  const [alunoId, setAlunoId] = useState("");
  const [treinoId, setTreinoId] = useState("");

  const [treino, setTreino] = useState<Treino | null>(null);
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [itensTreino, setItensTreino] = useState<TreinoItem[]>([]);

  const [busca, setBusca] = useState("");
  const [grupoSelecionado, setGrupoSelecionado] = useState("Todos");

  const [carregandoTreino, setCarregandoTreino] = useState(true);
  const [carregandoExercicios, setCarregandoExercicios] = useState(true);
  const [carregandoItens, setCarregandoItens] = useState(true);

  const [erro, setErro] = useState("");
  const [salvandoItemId, setSalvandoItemId] = useState<string | null>(null);
  const [salvandoCamposId, setSalvandoCamposId] = useState<string | null>(null);

  useEffect(() => {
    async function resolveParams() {
      const resolved = await params;
      setAlunoId(resolved.id);
      setTreinoId(resolved.treinoId);
    }

    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!treinoId) return;

    async function carregarTreino() {
      setCarregandoTreino(true);
      setErro("");

      const { data, error } = await supabase
        .from("treinos")
        .select("id, nome")
        .eq("id", treinoId)
        .single();

      if (error) {
        console.error("Erro ao carregar treino:", error);
        setErro("Não foi possível carregar os dados do treino.");
        setCarregandoTreino(false);
        return;
      }

      setTreino(data);
      setCarregandoTreino(false);
    }

    carregarTreino();
  }, [treinoId]);

  async function carregarItensTreino(idTreino: string) {
    setCarregandoItens(true);

    const { data, error } = await supabase
      .from("treino_itens")
      .select("id, treino_id, nome, series, repeticoes, descanso, ordem")
      .eq("treino_id", idTreino)
      .order("ordem", { ascending: true });

    if (error) {
      console.error("Erro ao carregar itens do treino:", error);
      setErro("Não foi possível carregar os exercícios adicionados ao treino.");
      setItensTreino([]);
      setCarregandoItens(false);
      return;
    }

    setItensTreino((data as TreinoItem[]) || []);
    setCarregandoItens(false);
  }

  useEffect(() => {
    if (!treinoId) return;
    carregarItensTreino(treinoId);
  }, [treinoId]);

  useEffect(() => {
    async function carregarExercicios() {
      setCarregandoExercicios(true);

      let query = supabase
        .from("exercicios")
        .select("id, nome, grupo_muscular, descricao, video_url, imagem_url, ativo")
        .eq("ativo", true)
        .order("nome", { ascending: true });

      if (busca.trim()) {
        const texto = busca.trim();
        query = query.or(
          `nome.ilike.%${texto}%,grupo_muscular.ilike.%${texto}%,descricao.ilike.%${texto}%`
        );
      }

      if (grupoSelecionado !== "Todos") {
        query = query.eq("grupo_muscular", grupoSelecionado);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao carregar exercícios:", error);
        setErro("Não foi possível buscar a base de exercícios.");
        setExercicios([]);
        setCarregandoExercicios(false);
        return;
      }

      setExercicios((data as Exercicio[]) || []);
      setCarregandoExercicios(false);
    }

    carregarExercicios();
  }, [busca, grupoSelecionado]);

  const grupos = useMemo(() => {
    const lista = exercicios
      .map((item) => item.grupo_muscular?.trim())
      .filter((item): item is string => Boolean(item));

    return ["Todos", ...Array.from(new Set(lista)).sort((a, b) => a.localeCompare(b))];
  }, [exercicios]);

  async function adicionarExercicio(exercicio: Exercicio) {
    if (!treinoId) return;

    setErro("");
    setSalvandoItemId(exercicio.id);

    const proximaOrdem =
      itensTreino.length > 0
        ? Math.max(...itensTreino.map((item) => item.ordem || 0)) + 1
        : 1;

    const { error } = await supabase.from("treino_itens").insert({
      treino_id: treinoId,
      nome: exercicio.nome,
      series: "3",
      repeticoes: "12",
      descanso: "60s",
      ordem: proximaOrdem,
    });

    if (error) {
      console.error("Erro ao adicionar exercício:", error);
      setErro("Não foi possível adicionar o exercício ao treino.");
      setSalvandoItemId(null);
      return;
    }

    await carregarItensTreino(treinoId);
    setSalvandoItemId(null);
  }

  function atualizarCampoLocal(
    itemId: string,
    campo: "series" | "repeticoes" | "descanso",
    valor: string
  ) {
    setItensTreino((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, [campo]: valor } : item))
    );
  }

  async function salvarCamposItem(item: TreinoItem) {
    setErro("");
    setSalvandoCamposId(item.id);

    const { error } = await supabase
      .from("treino_itens")
      .update({
        series: item.series?.trim() || "",
        repeticoes: item.repeticoes?.trim() || "",
        descanso: item.descanso?.trim() || "",
      })
      .eq("id", item.id);

    if (error) {
      console.error("Erro ao salvar item:", error);
      setErro("Não foi possível salvar séries, repetições e descanso.");
      setSalvandoCamposId(null);
      return;
    }

    setSalvandoCamposId(null);
  }

  async function removerItem(itemId: string) {
    const confirmar = window.confirm("Deseja remover este exercício do treino?");
    if (!confirmar) return;

    setErro("");

    const { error } = await supabase.from("treino_itens").delete().eq("id", itemId);

    if (error) {
      console.error("Erro ao remover item:", error);
      setErro("Não foi possível remover o exercício do treino.");
      return;
    }

    await carregarItensTreino(treinoId);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.14),transparent_28%),linear-gradient(180deg,#020617_0%,#03112f_45%,#020617_100%)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.35em] text-cyan-400">
              Ficha do treino
            </p>

            <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
              {carregandoTreino ? "Carregando treino..." : treino?.nome || "Treino"}
            </h1>

            <p className="mt-3 max-w-3xl text-sm text-slate-300 sm:text-lg">
              Monte a ficha do aluno buscando exercícios da base e ajustando séries,
              repetições e descanso diretamente na tela.
            </p>
          </div>

          <Link
            href={`/alunos/${alunoId}/treinos`}
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-400/40 hover:bg-white/10"
          >
            ← Voltar para treinos
          </Link>
        </div>

        {erro ? (
          <div className="mb-6 rounded-3xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {erro}
          </div>
        ) : null}

        <section className="mb-8 rounded-[30px] border border-white/10 bg-white/5 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur md:p-6">
          <div className="mb-5">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-400">
              Filtros
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
              Buscar exercício na base
            </h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.3em] text-cyan-400">
                Buscar exercício
              </label>

              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Digite nome, grupo muscular ou descrição"
                className="w-full rounded-2xl border border-cyan-500/15 bg-slate-950/70 px-4 py-4 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.3em] text-cyan-400">
                Grupo muscular
              </label>

              <select
                value={grupoSelecionado}
                onChange={(e) => setGrupoSelecionado(e.target.value)}
                className="w-full rounded-2xl border border-cyan-500/15 bg-slate-950/70 px-4 py-4 text-white outline-none transition focus:border-cyan-400"
              >
                {grupos.map((grupo) => (
                  <option key={grupo} value={grupo} className="bg-slate-950 text-white">
                    {grupo}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="mb-10 rounded-[30px] border border-white/10 bg-white/5 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur md:p-6">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-400">
                Exercícios do treino
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
                Ficha montada
              </h2>
            </div>

            <div className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300">
              Total: {itensTreino.length}
            </div>
          </div>

          {carregandoItens ? (
            <div className="grid gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-3xl border border-white/10 bg-white/5 p-5"
                >
                  <div className="mb-3 h-6 w-40 animate-pulse rounded bg-white/10" />
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="h-12 animate-pulse rounded-2xl bg-white/10" />
                    <div className="h-12 animate-pulse rounded-2xl bg-white/10" />
                    <div className="h-12 animate-pulse rounded-2xl bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          ) : itensTreino.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
              <h3 className="text-2xl font-bold text-white">Nenhum exercício no treino</h3>
              <p className="mt-2 text-slate-300">
                Busque abaixo e clique em adicionar para montar a ficha.
              </p>
            </div>
          ) : (
            <div className="grid gap-5">
              {itensTreino.map((item, index) => (
                <article
                  key={item.id}
                  className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(17,24,39,0.90))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
                >
                  <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="mb-3 inline-flex rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">
                        Exercício {index + 1}
                      </div>

                      <h3 className="text-2xl font-black text-white">{item.nome}</h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => removerItem(item.id)}
                      className="inline-flex items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-200 transition hover:bg-red-500/20"
                    >
                      Remover
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.25em] text-slate-300">
                        Séries
                      </label>
                      <input
                        type="text"
                        value={item.series || ""}
                        onChange={(e) =>
                          atualizarCampoLocal(item.id, "series", e.target.value)
                        }
                        onBlur={() => salvarCamposItem(item)}
                        placeholder="Ex: 4"
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.25em] text-slate-300">
                        Repetições
                      </label>
                      <input
                        type="text"
                        value={item.repeticoes || ""}
                        onChange={(e) =>
                          atualizarCampoLocal(item.id, "repeticoes", e.target.value)
                        }
                        onBlur={() => salvarCamposItem(item)}
                        placeholder="Ex: 10 a 12"
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.25em] text-slate-300">
                        Descanso
                      </label>
                      <input
                        type="text"
                        value={item.descanso || ""}
                        onChange={(e) =>
                          atualizarCampoLocal(item.id, "descanso", e.target.value)
                        }
                        onBlur={() => salvarCamposItem(item)}
                        placeholder="Ex: 60s"
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div className="mt-4 text-xs font-medium text-cyan-300">
                    {salvandoCamposId === item.id ? "Salvando alterações..." : "Edite os campos e clique fora para salvar."}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-400">
                Base de exercícios
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
                Buscar na base
              </h2>
            </div>

            <div className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300">
              Resultados: {exercicios.length}
            </div>
          </div>

          {carregandoExercicios ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-4"
                >
                  <div className="mb-4 h-44 animate-pulse rounded-2xl bg-white/10" />
                  <div className="mb-3 h-5 w-2/3 animate-pulse rounded bg-white/10" />
                  <div className="mb-2 h-4 w-full animate-pulse rounded bg-white/10" />
                  <div className="h-11 animate-pulse rounded-2xl bg-white/10" />
                </div>
              ))}
            </div>
          ) : exercicios.length === 0 ? (
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-center">
              <h2 className="text-2xl font-bold text-white">Nenhum exercício encontrado</h2>
              <p className="mt-2 text-slate-300">
                Tente buscar por outro nome ou mudar o filtro.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {exercicios.map((exercicio) => (
                <article
                  key={exercicio.id}
                  className="group overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(17,24,39,0.90))] shadow-[0_20px_60px_rgba(0,0,0,0.30)] transition duration-300 hover:-translate-y-1 hover:border-cyan-400/30"
                >
                  <div className="relative h-52 w-full overflow-hidden bg-slate-900">
                    {exercicio.imagem_url ? (
                      <img
                        src={exercicio.imagem_url}
                        alt={exercicio.nome}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.20),transparent_40%),linear-gradient(180deg,#0f172a_0%,#111827_100%)]">
                        <span className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
                          Sem imagem
                        </span>
                      </div>
                    )}

                    <div className="absolute left-4 top-4 rounded-full border border-cyan-400/20 bg-slate-950/75 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-cyan-300 backdrop-blur">
                      {exercicio.grupo_muscular || "Sem grupo"}
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-xl font-extrabold tracking-tight text-white">
                      {exercicio.nome}
                    </h3>

                    <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-300">
                      {exercicio.descricao?.trim()
                        ? exercicio.descricao
                        : "Exercício sem descrição cadastrada."}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-3">
                      {exercicio.video_url ? (
                        <a
                          href={exercicio.video_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                        >
                          Ver vídeo
                        </a>
                      ) : (
                        <span className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300">
                          Sem vídeo
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => adicionarExercicio(exercicio)}
                        disabled={salvandoItemId === exercicio.id}
                        className="inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {salvandoItemId === exercicio.id ? "Adicionando..." : "Adicionar"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}