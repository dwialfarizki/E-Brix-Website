export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  userRole, 
  onLogout  
}) {
  const handleLogoutClick = () => {
    const isConfirmed = window.confirm("Konfirmasi: Apakah Anda yakin ingin keluar dari Portal E-Brix?");
    if (isConfirmed && onLogout) {
      onLogout();
    }
  };

  const navItems = [
    {
      id: 'peta',
      title: 'Geospatial Radar',
      subtitle: 'Peta Brix & Kontur Lahan',
      code: 'MAP',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      )
    },
    {
      id: 'analisis',
      title: 'Telemetri Analisis',
      subtitle: 'Tren Brix & Metrik Panen',
      code: 'ANL',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'tambah_blok',
      title: 'CAD Poligon & Blok',
      subtitle: 'Batas Spasial & SHP Import',
      code: 'GIS',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      )
    }
  ];

  if (userRole === 'admin') {
    navItems.push({
      id: 'kelola_petani',
      title: 'Petugas & Akses',
      subtitle: 'Otorisasi Surveyor Lapangan',
      code: 'SEC',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    });
  }

  return (
    <aside className="w-72 bg-gradient-to-b from-[#07130e] via-[#0a1b14] to-[#060e0a] text-slate-200 flex flex-col border-r border-emerald-950/60 shadow-[8px_0_30px_rgba(0,0,0,0.35)] z-20 shrink-0 select-none">
      
      {/* BRAND & HEADER HUD */}
      <div className="p-6 border-b border-emerald-900/20 bg-emerald-950/20">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-600 to-teal-800 flex items-center justify-center font-black text-white text-base shadow-[0_0_20px_rgba(16,185,129,0.3)] ring-1 ring-emerald-300/30">
              EB
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#07130e] animate-beacon" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-black tracking-wider text-white">E-BRIX</h1>
              <span className="text-[9px] font-mono px-1.5 py-0.2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded font-bold">PRO</span>
            </div>
            <p className="text-[10px] text-emerald-400/80 font-mono tracking-wider uppercase mt-0.5">
              PRECISION AGRO-GIS
            </p>
          </div>
        </div>

        {/* Live Satellite RTK Status Banner */}
        <div className="mt-4 px-3 py-2 bg-emerald-950/60 rounded-xl border border-emerald-800/30 flex items-center justify-between text-[10px] font-mono">
          <span className="flex items-center gap-2 text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            TELEMETRI AKTIF
          </span>
          <span className="text-slate-400">RTK 2.6G</span>
        </div>
      </div>

      {/* NAVIGATION SECTION */}
      <div className="flex-1 px-4 py-5 overflow-y-auto space-y-6">
        <div>
          <div className="px-3 mb-2.5 text-[10px] font-mono tracking-widest text-emerald-500/70 uppercase font-bold">
            Navigasi Spasial
          </div>

          <div className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full group relative flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-left transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 text-white border border-emerald-500/30 shadow-[0_0_20px_-3px_rgba(16,185,129,0.25)]' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  {/* Left Active Glow bar */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b from-emerald-400 to-teal-400 rounded-r-full shadow-[0_0_8px_#34d399]" />
                  )}

                  <div className={`p-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-emerald-500/20 text-emerald-300' 
                      : 'bg-white/[0.03] text-slate-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/10'
                  }`}>
                    {item.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                        {item.title}
                      </span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                        isActive 
                          ? 'bg-emerald-400/20 text-emerald-300 font-bold' 
                          : 'text-slate-500 group-hover:text-slate-400'
                      }`}>
                        {item.code}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* USER PROFILE & LOGOUT FOOTER */}
      <div className="p-4 border-t border-emerald-900/30 bg-[#050c09]/80 space-y-3">
        {/* User Card */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-400/30 flex items-center justify-center font-bold text-xs text-emerald-300 uppercase">
            {userRole === 'admin' ? 'AD' : 'OP'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-200 capitalize truncate">
              {userRole === 'admin' ? 'Administrator' : 'Operator Kebun'}
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Level {userRole === 'admin' ? '01 - Root' : '02 - Lapangan'}
            </span>
          </div>
        </div>

        {/* Tactical Logout Button */}
        <button
          onClick={handleLogoutClick}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 transition-all duration-200 active:scale-[0.98]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Keluar Sistem
        </button>
      </div>

    </aside>
  );
}