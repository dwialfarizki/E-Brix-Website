// Konfigurasi Terpusat Aplikasi E-BRIX
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiZS1icml4IiwiYSI6ImNtdWF1aDAwdzAwencyeG9wbWFiN3VzMmcifQ._ntI1xPhnqVQIcm-ZlMiHw';
// ML Engine terintegrasi ke backend utama — tidak perlu server terpisah
export const ML_API_BASE_URL = import.meta.env.VITE_ML_API_BASE_URL || API_BASE_URL;
