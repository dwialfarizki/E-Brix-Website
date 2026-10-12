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
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-slate-400 hover:text-emerald-600 transition-colors">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-slate-400 hover:text-emerald-600 transition-colors">
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
      } catch (_error) {
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

  // ==========================================
  // REDESIGNED PRECISION AGRITECH LOGIN
  // ==========================================
  if (!userLogin) {
    return (
      <main className="w-screen h-screen overflow-hidden flex items-center justify-center p-4 md:p-8 bg-[#07130e] relative font-sans">
        
        {/* Background Ambient Lighting & High-Tech Grid */}
        <div className="absolute inset-0 bg-agro-grid opacity-30 pointer-events-none" />
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-teal-500/15 rounded-full blur-[140px] pointer-events-none" />

        {/* Telemetry Status Bar Header */}
        <div className="absolute top-6 inset-x-8 max-w-5xl mx-auto hidden md:flex items-center justify-between text-[11px] font-mono text-emerald-500/70 select-none">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-beacon" />
            E-BRIX GEODETIC SENSOR NETWORK • REV 2.6
          </span>
          <span>LAT -6.7111° • LON 108.4312° • CANE HARVEST CAMPAIGN 2026</span>
        </div>

        {/* Glassmorphic Portal Container */}
        <div className="relative z-10 w-full max-w-4xl min-h-[580px] bg-[#0c1f17]/90 backdrop-blur-2xl rounded-3xl overflow-hidden flex flex-col md:flex-row border border-emerald-500/25 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]">
          
          {/* SISI KIRI: Agronomic Telemetry HUD & Visual */}
          <div className="hidden md:flex w-1/2 p-10 flex-col justify-between border-r border-emerald-950/80 bg-gradient-to-br from-[#0a1e16] via-[#091811] to-[#06110c] relative overflow-hidden">
            
            {/* Visual Radar Circles Graphic */}
            <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full border border-emerald-500/10 pointer-events-none" />
            <div className="absolute -top-12 -left-12 w-56 h-56 rounded-full border border-emerald-500/20 pointer-events-none" />

            <div className="relative z-10 space-y-6">
              {/* Brand Logo */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-700 flex items-center justify-center font-black text-white text-base shadow-[0_0_25px_rgba(16,185,129,0.4)] ring-1 ring-emerald-300/40">
                  EB
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold tracking-wider text-white">E-BRIX</h2>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-bold">
                      PORTAL
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-emerald-400/80 uppercase tracking-wider">
                    Precision Agro-GIS & Telemetry
                  </p>
                </div>
              </div>

              {/* Title & Tagline */}
              <div className="space-y-2 pt-4">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-300 bg-emerald-950/70 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Sistem Pemantauan Digital
                </span>
                <h3 className="text-2xl font-black text-white leading-tight">
                  Kemasakan Tebu Presisi & Estimasi Waktu Panen
                </h3>
                <p className="text-xs text-slate-300/80 leading-relaxed font-light">
                  Platform GIS analitik untuk pemetaan refraktometer Brix, zonasi petak kebun, serta optimasi rendemen gula tebu.
                </p>
              </div>
            </div>

            {/* Live Metrics Specimen Preview */}
            <div className="relative z-10 space-y-2.5 pt-6 border-t border-emerald-900/30">
              <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400/70 font-semibold">
                Parameter Pemantauan
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md">
                  <div className="text-[10px] font-mono text-slate-400">AMBANG KEMASAKAN</div>
                  <div className="font-mono font-bold text-emerald-400 text-sm mt-0.5">&gt; 19.0° Bx</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md">
                  <div className="text-[10px] font-mono text-slate-400">RESOLUSI SPASIAL</div>
                  <div className="font-mono font-bold text-teal-300 text-sm mt-0.5">Sub-Meter RTK</div>
                </div>
              </div>
            </div>

            {/* Micro Copyright */}
            <div className="relative z-10 pt-4 flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>AGRO-INTELLIGENCE CORE</span>
              <span>© 2026 E-BRIX SYSTEM</span>
            </div>

          </div>

          {/* SISI KANAN: High-Tech Glass Form Login */}
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-between bg-white/[0.98] text-slate-800">
            
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Otorisasi Akun
                  </h1>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Masuk untuk mengelola data telemetri kebun
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>

              {loginError && (
                <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{loginError}</span>
                </div>
              )}

              {/* Form Input */}
              <form onSubmit={handleLogin} className="space-y-4">
                
                {/* Role Switcher */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 mb-1.5">
                    Tingkat Akses (Role)
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => setLoginForm({ ...loginForm, role: 'admin' })}
                      className={`py-2 text-xs font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                        loginForm.role === 'admin'
                          ? 'bg-white text-emerald-800 shadow-sm border border-slate-200 font-extrabold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Administrator
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginForm({ ...loginForm, role: 'operator' })}
                      className={`py-2 text-xs font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                        loginForm.role === 'operator'
                          ? 'bg-white text-emerald-800 shadow-sm border border-slate-200 font-extrabold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Operator Kebun
                    </button>
                  </div>
                </div>

                {/* Input Username */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 mb-1.5" htmlFor="admin-identifier">
                    Nama Pengguna (Username)
                  </label>
                  <div className="relative">
                    <input
                      id="admin-identifier"
                      type="text"
                      required
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                      placeholder="Masukkan username anda"
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                {/* Input Password */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 mb-1.5" htmlFor="admin-password">
                    Kata Sandi (Password)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      placeholder="••••••••••••"
                      className="w-full h-11 pl-4 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full h-11 mt-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-mono font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-700/25 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Masuk Ke Portal
                </button>

              </form>
            </div>

            {/* Bottom Security Note */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                KONEKSI AMAN SSL
              </span>
              <span>VERSI 2.6.0 PRO</span>
            </div>

          </div>

        </div>

      </main>
    );
  }

  // ==========================================
  // MAIN DASHBOARD SHELL
  // ==========================================
  return (
    <div className="flex h-screen w-screen bg-[#f1f5f3] font-sans overflow-hidden">
      
      {/* Precision Agro Sidebar */}
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

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col overflow-hidden relative min-w-0">
        
        {/* Modern HUD Header */}
        <Header activeTab={activeTab} />

        {/* Content View Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto flex flex-col gap-6">

          {/* Precision StatCards for Map & Analysis View */}
          {(activeTab === 'peta' || activeTab === 'analisis') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 shrink-0">
              <StatCard 
                title="Rata-rata Brix" 
                value={`${stats.avg_brix || 0}°`} 
                telemetryCode="AVG.BX"
                subtext="Indeks kematangan rata-rata"
              />

              <StatCard 
                title="Petak Ditampilkan" 
                value={
                  selectedBlok === 'all'
                    ? (selectedLahan === 'all'
                      ? (Array.isArray(blokData) ? blokData.length : 0)
                      : (Array.isArray(blokData) ? blokData.filter(b => String(b?.properties?.id_lahan || b?.id_lahan) === String(selectedLahan)).length : 0))
                    : 1
                } 
                telemetryCode="PLOT.QTY"
                subtext={selectedBlok !== 'all' ? '1 petak spesifik aktif' : `${Array.isArray(blokData) ? blokData.length : 0} total petak`}
              />

              <StatCard 
                title="Brix Tertinggi" 
                value={`${stats.max_brix || 0}°`} 
                telemetryCode="MAX.BX"
                subtext="Puncak kadar gula poligon"
              />

              <StatCard 
                title="Brix Terendah" 
                value={`${stats.min_brix || 0}°`} 
                telemetryCode="MIN.BX"
                subtext="Titik vegetatif / sampling awal"
              />
            </div>
          )}

          {/* Active View Component */}
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