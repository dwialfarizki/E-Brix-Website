import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import MapPopup from '../components/MapPopup';
import mapboxgl from 'mapbox-gl';
import axios from 'axios';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1IjoiZS1icml4IiwiYSI6ImNtdWF1aDAwdzAwencyeG9wbWFiN3VzMmcifQ._ntI1xPhnqVQIcm-ZlMiHw';

const DashboardMap = ({ 
    selectedLahan, setSelectedLahan, 
    selectedBlok, setSelectedBlok,
    brixFilter, setBrixFilter,
    sampelData, blokData, lahanData, onDeletePoin 
}) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const markersRef = useRef([]); 
    const hoverPopupRef = useRef(null); 
    const initialFlyDone = useRef(false);

    const [isLoadingEBK, setIsLoadingEBK] = useState(false);
    const [isMapReady, setIsMapReady] = useState(false);
    
    // 🌟 STATE BARU: Untuk mengatur visibilitas titik marker
    const [showMarkers, setShowMarkers] = useState(true);

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
            console.error("Gagal mengekstrak koordinat:", e);
        }
        return null;
    };

    const pastikanFeatureGeoJSON = (arrayData) => {
        if (!Array.isArray(arrayData)) return [];
        return arrayData.map(item => {
            if (item?.type === 'Feature') return item;
            return {
                type: 'Feature',
                properties: item?.properties || item || {},
                geometry: item?.geometry || item?.geojson || null
            };
        }).filter(f => f.geometry); 
    };

    // ==========================================
    // INISIALISASI MAPBOX PERTAMA KALI
    // ==========================================
    useEffect(() => {
        if (map.current) return;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/satellite-streets-v12',
            center: [108.4312, -6.7111], 
            zoom: 15
        });

        map.current.on('load', () => {
            map.current.addSource('blok-source', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });

            map.current.addLayer({
                id: 'blok-layer',
                type: 'fill',
                source: 'blok-source',
                paint: { 
                    'fill-color': '#3b82f6',   
                    'fill-opacity': 0.15       
                } 
            });

            map.current.addLayer({
                id: 'blok-line-layer',
                type: 'line',
                source: 'blok-source',
                paint: {
                    'line-color': '#60a5fa',   
                    'line-width': 2,
                    'line-dasharray': [2, 2]
                }
            });

            map.current.addSource('lahan-source', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });

            map.current.addLayer({
                id: 'lahan-layer',
                type: 'line',
                source: 'lahan-source',
                paint: {
                    'line-color': '#f97316', 
                    'line-width': 3.5
                }
            });

            hoverPopupRef.current = new mapboxgl.Popup({
                closeButton: false,
                closeOnClick: false,
                offset: 15,
                className: 'block-hover-popup'
            });

            map.current.on('mousemove', 'blok-layer', (e) => {
                map.current.getCanvas().style.cursor = 'pointer';

                if (e.features.length > 0) {
                    const namaBlok = e.features[0].properties?.nama_blok || 'Blok Tanpa Nama';
                    const coordinates = e.lngLat;

                    hoverPopupRef.current
                        .setLngLat(coordinates)
                        .setHTML(`<div class="p-1 px-2 font-bold text-gray-800 bg-white/90 backdrop-blur-sm rounded text-xs shadow-md border border-gray-100">${namaBlok}</div>`)
                        .addTo(map.current);
                }
            });

            map.current.on('mouseleave', 'blok-layer', () => {
                map.current.getCanvas().style.cursor = '';
                if (hoverPopupRef.current) hoverPopupRef.current.remove();
            });

            setIsMapReady(true);
        });

        return () => {
            markersRef.current.forEach(marker => marker.remove());
            if (hoverPopupRef.current) hoverPopupRef.current.remove(); 
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, []);

    // ==========================================
    // FUNGSI REQUEST HEATMAP GEE
    // ==========================================
    const fetchGEEHeatmap = async () => {
        if (!map.current || !isMapReady) return;

        try {
            const arrBlok = Array.isArray(blokData) ? blokData : [];
            const blokCocok = arrBlok.find(b => 
                String(b?.properties?.id_blok || b?.id_blok) === String(selectedBlok) ||
                String(b?.properties?.nama_blok || b?.nama_blok) === String(selectedBlok)
            );
            const idBlokTargetGGE = blokCocok ? String(blokCocok?.properties?.id_blok || blokCocok?.id_blok) : String(selectedBlok);

            if (selectedBlok !== 'all') {
                const arrSampel = Array.isArray(sampelData) ? sampelData : [];
                const titikDiBlokTarget = arrSampel.filter(t => String(t?.properties?.id_blok || t?.id_blok) === idBlokTargetGGE);

                if (titikDiBlokTarget.length === 0) {
                    if (map.current.getLayer?.('gee-kriging-layer')) map.current.removeLayer('gee-kriging-layer');
                    if (map.current.getSource?.('gee-kriging-source')) map.current.removeSource('gee-kriging-source');
                    setIsLoadingEBK(false);
                    return; 
                }
            }

            setIsLoadingEBK(true);
            
            const baseUrl = 'https://956qsggs-3000.asse.devtunnels.ms'; 
            const response = await axios.get(`${baseUrl}/api/heatmap?blokId=${idBlokTargetGGE}`);
            const tileUrl = response.data.tileUrl;

            if (tileUrl) {
                if (map.current.getLayer?.('gee-kriging-layer')) map.current.removeLayer('gee-kriging-layer');
                if (map.current.getSource?.('gee-kriging-source')) map.current.removeSource('gee-kriging-source');

                map.current.addSource('gee-kriging-source', {
                    type: 'raster',
                    tiles: [tileUrl],
                    tileSize: 256
                });

                map.current.addLayer({
                    id: 'gee-kriging-layer',
                    type: 'raster',
                    source: 'gee-kriging-source',
                    paint: {
                        'raster-opacity': 0.50,
                        'raster-fade-duration': 600 
                    }
                }, 'blok-line-layer'); 
            }
        } catch (error) {
            console.error("❌ [GEE] Gagal memuat gambar interpolasi GEE:", error.message);
        } finally {
            setIsLoadingEBK(false);
        }
    };

    // ==========================================
    // FUNGSI RENDER VEKTOR (POLIGON & TITIK)
    // ==========================================
    const updateVectorData = () => {
        if (!map.current || !isMapReady) return;

        const arrSampel = Array.isArray(sampelData) ? sampelData : [];
        const arrBlok = Array.isArray(blokData) ? blokData : [];
        const arrLahan = Array.isArray(lahanData) ? lahanData : [];

        if (!initialFlyDone.current && arrLahan.length > 0) {
            const titikAwal = dapatkanKoordinatTerbang(arrLahan[0]?.geometry || arrLahan[0]?.geojson);
            if (titikAwal) {
                map.current.flyTo({ center: titikAwal, zoom: 14, essential: true });
                initialFlyDone.current = true; 
            }
        }

        const blokCocok = arrBlok.find(b => 
            String(b?.properties?.id_blok || b?.id_blok) === String(selectedBlok) ||
            String(b?.properties?.nama_blok || b?.nama_blok) === String(selectedBlok)
        );
        const idBlokTarget = blokCocok ? String(blokCocok?.properties?.id_blok || blokCocok?.id_blok) : String(selectedBlok);

        try {
            let lahanTampil = arrLahan;
            if (selectedLahan !== 'all') {
                lahanTampil = arrLahan.filter(l => String(l?.properties?.id_lahan || l?.id_lahan) === String(selectedLahan));
                
                if (lahanTampil.length > 0 && selectedBlok === 'all') {
                    const titikTerbangLahan = dapatkanKoordinatTerbang(lahanTampil[0]?.geometry || lahanTampil[0]?.geojson);
                    if (titikTerbangLahan) {
                        map.current.flyTo({ center: titikTerbangLahan, zoom: 15, essential: true });
                    }
                }
            }
            map.current.getSource('lahan-source').setData({ type: 'FeatureCollection', features: pastikanFeatureGeoJSON(lahanTampil) });
        } catch (error) { console.error("Mapbox Error (Lahan):", error); }

        try {
            let blokTampil = arrBlok;
            if (selectedBlok !== 'all') {
                blokTampil = arrBlok.filter(b => String(b?.properties?.id_blok || b?.id_blok) === idBlokTarget);
                if (blokTampil.length > 0) {
                    const titikTerbangBlok = dapatkanKoordinatTerbang(blokTampil[0]?.geometry || blokTampil[0]?.geojson);
                    if (titikTerbangBlok) {
                        map.current.flyTo({ center: titikTerbangBlok, zoom: 16, essential: true });
                    }
                }
            } else if (selectedLahan !== 'all') {
                blokTampil = arrBlok.filter(b => String(b?.properties?.id_lahan || b?.id_lahan) === String(selectedLahan));
            }
            map.current.getSource('blok-source').setData({ type: 'FeatureCollection', features: pastikanFeatureGeoJSON(blokTampil) });
        } catch (error) { console.error("Mapbox Error (Blok):", error); }

        try {
            // Hapus semua marker yang ada saat ini
            markersRef.current.forEach(marker => marker.remove());
            markersRef.current = [];

            // 🌟 LOGIKA BARU: Jika showMarkers bernilai false, hentikan proses pembuatan titik
            if (!showMarkers) return;

            let validBlokIds = arrBlok.map(b => String(b?.properties?.id_blok || b?.id_blok));
            if (selectedLahan !== 'all') {
                validBlokIds = arrBlok
                    .filter(b => String(b?.properties?.id_lahan || b?.id_lahan) === String(selectedLahan))
                    .map(b => String(b?.properties?.id_blok || b?.id_blok));
            }

            const sampelTampil = arrSampel.filter(titik => {
                const idBlokTitik = String(titik?.properties?.id_blok || titik?.id_blok || '');
                const brix = parseFloat(titik?.nilai_brix || titik?.properties?.nilai_brix || 0);

                let isLolosWilayah = true;
                if (selectedBlok !== 'all') isLolosWilayah = (idBlokTitik === idBlokTarget);
                else if (selectedLahan !== 'all') isLolosWilayah = validBlokIds.includes(idBlokTitik);

                let isLolosBrix = true;
                if (brixFilter === 'rendah') isLolosBrix = brix < 15;
                else if (brixFilter === 'sedang') isLolosBrix = brix >= 15 && brix <= 19;
                else if (brixFilter === 'tinggi') isLolosBrix = brix > 19;

                return isLolosWilayah && isLolosBrix;
            });

            sampelTampil.forEach(titik => {
                const lng = parseFloat(titik?.longitude || titik?.lng || titik?.geometry?.coordinates?.[0]);
                const lat = parseFloat(titik?.latitude || titik?.lat || titik?.geometry?.coordinates?.[1]);
                const brix = parseFloat(titik?.nilai_brix || titik?.properties?.nilai_brix || 0);
                
                const id_titik = titik?.properties?.id_data || titik?.id_data || titik?.id_titik || titik?.properties?.id_titik || titik?.id_brix || titik?.properties?.id_brix || titik?.id || titik?.properties?.id; 

                const pengguna = titik?.properties?.nama_petani || titik?.nama_petani || 'Tidak Diketahui';
                const waktuAsli = titik?.properties?.created_at || titik?.created_at;
                const tanggal = waktuAsli ? new Date(waktuAsli).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
                const metodeInput = titik?.properties?.metode_input || titik?.metode_input || 'manual';

                if (!isNaN(lng) && !isNaN(lat)) {
                    let pinColor = '#10b981'; 
                    if (brix > 19) pinColor = '#ef4444'; 
                    else if (brix >= 15 && brix <= 19) pinColor = '#f59e0b'; 

                    const popupNode = document.createElement('div');
                    
                    const root = createRoot(popupNode);
                    root.render(
                        <MapPopup 
                            brix={brix} 
                            pengguna={pengguna} 
                            tanggal={tanggal} 
                            pinColor={pinColor} 
                            idTitik={id_titik}
                            metodeInput={metodeInput}
                            onDelete={() => {
                                if (!id_titik) {
                                    alert("Gagal: ID Titik tidak ditemukan! Cek Inspect Element > Console untuk melihat struktur datanya.");
                                    console.log("📦 STRUKTUR DATA TITIK INI:", titik);
                                    return;
                                }

                                if(onDeletePoin) {
                                    onDeletePoin(id_titik);
                                    if(document.querySelector('.mapboxgl-popup-close-button')) {
                                        document.querySelector('.mapboxgl-popup-close-button').click();
                                    }
                                }
                            }}
                        />
                    );

                    const popup = new mapboxgl.Popup({ offset: 30 })
                        .setDOMContent(popupNode);

                    const marker = new mapboxgl.Marker({ color: pinColor })
                        .setLngLat([lng, lat])
                        .setPopup(popup)
                        .addTo(map.current);

                    markersRef.current.push(marker);
                }
            });
        } catch (error) { console.error("Mapbox Error (Titik Sampel):", error); }
    };

    // ==========================================
    // EFEK 1: UPDATE VEKTOR (TITIK & POLIGON)
    // ==========================================
    // Dipisah agar titik bisa disembunyikan tanpa me-load ulang Heatmap
    useEffect(() => {
        if (isMapReady) {
            updateVectorData(); 
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedLahan, selectedBlok, brixFilter, lahanData, blokData, sampelData, isMapReady, showMarkers]);

    // ==========================================
    // EFEK 2: UPDATE HEATMAP GEE (RASTER)
    // ==========================================
    // Tidak akan ke-trigger saat showMarkers/brixFilter berubah
    useEffect(() => {
        if (isMapReady) {
            fetchGEEHeatmap();  
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedLahan, selectedBlok, lahanData, blokData, sampelData, isMapReady]);


    return (
        <div className="bg-white p-4 rounded-xl shadow flex flex-col h-full border border-gray-100 relative">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-green-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                    </svg>
                    <span className="text-lg">Peta Estimasi Kematangan (Brix)</span>
                </h3>
                
                {isLoadingEBK && (
                    <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full animate-pulse border border-blue-200 flex items-center gap-1.5">
                        <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Memproses Komputasi Kriging GEE...
                    </span>
                )}
            </div>
            
            <div className="relative flex-1 rounded-xl overflow-hidden border border-gray-200 shadow-inner min-h-[400px]">
                <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
                
                {/* 🌟 TOMBOL TOGGLE TITIK (MENGAMBANG DI PETA KIRI BAWAH) */}
                <div className="absolute bottom-6 left-6 z-10">
                    <button 
                        onClick={() => setShowMarkers(!showMarkers)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-colors border ${
                            showMarkers 
                            ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50' 
                            : 'bg-green-600 text-white border-green-700 hover:bg-green-700'
                        }`}
                    >
                        {showMarkers ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                </svg>
                                Sembunyikan Titik
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Tampilkan Titik
                            </>
                        )}
                    </button>
                </div>

                <div className="absolute bottom-6 right-6 bg-white p-4 rounded-xl shadow-lg border border-gray-100 min-w-[200px] z-10">
                    <div className="font-bold mb-4 text-[#1e293b] text-base">Estimasi Kematangan (Brix)</div>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-[#10b981] shrink-0 border border-green-700/20 shadow-sm"></div>
                            <span className="text-[#475569] text-sm font-medium">Rendah (&lt; 15.0°)</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-[#f59e0b] shrink-0 border border-orange-700/20 shadow-sm"></div>
                            <span className="text-[#475569] text-sm font-medium">Sedang (15.0° - 19.0°)</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-[#ef4444] shrink-0 border border-red-700/20 shadow-sm"></div>
                            <span className="text-[#475569] text-sm font-medium">Tinggi (&gt; 19.0°)</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-4 bg-[#f8fafc] p-4 rounded-xl border border-gray-200 flex flex-wrap items-end gap-4 shadow-sm shrink-0">
                
                <div className="flex-1 min-w-[200px]">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-orange-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                        </svg>
                        Lahan Induk
                    </label>
                    <select 
                        value={selectedLahan} 
                        onChange={(e) => { setSelectedLahan(e.target.value); setSelectedBlok('all'); }} 
                        className="w-full p-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm cursor-pointer transition-all hover:border-gray-400"
                    >
                        <option value="all">Semua Lahan</option>
                        {Array.isArray(lahanData) && lahanData.map(l => (
                            <option key={l.properties?.id_lahan || l.id_lahan} value={l.properties?.id_lahan || l.id_lahan}>
                                {l.properties?.nama_lahan || l.nama_lahan}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex-1 min-w-[200px]">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-blue-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                        </svg>
                        Petak Lahan
                    </label>
                    <select 
                        value={selectedBlok} 
                        onChange={(e) => setSelectedBlok(e.target.value)} 
                        className="w-full p-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all hover:border-gray-400"
                        disabled={selectedLahan === 'all' && (blokData || []).length === 0}
                    >
                        <option value="all">Semua Petak</option>
                        
                        {selectedLahan === 'all' ? (
                            Array.isArray(lahanData) && lahanData.map(lahan => {
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
                            })
                        ) : (
                            Array.isArray(blokData) && blokData
                                .filter(b => String(b.properties?.id_lahan || b.id_lahan) === String(selectedLahan))
                                .sort((a, b) => {
                                    const namaA = a.properties?.nama_blok || a.nama_blok || '';
                                    const namaB = b.properties?.nama_blok || b.nama_blok || '';
                                    return namaA.localeCompare(namaB, undefined, { numeric: true });
                                })
                                .map(b => (
                                    <option key={b.properties?.id_blok || b.id_blok} value={b.properties?.id_blok || b.id_blok}>
                                        {b.properties?.nama_blok || b.nama_blok}
                                    </option>
                                ))
                        )}
                    </select>
                </div>

                <div className="flex-1 min-w-[200px]">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-green-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                        </svg>
                        Filter Nilai Brix
                    </label>
                    <select 
                        value={brixFilter} 
                        onChange={(e) => setBrixFilter(e.target.value)} 
                        className="w-full p-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white shadow-sm cursor-pointer transition-all hover:border-gray-400"
                    >
                        <option value="all">Semua Nilai Brix</option>
                        <option value="rendah">Rendah (&lt; 15.0°)</option>
                        <option value="sedang">Sedang (15.0° - 19.0°)</option>
                        <option value="tinggi">Tinggi (&gt; 19.0°)</option>
                    </select>
                </div>

                <div className="w-auto">
                    <button 
                        onClick={() => { setSelectedLahan('all'); setSelectedBlok('all'); setBrixFilter('all'); }} 
                        className="px-5 py-2.5 bg-white text-gray-600 hover:bg-red-50 hover:text-red-600 font-bold text-sm rounded-lg border border-gray-300 hover:border-red-300 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                        Reset
                    </button>
                </div>
            </div>

        </div>
    );
};

export default DashboardMap;