// Konfigurasi Terpusat Aplikasi E-BRIX
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://956qsggs-3000.asse.devtunnels.ms';
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiZS1icml4IiwiYSI6ImNtdWF1aDAwdzAwencyeG9wbWFiN3VzMmcifQ._ntI1xPhnqVQIcm-ZlMiHw';

// ML Engine terintegrasi ke backend utama
export const ML_API_BASE_URL = import.meta.env.VITE_ML_API_BASE_URL || API_BASE_URL;

// Basemap Citra Satelit Resolusi Tinggi (Esri World Imagery + Esri Reference Overlay)
// Bebas watermark "API Key Required" dan bebas kuota Mapbox
export const SATELLITE_MAP_STYLE = {
  version: 8,
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      maxzoom: 19
    },
    'esri-labels': {
      type: 'raster',
      tiles: [
        'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      maxzoom: 19
    }
  },
  layers: [
    {
      id: 'esri-satellite-layer',
      type: 'raster',
      source: 'esri-satellite',
      minzoom: 0,
      maxzoom: 22
    },
    {
      id: 'esri-labels-layer',
      type: 'raster',
      source: 'esri-labels',
      minzoom: 0,
      maxzoom: 22
    }
  ]
};
