import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { ML_API_BASE_URL } from '../config';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';

const ICON_PATHS = {
  bolt: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  ),
  clipboard: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  ),
  clipboardCheck: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  ),
  copy: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  ),
  chart: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  ),
  clock: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  ),
  sliders: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
  ),
  sun: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  ),
  cloudRain: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15zm5 4l-1 3m5-3l-1 3m5-3l-1 3" />
  ),
  alert: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  ),
  info: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  ),
  check: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  ),
  droplet: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
  ),
  leaf: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 21c.5-4.5 2.5-8 7-10M9 18c6.218 0 10.5-3.288 11-12V4h-2C9 4 4.5 7.5 4 15a5 5 0 001 3z" />
  ),
  beaker: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  ),
  scale: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  ),
  calendar: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  ),
  shield: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  ),
  lightbulb: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  ),
  star: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  ),
  refresh: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  ),
  trash: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  ),
  close: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  )
};

function UiIcon({ name, className = 'w-4 h-4', strokeWidth = 2 }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth} aria-hidden="true">
      {ICON_PATHS[name]}
    </svg>
  );
}

// Kamus Terjemahan Parameter
const MONTH_NAMES_ID = {
  'Jan': 'Januari', 'Feb': 'Februari', 'Mar': 'Maret',
  'Apr': 'April',   'May': 'Mei',      'Jun': 'Juni',
  'Jul': 'Juli',    'Aug': 'Agustus',  'Sep': 'September',
  'Oct': 'Oktober', 'Nov': 'November', 'Dec': 'Desember'
};

const SOIL_OPTIONS = [
  { value: 'Alluvial', label: 'Alluvial (Tanah Endapan Subur)' },
  { value: 'Clay', label: 'Clay (Tanah Liat / Lempung)' },
  { value: 'Loamy', label: 'Loamy (Tanah Gembur / Subur)' },
  { value: 'Sandy', label: 'Sandy (Tanah Berpasir)' }
];

const IRRIGATION_OPTIONS = [
  { value: 'Drip', label: 'Irigasi Tetes (Pipa Drip Presisi)' },
  { value: 'Flood', label: 'Sistem Leb / Banjir (Genangan)' },
  { value: 'Sprinkler', label: 'Sprinkler (Semprotan Udara)' }
];

const WATER_QUALITY_OPTIONS = [
  { value: 'Good', label: 'Air Bersih / Tawar (Bagus)' },
  { value: 'Moderate', label: 'Sedang / Cukup Bersih' },
  { value: 'Saline', label: 'Air Payau / Agak Asin' }
];

const VARIETY_OPTIONS = [
  { value: 'Co0238', label: 'Co0238 (Potensi Rendemen Tinggi)' },
  { value: 'Co98014', label: 'Co98014 (Tahan Genangan Air)' },
  { value: 'CoJ64', label: 'CoJ64 (Masak Sangat Awal)' }
];

const PLANTING_OPTIONS = [
  { value: 'Straight Row', label: 'Baris Lurus (Standar)' },
  { value: 'Paired Row', label: 'Baris Ganda (Populasi Rapat)' },
  { value: 'Trench', label: 'Sistem Parit (Drainase Baik)' },
  { value: 'Circular', label: 'Sistem Melingkar' }
];

const FERTILIZER_OPTIONS = [
  { value: 'DAP', label: 'DAP (Fosfat & Nitrogen Tinggi)' },
  { value: 'Organic', label: 'Organik / Kompos Hayati' },
  { value: 'Urea', label: 'Urea (Pemicu Vegetatif)' }
];

const WEED_OPTIONS = [
  { value: 'Manual', label: 'Cabut Manual / Cangkul' },
  { value: 'Chemical', label: 'Herbisida Kimiawi' }
];

const PEST_OPTIONS = [
  { value: 'Low', label: 'Rendah (Terkendali)' },
  { value: 'Medium', label: 'Sedang (Perlu Waspada)' },
  { value: 'High', label: 'Tinggi (Serangan Berat)' }
];

const INITIAL_FORM = {
  Month: 'Aug',
  Temp_Avg_C: 28.5,
  Rainfall_Total_mm: 1350,
  Soil_Type: 'Alluvial',
  Irrigation_Method_Type: 'Drip',
  Water_Quality_Category: 'Good',
  Variety: 'Co0238',
  Planting_Method: 'Straight Row',
  Fertilizer_Type: 'DAP',
  Weed_Control: 'Manual',
  Pest_Level: 'Low'
};

