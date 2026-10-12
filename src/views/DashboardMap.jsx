import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import MapPopup from '../components/MapPopup';
import mapboxgl from 'mapbox-gl';
import axios from 'axios';
import 'mapbox-gl/dist/mapbox-gl.css';
import { API_BASE_URL, MAPBOX_TOKEN } from '../config';

mapboxgl.accessToken = MAPBOX_TOKEN;

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
            zoom: 15,
            attributionControl: false
        });

        // Add standard navigation controls with clean styling
        map.current.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right');

        map.current.on('load', () => {
            map.current.addSource('blok-source', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });

            // Modern Agro Emerald fill for blocks
            map.current.addLayer({
                id: 'blok-layer',
                type: 'fill',
                source: 'blok-source',
                paint: { 
                    'fill-color': '#10b981',   
                    'fill-opacity': 0.18       
                } 
            });

            map.current.addLayer({
                id: 'blok-line-layer',
                type: 'line',
                source: 'blok-source',
                paint: {
                    'line-color': '#34d399',   
                    'line-width': 2.2,
                    'line-dasharray': [3, 2]
                }
            });

            map.current.addSource('lahan-source', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });

            // Cane Gold outline for outer plantation boundary
            map.current.addLayer({
                id: 'lahan-layer',
                type: 'line',
                source: 'lahan-source',
                paint: {
                    'line-color': '#f59e0b', 
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
                    const namaBlok = e.features[0].properties?.nama_blok || 'Petak Tanpa Nama';
                    const coordinates = e.lngLat;

                    hoverPopupRef.current
                        .setLngLat(coordinates)
                        .setHTML(`<div class="px-3 py-1.5 font-mono text-xs font-bold text-emerald-950 bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-emerald-500/30 flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-500"></span>${namaBlok}</div>`)
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
            
            const response = await axios.get(`${API_BASE_URL}/api/heatmap?blokId=${idBlokTargetGGE}`);
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
                        'raster-opacity': 0.55,
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
            markersRef.current.forEach(marker => marker.remove());
            markersRef.current = [];

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
                const jenisTebu = titik?.properties?.jenis_tebu || titik?.jenis_tebu;
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
                            jenisTebu={jenisTebu}
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

    useEffect(() => {
        if (isMapReady) {
            updateVectorData(); 
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedLahan, selectedBlok, brixFilter, lahanData, blokData, sampelData, isMapReady, showMarkers]);

    useEffect(() => {
        if (isMapReady) {
            fetchGEEHeatmap();  
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedLahan, selectedBlok, lahanData, blokData, sampelData, isMapReady]);

    // Menghitung jumlah titik yang sedang aktif difilter
    const hitungTitikAktif = () => {
        const arrSampel = Array.isArray(sampelData) ? sampelData : [];
        const arrBlok = Array.isArray(blokData) ? blokData : [];
        let validBlokIds = arrBlok.map(b => String(b?.properties?.id_blok || b?.id_blok));
        if (selectedLahan !== 'all') {
            validBlokIds = arrBlok
                .filter(b => String(b?.properties?.id_lahan || b?.id_lahan) === String(selectedLahan))
                .map(b => String(b?.properties?.id_blok || b?.id_blok));
        }
        return arrSampel.filter(titik => {
            const idBlokTitik = String(titik?.properties?.id_blok || titik?.id_blok || '');
            const brix = parseFloat(titik?.nilai_brix || titik?.properties?.nilai_brix || 0);

            let isLolosWilayah = true;
            if (selectedBlok !== 'all') isLolosWilayah = (idBlokTitik === String(selectedBlok));
            else if (selectedLahan !== 'all') isLolosWilayah = validBlokIds.includes(idBlokTitik);

            let isLolosBrix = true;
            if (brixFilter === 'rendah') isLolosBrix = brix < 15;
            else if (brixFilter === 'sedang') isLolosBrix = brix >= 15 && brix <= 19;
            else if (brixFilter === 'tinggi') isLolosBrix = brix > 19;

            return isLolosWilayah && isLolosBrix;
        }).length;
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 flex flex-col overflow-hidden relative">
            
            {/* TOP BAR: Precision Telemetry Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">
                                Peta Spasial & Interpolasi Kriging
                            </h3>
                            <span className="font-mono text-[10px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full font-bold">
                                {hitungTitikAktif()} TITIK TERPETA
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                            Layer Citra Satelit Resolusi Tinggi dengan batas poligon perkebunan tebu
                        </p>
                    </div>
                </div>

                {/* Loading Status & Quick Map Tools */}
                <div className="flex items-center gap-2">
                    {isLoadingEBK && (
                        <div className="text-xs font-mono text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-2 shadow-sm animate-pulse">
                            <svg className="animate-spin w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Komputasi Interpolasi Kriging GEE...</span>
                        </div>
                    )}
                </div>
            </div>

            {/* INTEGRATED PRECISION FILTER TOOLBAR */}
            <div className="p-4 bg-white border-b border-slate-100 flex flex-wrap items-end gap-3.5">
                
                {/* Lahan Induk */}
                <div className="flex-1 min-w-[200px]">
                    <label className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider font-bold text-slate-500 mb-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        Lahan Induk (Estate)
                    </label>
                    <select 
                        value={selectedLahan} 
                        onChange={(e) => { setSelectedLahan(e.target.value); setSelectedBlok('all'); }} 
                        className="w-full h-10 px-3 text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 hover:bg-white transition-all cursor-pointer"
                    >
                        <option value="all">🌐 Seluruh Wilayah Perkebunan</option>
                        {Array.isArray(lahanData) && lahanData.map(l => (
                            <option key={l.properties?.id_lahan || l.id_lahan} value={l.properties?.id_lahan || l.id_lahan}>
                                {l.properties?.nama_lahan || l.nama_lahan}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Petak Lahan */}
                <div className="flex-1 min-w-[200px]">
                    <label className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider font-bold text-slate-500 mb-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Petak / Blok Terpetakan
                    </label>
                    <select 
                        value={selectedBlok} 
                        onChange={(e) => setSelectedBlok(e.target.value)} 
                        className="w-full h-10 px-3 text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 hover:bg-white transition-all cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                        disabled={selectedLahan === 'all' && (blokData || []).length === 0}
                    >
                        <option value="all">📍 Seluruh Petak Lahan</option>
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

                {/* Filter Nilai Brix */}
                <div className="flex-1 min-w-[200px]">
                    <label className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider font-bold text-slate-500 mb-1.5">
                        <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                        Filter Ambang Kemasakan (°Bx)
                    </label>
                    <select 
                        value={brixFilter} 
                        onChange={(e) => setBrixFilter(e.target.value)} 
                        className="w-full h-10 px-3 text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 hover:bg-white transition-all cursor-pointer"
                    >
                        <option value="all">Semua Nilai Brix (Lengkap)</option>
                        <option value="rendah">🌱 Rendah (&lt; 15.0° - Muda)</option>
                        <option value="sedang">🌾 Sedang (15.0° - 19.0° - Menjelang Panen)</option>
                        <option value="tinggi">⚡ Tinggi (&gt; 19.0° - Siap Tebang)</option>
                    </select>
                </div>

                {/* Tombol Reset Filter */}
                <div>
                    <button 
                        onClick={() => { setSelectedLahan('all'); setSelectedBlok('all'); setBrixFilter('all'); }} 
                        className="h-10 px-4 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-mono font-bold text-xs rounded-xl border border-slate-200 hover:border-rose-200 transition-colors flex items-center gap-2 shadow-sm"
                        title="Reset seluruh filter"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Reset
                    </button>
                </div>

            </div>

            {/* MAP CANVAS VIEWPORT */}
            <div className="relative w-full h-[560px] bg-slate-900 overflow-hidden">
                <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
                
                {/* FLOATING HUD CONTROLS (KIRI BAWAH) */}
                <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-2">
                    
                    {/* Toggle Marker Pins */}
                    <button 
                        onClick={() => setShowMarkers(!showMarkers)}
                        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-mono text-xs font-bold shadow-lg backdrop-blur-md transition-all border ${
                            showMarkers 
                            ? 'bg-white/95 text-slate-800 border-slate-200/80 hover:bg-white' 
                            : 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700'
                        }`}
                    >
                        {showMarkers ? (
                            <>
                                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>Titik Sensor: Ditampilkan</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                </svg>
                                <span>Titik Sensor: Tersembunyi</span>
                            </>
                        )}
                    </button>

                </div>

                {/* FLOATING BRIX SPECTRUM HUD (KANAN BAWAH) */}
                <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-slate-200/90 min-w-[260px] z-10 select-none">
                    
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                        <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-500">
                            Spektrum Kemasakan Tebu
                        </span>
                        <span className="text-[9px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                            STANDAR °Bx
                        </span>
                    </div>

                    {/* Gradient Bar Visual */}
                    <div className="mb-3">
                        <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 shadow-inner" />
                        <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-1 font-semibold">
                            <span>&lt; 15°</span>
                            <span>15° - 19°</span>
                            <span>&gt; 19°</span>
                        </div>
                    </div>

                    {/* Interactive Filter Pills */}
                    <div className="space-y-1.5 text-xs">
                        <button
                            type="button"
                            onClick={() => setBrixFilter(brixFilter === 'rendah' ? 'all' : 'rendah')}
                            className={`w-full flex items-center justify-between p-1.5 px-2 rounded-lg transition-all text-left ${
                                brixFilter === 'rendah' ? 'bg-emerald-100/80 font-bold' : 'hover:bg-slate-50'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-sm"></span>
                                <span className="text-slate-700 text-xs font-medium">Vegetatif / Muda</span>
                            </div>
                            <span className="font-mono text-[10px] text-slate-500">&lt; 15.0°</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setBrixFilter(brixFilter === 'sedang' ? 'all' : 'sedang')}
                            className={`w-full flex items-center justify-between p-1.5 px-2 rounded-lg transition-all text-left ${
                                brixFilter === 'sedang' ? 'bg-amber-100/80 font-bold' : 'hover:bg-slate-50'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shadow-sm"></span>
                                <span className="text-slate-700 text-xs font-medium">Transisi Menjelang Panen</span>
                            </div>
                            <span className="font-mono text-[10px] text-slate-500">15.0° - 19.0°</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setBrixFilter(brixFilter === 'tinggi' ? 'all' : 'tinggi')}
                            className={`w-full flex items-center justify-between p-1.5 px-2 rounded-lg transition-all text-left ${
                                brixFilter === 'tinggi' ? 'bg-rose-100/80 font-bold' : 'hover:bg-slate-50'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] shadow-sm"></span>
                                <span className="text-slate-700 text-xs font-medium">Optimum Siap Tebang</span>
                            </div>
                            <span className="font-mono text-[10px] text-slate-500">&gt; 19.0°</span>
                        </button>
                    </div>

                </div>

            </div>

        </div>
    );
};

export default DashboardMap;