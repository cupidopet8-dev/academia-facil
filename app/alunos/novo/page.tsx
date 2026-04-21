"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function NovoAlunoPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [sexo, setSexo] = useState("");
  const [plano, setPlano] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvarAluno() {
    if (!nome.trim()) {
      alert("Digite o nome do aluno.");
      return;
    }

    if (!email.trim()) {
      alert("Digite o e-mail do aluno.");
      return;
    }

    try {
      setSalvando(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert("Você precisa estar logado para cadastrar um aluno.");
        router.push("/login");
        return;
      }

      const { data: personal, error: personalError } = await supabase
        .from("usuarios")
        .select("id, email, tipo")
        .eq("email", user.email)
        .eq("tipo", "personal")
        .single();

      if (personalError || !personal?.id) {
        console.error("Erro ao encontrar personal na tabela usuarios:", personalError);
        alert("Personal inválido ou não encontrado.");
        return;
      }

      const response = await fetch("/api/alunos/criar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          telefone: telefone.trim(),
          dataNascimento,
          sexo,
          plano,
          objetivo,
          peso: peso ? Number(peso) : null,
          altura: altura ? Number(altura) : null,
          personal_id: personal.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Erro ao cadastrar aluno.");
        return;
      }

      alert("Aluno criado e e-mail enviado com sucesso!");

      setNome("");
      setEmail("");
      setTelefone("");
      setDataNascimento("");
      setSexo("");
      setPlano("");
      setObjetivo("");
      setPeso("");
      setAltura("");

      router.push("/alunos");
      router.refresh();
    } catch (err) {
      console.error("Erro inesperado ao salvar aluno:", err);
      alert("Ocorreu um erro inesperado ao salvar o aluno.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.16),_transparent_28%),linear-gradient(to_bottom_right,#020617,#081127,#0f172a)] px-4 py-5 text-white sm:px-6 sm:py-8">
      <section className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-blue-200">
              Cadastro de aluno
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl">
              Novo aluno
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
              Cadastre um novo aluno e envie um e-mail para ele criar a própria
              senha e acessar a plataforma.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex w-fit items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/85 transition hover:bg-white/[0.07]"
          >
            Voltar ao painel
          </Link>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:rounded-[32px]">
          <div className="border-b border-white/10 px-4 py-5 sm:px-6 md:px-8">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-xl font-semibold text-white/90 shadow-inner sm:h-16 sm:w-16">
                +
              </div>

              <div>
                <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                  Informações do aluno
                </h2>
                <p className="mt-2 text-sm text-white/50">
                  Preencha os dados do aluno. Após salvar, o sistema envia o
                  e-mail de acesso para ele definir a senha.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 px-4 py-5 sm:px-6 md:px-8 md:py-8">
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

            <div className="grid gap-4 xl:grid-cols-3">
              <InfoCard
                title="Acesso"
                value={email ? "Será enviado" : "Pendente"}
                description="O aluno receberá e-mail para criar a própria senha."
              />
              <InfoCard
                title="Objetivo"
                value={objetivo || "Definir"}
                description="Deixe o foco do aluno padronizado para facilitar treinos e evolução."
              />
              <InfoCard
                title="Histórico"
                value="Preparado"
                description="O aluno já fica apto para armazenar avaliações futuras."
              />
            </div>

            <div className="flex flex-col gap-3 pt-2 md:flex-row">
              <button
                type="button"
                onClick={salvarAluno}
                disabled={salvando}
                className="flex-1 rounded-2xl border border-blue-400/20 bg-blue-500/15 px-5 py-3.5 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {salvando
                  ? "Cadastrando e enviando acesso..."
                  : "Cadastrar e enviar acesso"}
              </button>

              <Link
                href="/dashboard"
                className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3.5 text-center text-sm font-semibold text-white/85 transition hover:bg-white/[0.07]"
              >
                Cancelar
              </Link>
            </div>
          </div>
        </div>
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