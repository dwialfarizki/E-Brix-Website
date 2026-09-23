import React from 'react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  userRole, 
  onLogout  
}) {
  
  // 📌 FUNGSI: Konfirmasi sebelum keluar
  const handleLogoutClick = () => {
    const isConfirmed = window.confirm("Apakah Anda yakin ingin keluar dari sistem?");
    if (isConfirmed && onLogout) {
      onLogout();
    }
  };

  return (
    <div className="w-80 bg-[#122b1e] text-white flex flex-col shadow-2xl z-20 shrink-0">
      <div className="p-8 flex flex-col h-full overflow-y-auto">
        
        {/* LOGO & TITLE */}
        <div className="flex items-center gap-4 mb-10 shrink-0">
          {/* 🌟 PERBAIKAN: Efek glowing (shadow pendar) dihapus, diganti warna hijau solid yang solid dan elegan */}
          <div className="bg-green-500 w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl text-[#122b1e]">
            EB
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-widest text-white">E-BRIX</h1>
            <p className="text-[10px] text-green-400/80 uppercase tracking-[0.2em] font-bold mt-0.5">Sistem Monitoring</p>
          </div>
        </div>

        {/* NAVIGATION MENU */}
        <nav className="space-y-2 mb-8 flex-1 shrink-0">
          
          <button 
            onClick={() => setActiveTab('peta')} 
            className={`w-full flex items-center gap-4 p-3.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'peta' ? 'bg-green-500/10 text-green-400 shadow-[inset_4px_0_0_0_#22c55e]' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={activeTab === 'peta' ? 2.5 : 2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
            Dashboard Peta
          </button>
          
          <button 
            onClick={() => setActiveTab('analisis')} 
            className={`w-full flex items-center gap-4 p-3.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'analisis' ? 'bg-green-500/10 text-green-400 shadow-[inset_4px_0_0_0_#22c55e]' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={activeTab === 'analisis' ? 2.5 : 2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            Pusat Analisis Data
          </button>
          
          <button 
            onClick={() => setActiveTab('tambah_blok')} 
            className={`w-full flex items-center gap-4 p-3.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'tambah_blok' ? 'bg-green-500/10 text-green-400 shadow-[inset_4px_0_0_0_#22c55e]' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={activeTab === 'tambah_blok' ? 2.5 : 2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
            </svg>
            Manajemen Wilayah
          </button>

          {/* 📌 MENU KHUSUS ADMIN */}
          {userRole === 'admin' && (
            <button 
              onClick={() => setActiveTab('kelola_petani')} 
              className={`w-full flex items-center gap-4 p-3.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'kelola_petani' ? 'bg-green-500/10 text-green-400 shadow-[inset_4px_0_0_0_#22c55e]' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={activeTab === 'kelola_petani' ? 2.5 : 2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              Kelola Petugas
            </button>
          )}
        </nav>

        {/* 📌 TOMBOL LOGOUT (DESAIN MINIMALIS & CINEMATIC) */}
        <div className="mt-auto pt-6 border-t border-white/10 shrink-0">
          <button 
            onClick={handleLogoutClick}
            className="group w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:-translate-y-0.5 transition-all duration-300"
          >
            <svg 
              className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Keluar Sistem
          </button>
        </div>

      </div>
    </div>
  );
}