import React from 'react';

// 🌟 1. Tambahkan metodeInput di parameter
export default function MapPopup({ brix, pengguna, tanggal, pinColor, idTitik, onDelete, metodeInput }) {
    
    // 🌟 2. Logika untuk membedakan gaya tampilan (badge) otomatis vs manual
    const isOtomatis = metodeInput?.toLowerCase() === 'otomatis';

    return (
        <div className="flex flex-col min-w-[160px] p-1 font-sans">
            <div className="text-center mb-3">
                <div className="text-3xl font-extrabold tracking-tight" style={{ color: pinColor }}>
                    {brix.toFixed(1)}°
                </div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                    Nilai Brix
                </div>
            </div>
            
            <div className="border-t border-dashed border-gray-200 pt-3 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">👤 Pengguna</span>
                    <span className="font-bold text-gray-800 truncate max-w-[90px]" title={pengguna}>
                        {pengguna}
                    </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">📅 Tanggal</span>
                    <span className="font-bold text-gray-800">{tanggal}</span>
                </div>
                
                {/* ==========================================
                    🌟 TAMBAHAN: Baris untuk Metode Input
                    ========================================== */}
                <div className="flex justify-between items-center text-xs mt-0.5">
                    <span className="text-gray-500">⚙️ Metode</span>
                    <span className={`font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-sm ${
                        isOtomatis 
                        ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                        {metodeInput || 'Manual'}
                    </span>
                </div>
            </div>

            {/* ==========================================
                Tombol Hapus Poin
                ========================================== */}
            {onDelete && (
                <button 
                    onClick={onDelete}
                    className="mt-4 w-full bg-white hover:bg-red-50 text-red-500 border border-red-200 py-1.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider transition-colors flex items-center justify-center shadow-sm"
                >
                     Hapus Poin
                </button>
            )}
        </div>
    );
}