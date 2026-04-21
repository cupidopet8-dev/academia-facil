"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function CriarSenhaPage() {
  const router = useRouter();

  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [validandoLink, setValidandoLink] = useState(true);
  const [linkValido, setLinkValido] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const senhaForte = useMemo(() => {
    return senha.length >= 6;
  }, [senha]);

  useEffect(() => {
    async function validarSessaoDoLink() {
      try {
        const hash = window.location.hash;
        const search = window.location.search;

        const hasTokensNoHash =
          hash.includes("access_token") || hash.includes("refresh_token");

        const hasCodeNaUrl = new URLSearchParams(search).get("code");

        if (hasTokensNoHash) {
          const { error } = await supabase.auth.getSession();

          if (error) {
            setErro("Link inválido ou expirado. Solicite um novo e-mail.");
            setLinkValido(false);
          } else {
            setLinkValido(true);
          }
        } else if (hasCodeNaUrl) {
          const { error } = await supabase.auth.exchangeCodeForSession(
            window.location.href
          );

          if (error) {
            setErro("Link inválido ou expirado. Solicite um novo e-mail.");
            setLinkValido(false);
          } else {
            setLinkValido(true);
          }
        } else {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session) {
            setLinkValido(true);
          } else {
            setErro("Link inválido ou expirado. Solicite um novo e-mail.");
            setLinkValido(false);
          }
        }
      } catch (e) {
        console.error("Erro ao validar link de criação de senha:", e);
        setErro("Não foi possível validar o link. Tente novamente.");
        setLinkValido(false);
      } finally {
        setValidandoLink(false);
      }
    }

    validarSessaoDoLink();
  }, []);

  async function handleSalvarSenha(e: React.FormEvent) {
    e.preventDefault();

    setErro("");
    setMensagem("");

    if (!senha || !confirmarSenha) {
      setErro("Preencha a senha e a confirmação.");
      return;
    }

    if (!senhaForte) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não conferem.");
      return;
    }

    try {
      setCarregando(true);

      const { error } = await supabase.auth.updateUser({
        password: senha,
      });

      if (error) {
        setErro(error.message || "Não foi possível definir a senha.");
        return;
      }

      setMensagem("Senha criada com sucesso! Redirecionando para o login...");

      setTimeout(() => {
        router.push("/login");
      }, 1800);
    } catch (e) {
      console.error("Erro ao salvar senha:", e);
      setErro("Ocorreu um erro ao salvar a senha.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md overflow-hidden rounded-3xl border border-cyan-500/20 bg-white/5 shadow-2xl backdrop-blur-xl">
          <div className="border-b border-white/10 bg-gradient-to-r from-cyan-500/10 via-sky-500/10 to-blue-500/10 px-6 py-6">
            <h1 className="text-2xl font-bold tracking-tight">Criar senha</h1>
            <p className="mt-2 text-sm text-white/70">
              Defina sua senha para acessar a plataforma.
            </p>
          </div>

          <div className="px-6 py-6">
            {validandoLink ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/80">
                Validando link...
              </div>
            ) : !linkValido ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-200">
                  {erro || "Link inválido ou expirado."}
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="w-full rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
                >
                  Ir para o login
                </button>
              </div>
            ) : (
              <form onSubmit={handleSalvarSenha} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/80">
                    Nova senha
                  </label>
                  <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite sua nova senha"
                    className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white/80">
                    Confirmar senha
                  </label>
                  <input
                    type="password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Confirme sua nova senha"
                    className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                  />
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/60">
                  A senha deve ter pelo menos 6 caracteres.
                </div>

                {erro ? (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {erro}
                  </div>
                ) : null}

                {mensagem ? (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                    {mensagem}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={carregando}
                  className="w-full rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {carregando ? "Salvando..." : "Salvar senha"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}