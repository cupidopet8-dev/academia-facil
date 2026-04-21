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
  sexo: string | null;
  data_nascimento: string | null;
  objetivo: string | null;
  peso: number | null;
  altura: number | null;
};

type Avaliacao = {
  id: string;
  aluno_id: string;
  created_at: string;
  peso: number | null;
  altura: number | null;
  imc: number | null;
  gordura_corporal: number | null;
  massa_magra: number | null;
  massa_gorda: number | null;
  agua_corporal: number | null;
  massa_muscular: number | null;
  gordura_visceral: number | null;
  tmb: number | null;
  pescoco: number | null;
  ombro: number | null;
  torax: number | null;
  cintura: number | null;
  abdomen: number | null;
  quadril: number | null;
  braco_direito: number | null;
  braco_esquerdo: number | null;
  antebraco_direito: number | null;
  antebraco_esquerdo: number | null;
  coxa_direita: number | null;
  coxa_esquerda: number | null;
  panturrilha_direita: number | null;
  panturrilha_esquerda: number | null;
  dobra_peitoral: number | null;
  dobra_axilar_media: number | null;
  dobra_tricipital: number | null;
  dobra_subescapular: number | null;
  dobra_abdominal: number | null;
  dobra_suprailiaca: number | null;
  dobra_coxa: number | null;
  soma_7_dobras: number | null;
  observacoes: string | null;
};

type FormState = {
  peso: string;
  altura: string;
  gordura_corporal: string;
  agua_corporal: string;
  massa_muscular: string;
  gordura_visceral: string;
  tmb: string;
  pescoco: string;
  ombro: string;
  torax: string;
  cintura: string;
  abdomen: string;
  quadril: string;
  braco_direito: string;
  braco_esquerdo: string;
  antebraco_direito: string;
  antebraco_esquerdo: string;
  coxa_direita: string;
  coxa_esquerda: string;
  panturrilha_direita: string;
  panturrilha_esquerda: string;
  dobra_peitoral: string;
  dobra_axilar_media: string;
  dobra_tricipital: string;
  dobra_subescapular: string;
  dobra_abdominal: string;
  dobra_suprailiaca: string;
  dobra_coxa: string;
  observacoes: string;
};

const TABLE_ALUNOS = "alunos";
const TABLE_AVALIACOES = "avaliacoes_alunos";

const initialForm: FormState = {
  peso: "",
  altura: "",
  gordura_corporal: "",
  agua_corporal: "",
  massa_muscular: "",
  gordura_visceral: "",
  tmb: "",
  pescoco: "",
  ombro: "",
  torax: "",
  cintura: "",
  abdomen: "",
  quadril: "",
  braco_direito: "",
  braco_esquerdo: "",
  antebraco_direito: "",
  antebraco_esquerdo: "",
  coxa_direita: "",
  coxa_esquerda: "",
  panturrilha_direita: "",
  panturrilha_esquerda: "",
  dobra_peitoral: "",
  dobra_axilar_media: "",
  dobra_tricipital: "",
  dobra_subescapular: "",
  dobra_abdominal: "",
  dobra_suprailiaca: "",
  dobra_coxa: "",
  observacoes: "",
};

function sanitizeDecimalInput(value: string) {
  let sanitized = value.replace(/\s/g, "");
  sanitized = sanitized.replace(/[^\d.,-]/g, "");

  const negative = sanitized.startsWith("-");
  sanitized = sanitized.replace(/-/g, "");
  if (negative) sanitized = `-${sanitized}`;

  const firstSep = sanitized.search(/[.,]/);
  if (firstSep === -1) return sanitized;

  return (
    sanitized.slice(0, firstSep + 1) +
    sanitized.slice(firstSep + 1).replace(/[.,]/g, "")
  );
}

function toNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isNaN(parsed) ? null : parsed;
}

function numberToInput(value: number | null | undefined) {
  if (value === null || value === undefined) return "";
  return String(value).replace(".", ",");
}

function formatNumber(value: number | null | undefined, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}

