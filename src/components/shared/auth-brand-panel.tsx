export function AuthBrandPanel() {
  return (
    <div className="hidden lg:flex lg:w-[42%] flex-col bg-chart-5 text-white relative overflow-hidden select-none">
      {/* Tennis court lines — overhead view, decorative background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.07]">
        <TennisCourtSVG />
      </div>

      {/* Decorative circles — abstract tennis ball silhouettes */}
      <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full border-2 border-white/20 pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full border-2 border-white/10 pointer-events-none" />
      <div className="absolute -top-16 -left-16 w-52 h-52 rounded-full border-2 border-white/10 pointer-events-none" />

      {/* Main content */}
      <div className="relative z-10 flex flex-col h-full px-12 py-10">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <TennisBallSVG className="w-10 h-10 shrink-0" />
          <div className="leading-tight">
            <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-white/50">
              4 Play
            </p>
            <p className="text-2xl font-bold tracking-tight">Arena</p>
          </div>
        </div>

        {/* Tagline — anchored to bottom */}
        <div className="mt-auto mb-12">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-white/40 mb-4">
            Hora Carteira
          </p>
          <h2 className="text-[2.6rem] font-bold leading-[1.15] tracking-tight">
            Gerencie suas<br />
            horas de tênis<br />
            com precisão.
          </h2>
          <p className="mt-5 text-white/50 text-sm leading-relaxed max-w-65">
            Controle sua carteira de horas, acompanhe seu desenvolvimento e reserve aulas com facilidade.
          </p>

          {/* Feature pills */}
          <div className="mt-8 flex flex-col gap-2">
            {[
              "Saldo de horas em tempo real",
              "Check-in inteligente por nível",
              "Histórico de consumo detalhado",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2.5">
                <div className="w-1 h-1 rounded-full bg-white/40 shrink-0" />
                <span className="text-xs text-white/50">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function TennisBallSVG({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="20" cy="20" r="18" stroke="white" strokeWidth="2" />
      {/* Tennis seam curves */}
      <path
        d="M 7 12 Q 20 4 33 12"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 7 28 Q 20 36 33 28"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}

function TennisCourtSVG() {
  return (
    <svg
      viewBox="0 0 320 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      {/* Outer boundary */}
      <rect x="16" y="16" width="288" height="448" stroke="white" strokeWidth="3" />
      {/* Singles sidelines */}
      <line x1="52" y1="16" x2="52" y2="464" stroke="white" strokeWidth="2" />
      <line x1="268" y1="16" x2="268" y2="464" stroke="white" strokeWidth="2" />
      {/* Net */}
      <line x1="16" y1="240" x2="304" y2="240" stroke="white" strokeWidth="4" />
      {/* Service boxes — top half */}
      <line x1="52" y1="132" x2="268" y2="132" stroke="white" strokeWidth="2" />
      <line x1="160" y1="132" x2="160" y2="240" stroke="white" strokeWidth="2" />
      {/* Service boxes — bottom half */}
      <line x1="52" y1="348" x2="268" y2="348" stroke="white" strokeWidth="2" />
      <line x1="160" y1="240" x2="160" y2="348" stroke="white" strokeWidth="2" />
      {/* Center marks at baselines */}
      <line x1="155" y1="16" x2="165" y2="16" stroke="white" strokeWidth="3" />
      <line x1="155" y1="464" x2="165" y2="464" stroke="white" strokeWidth="3" />
    </svg>
  )
}
