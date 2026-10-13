import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import axios from 'axios';
import * as turf from '@turf/turf'; 
import shp from 'shpjs'; 
import { API_BASE_URL, MAPBOX_TOKEN } from '../config';

mapboxgl.accessToken = MAPBOX_TOKEN;

export default function ManageLand({ blokData, lahanData, fetchSemuaData, _setActiveTab }) {
  const drawMapContainer = useRef(null);
  const drawMap = useRef(null);
  const hoverPopupRef = useRef(null); 
  const drawControl = useRef(null); 
  
  const [mode, setMode] = useState('tambah_blok'); 
  const [formData, setFormData] = useState({ nama: '', id_lahan: '', geojson: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const fileInputRef = useRef(null);

  // Auto-resize Mapbox when container size changes
  useEffect(() => {
    if (!drawMapContainer.current) return;
    const observer = new ResizeObserver(() => {
      drawMap.current?.resize();
    });
    observer.observe(drawMapContainer.current);
    return () => observer.disconnect();
  }, []);

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
    const isConfirmed = window.confirm("PERINGATAN!\nYakin ingin menghapus Lahan Induk ini? SEMUA Blok Lahan dan Titik Brix di dalamnya akan ikut terhapus permanen!");
    if (isConfirmed) {
        try {
            await axios.delete(`${API_BASE_URL}/lahan/${id_lahan}`);
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
            await axios.delete(`${API_BASE_URL}/blok/${id_blok}`);
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
      zoom: 16,
      attributionControl: false
    });

    drawControl.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
      defaultMode: 'draw_polygon'
    });
    drawMap.current.addControl(drawControl.current, 'top-right');

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
      drawMap.current.addLayer({ id: 'ref-lahan-outline', type: 'line', source: 'ref-lahan-source', paint: { 'line-color': '#f59e0b', 'line-width': 3 } });

      drawMap.current.addSource('ref-blok-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      drawMap.current.addLayer({ id: 'ref-blok-fill', type: 'fill', source: 'ref-blok-source', paint: { 'fill-color': '#10b981', 'fill-opacity': 0.18 } });
      drawMap.current.addLayer({ id: 'ref-blok-outline', type: 'line', source: 'ref-blok-source', paint: { 'line-color': '#34d399', 'line-width': 2, 'line-dasharray': [3, 2] } });
      
      hoverPopupRef.current = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 15,
          className: 'block-hover-popup'
      });

      drawMap.current.on('mousemove', 'ref-blok-fill', (e) => {
          drawMap.current.getCanvas().style.cursor = 'pointer';

          if (e.features.length > 0) {
              const namaBlok = e.features[0].properties?.nama_blok || 'Petak Tanpa Nama';
              const coordinates = e.lngLat;

              hoverPopupRef.current
                  .setLngLat(coordinates)
                  .setHTML(`<div class="px-2.5 py-1 font-mono text-xs font-bold text-slate-800 bg-white/95 backdrop-blur-md rounded shadow border border-emerald-500/30 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>${namaBlok}</div>`)
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
        await axios.post(`${API_BASE_URL}/lahan`, {
          nama_lahan: formData.nama,
          geojson: geometriBaru
        });
        alert(`✅ Sukses mendaftarkan Lahan Induk: ${formData.nama}!`);
      } else {
        await axios.post(`${API_BASE_URL}/blok`, {
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

    } catch (_error) {
      alert("Penyimpanan gagal. Cek validitas struktur format GeoJSON atau koneksi server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 gap-6">
      
      {/* HEADER BAR DENGAN MODE SWITCHER */}
      <div className="flex flex-wrap items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200/90 gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                Digitasi CAD Spasial & Pemetaan Blok
              </h3>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                TURF.JS GEODESIC
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Gunakan perangkat digitasi polygon interaktif atau import shapefile GIS (.zip)
            </p>
          </div>
        </div>

        {/* Mode Selector Pill */}
        <div className="bg-slate-100 p-1.5 rounded-xl flex gap-1 border border-slate-200">
          <button 
            type="button"
            onClick={() => setMode('tambah_blok')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              mode === 'tambah_blok' 
                ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/60 font-extrabold' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${mode === 'tambah_blok' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
            Petak Blok Kebun
          </button>
          <button 
            type="button"
            onClick={() => setMode('tambah_lahan')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              mode === 'tambah_lahan' 
                ? 'bg-white text-amber-800 shadow-sm border border-slate-200/60 font-extrabold' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${mode === 'tambah_lahan' ? 'bg-amber-500' : 'bg-slate-400'}`}></span>
            Lahan Induk (Estate)
          </button>
        </div>
      </div>

      {/* WORKSPACE DUA KOLOM: MAP CANVAS + CAD FORM */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[700px] xl:min-h-[760px]">
        
        {/* SISI KIRI: MAP VIEWPORT CAD */}
        <div className="flex-1 bg-white p-2 rounded-2xl shadow-sm border border-slate-200/90 relative overflow-hidden min-h-[580px] xl:min-h-[660px]">
          <div ref={drawMapContainer} className="absolute inset-0 w-full h-full rounded-xl overflow-hidden" />
          
          {/* Overlay Hint Top Left */}
          <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-lg border border-slate-200/90 text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono text-[11px] text-slate-700">
              {mode === 'tambah_blok' ? 'MODE: Digitasi Poligon Blok Petak' : 'MODE: Digitasi Batas Lahan Induk'}
            </span>
          </div>
        </div>

        {/* SISI KANAN: CAD FORM & DANGER ZONE */}
        <div className="w-full lg:w-96 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/90 flex flex-col justify-between overflow-y-auto gap-6 shrink-0">
          
          <form onSubmit={handleSimpanData} className="space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400">
                {mode === 'tambah_lahan' ? 'PROPERTI LAHAN INDUK' : 'PROPERTI BLOK PETAK'}
              </span>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold ${
                mode === 'tambah_lahan' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {mode === 'tambah_lahan' ? 'ESTATE' : 'BLOCK'}
              </span>
            </div>

            {mode === 'tambah_blok' && (
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Induk Lahan Utama (Estate)
                </label>
                <select 
                  required 
                  value={formData.id_lahan} 
                  onChange={(e) => setFormData({...formData, id_lahan: e.target.value})} 
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-white focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                >
                  <option value="">-- Pilih Induk Lahan --</option>
                  {lahanData.map(l => (
                    <option key={l.properties.id_lahan} value={l.properties.id_lahan}>
                      {l.properties.nama_lahan}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                {mode === 'tambah_lahan' ? 'Nama Lahan Utama' : 'Nama / Kode Blok Petak'}
              </label>
              <input 
                type="text" 
                required 
                placeholder={mode === 'tambah_lahan' ? "Contoh: Perkebunan Jatitujuh" : "Contoh: Blok A-01"} 
                value={formData.nama} 
                onChange={(e) => setFormData({...formData, nama: e.target.value})} 
                className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-white focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
              />
            </div>

            {/* Geometri Koordinat & Upload SHP */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                  Geometri Spasial GeoJSON
                </label>
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()} 
                  className="flex items-center gap-1.5 text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition shadow-xs"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Import SHP (.zip)
                </button>
                <input 
                  type="file" 
                  accept=".zip" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={handleUploadSHP} 
                />
              </div>

              <textarea 
                required 
                readOnly 
                value={formData.geojson} 
                className="w-full h-28 border border-slate-200 p-3 rounded-xl font-mono text-[10px] bg-slate-50 text-slate-600 outline-none resize-none" 
                placeholder="Gambar poligon area pada peta atau import file Shapefile (.zip) ESRI..." 
              />
            </div>

            {/* Action Submit */}
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className={`w-full h-11 rounded-xl font-mono text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${
                mode === 'tambah_lahan' 
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20' 
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {isSubmitting 
                ? 'Menyimpan Geometri...' 
                : mode === 'tambah_lahan' ? 'Registrasi Lahan Induk' : 'Daftarkan Blok Petak'}
            </button>
          </form>

          {/* DANGER ZONE (ZONA HAPUS DATA) */}
          <div className="border-t border-slate-100 pt-5 space-y-3">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-rose-600 uppercase tracking-wider">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Zona Destruktif Hapus
            </div>

            <div className="space-y-2 text-xs">
              
              {/* Hapus Petak */}
              <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 space-y-1.5">
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase">
                  Hapus Blok Petak
                </label>
                <div className="flex gap-2">
                  <select 
                    id="select-delete-blok"
                    className="flex-1 h-8 px-2 text-xs border border-slate-200 rounded-lg outline-none bg-white text-slate-700"
                  >
                    <option value="">-- Pilih Petak --</option>
                    {Array.isArray(lahanData) && lahanData.map(lahan => {
                      const idLahan = String(lahan.properties?.id_lahan || lahan.id_lahan);
                      const namaLahan = lahan.properties?.nama_lahan || lahan.nama_lahan;
                      const blokDiLahanIni = (blokData || [])
                        .filter(b => String(b.properties?.id_lahan || b.id_lahan) === idLahan)
                        .sort((a, b) => (a.properties?.nama_blok || a.nama_blok || '').localeCompare(b.properties?.nama_blok || b.nama_blok || '', undefined, { numeric: true }));

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
                    type="button"
                    onClick={() => handleDeleteBlok(document.getElementById('select-delete-blok').value)}
                    className="px-3 h-8 bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs font-bold rounded-lg transition shadow-xs"
                  >
                    Hapus
                  </button>
                </div>
              </div>

              {/* Hapus Lahan Induk */}
              <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 space-y-1.5">
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase">
                  Hapus Lahan Induk
                </label>
                <div className="flex gap-2">
                  <select 
                    id="select-delete-lahan"
                    className="flex-1 h-8 px-2 text-xs border border-slate-200 rounded-lg outline-none bg-white text-slate-700"
                  >
                    <option value="">-- Pilih Lahan --</option>
                    {Array.isArray(lahanData) && [...lahanData]
                      .sort((a, b) => (a.properties?.nama_lahan || a.nama_lahan || '').localeCompare(b.properties?.nama_lahan || b.nama_lahan || '', undefined, { numeric: true }))
                      .map(lahan => (
                        <option key={lahan.properties?.id_lahan || lahan.id_lahan} value={lahan.properties?.id_lahan || lahan.id_lahan}>
                          {lahan.properties?.nama_lahan || lahan.nama_lahan}
                        </option>
                      ))
                    }
                  </select>
                  <button 
                    type="button"
                    onClick={() => handleDeleteLahan(document.getElementById('select-delete-lahan').value)}
                    className="px-3 h-8 bg-rose-700 hover:bg-rose-800 text-white font-mono text-xs font-bold rounded-lg transition shadow-xs"
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