function calcIdade(dataNascimento: string | null) {
  if (!dataNascimento) return 0;
  const nasc = new Date(dataNascimento);
  if (Number.isNaN(nasc.getTime())) return 0;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

function calcIMC(peso: number | null, alturaCm: number | null) {
  if (!peso || !alturaCm) return null;
  const alturaM = alturaCm / 100;
  if (!alturaM) return null;
  return peso / (alturaM * alturaM);
}

function calcSoma7Dobras(form: FormState) {
  const valores = [
    toNumber(form.dobra_peitoral),
    toNumber(form.dobra_axilar_media),
    toNumber(form.dobra_tricipital),
    toNumber(form.dobra_subescapular),
    toNumber(form.dobra_abdominal),
    toNumber(form.dobra_suprailiaca),
    toNumber(form.dobra_coxa),
  ].filter((v): v is number => v !== null);

  if (!valores.length) return null;
  return valores.reduce((a, b) => a + b, 0);
}

function calcGorduraPor7Dobras(sexo: string | null, idade: number, somaDobras: number | null) {
  if (!sexo || !idade || !somaDobras || somaDobras <= 0) return null;
  const s = sexo.toLowerCase();
  let densidade: number | null = null;

  if (s.includes("masc")) {
    densidade = 1.112 - 0.00043499 * somaDobras + 0.00000055 * somaDobras * somaDobras - 0.00028826 * idade;
  } else if (s.includes("fem")) {
    densidade = 1.097 - 0.00046971 * somaDobras + 0.00000056 * somaDobras * somaDobras - 0.00012828 * idade;
  }

  if (!densidade || densidade <= 0) return null;
  return 495 / densidade - 450;
}

function calcMassaGorda(peso: number | null, gordura: number | null) {
  if (!peso || gordura === null) return null;
  return peso * (gordura / 100);
}

function calcMassaMagra(peso: number | null, gordura: number | null) {
  const massaGorda = calcMassaGorda(peso, gordura);
  if (!peso || massaGorda === null) return null;
  return peso - massaGorda;
}

function adjustNumericString(current: string, delta: number, step: number, min = 0, decimals = 1) {
  const raw = current.trim() === "" ? 0 : Number(current.replace(",", "."));
  const base = Number.isNaN(raw) ? 0 : raw;
  let next = base + delta * step;
  if (next < min) next = min;
  const factor = Math.pow(10, decimals);
  next = Math.round(next * factor) / factor;
  return String(next).replace(".", ",");
}

function getIMCClassificacao(imc: number | null) {
  if (imc === null) return "—";
  if (imc < 18.5) return "Abaixo do peso";
  if (imc < 25) return "Peso normal";
  if (imc < 30) return "Sobrepeso";
  if (imc < 35) return "Obesidade grau I";
  if (imc < 40) return "Obesidade grau II";
  return "Obesidade grau III";
}


function getChartPoints(values: number[]) {
  if (!values.length) return "";
  const width = 100;
  const height = 40;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = values.length === 1 ? 50 : (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");
}

function MiniChart({
  title,
  values,
  labels,
  suffix = "",
}: {
  title: string;
  values: number[];
  labels: string[];
  suffix?: string;
}) {
  if (!values.length) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-white">{title}</h3>
          <span className="text-xs text-slate-400">Sem histórico</span>
        </div>
        <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-950/30 text-sm text-slate-500">
          Salve avaliações para gerar o gráfico.
        </div>
      </div>
    );
  }

  const points = getChartPoints(values);
  const ultimo = values[values.length - 1];

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-white">{title}</h3>
        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm font-semibold text-cyan-300">
          {formatNumber(ultimo, 1)}{suffix}
        </span>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
        <svg viewBox="0 0 100 40" className="h-28 w-full">
          <polyline
            fill="none"
            stroke="rgba(34,211,238,0.95)"
            strokeWidth="2.5"
            points={points}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
          <span>{labels[0] ?? "Início"}</span>
          <span>{labels[labels.length - 1] ?? "Atual"}</span>
        </div>
      </div>
    </div>
  );
}

function NumericField({
  label,
  value,
  onChange,
  placeholder,
  step = 0.1,
  min = 0,
  decimals = 1,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  step?: number;
  min?: number;
  decimals?: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-3">
      <label className="mb-2 block text-sm font-medium text-slate-300">{label}</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(adjustNumericString(value, -1, step, min, decimals))}
          className="h-11 w-11 rounded-xl border border-white/10 bg-white/5 text-lg font-bold text-white"
        >
          −
        </button>

        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(sanitizeDecimalInput(e.target.value))}
          placeholder={placeholder}
          className="h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-4 text-center text-base font-semibold text-white outline-none focus:border-cyan-400"
        />

        <button
          type="button"
          onClick={() => onChange(adjustNumericString(value, 1, step, min, decimals))}
          className="h-11 w-11 rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-lg font-bold text-cyan-300"
        >
          +
        </button>
      </div>
    </div>
  );
}

