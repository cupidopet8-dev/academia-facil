export default function Logo() {
  return (
    <div className="flex items-center gap-3">
      
      {/* ÍCONE */}
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="white"
          className="w-6 h-6"
        >
          <path d="M6 7h2v10H6V7zm10 0h2v10h-2V7zM8 11h8v2H8v-2z" />
        </svg>
      </div>

      {/* TEXTO */}
      <div className="leading-tight">
        <h1 className="text-white text-lg font-semibold">
          Academia Fácil
        </h1>
        <p className="text-cyan-400 text-xs tracking-widest">
          SISTEMA MODERNO
        </p>
      </div>

    </div>
  );
}