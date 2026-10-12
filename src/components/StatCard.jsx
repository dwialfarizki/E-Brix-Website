export default function StatCard({ 
  title, 
  value, 
  border: _border, 
  icon, 
  subtext,
  telemetryCode 
}) {
  // Extract number and degree symbol if present
  const stringVal = String(value ?? '');
  const hasDegree = stringVal.includes('°');
  const cleanNum = stringVal.replace('°', '');

  // Dynamic icon fallback based on title if no icon provided
  const getIcon = () => {
    if (icon) return icon;
    const lower = title?.toLowerCase() || '';
    if (lower.includes('rata')) {
      return (
        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    }
    if (lower.includes('petak')) {
      return (
        <svg className="w-5 h-5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      );
    }
    if (lower.includes('tertinggi')) {
      return (
        <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    );
  };

  return (
    <div className="relative group bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] hover:shadow-[0_12px_28px_-6px_rgba(16,185,129,0.12)] hover:border-emerald-500/40 transition-all duration-300 overflow-hidden">
      {/* Subtle top indicator bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/70 via-teal-500/50 to-emerald-400/20 group-hover:from-emerald-500 group-hover:to-teal-400 transition-all duration-300" />
      
      {/* Background ambient watermarking */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/[0.03] group-hover:bg-emerald-500/[0.08] rounded-full blur-2xl transition-all duration-500 pointer-events-none" />

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono tracking-wider font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 uppercase">
            {telemetryCode || (title?.toLowerCase().includes('rata') ? 'TELEMETRI' : 'METRIK')}
          </span>
          <span className="text-[11px] font-semibold text-slate-500 tracking-tight uppercase">
            {title}
          </span>
        </div>
        <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-emerald-50/80 transition-all duration-300">
          {getIcon()}
        </div>
      </div>

      <div className="flex items-baseline gap-1.5 mt-1">
        <span className="font-mono text-3xl font-extrabold text-slate-900 tracking-tight">
          {cleanNum}
        </span>
        {hasDegree && (
          <span className="font-mono text-base font-bold text-emerald-600">
            °Bx
          </span>
        )}
      </div>

      <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span className="font-medium">
          {subtext || 'Sensor presisi aktif'}
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          REALTIME
        </span>
      </div>
    </div>
  );
}