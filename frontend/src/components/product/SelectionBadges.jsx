const BADGE_CONFIG = {
  size: {
    label: 'Size',
    color: 'bg-violet-50 text-violet-700 border-violet-200',
    icon: (
      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  length: {
    label: 'Length',
    color: 'bg-sky-50 text-sky-700 border-sky-200',
    icon: (
      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16M8 4v4M12 4v4M16 4v4M8 16v4M12 16v4M16 16v4" />
      </svg>
    ),
  },
  stoneColor: {
    label: 'Stone',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: (
      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7l5-5 5 5-5 12-5-12z" />
      </svg>
    ),
  },
  paymentMode: {
    label: 'Payment',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: (
      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
};

export default function SelectionBadges({ selections, className = '' }) {
  if (!selections || Object.keys(selections).length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-1.5 mt-1.5 ${className}`}>
      {Object.entries(selections).map(([k, v]) => {
        const cfg = BADGE_CONFIG[k] || { label: k, color: 'bg-gray-50 text-gray-600 border-gray-200', icon: null };
        return (
          <span key={k} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-semibold ${cfg.color}`}>
            {cfg.icon}
            <span className="opacity-70">{cfg.label}:</span>
            <span>{v}</span>
          </span>
        );
      })}
    </div>
  );
}
