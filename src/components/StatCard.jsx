export default function StatCard({ title, value, border }) {
  return (
    <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 ${border} flex flex-col justify-center`}>
      {/* 🌟 PERBAIKAN: Kembali ke abu-abu (gray-500) dengan ukuran text-xs agar estetika tetap terjaga tapi mudah dibaca */}
      <p className="text-xs text-gray-500 font-bold mb-2 tracking-widest uppercase">{title}</p>
      <h3 className="text-3xl font-black text-gray-800">{value}</h3>
    </div>
  );
}