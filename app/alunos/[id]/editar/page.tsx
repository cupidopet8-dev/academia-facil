"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase/client";

export default function EditarAlunoPage() {
  const params = useParams();
  const router = useRouter();
  const alunoId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [sexo, setSexo] = useState("");
  const [plano, setPlano] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    async function carregarAluno() {
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
          setErro("Erro ao identificar a academia do usuário.");
          return;
        }

        const { data: aluno, error: alunoError } = await supabase
          .from("alunos")
          .select("*")
          .eq("id", alunoId)
          .eq("academia_id", perfil.academia_id)
          .single();

        if (alunoError || !aluno) {
          console.error("Erro ao buscar aluno:", alunoError);
          setErro("Aluno não encontrado.");
          return;
        }

        setNome(aluno.nome || "");
        setEmail(aluno.email || "");
        setTelefone(aluno.telefone || "");
        setDataNascimento(aluno.data_nascimento || "");
        setSexo(aluno.sexo || "");
        setPlano(aluno.plano || "");
        setObjetivo(aluno.objetivo || "");
        setPeso(aluno.peso ? String(aluno.peso) : "");
        setAltura(aluno.altura ? String(aluno.altura) : "");
        setObservacoes(aluno.observacoes || "");
      } catch (err) {
        console.error("Erro inesperado ao carregar aluno:", err);
        setErro("Erro ao carregar aluno.");
      } finally {
        setLoading(false);
      }
    }

    if (alunoId) {
      carregarAluno();
    }
  }, [alunoId]);

  async function salvarEdicao() {
    if (!nome.trim()) {
      alert("Digite o nome do aluno.");
      return;
    }

    try {
      setSalvando(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert("Usuário não autenticado.");
        return;
      }

      const { data: perfil, error: perfilError } = await supabase
        .from("usuarios")
        .select("academia_id")
        .eq("id", user.id)
        .single();

      if (perfilError || !perfil?.academia_id) {
        alert("Erro ao identificar a academia.");
        return;
      }

      const { error: updateError } = await supabase
        .from("alunos")
        .update({
          nome: nome.trim(),
          email: email.trim() || null,
          telefone: telefone.trim() || null,
          data_nascimento: dataNascimento || null,
          sexo: sexo || null,
          plano: plano || null,
          objetivo: objetivo || null,
          peso: peso ? Number(peso) : null,
          altura: altura ? Number(altura) : null,
          observacoes: observacoes.trim() || null,
        })
        .eq("id", alunoId)
        .eq("academia_id", perfil.academia_id);

      if (updateError) {
        console.error("Erro ao atualizar aluno:", updateError);
        alert(`Erro ao atualizar aluno: ${updateError.message}`);
        return;
      }

      alert("Aluno atualizado com sucesso!");
      router.push("/alunos");
      router.refresh();
    } catch (err) {
      console.error("Erro inesperado ao atualizar aluno:", err);
      alert("Ocorreu um erro inesperado ao atualizar o aluno.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.16),_transparent_28%),linear-gradient(to_bottom_right,#020617,#081127,#0f172a)] text-white">
      <Header />

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-cyan-200">
              Edição de aluno
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-white">
              Editar aluno
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
              Atualize os dados do aluno mantendo o cadastro organizado, pronto
              para avaliações, financeiro e acompanhamento físico.
            </p>
          </div>

          <Link
            href="/alunos"
            className="inline-flex w-fit items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/85 transition hover:bg-white/[0.07]"
          >
            Voltar para alunos
          </Link>
        </div>

        {loading ? (
          <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-xl">
            <h2 className="text-2xl font-semibold">Carregando aluno...</h2>
          </div>
        ) : erro ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
            {erro}
          </div>
        ) : (
          <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="border-b border-white/10 px-6 py-6 md:px-8">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-xl font-semibold text-white/90 shadow-inner">
                  ✎
                </div>

                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-white">
                    Dados do aluno
                  </h2>
                  <p className="mt-2 text-sm text-white/50">
                    Edite as informações principais do aluno sem perder o padrão
                    visual do sistema.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-8 px-6 py-6 md:px-8 md:py-8">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Field
                  label="Nome completo"
                  placeholder="Ex.: Anderson Ribeiro"
                  value={nome}
                  onChange={setNome}
                />

                <Field
                  label="E-mail"
                  placeholder="Ex.: aluno@email.com"
                  value={email}
                  onChange={setEmail}
                  type="email"
                />

                <Field
                  label="Telefone / WhatsApp"
                  placeholder="Ex.: 37999999999"
                  value={telefone}
                  onChange={setTelefone}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field
                  label="Data de nascimento"
                  placeholder=""
                  value={dataNascimento}
                  onChange={setDataNascimento}
                  type="date"
                />

                <SelectField
                  label="Sexo"
                  value={sexo}
                  onChange={setSexo}
                  options={[
                    { label: "Selecionar", value: "" },
                    { label: "Masculino", value: "Masculino" },
                    { label: "Feminino", value: "Feminino" },
                  ]}
                />

                <SelectField
                  label="Plano"
                  value={plano}
                  onChange={setPlano}
                  options={[
                    { label: "Selecionar", value: "" },
                    { label: "Mensal", value: "Mensal" },
                    { label: "Trimestral", value: "Trimestral" },
                    { label: "Semestral", value: "Semestral" },
                    { label: "Anual", value: "Anual" },
                  ]}
                />

                <SelectField
                  label="Objetivo"
                  value={objetivo}
                  onChange={setObjetivo}
                  options={[
                    { label: "Selecionar", value: "" },
                    { label: "Emagrecimento", value: "Emagrecimento" },
                    { label: "Condicionamento", value: "Condicionamento" },
                    { label: "Hipertrofia", value: "Hipertrofia" },
                  ]}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Peso atual (kg)"
                  placeholder="Ex.: 82.5"
                  value={peso}
                  onChange={setPeso}
                  type="number"
                />

                <Field
                  label="Altura (cm)"
                  placeholder="Ex.: 178"
                  value={altura}
                  onChange={setAltura}
                  type="number"
                />
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-4">
                <label className="mb-2 block text-sm text-white/55">
                  Observações
                </label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Adicione observações importantes sobre o aluno..."
                  rows={5}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-blue-400/30 focus:bg-white/[0.05]"
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                <InfoCard
                  title="Cadastro"
                  value="Atualizável"
                  description="Mantenha os dados do aluno sempre corretos no sistema."
                />
                <InfoCard
                  title="Objetivo"
                  value={objetivo || "Definir"}
                  description="Padronize o foco do aluno para facilitar treinos e avaliações."
                />
                <InfoCard
                  title="Histórico"
                  value="Ativo"
                  description="As alterações mantêm a base organizada para o acompanhamento."
                />
              </div>

              <div className="flex flex-col gap-3 pt-2 md:flex-row">
                <button
                  type="button"
                  onClick={salvarEdicao}
                  disabled={salvando}
                  className="flex-1 rounded-2xl border border-blue-400/20 bg-blue-500/15 px-5 py-3.5 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {salvando ? "Salvando alterações..." : "Salvar alterações"}
                </button>

                <Link
                  href="/alunos"
                  className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3.5 text-center text-sm font-semibold text-white/85 transition hover:bg-white/[0.07]"
                >
                  Cancelar
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-4">
      <label className="mb-2 block text-sm text-white/55">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-blue-400/30 focus:bg-white/[0.05]"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-4">
      <label className="mb-2 block text-sm text-white/55">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-blue-400/30 focus:bg-white/[0.05]"
      >
        {options.map((option) => (
          <option
            key={option.value || option.label}
            value={option.value}
            className="bg-slate-900 text-white"
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function InfoCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-5">
      <p className="text-sm text-white/40">{title}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-white/45">{description}</p>
    </div>
  );
}