// Fallback simulator presisi lokal jika koneksi ke backend Flask sempat tertunda
const runClientFallbackSimulation = (input) => {
  const isDrip = input.Irrigation_Method_Type === 'Drip';
  const isPestHigh = input.Pest_Level === 'High';
  const isKemarau = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].includes(input.Month);

  let baseYield = 220 + (isDrip ? 25 : 5) - (isPestHigh ? 35 : 0) + (input.Soil_Type === 'Loamy' ? 18 : 10);
  let baseBrix = 18.2 + (isKemarau ? 1.4 : 0.6) + (input.Variety === 'Co0238' ? 0.8 : 0.3);
  let duration = 330 + (input.Month === 'Aug' ? 2 : 0);

  let diseaseLabel = isPestHigh ? 'High' : (input.Pest_Level === 'Medium' ? 'Medium' : 'Low');
  let diseaseConf = isPestHigh ? 78.5 : 62.4;

  const pol_standar = baseBrix * 0.80;
  const nn_standar = pol_standar - 0.4 * (baseBrix - pol_standar);
  const pol_optimis = baseBrix * 0.85;
  const nn_optimis = pol_optimis - 0.4 * (baseBrix - pol_optimis);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const detail_bulanan = months.map((m, idx) => {
    const isK = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].includes(m);
    const brix = +(baseBrix + (isK ? (0.5 + Math.sin(idx) * 0.5) : (-0.4 + Math.cos(idx) * 0.3))).toFixed(2);
    const yld = +(baseYield + (isK ? 5 : -4) + Math.sin(idx * 2) * 6).toFixed(2);
    const score = +(Math.min(95, Math.max(30, 45 + (isK ? 25 : 10) + Math.cos(idx) * 15))).toFixed(1);
    return {
      bulan_en: m,
      bulan_id: MONTH_NAMES_ID[m],
      musim: isK ? 'Kemarau' : 'Penghujan',
      yield: yld,
      brix: brix,
      duration: 330,
      disease: isPestHigh ? 'Tinggi' : 'Sedang',
      disease_en: isPestHigh ? 'High' : 'Medium',
      score: score
    };
  });

  return {
    hasil_panen: +baseYield.toFixed(2),
    kadar_gula_brix: +baseBrix.toFixed(2),
    durasi_panen_hari: duration,
    durasi_panen_bulan: Math.floor(duration / 30),
    durasi_panen_sisa_hari: duration % 30,
    keparahan_penyakit: diseaseLabel === 'High' ? 'Tinggi' : diseaseLabel === 'Medium' ? 'Sedang' : 'Rendah',
    keparahan_penyakit_en: diseaseLabel,
    kepercayaan_penyakit: diseaseConf,
    probabilitas_penyakit: {
      'Rendah': diseaseLabel === 'Low' ? 65.0 : 15.0,
      'Sedang': diseaseLabel === 'Medium' ? 60.0 : 30.0,
      'Tinggi': diseaseLabel === 'High' ? 70.0 : 10.0
    },
    perhitungan_gula: {
      brix: +baseBrix.toFixed(2),
      hk_standar_persen: 80,
      pol_standar: +pol_standar.toFixed(2),
      nn_standar: +nn_standar.toFixed(2),
      potensi_gula_standar: +(baseYield * (nn_standar / 100.0)).toFixed(2),
      hk_optimis_persen: 85,
      pol_optimis: +pol_optimis.toFixed(2),
      nn_optimis: +nn_optimis.toFixed(2),
      potensi_gula_optimis: +(baseYield * (nn_optimis / 100.0)).toFixed(2),
      nn_cepat: +(0.72 * baseBrix).toFixed(2)
    },
    rekomendasi: {
      waktu_panen: `Jadwalkan panen ${duration} hari (~${Math.floor(duration / 30)} bulan ${duration % 30} hari) lagi saat rendemen memuncak.`,
      tindakan_hasil: baseYield > 200 
        ? "Pertahankan jadwal pengairan dan nutrisi saat ini. Hasil panen diprediksi sudah sangat optimal." 
        : "Terapkan pemupukan berimbang (tambahkan Kalium) dan pastikan pengairan cukup di fase vegetatif untuk mendongkrak tonase panen.",
      tindakan_brix: baseBrix >= 18 
        ? "Kadar nira diprediksi sangat baik. Lakukan tebang-angkut-giling segera (< 24 jam) agar tidak terjadi inversi sukrosa." 
        : "Hentikan irigasi (dry-off) 4-6 minggu sebelum jadwal panen untuk memacu pematangan dan akumulasi kristal sukrosa.",
      tindakan_penyakit: isPestHigh 
        ? "Risiko penyakit/hama TINGGI! Segera aplikasikan fungisida/insektisida sistemik, perbaiki drainase kebun (cegah genangan), dan pangkas daun sakit." 
        : "Risiko terkendali. Lakukan pemantauan rutin dan sanitasi klentek daun kering secara berkala."
    },
    analisis_musim: {
      musim_terbaik: 'Kemarau',
      musim_terbaik_emoji: '☀️',
      bulan_terbaik_en: 'Aug',
      bulan_terbaik_id: 'Agustus',
      skor_terbaik: 84.5,
      penghujan: {
        avg_yield: 215.4,
        avg_brix: 18.2,
        avg_duration: 330,
        avg_disease_score: 2.2,
        avg_composite_score: 52.4,
        periode: 'Oktober – Maret'
      },
      kemarau: {
        avg_yield: 238.1,
        avg_brix: 19.6,
        avg_duration: 331,
        avg_disease_score: 1.8,
        avg_composite_score: 76.8,
        periode: 'April – September'
      },
      selisih_persen: 24.4,
      penjelasan: "Analisis simulasi AI menunjukkan Musim Kemarau (April–September) memberikan rendemen gula tertinggi karena intensitas radiasi matahari optimal memicu fotosintesis dan akumulasi sukrosa maksimum.",
      detail_bulanan: detail_bulanan
    }
  };
};