function Section({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-black text-white">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
    </div>
  );
}

export default function AvaliacaoAlunoPage() {
  const params = useParams();
  const alunoId = String(params?.id ?? "");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [historico, setHistorico] = useState<Avaliacao[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const idade = useMemo(() => calcIdade(aluno?.data_nascimento ?? null), [aluno?.data_nascimento]);
  const pesoAtual = toNumber(form.peso);
  const alturaAtual = toNumber(form.altura);
  const imcAtual = calcIMC(pesoAtual, alturaAtual);
  const soma7Dobras = calcSoma7Dobras(form);
  const gorduraEstimativa = calcGorduraPor7Dobras(aluno?.sexo ?? null, idade, soma7Dobras);
  const gorduraFinal = toNumber(form.gordura_corporal) ?? gorduraEstimativa;
  const massaGordaAtual = calcMassaGorda(pesoAtual, gorduraFinal);
  const massaMagraAtual = calcMassaMagra(pesoAtual, gorduraFinal);

  const historicoOrdenado = [...historico].reverse();
  const labelsGrafico = historicoOrdenado.map((item) => formatDate(item.created_at));
  const pesosGrafico = historicoOrdenado
    .map((item) => item.peso)
    .filter((item): item is number => item !== null);
  const gorduraGrafico = historicoOrdenado
    .map((item) => item.gordura_corporal)
    .filter((item): item is number => item !== null);

  useEffect(() => {
    if (!alunoId) return;
    carregarDados();
  }, [alunoId]);

  async function carregarDados() {
    try {
      setLoading(true);
      setErro("");

      const { data: alunoData, error: alunoError } = await supabase
        .from(TABLE_ALUNOS)
        .select("id, nome, email, telefone, sexo, data_nascimento, objetivo, peso, altura")
        .eq("id", alunoId)
        .single();

      if (alunoError) throw alunoError;

      setAluno(alunoData as Aluno);
      setForm((prev) => ({
        ...prev,
        peso: numberToInput(alunoData?.peso),
        altura: numberToInput(alunoData?.altura),
      }));

      const { data: histData, error: histError } = await supabase
        .from(TABLE_AVALIACOES)
        .select("*")
        .eq("aluno_id", alunoId)
        .order("created_at", { ascending: false });

      if (histError) throw histError;
      setHistorico((histData || []) as Avaliacao[]);
    } catch (error: any) {
      setErro(error?.message || "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  function setField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function salvarAvaliacao() {
    try {
      setSaving(true);
      setErro("");
      setSucesso("");

      const payload = {
        aluno_id: alunoId,
        peso: pesoAtual,
        altura: alturaAtual,
        imc: imcAtual,
        gordura_corporal: gorduraFinal,
        massa_magra: massaMagraAtual,
        massa_gorda: massaGordaAtual,
        agua_corporal: toNumber(form.agua_corporal),
        massa_muscular: toNumber(form.massa_muscular),
        gordura_visceral: toNumber(form.gordura_visceral),
        tmb: toNumber(form.tmb),
        pescoco: toNumber(form.pescoco),
        ombro: toNumber(form.ombro),
        torax: toNumber(form.torax),
        cintura: toNumber(form.cintura),
        abdomen: toNumber(form.abdomen),
        quadril: toNumber(form.quadril),
        braco_direito: toNumber(form.braco_direito),
        braco_esquerdo: toNumber(form.braco_esquerdo),
        antebraco_direito: toNumber(form.antebraco_direito),
        antebraco_esquerdo: toNumber(form.antebraco_esquerdo),
        coxa_direita: toNumber(form.coxa_direita),
        coxa_esquerda: toNumber(form.coxa_esquerda),
        panturrilha_direita: toNumber(form.panturrilha_direita),
        panturrilha_esquerda: toNumber(form.panturrilha_esquerda),
        dobra_peitoral: toNumber(form.dobra_peitoral),
        dobra_axilar_media: toNumber(form.dobra_axilar_media),
        dobra_tricipital: toNumber(form.dobra_tricipital),
        dobra_subescapular: toNumber(form.dobra_subescapular),
        dobra_abdominal: toNumber(form.dobra_abdominal),
        dobra_suprailiaca: toNumber(form.dobra_suprailiaca),
        dobra_coxa: toNumber(form.dobra_coxa),
        soma_7_dobras: soma7Dobras,
        observacoes: form.observacoes || null,
      };

      const { error } = await supabase.from(TABLE_AVALIACOES).insert(payload);
      if (error) throw error;

      await supabase.from(TABLE_ALUNOS).update({ peso: pesoAtual, altura: alturaAtual }).eq("id", alunoId);

      setSucesso("Avaliação salva com sucesso.");
      await carregarDados();
    } catch (error: any) {
      setErro(error?.message || "Erro ao salvar avaliação.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">Carregando...</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#020617_0%,#07112b_55%,#0a1738_100%)] text-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.30em] text-cyan-300">Avaliação Física</p>
            <h1 className="mt-2 text-3xl font-black md:text-4xl">{aluno?.nome ?? "Aluno"}</h1>
            <p className="mt-2 text-slate-300">Página refeita com campos simples para digitação normal.</p>
          </div>

          <Link
            href="/alunos"
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-bold text-white"
          >
            Voltar para alunos
          </Link>
        </div>

        {erro ? <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">{erro}</div> : null}
        {sucesso ? <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-200">{sucesso}</div> : null}

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.20em] text-cyan-300">Peso</div>
            <div className="mt-2 text-2xl font-black">{formatNumber(pesoAtual, 1)} kg</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.20em] text-cyan-300">IMC</div>
            <div className="mt-2 text-2xl font-black">{formatNumber(imcAtual, 1)}</div>
            <div className="mt-1 text-sm text-slate-400">{getIMCClassificacao(imcAtual)}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.20em] text-cyan-300">Gordura</div>
            <div className="mt-2 text-2xl font-black">{formatNumber(gorduraFinal, 1)}%</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.20em] text-cyan-300">7 dobras</div>
            <div className="mt-2 text-2xl font-black">{formatNumber(soma7Dobras, 1)} mm</div>
          </div>
        </div>

        <div className="space-y-6 rounded-[28px] border border-white/10 bg-white/5 p-5 md:p-6">
          <section>
            <Section title="Dados principais" subtitle="Agora com input simples e controlado." />
            <div className="grid gap-4 md:grid-cols-3">
              <NumericField label="Peso (kg)" value={form.peso} onChange={(v) => setField("peso", v)} placeholder="82,5" />
              <NumericField label="Altura (cm)" value={form.altura} onChange={(v) => setField("altura", v)} placeholder="178" step={1} decimals={0} />
              <NumericField label="Gordura corporal (%)" value={form.gordura_corporal} onChange={(v) => setField("gordura_corporal", v)} placeholder="Opcional" />
            </div>
          </section>

          <section>
            <Section title="Bioimpedância" />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <NumericField label="Água corporal (%)" value={form.agua_corporal} onChange={(v) => setField("agua_corporal", v)} />
              <NumericField label="Massa muscular (kg)" value={form.massa_muscular} onChange={(v) => setField("massa_muscular", v)} />
              <NumericField label="Gordura visceral" value={form.gordura_visceral} onChange={(v) => setField("gordura_visceral", v)} step={1} decimals={0} />
              <NumericField label="TMB" value={form.tmb} onChange={(v) => setField("tmb", v)} step={1} decimals={0} />
            </div>
          </section>

          <section>
            <Section title="Perimetrias" />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <NumericField label="Pescoço (cm)" value={form.pescoco} onChange={(v) => setField("pescoco", v)} />
              <NumericField label="Ombro (cm)" value={form.ombro} onChange={(v) => setField("ombro", v)} />
              <NumericField label="Tórax (cm)" value={form.torax} onChange={(v) => setField("torax", v)} />
              <NumericField label="Cintura (cm)" value={form.cintura} onChange={(v) => setField("cintura", v)} />
              <NumericField label="Abdômen (cm)" value={form.abdomen} onChange={(v) => setField("abdomen", v)} />
              <NumericField label="Quadril (cm)" value={form.quadril} onChange={(v) => setField("quadril", v)} />
              <NumericField label="Braço direito (cm)" value={form.braco_direito} onChange={(v) => setField("braco_direito", v)} />
              <NumericField label="Braço esquerdo (cm)" value={form.braco_esquerdo} onChange={(v) => setField("braco_esquerdo", v)} />
              <NumericField label="Antebraço direito (cm)" value={form.antebraco_direito} onChange={(v) => setField("antebraco_direito", v)} />
              <NumericField label="Antebraço esquerdo (cm)" value={form.antebraco_esquerdo} onChange={(v) => setField("antebraco_esquerdo", v)} />
              <NumericField label="Coxa direita (cm)" value={form.coxa_direita} onChange={(v) => setField("coxa_direita", v)} />
              <NumericField label="Coxa esquerda (cm)" value={form.coxa_esquerda} onChange={(v) => setField("coxa_esquerda", v)} />
              <NumericField label="Panturrilha direita (cm)" value={form.panturrilha_direita} onChange={(v) => setField("panturrilha_direita", v)} />
              <NumericField label="Panturrilha esquerda (cm)" value={form.panturrilha_esquerda} onChange={(v) => setField("panturrilha_esquerda", v)} />
            </div>
          </section>

          <section>
            <Section title="Protocolo 7 dobras" subtitle={`Idade usada: ${idade} anos | Sexo: ${aluno?.sexo || "—"}`} />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <NumericField label="Peitoral (mm)" value={form.dobra_peitoral} onChange={(v) => setField("dobra_peitoral", v)} />
              <NumericField label="Axilar média (mm)" value={form.dobra_axilar_media} onChange={(v) => setField("dobra_axilar_media", v)} />
              <NumericField label="Tricipital (mm)" value={form.dobra_tricipital} onChange={(v) => setField("dobra_tricipital", v)} />
              <NumericField label="Subescapular (mm)" value={form.dobra_subescapular} onChange={(v) => setField("dobra_subescapular", v)} />
              <NumericField label="Abdominal (mm)" value={form.dobra_abdominal} onChange={(v) => setField("dobra_abdominal", v)} />
              <NumericField label="Supra-ilíaca (mm)" value={form.dobra_suprailiaca} onChange={(v) => setField("dobra_suprailiaca", v)} />
              <NumericField label="Coxa (mm)" value={form.dobra_coxa} onChange={(v) => setField("dobra_coxa", v)} />
            </div>
            <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-cyan-100">
              Gordura estimada pelo protocolo: <strong>{formatNumber(gorduraEstimativa, 1)}%</strong>
            </div>
          </section>

          <section>
            <Section title="Observações" />
            <textarea
              value={form.observacoes}
              onChange={(e) => setField("observacoes", e.target.value)}
              rows={5}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 text-white outline-none focus:border-cyan-400"
              placeholder="Observações da avaliação"
            />
          </section>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={salvarAvaliacao}
              disabled={saving}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-cyan-400 px-6 text-sm font-black text-slate-950 disabled:opacity-70"
            >
              {saving ? "Salvando..." : "Salvar avaliação"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <MiniChart title="Evolução do peso" values={pesosGrafico} labels={labelsGrafico} suffix=" kg" />
          <MiniChart title="Evolução da gordura" values={gorduraGrafico} labels={labelsGrafico} suffix="%" />
        </div>

        <div className="mt-6 rounded-[28px] border border-white/10 bg-white/5 p-5 md:p-6">
          <Section title="Histórico" />
          {historico.length === 0 ? (
            <div className="text-slate-400">Nenhuma avaliação cadastrada ainda.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="px-3 py-3">Data</th>
                    <th className="px-3 py-3">Peso</th>
                    <th className="px-3 py-3">IMC</th>
                    <th className="px-3 py-3">Gordura</th>
                    <th className="px-3 py-3">7 dobras</th>
                  </tr>
                </thead>
                <tbody>
                  {historico.map((item) => (
                    <tr key={item.id} className="border-b border-white/5 text-slate-200">
                      <td className="px-3 py-3">{formatDate(item.created_at)}</td>
                      <td className="px-3 py-3">{formatNumber(item.peso, 1)} kg</td>
                      <td className="px-3 py-3">{formatNumber(item.imc, 1)}</td>
                      <td className="px-3 py-3">{formatNumber(item.gordura_corporal, 1)}%</td>
                      <td className="px-3 py-3">{formatNumber(item.soma_7_dobras, 1)} mm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
