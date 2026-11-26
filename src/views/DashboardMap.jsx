import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import MapPopup from '../components/MapPopup';
import mapboxgl from 'mapbox-gl';
import axios from 'axios';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ML_API_BASE_URL, MAPBOX_TOKEN, SATELLITE_MAP_STYLE } from '../config';

mapboxgl.accessToken = MAPBOX_TOKEN;

const DashboardMap = ({ 
    selectedLahan, setSelectedLahan, 
    selectedBlok, setSelectedBlok,
    brixFilter, setBrixFilter,
    sampelData, blokData, lahanData, onDeletePoin,
    spatialMethod: externalSpatialMethod,
    setSpatialMethod: setExternalSpatialMethod,
    spatialInfo: externalSpatialInfo,
    setSpatialInfo: setExternalSpatialInfo
}) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const markersRef = useRef([]); 
    const hoverPopupRef = useRef(null); 
    const initialFlyDone = useRef(false);

    const [isLoadingEBK, setIsLoadingEBK] = useState(false);
    const [isMapReady, setIsMapReady] = useState(false);
    const [showMarkers, setShowMarkers] = useState(true);
    const [showHeatmap, setShowHeatmap] = useState(true);
    const [localSpatialMethod, setLocalSpatialMethod] = useState('hybrid_rk');
    const [localSpatialInfo, setLocalSpatialInfo] = useState(null);
    const spatialMethod = externalSpatialMethod ?? localSpatialMethod;
    const setSpatialMethod = setExternalSpatialMethod ?? setLocalSpatialMethod;
    const spatialInfo = externalSpatialInfo !== undefined ? externalSpatialInfo : localSpatialInfo;
    const setSpatialInfo = setExternalSpatialInfo ?? setLocalSpatialInfo;
    const [isSpatialPanelOpen, setIsSpatialPanelOpen] = useState(true);
    const krigingHasGridRef = useRef(false);
    const spatialRequestRef = useRef(0);

    // Auto-resize Mapbox when container size changes
    useEffect(() => {
        if (!mapContainer.current) return;
        const observer = new ResizeObserver(() => {
            map.current?.resize();
        });
        observer.observe(mapContainer.current);
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
            style: SATELLITE_MAP_STYLE,
            center: [108.2386, -6.5948], 
            zoom: 15,
            attributionControl: false
        });

        // Add standard navigation controls with clean styling
        map.current.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right');

        map.current.on('load', () => {
            // 1. Source Poligon Blok
            map.current.addSource('blok-source', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });

            // Base fill hijau perkebunan (seperti referensi visual)
            map.current.addLayer({
                id: 'blok-layer',
                type: 'fill',
                source: 'blok-source',
                paint: { 
                    'fill-color': '#16a34a',   
                    'fill-opacity': 0.35       
                } 
            });

            // 2. Source Heatmap Kemasakan Kontinu
            map.current.addSource('sampel-heatmap-source', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });

            // Layer Heatmap Kontinu (Kemasakan Hijau -> Kuning -> Oranye -> Merah)
            map.current.addLayer({
                id: 'sampel-heatmap-layer',
                type: 'heatmap',
                source: 'sampel-heatmap-source',
                maxzoom: 19,
                paint: {
                    // Bobot pengaruh kemasakan berdasarkan nilai Brix
                    'heatmap-weight': [
                        'interpolate',
                        ['linear'],
                        ['get', 'nilai_brix'],
                        10, 0.1,
                        14, 0.35,
                        17, 0.65,
                        19.5, 0.9,
                        22, 1.0
                    ],
                    // Intensitas kemasakan terhadap tingkat zoom
                    'heatmap-intensity': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        11, 0.8,
                        13, 1.25,
                        15, 1.85,
                        17, 2.5
                    ],
                    // Spektrum Kemasakan Tebu:
                    // Hijau (Vegetatif / <15°) -> Lime -> Kuning -> Oranye (15°-19°) -> Merah Crimson (>19°)
                    'heatmap-color': [
                        'interpolate',
                        ['linear'],
                        ['heatmap-density'],
                        0, 'rgba(22, 163, 74, 0)',
                        0.15, 'rgba(22, 163, 74, 0.65)',
                        0.35, 'rgba(132, 204, 22, 0.75)',
                        0.55, 'rgba(234, 179, 8, 0.85)',
                        0.72, 'rgba(249, 115, 22, 0.92)',
                        0.90, 'rgba(239, 68, 68, 0.96)',
                        1.0, 'rgba(185, 28, 28, 1.0)'
                    ],
                    // Radius sebaran kemasakan
                    'heatmap-radius': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        11, 25,
                        13, 40,
                        15, 65,
                        17, 100
                    ],
                    'heatmap-opacity': 0.82
                }
            });

            // 2b. Grid Interpolasi Kriging / IDW dari Model Spasial (backend /ml/spatial/interpolate)
            map.current.addSource('kriging-grid-source', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });

            map.current.addLayer({
                id: 'kriging-grid-layer',
                type: 'fill',
                source: 'kriging-grid-source',
                paint: {
                    'fill-color': [
                        'interpolate', ['linear'], ['get', 'brix'],
                        12, '#16a34a',
                        14.5, '#84cc16',
                        16, '#eab308',
                        18, '#f97316',
                        19.5, '#ef4444',
                        22, '#b91c1c'
                    ],
                    'fill-opacity': 0.6,
                    'fill-antialias': false
                }
            });

            // 3. Garis Batas Petak Blok (Garis Biru Putus-Putus Sesuai Tampilan Sebelumnya)
            map.current.addLayer({
                id: 'blok-line-layer',
                type: 'line',
                source: 'blok-source',
                paint: {
                    'line-color': '#0284c7',   
                    'line-width': 2.4,
                    'line-dasharray': [3, 2]
                }
            });

            // 4. Source & Garis Batas Lahan Induk (Garis Oranye Pekat)
            map.current.addSource('lahan-source', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });

            map.current.addLayer({
                id: 'lahan-layer',
                type: 'line',
                source: 'lahan-source',
                paint: {
                    'line-color': '#ff7700', 
                    'line-width': 3.8
                }
            });

            // 5. Titik Anomali Spasial (Early Warning) hasil validasi Leave-One-Out model
            map.current.addSource('kriging-anomaly-source', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });

            map.current.addLayer({
                id: 'kriging-anomaly-layer',
                type: 'circle',
                source: 'kriging-anomaly-source',
                paint: {
                    'circle-radius': 11,
                    'circle-color': 'rgba(0,0,0,0)',
                    'circle-stroke-color': '#7c3aed',
                    'circle-stroke-width': 3
                }
            });

            map.current.on('mouseenter', 'kriging-anomaly-layer', () => {
                map.current.getCanvas().style.cursor = 'pointer';
            });

            map.current.on('mouseleave', 'kriging-anomaly-layer', () => {
                map.current.getCanvas().style.cursor = '';
            });

            map.current.on('click', 'kriging-anomaly-layer', (e) => {
                const p = e.features?.[0]?.properties;
                if (!p) return;
                const aktual = parseFloat(p.brix_aktual);
                const estimasi = parseFloat(p.brix_estimasi);
                const diff = !isNaN(aktual) && !isNaN(estimasi) ? (aktual - estimasi) : null;
                const diffStr = diff !== null ? `${diff >= 0 ? '+' : ''}${diff.toFixed(2)}°` : '-';
                const zVal = parseFloat(p.z_score);
                const isLow = !isNaN(zVal) && zVal < 0;

                new mapboxgl.Popup({ offset: 14, maxWidth: '300px', focusAfterOpen: false })
                    .setLngLat(e.lngLat)
                    .setHTML(`
                        <div style="padding:16px;font-family:var(--font-sans,sans-serif);color:#1e293b;min-width:255px;max-width:290px;">
                            <div style="display:flex;align-items:center;gap:8px;padding-right:26px;padding-bottom:10px;border-bottom:1px solid #f1f5f9;">
                                <div style="width:28px;height:28px;border-radius:8px;background:#f3e8ff;color:#7c3aed;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:800;font-size:14px;">!</div>
                                <div>
                                    <div style="font-size:9px;font-family:var(--font-mono,monospace);font-weight:700;letter-spacing:0.08em;color:#7c3aed;text-transform:uppercase;">Early Warning</div>
                                    <div style="font-size:13px;font-weight:800;color:#0f172a;line-height:1.2;">Anomali Spasial</div>
                                </div>
                            </div>

                            <div style="margin-top:10px;padding:8px 10px;border-radius:10px;background:${isLow ? '#faf5ff' : '#fffbeb'};border:1px solid ${isLow ? '#e9d5ff' : '#fde68a'};font-size:11px;line-height:1.45;color:${isLow ? '#581c87' : '#92400e'};font-weight:500;">
                                ${p.jenis}
                            </div>

                            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;">
                                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 10px;">
                                    <div style="font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">Brix Aktual</div>
                                    <div style="font-family:var(--font-mono,monospace);font-size:16px;font-weight:800;color:#7c3aed;margin-top:2px;">${p.brix_aktual}°<span style="font-size:10px;font-weight:600;color:#64748b;">Bx</span></div>
                                </div>
                                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 10px;">
                                    <div style="font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">Est. Sekitar</div>
                                    <div style="font-family:var(--font-mono,monospace);font-size:16px;font-weight:800;color:#0f172a;margin-top:2px;">${p.brix_estimasi}°<span style="font-size:10px;font-weight:600;color:#64748b;">Bx</span></div>
                                </div>
                            </div>

                            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;padding-top:8px;border-top:1px solid #f1f5f9;font-size:11px;">
                                <span style="color:#64748b;font-weight:500;">Deviasi: <b style="color:#0f172a;font-family:var(--font-mono,monospace);">${diffStr}</b></span>
                                <span style="font-family:var(--font-mono,monospace);font-size:10px;font-weight:700;padding:2px 8px;border-radius:9999px;background:#f3e8ff;color:#6d28d9;border:1px solid #ddd6fe;">Z = ${p.z_score} σ</span>
                            </div>
                        </div>
                    `)
                    .addTo(map.current);
            });

            // Posisikan layer nama tempat/daerah paling atas agar tidak tertutup heatmap & poligon
            if (map.current.getLayer('carto-labels-layer')) {
                map.current.moveLayer('carto-labels-layer');
            }

            hoverPopupRef.current = new mapboxgl.Popup({
                closeButton: false,
                closeOnClick: false,
                offset: 15,
                focusAfterOpen: false,
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
    // MODEL SPASIAL: INTERPOLASI KRIGING / IDW (backend /ml/spatial/interpolate)
    // ==========================================
    const setKrigingData = (grid, anomalies) => {
        const empty = { type: 'FeatureCollection', features: [] };
        map.current?.getSource('kriging-grid-source')?.setData(grid || empty);
        map.current?.getSource('kriging-anomaly-source')?.setData(anomalies || empty);
        krigingHasGridRef.current = !!(grid && grid.features && grid.features.length > 0);
    };

    const fetchSpatialInterpolation = async () => {
        if (!map.current || !isMapReady) return;

        const arrBlok = Array.isArray(blokData) ? blokData : [];
        const arrSampel = Array.isArray(sampelData) ? sampelData : [];
        const blokCocok = arrBlok.find(b => 
            String(b?.properties?.id_blok || b?.id_blok) === String(selectedBlok) ||
            String(b?.properties?.nama_blok || b?.nama_blok) === String(selectedBlok)
        );
        const idBlokTarget = blokCocok ? String(blokCocok?.properties?.id_blok || blokCocok?.id_blok) : String(selectedBlok);

        // Siapkan poligon blok & titik sampel aktif (digunakan backend sebagai fallback saat DB offline)
        let activeBloks = arrBlok;
        if (selectedBlok !== 'all') {
            activeBloks = arrBlok.filter(b => String(b?.properties?.id_blok || b?.id_blok) === idBlokTarget);
        } else if (selectedLahan !== 'all') {
            activeBloks = arrBlok.filter(b => String(b?.properties?.id_lahan || b?.id_lahan) === String(selectedLahan));
        }
        const activeBlokIds = activeBloks.map(b => String(b?.properties?.id_blok || b?.id_blok));

        const clientSamples = arrSampel
            .filter(titik => {
                const idBlokTitik = String(titik?.properties?.id_blok || titik?.id_blok || '');
                if (selectedBlok !== 'all') return idBlokTitik === idBlokTarget;
                if (selectedLahan !== 'all') return activeBlokIds.includes(idBlokTitik);
                return true;
            })
            .map((titik, idx) => ({
                id: String(titik?.properties?.id_data || titik?.id_data || titik?.id_titik || titik?.properties?.id_titik || idx),
                lon: parseFloat(titik?.longitude || titik?.lng || titik?.geometry?.coordinates?.[0]),
                lat: parseFloat(titik?.latitude || titik?.lat || titik?.geometry?.coordinates?.[1]),
                brix: parseFloat(titik?.nilai_brix || titik?.properties?.nilai_brix)
            }))
            .filter(s => !isNaN(s.lon) && !isNaN(s.lat) && !isNaN(s.brix));

        const clientPolygons = activeBloks
            .map(b => b?.geometry || b?.geojson)
            .filter(g => g && g.type);

        const requestId = ++spatialRequestRef.current;
        setIsLoadingEBK(true);
        try {
            let savedUser = {};
            try { savedUser = JSON.parse(localStorage.getItem('ebrix_user') || '{}'); } catch { savedUser = {}; }
            const token = localStorage.getItem('token') || savedUser?.token;
            const response = await axios.post(
                `${ML_API_BASE_URL}/ml/spatial/interpolate`,
                {
                    blokId: idBlokTarget,
                    lahanId: String(selectedLahan),
                    method: spatialMethod,
                    samples: clientSamples,
                    polygons: clientPolygons
                },
                {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                }
            );
            if (requestId !== spatialRequestRef.current) return; // abaikan respons usang
            const data = response.data || {};
            setKrigingData(data.grid, data.anomalies);
            setSpatialInfo(data.success ? data : null);
        } catch (error) {
            if (requestId !== spatialRequestRef.current) return;
            console.error("❌ [Spatial ML] Gagal memuat interpolasi Kriging:", error.message);
            setKrigingData(null, null);
            setSpatialInfo(null);
        } finally {
            if (requestId === spatialRequestRef.current) {
                setIsLoadingEBK(false);
                updateVectorData(); // segarkan fallback heatmap density
            }
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

            // Update Data Heatmap Kemasakan Kontinu
            if (map.current.getSource('sampel-heatmap-source')) {
                const heatmapFeatures = (showHeatmap && !krigingHasGridRef.current) ? sampelTampil.map(titik => {
                    const lng = parseFloat(titik?.longitude || titik?.lng || titik?.geometry?.coordinates?.[0]);
                    const lat = parseFloat(titik?.latitude || titik?.lat || titik?.geometry?.coordinates?.[1]);
                    const brix = parseFloat(titik?.nilai_brix || titik?.properties?.nilai_brix || 0);
                    return {
                        type: 'Feature',
                        properties: { nilai_brix: brix },
                        geometry: { type: 'Point', coordinates: [lng, lat] }
                    };
                }).filter(f => !isNaN(f.geometry.coordinates[0]) && !isNaN(f.geometry.coordinates[1])) : [];

                map.current.getSource('sampel-heatmap-source').setData({
                    type: 'FeatureCollection',
                    features: heatmapFeatures
                });
            }

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
                    let pinColor = '#10b981'; // Hijau (<15°)
                    if (brix > 19) pinColor = '#ef4444'; // Merah (>19°)
                    else if (brix >= 15 && brix <= 19) pinColor = '#f59e0b'; // Oranye (15°-19°)

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

                    const popup = new mapboxgl.Popup({ 
                        offset: 25,
                        focusAfterOpen: false,
                        autoPan: true,
                        autoPanPadding: { top: 80, bottom: 160, left: 60, right: 60 },
                        closeButton: true,
                        closeOnClick: true
                    }).setDOMContent(popupNode);

                    // Custom Teardrop Pin Marker dengan Lingkaran Putih di Tengah (Sesuai Referensi Gambar)
                    // PENTING: Gunakan wrapper terpisah agar style.transform Mapbox tidak ter-overwrite saat hover
                    const pinWrapper = document.createElement('div');
                    pinWrapper.className = 'ebrix-map-pin-container';

                    const pinInner = document.createElement('div');
                    pinInner.className = 'ebrix-map-pin-inner';
                    pinInner.style.cursor = 'pointer';
                    pinInner.style.transformOrigin = 'bottom center';
                    pinInner.style.transition = 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)';
                    pinInner.innerHTML = `
                        <svg width="26" height="34" viewBox="0 0 26 34" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.38)); display: block;">
                            <path d="M13 0C5.82 0 0 5.82 0 13C0 22.75 13 34 13 34C13 34 26 22.75 26 13C26 5.82 20.18 0 13 0Z" fill="${pinColor}"/>
                            <circle cx="13" cy="12.5" r="5" fill="#FFFFFF"/>
                        </svg>
                    `;
                    pinInner.onmouseenter = () => { pinInner.style.transform = 'scale(1.22) translateY(-4px)'; };
                    pinInner.onmouseleave = () => { pinInner.style.transform = 'scale(1) translateY(0)'; };

                    // Mencegah browser auto-scroll / jumping viewport saat pin diklik
                    pinInner.addEventListener('click', () => {
                        const mainElem = document.querySelector('main');
                        if (mainElem) {
                            const curScroll = mainElem.scrollTop;
                            requestAnimationFrame(() => {
                                if (mainElem.scrollTop !== curScroll) {
                                    mainElem.scrollTop = curScroll;
                                }
                            });
                        }
                    });

                    pinWrapper.appendChild(pinInner);

                    const marker = new mapboxgl.Marker({ element: pinWrapper, anchor: 'bottom' })
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
    }, [selectedLahan, selectedBlok, brixFilter, lahanData, blokData, sampelData, isMapReady, showMarkers, showHeatmap]);

    useEffect(() => {
        if (isMapReady) {
            fetchSpatialInterpolation();  
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedLahan, selectedBlok, lahanData, blokData, sampelData, isMapReady, spatialMethod]);

    // Toggle visibilitas layer model spasial mengikuti tombol "Gradien Kemasakan"
    useEffect(() => {
        if (!isMapReady || !map.current) return;
        const vis = showHeatmap ? 'visible' : 'none';
        ['kriging-grid-layer', 'kriging-anomaly-layer'].forEach(id => {
            if (map.current.getLayer(id)) map.current.setLayoutProperty(id, 'visibility', vis);
        });
    }, [showHeatmap, isMapReady]);

    return (
        <div className="bg-white p-4 rounded-xl shadow flex flex-col border border-gray-100 relative">
            
            {/* Header Sesuai Foto 2 */}
            <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-green-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                    </svg>
                    <span className="text-lg">Peta Estimasi Kematangan (Brix)</span>
                </h3>
                
                {isLoadingEBK && (
                    <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full animate-pulse border border-blue-200 flex items-center gap-1.5 font-medium">
                        <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Memproses Interpolasi Kriging...
                    </span>
                )}
            </div>
            
            {/* Peta Ukuran Proporsional & Nyaman */}
            <div className="relative w-full rounded-xl overflow-hidden border border-gray-200 shadow-inner h-[500px] lg:h-[550px] xl:h-[600px] min-h-[440px]">
                <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

                {/* 🌟 PANEL INFO MODEL SPASIAL (KIRI ATAS) */}
                {showHeatmap && spatialInfo?.summary && (
                    <div className="absolute top-4 left-4 z-10 w-[276px] bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-emerald-500/20 overflow-hidden select-none transition-all">
                        {/* Header Panel */}
                        <div className="px-3.5 py-2.5 bg-gradient-to-r from-slate-50 to-emerald-50/40 border-b border-slate-100 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                                    </svg>
                                </div>
                                <div className="min-w-0">
                                    <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-emerald-600 leading-none">
                                        Model Spasial Utama
                                    </div>
                                    <div className="text-[12.5px] font-extrabold text-slate-900 truncate mt-0.5" title={spatialInfo.method_label || ''}>
                                        {spatialInfo.method === 'hybrid_rk'
                                            ? 'Hybrid RF + Kriging'
                                            : spatialInfo.method === 'ked'
                                                ? 'Kriging External Drift'
                                                : spatialInfo.method === 'kriging'
                                                    ? 'Ordinary Kriging'
                                                    : 'IDW (Fallback)'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                                {spatialInfo.source === 'fallback_client' && (
                                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                                        Demo
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setIsSpatialPanelOpen(!isSpatialPanelOpen)}
                                    className="w-6 h-6 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
                                    title={isSpatialPanelOpen ? 'Sembunyikan detail' : 'Tampilkan detail'}
                                >
                                    <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isSpatialPanelOpen ? '' : '-rotate-90'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {isSpatialPanelOpen && (
                            <div className="p-3.5 space-y-3 text-xs">
                                {/* Pemilih 2 Algoritma Utama: Hybrid Regression-Kriging & KED */}
                                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/70">
                                    <button
                                        type="button"
                                        onClick={() => setSpatialMethod('hybrid_rk')}
                                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                            spatialMethod === 'hybrid_rk'
                                                ? 'bg-emerald-600 text-white shadow-sm'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                                        }`}
                                        title="Hybrid Regression-Kriging (Random Forest + Ordinary Kriging Residual)"
                                    >
                                        Hybrid RF+Kriging
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSpatialMethod('ked')}
                                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                            spatialMethod === 'ked'
                                                ? 'bg-emerald-600 text-white shadow-sm'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                                        }`}
                                        title="Kriging with External Drift (Gaussian Semivariogram + Drift)"
                                    >
                                        KED (Drift)
                                    </button>
                                </div>

                                {/* Estimasi Brix */}
                                <div className="flex items-end justify-between bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                                    <div>
                                        <div className="text-[10px] font-medium text-slate-500">Rata-rata Estimasi</div>
                                        <div className="font-mono text-lg font-extrabold text-slate-900 leading-tight mt-0.5">
                                            {spatialInfo.summary.brix_rata}°<span className="text-[11px] font-bold text-slate-400 ml-0.5">Bx</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-medium text-slate-500">Rentang Area</div>
                                        <div className="font-mono text-xs font-bold text-slate-700 mt-0.5">
                                            {spatialInfo.summary.brix_min}° – {spatialInfo.summary.brix_max}°
                                        </div>
                                    </div>
                                </div>

                                {/* Distribusi Zona + Progress Bar */}
                                <div>
                                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                                        <span>Sebaran Zona</span>
                                        <span className="font-mono font-medium text-slate-400 normal-case">
                                            grid {spatialInfo.summary.ukuran_sel_meter} m
                                        </span>
                                    </div>
                                    <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-100">
                                        {spatialInfo.summary.persen_zona.tinggi > 0 && (
                                            <div style={{ width: `${spatialInfo.summary.persen_zona.tinggi}%` }} className="bg-red-500 h-full" />
                                        )}
                                        {spatialInfo.summary.persen_zona.sedang > 0 && (
                                            <div style={{ width: `${spatialInfo.summary.persen_zona.sedang}%` }} className="bg-amber-400 h-full" />
                                        )}
                                        {spatialInfo.summary.persen_zona.rendah > 0 && (
                                            <div style={{ width: `${spatialInfo.summary.persen_zona.rendah}%` }} className="bg-emerald-500 h-full" />
                                        )}
                                    </div>
                                    <div className="grid grid-cols-3 gap-1 mt-1.5 text-[10px] font-medium">
                                        <div className="flex items-center gap-1 text-slate-700">
                                            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                                            <span>Tinggi <b className="font-mono">{spatialInfo.summary.persen_zona.tinggi}%</b></span>
                                        </div>
                                        <div className="flex items-center justify-center gap-1 text-slate-700">
                                            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                                            <span>Sedang <b className="font-mono">{spatialInfo.summary.persen_zona.sedang}%</b></span>
                                        </div>
                                        <div className="flex items-center justify-end gap-1 text-slate-700">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                            <span>Rendah <b className="font-mono">{spatialInfo.summary.persen_zona.rendah}%</b></span>
                                        </div>
                                    </div>
                                </div>

                                {/* Validasi Out-of-Sample & Komparasi 2 Algoritma Utama */}
                                {spatialInfo.validation ? (
                                    <div className="pt-2.5 border-t border-slate-100 space-y-2">
                                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                            <span>Validasi ({spatialInfo.validation.cv_mode || 'CV'})</span>
                                            <span className="font-mono font-semibold text-slate-400 normal-case">
                                                {spatialInfo.validation.n_sampel} titik sampel
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-xl px-2.5 py-1.5">
                                                <div className="text-[9px] font-bold text-emerald-700 uppercase tracking-wide">Akurasi</div>
                                                <div className="font-mono text-sm font-extrabold text-emerald-800">
                                                    {spatialInfo.validation.akurasi_persen}%
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5">
                                                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">MAE</div>
                                                <div className="font-mono text-sm font-extrabold text-slate-800">
                                                    ±{Number(spatialInfo.validation.mae).toFixed(2)}°
                                                </div>
                                            </div>
                                        </div>
                                        {spatialInfo.comparison?.hybrid_rk && spatialInfo.comparison?.ked && (
                                            <div className="flex items-center justify-between text-[10px] bg-slate-50/90 border border-slate-100 rounded-lg px-2.5 py-1.5 text-slate-600">
                                                <span>
                                                    RF+Krig: <b className="font-mono text-slate-900">{spatialInfo.comparison.hybrid_rk.akurasi_persen}%</b>
                                                </span>
                                                <span className="text-slate-300">|</span>
                                                <span>
                                                    KED: <b className="font-mono text-slate-900">{spatialInfo.comparison.ked.akurasi_persen}%</b>
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="pt-2 border-t border-slate-100 text-[11px] text-amber-700 bg-amber-50/70 border border-amber-200/70 rounded-lg px-2.5 py-1.5">
                                        Butuh ≥ 4 titik sampel untuk validasi silang
                                    </div>
                                )}

                                {/* Peringatan Anomali */}
                                {spatialInfo.summary.jumlah_anomali > 0 && (
                                    <div className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-violet-50 border border-violet-200/80">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="w-3 h-3 rounded-full border-[2.5px] border-violet-600 shrink-0" />
                                            <span className="text-[11px] font-bold text-violet-900 truncate">
                                                {spatialInfo.summary.jumlah_anomali} Titik Anomali
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-medium text-violet-600 shrink-0">
                                            Klik lingkar ungu
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
                
                {/* 🌟 TOMBOL TOGGLE (MENGAMBANG DI PETA KIRI BAWAH) */}
                <div className="absolute bottom-6 left-6 z-10 flex items-center gap-2">
                    <button 
                        type="button"
                        onClick={() => setShowMarkers(!showMarkers)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold text-xs shadow-md transition-colors border ${
                            showMarkers 
                            ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50' 
                            : 'bg-green-600 text-white border-green-700 hover:bg-green-700'
                        }`}
                        title="Tampilkan / sembunyikan titik pin marker"
                    >
                        <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>{showMarkers ? 'Titik Sensor: Tampil' : 'Titik Sensor: Sembunyi'}</span>
                    </button>

                    <button 
                        type="button"
                        onClick={() => setShowHeatmap(!showHeatmap)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold text-xs shadow-md transition-colors border ${
                            showHeatmap 
                            ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50' 
                            : 'bg-green-600 text-white border-green-700 hover:bg-green-700'
                        }`}
                        title="Tampilkan / sembunyikan gradien kemasakan"
                    >
                        <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                        </svg>
                        <span>{showHeatmap ? 'Gradien Kemasakan: Tampil' : 'Gradien Kemasakan: Sembunyi'}</span>
                    </button>
                </div>

                {/* 🌟 LEGENDA ESTIMASI KEMATANGAN BRIX (MENGAMBANG DI PETA KANAN BAWAH - PERSIS FOTO 2) */}
                <div className="absolute bottom-6 right-6 bg-white p-4 rounded-xl shadow-lg border border-gray-100 min-w-[210px] z-10 select-none">
                    <div className="font-bold mb-3 text-[#1e293b] text-sm">Estimasi Kematangan (Brix)</div>
                    <div className="flex flex-col gap-2.5">
                        <div className="flex items-center gap-2.5">
                            <div className="w-3.5 h-3.5 rounded-full bg-[#10b981] shrink-0 border border-green-700/20 shadow-sm"></div>
                            <span className="text-[#475569] text-xs font-medium">Rendah (&lt; 15.0°)</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className="w-3.5 h-3.5 rounded-full bg-[#f59e0b] shrink-0 border border-orange-700/20 shadow-sm"></div>
                            <span className="text-[#475569] text-xs font-medium">Sedang (15.0° - 19.0°)</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className="w-3.5 h-3.5 rounded-full bg-[#ef4444] shrink-0 border border-red-700/20 shadow-sm"></div>
                            <span className="text-[#475569] text-xs font-medium">Tinggi (&gt; 19.0°)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🌟 TOOLBAR FILTER (DI BAWAH PETA - SESUAI FOTO 2) */}
            <div className="mt-4 bg-[#f8fafc] p-4 rounded-xl border border-gray-200 flex flex-wrap items-end gap-4 shadow-sm shrink-0">
                
                {/* Lahan Induk */}
                <div className="flex-1 min-w-[200px]">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-orange-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
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

                {/* Petak Lahan */}
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

                {/* Filter Nilai Brix */}
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

                {/* Tombol Reset */}
                <div className="w-auto">
                    <button 
                        type="button"
                        onClick={() => { setSelectedLahan('all'); setSelectedBlok('all'); setBrixFilter('all'); }} 
                        className="px-5 py-2.5 bg-white text-gray-600 hover:bg-red-50 hover:text-red-600 font-bold text-sm rounded-lg border border-gray-300 hover:border-red-300 transition-colors flex items-center gap-2 shadow-sm"
                        title="Reset seluruh filter"
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