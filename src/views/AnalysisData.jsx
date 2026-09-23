import React, { useMemo, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function AnalysisData({ sampelData, blokData, selectedLahan, selectedBlok, lahanData = [] }) {
  // ==========================================
  // 🌟 PERBAIKAN: Default filter diatur agar langsung menampilkan data Terbaru (desc)
  // ==========================================
  const [filters, setFilters] = useState({
    nama_lahan: '',
    nama_blok: '',
    nama_petugas: '', 
    sort_brix: '',
    sort_tanggal: 'desc' // <-- Diubah dari '' menjadi 'desc'
  });

  // 2. State Filter Rentang Tanggal untuk Grafik Tren
  const [trendDateRange, setTrendDateRange] = useState({
    start: '',
    end: ''
  });

  // --- 📌 LOGIKA GRAFIK TREN BRIX ---
  const chartTrenData = useMemo(() => {
    let dataAktif = sampelData;

    if (selectedLahan !== 'all') {
      const validBlokIds = blokData
        .filter(b => String(b.properties?.id_lahan || b.id_lahan) === String(selectedLahan))
        .map(b => String(b.properties?.id_blok || b.id_blok));
      
      dataAktif = dataAktif.filter(t => validBlokIds.includes(String(t.properties?.id_blok || t.id_blok)));
    }

    if (selectedBlok !== 'all') {
      dataAktif = dataAktif.filter(t => String(t.properties?.id_blok || t.id_blok) === String(selectedBlok));
    }

    if (trendDateRange.start) {
      const startDate = new Date(trendDateRange.start);
      startDate.setHours(0, 0, 0, 0); 
      dataAktif = dataAktif.filter(t => {
        const w = t.properties?.waktu_pengukuran || t.properties?.created_at || t.waktu_pengukuran;
        const d = new Date(typeof w === 'string' ? w.replace(' GMT', '') : w);
        return d >= startDate;
      });
    }

    if (trendDateRange.end) {
      const endDate = new Date(trendDateRange.end);
      endDate.setHours(23, 59, 59, 999); 
      dataAktif = dataAktif.filter(t => {
        const w = t.properties?.waktu_pengukuran || t.properties?.created_at || t.waktu_pengukuran;
        const d = new Date(typeof w === 'string' ? w.replace(' GMT', '') : w);
        return d <= endDate;
      });
    }

    return dataAktif.map((item, index) => {
      const nilaiBrixAsli = item.properties?.nilai_brix || item.nilai_brix || 0;
      const waktuMentah = item.properties?.waktu_pengukuran || item.properties?.created_at || item.waktu_pengukuran;
      const waktuAsli = typeof waktuMentah === 'string' ? waktuMentah.replace(' GMT', '') : waktuMentah;
      
      let labelTanggal = `Data ke-${index + 1}`; 
      let sortDate = new Date(0); 

      if (waktuAsli) {
        const dateObj = new Date(waktuAsli);
        if (!isNaN(dateObj)) {
          labelTanggal = dateObj.toLocaleString('id-ID', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }).replace(',', ''); 
          
          sortDate = dateObj;
        }
      }

      return {
        tanggal: labelTanggal,
        brix: parseFloat(nilaiBrixAsli),
        _sortDate: sortDate 
      };
    }).sort((a, b) => a._sortDate - b._sortDate);
  }, [sampelData, selectedLahan, selectedBlok, blokData, trendDateRange]);

  // --- 📌 LOGIKA GRAFIK BLOK ---
  const chartBlokData = useMemo(() => {
    let blokAktif = blokData;

    if (selectedLahan !== 'all') {
      blokAktif = blokAktif.filter(b => String(b.properties?.id_lahan || b.id_lahan) === String(selectedLahan));
    }
    
    if (selectedBlok !== 'all') {
      blokAktif = blokAktif.filter(b => String(b.properties?.id_blok || b.id_blok) === String(selectedBlok));
    }

    return blokAktif.map(blok => {
      const titik = sampelData.filter(t => String(t.id_blok || t.properties?.id_blok) === String(blok.properties?.id_blok || blok.id_blok));
      const avg = titik.length > 0 ? titik.reduce((sum, t) => sum + parseFloat(t.nilai_brix || t.properties?.nilai_brix || 0), 0) / titik.length : 0;
      
      return { 
        nama_blok: blok.properties?.nama_blok || blok.nama_blok, 
        rata_brix: parseFloat(avg.toFixed(1)) 
      };
    });
  }, [blokData, sampelData, selectedLahan, selectedBlok]);

  const getBrixColor = (value) => { 
    return value > 19 ? '#ef4444' : value >= 15 ? '#f59e0b' : '#10b981'; 
  };

  // --- 📌 LOGIKA TABEL ---
  const tableData = useMemo(() => {
    return sampelData.map((sampel, index) => {
      const idBlokSampel = String(sampel.properties?.id_blok || sampel.id_blok);
      const blok = blokData.find(b => String(b.properties?.id_blok || b.id_blok) === idBlokSampel);
      
      const idLahanTarget = blok ? (blok.properties?.id_lahan || blok.id_lahan) : null;
      const lahan = lahanData.find(l => String(l.properties?.id_lahan || l.id_lahan) === String(idLahanTarget));

      const nilaiBrixAsli = sampel.properties?.nilai_brix || sampel.nilai_brix || 0;
      const namaPetaniAsli = sampel.properties?.nama_petani || sampel.nama_petani || '-';
      
      const waktuMentah = sampel.properties?.waktu_pengukuran || sampel.properties?.created_at || sampel.waktu_pengukuran;
      const waktuAsli = typeof waktuMentah === 'string' ? waktuMentah.replace(' GMT', '') : waktuMentah;

      return {
        no_asli: index + 1, 
        nama_lahan: lahan ? (lahan.properties?.nama_lahan || lahan.nama_lahan) : '-',
        nama_blok: blok ? (blok.properties?.nama_blok || blok.nama_blok) : '-',
        nama_petugas: namaPetaniAsli, 
        latitude: parseFloat(sampel.properties?.latitude || sampel.geometry?.coordinates?.[1] || sampel.latitude || 0).toFixed(6),
        longitude: parseFloat(sampel.properties?.longitude || sampel.geometry?.coordinates?.[0] || sampel.longitude || 0).toFixed(6),
        nilai_brix: parseFloat(nilaiBrixAsli).toFixed(1),
        tanggal: waktuAsli 
          ? new Date(waktuAsli).toLocaleString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })
          : 'Waktu belum diset',
        raw_tanggal: waktuAsli ? new Date(waktuAsli) : new Date(0) 
      };
    });
  }, [sampelData, blokData, lahanData]);

  const filteredTableData = useMemo(() => {
    let result = [...tableData];

    result = result.filter(row => {
      const matchLahan = filters.nama_lahan === '' || row.nama_lahan === filters.nama_lahan;
      const matchBlok = filters.nama_blok === '' || row.nama_blok === filters.nama_blok;
      const matchPetugas = filters.nama_petugas === '' || row.nama_petugas === filters.nama_petugas; 
      return matchLahan && matchBlok && matchPetugas;
    });

    if (filters.sort_tanggal) {
      result.sort((a, b) => {
        const timeA = a.raw_tanggal.getTime();
        const timeB = b.raw_tanggal.getTime();
        return filters.sort_tanggal === 'asc' ? timeA - timeB : timeB - timeA;
      });
    }

    if (filters.sort_brix) {
      result.sort((a, b) => {
        const brixA = parseFloat(a.nilai_brix);
        const brixB = parseFloat(b.nilai_brix);
        return filters.sort_brix === 'asc' ? brixA - brixB : brixB - brixA;
      });
    }

    return result.map((row, index) => ({ ...row, no: index + 1 }));
  }, [tableData, filters]);

  const uniqueLahan = useMemo(() => 
    [...new Set(tableData.map(d => d.nama_lahan))]
      .filter(n => n !== '-')
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })), 
  [tableData]);

  const uniqueBlok = useMemo(() => 
    [...new Set(tableData.map(d => d.nama_blok))]
      .filter(n => n !== '-')
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })), 
  [tableData]);

  const uniquePetugas = useMemo(() => 
    [...new Set(tableData.map(d => d.nama_petugas))]
      .filter(n => n !== '-')
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })), 
  [tableData]);

  const handleFilterChange = (e, column) => {
    setFilters(prev => ({ ...prev, [column]: e.target.value }));
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full">

      <div className="grid grid-cols-2 gap-6 min-h-[350px]">
        {/* ======================= CHART TREN ======================= */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-700 flex items-center gap-2 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-blue-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
              </svg>
              Tren Kenaikan Brix
            </h3>
            <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  value={trendDateRange.start} 
                  onChange={e => setTrendDateRange(prev => ({...prev, start: e.target.value}))} 
                  className="text-[10px] border border-gray-300 rounded p-1.5 outline-none text-gray-600 focus:border-blue-400 cursor-pointer" 
                  title="Tanggal Mulai"
                />
                <span className="text-gray-400 text-[10px] font-bold">-</span>
                <input 
                  type="date" 
                  value={trendDateRange.end} 
                  onChange={e => setTrendDateRange(prev => ({...prev, end: e.target.value}))} 
                  className="text-[10px] border border-gray-300 rounded p-1.5 outline-none text-gray-600 focus:border-blue-400 cursor-pointer" 
                  title="Tanggal Akhir"
                />
                {(trendDateRange.start || trendDateRange.end) && (
                    <button 
                      onClick={() => setTrendDateRange({start: '', end: ''})} 
                      className="text-[10px] bg-red-50 text-red-500 hover:bg-red-100 px-2 py-1.5 rounded font-bold transition"
                    >
                      Reset
                    </button>
                )}
            </div>
          </div>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartTrenData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="tanggal" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="brix" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ======================= CHART BLOK ======================= */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <h3 className="font-bold text-gray-700 mb-6 flex items-center gap-2 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-orange-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            Status Rata-rata per Petak
          </h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartBlokData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="nama_blok" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="rata_brix" radius={[4, 4, 0, 0]}>
                  {chartBlokData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBrixColor(entry.rata_brix)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ======================= TABEL DATA ======================= */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col flex-1 min-h-[400px] overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-gray-700 flex items-center gap-2 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-green-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            Rekapitulasi Data Sampel Brix
          </h3>
          <span className="text-xs font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
            Total Data: {filteredTableData.length}
          </span>
        </div>
        
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-center text-gray-600">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3 font-semibold border-b border-gray-200 align-top text-center">No</th>
                
                <th className="px-4 py-3 font-semibold border-b border-gray-200 align-top min-w-[160px] text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
                    </svg>
                    Nama Lahan
                  </div>
                  <select value={filters.nama_lahan} onChange={(e) => handleFilterChange(e, 'nama_lahan')} className="w-full p-1.5 pr-8 text-xs font-normal border border-gray-300 rounded outline-none focus:border-blue-400 bg-white cursor-pointer hover:bg-gray-50 transition-colors text-center">
                    <option value="">Semua Lahan</option>
                    {uniqueLahan.map(lahan => (
                      <option key={lahan} value={lahan}>{lahan}</option>
                    ))}
                  </select>
                </th>
                
                <th className="px-4 py-3 font-semibold border-b border-gray-200 align-top min-w-[160px] text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                    </svg>
                    Petak
                  </div>
                  <select value={filters.nama_blok} onChange={(e) => handleFilterChange(e, 'nama_blok')} className="w-full p-1.5 pr-8 text-xs font-normal border border-gray-300 rounded outline-none focus:border-blue-400 bg-white cursor-pointer hover:bg-gray-50 transition-colors text-center">
                    <option value="">Semua Petak</option>
                    {uniqueBlok.map(blok => (
                      <option key={blok} value={blok}>{blok}</option>
                    ))}
                  </select>
                </th>

                <th className="px-4 py-3 font-semibold border-b border-gray-200 align-top min-w-[170px] text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    Petugas
                  </div>
                  <select value={filters.nama_petugas} onChange={(e) => handleFilterChange(e, 'nama_petugas')} className="w-full p-1.5 pr-8 text-xs font-normal border border-gray-300 rounded outline-none focus:border-blue-400 bg-white cursor-pointer hover:bg-gray-50 transition-colors text-center">
                    <option value="">Semua Petugas</option>
                    {uniquePetugas.map(petugas => (
                      <option key={petugas} value={petugas}>{petugas}</option>
                    ))}
                  </select>
                </th>
                
                <th className="px-4 py-3 font-semibold border-b border-gray-200 align-top text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    Latitude
                  </div>
                  <div className="h-[28px]"></div>
                </th>
                
                <th className="px-4 py-3 font-semibold border-b border-gray-200 align-top text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    Longitude
                  </div>
                  <div className="h-[28px]"></div>
                </th>
                
                <th className="px-4 py-3 font-semibold border-b border-gray-200 align-top min-w-[150px] text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                    </svg>
                    Nilai Brix
                  </div>
                  <select value={filters.sort_brix} onChange={(e) => handleFilterChange(e, 'sort_brix')} className="w-full p-1.5 pr-8 text-xs font-normal border border-gray-300 rounded outline-none focus:border-blue-400 bg-white cursor-pointer hover:bg-gray-50 transition-colors text-center">
                    <option value="">Urutkan</option>
                    <option value="asc">Terkecil (ASC)</option>
                    <option value="desc">Terbesar (DESC)</option>
                  </select>
                </th>
                
                <th className="px-4 py-3 font-semibold border-b border-gray-200 align-top min-w-[170px] text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Waktu Pengukuran
                  </div>
                  <select value={filters.sort_tanggal} onChange={(e) => handleFilterChange(e, 'sort_tanggal')} className="w-full p-1.5 pr-8 text-xs font-normal border border-gray-300 rounded outline-none focus:border-blue-400 bg-white cursor-pointer hover:bg-gray-50 transition-colors text-center">
                    <option value="">Urutkan</option>
                    <option value="asc">Terlama (ASC)</option>
                    <option value="desc">Terbaru (DESC)</option>
                  </select>
                </th>
              </tr>
            </thead>
            
            <tbody>
              {filteredTableData.length > 0 ? (
                filteredTableData.map((row) => (
                  <tr key={row.no} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-500 text-center">{row.no}</td>
                    <td className="px-4 py-3 text-center">{row.nama_lahan}</td>
                    <td className="px-4 py-3 font-medium text-blue-600 text-center">{row.nama_blok}</td>
                    <td className="px-4 py-3 font-bold text-gray-700 text-center">{row.nama_petugas}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs text-center">{row.latitude}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs text-center">{row.longitude}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold text-white`} style={{ backgroundColor: getBrixColor(row.nilai_brix) }}>
                        {row.nilai_brix}°
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs text-center">{row.tanggal}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-400 italic">
                    Tidak ada data sampel yang sesuai dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}