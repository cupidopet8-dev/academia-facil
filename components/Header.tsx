"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Recursos", href: "/#recursos" },
    { label: "Financeiro", href: "/#financeiro" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/#")) return pathname === "/";
    return pathname === href;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-cyan-500/10 bg-[#020617]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">

        {/* LOGO AJUSTADA DE VERDADE */}
        <Link href="/" className="flex items-center">

          <div className="relative h-[60px] w-[260px] overflow-hidden">
            <Image
              src="/logo.png"
              alt="Academia Fácil"
              fill
              priority
              className="object-cover scale-[1.4] translate-x-[-10%]"
            />
          </div>

        </Link>

        {/* MENU */}
        <div className="hidden items-center gap-3 md:flex">

          <nav className="flex items-center gap-2 rounded-full border border-cyan-500/10 bg-white/[0.03] px-2 py-2">
            {navItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-cyan-500/15 text-cyan-300"
                      : "text-white/80 hover:bg-white/5 hover:text-cyan-300"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/login"
            className="rounded-full border border-cyan-500/20 px-5 py-2 text-sm font-semibold text-white/85 hover:bg-cyan-500/10 hover:text-cyan-300 transition"
          >
            Entrar
          </Link>

          <Link
            href="/cadastro"
            className="rounded-full bg-cyan-500 px-6 py-2 text-sm font-bold text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.35)] hover:bg-cyan-400 transition"
          >
            Teste grátis
          </Link>

        </div>
      </div>
    </header>
  );
}