"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Aluno = {
  id?: number | string | null;
  nome?: string | null;
  email?: string | null;
  telefone?: string | null;
  celular?: string | null;
  whatsapp?: string | null;
  fone?: string | null;
  numero?: string | null;
  idade?: number | string | null;
  sexo?: string | null;
  altura?: number | string | null;
  peso?: number | string | null;
  plano?: string | null;
  nome_plano?: string | null;
  plano_nome?: string | null;
  tipo_plano?: string | null;
};

type Props = {
  aluno: Aluno | null;
};

type Aba = "resumo" | "composicao" | "bio" | "progresso";

const abas: { id: Aba; label: string }[] = [
  { id: "resumo", label: "Visão Geral" },
  { id: "composicao", label: "Composição Corporal" },
  { id: "bio", label: "Bioimpedância" },
  { id: "progresso", label: "Progresso" },
];

export default function AlunoDetalheClient({ aluno }: Props) {
  const [aba, setAba] = useState<Aba>("resumo");
  const [salvando, setSalvando] = useState(false);

  const [dobras, setDobras] = useState({
    peitoral: "",
    axilar: "",
    triceps: "",
    subescapular: "",
    abdomen: "",
    supra: "",
    coxa: "",
  });

  const telefoneAluno = useMemo(() => {
    return (
      aluno?.telefone ||
      aluno?.celular ||
      aluno?.whatsapp ||
      aluno?.fone ||
      aluno?.numero ||
      ""
    );
  }, [aluno]);

  const planoAluno = useMemo(() => {
    return (
      aluno?.plano ||
      aluno?.nome_plano ||
      aluno?.plano_nome ||
      aluno?.tipo_plano ||
      "Não informado"
    );
  }, [aluno]);

  const somaDobras = useMemo(() => {
    return Object.values(dobras).reduce(
      (acc, val) => acc + Number(val || 0),
      0
    );
  }, [dobras]);

  const percentualGordura = useMemo(() => {
    if (!somaDobras || !aluno?.idade) return 0;

    const idade = Number(aluno.idade);

    const densidade =
      1.112 -
      0.00043499 * somaDobras +
      0.00000055 * somaDobras * somaDobras -
      0.00028826 * idade;

    const gordura = 495 / densidade - 450;

    if (!Number.isFinite(gordura)) return 0;

    return Number(gordura.toFixed(1));
  }, [somaDobras, aluno]);

  const imc = useMemo(() => {
    if (!aluno?.peso || !aluno?.altura) return "0.0";

    const peso = Number(aluno.peso);
    const alturaM = Number(aluno.altura) / 100;

    if (!alturaM || !Number.isFinite(alturaM)) return "0.0";

    return (peso / (alturaM * alturaM)).toFixed(1);
  }, [aluno]);

  const massaMagra = useMemo(() => {
    if (!aluno?.peso || !percentualGordura) return "0.0";

    const peso = Number(aluno.peso);
    const gordura = Number(percentualGordura);

    const resultado = peso * (1 - gordura / 100);

    if (!Number.isFinite(resultado)) return "0.0";

    return resultado.toFixed(1);
  }, [aluno, percentualGordura]);

  function enviarWhatsapp() {
    if (!telefoneAluno) {
      alert("Aluno não tem telefone cadastrado.");
      return;
    }

    const telefoneLimpo = telefoneAluno.replace(/\D/g, "");
    const telefoneFinal = telefoneLimpo.startsWith("55")
      ? telefoneLimpo
      : `55${telefoneLimpo}`;

    const mensagem = `🏋️ *AVALIAÇÃO FÍSICA COMPLETA*

Olá, *${aluno?.nome || "Aluno"}*.

Sua avaliação foi realizada com sucesso. Confira abaixo seus dados atualizados:

📌 *DADOS DO ALUNO*
• Nome: *${aluno?.nome || "--"}*
• Plano: *${planoAluno || "--"}*
• Peso: *${aluno?.peso || "--"} kg*
• Altura: *${aluno?.altura || "--"} cm*
• Idade: *${aluno?.idade || "--"}*
• Sexo: *${aluno?.sexo || "--"}*

📊 *RESULTADOS DA AVALIAÇÃO*
• Soma das dobras: *${somaDobras} mm*
• Gordura corporal: *${percentualGordura}%*
• Massa magra: *${massaMagra} kg*
• IMC: *${imc}*

📈 *ACOMPANHAMENTO*
Seu acompanhamento já está ativo e será utilizado para monitoramento da sua evolução física.

💬 Em caso de dúvidas, fale com seu personal para ajustes no seu planejamento.

✨ *Academia Fácil*
Acompanhamento profissional com tecnologia e precisão.`;

    const url = `https://wa.me/${telefoneFinal}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank");
  }

  async function salvarAvaliacao() {
    if (!aluno?.id) {
      alert("Aluno sem ID para salvar avaliação.");
      return;
    }

    setSalvando(true);

    const payload = {
dobra_peitoral: Number(dobras.peitoral || 0),
dobra_axilar: Number(dobras.axilar || 0),
dobra_triceps: Number(dobras.triceps || 0),
dobra_subescapular: Number(dobras.subescapular || 0),
dobra_abdominal: Number(dobras.abdomen || 0),
dobra_suprailiaca: Number(dobras.supra || 0),
dobra_coxa: Number(dobras.coxa || 0),

gordura_percent: Number(percentualGordura || 0),
massa_magra: Number(massaMagra || 0),
imc: Number(imc || 0),
    };

    const { error } = await supabase.from("avaliacoes").insert(payload);

    setSalvando(false);

    if (error) {
      console.error("Erro ao salvar avaliação:", error);
      alert(`Erro ao salvar avaliação: ${error.message}`);
      return;
    }

    alert("Avaliação salva com sucesso!");
  }

  const iniciais = useMemo(() => {
    const nome = (aluno?.nome || "Aluno").trim();
    const partes = nome.split(" ").filter(Boolean);

    if (partes.length >= 2) {
      return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
    }

    return nome.slice(0, 1).toUpperCase();
  }, [aluno]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.10),_transparent_28%),linear-gradient(to_bottom_right,#020617,#081127,#0f172a)] px-6 py-10 text-white">
      <section className="mx-auto max-w-6xl space-y-8">
        <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-xl font-semibold text-white/90 shadow-inner">
                {iniciais}
              </div>

              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  {aluno?.nome || "Aluno"}
                </h1>
                <p className="mt-1 text-sm text-white/50">
                  {aluno?.email || "Sem e-mail cadastrado"}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <button
                onClick={enviarWhatsapp}
                className="rounded-2xl border border-emerald-400/20 bg-emerald-500/15 px-5 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20 hover:shadow-[0_10px_30px_rgba(16,185,129,0.18)]"
              >
                Enviar avaliação no WhatsApp
              </button>

              <div className="inline-flex w-fit items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300">
                Perfil ativo
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-t border-white/10 p-6 md:grid-cols-2 xl:grid-cols-5 md:p-8">
            <InfoCard label="Telefone" value={telefoneAluno || "Não informado"} />
            <InfoCard label="Plano" value={planoAluno || "Não informado"} />
            <InfoCard label="Idade" value={aluno?.idade || "Não informado"} />
            <InfoCard label="Sexo" value={aluno?.sexo || "Não informado"} />
            <InfoCard label="Última avaliação" value="Hoje" />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {abas.map((item) => {
            const ativo = aba === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setAba(item.id)}
                className={`rounded-2xl border px-5 py-3 text-sm font-medium transition-all duration-200 ${
                  ativo
                    ? "border-white/15 bg-white/10 text-white shadow-[0_10px_30px_rgba(255,255,255,0.05)]"
                    : "border-white/5 bg-white/[0.03] text-white/55 hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/[0.035] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.30)] backdrop-blur-xl md:p-8">
          {aba === "resumo" && (
            <div className="space-y-6">
              <SectionHeader
                title="Visão Geral"
                subtitle="Resumo rápido do aluno, métricas principais e acompanhamento físico."
              />

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  title="Peso atual"
                  value={aluno?.peso ? `${aluno.peso} kg` : "--"}
                  hint="Último registro"
                />
                <MetricCard
                  title="Altura"
                  value={aluno?.altura ? `${aluno.altura} cm` : "--"}
                  hint="Cadastro"
                />
                <MetricCard
                  title="Plano atual"
                  value={planoAluno || "--"}
                  hint="Plano vinculado ao aluno"
                />
                <MetricCard
                  title="Telefone"
                  value={telefoneAluno || "--"}
                  hint="Contato principal"
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
                <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Tendência física
                      </h3>
                      <p className="text-sm text-white/45">
                        Visão visual da evolução recente
                      </p>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50">
                      Últimos 7 registros
                    </div>
                  </div>

                  <div className="flex h-56 items-end gap-3 rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent p-4">
                    {[38, 46, 41, 56, 52, 67, 62].map((h, i) => (
                      <div key={i} className="flex h-full flex-1 flex-col justify-end gap-2">
                        <div
                          className="w-full rounded-t-xl rounded-b-md border border-blue-400/10 bg-gradient-to-t from-blue-500/35 via-blue-400/20 to-blue-300/10 shadow-[0_8px_20px_rgba(37,99,235,0.12)]"
                          style={{ height: `${h}%` }}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex justify-between px-1 text-xs text-white/35">
                    <span>Jan</span>
                    <span>Fev</span>
                    <span>Mar</span>
                    <span>Abr</span>
                    <span>Mai</span>
                    <span>Jun</span>
                    <span>Jul</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <InsightCard
                    title="Status geral"
                    value="Bom acompanhamento"
                    description="Aluno pronto para iniciar histórico de avaliações e comparações."
                  />
                  <InsightCard
                    title="Próxima ação"
                    value="Registrar composição corporal"
                    description="Preencha a avaliação para liberar os indicadores automáticos."
                  />
                  <InsightCard
                    title="Plano do aluno"
                    value={planoAluno || "Não informado"}
                    description="Informação exibida automaticamente no perfil e no envio por WhatsApp."
                  />
                </div>
              </div>
            </div>
          )}

          {aba === "composicao" && (
            <div className="space-y-6">
              <SectionHeader
                title="Composição Corporal"
                subtitle="Avaliação por protocolo de 7 pontos, preparada para cálculo e histórico."
              />

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <InputCard
                  label="Peitoral"
                  placeholder="Ex.: 12"
                  value={dobras.peitoral}
                  onChange={(v) => setDobras({ ...dobras, peitoral: v })}
                />
                <InputCard
                  label="Axilar média"
                  placeholder="Ex.: 10"
                  value={dobras.axilar}
                  onChange={(v) => setDobras({ ...dobras, axilar: v })}
                />
                <InputCard
                  label="Tríceps"
                  placeholder="Ex.: 14"
                  value={dobras.triceps}
                  onChange={(v) => setDobras({ ...dobras, triceps: v })}
                />
                <InputCard
                  label="Subescapular"
                  placeholder="Ex.: 11"
                  value={dobras.subescapular}
                  onChange={(v) => setDobras({ ...dobras, subescapular: v })}
                />
                <InputCard
                  label="Abdômen"
                  placeholder="Ex.: 18"
                  value={dobras.abdomen}
                  onChange={(v) => setDobras({ ...dobras, abdomen: v })}
                />
                <InputCard
                  label="Supra-ilíaca"
                  placeholder="Ex.: 13"
                  value={dobras.supra}
                  onChange={(v) => setDobras({ ...dobras, supra: v })}
                />
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-4">
                <label className="mb-2 block text-sm text-white/55">Coxa</label>
                <input
                  type="number"
                  value={dobras.coxa}
                  onChange={(e) => setDobras({ ...dobras, coxa: e.target.value })}
                  placeholder="Ex.: 16"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-blue-400/30 focus:bg-white/[0.05]"
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-4">
                <MetricCard
                  title="Soma das medidas"
                  value={`${somaDobras} mm`}
                  hint="Calculado automaticamente"
                />
                <MetricCard
                  title="% de gordura"
                  value={`${percentualGordura}%`}
                  hint="Cálculo automático"
                />
                <MetricCard
                  title="Massa magra"
                  value={`${massaMagra} kg`}
                  hint="Estimativa automática"
                />
                <MetricCard
                  title="IMC"
                  value={imc}
                  hint="Baseado no peso e altura"
                />
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                <button
                  type="button"
                  className="flex-1 rounded-2xl border border-blue-400/20 bg-blue-500/15 px-5 py-3 font-medium text-blue-100 transition hover:bg-blue-500/20"
                >
                  Calcular composição
                </button>

                <button
                  type="button"
                  onClick={salvarAvaliacao}
                  disabled={salvando}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 font-medium text-white/85 transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {salvando ? "Salvando..." : "Salvar avaliação"}
                </button>
              </div>
            </div>
          )}

          {aba === "bio" && (
            <div className="space-y-6">
              <SectionHeader
                title="Bioimpedância"
                subtitle="Área preparada para registrar dados do analisador corporal."
              />

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <InputCard
                  label="Peso"
                  placeholder="Ex.: 82.4 kg"
                  value=""
                  onChange={() => {}}
                />
                <InputCard
                  label="Altura"
                  placeholder="Ex.: 178 cm"
                  value=""
                  onChange={() => {}}
                />
                <InputCard
                  label="% de gordura"
                  placeholder="Ex.: 18.7"
                  value=""
                  onChange={() => {}}
                />
                <InputCard
                  label="Massa magra"
                  placeholder="Ex.: 66.3 kg"
                  value=""
                  onChange={() => {}}
                />
                <InputCard
                  label="Água corporal"
                  placeholder="Ex.: 54%"
                  value=""
                  onChange={() => {}}
                />
                <InputCard
                  label="IMC"
                  placeholder="Ex.: 25.4"
                  value=""
                  onChange={() => {}}
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                <MetricCard title="Classificação" value="--" hint="Será exibida aqui" />
                <MetricCard title="Objetivo" value="--" hint="Defina junto ao aluno" />
                <MetricCard title="Observações" value="--" hint="Área pronta para expansão" />
              </div>

              <button
                type="button"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 font-medium text-white/85 transition hover:bg-white/[0.07]"
              >
                Salvar bioimpedância
              </button>
            </div>
          )}

          {aba === "progresso" && (
            <div className="space-y-6">
              <SectionHeader
                title="Progresso"
                subtitle="Comparação de indicadores corporais com visual mais executivo."
              />

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  title="Peso"
                  value={aluno?.peso ? `${aluno.peso} kg` : "--"}
                  hint="Comparação com última avaliação"
                />
                <MetricCard
                  title="% de gordura"
                  value={`${percentualGordura}%`}
                  hint="Comparação com última avaliação"
                />
                <MetricCard
                  title="Massa magra"
                  value={`${massaMagra} kg`}
                  hint="Comparação com última avaliação"
                />
                <MetricCard
                  title="IMC"
                  value={imc}
                  hint="Comparação com última avaliação"
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-5">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">Evolução comparativa</h3>
                    <p className="text-sm text-white/45">
                      Painel visual preparado para histórico real
                    </p>
                  </div>

                  <div className="space-y-4">
                    <ProgressRow label="Peso corporal" value="72%" />
                    <ProgressRow label="Redução de gordura" value="58%" />
                    <ProgressRow label="Massa magra" value="81%" />
                    <ProgressRow label="Consistência de avaliações" value="44%" />
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-5">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">Comparação rápida</h3>
                    <p className="text-sm text-white/45">
                      Visão pronta para exibir antes x depois
                    </p>
                  </div>

                  <div className="space-y-3">
                    <ComparisonCard
                      label="Peso"
                      before="--"
                      after={aluno?.peso ? `${aluno.peso} kg` : "--"}
                    />
                    <ComparisonCard
                      label="% Gordura"
                      before="--"
                      after={`${percentualGordura}%`}
                    />
                    <ComparisonCard
                      label="Massa magra"
                      before="--"
                      after={`${massaMagra} kg`}
                    />
                    <ComparisonCard
                      label="IMC"
                      before="--"
                      after={imc}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight text-white">{title}</h2>
      <p className="mt-2 text-sm text-white/50">{subtitle}</p>
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-white/35">{label}</p>
      <p className="mt-2 text-lg font-medium text-white/90">{value}</p>
    </div>
  );
}

function MetricCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-5">
      <p className="text-sm text-white/45">{title}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-xs text-white/30">{hint}</p>
    </div>
  );
}

function InsightCard({
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

function InputCard({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-4">
      <label className="mb-2 block text-sm text-white/55">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-blue-400/30 focus:bg-white/[0.05]"
      />
    </div>
  );
}

function ProgressRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-white/65">{label}</span>
        <span className="text-white/45">{value}</span>
      </div>
      <div className="h-3 rounded-full bg-white/5">
        <div
          className="h-3 rounded-full bg-gradient-to-r from-blue-500/70 via-blue-400/55 to-cyan-300/50"
          style={{ width: value }}
        />
      </div>
    </div>
  );
}

function ComparisonCard({
  label,
  before,
  after,
}: {
  label: string;
  before: string;
  after: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
      <p className="text-sm text-white/45">{label}</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/8 bg-slate-950/35 p-3">
          <p className="text-xs uppercase tracking-wide text-white/30">Antes</p>
          <p className="mt-1 text-lg font-medium text-white/85">{before}</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-slate-950/35 p-3">
          <p className="text-xs uppercase tracking-wide text-white/30">Atual</p>
          <p className="mt-1 text-lg font-medium text-white/85">{after}</p>
        </div>
      </div>
    </div>
  );
}