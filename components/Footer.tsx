"use client";

import Link from "next/link";
import Image from "next/image";

const links = [
  { label: "Recursos", href: "#recursos" },
  { label: "Financeiro", href: "#financeiro" },
  { label: "Contato", href: "#contato" },
];

export default function Footer() {
  return (
    <footer
      id="contato"
      className="relative mt-10 border-t border-white/10 bg-slate-950/80 backdrop-blur-xl"
    >
      {/* FUNDO PREMIUM */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_30%)]" />

      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[1.2fr_0.7fr_0.7fr]">
        
        {/* LOGO + DESCRIÇÃO */}
        <div>
          <div className="flex items-center gap-4">

            {/* LOGO REAL */}
            <div className="relative h-[55px] w-[200px] overflow-hidden">
              <Image
                src="/logo.png"
                alt="Academia Fácil"
                fill
                className="object-cover scale-[1.4] translate-x-[-10%]"
              />
            </div>

          </div>

          <p className="mt-6 max-w-md text-sm leading-7 text-slate-400">
            Plataforma completa para gestão de academias e personal trainers.
            Controle alunos, avaliações, treinos e financeiro em um único sistema moderno e eficiente.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="https://wa.me/5537984096932"
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.35)] transition hover:bg-cyan-400"
            >
              Falar no WhatsApp
            </a>

            <Link
              href="/login"
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Entrar no sistema
            </Link>
          </div>
        </div>

        {/* NAVEGAÇÃO */}
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-300/80">
            Navegação
          </p>

          <div className="mt-5 flex flex-col gap-3">
            {links.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm text-slate-300 transition hover:text-cyan-300"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        {/* CONTATO */}
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-300/80">
            Contato
          </p>

          <div className="mt-5 space-y-3 text-sm text-slate-300">
            <p>WhatsApp comercial</p>

            <a
              href="https://wa.me/5537984096932"
              target="_blank"
              rel="noreferrer"
              className="block font-semibold transition hover:text-cyan-300"
            >
              +55 37 98409-6932
            </a>

            <p className="pt-3 text-slate-400">
              Demonstração, implantação e proposta comercial.
            </p>
          </div>
        </div>
      </div>

      {/* RODAPÉ FINAL */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-5 text-sm text-slate-500 md:flex-row">
          <p>© 2026 Academia Fácil. Todos os direitos reservados.</p>
          <p>Sistema profissional para academias e personal trainers.</p>
        </div>
      </div>
    </footer>
  );
}