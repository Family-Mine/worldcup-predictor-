export function LogoMark() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="13" stroke="#D4AF37" strokeWidth="2" />
        <circle cx="16" cy="16" r="7.5" stroke="#B8860B" strokeWidth="1.5" opacity="0.6" />
        <circle cx="16" cy="16" r="2.8" fill="#D4AF37" />
      </svg>
      <div className="flex flex-col leading-none">
        <span
          className="text-white font-bold tracking-tight"
          style={{ fontSize: '16px', letterSpacing: '-0.5px' }}
        >
          WC26
        </span>
        <span
          className="text-fifa-gold font-semibold uppercase"
          style={{ fontSize: '9px', letterSpacing: '2.5px' }}
        >
          PREDICTOR
        </span>
      </div>
    </div>
  )
}
