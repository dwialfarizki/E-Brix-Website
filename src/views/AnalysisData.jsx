import { useMemo, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL, ML_API_BASE_URL } from '../config';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';

const PETAK_LINE_COLORS = [
  '#10b981', // Emerald
  '#0ea5e9', // Sky Blue
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#6366f1'  // Indigo
];

const getMaturityMeta = (val) => {
  const num = parseFloat(val || 0);
  if (num > 19) {
    return {
      label: 'Siap Tebang',
      shortLabel: 'Kemasakan Puncak (> 19°)',
      color: '#ef4444',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      dotClass: 'bg-rose-500'
    };
  }
  if (num >= 15) {
    return {
      label: 'Menjelang Panen',
      shortLabel: 'Matang Optimal (15°–19°)',
      color: '#f59e0b',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      dotClass: 'bg-amber-500'
    };
  }
  return {
    label: 'Fase Vegetatif',
    shortLabel: 'Pertumbuhan Awal (< 15°)',
    color: '#10b981',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500'
  };
};

const CustomChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const validItems = payload.filter(item => item.value !== null && item.value !== undefined && !isNaN(parseFloat(item.value)));
  if (validItems.length === 0) return null;

  // Mode multi-garis (Semua Petak)
  if (validItems.length > 1 || (validItems[0].dataKey !== 'brix' && validItems[0].dataKey !== 'rata_brix')) {
    return (
      <div className="bg-[#091a13]/95 text-white p-3 rounded-xl shadow-xl border border-emerald-500/30 backdrop-blur-md font-sans text-xs min-w-[190px]">
        <p className="text-[10px] font-mono text-emerald-400 font-bold mb-2">{label}</p>
        <div className="space-y-2">
          {validItems.map((entry) => {
            const val = parseFloat(entry.value);
            const mat = getMaturityMeta(val);
            const meta = entry.payload?._meta?.[entry.dataKey];
            return (
              <div key={entry.dataKey} className="space-y-0.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color || mat.color }} />
                    {entry.name || entry.dataKey}
                  </span>
                  <span className="font-mono text-sm font-extrabold" style={{ color: mat.color }}>
                    {val.toFixed(1)}°Bx
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] pl-4 text-slate-400">
                  <span style={{ color: mat.color }} className="font-semibold">{mat.label}</span>
                  {meta?.jenis_tebu && meta.jenis_tebu !== '-' && (
                    <span className="truncate max-w-[100px]">{meta.jenis_tebu}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Mode tunggal (1 petak / bar chart)
  const val = parseFloat(validItems[0].value);
  const pt = validItems[0].payload || {};
  const mat = getMaturityMeta(val);
  return (
    <div className="bg-[#091a13]/95 text-white p-3 rounded-xl shadow-xl border border-emerald-500/30 backdrop-blur-md font-sans text-xs min-w-[175px]">
      <p className="text-[10px] font-mono text-emerald-400 font-bold mb-1">{label}</p>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[10px] text-slate-300">Nilai Brix:</span>
        <span className="font-mono text-base font-extrabold" style={{ color: mat.color }}>
          {val.toFixed(1)}°Bx
        </span>
      </div>
      <div className="mt-1.5 pt-1.5 border-t border-emerald-900/60 space-y-0.5 text-[10px]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-400">Status:</span>
          <span className="font-bold" style={{ color: mat.color }}>{mat.label}</span>
        </div>
        {pt.nama_blok && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400">Petak:</span>
            <span className="font-mono font-semibold text-slate-200">{pt.nama_blok}</span>
          </div>
        )}
        {pt.jenis_tebu && pt.jenis_tebu !== '-' && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400">Varietas:</span>
            <span className="font-medium text-slate-200 truncate max-w-[110px]">{pt.jenis_tebu}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function AnalysisData({
  sampelData,
  blokData,
  selectedLahan,
  setSelectedLahan,
  selectedBlok,
  setSelectedBlok,
  lahanData = [],
  setSampelData,
  onDeletePoin,
  setActiveTab,
  spatialMethod = 'hybrid_rk',
  setSpatialMethod,
  spatialInfo,
  setSpatialInfo
}) {
  const [isLoadingSpatial, setIsLoadingSpatial] = useState(false);
  const spatialReqRef = useRef(0);
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

  // STATE VARIETAS / JENIS TEBU SESUAI STRUKTUR BACKEND
  // Fields: kode_hardware, nama_varietas, ambang_panen, status
  const [customVarieties, setCustomVarieties] = useState(() => {
    try {
      const saved = localStorage.getItem('ebrix_custom_jenis_tebu');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      { id: 'cv-1', kode_hardware: 'HW-BL01', nama_varietas: 'Bululawang (BL)', ambang_panen: 19.0, status: 'dikenali', isCustom: false },
      { id: 'cv-2', kode_hardware: 'HW-PS881', nama_varietas: 'PS 881', ambang_panen: 19.5, status: 'dikenali', isCustom: false },
      { id: 'cv-3', kode_hardware: 'HW-KK01', nama_varietas: 'Kidang Kencana', ambang_panen: 18.5, status: 'dikenali', isCustom: false },
      { id: 'cv-4', kode_hardware: 'HW-PS862', nama_varietas: 'PS 862', ambang_panen: 19.0, status: 'dikenali', isCustom: false },
      { id: 'cv-5', kode_hardware: 'HW-CN01', nama_varietas: 'Cenning (CN 01)', ambang_panen: 19.0, status: 'dikenali', isCustom: false },
    ];
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('tambah'); // 'tambah' | 'katalog'
  const [catalogSearch, setCatalogSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    kode_hardware: '',
    nama_varietas: '',
    ambang_panen: 19.0,
    status: 'dikenali',
    terapkanKeBlok: ''
  });

  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  const [rowEditModal, setRowEditModal] = useState({
    isOpen: false,
    row: null,
    selectedJenis: ''
  });

  // SINKRONISASI GET DARI BACKEND JIKA TERSEDIA
  useEffect(() => {
    const fetchVarieties = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('ebrix_user') || '{}');
        const token = localStorage.getItem('token') || user?.token;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        let res = null;
        try {
          res = await axios.get(`${API_BASE_URL}/jenis-tebu`, { headers });
        } catch {
          res = await axios.get(`${API_BASE_URL}/api/jenis-tebu`, { headers });
        }

        const dataArray = res.data?.data || res.data?.varietas || res.data || [];
        if (Array.isArray(dataArray) && dataArray.length > 0) {
          const parsed = dataArray.map((item, idx) => ({
            id: item.id || `VAR-${idx + 1}`,
            kode_hardware: item.kode_hardware || `HW-${idx + 1}`,
            nama_varietas: item.nama_varietas || item.nama || `Varietas ${item.kode_hardware}`,
            ambang_panen: item.ambang_panen !== undefined ? parseFloat(item.ambang_panen) : 19.0,
            status: item.status || 'dikenali',
            isCustom: true
          }));

          setCustomVarieties(prev => {
            const keys = new Set(parsed.map(p => (p.kode_hardware || p.nama_varietas).toLowerCase()));
            const nonDuplicates = prev.filter(p => !keys.has((p.kode_hardware || p.nama_varietas || p.nama || '').toLowerCase()));
            return [...parsed, ...nonDuplicates];
          });
        }
      } catch {
        // Mode offline/lokal jika backend belum aktif
      }
    };

    fetchVarieties();
  }, []);

  // Simpan varietas kustom ke localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ebrix_custom_jenis_tebu', JSON.stringify(customVarieties));
    } catch (e) {
      console.error('Gagal menyimpan varietas kustom ke localStorage:', e);
    }
  }, [customVarieties]);

  // SINKRONISASI FILTER TABEL DENGAN PILIHAN LAHAN & PETAK DI MAPS
  useEffect(() => {
    const lahanObj = (lahanData || []).find(
      l => String(l.properties?.id_lahan || l.id_lahan) === String(selectedLahan)
    );
    const blokObj = (blokData || []).find(
      b => String(b.properties?.id_blok || b.id_blok) === String(selectedBlok)
    );
    setFilters(prev => ({
      ...prev,
      nama_lahan: selectedLahan === 'all' ? '' : (lahanObj?.properties?.nama_lahan || lahanObj?.nama_lahan || ''),
      nama_blok: selectedBlok === 'all' ? '' : (blokObj?.properties?.nama_blok || blokObj?.nama_blok || '')
    }));
  }, [selectedLahan, selectedBlok, lahanData, blokData]);

  // SINKRONISASI MODEL SPASIAL (HYBRID RF+KRIGING / KED) DENGAN MAPS
  useEffect(() => {
    const arrBlok = Array.isArray(blokData) ? blokData : [];
    const arrSampel = Array.isArray(sampelData) ? sampelData : [];
    if (arrSampel.length === 0) return;

    let activeBloks = arrBlok;
    if (selectedBlok !== 'all') {
      activeBloks = arrBlok.filter(b => String(b?.properties?.id_blok || b?.id_blok) === String(selectedBlok));
    } else if (selectedLahan !== 'all') {
      activeBloks = arrBlok.filter(b => String(b?.properties?.id_lahan || b?.id_lahan) === String(selectedLahan));
    }
    const activeBlokIds = activeBloks.map(b => String(b?.properties?.id_blok || b?.id_blok));

    const clientSamples = arrSampel
      .filter(titik => {
        const idBlokTitik = String(titik?.properties?.id_blok || titik?.id_blok || '');
        if (selectedBlok !== 'all') return idBlokTitik === String(selectedBlok);
        if (selectedLahan !== 'all') return activeBlokIds.includes(idBlokTitik);
        return true;
      })
      .map((titik, idx) => ({
        id: String(titik?.properties?.id_data || titik?.id_data || titik?.id_titik || titik?.properties?.id_titik || idx),
        lon: parseFloat(titik?.longitude || titik?.lng || titik?.geometry?.coordinates?.[0]),
        lat: parseFloat(titik?.latitude || titik?.lat || titik?.geometry?.coordinates?.[1]),
        brix: parseFloat(titik?.nilai_brix || titik?.properties?.nilai_brix)
      }))
      .filter(s => !isNaN(s.lon) && !isNaN(s.lat) && !isNaN(s.brix));

    const clientPolygons = activeBloks
      .map(b => b?.geometry || b?.geojson)
      .filter(g => g && g.type);

    const reqId = ++spatialReqRef.current;
    setIsLoadingSpatial(true);

    let savedUser;
    try { savedUser = JSON.parse(localStorage.getItem('ebrix_user') || '{}'); } catch { savedUser = {}; }
    const token = localStorage.getItem('token') || savedUser?.token;

    axios.post(
      `${ML_API_BASE_URL}/ml/spatial/interpolate`,
      {
        blokId: String(selectedBlok),
        lahanId: String(selectedLahan),
        method: spatialMethod,
        samples: clientSamples,
        polygons: clientPolygons
      },
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    ).then(res => {
      if (reqId !== spatialReqRef.current) return;
      if (setSpatialInfo && res.data?.success) {
        setSpatialInfo(res.data);
      }
    }).catch(() => {
      // Abaikan jika backend spasial tidak terjangkau
    }).finally(() => {
      if (reqId === spatialReqRef.current) setIsLoadingSpatial(false);
    });
  }, [selectedLahan, selectedBlok, spatialMethod, sampelData, blokData, setSpatialInfo]);

  // Daftar petak yang tersedia sesuai lahan terpilih (untuk dropdown kurva)
  const availableBloksForSelectedLahan = useMemo(() => {
    const arr = Array.isArray(blokData) ? blokData : [];
    const filtered = selectedLahan === 'all'
      ? arr
      : arr.filter(b => String(b.properties?.id_lahan || b.id_lahan) === String(selectedLahan));
    return [...filtered].sort((a, b) => {
      const na = a.properties?.nama_blok || a.nama_blok || '';
      const nb = b.properties?.nama_blok || b.nama_blok || '';
      return na.localeCompare(nb, undefined, { numeric: true });
    });
  }, [blokData, selectedLahan]);

  const activeScopeLabel = useMemo(() => {
    if (selectedBlok !== 'all') {
      const b = (blokData || []).find(item => String(item.properties?.id_blok || item.id_blok) === String(selectedBlok));
      const l = b ? (lahanData || []).find(item => String(item.properties?.id_lahan || item.id_lahan) === String(b.properties?.id_lahan || b.id_lahan)) : null;
      const bName = b?.properties?.nama_blok || b?.nama_blok || `Petak ${selectedBlok}`;
      const lName = l?.properties?.nama_lahan || l?.nama_lahan;
      return lName ? `${lName} · ${bName}` : bName;
    }
    if (selectedLahan !== 'all') {
      const l = (lahanData || []).find(item => String(item.properties?.id_lahan || item.id_lahan) === String(selectedLahan));
      return l?.properties?.nama_lahan || l?.nama_lahan || `Lahan ${selectedLahan}`;
    }
    return 'Semua Lahan & Petak';
  }, [selectedLahan, selectedBlok, lahanData, blokData]);

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
      const idBlokItem = String(item.properties?.id_blok || item.id_blok || '');
      const blokObj = (blokData || []).find(b => String(b.properties?.id_blok || b.id_blok) === idBlokItem);
      const jenisTebu = item.properties?.jenis_tebu || item.jenis_tebu || '-';

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
        id_blok: idBlokItem,
        id_lahan: blokObj ? String(blokObj.properties?.id_lahan || blokObj.id_lahan || '') : '',
        nama_blok: blokObj?.properties?.nama_blok || blokObj?.nama_blok || `Petak ${idBlokItem || '?'}`,
        jenis_tebu: jenisTebu,
        _sortDate: sortDate
      };
    }).sort((a, b) => a._sortDate - b._sortDate);
  }, [sampelData, selectedLahan, selectedBlok, blokData, trendDateRange]);

  // DATA MULTI-GARIS PER PETAK SAAT "SEMUA PETAK" DIPILIH
  const multiPetakChart = useMemo(() => {
    if (selectedBlok !== 'all' || chartTrenData.length === 0) {
      return { isMulti: false, series: [], data: [] };
    }

    const seriesMap = new Map();
    chartTrenData.forEach(item => {
      const key = item.nama_blok;
      if (!seriesMap.has(key)) {
        seriesMap.set(key, {
          key,
          id_blok: item.id_blok,
          id_lahan: item.id_lahan,
          lastBrix: item.brix,
          firstBrix: item.brix,
          count: 1
        });
      } else {
        const s = seriesMap.get(key);
        s.lastBrix = item.brix;
        s.count += 1;
      }
    });

    const series = [...seriesMap.values()]
      .sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }))
      .map((s, idx) => ({
        ...s,
        color: PETAK_LINE_COLORS[idx % PETAK_LINE_COLORS.length]
      }));

    if (series.length <= 1) {
      return { isMulti: false, series, data: [] };
    }

    // Gabungkan observasi pada timestamp yang sama ke 1 baris; timestamp berbeda dihubungkan via connectNulls
    const rowMap = new Map();
    chartTrenData.forEach(item => {
      const timeKey = `${item._sortDate.getTime()}_${item.tanggal}`;
      if (!rowMap.has(timeKey)) {
        rowMap.set(timeKey, {
          tanggal: item.tanggal,
          _sortDate: item._sortDate,
          _sums: {},
          _counts: {},
          _meta: {}
        });
      }
      const row = rowMap.get(timeKey);
      row._sums[item.nama_blok] = (row._sums[item.nama_blok] || 0) + item.brix;
      row._counts[item.nama_blok] = (row._counts[item.nama_blok] || 0) + 1;
      row._meta[item.nama_blok] = { jenis_tebu: item.jenis_tebu };
    });

    const data = [...rowMap.values()]
      .sort((a, b) => a._sortDate - b._sortDate)
      .map(row => {
        const cleanRow = { tanggal: row.tanggal, _meta: row._meta };
        Object.keys(row._sums).forEach(k => {
          cleanRow[k] = parseFloat((row._sums[k] / row._counts[k]).toFixed(2));
        });
        return cleanRow;
      });

    return { isMulti: true, series, data };
  }, [chartTrenData, selectedBlok]);

  // RINGKASAN PERKEMBANGAN KENAIKAN BRIX & STATUS KEMATANGAN TEBU
  const brixProgressStats = useMemo(() => {
    if (!chartTrenData || chartTrenData.length === 0) return null;
    const first = chartTrenData[0];
    const last = chartTrenData[chartTrenData.length - 1];
    const values = chartTrenData.map(d => d.brix);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    const delta = last.brix - first.brix;

    let ratePerDay = null;
    const diffMs = last._sortDate.getTime() - first._sortDate.getTime();
    if (diffMs > 12 * 3600 * 1000) {
      const diffDays = diffMs / (24 * 3600 * 1000);
      ratePerDay = delta / diffDays;
    }

    const maturity = getMaturityMeta(last.brix);
    const gapToHarvest = Math.max(0, 19.0 - last.brix);

    return {
      count: chartTrenData.length,
      firstBrix: first.brix,
      lastBrix: last.brix,
      avgBrix: avg,
      maxBrix: maxVal,
      minBrix: minVal,
      delta,
      ratePerDay,
      maturity,
      gapToHarvest
    };
  }, [chartTrenData]);

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
      const idBlok = String(blok.properties?.id_blok || blok.id_blok);
      const idLahan = String(blok.properties?.id_lahan || blok.id_lahan || '');
      const titik = sampelData.filter(t => String(t.id_blok || t.properties?.id_blok) === idBlok);
      const avg = titik.length > 0 ? titik.reduce((sum, t) => sum + parseFloat(t.nilai_brix || t.properties?.nilai_brix || 0), 0) / titik.length : 0;

      return {
        id_blok: idBlok,
        id_lahan: idLahan,
        nama_blok: blok.properties?.nama_blok || blok.nama_blok,
        rata_brix: parseFloat(avg.toFixed(1)),
        jumlah_titik: titik.length
      };
    });
  }, [blokData, sampelData, selectedLahan, selectedBlok]);

  const blokMaturitySummary = useMemo(() => {
    const ready = chartBlokData.filter(b => b.rata_brix > 19).length;
    const mid = chartBlokData.filter(b => b.rata_brix >= 15 && b.rata_brix <= 19).length;
    const veg = chartBlokData.filter(b => b.rata_brix < 15).length;
    return { ready, mid, veg, total: chartBlokData.length };
  }, [chartBlokData]);

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

      const idTitikAsli = sampel.properties?.id_titik || sampel.id_titik || sampel.id || `SMP-${index + 1}`;

      return {
        id_titik: idTitikAsli,
        id_blok: idBlokSampel,
        id_lahan: idLahanTarget ? String(idLahanTarget) : 'all',
        no_asli: index + 1,
        nama_lahan: lahan ? (lahan.properties?.nama_lahan || lahan.nama_lahan) : '-',
        nama_blok: blok ? (blok.properties?.nama_blok || blok.nama_blok) : '-',
        nama_petugas: namaPetaniAsli,
        jenis_tebu: jenisTebuAsli,
        latitude: parseFloat(sampel.properties?.latitude || sampel.geometry?.coordinates?.[1] || sampel.latitude || 0).toFixed(6),
        longitude: parseFloat(sampel.properties?.longitude || sampel.geometry?.coordinates?.[0] || sampel.longitude || 0).toFixed(6),
        nilai_brix: parseFloat(nilaiBrixAsli).toFixed(1),
        tanggal: waktuAsli
          ? new Date(waktuAsli).toLocaleString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
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

  // GABUNGKAN VARIETAS DARI DATA LAPANGAN DAN DAFTAR KUSTOM
  const uniqueJenisTebu = useMemo(() => {
    const listDariData = tableData.map(d => d.jenis_tebu).filter(n => n && n !== '-');
    const listKustom = customVarieties.map(v => v.nama_varietas || v.nama).filter(Boolean);
    return [...new Set([...listDariData, ...listKustom])]
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [tableData, customVarieties]);

  const handleFilterChange = (e, column) => {
    const val = e.target.value;
    setFilters(prev => ({ ...prev, [column]: val }));

    // Sinkronkan filter tabel Lahan & Petak balik ke state global Maps
    if (column === 'nama_lahan' && setSelectedLahan) {
      if (!val) {
        setSelectedLahan('all');
        if (setSelectedBlok) setSelectedBlok('all');
      } else {
        const match = (lahanData || []).find(l => (l.properties?.nama_lahan || l.nama_lahan) === val);
        if (match) {
          setSelectedLahan(String(match.properties?.id_lahan || match.id_lahan));
          if (setSelectedBlok) setSelectedBlok('all');
        }
      }
    } else if (column === 'nama_blok' && setSelectedBlok) {
      if (!val) {
        setSelectedBlok('all');
      } else {
        const match = (blokData || []).find(b => (b.properties?.nama_blok || b.nama_blok) === val);
        if (match) {
          setSelectedBlok(String(match.properties?.id_blok || match.id_blok));
        }
      }
    }
  };

  const handleOpenOnMap = (idLahanTarget, idBlokTarget) => {
    if (idLahanTarget && setSelectedLahan) setSelectedLahan(String(idLahanTarget));
    if (idBlokTarget && setSelectedBlok) setSelectedBlok(String(idBlokTarget));
    if (setActiveTab) setActiveTab('peta');
  };

  const hasActiveTableFilters = Boolean(
    filters.nama_lahan ||
    filters.nama_blok ||
    filters.nama_petugas ||
    filters.jenis_tebu ||
    filters.sort_brix
  );

  const handleResetTableFilters = () => {
    setFilters({
      nama_lahan: '',
      nama_blok: '',
      nama_petugas: '',
      jenis_tebu: '',
      sort_brix: '',
      sort_tanggal: 'desc'
    });
    if (setSelectedLahan) setSelectedLahan('all');
    if (setSelectedBlok) setSelectedBlok('all');
  };

  // HANDLER SIMPAN JENIS TEBU (INTEGRASI POST KE BACKEND)
  // Backend payload: { kode_hardware, nama_varietas, ambang_panen, status }
  const handleSimpanJenisTebu = async (e) => {
    e.preventDefault();

    if (!formData.kode_hardware.trim()) {
      setFeedbackMsg({ type: 'error', text: '⚠️ Kode hardware wajib diisi sesuai format controller backend!' });
      return;
    }

    if (!formData.nama_varietas.trim()) {
      setFeedbackMsg({ type: 'error', text: '⚠️ Nama varietas tebu wajib diisi!' });
      return;
    }

    const payload = {
      kode_hardware: formData.kode_hardware.trim(),
      nama_varietas: formData.nama_varietas.trim(),
      ambang_panen: parseFloat(formData.ambang_panen) || 19.0,
      status: formData.status || 'dikenali'
    };

    setIsSubmitting(true);
    setFeedbackMsg({ type: '', text: '' });

    try {
      const user = JSON.parse(localStorage.getItem('ebrix_user') || '{}');
      const token = localStorage.getItem('token') || user?.token;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Coba kirim ke endpoint backend
      try {
        await axios.post(`${API_BASE_URL}/jenis-tebu`, payload, { headers });
      } catch (postErr) {
        if (postErr.response?.status === 404) {
          // Fallback coba prefix /api/jenis-tebu
          await axios.post(`${API_BASE_URL}/api/jenis-tebu`, payload, { headers });
        } else {
          throw postErr;
        }
      }

      setFeedbackMsg({
        type: 'success',
        text: `✅ Varietas "${payload.nama_varietas}" (Kode: ${payload.kode_hardware}) berhasil disimpan ke database backend!`
      });
    } catch (err) {
      if (err.response?.status === 409) {
        setFeedbackMsg({
          type: 'error',
          text: `⚠️ ${err.response.data?.message || 'Kode hardware sudah terdaftar di database'}`
        });
        setIsSubmitting(false);
        return;
      }
      if (err.response?.status === 400) {
        setFeedbackMsg({
          type: 'error',
          text: `⚠️ ${err.response.data?.message || 'kode_hardware wajib diisi'}`
        });
        setIsSubmitting(false);
        return;
      }

      // Jika backend sedang offline / mode simulasi demo
      setFeedbackMsg({
        type: 'success',
        text: `✅ Varietas "${payload.nama_varietas}" (${payload.kode_hardware}) disimpan ke sistem (Mode Simulasi)!`
      });
    } finally {
      setIsSubmitting(false);
    }

    // Perbarui local state
    const existingIndex = customVarieties.findIndex(
      v => (v.kode_hardware && v.kode_hardware.toLowerCase() === payload.kode_hardware.toLowerCase()) ||
        ((v.nama_varietas || v.nama || '').toLowerCase() === payload.nama_varietas.toLowerCase())
    );

    let updatedList = [...customVarieties];
    if (existingIndex >= 0) {
      updatedList[existingIndex] = {
        ...updatedList[existingIndex],
        ...payload
      };
    } else {
      updatedList = [
        {
          id: `VAR-${Date.now()}`,
          ...payload,
          isCustom: true,
          createdAt: new Date().toISOString()
        },
        ...customVarieties
      ];
    }
    setCustomVarieties(updatedList);

    // Jika operator memilih untuk langsung menerapkan ke petak blok
    if (formData.terapkanKeBlok && setSampelData) {
      setSampelData(prev => prev.map(sampel => {
        const idBlok = String(sampel.properties?.id_blok || sampel.id_blok);
        if (idBlok === String(formData.terapkanKeBlok)) {
          return {
            ...sampel,
            jenis_tebu: payload.nama_varietas,
            properties: {
              ...(sampel.properties || {}),
              jenis_tebu: payload.nama_varietas,
              kode_hardware: payload.kode_hardware
            }
          };
        }
        return sampel;
      }));
    }

    // Arahkan filter langsung ke jenis tebu yang baru ditambahkan
    setFilters(prev => ({ ...prev, jenis_tebu: payload.nama_varietas }));

    setTimeout(() => {
      setFormData({
        kode_hardware: '',
        nama_varietas: '',
        ambang_panen: 19.0,
        status: 'dikenali',
        terapkanKeBlok: ''
      });
      setIsAddModalOpen(false);
      setFeedbackMsg({ type: '', text: '' });
    }, 1200);
  };

  // HANDLER HAPUS VARIETAS DARI DAFTAR
  const handleHapusVarietas = async (id, item) => {
    const nama = item.nama_varietas || item.nama;
    const kode = item.kode_hardware || '-';

    if (!window.confirm(`⚠️ Yakin ingin menghapus varietas "${nama}" (Kode: ${kode}) dari katalog?`)) return;

    try {
      const user = JSON.parse(localStorage.getItem('ebrix_user') || '{}');
      const token = localStorage.getItem('token') || user?.token;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const identifier = item.kode_hardware || item.id || id;
      await axios.delete(`${API_BASE_URL}/jenis-tebu/${identifier}`, { headers }).catch(() =>
        axios.delete(`${API_BASE_URL}/api/jenis-tebu/${identifier}`, { headers })
      );
    } catch {
      // Offline fallback
    }

    setCustomVarieties(prev => prev.filter(v => v.id !== id && v.kode_hardware !== item.kode_hardware));
    if (filters.jenis_tebu === nama) {
      setFilters(prev => ({ ...prev, jenis_tebu: '' }));
    }
  };

  // HANDLER UPDATE ROW JENIS TEBU
  const handleSaveRowVariety = () => {
    if (!rowEditModal.row || !rowEditModal.selectedJenis) return;
    const targetId = rowEditModal.row.id_titik;
    const newJenis = rowEditModal.selectedJenis;

    if (setSampelData) {
      setSampelData(prev => prev.map(sampel => {
        const idTitik = String(sampel.properties?.id_titik || sampel.id_titik || sampel.id);
        if (idTitik === String(targetId)) {
          return {
            ...sampel,
            jenis_tebu: newJenis,
            properties: {
              ...(sampel.properties || {}),
              jenis_tebu: newJenis
            }
          };
        }
        return sampel;
      }));
    }

    setRowEditModal({ isOpen: false, row: null, selectedJenis: '' });
  };

  // HANDLER HAPUS BARIS DATA OBSERVASI SAMPEL
  const handleDeleteRow = (row) => {
    const id_titik = row.id_titik;
    if (!id_titik) {
      alert("⚠️ ID titik observasi tidak ditemukan!");
      return;
    }

    if (onDeletePoin) {
      onDeletePoin(id_titik);
    } else {
      const isConfirmed = window.confirm(
        `⚠ Yakin ingin menghapus titik sampel ${id_titik} (${row.nama_blok} - ${row.nilai_brix}°Bx)? Data tidak dapat dikembalikan!`
      );
      if (isConfirmed) {
        axios.delete(`${API_BASE_URL}/data-brix/${id_titik}`).catch(() => { });
        if (setSampelData) {
          setSampelData(prev => prev.filter(t => {
            const itemKey = t.id_titik || t.properties?.id_titik || t.properties?.id_data || t.id_data || t.id || t.properties?.id;
            return String(itemKey) !== String(id_titik);
          }));
        }
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-6">

      {/* ======================= KONTROL WILAYAH & SINKRONISASI SPASIAL ======================= */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden shrink-0">
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-extrabold text-slate-800 text-sm sm:text-[15px] tracking-tight">
                  Kontrol Wilayah &amp; Sinkronisasi Spasial
                </h3>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  TERHUBUNG KE MAPS
                </span>
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200/70 px-2.5 py-0.5 rounded-lg truncate max-w-[260px]">
                  {activeScopeLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Filter lahan, petak, dan algoritma spasial tersinkronisasi dua arah dengan Dashboard Peta
              </p>
            </div>
          </div>

          {/* Action Shortcuts */}
          {setActiveTab && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('peta')}
                className="h-9 px-3.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-200 transition flex items-center gap-1.5 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <span>Lihat di Peta</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('prediksi_ai')}
                title="Uji skenario iklim, irigasi, dan varietas tebu dengan Model Machine Learning"
                className="h-9 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#081f16] via-[#0d2e21] to-emerald-800 hover:from-emerald-700 hover:to-teal-700 transition shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
              >
                <svg className="w-3.5 h-3.5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Simulasi Panen AI</span>
                <span className="text-emerald-300">→</span>
              </button>
            </div>
          )}
        </div>

        {/* Unified Filter & Spatial Model Bar */}
        <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[260px]">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Cakupan:</span>
            </div>

            <select
              aria-label="Pilih Lahan"
              value={selectedLahan}
              onChange={(e) => {
                if (setSelectedLahan) setSelectedLahan(e.target.value);
                if (setSelectedBlok) setSelectedBlok('all');
              }}
              className="h-9 px-3 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl bg-white hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer min-w-[170px]"
            >
              <option value="all">Semua Lahan ({(lahanData || []).length})</option>
              {(lahanData || []).map(l => {
                const idL = String(l.properties?.id_lahan || l.id_lahan);
                const namaL = l.properties?.nama_lahan || l.nama_lahan;
                return <option key={idL} value={idL}>{namaL}</option>;
              })}
            </select>

            <select
              aria-label="Pilih Petak atau Blok"
              value={selectedBlok}
              onChange={(e) => {
                const val = e.target.value;
                if (setSelectedBlok) setSelectedBlok(val);
                if (val !== 'all' && setSelectedLahan && selectedLahan === 'all') {
                  const matched = availableBloksForSelectedLahan.find(
                    b => String(b.properties?.id_blok || b.id_blok) === val
                  );
                  const idL = matched?.properties?.id_lahan || matched?.id_lahan;
                  if (idL) setSelectedLahan(String(idL));
                }
              }}
              className="h-9 px-3 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl bg-white hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer min-w-[170px]"
            >
              <option value="all">Semua Petak ({availableBloksForSelectedLahan.length})</option>
              {availableBloksForSelectedLahan.map(b => {
                const idB = String(b.properties?.id_blok || b.id_blok);
                const namaB = b.properties?.nama_blok || b.nama_blok;
                return <option key={idB} value={idB}>{namaB}</option>;
              })}
            </select>

            {(selectedLahan !== 'all' || selectedBlok !== 'all') && setSelectedLahan && setSelectedBlok && (
              <button
                type="button"
                onClick={() => {
                  setSelectedLahan('all');
                  setSelectedBlok('all');
                }}
                className="h-9 px-3 rounded-xl text-[11px] font-bold text-slate-600 bg-white hover:bg-rose-50 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition cursor-pointer"
              >
                Reset Wilayah
              </button>
            )}
          </div>

          {/* Switcher Algoritma Spasial */}
          {setSpatialMethod && (
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">
                Model Spasial:
              </span>
              <div className="inline-flex p-1 bg-slate-200/70 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSpatialMethod('hybrid_rk')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${spatialMethod === 'hybrid_rk'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Hybrid RF + Kriging
                </button>
                <button
                  type="button"
                  onClick={() => setSpatialMethod('ked')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${spatialMethod === 'ked'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  KED (Drift)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Metrik Spasial Live */}
        {spatialInfo?.summary && (
          <div className="p-4 sm:px-5 bg-slate-50/30 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200/80 rounded-xl px-3.5 py-3 flex flex-col justify-between">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimasi Spasial</div>
              <div className="font-mono text-xl font-extrabold text-slate-900 mt-1">
                {spatialInfo.summary.brix_rata}°<span className="text-xs font-bold text-emerald-600 ml-0.5">Bx</span>
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-1">
                Rentang {spatialInfo.summary.brix_min}° – {spatialInfo.summary.brix_max}°
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl px-3.5 py-3 flex flex-col justify-between">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sebaran Zona Peta</div>
              <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-slate-100 my-2">
                {spatialInfo.summary.persen_zona.tinggi > 0 && (
                  <div style={{ width: `${spatialInfo.summary.persen_zona.tinggi}%` }} className="bg-rose-500 h-full" />
                )}
                {spatialInfo.summary.persen_zona.sedang > 0 && (
                  <div style={{ width: `${spatialInfo.summary.persen_zona.sedang}%` }} className="bg-amber-400 h-full" />
                )}
                {spatialInfo.summary.persen_zona.rendah > 0 && (
                  <div style={{ width: `${spatialInfo.summary.persen_zona.rendah}%` }} className="bg-emerald-500 h-full" />
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono font-semibold">
                <span className="text-rose-600">{spatialInfo.summary.persen_zona.tinggi}% Tinggi</span>
                <span className="text-amber-600">{spatialInfo.summary.persen_zona.sedang}% Sedang</span>
                <span className="text-emerald-600">{spatialInfo.summary.persen_zona.rendah}% Rendah</span>
              </div>
            </div>

            <div className="bg-white border border-emerald-200/80 rounded-xl px-3.5 py-3 flex flex-col justify-between">
              <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                Validasi ({spatialInfo.validation?.cv_mode || 'CV'})
              </div>
              {spatialInfo.validation ? (
                <>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-mono text-xl font-extrabold text-emerald-700">
                      {spatialInfo.validation.akurasi_persen}%
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-slate-500">
                      MAE ±{Number(spatialInfo.validation.mae).toFixed(2)}°
                    </span>
                  </div>
                  {spatialInfo.comparison?.hybrid_rk && spatialInfo.comparison?.ked ? (
                    <div className="text-[11px] font-mono text-slate-500 mt-1">
                      RF+Krig {spatialInfo.comparison.hybrid_rk.akurasi_persen}% · KED {spatialInfo.comparison.ked.akurasi_persen}%
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 mt-1">Validasi silang aktif</div>
                  )}
                </>
              ) : (
                <div className="text-xs font-medium text-amber-700 mt-2">Butuh minimal 4 titik sampel</div>
              )}
            </div>

            <div className={`rounded-xl px-3.5 py-3 border flex flex-col justify-between ${spatialInfo.summary.jumlah_anomali > 0
                ? 'bg-violet-50/70 border-violet-200/90'
                : 'bg-white border-slate-200/80'
              }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Anomali Spasial</span>
                {isLoadingSpatial && (
                  <span className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
              <div className={`font-mono text-xl font-extrabold mt-1 ${spatialInfo.summary.jumlah_anomali > 0 ? 'text-violet-700' : 'text-emerald-700'
                }`}>
                {spatialInfo.summary.jumlah_anomali > 0
                  ? `${spatialInfo.summary.jumlah_anomali} Titik`
                  : 'Normal (0)'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {isLoadingSpatial
                  ? 'Memperbarui interpolasi...'
                  : spatialInfo.summary.jumlah_anomali > 0
                    ? 'Cek penanda lingkar ungu di Peta'
                    : 'Tidak ada penyimpangan signifikan'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================= CHART ROW ======================= */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch shrink-0">

        {/* CHART 1: KURVA DINAMIKA KENAIKAN BRIX */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200/90 flex flex-col">

          <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">
                  Kurva Dinamika Kenaikan Brix
                </h3>
                <p className="text-[11px] text-slate-500">
                  Perkembangan kadar gula tebu · <span className="font-semibold text-slate-600">{activeScopeLabel}</span>
                </p>
              </div>
            </div>

            {/* Compact Date Filters */}
            <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs font-mono">
              <input
                type="date"
                value={trendDateRange.start}
                onChange={e => setTrendDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="text-[11px] h-7 bg-transparent text-slate-700 focus:outline-none cursor-pointer"
                title="Tanggal Mulai"
              />
              <span className="text-slate-400 font-bold">–</span>
              <input
                type="date"
                value={trendDateRange.end}
                onChange={e => setTrendDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="text-[11px] h-7 bg-transparent text-slate-700 focus:outline-none cursor-pointer"
                title="Tanggal Akhir"
              />
              {(trendDateRange.start || trendDateRange.end) && (
                <button
                  type="button"
                  onClick={() => setTrendDateRange({ start: '', end: '' })}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Strip Status Kematangan & Laju Kenaikan Brix */}
          {brixProgressStats ? (
            <div className="mb-3.5 px-3.5 py-2.5 rounded-xl bg-slate-50/90 border border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5 min-h-[52px]">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${brixProgressStats.maturity.badgeClass}`}>
                  <span className={`w-2 h-2 rounded-full ${brixProgressStats.maturity.dotClass}`} />
                  {brixProgressStats.maturity.label}
                </span>
                <span className="text-[11px] text-slate-600">
                  {brixProgressStats.gapToHarvest > 0 ? (
                    <>Kurang <b className="font-mono text-slate-800">{brixProgressStats.gapToHarvest.toFixed(1)}°Bx</b> ke siap tebang</>
                  ) : (
                    <span className="text-rose-700 font-semibold">Memenuhi ambang giling (≥ 19°Bx)</span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2.5 font-mono text-[11px]">
                <span className="text-slate-500">
                  <b>{brixProgressStats.firstBrix.toFixed(1)}°</b> → <b className="text-slate-900">{brixProgressStats.lastBrix.toFixed(1)}°</b>
                </span>
                <span className={`px-2 py-0.5 rounded-md font-bold border ${brixProgressStats.delta >= 0
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                  {brixProgressStats.delta >= 0 ? '+' : ''}{brixProgressStats.delta.toFixed(1)}°Bx
                  {brixProgressStats.ratePerDay !== null && (
                    <span className="font-normal ml-1">
                      ({brixProgressStats.ratePerDay >= 0 ? '+' : ''}{brixProgressStats.ratePerDay.toFixed(2)}°/hr)
                    </span>
                  )}
                </span>
              </div>
            </div>
          ) : (
            <div className="mb-3.5 px-3.5 py-2.5 rounded-xl bg-slate-50/70 border border-slate-200/60 text-[11px] text-slate-400 min-h-[52px] flex items-center">
              Pilih rentang tanggal atau wilayah dengan data sampel untuk menampilkan ringkasan progres Brix.
            </div>
          )}

          {/* Legenda Interaktif Per Petak saat mode Semua Petak aktif */}
          {multiPetakChart.isMulti && (
            <div className="flex flex-wrap items-center gap-1.5 mb-3 max-h-[68px] overflow-y-auto pr-1">
              {multiPetakChart.series.map(s => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => {
                    if (s.id_lahan && setSelectedLahan && selectedLahan === 'all') {
                      setSelectedLahan(String(s.id_lahan));
                    }
                    if (s.id_blok && setSelectedBlok) setSelectedBlok(String(s.id_blok));
                  }}
                  title={`Klik untuk fokus ke ${s.key} (Brix terbaru ${s.lastBrix.toFixed(1)}°Bx)`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white hover:bg-emerald-50/60 text-slate-700 border border-slate-200 hover:border-emerald-300 transition cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span>{s.key}</span>
                  <span className="font-mono font-bold text-slate-500">{s.lastBrix.toFixed(1)}°</span>
                </button>
              ))}
            </div>
          )}

          <div className="h-[300px] w-full mt-auto">
            {chartTrenData.length > 0 ? (
              multiPetakChart.isMulti ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={multiPetakChart.data} margin={{ top: 16, right: 24, bottom: 5, left: -12 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="tanggal"
                      tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'JetBrains Mono' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis
                      domain={[0, 24]}
                      tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'JetBrains Mono' }}
                      tickLine={false}
                      axisLine={false}
                      unit="°"
                    />
                    <ReferenceLine
                      y={15}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      label={{ value: 'Matang 15°', position: 'insideBottomLeft', fill: '#d97706', fontSize: 10, fontWeight: 700 }}
                    />
                    <ReferenceLine
                      y={19}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      label={{ value: 'Siap Tebang 19°', position: 'insideTopLeft', fill: '#dc2626', fontSize: 10, fontWeight: 700 }}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    {multiPetakChart.series.map(s => (
                      <Line
                        key={s.key}
                        type="monotone"
                        dataKey={s.key}
                        name={s.key}
                        stroke={s.color}
                        strokeWidth={2.5}
                        connectNulls={true}
                        dot={{ fill: s.color, stroke: '#ffffff', strokeWidth: 1.5, r: 3.5 }}
                        activeDot={{ r: 6, fill: s.color, stroke: '#ffffff', strokeWidth: 2 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartTrenData} margin={{ top: 16, right: 24, bottom: 5, left: -12 }}>
                    <defs>
                      <linearGradient id="brixAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
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
                      domain={[0, 24]}
                      tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'JetBrains Mono' }}
                      tickLine={false}
                      axisLine={false}
                      unit="°"
                    />
                    <ReferenceLine
                      y={15}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      label={{ value: 'Matang 15°', position: 'insideBottomLeft', fill: '#d97706', fontSize: 10, fontWeight: 700 }}
                    />
                    <ReferenceLine
                      y={19}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      label={{ value: 'Siap Tebang 19°', position: 'insideTopLeft', fill: '#dc2626', fontSize: 10, fontWeight: 700 }}
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
              )
            ) : (
              <div className="h-full min-h-[260px] flex flex-col items-center justify-center gap-2 text-xs text-slate-400 bg-slate-50/40 rounded-xl border border-dashed border-slate-200">
                <svg className="w-7 h-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span>Belum ada data observasi Brix pada lahan/periode yang dipilih.</span>
              </div>
            )}
          </div>
        </div>

        {/* CHART 2: DISTRIBUSI KEMATANGAN TIAP PETAK */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200/90 flex flex-col">

          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">
                  Distribusi Kematangan Tiap Petak
                </h3>
                <p className="text-[11px] text-slate-500">
                  Rata-rata Brix per blok · klik batang untuk fokus ke kurva &amp; peta
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 border border-slate-200/70 px-2.5 py-1 rounded-lg">
                {blokMaturitySummary.total} Petak
              </span>
              {(selectedLahan !== 'all' || selectedBlok !== 'all') && setSelectedLahan && setSelectedBlok && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLahan('all');
                    setSelectedBlok('all');
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer"
                >
                  Tampilkan Semua
                </button>
              )}
            </div>
          </div>

          {/* Strip Ringkasan Kategori Kematangan Petak */}
          <div className="mb-3.5 p-2 rounded-xl bg-slate-50/90 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-2 min-h-[52px] items-center">
            <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold">
              <span className="inline-flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span className="truncate">Siap (&gt;19°)</span>
              </span>
              <span className="font-mono">{blokMaturitySummary.ready}</span>
            </div>
            <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold">
              <span className="inline-flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span className="truncate">Optimal (15°–19°)</span>
              </span>
              <span className="font-mono">{blokMaturitySummary.mid}</span>
            </div>
            <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
              <span className="inline-flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">Vegetatif (&lt;15°)</span>
              </span>
              <span className="font-mono">{blokMaturitySummary.veg}</span>
            </div>
          </div>

          <div className="h-[300px] w-full mt-auto">
            {chartBlokData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartBlokData} margin={{ top: 16, right: 24, bottom: 5, left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="nama_blok"
                    tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'JetBrains Mono' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    domain={[0, 24]}
                    tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'JetBrains Mono' }}
                    tickLine={false}
                    axisLine={false}
                    unit="°"
                  />
                  <ReferenceLine
                    y={15}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    label={{ value: 'Matang 15°', position: 'insideBottomRight', fill: '#d97706', fontSize: 10, fontWeight: 700 }}
                  />
                  <ReferenceLine
                    y={19}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    label={{ value: 'Siap Tebang 19°', position: 'insideTopRight', fill: '#dc2626', fontSize: 10, fontWeight: 700 }}
                  />
                  <Tooltip content={<CustomChartTooltip />} cursor={{ fill: 'rgba(16, 185, 129, 0.06)' }} />
                  <Bar
                    dataKey="rata_brix"
                    maxBarSize={54}
                    radius={[6, 6, 0, 0]}
                    className="cursor-pointer"
                    onClick={(entry) => {
                      if (!entry?.id_blok || !setSelectedBlok) return;
                      if (String(selectedBlok) === String(entry.id_blok)) {
                        setSelectedBlok('all');
                      } else {
                        if (entry.id_lahan && setSelectedLahan) setSelectedLahan(String(entry.id_lahan));
                        setSelectedBlok(String(entry.id_blok));
                      }
                    }}
                  >
                    {chartBlokData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBrixColor(entry.rata_brix)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full min-h-[260px] flex flex-col items-center justify-center gap-2 text-xs text-slate-400 bg-slate-50/40 rounded-xl border border-dashed border-slate-200">
                <svg className="w-7 h-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Belum ada data petak untuk ditampilkan.</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ======================= TABEL DATA TELEMETRI ======================= */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 flex flex-col shrink-0 overflow-hidden">

        {/* Table Header Bar */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3 bg-slate-50/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
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

          <div className="flex flex-wrap items-center gap-2">
            {hasActiveTableFilters && (
              <button
                type="button"
                onClick={handleResetTableFilters}
                className="h-8 px-3 rounded-xl text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
              >
                Reset Filter
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setModalTab('tambah');
                setIsAddModalOpen(true);
              }}
              className="h-8 px-3 rounded-xl text-[11px] font-bold text-emerald-700 bg-white hover:bg-emerald-50 border border-emerald-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Kelola Varietas</span>
            </button>
            <span className="h-8 inline-flex items-center text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 rounded-xl">
              {hasActiveTableFilters
                ? `${filteredTableData.length} / ${tableData.length} RECORD`
                : `TOTAL: ${filteredTableData.length} RECORD`}
            </span>
          </div>
        </div>

        {/* Table Viewport */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-xs text-left text-slate-600 border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs border-b border-slate-200">
              {/* Row 1: Column Labels */}
              <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th rowSpan={2} className="px-4 py-3 font-mono text-center w-12 align-middle border-r border-slate-100">#</th>
                <th className="px-3.5 pt-3 pb-1.5 min-w-[165px]">Lahan Induk</th>
                <th className="px-3.5 pt-3 pb-1.5 min-w-[155px]">Petak Blok</th>
                <th className="px-3.5 pt-3 pb-1.5 min-w-[175px]">Jenis Tebu</th>
                <th className="px-3.5 pt-3 pb-1.5 min-w-[155px]">Petugas Surveyor</th>
                <th rowSpan={2} className="px-3.5 py-3 font-mono text-center min-w-[175px] align-middle">
                  <div>Koordinat</div>
                  <div className="text-[9px] font-normal text-slate-400 normal-case mt-0.5">WGS84 (Lat, Lng)</div>
                </th>
                <th className="px-3.5 pt-3 pb-1.5 min-w-[135px] text-center">Nilai Brix (°Bx)</th>
                <th className="px-3.5 pt-3 pb-1.5 min-w-[160px]">Waktu Observasi</th>
                <th rowSpan={2} className="px-4 py-3 text-center w-24 align-middle border-l border-slate-100">Aksi</th>
              </tr>

              {/* Row 2: Compact Filter Controls */}
              <tr className="bg-slate-50/60">
                <th className="px-3.5 pb-2.5 pt-1 font-normal">
                  <select
                    value={filters.nama_lahan}
                    onChange={(e) => handleFilterChange(e, 'nama_lahan')}
                    className="w-full h-8 px-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg outline-none bg-white hover:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                  >
                    <option value="">Semua Lahan</option>
                    {uniqueLahan.map(lahan => (
                      <option key={lahan} value={lahan}>{lahan}</option>
                    ))}
                  </select>
                </th>
                <th className="px-3.5 pb-2.5 pt-1 font-normal">
                  <select
                    value={filters.nama_blok}
                    onChange={(e) => handleFilterChange(e, 'nama_blok')}
                    className="w-full h-8 px-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg outline-none bg-white hover:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                  >
                    <option value="">Semua Petak</option>
                    {uniqueBlok.map(blok => (
                      <option key={blok} value={blok}>{blok}</option>
                    ))}
                  </select>
                </th>
                <th className="px-3.5 pb-2.5 pt-1 font-normal">
                  <select
                    value={filters.jenis_tebu}
                    onChange={(e) => handleFilterChange(e, 'jenis_tebu')}
                    className="w-full h-8 px-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg outline-none bg-white hover:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                  >
                    <option value="">Semua Jenis</option>
                    {uniqueJenisTebu.map(jenis => (
                      <option key={jenis} value={jenis}>
                        {jenis} {customVarieties.some(c => (c.nama_varietas || c.nama) === jenis && c.isCustom) ? '(Manual)' : ''}
                      </option>
                    ))}
                  </select>
                </th>
                <th className="px-3.5 pb-2.5 pt-1 font-normal">
                  <select
                    value={filters.nama_petugas}
                    onChange={(e) => handleFilterChange(e, 'nama_petugas')}
                    className="w-full h-8 px-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg outline-none bg-white hover:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                  >
                    <option value="">Semua Petugas</option>
                    {uniquePetugas.map(petugas => (
                      <option key={petugas} value={petugas}>{petugas}</option>
                    ))}
                  </select>
                </th>
                <th className="px-3.5 pb-2.5 pt-1 font-normal">
                  <select
                    value={filters.sort_brix}
                    onChange={(e) => handleFilterChange(e, 'sort_brix')}
                    className="w-full h-8 px-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg outline-none bg-white hover:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                  >
                    <option value="">Urutkan</option>
                    <option value="asc">Terendah (Asc)</option>
                    <option value="desc">Tertinggi (Desc)</option>
                  </select>
                </th>
                <th className="px-3.5 pb-2.5 pt-1 font-normal">
                  <select
                    value={filters.sort_tanggal}
                    onChange={(e) => handleFilterChange(e, 'sort_tanggal')}
                    className="w-full h-8 px-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg outline-none bg-white hover:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
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
                  <tr key={row.no} className="hover:bg-emerald-50/35 transition-colors">
                    <td className="px-4 py-3 font-mono text-center text-slate-400 font-semibold tabular-nums">{row.no}</td>
                    <td className="px-3.5 py-3 font-semibold text-slate-800">{row.nama_lahan}</td>
                    <td className="px-3.5 py-3">
                      <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                        {row.nama_blok}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 font-medium text-slate-700">
                      <div className="flex items-center justify-between gap-1.5 group">
                        {row.jenis_tebu !== '-' ? (
                          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                            <span className="truncate max-w-[140px]">{row.jenis_tebu}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Standar</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setRowEditModal({
                            isOpen: true,
                            row,
                            selectedJenis: row.jenis_tebu !== '-' ? row.jenis_tebu : uniqueJenisTebu[0] || ''
                          })}
                          title={`Ubah jenis tebu titik ${row.id_titik}`}
                          className="opacity-45 group-hover:opacity-100 p-1 rounded-md hover:bg-emerald-100/70 text-slate-400 hover:text-emerald-700 transition cursor-pointer shrink-0"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-3.5 py-3 font-medium text-slate-700">
                      {row.nama_petugas}
                    </td>
                    <td className="px-3.5 py-3 text-center font-mono text-[11px] text-slate-500 tabular-nums">
                      {row.latitude}, {row.longitude}
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <span
                        className="inline-flex items-center justify-center font-mono font-bold text-[11px] px-2.5 py-1 rounded-lg text-white shadow-2xs tabular-nums"
                        style={{ backgroundColor: getBrixColor(parseFloat(row.nilai_brix)) }}
                      >
                        {row.nilai_brix}°Bx
                      </span>
                    </td>
                    <td className="px-3.5 py-3 font-mono text-[11px] text-slate-500 tabular-nums whitespace-nowrap">
                      {row.tanggal}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center justify-center gap-1.5">
                        {setActiveTab && (
                          <button
                            type="button"
                            onClick={() => handleOpenOnMap(row.id_lahan, row.id_blok)}
                            title={`Lihat ${row.nama_blok} (${row.nama_lahan}) di Peta`}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-50/70 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-200/80 hover:border-emerald-600 transition-all duration-150 cursor-pointer shadow-2xs"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                            </svg>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(row)}
                          title={`Hapus data observasi ${row.id_titik}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200/80 hover:border-rose-200 transition-all duration-150 cursor-pointer shadow-2xs group"
                        >
                          <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="font-medium text-xs">Tidak ada data sampel yang cocok dengan filter aktif.</span>
                      {hasActiveTableFilters && (
                        <button
                          type="button"
                          onClick={handleResetTableFilters}
                          className="mt-1 px-3 py-1 rounded-lg text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer"
                        >
                          Reset Semua Filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* ============================================================== */}
      {/* MODAL 1: TAMBAH & KELOLA VARIETAS / JENIS TEBU MANUAL           */}
      {/* ============================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-auto animate-fade-in-up">

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-900 via-forest-900 to-teal-900 p-6 text-white relative">
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setFeedbackMsg({ type: '', text: '' });
                }}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-white">
                    Kelola Varietas & Jenis Tebu
                  </h3>
                  <p className="text-xs text-emerald-300/80 font-mono">
                    Registrasi manual varietas tebu untuk katalog & analisis
                  </p>
                </div>
              </div>

              {/* Tabs Switcher */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalTab('tambah')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${modalTab === 'tambah'
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-600/40'
                      : 'bg-white/10 text-slate-200 hover:bg-white/20'
                    }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Tambah Varietas Baru
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('katalog')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${modalTab === 'katalog'
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-600/40'
                      : 'bg-white/10 text-slate-200 hover:bg-white/20'
                    }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Katalog Varietas ({customVarieties.length})
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">

              {/* Feedback Alert */}
              {feedbackMsg.text && (
                <div className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${feedbackMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : feedbackMsg.type === 'error'
                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                  <span>{feedbackMsg.text}</span>
                </div>
              )}

              {/* TAB 1: FORM TAMBAH VARIETAS BARU (SESUAI BACKEND) */}
              {modalTab === 'tambah' && (
                <form onSubmit={handleSimpanJenisTebu} className="space-y-4">

                  {/* Grid 1: Kode Hardware & Nama Varietas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-wider">
                          Kode Hardware <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[9px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">
                          Primary Key
                        </span>
                      </div>
                      <input
                        type="text"
                        required
                        value={formData.kode_hardware}
                        onChange={e => setFormData({ ...formData, kode_hardware: e.target.value })}
                        placeholder="Misal: HW-01, BL-01, SENS-BL..."
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 uppercase"
                        autoFocus
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        ID identifier sensor refraktometer hardware dari alat penguji.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Nama Varietas Tebu <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.nama_varietas}
                        onChange={e => setFormData({ ...formData, nama_varietas: e.target.value })}
                        placeholder="Misal: Bululawang (BL), PS 881, Cenning..."
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Nama spesifik kultivar/varietas tebu yang diuji.
                      </p>
                    </div>
                  </div>

                  {/* Grid 2: Ambang Panen & Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Ambang Panen Min Brix (°Bx)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="35"
                        required
                        value={formData.ambang_panen}
                        onChange={e => setFormData({ ...formData, ambang_panen: e.target.value })}
                        placeholder="Contoh: 19.0"
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-slate-400"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Batas minimum nilai Brix untuk status tebang/panen optimal.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Status Varietas Hardware
                      </label>
                      <select
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                      >
                        <option value="dikenali">dikenali (Resmi / Terverifikasi)</option>
                        <option value="belum_dikenali">belum_dikenali (Auto-Reg / Belum Kalibrasi)</option>
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Status pengenalan hardware pada sistem telemetri kebun.
                      </p>
                    </div>
                  </div>

                  {/* Opsi Penerapan ke Petak Blok Tertentu */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                    <label className="block text-[10px] font-mono font-bold text-emerald-800 uppercase tracking-wider mb-1">
                      Opsi Penerapan ke Petak Lapangan (Tabel Analisis)
                    </label>
                    <p className="text-[11px] text-slate-600 mb-2">
                      Pilih petak blok jika Anda ingin seluruh titik sampel pada petak tersebut otomatis disetel ke varietas ini.
                    </p>
                    <select
                      value={formData.terapkanKeBlok}
                      onChange={e => setFormData({ ...formData, terapkanKeBlok: e.target.value })}
                      className="w-full h-9 px-3 border border-emerald-200 rounded-xl text-xs font-semibold text-slate-800 outline-none bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                      <option value="">Hanya simpan ke backend & filter dropdown</option>
                      {blokData.map(blok => {
                        const bId = String(blok.properties?.id_blok || blok.id_blok);
                        const bNama = blok.properties?.nama_blok || blok.nama_blok;
                        return (
                          <option key={bId} value={bId}>
                            Terapkan ke: {bNama} (Semua titik di petak ini)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="h-10 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`h-10 px-5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-mono text-xs font-bold rounded-xl shadow-lg shadow-emerald-700/25 transition flex items-center gap-2 cursor-pointer ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      <span>{isSubmitting ? 'Menyimpan...' : 'Kirim ke Backend & Terapkan'}</span>
                    </button>
                  </div>

                </form>
              )}

              {/* TAB 2: KATALOG & DAFTAR VARIETAS TERSEDIA */}
              {modalTab === 'katalog' && (
                <div className="space-y-4">
                  {/* Pencarian Katalog */}
                  <div className="relative">
                    <input
                      type="text"
                      value={catalogSearch}
                      onChange={e => setCatalogSearch(e.target.value)}
                      placeholder="Cari berdasarkan nama varietas atau kode hardware..."
                      className="w-full h-9 pl-9 pr-3 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  {/* List Varietas */}
                  <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                    {customVarieties
                      .filter(v => {
                        const q = catalogSearch.toLowerCase();
                        const nama = (v.nama_varietas || v.nama || '').toLowerCase();
                        const kode = (v.kode_hardware || v.kode || '').toLowerCase();
                        return nama.includes(q) || kode.includes(q);
                      })
                      .map((item) => {
                        const namaTampil = item.nama_varietas || item.nama;
                        const kodeTampil = item.kode_hardware || item.kode;
                        const ambangTampil = item.ambang_panen !== undefined ? item.ambang_panen : 19.0;
                        const statusTampil = item.status || 'dikenali';
                        const countInTable = tableData.filter(d => d.jenis_tebu === namaTampil).length;

                        return (
                          <div
                            key={item.id}
                            className="p-3.5 rounded-2xl border border-slate-200/90 hover:border-emerald-300 bg-white hover:bg-emerald-50/20 transition-all flex items-start justify-between gap-3 shadow-2xs"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-sm text-slate-900">
                                  {namaTampil}
                                </span>
                                {kodeTampil && (
                                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                    {kodeTampil}
                                  </span>
                                )}
                                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${statusTampil === 'dikenali'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                                  }`}>
                                  {statusTampil}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-slate-400 pt-1">
                                <span className="text-amber-700 font-semibold inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  <span>Ambang Panen:</span>
                                  <span className="font-bold">≥ {ambangTampil}°Bx</span>
                                </span>
                                <span className="text-slate-500 inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  <span>Digunakan pada {countInTable} titik sampel</span>
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setFilters(prev => ({ ...prev, jenis_tebu: namaTampil }));
                                  setIsAddModalOpen(false);
                                }}
                                title="Filter tabel dengan jenis ini"
                                className="px-2 py-1 text-[10px] font-mono font-bold bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg border border-emerald-200 transition"
                              >
                                Filter
                              </button>
                              <button
                                type="button"
                                onClick={() => handleHapusVarietas(item.id, item)}
                                title="Hapus varietas ini"
                                className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: UBAH JENIS TEBU PER TITIK SAMPEL OBSERVASI             */}
      {/* ============================================================== */}
      {rowEditModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-fade-in-up">

            <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h4 className="font-extrabold text-slate-800 text-sm">
                  Ubah Jenis Tebu Titik
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setRowEditModal({ isOpen: false, row: null, selectedJenis: '' })}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                <div className="flex justify-between font-mono text-[11px] text-slate-500">
                  <span>ID Titik:</span>
                  <span className="font-bold text-slate-800">{rowEditModal.row?.id_titik}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Petak / Blok:</span>
                  <span className="font-bold text-emerald-700">{rowEditModal.row?.nama_blok}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Nilai Brix:</span>
                  <span className="font-mono font-bold text-slate-800">{rowEditModal.row?.nilai_brix}°Bx</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Pilih Varietas / Jenis Tebu
                </label>
                <select
                  value={rowEditModal.selectedJenis}
                  onChange={e => setRowEditModal(prev => ({ ...prev, selectedJenis: e.target.value }))}
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                >
                  {uniqueJenisTebu.map(jenis => (
                    <option key={jenis} value={jenis}>
                      {jenis}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRowEditModal({ isOpen: false, row: null, selectedJenis: '' })}
                  className="h-9 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveRowVariety}
                  className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold rounded-xl transition shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}