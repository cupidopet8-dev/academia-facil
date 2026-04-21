"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const modulos = [
  {
    id: "alunos",
    aba: "Alunos",
    titulo: "Gestão de Alunos",
    descricao:
      "Centralize cadastros, planos, status e histórico em um único lugar para facilitar o atendimento e manter a rotina da academia mais organizada.",
    bullets: [
      "Cadastro completo e contatos",
      "Planos e situação do aluno",
      "Histórico centralizado",
    ],
  },
  {
    id: "avaliacoes",
    aba: "Avaliações",
    titulo: "Avaliação Física",
    descricao:
      "Acompanhe evolução, medidas e comparações com leitura clara para analisar resultados e apoiar decisões de treino com mais precisão.",
    bullets: [
      "Peso, medidas e composição",
      "Comparação de evolução",
      "Leitura visual objetiva",
    ],
  },
  {
    id: "treinos",
    aba: "Treinos",
    titulo: "Treinos por Aluno",
    descricao:
      "Monte e atualize rotinas personalizadas com mais agilidade, organizando fichas por aluno, dia e objetivo.",
    bullets: [
      "Treinos personalizados",
      "Rotina por dia e objetivo",
      "Atualização rápida",
    ],
  },
  {
    id: "financeiro",
    aba: "Financeiro",
    titulo: "Financeiro Integrado",
    descricao:
      "Acompanhe cobranças, vencimentos e situação dos alunos em um fluxo mais claro e integrado à rotina da academia.",
    bullets: [
      "Cobranças e vencimentos",
      "Situação financeira do aluno",
      "Acompanhamento simplificado",
    ],
  },
];

const recursos = [
  {
    titulo: "Cadastro e gestão",
    texto:
      "Organize alunos, planos e informações importantes em uma estrutura central para reduzir retrabalho e agilizar o atendimento.",
  },
  {
    titulo: "Acompanhamento físico",
    texto:
      "Visualize evolução e métricas com uma leitura mais clara para acompanhar resultados com mais confiança.",
  },
  {
    titulo: "Treinos organizados",
    texto:
      "Crie fichas personalizadas, atualize rotinas rapidamente e mantenha o treino acessível no dia a dia.",
  },
  {
    titulo: "Cobrança integrada",
    texto:
      "Mantenha vencimentos, situação financeira e acompanhamento de pagamentos no mesmo fluxo do sistema.",
  },
];

