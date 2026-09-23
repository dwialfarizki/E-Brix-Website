import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import axios from 'axios';
import * as turf from '@turf/turf'; 
import shp from 'shpjs'; 

mapboxgl.accessToken = 'pk.eyJ1IjoiZS1icml4IiwiYSI6ImNtdWF1aDAwdzAwencyeG9wbWFiN3VzMmcifQ._ntI1xPhnqVQIcm-ZlMiHw';

export default function ManageLand({ blokData, lahanData, fetchSemuaData, setActiveTab }) {
  const drawMapContainer = useRef(null);
  const drawMap = useRef(null);
  const hoverPopupRef = useRef(null); 
  const drawControl = useRef(null); 
  
  const [mode, setMode] = useState('tambah_blok'); 
  const [formData, setFormData] = useState({ nama: '', id_lahan: '', geojson: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const fileInputRef = useRef(null);

  const dapatkanKoordinatTerbang = (geometry) => {
    if (!geometry || !geometry.coordinates) return null;
    try {
        let coords = geometry.coordinates;
        while (Array.isArray(coords) && coords.length > 0 && Array.isArray(coords[0])) {
            coords = coords[0];
        }
        if (Array.isArray(coords) && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
            return coords;
        }
    } catch (e) {
        console.error("Gagal mengekstrak koordinat terbang:", e);
    }
    return null;
  };

  const gabungPoligon = (features) => {
    if (!features || features.length === 0) return null;
    if (features.length === 1) return features[0]; 
    
    const koordinatGabungan = [];
    features.forEach(f => {
        if (f.geometry?.type === 'Polygon') {
            koordinatGabungan.push(f.geometry.coordinates);
        } else if (f.geometry?.type === 'MultiPolygon') {
            koordinatGabungan.push(...f.geometry.coordinates);
        }
    });
    
    return {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'MultiPolygon',
            coordinates: koordinatGabungan
        }
    };
  };

  const cekTabrakanPoligon = (geometriBaru, daftarPoligonLama) => {
    try {
        const polyBaruFlat = turf.flatten(turf.feature(geometriBaru));

        for (let itemLama of daftarPoligonLama) {
            if (!itemLama.geometry || !itemLama.geometry.coordinates) continue;

            const polyLamaFlat = turf.flatten(turf.feature(itemLama.geometry));
            
            for (let featureBaru of polyBaruFlat.features) {
                for (let featureLama of polyLamaFlat.features) {
                    const isIntersect = turf.booleanIntersects(featureBaru, featureLama);
                    if (isIntersect) {
                        return true; 
                    }
                }
            }
        }
        return false; 
    } catch (error) {
        console.error("Error validasi spasial Turf.js:", error);
        return true; 
    }
  };

  const handleDeleteLahan = async (id_lahan) => {
    if (!id_lahan) {
        alert("Silakan pilih Lahan Induk yang ingin dihapus terlebih dahulu.");
        return;
    }
    const isConfirmed = window.confirm("PERINGATAN \nYakin ingin menghapus Lahan Induk ini? SEMUA Blok Lahan dan Titik Brix di dalamnya akan ikut terhapus permanen!");
    if (isConfirmed) {
        try {
            await axios.delete(`https://956qsggs-3000.asse.devtunnels.ms/lahan/${id_lahan}`);
            alert("✅ Lahan Induk berhasil dihapus!");
            fetchSemuaData(); 
        } catch (error) {
            console.error("Gagal menghapus lahan:", error);
            alert("Gagal menghapus lahan. Pastikan server nyala.");
        }
    }
  };

  const handleDeleteBlok = async (id_blok) => {
    if (!id_blok) {
        alert("Silakan pilih Blok Lahan yang ingin dihapus terlebih dahulu.");
        return;
    }
    const isConfirmed = window.confirm("Yakin ingin menghapus Blok Lahan ini? Titik Brix di dalamnya akan ikut terhapus.");
    if (isConfirmed) {
        try {
            await axios.delete(`https://956qsggs-3000.asse.devtunnels.ms/blok/${id_blok}`);
            alert("✅ Blok Lahan berhasil dihapus!");
            fetchSemuaData(); 
        } catch (error) {
            console.error("Gagal menghapus blok:", error);
            alert("Gagal menghapus blok lahan.");
        }
    }
  };

  useEffect(() => {
    if (drawMap.current) return;

    drawMap.current = new mapboxgl.Map({
      container: drawMapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [108.4312, -6.7111], 
      zoom: 16
    });

    drawControl.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
      defaultMode: 'draw_polygon'
    });
    drawMap.current.addControl(drawControl.current);

    const updateArea = () => {
      if (!drawControl.current) return;
      const data = drawControl.current.getAll();
      
      if (data.features.length > 0) {
        const fiturGabungan = gabungPoligon(data.features);
        setFormData(prev => ({ ...prev, geojson: JSON.stringify(fiturGabungan, null, 2) }));
      } else {
        setFormData(prev => ({ ...prev, geojson: '' }));
      }
    };

    drawMap.current.on('draw.create', updateArea);
    drawMap.current.on('draw.update', updateArea);
    drawMap.current.on('draw.delete', updateArea);

    drawMap.current.on('load', () => {
      drawMap.current.addSource('ref-lahan-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      drawMap.current.addLayer({ id: 'ref-lahan-outline', type: 'line', source: 'ref-lahan-source', paint: { 'line-color': '#f97316', 'line-width': 3 } });

      drawMap.current.addSource('ref-blok-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      drawMap.current.addLayer({ id: 'ref-blok-fill', type: 'fill', source: 'ref-blok-source', paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.15 } });
      drawMap.current.addLayer({ id: 'ref-blok-outline', type: 'line', source: 'ref-blok-source', paint: { 'line-color': '#60a5fa', 'line-width': 1.5, 'line-dasharray': [2, 2] } });
      
      hoverPopupRef.current = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 15,
          className: 'block-hover-popup'
      });

      drawMap.current.on('mousemove', 'ref-blok-fill', (e) => {
          drawMap.current.getCanvas().style.cursor = 'pointer';

          if (e.features.length > 0) {
              const namaBlok = e.features[0].properties?.nama_blok || 'Blok Tanpa Nama';
              const coordinates = e.lngLat;

              hoverPopupRef.current
                  .setLngLat(coordinates)
                  .setHTML(`<div class="p-1 px-2 font-bold text-gray-800 bg-white/90 backdrop-blur-sm rounded text-xs shadow-md border border-gray-100">${namaBlok}</div>`)
                  .addTo(drawMap.current);
          }
      });

      drawMap.current.on('mouseleave', 'ref-blok-fill', () => {
          drawMap.current.getCanvas().style.cursor = '';
          if (hoverPopupRef.current) hoverPopupRef.current.remove();
      });

      setMapLoaded(true);
    });

    return () => {
      if (hoverPopupRef.current) hoverPopupRef.current.remove(); 
      if (drawMap.current) {
        drawMap.current.remove();
        drawMap.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!drawMap.current || !mapLoaded) return;
    
    const srcLahan = drawMap.current.getSource('ref-lahan-source');
    if (srcLahan) srcLahan.setData({ type: 'FeatureCollection', features: lahanData });

    const srcBlok = drawMap.current.getSource('ref-blok-source');
    if (srcBlok) srcBlok.setData({ type: 'FeatureCollection', features: blokData });
  }, [blokData, lahanData, mapLoaded]);

  useEffect(() => {
    setFormData({ nama: '', id_lahan: '', geojson: '' });
    if (drawControl.current) {
        drawControl.current.deleteAll();
    }
  }, [mode]);

  useEffect(() => {
    if (mode === 'tambah_blok' && formData.id_lahan && drawMap.current && mapLoaded) {
      const lahanTerpilih = lahanData.find(l => String(l.properties?.id_lahan) === String(formData.id_lahan));
      
      if (lahanTerpilih) {
        const titikTerbang = dapatkanKoordinatTerbang(lahanTerpilih.geometry);
        if (titikTerbang) {
          drawMap.current.flyTo({
            center: titikTerbang,
            zoom: 16, 
            essential: true
          });
        }
      }
    }
  }, [formData.id_lahan, mode, lahanData, mapLoaded]);

  const handleUploadSHP = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.zip')) {
        alert("Gagal: File Shapefile harus di-compress ke dalam format .zip (berisi .shp, .shx, .dbf) terlebih dahulu!");
        event.target.value = null;
        return;
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const geojson = await shp(arrayBuffer); 

        let features = Array.isArray(geojson) ? geojson[0].features : geojson.features;

        if (!features || features.length === 0) {
            alert("Gagal: Tidak ada bentuk Poligon yang ditemukan di dalam file SHP tersebut.");
            return;
        }

        if (drawControl.current) {
            drawControl.current.deleteAll(); 
            drawControl.current.add({ type: 'FeatureCollection', features: features }); 
        }

        const fiturGabungan = gabungPoligon(features);
        setFormData(prev => ({ ...prev, geojson: JSON.stringify(fiturGabungan, null, 2) }));
        
        const titikTerbang = dapatkanKoordinatTerbang(fiturGabungan.geometry);
        if (titikTerbang && drawMap.current) {
            drawMap.current.flyTo({ center: titikTerbang, zoom: 16, essential: true });
        }

        alert(`✅ Sukses! ${features.length} Poligon dari Shapefile berhasil dibaca dan disatukan ke peta!`);

    } catch (error) {
        console.error("Gagal parse SHP:", error);
        alert("Gagal membaca file SHP. Pastikan format file .zip valid dan proyeksinya adalah WGS84 (EPSG:4326).");
    } finally {
        event.target.value = null; 
    }
  };

  const handleSimpanData = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.geojson || formData.geojson.trim() === '') {
        alert("⚠️ PENDAFTARAN DITOLAK!\nKamu belum menggambar batas area di peta atau meng-upload file Shapefile. Silakan gambar poligonnya terlebih dahulu.");
        setIsSubmitting(false);
        return;
    }
    
    try {
      const parsedGeoJSON = JSON.parse(formData.geojson);
      const geometriBaru = parsedGeoJSON.geometry;

      const namaDiformat = formData.nama.trim().toLowerCase();

      if (mode === 'tambah_lahan') {
          const isNamaLahanExist = lahanData.some(l => 
              (l.properties?.nama_lahan || l.nama_lahan).trim().toLowerCase() === namaDiformat
          );
          
          if (isNamaLahanExist) {
              alert(`⚠️ PENDAFTARAN DITOLAK!\nLahan Induk dengan nama "${formData.nama}" sudah terdaftar di sistem. Silakan gunakan nama yang berbeda.`);
              setIsSubmitting(false);
              return;
          }
      } else {
          if (!formData.id_lahan) {
              alert("Pilih Lahan Induk terlebih dahulu!");
              setIsSubmitting(false);
              return;
          }

          const isNamaBlokExist = blokData.some(b => 
              String(b.properties?.id_lahan || b.id_lahan) === String(formData.id_lahan) &&
              (b.properties?.nama_blok || b.nama_blok).trim().toLowerCase() === namaDiformat
          );

          if (isNamaBlokExist) {
              alert(`⚠️ PENDAFTARAN DITOLAK!\nPetak dengan nama/kode "${formData.nama}" sudah ada di dalam Lahan Induk ini. Silakan gunakan kode lain (misal: ${formData.nama}-2).`);
              setIsSubmitting(false);
              return;
          }
      }

      const daftarPembanding = mode === 'tambah_lahan' ? lahanData : blokData;
      const isTabrakan = cekTabrakanPoligon(geometriBaru, daftarPembanding);

      if (isTabrakan) {
          alert(`🚨 PENDAFTARAN DITOLAK!\n\nArea poligon bertabrakan atau menyentuh batas ${mode === 'tambah_lahan' ? 'Lahan Induk' : 'Petak'} lain yang sudah ada di database. Silakan gambar ulang area yang kosong.`);
          if (drawControl.current) drawControl.current.deleteAll(); 
          setFormData(prev => ({ ...prev, geojson: '' }));
          setIsSubmitting(false);
          return; 
      }

      if (mode === 'tambah_lahan') {
        await axios.post('https://956qsggs-3000.asse.devtunnels.ms/lahan', {
          nama_lahan: formData.nama,
          geojson: geometriBaru
        });
        alert(`✅ Sukses mendaftarkan Lahan Induk: ${formData.nama}!`);
      } else {
        await axios.post('https://956qsggs-3000.asse.devtunnels.ms/blok', {
          id_lahan: formData.id_lahan,
          nama_blok: formData.nama,
          geojson: geometriBaru
        });
        alert(`✅ Sukses menambahkan Blok Lahan: ${formData.nama}!`);
      }

      await fetchSemuaData();
      
      setFormData({ 
          nama: '', 
          id_lahan: mode === 'tambah_blok' ? formData.id_lahan : '', 
          geojson: '' 
      });
      if (drawControl.current) {
          drawControl.current.deleteAll();
      }

    } catch (error) {
      alert("Penyimpanan gagal. Cek validitas struktur format GeoJSON atau koneksi server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 gap-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Manajemen Pemetaan Wilayah</h3>
          <p className="text-sm text-gray-500 mt-1">Gunakan peta spasial interaktif untuk meregistrasikan koordinat area ke sistem.</p>
        </div>
        <div className="bg-gray-200/60 p-1.5 rounded-xl flex gap-1 border">
          <button onClick={() => setMode('tambah_blok')} className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${mode === 'tambah_blok' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            Tambah Petak 
          </button>
          <button onClick={() => setMode('tambah_lahan')} className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${mode === 'tambah_lahan' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
            Tambah Lahan Induk
          </button>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-[520px]">
        <div className="flex-1 bg-white p-2 rounded-xl shadow-lg border border-gray-100 relative overflow-hidden">
          <div ref={drawMapContainer} className="absolute inset-0 w-full h-full rounded-lg" />
        </div>

        <div className="w-1/3 min-w-[320px] bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col justify-between overflow-y-auto">
          
          <form onSubmit={handleSimpanData} className="space-y-5">
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-gray-400 uppercase tracking-wider">
                {mode === 'tambah_lahan' ? 'Formulir Lahan Induk' : 'Formulir Petak'}
              </h4>

              {mode === 'tambah_blok' && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase">Induk Lahan Utama</label>
                  <select required value={formData.id_lahan} onChange={(e) => setFormData({...formData, id_lahan: e.target.value})} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-sm">
                    <option value="">-- Pilih Lahan --</option>
                    {lahanData.map(l => (
                      <option key={l.properties.id_lahan} value={l.properties.id_lahan}>{l.properties.nama_lahan}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2 uppercase">
                  {mode === 'tambah_lahan' ? 'Nama Lahan Utama' : 'Nama/Kode Petak'}
                </label>
                <input type="text" required placeholder={mode === 'tambah_lahan' ? "Contoh: Perkebunan Palimanan Barat" : "Contoh: A"} value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm outline-none" />
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-gray-600 uppercase">Geometri Koordinat Spasial</label>
                    <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()} 
                        className="flex items-center gap-1.5 text-[10px] font-bold bg-green-50 text-green-600 px-2 py-1 rounded border border-green-200 hover:bg-green-100 transition"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                        </svg>
                        Upload SHP (.zip)
                    </button>
                    <input 
                        type="file" 
                        accept=".zip" 
                        ref={fileInputRef} 
                        style={{ display: 'none' }} 
                        onChange={handleUploadSHP} 
                    />
                </div>
                <textarea required readOnly value={formData.geojson} className="w-full h-32 border border-gray-200 p-3 rounded-lg font-mono text-[11px] bg-gray-50/80 text-gray-500 outline-none resize-none" placeholder="Gambar batas area di peta atau upload file Shapefile (.zip)..." />
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-lg font-bold text-white shadow-md transition-all ${mode === 'tambah_lahan' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              {isSubmitting ? 'Menyimpan Data...' : mode === 'tambah_lahan' ? 'Registrasi Lahan Induk' : 'Daftarkan Petak Baru'}
            </button>
          </form>

          <div className="mt-8 border-t-2 border-dashed border-red-200 pt-6">
              <h3 className="text-[11px] font-extrabold text-red-500 mb-4 uppercase tracking-wider flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  Zona Hapus Data
              </h3>
              
              <div className="flex flex-col gap-3">
                  <div className="bg-red-50/50 p-3 rounded-lg border border-red-100 flex flex-col gap-2">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase">Hapus Blok Lahan</label>
                      <div className="flex gap-2">
                          <select 
                              id="select-delete-blok"
                              className="flex-1 p-2 text-xs border border-gray-300 rounded outline-none focus:border-red-500 bg-white"
                          >
                              <option value="">-- Pilih Petak --</option>
                              {/* 🌟 PERBAIKAN: Grouping dan Sorting diterapkan di Dropdown Hapus Blok */}
                              {Array.isArray(lahanData) && lahanData.map(lahan => {
                                  const idLahan = String(lahan.properties?.id_lahan || lahan.id_lahan);
                                  const namaLahan = lahan.properties?.nama_lahan || lahan.nama_lahan;
                                  
                                  const blokDiLahanIni = (blokData || [])
                                      .filter(b => String(b.properties?.id_lahan || b.id_lahan) === idLahan)
                                      .sort((a, b) => {
                                          const namaA = a.properties?.nama_blok || a.nama_blok || '';
                                          const namaB = b.properties?.nama_blok || b.nama_blok || '';
                                          return namaA.localeCompare(namaB, undefined, { numeric: true });
                                      });

                                  if (blokDiLahanIni.length === 0) return null; 

                                  return (
                                      <optgroup key={idLahan} label={`◆ Lahan ${namaLahan}`}>
                                          {blokDiLahanIni.map(b => (
                                              <option key={b.properties?.id_blok || b.id_blok} value={b.properties?.id_blok || b.id_blok}>
                                                  {b.properties?.nama_blok || b.nama_blok}
                                              </option>
                                          ))}
                                      </optgroup>
                                  );
                              })}
                          </select>
                          <button 
                              onClick={() => handleDeleteBlok(document.getElementById('select-delete-blok').value)}
                              className="bg-red-500 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded text-xs transition-colors shadow-sm"
                          >
                               Hapus
                          </button>
                      </div>
                  </div>

                  <div className="bg-red-50/50 p-3 rounded-lg border border-red-100 flex flex-col gap-2">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase">Hapus Lahan Induk</label>
                      <div className="flex gap-2">
                          <select 
                              id="select-delete-lahan"
                              className="flex-1 p-2 text-xs border border-gray-300 rounded outline-none focus:border-red-500 bg-white"
                          >
                              <option value="">-- Pilih Lahan --</option>
                              {/* 🌟 PERBAIKAN: Sorting diterapkan di Dropdown Hapus Lahan */}
                              {Array.isArray(lahanData) && [...lahanData]
                                  .sort((a, b) => {
                                      const namaA = a.properties?.nama_lahan || a.nama_lahan || '';
                                      const namaB = b.properties?.nama_lahan || b.nama_lahan || '';
                                      return namaA.localeCompare(namaB, undefined, { numeric: true });
                                  })
                                  .map(lahan => (
                                      <option key={lahan.properties?.id_lahan || lahan.id_lahan} value={lahan.properties?.id_lahan || lahan.id_lahan}>
                                          {lahan.properties?.nama_lahan || lahan.nama_lahan}
                                      </option>
                                  ))
                              }
                          </select>
                          <button 
                              onClick={() => handleDeleteLahan(document.getElementById('select-delete-lahan').value)}
                              className="bg-red-600 hover:bg-red-800 text-white font-bold px-3 py-1.5 rounded text-xs transition-colors shadow-sm"
                          >
                               Hapus
                          </button>
                      </div>
                  </div>
              </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}