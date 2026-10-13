export default function MapPopup({ 
  brix, 
  pengguna, 
  tanggal, 
  pinColor, 
  idTitik: _idTitik, 
  onDelete, 
  metodeInput, 
  jenisTebu 
}) {
  const isOtomatis = metodeInput?.toLowerCase() === 'otomatis';
  const numericBrix = typeof brix === 'number' ? brix : parseFloat(brix || 0);

  // Kategori kemasakan tebu berdasarkan standar industri gula
  const getBrixStatus = (val) => {
    if (val < 15) return { label: 'Fase Pertumbuhan (< 15°)', bg: 'bg-emerald-500/10', text: 'text-emerald-700', border: 'border-emerald-300' };
    if (val <= 19) return { label: 'Optimal / Menjelang Panen', bg: 'bg-amber-500/10', text: 'text-amber-700', border: 'border-amber-300' };
    return { label: 'Kemasakan Puncak (> 19°)', bg: 'bg-rose-500/10', text: 'text-rose-700', border: 'border-rose-300' };
  };

  const status = getBrixStatus(numericBrix);

  return (
    <div className="p-4 font-sans text-slate-800 min-w-[240px] max-w-[280px]">
      
      {/* HEADER: Nilai Brix & Status Pill */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
            SPEKTRUM BRIX
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-mono text-3xl font-extrabold tracking-tight text-slate-900" style={{ color: pinColor || '#10b981' }}>
              {numericBrix.toFixed(1)}
            </span>
            <span className="font-mono text-sm font-bold text-slate-500">
              °Bx
            </span>
          </div>
        </div>

        <span className={`text-[9px] font-mono font-bold px-2 py-1 rounded-md border ${status.bg} ${status.text} ${status.border} text-right leading-tight max-w-[120px]`}>
          {status.label}
        </span>
      </div>

      {/* METADATA TELEMETRI */}
      <div className="py-3 space-y-2 text-xs">
        
        {/* Jenis Tebu */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Jenis Tebu
          </span>
          <span className="font-semibold text-slate-800 font-mono text-[11px] truncate max-w-[120px]" title={jenisTebu}>
            {jenisTebu || 'Standar (Campuran)'}
          </span>
        </div>

        {/* Surveyor Petugas */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Surveyor
          </span>
          <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[120px]" title={pengguna}>
            {pengguna || 'Anonim'}
          </span>
        </div>

        {/* Timestamp */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Waktu Uji
          </span>
          <span className="font-mono text-[10px] text-slate-600 font-medium">
            {tanggal}
          </span>
        </div>

        {/* Metode Pengambilan */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-slate-400 font-medium text-[11px]">Metode Akuisisi</span>
          <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            isOtomatis 
              ? 'bg-purple-100 text-purple-700 border border-purple-200' 
              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
          }`}>
            {metodeInput || 'Manual Sampling'}
          </span>
        </div>

      </div>

      {/* FOOTER ACTIONS */}
      {onDelete && (
        <div className="pt-2 border-t border-slate-100">
          <button 
            type="button"
            onClick={onDelete}
            className="w-full py-1.5 px-3 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 transition-all duration-200 flex items-center justify-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Hapus Titik Sampel
          </button>
        </div>
      )}

    </div>
  );
}