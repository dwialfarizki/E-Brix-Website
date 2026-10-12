import { useState, useEffect } from 'react';

export default function Header({ activeTab }) {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'peta':
        return { 
          title: 'Dashboard Monitoring Brix',
          tag: 'DASHBOARD PETA',
          icon: (
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          )
        };
      case 'analisis':
        return { 
          title: 'Pusat Analisis Data',
          tag: 'ANALISIS DATA',
          icon: (
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          )
        };
      case 'tambah_blok':
        return { 
          title: 'Manajemen Pemetaan Wilayah',
          tag: 'MANAJEMEN WILAYAH',
          icon: (
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          )
        };
      case 'kelola_petani':
        return { 
          title: 'Sistem Kelola Petugas',
          tag: 'KELOLA PETUGAS',
          icon: (
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )
        };
      default:
        return { 
          title: 'E-Brix Agro Telemetry Hub',
          tag: 'DASHBOARD',
          description: 'Sistem komputasi presisi kemasakan tebu',
          icon: null
        };
    }
  };

  const { title, tag, icon } = getHeaderInfo();

  const tanggalHariIni = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <header className="bg-white/85 backdrop-blur-xl border-b border-slate-200/80 px-8 py-4 flex justify-between items-center shrink-0 z-10 sticky top-0">
      
      {/* LEFT: Contextual Title & Icon */}
      <div className="flex items-center gap-4 min-w-0">
        {icon && (
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-sm">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md uppercase">
              {tag}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
              Musim Tanam 2026 (MT-I)
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight truncate mt-0.5">
            {title}
          </h2>
        </div>
      </div>

      {/* RIGHT: Live Telemetry Clock & Metadata */}
      <div className="hidden lg:flex items-center gap-6">
        
        {/* RTK Telemetry status pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] font-medium text-slate-600">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-slate-700 font-semibold">{currentTime || '12:00:00'}</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 font-mono text-[10px]">WIB</span>
        </div>

        {/* Date banner */}
        <div className="text-right">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
            Kalender Kebun
          </div>
          <div className="text-xs font-bold text-slate-700">
            {tanggalHariIni}
          </div>
        </div>

      </div>

    </header>
  );
}