export default function HomePage() {
  const [ativo, setAtivo] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setAtivo((prev) => (prev + 1) % modulos.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const moduloAtual = modulos[ativo];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#030817] text-white">
      <Header />

      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(14,165,233,0.10),transparent_24%),radial-gradient(circle_at_80%_18%,rgba(59,130,246,0.08),transparent_22%),linear-gradient(180deg,#020617_0%,#030817_45%,#041024_100%)]" />
        <div className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <section className="mx-auto max-w-[1500px] px-4 pb-16 pt-10 md:px-6 lg:pt-14">
        <div className="grid items-start gap-8 2xl:grid-cols-[0.72fr_1.02fr_0.56fr]">
          <div className="max-w-[520px]">
            <div className="inline-flex items-center rounded-full border border-cyan-400/50 bg-cyan-400/[0.04] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.26em] text-cyan-300">
              Academia Fácil
            </div>

            <h1 className="mt-6 text-4xl font-black leading-[0.94] tracking-tight text-white md:text-6xl">
              Gestão <span className="text-cyan-400">Premium</span>
              <span className="mt-2 block font-bold text-slate-300">
                para academias e personal
              </span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-8 text-slate-300 md:text-lg">
              Um sistema pensado para organizar a rotina da academia com mais
              clareza, praticidade e controle sobre alunos, avaliações, treinos
              e financeiro.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/login"
                className="inline-flex h-14 items-center justify-center rounded-[18px] bg-gradient-to-r from-sky-500 via-cyan-400 to-indigo-500 px-6 text-base font-semibold text-white shadow-[0_14px_36px_rgba(14,165,233,0.25)] transition hover:-translate-y-0.5"
              >
                Entrar no sistema
              </a>

              <a
                href="https://wa.me/5537984096932"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-14 items-center justify-center rounded-[18px] border border-white/15 bg-white/[0.02] px-6 text-base font-semibold text-white transition hover:border-cyan-400/40 hover:bg-white/[0.05]"
              >
                Falar no WhatsApp
              </a>
            </div>

            <div className="mt-8 rounded-[22px] border border-white/10 bg-white/[0.03] p-5">
              <div className="space-y-4">
                <InfoLine text="Visual premium com leitura mais limpa e profissional." />
                <div className="h-px bg-white/10" />
                <InfoLine text="Fluxo pensado para a rotina real da academia e do personal." />
                <div className="h-px bg-white/10" />
                <InfoLine text="Mais organização para atender melhor e acompanhar resultados." />
              </div>
            </div>
          </div>

          <div className="w-full">
            <section className="rounded-[30px] border border-white/10 bg-[rgba(8,16,35,0.86)] p-4 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-5 lg:p-6">
              <div className="rounded-[26px] border border-white/10 bg-[#061128] p-4 md:p-5 lg:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="max-w-[700px]">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.30em] text-slate-500">
                      Visão do Sistema
                    </p>
                    <h2 className="mt-2 text-2xl font-bold leading-tight text-white md:text-3xl">
                      Plataforma organizada para a rotina da academia
                    </h2>
                  </div>

                  <div className="w-fit shrink-0 rounded-full border border-cyan-400/45 bg-cyan-400/[0.05] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
                    Preview
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2 md:gap-3">
                  {modulos.map((modulo, index) => (
                    <button
                      key={modulo.id}
                      onClick={() => setAtivo(index)}
                      className={`rounded-full px-4 py-2.5 text-sm font-medium transition md:px-5 md:py-3 ${
                        ativo === index
                          ? "bg-cyan-400 text-slate-950 shadow-[0_12px_28px_rgba(34,211,238,0.24)]"
                          : "border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]"
                      }`}
                    >
                      {modulo.aba}
                    </button>
                  ))}
                </div>

                <div className="mt-6 rounded-[24px] border border-white/10 bg-[#041022] p-4 md:p-5 lg:p-6">
                  <div className="rounded-[22px] border border-white/10 bg-[#06152c] p-4 md:p-5">
                    {ativo === 0 && <SlideAlunos />}
                    {ativo === 1 && <SlideAvaliacoes />}
                    {ativo === 2 && <SlideTreinos />}
                    {ativo === 3 && <SlideFinanceiro />}
                  </div>

                  <div className="mt-4 rounded-[22px] border border-cyan-400/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.10),transparent_40%),linear-gradient(180deg,rgba(11,32,63,0.98),rgba(10,22,45,0.96))] p-5 md:p-6">
                    <div className="flex flex-col gap-6">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.30em] text-cyan-300">
                          {moduloAtual.aba}
                        </p>

                        <h3 className="mt-3 text-[24px] font-bold leading-tight text-white md:text-[30px]">
                          {moduloAtual.titulo}
                        </h3>

                        <p className="mt-4 text-sm leading-8 text-slate-200 md:text-[15px]">
                          {moduloAtual.descricao}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {moduloAtual.bullets.map((item) => (
                          <TagBox key={item}>{item}</TagBox>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-center gap-3">
                    {modulos.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setAtivo(index)}
                        aria-label={`Ir para slide ${index + 1}`}
                        className={`h-3 rounded-full transition-all ${
                          ativo === index ? "w-8 bg-cyan-400" : "w-3 bg-white/25"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="hidden 2xl:block">
            <HeroSidePanel />
          </div>
        </div>
      </section>

      <section
        id="recursos"
        className="mx-auto max-w-7xl scroll-mt-28 px-4 pb-10 md:px-6"
      >
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
            Recursos
          </p>
          <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">
            Mais organização para a operação da academia
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
            Uma estrutura criada para apresentar o sistema de forma clara,
            moderna e profissional, destacando o valor real do produto no dia a
            dia.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {recursos.map((item) => (
              <FeatureCard
                key={item.titulo}
                title={item.titulo}
                text={item.texto}
              />
            ))}
          </div>
        </div>
      </section>

      <section
        id="financeiro"
        className="mx-auto max-w-7xl scroll-mt-28 px-4 pb-16 md:px-6"
      >
        <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-300/80">
              Financeiro
            </p>
            <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">
              Cobrança integrada à rotina da academia
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
              Situação do aluno, vencimentos e acompanhamento financeiro dentro
              do mesmo fluxo, com leitura mais simples, mais controle e mais
              praticidade para a gestão.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <MetricCard
                title="Situação por aluno"
                text="Veja a cobrança conectada ao cadastro e acompanhe rapidamente quem está em dia, vencendo ou pendente."
              />
              <MetricCard
                title="Acompanhamento claro"
                text="Mantenha uma leitura mais limpa da operação financeira sem precisar separar o controle em várias telas."
              />
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.10),transparent_28%),linear-gradient(180deg,rgba(8,16,35,0.96),rgba(6,18,38,0.96))] p-5 md:p-6">
            <div className="space-y-4">
              <FinanceKpi
                label="Cobrança"
                value="Organizada"
                color="text-emerald-300"
              />
              <FinanceKpi
                label="Vencimentos"
                value="Visão central"
                color="text-cyan-300"
              />
              <FinanceKpi
                label="Acompanhamento"
                value="Mais claro"
                color="text-white"
              />
            </div>

            <div className="mt-5 rounded-[22px] border border-white/10 bg-white/[0.03] p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <MiniPill>Situação do aluno</MiniPill>
                <MiniPill>Controle visual</MiniPill>
                <MiniPill>Rotina financeira</MiniPill>
              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[84%] rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function InfoLine({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-400" />
      <p className="text-base leading-7 text-slate-200">{text}</p>
    </div>
  );
}

function TagBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-7 text-slate-100">
      {children}
    </div>
  );
}

function FeatureCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-[#081325]/80 p-5 transition duration-300 hover:border-cyan-400/20 hover:bg-[#0a162c]">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-400 md:text-base">
        {text}
      </p>
    </div>
  );
}

function MetricCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-[#081325]/80 p-5">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-400 md:text-base">
        {text}
      </p>
    </div>
  );
}

function FinanceKpi({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-slate-400 md:text-base">{label}</span>
        <span className={`text-sm font-bold md:text-base ${color}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

function MiniPill({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[16px] border border-white/10 bg-[#050c1c]/80 px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
      {children}
    </div>
  );
}

function PreviewHeader({
  label,
  title,
  badge,
  badgeClassName,
}: {
  label: string;
  title: string;
  badge: string;
  badgeClassName?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-slate-500">
          {label}
        </p>
        <h3 className="mt-2 text-xl font-bold leading-tight text-white md:text-2xl">
          {title}
        </h3>
      </div>

      <div
        className={`w-fit shrink-0 rounded-full px-3 py-2 text-[10px] font-semibold ${
          badgeClassName ?? "bg-cyan-400/15 text-cyan-300"
        }`}
      >
        {badge}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[9px] uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function Metric({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[14px] bg-white/[0.03] px-4 py-3">
      <span className="text-sm text-slate-400">{label}</span>
      <span
        className={`text-sm font-semibold ${
          highlight ? "text-cyan-300" : "text-white"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function Bar({
  height,
  label,
}: {
  height: string;
  label: string;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div
        className={`w-full rounded-t-[14px] bg-gradient-to-t from-cyan-400 via-sky-400 to-indigo-400 ${height}`}
      />
      <span className="text-[11px] text-slate-400">{label}</span>
    </div>
  );
}

function TrainingRow({
  title,
  subtitle,
  badge,
}: {
  title: string;
  subtitle: string;
  badge: string;
}) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h4 className="text-base font-bold leading-6 text-white">{title}</h4>
        <span className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-slate-200">
          {badge}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-400">{subtitle}</p>
    </div>
  );
}

function SlideAlunos() {
  return (
    <div className="flex flex-col gap-5">
      <PreviewHeader
        label="Tela do Sistema"
        title="Alunos"
        badge="visão ativa"
      />

      <div className="grid gap-3">
        <TrainingRow
          title="Bruno Almeida"
          subtitle="Plano Premium"
          badge="Em dia"
        />
        <TrainingRow
          title="Patrícia Souza"
          subtitle="Plano Trimestral"
          badge="Em dia"
        />
        <TrainingRow
          title="Carlos Mendes"
          subtitle="Plano Mensal"
          badge="Vence hoje"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Alunos ativos" value="128" />
        <Stat label="Planos premium" value="42" />
        <Stat label="Mensalidades" value="91%" />
      </div>
    </div>
  );
}

function SlideAvaliacoes() {
  return (
    <div className="flex flex-col gap-5">
      <PreviewHeader
        label="Tela do Sistema"
        title="Avaliação Física"
        badge="leitura visual"
      />

      <div className="grid gap-3 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm text-slate-400">Aluno</p>
          <h4 className="mt-2 text-base font-bold text-white">
            Bruno Almeida
          </h4>

          <div className="mt-4 space-y-3">
            <Metric label="Peso" value="84 kg" />
            <Metric label="Altura" value="1,78 m" />
            <Metric label="Gordura corporal" value="12%" highlight />
          </div>
        </div>

        <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm text-slate-400">Evolução</p>

          <div className="mt-4 flex h-[170px] items-end gap-3">
            <Bar height="h-10" label="Jan" />
            <Bar height="h-14" label="Fev" />
            <Bar height="h-20" label="Mar" />
            <Bar height="h-24" label="Abr" />
            <Bar height="h-28" label="Mai" />
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="IMC" value="26.5" />
        <Stat label="Meta" value="-4 kg" />
        <Stat label="Última avaliação" value="7 dias" />
      </div>
    </div>
  );
}

function SlideTreinos() {
  return (
    <div className="flex flex-col gap-5">
      <PreviewHeader
        label="Tela do Sistema"
        title="Treinos por Aluno"
        badge="rotina ativa"
      />

      <div className="grid gap-3">
        <TrainingRow
          title="Treino A"
          subtitle="Peito + Tríceps"
          badge="Segunda"
        />
        <TrainingRow
          title="Treino B"
          subtitle="Costas + Bíceps"
          badge="Terça"
        />
        <TrainingRow
          title="Treino C"
          subtitle="Pernas completas"
          badge="Quinta"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Fichas ativas" value="64" />
        <Stat label="Atualizações" value="12 hoje" />
        <Stat label="Execução" value="88%" />
      </div>
    </div>
  );
}

function SlideFinanceiro() {
  return (
    <div className="flex flex-col gap-5">
      <PreviewHeader
        label="Tela do Sistema"
        title="Financeiro Integrado"
        badge="visão ativa"
        badgeClassName="bg-emerald-400/15 text-emerald-300"
      />

      <div className="grid gap-3">
        <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm text-slate-400">Resumo</p>

          <div className="mt-4 space-y-3">
            <Metric label="Cobrança" value="Organizada" highlight />
            <Metric label="Status" value="Acompanhamento" />
            <Metric label="Vencimentos" value="Controle visual" />
          </div>
        </div>

        <div className="rounded-[18px] border border-white/10 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 p-4">
          <p className="text-sm text-slate-300">Cobrança automatizada</p>
          <h4 className="mt-2 text-lg font-bold leading-tight text-white">
            Vencimento e acompanhamento no mesmo fluxo
          </h4>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Deixe a situação financeira visível no mesmo painel.
          </p>

          <div className="mt-4 rounded-[16px] border border-white/10 bg-[#041020]/70 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Fluxo financeiro</span>
              <span className="font-bold text-emerald-300">integrado</span>
            </div>

            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[84%] rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Receita do mês" value="R$ 18.4k" />
        <Stat label="Inadimplência" value="6%" />
        <Stat label="Boletos pagos" value="94%" />
      </div>
    </div>
  );
}

function HeroSidePanel() {
  return (
    <div className="sticky top-28 flex flex-col gap-4">
      <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,22,45,0.96),rgba(7,17,34,0.96))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-300">
          Status Geral
        </p>

        <h3 className="mt-3 text-2xl font-bold leading-tight text-white">
          Operação mais visual e organizada
        </h3>

        <p className="mt-4 text-sm leading-7 text-slate-300">
          Uma visão rápida do sistema para mostrar controle, rotina e
          acompanhamento em um único ambiente.
        </p>

        <div className="mt-5 space-y-3">
          <MiniStatusRow
            label="Cadastros"
            value="Centralizados"
            valueClassName="text-cyan-300"
          />
          <MiniStatusRow
            label="Avaliações"
            value="Acompanhadas"
            valueClassName="text-emerald-300"
          />
          <MiniStatusRow
            label="Treinos"
            value="Atualização rápida"
            valueClassName="text-white"
          />
          <MiniStatusRow
            label="Financeiro"
            value="Mais controle"
            valueClassName="text-cyan-300"
          />
        </div>
      </div>

      <div className="grid gap-4">
        <SideMiniCard
          eyebrow="Módulos"
          title="Tudo em um só fluxo"
          text="Alunos, avaliações, treinos e financeiro com leitura mais limpa."
        />
        <SideMiniCard
          eyebrow="Rotina"
          title="Organização no dia a dia"
          text="Menos retrabalho e mais clareza para acompanhar a operação."
        />
        <SideMiniCard
          eyebrow="Visual"
          title="Experiência mais premium"
          text="Layout mais profissional para apresentar e vender o sistema."
        />
      </div>
    </div>
  );
}

function MiniStatusRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`text-sm font-semibold ${valueClassName ?? "text-white"}`}>
        {value}
      </span>
    </div>
  );
}

function SideMiniCard({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
        {eyebrow}
      </p>
      <h4 className="mt-3 text-lg font-bold text-white">{title}</h4>
      <p className="mt-3 text-sm leading-7 text-slate-400">{text}</p>
    </div>
  );
}