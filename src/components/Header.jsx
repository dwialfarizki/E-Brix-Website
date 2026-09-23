import React from 'react';

export default function Header({ activeTab }) {
  // 🌟 FUNGSI: Menentukan Judul dan Ikon berdasarkan Tab yang aktif
  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'peta':
        return { 
          title: 'Dashboard Monitoring Brix',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
          )
        };
      case 'analisis':
        return { 
          title: 'Pusat Analisis Data',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          )
        };
      case 'tambah_blok':
        return { 
          title: 'Manajemen Pemetaan Wilayah',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
            </svg>
          )
        };
      case 'kelola_petani':
        return { 
          title: 'Sistem Kelola Petugas',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          )
        };
      default:
        return { 
          title: 'E-BRIX System',
          icon: null
        };
    }
  };

  const { title, icon } = getHeaderInfo();

  // Menarik tanggal dinamis dari sistem
  const tanggalHariIni = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="bg-white/85 backdrop-blur-lg px-8 py-5 border-b border-gray-200 flex justify-between items-center shrink-0 z-20 sticky top-0">
      
      {/* BAGIAN KIRI: Ikon & Judul */}
      <div className="flex items-center gap-4">
        {icon && (
          <div className="p-2.5 bg-green-50 text-green-600 rounded-xl border border-green-100 shadow-sm">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-2xl font-black text-[#122b1e] tracking-tight">{title}</h2>
          <p className="text-[11px] text-gray-500 mt-0.5 uppercase tracking-[0.2em] font-extrabold">
            Musim Tanam 2026
          </p>
        </div>
      </div>

      {/* BAGIAN KANAN: Label "Hari Ini" & Tanggal */}
      <div className="hidden md:flex flex-col items-end">
        {/* 🌟 PERBAIKAN: Warna diubah menjadi abu-abu netral (gray) */}
        <span className="text-[11px] font-black text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 uppercase tracking-widest mb-1 shadow-sm">
          Hari Ini
        </span>
        <span className="text-sm font-bold text-gray-700">{tanggalHariIni}</span>
      </div>

    </div>
  );
}