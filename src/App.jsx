import { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { API_BASE_URL } from './config';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StatCard from './components/StatCard';
import DashboardMap from './views/DashboardMap';
import AnalysisData from './views/AnalysisData';
import ManageLand from './views/ManageLand';
import ManagePetani from './views/ManagePetani';

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 text-slate-400 hover:text-slate-600 transition-colors">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 text-slate-400 hover:text-slate-600 transition-colors">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

function App() {
  const [userLogin, setUserLogin] = useState(() => {
    const savedUser = localStorage.getItem('ebrix_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loginForm, setLoginForm] = useState({ username: '', password: '', role: 'admin' });
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [activeTab, setActiveTab] = useState('peta');
  const [sampelData, setSampelData] = useState([]);
  const [blokData, setBlokData] = useState([]);
  const [lahanData, setLahanData] = useState([]);

  const [selectedLahan, setSelectedLahan] = useState('all');
  const [selectedBlok, setSelectedBlok] = useState('all');
  const [brixFilter, setBrixFilter] = useState('all');

  const [stats, setStats] = useState({ avg_brix: 0, max_brix: 0, min_brix: 0, total_titik: 0 });

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, {
        username: loginForm.username,
        password: loginForm.password,
        role: loginForm.role,
        platform: 'web'
      });

      const userData = res.data.user || { username: loginForm.username, role: loginForm.role };

      setUserLogin(userData);
      localStorage.setItem('ebrix_user', JSON.stringify(userData));

      setLoginError('');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setLoginError(err.response.data.message);
      } else {
        setLoginError('Gagal login. Cek koneksi server atau devtunnels.');
      }
    }
  };

  const handleLogout = () => {
    setUserLogin(null);
    localStorage.removeItem('ebrix_user');
  };

  const fetchSemuaData = async () => {
    const timestamp = new Date().getTime();

    try {
      const resLahan = await axios.get(`${API_BASE_URL}/lahan?t=${timestamp}`);
      const rawLahan = resLahan.data?.data || resLahan.data?.features || resLahan.data || [];
      const arrLahan = Array.isArray(rawLahan) ? rawLahan : [];

      const lahanFeatures = arrLahan.map(item => {
        if (item?.type === 'Feature') return item;
        return {
          type: 'Feature',
          properties: { ...item },
          geometry: item?.koordinat_area || item?.geom || null
        };
      });
      setLahanData(lahanFeatures);
    } catch (error) {
      console.error("❌ Gagal menarik data LAHAN:", error.message);
    }

    try {
      const resBlok = await axios.get(`${API_BASE_URL}/blok?t=${timestamp}`);
      const rawBlok = resBlok.data?.data || resBlok.data?.features || resBlok.data || [];
      const arrBlok = Array.isArray(rawBlok) ? rawBlok : [];

      const blokFeatures = arrBlok.map(item => {
        if (item?.type === 'Feature') return item;
        return {
          type: 'Feature',
          properties: { ...item },
          geometry: item?.koordinat_area || item?.geom || null
        };
      });
      setBlokData(blokFeatures);
    } catch (error) {
      console.error("❌ Gagal menarik data BLOK:", error.message);
    }

    try {
      const resSampel = await axios.get(`${API_BASE_URL}/data-brix?t=${timestamp}`);
      const rawSampel = resSampel.data?.data || resSampel.data?.features || resSampel.data || [];
      const arrSampel = Array.isArray(rawSampel) ? rawSampel : [];
      setSampelData(arrSampel);
    } catch (error) {
      console.error("❌ Gagal menarik data SAMPEL:", error.message);
    }
  };

  const handleDeletePoin = async (id_titik) => {
    const isConfirmed = window.confirm("⚠ Yakin ingin menghapus titik sampel ini? Data tidak bisa dikembalikan!");
    if (isConfirmed) {
      try {
        await axios.delete(`${API_BASE_URL}/data-brix/${id_titik}`);
        fetchSemuaData();
      } catch (error) {
        alert("Gagal menghapus titik. Cek koneksi server.");
      }
    }
  };

  useEffect(() => {
    if (!userLogin) return;
    fetchSemuaData();
    const socket = io(API_BASE_URL, { transports: ['polling'] });
    socket.on('refresh_data', () => { fetchSemuaData(); });
    return () => { socket.disconnect(); };
  }, [userLogin]);

  useEffect(() => {
    const amanBlokData = Array.isArray(blokData) ? blokData : [];
    const amanSampelData = Array.isArray(sampelData) ? sampelData : [];

    let validBlokIds = amanBlokData.map(b => String(b?.properties?.id_blok || b?.id_blok));
    if (selectedLahan !== 'all') {
      validBlokIds = amanBlokData
        .filter(b => String(b?.properties?.id_lahan || b?.id_lahan) === String(selectedLahan))
        .map(b => String(b?.properties?.id_blok || b?.id_blok));
    }

    const dataAktif = amanSampelData.filter(titik => {
      const idBlokTitik = String(titik?.properties?.id_blok || titik?.id_blok);
      const brix = parseFloat(titik?.properties?.nilai_brix || titik?.nilai_brix || 0);

      let isLolosWilayah = true;
      if (selectedBlok !== 'all') isLolosWilayah = (idBlokTitik === String(selectedBlok));
      else if (selectedLahan !== 'all') isLolosWilayah = validBlokIds.includes(idBlokTitik);

      let isLolosBrix = true;
      if (brixFilter === 'rendah') isLolosBrix = brix < 15;
      else if (brixFilter === 'sedang') isLolosBrix = brix >= 15 && brix <= 19;
      else if (brixFilter === 'tinggi') isLolosBrix = brix > 19;

      return isLolosWilayah && isLolosBrix;
    });

    if (dataAktif.length > 0) {
      const brixValues = dataAktif.map(t => parseFloat(t?.properties?.nilai_brix || t?.nilai_brix)).filter(n => !isNaN(n));
      if (brixValues.length > 0) {
        setStats({
          avg_brix: (brixValues.reduce((a, b) => a + b, 0) / brixValues.length).toFixed(1),
          max_brix: Math.max(...brixValues).toFixed(1),
          min_brix: Math.min(...brixValues).toFixed(1),
          total_titik: dataAktif.length
        });
      }
    } else {
      setStats({ avg_brix: 0, max_brix: 0, min_brix: 0, total_titik: 0 });
    }
  }, [selectedLahan, selectedBlok, brixFilter, sampelData, blokData]);

  if (!userLogin) {
    return (
      <main className="w-screen h-screen overflow-hidden flex items-center justify-center font-sans antialiased m-0 p-4 bg-slate-100">

        {/* Card Container Utama */}
        <div className="relative z-10 w-full max-w-4xl h-[560px] bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col md:flex-row border border-slate-200/80">

          {/* SISI KIRI: Visual Wave Illustration (Area Lengkung) */}
          <div className="hidden md:block w-[50%] h-full relative overflow-hidden bg-gradient-to-br from-emerald-600 via-green-600 to-teal-800">

            {/* Background Image Overlay */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-overlay"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200&auto=format&fit=crop')`
              }}
            ></div>

            {/* Curved SVG Masking di Sisi Kanan Ilustrasi (Lengkungan Membuka ke Kanan) */}
            <svg
              className="absolute top-0 -right-1 h-full w-28 text-white fill-current pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <path d="M100 0 L0 0 Q 100 50, 0 100 L100 100 Z" />
            </svg>

            {/* Content Overlay Kiri dengan Margin Kanan (pr-20) untuk Menghindari Kurva */}
            <div className="relative z-10 h-full p-10 pr-20 flex flex-col justify-between text-white text-left items-start">

              <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider text-emerald-100 border border-white/30">
                Smart Agriculture
              </div>

              <div className="max-w-xs space-y-2">
                <h2 className="text-2xl font-extrabold leading-tight">
                  Monitoring Kemasakan Tebu Presisi
                </h2>
                <p className="text-xs text-emerald-100/90 leading-relaxed font-light">
                  Kelola data sampel Brix, lokasi blok perkebunan, dan estimasi waktu panen ideal secara digital.
                </p>
              </div>

            </div>

          </div>

          {/* SISI KANAN: Form Login */}
          <div className="w-full md:w-[50%] h-full p-8 md:p-10 flex flex-col justify-between z-10 bg-white">

            {/* Header Logo & Title */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center font-black text-white text-lg shadow-md shadow-green-600/30 tracking-wider">
                  EB
                </div>
                <span className="font-bold text-slate-800 text-lg tracking-tight">Portal E-Brix</span>
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Masuk Ke Sistem
                </h1>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Sistem Pemantauan Kemasakan Tebu & Kualitas Brix
                </p>
              </div>
            </div>

            {loginError && (
              <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-semibold border border-rose-200/60 text-center">
                {loginError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="flex flex-col gap-3.5 my-auto">

              {/* Switch Role */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Hak Akses
                </label>
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => setLoginForm({ ...loginForm, role: 'admin' })}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${loginForm.role === 'admin'
                        ? 'bg-white text-green-700 shadow-sm border border-slate-200/60'
                        : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginForm({ ...loginForm, role: 'operator' })}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${loginForm.role === 'operator'
                        ? 'bg-white text-green-700 shadow-sm border border-slate-200/60'
                        : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    Operator
                  </button>
                </div>
              </div>

              {/* Input Username */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider" htmlFor="admin-identifier">
                  Username
                </label>
                <input
                  id="admin-identifier"
                  type="text"
                  required
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all font-medium placeholder:text-slate-400"
                  placeholder="Masukkan username anda"
                />
              </div>

              {/* Input Password */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider" htmlFor="admin-password">
                  Password
                </label>
                <div className="relative flex items-center">
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full h-10 pl-3.5 pr-10 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all font-medium placeholder:text-slate-400"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 focus:outline-none p-1 rounded-lg hover:bg-slate-200/50 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full h-10 mt-1 bg-green-600 hover:bg-green-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-green-600/30 transition-all duration-200 active:scale-[0.98]"
              >
                Masuk Ke Sistem
              </button>

            </form>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
              <span>E-BRIX DASHBOARD</span>
              <span>© 2026 AGRO-INTELLIGENCE</span>
            </div>

          </div>

        </div>

      </main>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#f4f7f6] font-sans overflow-hidden">

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedLahan={selectedLahan}
        setSelectedLahan={setSelectedLahan}
        selectedBlok={selectedBlok}
        setSelectedBlok={setSelectedBlok}
        lahanData={lahanData}
        blokData={blokData}
        userRole={userLogin.role}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header activeTab={activeTab} />

        <main className="flex-1 p-8 overflow-y-auto flex flex-col gap-6">

          {(activeTab === 'peta' || activeTab === 'analisis') && (
            <div className="grid grid-cols-4 gap-6 shrink-0">
              <StatCard title="RATA-RATA BRIX" value={`${stats.avg_brix || 0}°`} border="border-l-4 border-green-500" />

              <StatCard title="PETAK DITAMPILKAN" value={
                selectedBlok === 'all'
                  ? (selectedLahan === 'all'
                    ? (Array.isArray(blokData) ? blokData.length : 0)
                    : (Array.isArray(blokData) ? blokData.filter(b => String(b?.properties?.id_lahan || b?.id_lahan) === String(selectedLahan)).length : 0))
                  : 1
              } border="border-l-4 border-green-500" />

              <StatCard title="BRIX TERTINGGI" value={`${stats.max_brix || 0}°`} border="border-l-4 border-green-500" />
              <StatCard title="BRIX TERENDAH" value={`${stats.min_brix || 0}°`} border="border-l-4 border-green-500" />
            </div>
          )}

          {activeTab === 'peta' && (
            <DashboardMap
              selectedLahan={selectedLahan}
              setSelectedLahan={setSelectedLahan}
              selectedBlok={selectedBlok}
              setSelectedBlok={setSelectedBlok}
              brixFilter={brixFilter}
              setBrixFilter={setBrixFilter}
              sampelData={sampelData}
              blokData={blokData}
              lahanData={lahanData}
              onDeletePoin={handleDeletePoin}
            />
          )}

          {activeTab === 'analisis' && (
            <AnalysisData
              selectedLahan={selectedLahan}
              selectedBlok={selectedBlok}
              sampelData={sampelData}
              blokData={blokData}
              lahanData={lahanData}
            />
          )}

          {activeTab === 'tambah_blok' && (
            <ManageLand
              blokData={blokData}
              lahanData={lahanData}
              fetchSemuaData={fetchSemuaData}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'kelola_petani' && userLogin.role === 'admin' && (
            <ManagePetani />
          )}

        </main>
      </div>
    </div>
  );
}

export default App;