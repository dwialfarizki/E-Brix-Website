import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ManagePetani() {
  // ==========================================
  // 📌 1. STATE MANAGEMENT
  // ==========================================
  const [activeTab, setActiveTab] = useState('pending'); 
  
  const [pendingData, setPendingData] = useState([]);
  const [approvedData, setApprovedData] = useState([]);
  const [inactiveData, setInactiveData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 🌟 STATE UNTUK FITUR EDIT
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id_user: '', nama: '', nomor_telepon: '', alamat: '' });
  const [isSaving, setIsSaving] = useState(false);

  const BASE_URL = 'https://956qsggs-3000.asse.devtunnels.ms';

  // ==========================================
  // 📌 2. FUNGSI TARIK DATA (FETCH)
  // ==========================================
  const fetchSemuaPetani = async () => {
    setIsLoading(true);
    try {
      const [resPending, resApproved, resInactive] = await Promise.all([
        axios.get(`${BASE_URL}/admin/petani/pending`),
        axios.get(`${BASE_URL}/admin/petani/approved`),
        axios.get(`${BASE_URL}/admin/petani/inactive`)
      ]);

      setPendingData(resPending.data.data || []);
      setApprovedData(resApproved.data.data || []);
      setInactiveData(resInactive.data.data || []);
    } catch (error) {
      console.error("Gagal mengambil data petugas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSemuaPetani();
  }, []);

  // ==========================================
  // 📌 3. FUNGSI AKSI (REVIEW, DELETE & EDIT)
  // ==========================================
  const handleReview = async (id_user, action_type) => {
    const pesanKonfirmasi = action_type === 'approve' ? "Terima pendaftaran petugas ini?" 
                          : action_type === 'reject' ? "Tolak pendaftaran ini?" 
                          : action_type === 'deactivate' ? "Nonaktifkan petugas ini sementara?"
                          : "Aktifkan kembali petugas ini?";
                          
    if (!window.confirm(`⚠️ ${pesanKonfirmasi}`)) return;

    try {
      await axios.put(`${BASE_URL}/admin/petani/review/${id_user}`, { action: action_type });
      fetchSemuaPetani(); 
    } catch (error) {
      alert(error.response?.data?.message || "Terjadi kesalahan pada server.");
    }
  };

  const handleDelete = async (id_user) => {
    if (!window.confirm("🚨 PERINGATAN BAHAYA!\nYakin ingin menghapus akun ini secara PERMANEN dari database?")) return;

    try {
      await axios.delete(`${BASE_URL}/admin/petani/${id_user}`);
      alert("✅ Akun berhasil dihapus permanen.");
      fetchSemuaPetani();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal menghapus data.");
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
    } catch (error) {
      alert(error.response?.data?.message || "Gagal memperbarui data.");
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // 📌 4. RENDER UI
  // ==========================================
  return (
    <div className="flex flex-col gap-6 w-full h-full bg-transparent relative">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 shrink-0">
        <div>
          <h2 className="text-2xl font-extrabold text-[#122b1e]">Kelola Petugas</h2>
          <p className="text-sm text-gray-500 mt-1">Manajemen akses, profil, dan status akun petugas lapangan.</p>
        </div>
        <button 
          onClick={fetchSemuaPetani} 
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 font-bold text-sm transition shadow-sm"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin w-4 h-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Memuat...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Segarkan Data
            </>
          )}
        </button>
      </div>

      {/* KONTROL TABS & KONTEN */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col flex-1 overflow-hidden">
        
        {/* DESAIN TABS */}
        <div className="flex border-b border-gray-200 bg-gray-50/30">
          <button 
            onClick={() => setActiveTab('pending')}
            className={`flex-1 flex items-center justify-center gap-3 py-4 text-sm font-bold transition-all border-b-2 ${
              activeTab === 'pending' 
                ? 'border-orange-500 text-orange-600 bg-white' 
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            Menunggu Persetujuan
            <span className={`px-2 py-0.5 text-[10px] rounded-full ${activeTab === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-500'}`}>
              {pendingData.length}
            </span>
          </button>
          
          <button 
            onClick={() => setActiveTab('approved')}
            className={`flex-1 flex items-center justify-center gap-3 py-4 text-sm font-bold transition-all border-b-2 ${
              activeTab === 'approved' 
                ? 'border-green-500 text-green-600 bg-white' 
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            Petugas Aktif
            <span className={`px-2 py-0.5 text-[10px] rounded-full ${activeTab === 'approved' ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
              {approvedData.length}
            </span>
          </button>
          
          <button 
            onClick={() => setActiveTab('inactive')}
            className={`flex-1 flex items-center justify-center gap-3 py-4 text-sm font-bold transition-all border-b-2 ${
              activeTab === 'inactive' 
                ? 'border-gray-800 text-gray-800 bg-white' 
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            Arsip Akun
            <span className={`px-2 py-0.5 text-[10px] rounded-full ${activeTab === 'inactive' ? 'bg-gray-200 text-gray-800' : 'bg-gray-200 text-gray-500'}`}>
              {inactiveData.length}
            </span>
          </button>
        </div>

        {/* AREA KONTEN TAB */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* TAB 1: PENDING */}
          {activeTab === 'pending' && (
            <div>
              {pendingData.length === 0 ? (
                <div className="text-center py-10 text-gray-400 italic">Tidak ada pendaftaran baru.</div>
              ) : (
                <div className="grid gap-4">
                  {pendingData.map(user => (
                    <div key={user.id_user} className="flex justify-between items-center p-4 border border-orange-100 bg-orange-50/30 rounded-lg transition hover:bg-orange-50/50">
                      <div>
                        <h4 className="font-bold text-gray-800">{user.nama}</h4>
                        <p className="text-xs text-gray-500 mt-0.5 font-mono">{user.email} • {user.nomor_telepon}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* 🌟 TOMBOL EDIT DIHAPUS DARI SINI */}
                        <button onClick={() => handleReview(user.id_user, 'approve')} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded shadow-sm transition">Terima</button>
                        <button onClick={() => handleReview(user.id_user, 'reject')} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded shadow-sm transition">Tolak</button>
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
                <div className="text-center py-10 text-gray-400 italic">Belum ada petugas aktif.</div>
              ) : (
                <div className="grid gap-4">
                  {approvedData.map(user => (
                    <div key={user.id_user} className="flex justify-between items-center p-4 border border-green-100 bg-green-50/30 rounded-lg transition hover:bg-green-50/50">
                      <div>
                        <h4 className="font-bold text-gray-800">{user.nama}</h4>
                        <p className="text-xs text-gray-500 mt-0.5 font-mono">{user.email} • {user.nomor_telepon}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* 🌟 TOMBOL EDIT TETAP ADA DI SINI */}
                        <button onClick={() => openEditModal(user)} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-600 hover:text-blue-600 text-xs font-bold rounded shadow-sm transition">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          Edit
                        </button>
                        <button onClick={() => handleReview(user.id_user, 'deactivate')} className="px-4 py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 text-xs font-bold rounded transition shadow-sm">Nonaktifkan</button>
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
                <div className="text-center py-10 text-gray-400 italic">Tidak ada riwayat akun nonaktif.</div>
              ) : (
                <div className="grid gap-4">
                  {inactiveData.map(user => (
                    <div key={user.id_user} className="flex justify-between items-center p-4 border border-gray-200 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div>
                        <h4 className="font-bold text-gray-500 line-through">{user.nama}</h4>
                        <p className="text-xs text-gray-400 mt-0.5 font-mono">{user.email} • {user.nomor_telepon}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleReview(user.id_user, 'reactivate')} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded shadow-sm transition">Aktifkan Lagi</button>
                        <button onClick={() => handleDelete(user.id_user)} className="flex items-center gap-1.5 px-4 py-2 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 text-xs font-bold rounded shadow-sm transition">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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

      {/* ==========================================
          🌟 UI MODAL UNTUK EDIT PETUGAS 
          ========================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Edit Profil Petugas
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-red-500 font-bold text-xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={submitEditData} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Nama Lengkap</label>
                <input 
                  type="text" required 
                  value={editForm.nama} 
                  onChange={e => setEditForm({...editForm, nama: e.target.value})}
                  className="w-full border border-gray-300 p-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Nomor Telepon</label>
                <input 
                  type="text" required 
                  value={editForm.nomor_telepon} 
                  onChange={e => setEditForm({...editForm, nomor_telepon: e.target.value})}
                  className="w-full border border-gray-300 p-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Alamat Domisili</label>
                <textarea 
                  required rows="3"
                  value={editForm.alamat} 
                  onChange={e => setEditForm({...editForm, alamat: e.target.value})}
                  className="w-full border border-gray-300 p-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" 
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 transition">Batal</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2">
                  {isSaving ? (
                    <>
                      <svg className="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Menyimpan...
                    </>
                  ) : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}