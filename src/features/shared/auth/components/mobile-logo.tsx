export function MobileLogo() {
  return (
    <>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
        <circle cx="20" cy="20" r="18" className="stroke-brand" strokeWidth="2" />
        <path d="M 7 12 Q 20 4 33 12" className="stroke-brand" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M 7 28 Q 20 36 33 28" className="stroke-brand" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
      <span className="text-base font-bold text-brand-dark">4Play Arena</span>
    </>
  )
}
