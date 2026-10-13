import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { DUMMY_PETANI } from '../data/dummyData';

export default function ManagePetani() {
  const [activeTab, setActiveTab] = useState('pending'); 
  
  const [pendingData, setPendingData] = useState([]);
  const [approvedData, setApprovedData] = useState([]);
  const [inactiveData, setInactiveData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id_user: '', nama: '', nomor_telepon: '', alamat: '' });
  const [isSaving, setIsSaving] = useState(false);

  const BASE_URL = API_BASE_URL;

  const fetchSemuaPetani = async () => {
    setIsLoading(true);
    try {
      const [resPending, resApproved, resInactive] = await Promise.all([
        axios.get(`${BASE_URL}/admin/petani/pending`),
        axios.get(`${BASE_URL}/admin/petani/approved`),
        axios.get(`${BASE_URL}/admin/petani/inactive`)
      ]);

      const pData = resPending.data.data || [];
      const aData = resApproved.data.data || [];
      const iData = resInactive.data.data || [];

      if (pData.length === 0 && aData.length === 0 && iData.length === 0) {
        setPendingData(DUMMY_PETANI.pending);
        setApprovedData(DUMMY_PETANI.approved);
        setInactiveData(DUMMY_PETANI.inactive);
      } else {
        setPendingData(pData);
        setApprovedData(aData);
        setInactiveData(iData);
      }
    } catch (_error) {
      // Fallback ke data dummy jika backend offline
      setPendingData(DUMMY_PETANI.pending);
      setApprovedData(DUMMY_PETANI.approved);
      setInactiveData(DUMMY_PETANI.inactive);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSemuaPetani();
  }, []);

  const handleReview = async (id_user, action_type) => {
    const pesanKonfirmasi = action_type === 'approve' ? "Terima dan beri hak akses petugas ini?" 
                          : action_type === 'reject' ? "Tolak pendaftaran akun ini?" 
                          : action_type === 'deactivate' ? "Nonaktifkan petugas ini sementara?"
                          : "Aktifkan kembali petugas ini?";
                          
    if (!window.confirm(`⚠️ ${pesanKonfirmasi}`)) return;

    try {
      await axios.put(`${BASE_URL}/admin/petani/review/${id_user}`, { action: action_type });
      fetchSemuaPetani(); 
    } catch (_error) {
      // Fallback simulasi jika backend offline
      if (action_type === 'approve') {
        const item = pendingData.find(u => u.id_user === id_user);
        if (item) {
          setPendingData(prev => prev.filter(u => u.id_user !== id_user));
          setApprovedData(prev => [item, ...prev]);
        }
      } else if (action_type === 'reject') {
        setPendingData(prev => prev.filter(u => u.id_user !== id_user));
      } else if (action_type === 'deactivate') {
        const item = approvedData.find(u => u.id_user === id_user);
        if (item) {
          setApprovedData(prev => prev.filter(u => u.id_user !== id_user));
          setInactiveData(prev => [item, ...prev]);
        }
      } else if (action_type === 'reactivate') {
        const item = inactiveData.find(u => u.id_user === id_user);
        if (item) {
          setInactiveData(prev => prev.filter(u => u.id_user !== id_user));
          setApprovedData(prev => [item, ...prev]);
        }
      }
      alert("✅ Status petugas berhasil diperbarui (Mode Simulasi)!");
    }
  };

  const handleDelete = async (id_user) => {
    if (!window.confirm("🚨 PERINGATAN!\nYakin ingin menghapus akun ini secara PERMANEN dari database? Data riwayat sampling yang terkait mungkin terpengaruh.")) return;

    try {
      await axios.delete(`${BASE_URL}/admin/petani/${id_user}`);
      alert("✅ Akun berhasil dihapus permanen.");
      fetchSemuaPetani();
    } catch (_error) {
      setPendingData(prev => prev.filter(u => u.id_user !== id_user));
      setApprovedData(prev => prev.filter(u => u.id_user !== id_user));
      setInactiveData(prev => prev.filter(u => u.id_user !== id_user));
      alert("✅ Akun berhasil dihapus (Mode Simulasi).");
    }
  };

  const openEditModal = (user) => {
    setEditForm({
      id_user: user.id_user,
      nama: user.nama || '',
      nomor_telepon: user.nomor_telepon || '',
      alamat: user.alamat || ''
    });
    setIsEditModalOpen(true);
  };

  const submitEditData = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await axios.put(`${BASE_URL}/admin/petani/edit/${editForm.id_user}`, {
        nama: editForm.nama,
        nomor_telepon: editForm.nomor_telepon,
        alamat: editForm.alamat
      });
      alert("✅ Data profil berhasil diperbarui!");
      setIsEditModalOpen(false);
      fetchSemuaPetani(); 
    } catch (_error) {
      const updater = (list) => list.map(u => u.id_user === editForm.id_user ? { ...u, ...editForm } : u);
      setPendingData(updater);
      setApprovedData(updater);
      setInactiveData(updater);
      alert("✅ Data profil berhasil diperbarui (Mode Simulasi)!");
      setIsEditModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full bg-transparent relative">
      
      {/* HEADER BAR */}
      <div className="flex flex-wrap justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200/90 gap-4 shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-800 tracking-tight">
                Direktori Surveyor Lapangan
              </h2>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                AUDIT AKUN
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Verifikasi pendaftaran surveyor, audit izin pengambilan sampel, dan kontrol akses lapangan
            </p>
          </div>
        </div>

        <button 
          onClick={fetchSemuaPetani} 
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl font-mono text-xs font-bold transition shadow-xs disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Menyinkronkan...</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh Status</span>
            </>
          )}
        </button>
      </div>

      {/* TABS & LIST CONTAINER */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 flex flex-col flex-1 overflow-hidden">
        
        {/* SEGMENTED TAB BUTTONS */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-2">
          
          <button 
            onClick={() => setActiveTab('pending')}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-xs font-mono font-bold transition-all ${
              activeTab === 'pending' 
                ? 'bg-white text-amber-700 shadow-sm border border-slate-200/80 font-extrabold' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Menunggu Persetujuan
            <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${activeTab === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'}`}>
              {pendingData.length}
            </span>
          </button>
          
          <button 
            onClick={() => setActiveTab('approved')}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-xs font-mono font-bold transition-all ${
              activeTab === 'approved' 
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/80 font-extrabold' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Petugas Aktif
            <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${activeTab === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
              {approvedData.length}
            </span>
          </button>
          
          <button 
            onClick={() => setActiveTab('inactive')}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-xs font-mono font-bold transition-all ${
              activeTab === 'inactive' 
                ? 'bg-white text-slate-800 shadow-sm border border-slate-200/80 font-extrabold' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            Arsip Akun
            <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${activeTab === 'inactive' ? 'bg-slate-200 text-slate-800' : 'bg-slate-200 text-slate-600'}`}>
              {inactiveData.length}
            </span>
          </button>
        </div>

        {/* CONTENT AREA */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* TAB 1: PENDING */}
          {activeTab === 'pending' && (
            <div>
              {pendingData.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium">Tidak ada permohonan pendaftaran baru saat ini.</p>
                </div>
              ) : (
                <div className="grid gap-3.5">
                  {pendingData.map(user => (
                    <div key={user.id_user} className="flex flex-wrap items-center justify-between p-4 rounded-xl border border-amber-200/80 bg-amber-50/40 hover:bg-amber-50/70 transition-all gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 font-bold font-mono text-sm flex items-center justify-center">
                          {user.nama?.slice(0, 2).toUpperCase() || 'SR'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-slate-800 text-sm">{user.nama}</h4>
                            <span className="text-[10px] font-mono text-amber-700 bg-amber-100 px-2 py-0.2 rounded font-bold">
                              PENDING APPROVAL
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 font-mono">
                            {user.email || 'Email belum diisi'} • {user.nomor_telepon || 'Telepon -'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleReview(user.id_user, 'approve')} 
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Terima Akun
                        </button>
                        <button 
                          onClick={() => handleReview(user.id_user, 'reject')} 
                          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-mono font-bold rounded-xl transition"
                        >
                          Tolak
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: APPROVED */}
          {activeTab === 'approved' && (
            <div>
              {approvedData.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <p className="text-xs font-medium">Belum ada akun petugas lapangan aktif.</p>
                </div>
              ) : (
                <div className="grid gap-3.5">
                  {approvedData.map(user => (
                    <div key={user.id_user} className="flex flex-wrap items-center justify-between p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-emerald-50/30 hover:border-emerald-200 transition-all gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-700 border border-emerald-500/20 font-bold font-mono text-sm flex items-center justify-center">
                          {user.nama?.slice(0, 2).toUpperCase() || 'SR'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-slate-800 text-sm">{user.nama}</h4>
                            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.2 rounded font-bold">
                              AKTIF
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 font-mono">
                            {user.email || 'Email belum diisi'} • {user.nomor_telepon || 'Telepon -'}
                          </p>
                          {user.alamat && (
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              📍 {user.alamat}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => openEditModal(user)} 
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 text-xs font-mono font-bold rounded-xl shadow-xs transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit Profil
                        </button>
                        <button 
                          onClick={() => handleReview(user.id_user, 'deactivate')} 
                          className="px-3.5 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-xs font-mono font-bold rounded-xl transition"
                        >
                          Nonaktifkan
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INACTIVE */}
          {activeTab === 'inactive' && (
            <div>
              {inactiveData.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <p className="text-xs font-medium">Tidak ada riwayat akun nonaktif.</p>
                </div>
              ) : (
                <div className="grid gap-3.5">
                  {inactiveData.map(user => (
                    <div key={user.id_user} className="flex flex-wrap items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/60 opacity-80 hover:opacity-100 transition-all gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-500 line-through text-sm">{user.nama}</h4>
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-200 px-2 py-0.2 rounded font-bold">
                            NONAKTIF
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 font-mono">{user.email} • {user.nomor_telepon}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleReview(user.id_user, 'reactivate')} 
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold rounded-xl transition shadow-xs"
                        >
                          Aktifkan Kembali
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id_user)} 
                          className="px-3.5 py-2 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 text-xs font-mono font-bold rounded-xl transition flex items-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Hapus Permanen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* MODAL EDIT PROFIL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-fade-in-up">
            
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm">
                  Perbarui Profil Petugas
                </h3>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                className="text-slate-400 hover:text-slate-700 font-bold text-lg leading-none p-1"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={submitEditData} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 mb-1 uppercase tracking-wider">
                  Nama Lengkap
                </label>
                <input 
                  type="text" 
                  required 
                  value={editForm.nama} 
                  onChange={e => setEditForm({...editForm, nama: e.target.value})}
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 mb-1 uppercase tracking-wider">
                  Nomor Kontak Telepon / WA
                </label>
                <input 
                  type="text" 
                  required 
                  value={editForm.nomor_telepon} 
                  onChange={e => setEditForm({...editForm, nomor_telepon: e.target.value})}
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 mb-1 uppercase tracking-wider">
                  Alamat Domisili Kebun
                </label>
                <textarea 
                  required 
                  rows="3"
                  value={editForm.alamat} 
                  onChange={e => setEditForm({...editForm, alamat: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none" 
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)} 
                  className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving} 
                  className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Menyimpan...
                    </>
                  ) : 'Simpan Profil'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}