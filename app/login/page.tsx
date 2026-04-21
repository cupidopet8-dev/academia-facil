"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email.trim() || !senha.trim()) {
      alert("Preencha e-mail e senha.");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

      if (error || !data.user) {
        alert(error?.message || "Erro ao fazer login.");
        return;
      }

      const userId = data.user.id;

      const { data: perfil, error: perfilError } = await supabase
        .from("usuarios")
        .select("tipo")
        .eq("id", userId)
        .single();

      if (perfilError || !perfil) {
        alert("Usuário não encontrado na tabela usuarios.");
        return;
      }

      if (perfil.tipo === "personal") {
        router.push("/dashboard");
        return;
      }

      if (perfil.tipo === "aluno") {
        router.push("/aluno");
        return;
      }

      alert("Tipo de usuário inválido.");
    } catch (err) {
      console.error("Erro inesperado no login:", err);
      alert("Ocorreu um erro inesperado ao entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <Header />

      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_28%),linear-gradient(to_bottom_right,#020617,#050b1a,#0f172a)]" />
        <div className="absolute left-[-120px] top-20 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-[-140px] top-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-[-120px] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:42px_42px]" />
      </div>

      <section className="mx-auto flex min-h-[calc(100vh-84px)] max-w-7xl items-center px-6 py-10">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
              Sistema profissional de gestão
            </span>

            <h1 className="mt-6 max-w-2xl text-4xl font-black leading-tight text-white md:text-6xl">
              Controle total
              <span className="block bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                da sua academia
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 md:text-lg">
              Gerencie alunos, avaliações físicas e evolução com precisão,
              agilidade e uma experiência mais profissional no dia a dia.
            </p>

            <div className="mt-8 grid max-w-2xl gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <div className="text-2xl font-bold text-white">
                  Avaliações físicas
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  Histórico completo com acompanhamento da evolução de cada
                  aluno.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <div className="text-2xl font-bold text-white">
                  Gestão de alunos
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  Organize planos, contatos e informações importantes em um só
                  lugar.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <div className="text-2xl font-bold text-white">
                  Contato rápido
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  Compartilhe informações e resultados com mais rapidez pelo
                  WhatsApp.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-white/10 bg-white/10 p-8 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />
              <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-cyan-400/10 blur-2xl" />
              <div className="absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl" />

              <div className="relative">
                <div className="mb-6">
                  <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300/80">
                    Acesso seguro
                  </p>
                  <h2 className="mt-3 text-3xl font-bold text-white">
                    Acesso ao painel
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Entre com suas credenciais para continuar.
                  </p>
                </div>

                <form className="space-y-5" onSubmit={handleLogin}>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      E-mail
                    </label>
                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 transition focus-within:border-cyan-400/60 focus-within:bg-slate-900/80">
                      <input
                        type="email"
                        placeholder="Digite seu e-mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-14 w-full bg-transparent text-white placeholder:text-slate-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="block text-sm font-medium text-slate-300">
                        Senha
                      </label>

                      <Link
                        href="/reset-senha"
                        className="text-xs font-medium text-cyan-300 transition hover:text-cyan-200"
                      >
                        Esqueci minha senha
                      </Link>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 transition focus-within:border-cyan-400/60 focus-within:bg-slate-900/80">
                      <input
                        type="password"
                        placeholder="Digite sua senha"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        className="h-14 w-full bg-transparent text-white placeholder:text-slate-500 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="relative mt-2 h-14 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 font-bold text-white shadow-[0_10px_30px_rgba(37,99,235,0.35)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(37,99,235,0.45)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? "Entrando..." : "Entrar"}
                  </button>
                </form>

                <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                    Academia Fácil
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    Plataforma desenvolvida para personal trainers e academias
                    que querem mais organização, praticidade e evolução no
                    atendimento.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}