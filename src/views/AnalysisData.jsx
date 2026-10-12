import { useMemo, useState } from 'react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    const color = val > 19 ? '#ef4444' : val >= 15 ? '#f59e0b' : '#10b981';
    return (
      <div className="bg-[#091a13]/95 text-white p-3 rounded-xl shadow-xl border border-emerald-500/30 backdrop-blur-md font-sans text-xs">
        <p className="text-[10px] font-mono text-emerald-400 font-bold mb-1">{label}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[10px] text-slate-300">Nilai Brix:</span>
          <span className="font-mono text-base font-extrabold text-white" style={{ color }}>
            {val}°Bx
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export default function AnalysisData({ sampelData, blokData, selectedLahan, selectedBlok, lahanData = [] }) {
  const [filters, setFilters] = useState({
    nama_lahan: '',
    nama_blok: '',
    nama_petugas: '', 
    jenis_tebu: '',
    sort_brix: '',
    sort_tanggal: 'desc' 
  });

  const [trendDateRange, setTrendDateRange] = useState({
    start: '',
    end: ''
  });

  // LOGIKA GRAFIK TREN BRIX 
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

  // LOGIKA GRAFIK BLOK
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

  // LOGIKA TABEL 
  const tableData = useMemo(() => {
    return sampelData.map((sampel, index) => {
      const idBlokSampel = String(sampel.properties?.id_blok || sampel.id_blok);
      const blok = blokData.find(b => String(b.properties?.id_blok || b.id_blok) === idBlokSampel);
      
      const idLahanTarget = blok ? (blok.properties?.id_lahan || blok.id_lahan) : null;
      const lahan = lahanData.find(l => String(l.properties?.id_lahan || l.id_lahan) === String(idLahanTarget));

      const nilaiBrixAsli = sampel.properties?.nilai_brix || sampel.nilai_brix || 0;
      const namaPetaniAsli = sampel.properties?.nama_petani || sampel.nama_petani || '-';
      const jenisTebuAsli = sampel.properties?.jenis_tebu || sampel.jenis_tebu || '-';

      const waktuMentah = sampel.properties?.waktu_pengukuran || sampel.properties?.created_at || sampel.waktu_pengukuran;
      const waktuAsli = typeof waktuMentah === 'string' ? waktuMentah.replace(' GMT', '') : waktuMentah;

      return {
        no_asli: index + 1, 
        nama_lahan: lahan ? (lahan.properties?.nama_lahan || lahan.nama_lahan) : '-',
        nama_blok: blok ? (blok.properties?.nama_blok || blok.nama_blok) : '-',
        nama_petugas: namaPetaniAsli, 
        jenis_tebu: jenisTebuAsli,
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
      const matchJenisTebu = filters.jenis_tebu === '' || row.jenis_tebu === filters.jenis_tebu;
      return matchLahan && matchBlok && matchPetugas && matchJenisTebu;
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

  const uniqueJenisTebu = useMemo(() => 
    [...new Set(tableData.map(d => d.jenis_tebu))]
      .filter(n => n !== '-')
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })), 
  [tableData]);

  const handleFilterChange = (e, column) => {
    setFilters(prev => ({ ...prev, [column]: e.target.value }));
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full">

      {/* ======================= CHART ROW ======================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[380px]">
        
        {/* CHART 1: TREN WAKTU DENGAN AREA GRADIENT */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/90 flex flex-col relative overflow-hidden">
          
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">
                  Kurva Dinamika Kenaikan Brix
                </h3>
                <p className="text-[11px] text-slate-500">
                  Pergerakan akumulasi sukrosa sepanjang periode sampling
                </p>
              </div>
            </div>

            {/* Date Filters */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <input 
                type="date" 
                value={trendDateRange.start} 
                onChange={e => setTrendDateRange(prev => ({...prev, start: e.target.value}))} 
                className="text-[10px] h-8 border border-slate-200 rounded-lg px-2 text-slate-700 bg-slate-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer" 
                title="Tanggal Mulai"
              />
              <span className="text-slate-400 font-bold">-</span>
              <input 
                type="date" 
                value={trendDateRange.end} 
                onChange={e => setTrendDateRange(prev => ({...prev, end: e.target.value}))} 
                className="text-[10px] h-8 border border-slate-200 rounded-lg px-2 text-slate-700 bg-slate-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer" 
                title="Tanggal Akhir"
              />
              {(trendDateRange.start || trendDateRange.end) && (
                <button 
                  onClick={() => setTrendDateRange({start: '', end: ''})} 
                  className="h-8 px-2 rounded-lg text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartTrenData} margin={{ top: 10, right: 15, bottom: 5, left: -10 }}>
                <defs>
                  <linearGradient id="brixAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="tanggal" 
                  tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'JetBrains Mono' }} 
                  tickLine={false} 
                  axisLine={{ stroke: '#e2e8f0' }} 
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'JetBrains Mono' }} 
                  tickLine={false} 
                  axisLine={false} 
                  unit="°"
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="brix" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#brixAreaGradient)" 
                  dot={{ fill: '#059669', strokeWidth: 2, r: 3 }} 
                  activeDot={{ r: 6, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: STATUS RATA-RATA PETAK */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/90 flex flex-col relative overflow-hidden">
          
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">
                Distribusi Kematangan Tiap Petak
              </h3>
              <p className="text-[11px] text-slate-500">
                Tolak ukur rata-rata Brix petak untuk penentuan jadwal tebang
              </p>
            </div>
          </div>

          <div className="flex-1 min-h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartBlokData} margin={{ top: 10, right: 15, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="nama_blok" 
                  tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'JetBrains Mono' }} 
                  tickLine={false} 
                  axisLine={{ stroke: '#e2e8f0' }} 
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'JetBrains Mono' }} 
                  tickLine={false} 
                  axisLine={false} 
                  unit="°"
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Bar dataKey="rata_brix" radius={[6, 6, 0, 0]}>
                  {chartBlokData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBrixColor(entry.rata_brix)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ======================= TABEL DATA TELEMETRI ======================= */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 flex flex-col flex-1 min-h-[420px] overflow-hidden">
        
        {/* Table Header Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">
                Log Buku Besar Pengukuran Brix Lapangan
              </h3>
              <p className="text-[11px] text-slate-500">
                Daftar terperinci observasi refraktometer di setiap titik koordinat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-3 py-1 rounded-xl shadow-xs">
              TOTAL: {filteredTableData.length} RECORD
            </span>
          </div>
        </div>
        
        {/* Table Viewport */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-xs text-left text-slate-600">
            <thead className="text-[11px] text-slate-600 uppercase bg-slate-50/90 sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-mono font-bold text-center w-12">#</th>
                
                {/* Lahan */}
                <th className="px-4 py-3 font-bold min-w-[170px]">
                  <div className="mb-1.5 flex items-center gap-1 text-slate-500">Lahan Induk</div>
                  <select 
                    value={filters.nama_lahan} 
                    onChange={(e) => handleFilterChange(e, 'nama_lahan')} 
                    className="w-full h-8 px-2 text-xs font-medium border border-slate-200 rounded-lg outline-none bg-white focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">Semua Lahan</option>
                    {uniqueLahan.map(lahan => (
                      <option key={lahan} value={lahan}>{lahan}</option>
                    ))}
                  </select>
                </th>
                
                {/* Petak */}
                <th className="px-4 py-3 font-bold min-w-[170px]">
                  <div className="mb-1.5 flex items-center gap-1 text-slate-500">Petak Blok</div>
                  <select 
                    value={filters.nama_blok} 
                    onChange={(e) => handleFilterChange(e, 'nama_blok')} 
                    className="w-full h-8 px-2 text-xs font-medium border border-slate-200 rounded-lg outline-none bg-white focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">Semua Petak</option>
                    {uniqueBlok.map(blok => (
                      <option key={blok} value={blok}>{blok}</option>
                    ))}
                  </select>
                </th>

                {/* Jenis Tebu */}
                <th className="px-4 py-3 font-bold min-w-[160px]">
                  <div className="mb-1.5 flex items-center gap-1 text-slate-500">Jenis Tebu</div>
                  <select 
                    value={filters.jenis_tebu} 
                    onChange={(e) => handleFilterChange(e, 'jenis_tebu')} 
                    className="w-full h-8 px-2 text-xs font-medium border border-slate-200 rounded-lg outline-none bg-white focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">Semua Jenis</option>
                    {uniqueJenisTebu.map(jenis => (
                      <option key={jenis} value={jenis}>{jenis}</option>
                    ))}
                  </select>
                </th>

                {/* Petugas */}
                <th className="px-4 py-3 font-bold min-w-[160px]">
                  <div className="mb-1.5 flex items-center gap-1 text-slate-500">Petugas Surveyor</div>
                  <select 
                    value={filters.nama_petugas} 
                    onChange={(e) => handleFilterChange(e, 'nama_petugas')} 
                    className="w-full h-8 px-2 text-xs font-medium border border-slate-200 rounded-lg outline-none bg-white focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">Semua Petugas</option>
                    {uniquePetugas.map(petugas => (
                      <option key={petugas} value={petugas}>{petugas}</option>
                    ))}
                  </select>
                </th>
                
                {/* Spasial Koordinat */}
                <th className="px-4 py-3 font-mono font-bold text-center min-w-[180px]">
                  <div className="mb-1.5 text-slate-500">Koordinat (Lat, Lng)</div>
                  <div className="h-8 flex items-center justify-center text-[10px] text-slate-400">WGS84 EPSG:4326</div>
                </th>
                
                {/* Nilai Brix */}
                <th className="px-4 py-3 font-bold min-w-[140px] text-center">
                  <div className="mb-1.5 text-slate-500">Nilai Brix (°Bx)</div>
                  <select 
                    value={filters.sort_brix} 
                    onChange={(e) => handleFilterChange(e, 'sort_brix')} 
                    className="w-full h-8 px-2 text-xs font-medium border border-slate-200 rounded-lg outline-none bg-white focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">Urutkan</option>
                    <option value="asc">Terendah (Asc)</option>
                    <option value="desc">Tertinggi (Desc)</option>
                  </select>
                </th>
                
                {/* Timestamp */}
                <th className="px-4 py-3 font-bold min-w-[160px]">
                  <div className="mb-1.5 text-slate-500">Waktu Observasi</div>
                  <select 
                    value={filters.sort_tanggal} 
                    onChange={(e) => handleFilterChange(e, 'sort_tanggal')} 
                    className="w-full h-8 px-2 text-xs font-medium border border-slate-200 rounded-lg outline-none bg-white focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="desc">Terbaru (Desc)</option>
                    <option value="asc">Terlama (Asc)</option>
                  </select>
                </th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100">
              {filteredTableData.length > 0 ? (
                filteredTableData.map((row) => (
                  <tr key={row.no} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-center text-slate-400 font-semibold">{row.no}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">{row.nama_lahan}</td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/50">
                        {row.nama_blok}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-700">
                      {row.jenis_tebu !== '-' ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {row.jenis_tebu}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Standar</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">
                      {row.nama_petugas}
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono text-[11px] text-slate-500">
                      {row.latitude}, {row.longitude}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span 
                        className="inline-flex items-center justify-center font-mono font-bold text-xs px-2.5 py-1 rounded-md text-white shadow-xs" 
                        style={{ backgroundColor: getBrixColor(parseFloat(row.nilai_brix)) }}
                      >
                        {row.nilai_brix}°Bx
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">
                      {row.tanggal}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="font-medium text-xs">Tidak ada data sampel yang cocok dengan filter aktif.</span>
                    </div>
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