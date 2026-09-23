import { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StatCard from './components/StatCard';
import DashboardMap from './views/DashboardMap';
import AnalysisData from './views/AnalysisData';
import ManageLand from './views/ManageLand';
import ManagePetani from './views/ManagePetani';

function App() {
  // ==========================================
  // 📌 1. STATE AUTENTIKASI (LOGIN)
  // ==========================================
  const [userLogin, setUserLogin] = useState(() => {
    const savedUser = localStorage.getItem('ebrix_user');
    return savedUser ? JSON.parse(savedUser) : null;
  }); 
  
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // ==========================================
  // 📌 2. STATE BAWAAN DASHBOARD
  // ==========================================
  const [activeTab, setActiveTab] = useState('peta'); 
  const [sampelData, setSampelData] = useState([]); 
  const [blokData, setBlokData] = useState([]);
  const [lahanData, setLahanData] = useState([]); 
  
  const [selectedLahan, setSelectedLahan] = useState('all');
  const [selectedBlok, setSelectedBlok] = useState('all');
  const [brixFilter, setBrixFilter] = useState('all'); 
  
  const [stats, setStats] = useState({ avg_brix: 0, max_brix: 0, min_brix: 0, total_titik: 0 });

  // ==========================================
  // 📌 3. FUNGSI LOGIN & LOGOUT (DENGAN PENGAMAN GANDA)
  // ==========================================
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('https://956qsggs-3000.asse.devtunnels.ms/auth/login', {
        username: loginForm.username,
        password: loginForm.password,
        platform: 'web' // Mengirim identitas platform ke backend
      });
      
      // 🌟 PENGAMAN FRONTEND (Lapis Kedua)
      if (res.data.user.role !== 'admin') {
        setLoginError('Akses Ditolak! Dashboard Web ini khusus untuk Administrator.');
        return; 
      }
      
      setUserLogin(res.data.user); 
      localStorage.setItem('ebrix_user', JSON.stringify(res.data.user)); 
      
      setLoginError('');
    } catch (err) {
      // 🌟 TANGKAP PESAN ERROR SPESIFIK DARI BACKEND
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

  // ==========================================
  // 📌 4. FUNGSI TARIK DATA (DIPERBARUI ANTI-CACHE)
  // ==========================================
  const fetchSemuaData = async () => {
    console.log("📡 [1] Memulai proses penarikan data dari Backend...");
    
    const timestamp = new Date().getTime();
    
    try {
      const resLahan = await axios.get(`https://956qsggs-3000.asse.devtunnels.ms/lahan?t=${timestamp}`);
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
      console.error("❌ [ERROR] Gagal menarik data LAHAN:", error.message);
    }

    try {
      const resBlok = await axios.get(`https://956qsggs-3000.asse.devtunnels.ms/blok?t=${timestamp}`);
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
      console.error("❌ [ERROR] Gagal menarik data BLOK:", error.message);
    }

    try {
      const resSampel = await axios.get(`https://956qsggs-3000.asse.devtunnels.ms/data-brix?t=${timestamp}`);
      const rawSampel = resSampel.data?.data || resSampel.data?.features || resSampel.data || [];
      const arrSampel = Array.isArray(rawSampel) ? rawSampel : [];
      setSampelData(arrSampel);
    } catch (error) {
      console.error("❌ [ERROR] Gagal menarik data SAMPEL:", error.message);
    }
  };

  // ==========================================
  // 📌 4.5 FUNGSI HAPUS POIN BRIX
  // ==========================================
  const handleDeletePoin = async (id_titik) => {
    const isConfirmed = window.confirm("⚠️ Yakin ingin menghapus titik sampel ini? Data tidak bisa dikembalikan!");
    
    if (isConfirmed) {
      try {
        await axios.delete(`https://956qsggs-3000.asse.devtunnels.ms/data-brix/${id_titik}`);
        fetchSemuaData(); 
      } catch (error) {
        console.error("Gagal menghapus titik:", error);
        alert("Gagal menghapus titik. Cek koneksi server.");
      }
    }
  };

  // ==========================================
  // 📌 5. EFEK PERTAMA: REALTIME & FETCH DATA
  // ==========================================
  useEffect(() => {
    if (!userLogin) return;

    fetchSemuaData();
    
    const socket = io('https://956qsggs-3000.asse.devtunnels.ms', { 
      transports: ['polling'] 
    });
    
    socket.on('refresh_data', () => {
      console.log("🔔 [REALTIME] Data baru masuk! Memperbarui peta & statistik...");
      fetchSemuaData(); 
    });
    
    return () => {
      socket.disconnect();
    };
  }, [userLogin]);

  // ==========================================
  // 📌 6. EFEK KEDUA: HITUNG STATISTIK (DIPERBARUI)
  // ==========================================
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
      
      // Filter Wilayah
      let isLolosWilayah = true;
      if (selectedBlok !== 'all') isLolosWilayah = (idBlokTitik === String(selectedBlok));
      else if (selectedLahan !== 'all') isLolosWilayah = validBlokIds.includes(idBlokTitik);

      // Filter Kategori Brix untuk Statistik
      let isLolosBrix = true;
      if (brixFilter === 'rendah') isLolosBrix = brix < 15;
      else if (brixFilter === 'sedang') isLolosBrix = brix >= 15 && brix <= 19;
      else if (brixFilter === 'tinggi') isLolosBrix = brix > 19;

      return isLolosWilayah && isLolosBrix;
    });

    if (dataAktif.length > 0) {
      const brixValues = dataAktif
        .map(t => parseFloat(t?.properties?.nilai_brix || t?.nilai_brix))
        .filter(n => !isNaN(n)); 

      if(brixValues.length > 0) {
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
  // 🛡️ GERBANG LOGIN
  // ==========================================
  if (!userLogin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f4f7f6]">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
          <div className="text-center mb-8">
            <div className="bg-green-500 w-16 h-16 rounded-xl flex items-center justify-center font-bold text-3xl text-white mx-auto mb-4 shadow-md">EB</div>
            <h1 className="text-2xl font-extrabold text-[#122b1e] tracking-widest">E-BRIX</h1>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-bold">Sistem Monitoring Tebu</p>
          </div>
          
          {loginError && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm font-bold border border-red-200 text-center">{loginError}</div>}
          
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Username / Email</label>
              <input type="text" required value={loginForm.username} onChange={(e) => setLoginForm({...loginForm, username: e.target.value})} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm bg-gray-50 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Password</label>
              <input type="password" required value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm bg-gray-50 focus:bg-white transition-colors" />
            </div>
            <button type="submit" className="mt-4 w-full bg-[#122b1e] text-white font-bold py-3.5 rounded-lg hover:bg-[#1a3d2a] transition-all duration-300 shadow-md tracking-wider">
              MASUK KE SISTEM
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // 💻 DASHBOARD UTAMA
  // ==========================================
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