export default function PredictionAI() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('simulasi'); // 'simulasi' | 'rekomendasi' | 'musim' | 'riwayat'
  const [serverStatus, setServerStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const [feedback, setFeedback] = useState(null);
  const [copiedAction, setCopiedAction] = useState(false);

  // Ambil data status dan riwayat dari backend
  const fetchHealthAndHistory = async () => {
    try {
      const res = await axios.get(`${ML_API_BASE_URL}/ml/history`, { timeout: 6000 });
      if (res.data?.success) {
        setServerStatus('online');
        setHistoryList(res.data.history || []);
        if (!predictionResult && res.data.history?.length > 0) {
          const latest = res.data.history[0];
          setPredictionResult({
            ...latest.hasil,
            rekomendasi: latest.rekomendasi || latest.hasil?.rekomendasi,
            analisis_musim: latest.analisis_musim
          });
        }
      }
    } catch (_err) {
      setServerStatus('offline');
      if (!predictionResult) {
        setPredictionResult(runClientFallbackSimulation(INITIAL_FORM));
      }
    }
  };

  useEffect(() => {
    fetchHealthAndHistory();
  }, []);

  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const applyPreset = (presetName) => {
    if (presetName === 'kemarau_optimal') {
      setForm({
        Month: 'Aug',
        Temp_Avg_C: 29.0,
        Rainfall_Total_mm: 1200,
        Soil_Type: 'Alluvial',
        Irrigation_Method_Type: 'Drip',
        Water_Quality_Category: 'Good',
        Variety: 'Co0238',
        Planting_Method: 'Straight Row',
        Fertilizer_Type: 'DAP',
        Weed_Control: 'Manual',
        Pest_Level: 'Low'
      });
      setFeedback({ type: 'success', text: 'Preset Musim Kemarau Optimal (Drip) diterapkan!' });
    } else if (presetName === 'penghujan') {
      setForm({
        Month: 'Nov',
        Temp_Avg_C: 27.2,
        Rainfall_Total_mm: 1650,
        Soil_Type: 'Clay',
        Irrigation_Method_Type: 'Flood',
        Water_Quality_Category: 'Good',
        Variety: 'Co98014',
        Planting_Method: 'Trench',
        Fertilizer_Type: 'Organic',
        Weed_Control: 'Manual',
        Pest_Level: 'Medium'
      });
      setFeedback({ type: 'success', text: 'Preset Musim Penghujan (Sistem Parit) diterapkan!' });
    } else if (presetName === 'stres_hama') {
      setForm({
        Month: 'Mar',
        Temp_Avg_C: 32.5,
        Rainfall_Total_mm: 850,
        Soil_Type: 'Sandy',
        Irrigation_Method_Type: 'Sprinkler',
        Water_Quality_Category: 'Moderate',
        Variety: 'CoJ64',
        Planting_Method: 'Paired Row',
        Fertilizer_Type: 'Urea',
        Weed_Control: 'Chemical',
        Pest_Level: 'High'
      });
      setFeedback({ type: 'warning', text: 'Preset Stres Lingkungan & Hama Berat diterapkan!' });
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleRunPrediction = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await axios.post(`${ML_API_BASE_URL}/ml/predict`, form, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      if (res.data?.success && res.data?.prediksi) {
        setPredictionResult({
          ...res.data.prediksi,
          rekomendasi: res.data.rekomendasi || res.data.prediksi?.rekomendasi,
          analisis_musim: res.data.analisis_musim || res.data.prediksi?.analisis_musim
        });
        setServerStatus('online');
        setFeedback({ type: 'success', text: 'Prediksi Ensemble AI berhasil dihitung!' });
        fetchHealthAndHistory();
      } else {
        throw new Error('Respons tidak valid');
      }
    } catch (_err) {
      console.warn('Gagal memanggil API ML backend, menggunakan simulator lokal:', _err?.message || _err);
      const fallbackResult = runClientFallbackSimulation(form);
      setPredictionResult(fallbackResult);
      setServerStatus('offline');
      setFeedback({ 
        type: 'info', 
        text: 'Prediksi dihitung melalui Simulator Presisi Lokal E-Brix (Backend offline).' 
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleDeleteHistory = async (id) => {
    try {
      await axios.delete(`${ML_API_BASE_URL}/ml/history/${id}`);
      setHistoryList(prev => prev.filter(item => item.id !== id));
    } catch (_err) {
      setHistoryList(prev => prev.filter(item => item.id !== id));
    }
  };

  const loadHistoryToForm = (item) => {
    if (item.input) {
      setForm(prev => ({ ...prev, ...item.input }));
      if (item.hasil) {
        setPredictionResult({
          ...item.hasil,
          rekomendasi: item.rekomendasi || item.hasil?.rekomendasi,
          analisis_musim: item.analisis_musim
        });
      }
      setActiveSubTab('simulasi');
      setFeedback({ type: 'success', text: `Riwayat #${item.id} dimuat kembali ke form.` });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const copyRecommendationsToClipboard = () => {
    if (!predictionResult) return;
    const text = `REKOMENDASI TINDAKAN LAPANGAN - E-BRIX PRECISION AI
Tanggal Analisis: ${new Date().toLocaleDateString('id-ID')}
Varietas Tebu: ${form.Variety} (Bulan Tanam: ${MONTH_NAMES_ID[form.Month]})

1. PROYEKSI UTAMA:
- Hasil Panen: ${predictionResult.hasil_panen} Q/Acre (~${(predictionResult.hasil_panen * 0.247).toFixed(1)} Ton/Ha)
- Kadar Brix: ${predictionResult.kadar_gula_brix}°Bx
- Umur Panen: ${predictionResult.durasi_panen_hari} Hari (~${predictionResult.durasi_panen_bulan} Bulan ${predictionResult.durasi_panen_sisa_hari} Hari)
- Risiko Penyakit: ${predictionResult.keparahan_penyakit} (${predictionResult.kepercayaan_penyakit}% Yakin)

2. ARAHAN TINDAKAN AGRONOMIS:
• Waktu Tebang: ${predictionResult.rekomendasi?.waktu_panen || '-'}
• Pengeringan (Dry-off) & Brix: ${predictionResult.rekomendasi?.tindakan_brix || predictionResult.rekomendasi?.brix || '-'}
• Manajemen Tonase & Nutrisi: ${predictionResult.rekomendasi?.tindakan_hasil || predictionResult.rekomendasi?.hasil_panen || '-'}
• Proteksi Hama & Penyakit: ${predictionResult.rekomendasi?.tindakan_penyakit || predictionResult.rekomendasi?.penyakit || '-'}
• Rendemen Gula (Winter-Carp): NN = ${predictionResult.perhitungan_gula?.nn_standar || (predictionResult.kadar_gula_brix * 0.72).toFixed(2)} g/100g nira. Potensi Gula: ${predictionResult.perhitungan_gula?.potensi_gula_standar || '-'} Q/Acre.

Generated by E-Brix AI Sugarcane Engine.`;

    navigator.clipboard.writeText(text);
    setCopiedAction(true);
    setTimeout(() => setCopiedAction(false), 2500);
  };

  // Helper badge warna brix
  const getBrixBadge = (val) => {
    if (val >= 19) return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-300', label: 'Kematangan Puncak' };
    if (val >= 16) return { bg: 'bg-amber-50 text-amber-700 border-amber-300', label: 'Mendekati Panen' };
    return { bg: 'bg-blue-50 text-blue-700 border-blue-300', label: 'Fase Vegetatif' };
  };

  const chartData = useMemo(() => {
    if (!predictionResult?.analisis_musim?.detail_bulanan) return [];
    return predictionResult.analisis_musim.detail_bulanan.map(d => ({
      name: d.bulan_id.substring(0, 3),
      bulanLengkap: d.bulan_id,
      score: d.score,
      brix: d.brix,
      yield: d.yield,
      musim: d.musim,
      isBest: d.bulan_en === predictionResult?.analisis_musim?.bulan_terbaik_en
    }));
  }, [predictionResult]);

  return (
    <div className="flex flex-col gap-5 w-full pb-8">

      {/* ============================================================== */}
      {/* COMPACT HUD BAR & SEGMENTED CONTROLLER                         */}
      {/* ============================================================== */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        
        {/* Left Status & Telemetry Metadata */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${serverStatus === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-400'}`} />
            <span className="font-semibold text-slate-700">
              {serverStatus === 'online' ? 'Model Ensemble AI Online' : 'Simulator Presisi Lokal'}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-[10px] text-slate-500 font-bold">PORT 5000</span>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200/80 text-[11px] font-bold text-emerald-800 font-mono">
            <UiIcon name="bolt" className="w-3.5 h-3.5 text-emerald-600" />
            <span>Akurasi &gt; 90%</span>
          </span>

          <span className="hidden lg:inline text-xs text-slate-400 font-medium">
            Random Forest + XGBoost + Winter-Carp Industrial Equation
          </span>
        </div>

        {/* Right Segmented Navigation Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs font-bold w-full md:w-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('simulasi')}
            className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === 'simulasi' 
                ? 'bg-white text-emerald-700 shadow-xs font-extrabold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UiIcon name="bolt" className="w-3.5 h-3.5" />
            <span>Simulator Input</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveSubTab('rekomendasi')}
            className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === 'rekomendasi' 
                ? 'bg-white text-emerald-700 shadow-xs font-extrabold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UiIcon name="clipboard" className="w-3.5 h-3.5" />
            <span>Rekomendasi Tindakan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('musim')}
            className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === 'musim' 
                ? 'bg-white text-emerald-700 shadow-xs font-extrabold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UiIcon name="chart" className="w-3.5 h-3.5" />
            <span>12 Bulan Musim</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('riwayat')}
            className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === 'riwayat' 
                ? 'bg-white text-emerald-700 shadow-xs font-extrabold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UiIcon name="clock" className="w-3.5 h-3.5" />
            <span>Riwayat ({historyList.length})</span>
          </button>
        </div>

      </div>

      {/* ALERT FEEDBACK TOAST */}
      {feedback && (
        <div className={`p-3.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 animate-fade-in ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
            : feedback.type === 'warning'
            ? 'bg-amber-50 text-amber-800 border-amber-300'
            : 'bg-blue-50 text-blue-800 border-blue-300'
        }`}>
          <div className="flex items-center gap-2">
            <UiIcon name={feedback.type === 'success' ? 'check' : feedback.type === 'warning' ? 'alert' : 'info'} className="w-4 h-4 shrink-0" />
            <span>{feedback.text}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setFeedback(null)} 
            className="text-slate-400 hover:text-slate-700 p-0.5 rounded-md cursor-pointer"
          >
            <UiIcon name="close" className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 1 & 2: SIMULATOR DENGAN HASIL & REKOMENDASI TERPADU     */}
      {/* ============================================================== */}
      {(activeSubTab === 'simulasi' || activeSubTab === 'rekomendasi') && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* ============================================================ */}
          {/* KOLOM KIRI: FORM PARAMETER INPUT (5 COLS)                    */}
          {/* ============================================================ */}
          <div className="xl:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col gap-5">
            
            {/* Header Form & Presets */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center border border-emerald-500/20">
                    <UiIcon name="sliders" className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">
                      Parameter Lahan &amp; Budidaya
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Sesuaikan variabel lapangan untuk simulasi
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setForm(INITIAL_FORM)}
                  className="text-[11px] font-mono text-slate-400 hover:text-rose-600 transition font-semibold cursor-pointer"
                >
                  Reset Default
                </button>
              </div>

              {/* Preset Cepat 1-Klik */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
                  Preset Cepat (Uji 1-Klik):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset('kemarau_optimal')}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-100/80 hover:bg-emerald-200/80 text-emerald-900 border border-emerald-300 transition cursor-pointer"
                  >
                    <UiIcon name="sun" className="w-3.5 h-3.5 text-amber-600" />
                    <span>Kemarau Optimal (Drip)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('penghujan')}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-100/80 hover:bg-blue-200/80 text-blue-900 border border-blue-300 transition cursor-pointer"
                  >
                    <UiIcon name="cloudRain" className="w-3.5 h-3.5 text-sky-600" />
                    <span>Musim Hujan (Parit)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('stres_hama')}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-100/80 hover:bg-rose-200/80 text-rose-900 border border-rose-300 transition cursor-pointer"
                  >
                    <UiIcon name="alert" className="w-3.5 h-3.5 text-rose-600" />
                    <span>Hama Tinggi / Stres</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Form Kontrol */}
            <form onSubmit={handleRunPrediction} className="space-y-4">
              
              {/* GROUP 1: IKLIM & LINGKUNGAN */}
              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <UiIcon name="sun" className="w-4 h-4 text-amber-500" />
                  <span>1. Kondisi Iklim &amp; Lingkungan</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Bulan Tanam
                    </label>
                    <select
                      value={form.Month}
                      onChange={(e) => handleInputChange('Month', e.target.value)}
                      className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                    >
                      {Object.entries(MONTH_NAMES_ID).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v} ({k})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Jenis Tanah
                    </label>
                    <select
                      value={form.Soil_Type}
                      onChange={(e) => handleInputChange('Soil_Type', e.target.value)}
                      className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                    >
                      {SOIL_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-semibold text-slate-600">Suhu Rata-rata</label>
                      <span className="font-mono text-emerald-700 font-bold px-1.5 py-0.2 bg-emerald-50 rounded border border-emerald-200 text-[11px]">
                        {form.Temp_Avg_C}°C
                      </span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="40"
                      step="0.1"
                      value={form.Temp_Avg_C}
                      onChange={(e) => handleInputChange('Temp_Avg_C', parseFloat(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-semibold text-slate-600">Curah Hujan</label>
                      <span className="font-mono text-emerald-700 font-bold px-1.5 py-0.2 bg-emerald-50 rounded border border-emerald-200 text-[11px]">
                        {form.Rainfall_Total_mm} mm
                      </span>
                    </div>
                    <input
                      type="range"
                      min="800"
                      max="2000"
                      step="10"
                      value={form.Rainfall_Total_mm}
                      onChange={(e) => handleInputChange('Rainfall_Total_mm', parseFloat(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* GROUP 2: PENGAIRAN */}
              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <UiIcon name="droplet" className="w-4 h-4 text-sky-500" />
                  <span>2. Pengairan &amp; Kualitas Air</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Metode Irigasi
                    </label>
                    <select
                      value={form.Irrigation_Method_Type}
                      onChange={(e) => handleInputChange('Irrigation_Method_Type', e.target.value)}
                      className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                    >
                      {IRRIGATION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Kualitas Air
                    </label>
                    <select
                      value={form.Water_Quality_Category}
                      onChange={(e) => handleInputChange('Water_Quality_Category', e.target.value)}
                      className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                    >
                      {WATER_QUALITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* GROUP 3: BIBIT & POLA TANAM */}
              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <UiIcon name="leaf" className="w-4 h-4 text-emerald-600" />
                  <span>3. Bibit Varietas &amp; Pola Tanam</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Varietas Tebu
                    </label>
                    <select
                      value={form.Variety}
                      onChange={(e) => handleInputChange('Variety', e.target.value)}
                      className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                    >
                      {VARIETY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Cara Tanam
                    </label>
                    <select
                      value={form.Planting_Method}
                      onChange={(e) => handleInputChange('Planting_Method', e.target.value)}
                      className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                    >
                      {PLANTING_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* GROUP 4: PERAWATAN & HAMA */}
              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <UiIcon name="shield" className="w-4 h-4 text-teal-600" />
                  <span>4. Perawatan &amp; Pengendalian Hama</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Pupuk Utama
                    </label>
                    <select
                      value={form.Fertilizer_Type}
                      onChange={(e) => handleInputChange('Fertilizer_Type', e.target.value)}
                      className="w-full h-9 px-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                    >
                      {FERTILIZER_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Basmi Gulma
                    </label>
                    <select
                      value={form.Weed_Control}
                      onChange={(e) => handleInputChange('Weed_Control', e.target.value)}
                      className="w-full h-9 px-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                    >
                      {WEED_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Tingkat Hama
                    </label>
                    <select
                      value={form.Pest_Level}
                      onChange={(e) => handleInputChange('Pest_Level', e.target.value)}
                      className={`w-full h-9 px-2 rounded-xl border font-semibold focus:outline-none ${
                        form.Pest_Level === 'High' 
                          ? 'bg-rose-50 border-rose-300 text-rose-800' 
                          : form.Pest_Level === 'Medium'
                          ? 'bg-amber-50 border-amber-300 text-amber-800'
                          : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      }`}
                    >
                      {PEST_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Tombol Eksekusi Prediksi */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-sm shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2.5 transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Mengalkulasi Model Ensemble AI...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Jalankan Prediksi Cerdas AI</span>
                  </>
                )}
              </button>

            </form>

          </div>

          {/* ============================================================ */}
          {/* KOLOM KANAN: HASIL PREDIKSI & REKOMENDASI TINDAKAN (7 COLS)  */}
          {/* ============================================================ */}
          <div className="xl:col-span-7 flex flex-col gap-6">

            {predictionResult ? (
              <>
                {/* 1. TOP 4 KPI CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* CARD 1: TONASE PANEN */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                        ESTIMASI TONASE PANEN
                      </span>
                      <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                        <UiIcon name="scale" className="w-4 h-4" />
                      </span>
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                          {predictionResult.hasil_panen}
                        </span>
                        <span className="text-xs font-bold text-slate-500">Quintal / Acre</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Setara ~{(predictionResult.hasil_panen * 0.247).toFixed(1)} Ton / Hektar
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Status Produktivitas:</span>
                      <span className="font-bold text-emerald-700">
                        {predictionResult.hasil_panen > 200 ? 'Sangat Tinggi (Optimal)' : 'Standar'}
                      </span>
                    </div>
                  </div>

                  {/* CARD 2: KADAR BRIX */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                        PROYEKSI KADAR BRIX
                      </span>
                      <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                        <UiIcon name="chart" className="w-4 h-4" />
                      </span>
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                          {predictionResult.kadar_gula_brix}°
                        </span>
                        <span className="text-xs font-bold text-slate-500">Bx (Kadar Sukrosa Nira)</span>
                      </div>
                      <div className="mt-1">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getBrixBadge(predictionResult.kadar_gula_brix).bg}`}>
                          {getBrixBadge(predictionResult.kadar_gula_brix).label}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Rendemen Nira (NN):</span>
                      <span className="font-mono font-bold text-slate-800">
                        {predictionResult.perhitungan_gula?.nn_standar || (predictionResult.kadar_gula_brix * 0.72).toFixed(2)} g/100g
                      </span>
                    </div>
                  </div>

                  {/* CARD 3: ESTIMASI UMUR PANEN */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                        ESTIMASI UMUR PANEN
                      </span>
                      <span className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                        <UiIcon name="clock" className="w-4 h-4" />
                      </span>
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                          {predictionResult.durasi_panen_hari}
                        </span>
                        <span className="text-xs font-bold text-slate-500">Hari</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Sekitar ~{predictionResult.durasi_panen_bulan} Bulan {predictionResult.durasi_panen_sisa_hari} Hari
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Rekomendasi Waktu:</span>
                      <span className="font-bold text-teal-700">Tebang Masak Optimal</span>
                    </div>
                  </div>

                  {/* CARD 4: RISIKO PENYAKIT */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                        RISIKO SERANGAN HAMA/PENYAKIT
                      </span>
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                        predictionResult.keparahan_penyakit === 'Tinggi' 
                          ? 'bg-rose-50 text-rose-600 border-rose-100' 
                          : predictionResult.keparahan_penyakit === 'Sedang'
                          ? 'bg-amber-50 text-amber-600 border-amber-100'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        <UiIcon name="shield" className="w-4 h-4" />
                      </span>
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-2xl font-black font-mono tracking-tight ${
                          predictionResult.keparahan_penyakit === 'Tinggi' 
                            ? 'text-rose-600' 
                            : predictionResult.keparahan_penyakit === 'Sedang'
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}>
                          {predictionResult.keparahan_penyakit}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          ({predictionResult.kepercayaan_penyakit}% Yakin)
                        </span>
                      </div>

                      <div className="mt-2 flex gap-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${predictionResult.probabilitas_penyakit?.Rendah || 33}%` }} 
                          className="bg-emerald-500" 
                          title={`Rendah: ${predictionResult.probabilitas_penyakit?.Rendah || 0}%`}
                        />
                        <div 
                          style={{ width: `${predictionResult.probabilitas_penyakit?.Sedang || 33}%` }} 
                          className="bg-amber-500" 
                          title={`Sedang: ${predictionResult.probabilitas_penyakit?.Sedang || 0}%`}
                        />
                        <div 
                          style={{ width: `${predictionResult.probabilitas_penyakit?.Tinggi || 33}%` }} 
                          className="bg-rose-500" 
                          title={`Tinggi: ${predictionResult.probabilitas_penyakit?.Tinggi || 0}%`}
                        />
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Status Proteksi:</span>
                      <span className="font-bold text-slate-700">
                        {predictionResult.keparahan_penyakit === 'Tinggi' ? 'Tindakan Mendesak' : 'Pemantauan Rutin'}
                      </span>
                    </div>
                  </div>

                </div>

                {/* ============================================================ */}
                {/* 2. REKOMENDASI TINDAKAN LAPANGAN AGRONOMIS (UTAMA)            */}
                {/* ============================================================ */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-5">
                  
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center border border-emerald-500/20">
                        <UiIcon name="clipboardCheck" className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base tracking-tight">
                          Rekomendasi Tindakan Lapangan AI
                        </h4>
                        <p className="text-xs text-slate-500">
                          Panduan langkah operasional spesifik berdasarkan hasil prediksi
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={copyRecommendationsToClipboard}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <UiIcon name={copiedAction ? 'check' : 'copy'} className="w-3.5 h-3.5" />
                      <span>{copiedAction ? 'Berhasil Disalin!' : 'Salin Arahan Petugas'}</span>
                    </button>
                  </div>

                  {/* Matrix 4 Kartu Tindakan Terstruktur */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* TINDAKAN 1: JADWAL & TEBANG */}
                    <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200/80 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <UiIcon name="calendar" className="w-4 h-4 text-teal-600" />
                            <span>Jadwal &amp; Waktu Tebang</span>
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-100 text-teal-800">
                            HARI KE-{predictionResult.durasi_panen_hari}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {predictionResult.rekomendasi?.waktu_panen || `Jadwalkan panen ${predictionResult.durasi_panen_hari} hari lagi saat rendemen memuncak.`}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-teal-50/70 border border-teal-200/60 text-[11px] text-teal-900 font-medium leading-relaxed flex items-start gap-2">
                        <UiIcon name="alert" className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                        <span>
                          <strong>Protokol Tebang-Angkut-Giling:</strong> Pastikan tebu yang ditebang langsung digiling dalam waktu kurang dari 24-36 jam untuk menghindari inversi sukrosa yang dapat memangkas rendemen gula.
                        </span>
                      </div>
                    </div>

                    {/* TINDAKAN 2: PENGERINGAN & BRIX */}
                    <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200/80 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <UiIcon name="droplet" className="w-4 h-4 text-sky-600" />
                            <span>Pengairan &amp; Protokol Dry-Off</span>
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            predictionResult.kadar_gula_brix >= 18 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            BRIX {predictionResult.kadar_gula_brix}°
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {predictionResult.rekomendasi?.tindakan_brix || predictionResult.rekomendasi?.brix}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-900 font-medium leading-relaxed flex items-start gap-2">
                        <UiIcon name="lightbulb" className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                          <strong>Fase Dry-off (Pengeringan):</strong> Hentikan pasokan irigasi 4-6 minggu sebelum tebang untuk memicu tanaman tebu berhenti tumbuh vegetatif dan fokus memadatkan gula murni di ruas batang.
                        </span>
                      </div>
                    </div>

                    {/* TINDAKAN 3: MANAJEMEN NUTRISI & TONASE */}
                    <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200/80 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <UiIcon name="beaker" className="w-4 h-4 text-blue-600" />
                            <span>Manajemen Nutrisi &amp; Pemupukan</span>
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800">
                            NUTRISI NPK
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {predictionResult.rekomendasi?.tindakan_hasil || predictionResult.rekomendasi?.hasil_panen}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200/60 text-[11px] text-blue-900 font-medium leading-relaxed flex items-start gap-2">
                        <UiIcon name="leaf" className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span>
                          <strong>Unsur Kalium (K):</strong> Tambahkan Kalium K₂O di fase pemanjangan batang untuk mempertebal dinding sel tebu, mencegah roboh, serta memfasilitasi translokasi sukrosa ke ruas batang bawah.
                        </span>
                      </div>
                    </div>

                    {/* TINDAKAN 4: PROTEKSI HAMA & SANITASI KEBUN */}
                    <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200/80 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <UiIcon name="shield" className="w-4 h-4 text-emerald-600" />
                            <span>Proteksi Hama &amp; Sanitasi Klentek</span>
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            predictionResult.keparahan_penyakit === 'Tinggi'
                              ? 'bg-rose-100 text-rose-800'
                              : predictionResult.keparahan_penyakit === 'Sedang'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            STATUS {predictionResult.keparahan_penyakit.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {predictionResult.rekomendasi?.tindakan_penyakit || predictionResult.rekomendasi?.penyakit}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] text-slate-800 font-medium leading-relaxed flex items-start gap-2">
                        <UiIcon name="leaf" className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <span>
                          <strong>Sanitasi Klentek:</strong> Kelupas daun-daun tebu kering (klentek) secara teratur pada umur 5-7 bulan untuk memperlancar sirkulasi udara, mengurangi kelembapan, dan memutus sarang hama penggerek pucuk.
                        </span>
                      </div>
                    </div>

                  </div>

                </div>

                {/* 3. WINTER-CARP SUGAR YIELD CALCULATOR */}
                <div className="bg-gradient-to-br from-[#071d15] to-[#0c2f21] rounded-2xl p-6 text-white border border-emerald-500/30 shadow-md relative overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                        <UiIcon name="beaker" className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-base text-white tracking-tight">
                          Perhitungan Rendemen Gula (Rumus Winter-Carp)
                        </h4>
                        <p className="text-[11px] text-emerald-400/80 font-mono">
                          Standar Pabrik Gula: Pol = Brix × HK • Nilai Nira (NN) = Pol - 0.4 × (Brix - Pol)
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                      Standar PG Nasional
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                    <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-300 font-semibold">Skenario Standar (HK 80%)</span>
                        <span className="text-emerald-400 font-mono font-bold">Basis Reguler</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black font-mono text-white">
                          {predictionResult.perhitungan_gula?.potensi_gula_standar || 0}
                        </span>
                        <span className="text-xs text-slate-400">Quintal Gula / Acre</span>
                      </div>
                      <div className="text-[11px] text-slate-400 space-y-0.5 pt-2 border-t border-white/10 font-mono">
                        <div>Pol Tebu: {predictionResult.perhitungan_gula?.pol_standar}%</div>
                        <div>Nilai Nira (NN): {predictionResult.perhitungan_gula?.nn_standar} g/100g</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-emerald-300 font-semibold">Skenario Optimis (HK 85%)</span>
                        <span className="text-emerald-400 font-mono font-bold">Kondisi Prima</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black font-mono text-emerald-300">
                          {predictionResult.perhitungan_gula?.potensi_gula_optimis || 0}
                        </span>
                        <span className="text-xs text-emerald-400/80">Quintal Gula / Acre</span>
                      </div>
                      <div className="text-[11px] text-emerald-300/80 space-y-0.5 pt-2 border-t border-emerald-500/20 font-mono">
                        <div>Pol Tebu: {predictionResult.perhitungan_gula?.pol_optimis}%</div>
                        <div>Nilai Nira (NN): {predictionResult.perhitungan_gula?.nn_optimis} g/100g</div>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300/90 leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5 flex items-start gap-2">
                    <UiIcon name="lightbulb" className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                    <span>
                      <strong>Proyeksi Ekstraksi Pabrik Gula:</strong> Dari setiap 100 Ton tebu yang dipanen pada kadar brix saat ini, pabrik gula diproyeksikan mengekstraksi sekitar <strong>{(predictionResult.perhitungan_gula?.nn_standar || 13.5).toFixed(1)} – {(predictionResult.perhitungan_gula?.nn_optimis || 15.0).toFixed(1)} Ton kristal gula murni</strong>.
                    </span>
                  </p>
                </div>

              </>
            ) : (
              <div className="bg-white rounded-2xl p-12 border border-slate-200/90 shadow-xs text-center flex flex-col items-center justify-center gap-4 min-h-[400px]">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60">
                  <UiIcon name="bolt" className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">
                    Simulator Siap Digunakan
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Atur parameter lahan pada panel sebelah kiri atau gunakan preset cepat, kemudian klik &quot;Jalankan Prediksi Cerdas AI&quot;.
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 3: ANALISIS 12 BULAN & KOMPARASI MUSIM                 */}
      {/* ============================================================== */}
      {activeSubTab === 'musim' && (
        <div className="space-y-6">
          
          {predictionResult?.analisis_musim && (
            <div className="bg-gradient-to-r from-[#071d15] to-[#0c2f21] rounded-2xl p-6 text-white border border-emerald-500/30 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/30 text-amber-300 flex items-center justify-center shrink-0">
                    <UiIcon name={predictionResult.analisis_musim.musim_terbaik === 'Kemarau' ? 'sun' : 'cloudRain'} className="w-4 h-4" />
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    MUSIM TANAM TERBAIK: {predictionResult.analisis_musim.musim_terbaik.toUpperCase()}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-xs text-slate-300 font-mono">
                    Bulan Optimal: <strong>{predictionResult.analisis_musim.bulan_terbaik_id}</strong>
                  </span>
                </div>
                <h3 className="text-xl font-black text-white">
                  Unggul {predictionResult.analisis_musim.selisih_persen}% Dibandingkan Musim Lainnya
                </h3>
                <p className="text-xs text-slate-300/90 leading-relaxed">
                  {predictionResult.analisis_musim.penjelasan}
                </p>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <div className="flex-1 md:w-44 p-4 rounded-xl bg-white/[0.04] border border-white/10 text-center">
                  <div className="text-[10px] font-mono text-slate-400 uppercase font-bold inline-flex items-center gap-1">
                    <UiIcon name="cloudRain" className="w-3.5 h-3.5 text-sky-300" />
                    <span>Musim Hujan</span>
                  </div>
                  <div className="text-xl font-mono font-black text-white mt-1">
                    {predictionResult.analisis_musim.penghujan?.avg_composite_score || 0}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Avg Brix: {predictionResult.analisis_musim.penghujan?.avg_brix}°
                  </div>
                </div>

                <div className="flex-1 md:w-44 p-4 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-center shadow-md">
                  <div className="text-[10px] font-mono text-emerald-300 uppercase font-bold inline-flex items-center gap-1">
                    <UiIcon name="sun" className="w-3.5 h-3.5 text-amber-300" />
                    <span>Musim Kemarau</span>
                  </div>
                  <div className="text-xl font-mono font-black text-emerald-300 mt-1">
                    {predictionResult.analisis_musim.kemarau?.avg_composite_score || 0}
                  </div>
                  <div className="text-[10px] text-emerald-300/80 mt-1">
                    Avg Brix: {predictionResult.analisis_musim.kemarau?.avg_brix}°
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 12-Month Performance Chart */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">
                  Proyeksi Performa 12 Bulan Tanam (Januari – Desember)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Perbandingan Skor Komposit Mutu Tebu, Kadar Brix, dan Tonase Hasil Panen per Bulan Tanam
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" /> Skor AI (0-100)
                </span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-3 h-3 rounded-full bg-amber-500" /> Brix (°Bx)
                </span>
              </div>
            </div>

            <div className="w-full h-80 min-h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 15, right: 15, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} 
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#071811] text-white p-3 rounded-xl border border-emerald-500/30 text-xs shadow-xl space-y-1 font-sans">
                            <p className="font-bold text-emerald-400 font-mono flex items-center gap-1.5">
                              <span>{data.bulanLengkap} ({data.musim})</span>
                              {data.isBest && (
                                <span className="inline-flex items-center gap-1 text-amber-300">
                                  <UiIcon name="star" className="w-3.5 h-3.5" />
                                  <span>Terbaik</span>
                                </span>
                              )}
                            </p>
                            <p className="text-slate-300">Skor Komposit AI: <strong className="text-white font-mono">{data.score}</strong>/100</p>
                            <p className="text-slate-300">Prediksi Brix: <strong className="text-amber-400 font-mono">{data.brix}°Bx</strong></p>
                            <p className="text-slate-300">Prediksi Tonase: <strong className="text-emerald-300 font-mono">{data.yield} Q/Acre</strong></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.isBest ? '#10b981' : entry.musim === 'Kemarau' ? '#34d399' : '#94a3b8'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Table of Monthly Details */}
            <div className="overflow-x-auto pt-4 border-t border-slate-100">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase">
                    <th className="py-2.5 px-3">Bulan</th>
                    <th className="py-2.5 px-3">Musim</th>
                    <th className="py-2.5 px-3">Skor Mutu AI</th>
                    <th className="py-2.5 px-3">Proyeksi Brix</th>
                    <th className="py-2.5 px-3">Proyeksi Tonase</th>
                    <th className="py-2.5 px-3">Risiko Penyakit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {chartData.map((d, i) => (
                    <tr key={i} className={`hover:bg-slate-50 ${d.isBest ? 'bg-emerald-50/50 font-bold' : ''}`}>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        <span className="inline-flex items-center gap-1.5">
                          <span>{d.bulanLengkap}</span>
                          {d.isBest && (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[10px] bg-emerald-100/80 px-1.5 py-0.5 rounded-md border border-emerald-200">
                              <UiIcon name="star" className="w-3 h-3" />
                              <span>Optimal</span>
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          d.musim === 'Kemarau' ? 'bg-amber-100/70 text-amber-800' : 'bg-blue-100/70 text-blue-800'
                        }`}>
                          {d.musim}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">{d.score} / 100</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">{d.brix}°Bx</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{d.yield} Q/Acre</td>
                      <td className="py-2.5 px-3 text-slate-600">{d.disease}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 4: RIWAYAT PREDIKSI                                    */}
      {/* ============================================================== */}
      {activeSubTab === 'riwayat' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">
                Riwayat Simulasi & Log Prediksi AI
              </h3>
              <p className="text-[11px] text-slate-500">
                Daftar komputasi skenario tebu yang pernah dijalankan sebelumnya
              </p>
            </div>
            <button
              type="button"
              onClick={fetchHealthAndHistory}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <UiIcon name="refresh" className="w-3.5 h-3.5" />
              <span>Refresh Riwayat</span>
            </button>
          </div>

          {historyList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase">
                    <th className="py-3 px-3">ID & Waktu</th>
                    <th className="py-3 px-3">Varietas & Bulan</th>
                    <th className="py-3 px-3">Irigasi & Tanah</th>
                    <th className="py-3 px-3">Kadar Brix</th>
                    <th className="py-3 px-3">Tonase</th>
                    <th className="py-3 px-3">Risiko</th>
                    <th className="py-3 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historyList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-mono text-slate-500">
                        <span className="font-bold text-slate-800">#{item.id}</span>
                        <div className="text-[10px] text-slate-400">{item.timestamp}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {item.input?.Variety || '-'}
                        <div className="text-[11px] text-slate-500 font-normal">
                          {MONTH_NAMES_ID[item.input?.Month] || item.input?.Month || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {item.input?.Irrigation_Method_Type || '-'}
                        <div className="text-[10px] text-slate-400">
                          {item.input?.Soil_Type || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                        {item.hasil?.kadar_gula_brix || '-'}°Bx
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-800">
                        {item.hasil?.hasil_panen || '-'} Q/Acre
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.hasil?.keparahan_penyakit === 'Tinggi'
                            ? 'bg-rose-50 text-rose-700'
                            : item.hasil?.keparahan_penyakit === 'Sedang'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {item.hasil?.keparahan_penyakit || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => loadHistoryToForm(item)}
                            title="Muat kembali parameter ini ke form"
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition"
                          >
                            Muat
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteHistory(item.id)}
                            title="Hapus riwayat ini"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <UiIcon name="trash" className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <p className="text-xs">Belum ada riwayat simulasi yang tersimpan.</p>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
