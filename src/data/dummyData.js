// Data dummy realistis untuk simulasi visual E-BRIX ketika backend belum terhubung
// Terletak di koordinat perkebunan tebu Jatitujuh / Majalengka / Cirebon [108.2386, -6.6135]

export const DUMMY_LAHAN = [
  {
    type: 'Feature',
    id_lahan: '1',
    nama_lahan: 'Perkebunan Jatitujuh Utama',
    properties: {
      id_lahan: '1',
      nama_lahan: 'Perkebunan Jatitujuh Utama',
      luas_hektar: 42.5
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [108.2339, -6.5912],
        [108.2449, -6.5912],
        [108.2449, -6.6002],
        [108.2339, -6.6002],
        [108.2339, -6.5912]
      ]]
    }
  },
  {
    type: 'Feature',
    id_lahan: '2',
    nama_lahan: 'Perkebunan Palimanan Barat',
    properties: {
      id_lahan: '2',
      nama_lahan: 'Perkebunan Palimanan Barat',
      luas_hektar: 28.3
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [108.2389, -6.6005],
        [108.2464, -6.6005],
        [108.2464, -6.6067],
        [108.2389, -6.6067],
        [108.2389, -6.6005]
      ]]
    }
  }
];

export const DUMMY_BLOK = [
  {
    type: 'Feature',
    id_blok: '101',
    id_lahan: '1',
    nama_blok: 'Blok A-01',
    properties: {
      id_blok: '101',
      id_lahan: '1',
      nama_blok: 'Blok A-01',
      varietas_utama: 'Bululawang (BL)'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [108.2349, -6.5922],
        [108.2392, -6.5922],
        [108.2392, -6.5955],
        [108.2349, -6.5955],
        [108.2349, -6.5922]
      ]]
    }
  },
  {
    type: 'Feature',
    id_blok: '102',
    id_lahan: '1',
    nama_blok: 'Blok A-02',
    properties: {
      id_blok: '102',
      id_lahan: '1',
      nama_blok: 'Blok A-02',
      varietas_utama: 'PS 881'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [108.2396, -6.5922],
        [108.2442, -6.5922],
        [108.2442, -6.5955],
        [108.2396, -6.5955],
        [108.2396, -6.5922]
      ]]
    }
  },
  {
    type: 'Feature',
    id_blok: '103',
    id_lahan: '1',
    nama_blok: 'Blok B-01',
    properties: {
      id_blok: '103',
      id_lahan: '1',
      nama_blok: 'Blok B-01',
      varietas_utama: 'Kidang Kencana'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [108.2349, -6.5961],
        [108.2392, -6.5961],
        [108.2392, -6.5995],
        [108.2349, -6.5995],
        [108.2349, -6.5961]
      ]]
    }
  },
  {
    type: 'Feature',
    id_blok: '104',
    id_lahan: '2',
    nama_blok: 'Blok C-01',
    properties: {
      id_blok: '104',
      id_lahan: '2',
      nama_blok: 'Blok C-01',
      varietas_utama: 'PS 862'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [108.2396, -6.6012],
        [108.2456, -6.6012],
        [108.2456, -6.6052],
        [108.2396, -6.6052],
        [108.2396, -6.6012]
      ]]
    }
  }
];

export const DUMMY_SAMPEL = [
  // --- ZONA PERIMETER UTARA & BARAT: BRIX RENDAH (< 15° - VEGETATIF / MUDA) ---
  {
    type: 'Feature',
    id_titik: 'SMP-001',
    id_blok: '101',
    nilai_brix: 12.8,
    nama_petani: 'Ahmad Fauzi',
    jenis_tebu: 'Bululawang (BL)',
    metode_input: 'Otomatis',
    latitude: -6.5925,
    longitude: 108.2356,
    waktu_pengukuran: '2026-10-08T08:30:00Z',
    properties: { id_titik: 'SMP-001', id_blok: '101', nilai_brix: 12.8, nama_petani: 'Ahmad Fauzi', jenis_tebu: 'Bululawang (BL)', metode_input: 'Otomatis', created_at: '2026-10-08T08:30:00Z' },
    geometry: { type: 'Point', coordinates: [108.2356, -6.5925] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-002',
    id_blok: '101',
    nilai_brix: 13.5,
    nama_petani: 'Ahmad Fauzi',
    jenis_tebu: 'Bululawang (BL)',
    metode_input: 'Manual',
    latitude: -6.5929,
    longitude: 108.2370,
    waktu_pengukuran: '2026-10-08T09:15:00Z',
    properties: { id_titik: 'SMP-002', id_blok: '101', nilai_brix: 13.5, nama_petani: 'Ahmad Fauzi', jenis_tebu: 'Bululawang (BL)', metode_input: 'Manual', created_at: '2026-10-08T09:15:00Z' },
    geometry: { type: 'Point', coordinates: [108.2370, -6.5929] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-003',
    id_blok: '101',
    nilai_brix: 14.1,
    nama_petani: 'Hendra Wijaya',
    jenis_tebu: 'Bululawang (BL)',
    metode_input: 'Otomatis',
    latitude: -6.5933,
    longitude: 108.2360,
    waktu_pengukuran: '2026-10-09T08:00:00Z',
    properties: { id_titik: 'SMP-003', id_blok: '101', nilai_brix: 14.1, nama_petani: 'Hendra Wijaya', jenis_tebu: 'Bululawang (BL)', metode_input: 'Otomatis', created_at: '2026-10-09T08:00:00Z' },
    geometry: { type: 'Point', coordinates: [108.2360, -6.5933] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-004',
    id_blok: '102',
    nilai_brix: 13.9,
    nama_petani: 'Budi Santoso',
    jenis_tebu: 'PS 881',
    metode_input: 'Manual',
    latitude: -6.5927,
    longitude: 108.2429,
    waktu_pengukuran: '2026-10-09T08:45:00Z',
    properties: { id_titik: 'SMP-004', id_blok: '102', nilai_brix: 13.9, nama_petani: 'Budi Santoso', jenis_tebu: 'PS 881', metode_input: 'Manual', created_at: '2026-10-09T08:45:00Z' },
    geometry: { type: 'Point', coordinates: [108.2429, -6.5927] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-005',
    id_blok: '102',
    nilai_brix: 14.6,
    nama_petani: 'Budi Santoso',
    jenis_tebu: 'PS 881',
    metode_input: 'Otomatis',
    latitude: -6.5934,
    longitude: 108.2436,
    waktu_pengukuran: '2026-10-09T09:20:00Z',
    properties: { id_titik: 'SMP-005', id_blok: '102', nilai_brix: 14.6, nama_petani: 'Budi Santoso', jenis_tebu: 'PS 881', metode_input: 'Otomatis', created_at: '2026-10-09T09:20:00Z' },
    geometry: { type: 'Point', coordinates: [108.2436, -6.5934] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-006',
    id_blok: '103',
    nilai_brix: 13.2,
    nama_petani: 'Siti Rahma',
    jenis_tebu: 'Kidang Kencana',
    metode_input: 'Manual',
    latitude: -6.5989,
    longitude: 108.2359,
    waktu_pengukuran: '2026-10-09T10:00:00Z',
    properties: { id_titik: 'SMP-006', id_blok: '103', nilai_brix: 13.2, nama_petani: 'Siti Rahma', jenis_tebu: 'Kidang Kencana', metode_input: 'Manual', created_at: '2026-10-09T10:00:00Z' },
    geometry: { type: 'Point', coordinates: [108.2359, -6.5989] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-007',
    id_blok: '103',
    nilai_brix: 14.4,
    nama_petani: 'Hendra Wijaya',
    jenis_tebu: 'Kidang Kencana',
    metode_input: 'Otomatis',
    latitude: -6.5987,
    longitude: 108.2386,
    waktu_pengukuran: '2026-10-09T10:30:00Z',
    properties: { id_titik: 'SMP-007', id_blok: '103', nilai_brix: 14.4, nama_petani: 'Hendra Wijaya', jenis_tebu: 'Kidang Kencana', metode_input: 'Otomatis', created_at: '2026-10-09T10:30:00Z' },
    geometry: { type: 'Point', coordinates: [108.2386, -6.5987] }
  },

  // --- ZONA TRANSISI: BRIX SEDANG (15.0° - 19.0° - ORANYE / AMBER) ---
  {
    type: 'Feature',
    id_titik: 'SMP-008',
    id_blok: '101',
    nilai_brix: 16.2,
    nama_petani: 'Ahmad Fauzi',
    jenis_tebu: 'Bululawang (BL)',
    metode_input: 'Otomatis',
    latitude: -6.5939,
    longitude: 108.2379,
    waktu_pengukuran: '2026-10-10T08:10:00Z',
    properties: { id_titik: 'SMP-008', id_blok: '101', nilai_brix: 16.2, nama_petani: 'Ahmad Fauzi', jenis_tebu: 'Bululawang (BL)', metode_input: 'Otomatis', created_at: '2026-10-10T08:10:00Z' },
    geometry: { type: 'Point', coordinates: [108.2379, -6.5939] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-009',
    id_blok: '101',
    nilai_brix: 17.4,
    nama_petani: 'Ahmad Fauzi',
    jenis_tebu: 'Bululawang (BL)',
    metode_input: 'Manual',
    latitude: -6.5947,
    longitude: 108.2386,
    waktu_pengukuran: '2026-10-10T08:45:00Z',
    properties: { id_titik: 'SMP-009', id_blok: '101', nilai_brix: 17.4, nama_petani: 'Ahmad Fauzi', jenis_tebu: 'Bululawang (BL)', metode_input: 'Manual', created_at: '2026-10-10T08:45:00Z' },
    geometry: { type: 'Point', coordinates: [108.2386, -6.5947] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-010',
    id_blok: '102',
    nilai_brix: 16.8,
    nama_petani: 'Budi Santoso',
    jenis_tebu: 'PS 881',
    metode_input: 'Otomatis',
    latitude: -6.5935,
    longitude: 108.2404,
    waktu_pengukuran: '2026-10-10T09:15:00Z',
    properties: { id_titik: 'SMP-010', id_blok: '102', nilai_brix: 16.8, nama_petani: 'Budi Santoso', jenis_tebu: 'PS 881', metode_input: 'Otomatis', created_at: '2026-10-10T09:15:00Z' },
    geometry: { type: 'Point', coordinates: [108.2404, -6.5935] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-011',
    id_blok: '102',
    nilai_brix: 18.2,
    nama_petani: 'Budi Santoso',
    jenis_tebu: 'PS 881',
    metode_input: 'Manual',
    latitude: -6.5939,
    longitude: 108.2416,
    waktu_pengukuran: '2026-10-10T09:50:00Z',
    properties: { id_titik: 'SMP-011', id_blok: '102', nilai_brix: 18.2, nama_petani: 'Budi Santoso', jenis_tebu: 'PS 881', metode_input: 'Manual', created_at: '2026-10-10T09:50:00Z' },
    geometry: { type: 'Point', coordinates: [108.2416, -6.5939] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-012',
    id_blok: '103',
    nilai_brix: 16.5,
    nama_petani: 'Hendra Wijaya',
    jenis_tebu: 'Kidang Kencana',
    metode_input: 'Otomatis',
    latitude: -6.5967,
    longitude: 108.2366,
    waktu_pengukuran: '2026-10-10T10:15:00Z',
    properties: { id_titik: 'SMP-012', id_blok: '103', nilai_brix: 16.5, nama_petani: 'Hendra Wijaya', jenis_tebu: 'Kidang Kencana', metode_input: 'Otomatis', created_at: '2026-10-10T10:15:00Z' },
    geometry: { type: 'Point', coordinates: [108.2366, -6.5967] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-013',
    id_blok: '103',
    nilai_brix: 17.8,
    nama_petani: 'Hendra Wijaya',
    jenis_tebu: 'Kidang Kencana',
    metode_input: 'Manual',
    latitude: -6.5975,
    longitude: 108.2382,
    waktu_pengukuran: '2026-10-10T11:00:00Z',
    properties: { id_titik: 'SMP-013', id_blok: '103', nilai_brix: 17.8, nama_petani: 'Hendra Wijaya', jenis_tebu: 'Kidang Kencana', metode_input: 'Manual', created_at: '2026-10-10T11:00:00Z' },
    geometry: { type: 'Point', coordinates: [108.2382, -6.5975] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-014',
    id_blok: '103',
    nilai_brix: 18.5,
    nama_petani: 'Siti Rahma',
    jenis_tebu: 'Kidang Kencana',
    metode_input: 'Otomatis',
    latitude: -6.5979,
    longitude: 108.2389,
    waktu_pengukuran: '2026-10-10T11:45:00Z',
    properties: { id_titik: 'SMP-014', id_blok: '103', nilai_brix: 18.5, nama_petani: 'Siti Rahma', jenis_tebu: 'Kidang Kencana', metode_input: 'Otomatis', created_at: '2026-10-10T11:45:00Z' },
    geometry: { type: 'Point', coordinates: [108.2389, -6.5979] }
  },

  // --- ZONA INTI MATANG (HOTSPOT): BRIX TINGGI (> 19.0° - MERAH SIAP PANEN) ---
  {
    type: 'Feature',
    id_titik: 'SMP-015',
    id_blok: '101',
    nilai_brix: 19.6,
    nama_petani: 'Ahmad Fauzi',
    jenis_tebu: 'Bululawang (BL)',
    metode_input: 'Otomatis',
    latitude: -6.5952,
    longitude: 108.2388,
    waktu_pengukuran: '2026-10-11T08:00:00Z',
    properties: { id_titik: 'SMP-015', id_blok: '101', nilai_brix: 19.6, nama_petani: 'Ahmad Fauzi', jenis_tebu: 'Bululawang (BL)', metode_input: 'Otomatis', created_at: '2026-10-11T08:00:00Z' },
    geometry: { type: 'Point', coordinates: [108.2388, -6.5952] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-016',
    id_blok: '102',
    nilai_brix: 20.8,
    nama_petani: 'Budi Santoso',
    jenis_tebu: 'PS 881',
    metode_input: 'Otomatis',
    latitude: -6.5945,
    longitude: 108.2400,
    waktu_pengukuran: '2026-10-11T08:30:00Z',
    properties: { id_titik: 'SMP-016', id_blok: '102', nilai_brix: 20.8, nama_petani: 'Budi Santoso', jenis_tebu: 'PS 881', metode_input: 'Otomatis', created_at: '2026-10-11T08:30:00Z' },
    geometry: { type: 'Point', coordinates: [108.2400, -6.5945] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-017',
    id_blok: '102',
    nilai_brix: 21.5,
    nama_petani: 'Budi Santoso',
    jenis_tebu: 'PS 881',
    metode_input: 'Manual',
    latitude: -6.5949,
    longitude: 108.2408,
    waktu_pengukuran: '2026-10-11T09:00:00Z',
    properties: { id_titik: 'SMP-017', id_blok: '102', nilai_brix: 21.5, nama_petani: 'Budi Santoso', jenis_tebu: 'PS 881', metode_input: 'Manual', created_at: '2026-10-11T09:00:00Z' },
    geometry: { type: 'Point', coordinates: [108.2408, -6.5949] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-018',
    id_blok: '102',
    nilai_brix: 21.8,
    nama_petani: 'Siti Rahma',
    jenis_tebu: 'PS 881',
    metode_input: 'Otomatis',
    latitude: -6.5953,
    longitude: 108.2419,
    waktu_pengukuran: '2026-10-11T09:30:00Z',
    properties: { id_titik: 'SMP-018', id_blok: '102', nilai_brix: 21.8, nama_petani: 'Siti Rahma', jenis_tebu: 'PS 881', metode_input: 'Otomatis', created_at: '2026-10-11T09:30:00Z' },
    geometry: { type: 'Point', coordinates: [108.2419, -6.5953] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-019',
    id_blok: '102',
    nilai_brix: 20.2,
    nama_petani: 'Budi Santoso',
    jenis_tebu: 'PS 881',
    metode_input: 'Manual',
    latitude: -6.5943,
    longitude: 108.2424,
    waktu_pengukuran: '2026-10-11T10:00:00Z',
    properties: { id_titik: 'SMP-019', id_blok: '102', nilai_brix: 20.2, nama_petani: 'Budi Santoso', jenis_tebu: 'PS 881', metode_input: 'Manual', created_at: '2026-10-11T10:00:00Z' },
    geometry: { type: 'Point', coordinates: [108.2424, -6.5943] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-020',
    id_blok: '103',
    nilai_brix: 20.5,
    nama_petani: 'Hendra Wijaya',
    jenis_tebu: 'Kidang Kencana',
    metode_input: 'Otomatis',
    latitude: -6.5963,
    longitude: 108.2386,
    waktu_pengukuran: '2026-10-11T10:30:00Z',
    properties: { id_titik: 'SMP-020', id_blok: '103', nilai_brix: 20.5, nama_petani: 'Hendra Wijaya', jenis_tebu: 'Kidang Kencana', metode_input: 'Otomatis', created_at: '2026-10-11T10:30:00Z' },
    geometry: { type: 'Point', coordinates: [108.2386, -6.5963] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-021',
    id_blok: '103',
    nilai_brix: 19.9,
    nama_petani: 'Hendra Wijaya',
    jenis_tebu: 'Kidang Kencana',
    metode_input: 'Manual',
    latitude: -6.5969,
    longitude: 108.2390,
    waktu_pengukuran: '2026-10-11T11:15:00Z',
    properties: { id_titik: 'SMP-021', id_blok: '103', nilai_brix: 19.9, nama_petani: 'Hendra Wijaya', jenis_tebu: 'Kidang Kencana', metode_input: 'Manual', created_at: '2026-10-11T11:15:00Z' },
    geometry: { type: 'Point', coordinates: [108.2390, -6.5969] }
  },

  // --- LAHAN 2: BLOK C-01 ---
  {
    type: 'Feature',
    id_titik: 'SMP-022',
    id_blok: '104',
    nilai_brix: 13.8,
    nama_petani: 'Ahmad Fauzi',
    jenis_tebu: 'PS 862',
    metode_input: 'Manual',
    latitude: -6.6025,
    longitude: 108.2416,
    waktu_pengukuran: '2026-10-11T13:40:00Z',
    properties: { id_titik: 'SMP-022', id_blok: '104', nilai_brix: 13.8, nama_petani: 'Ahmad Fauzi', jenis_tebu: 'PS 862', metode_input: 'Manual', created_at: '2026-10-11T13:40:00Z' },
    geometry: { type: 'Point', coordinates: [108.2416, -6.6025] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-023',
    id_blok: '104',
    nilai_brix: 16.9,
    nama_petani: 'Siti Rahma',
    jenis_tebu: 'PS 862',
    metode_input: 'Otomatis',
    latitude: -6.6039,
    longitude: 108.2439,
    waktu_pengukuran: '2026-10-12T07:15:00Z',
    properties: { id_titik: 'SMP-023', id_blok: '104', nilai_brix: 16.9, nama_petani: 'Siti Rahma', jenis_tebu: 'PS 862', metode_input: 'Otomatis', created_at: '2026-10-12T07:15:00Z' },
    geometry: { type: 'Point', coordinates: [108.2439, -6.6039] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-024',
    id_blok: '104',
    nilai_brix: 19.4,
    nama_petani: 'Siti Rahma',
    jenis_tebu: 'PS 862',
    metode_input: 'Otomatis',
    latitude: -6.6031,
    longitude: 108.2429,
    waktu_pengukuran: '2026-10-12T08:00:00Z',
    properties: { id_titik: 'SMP-024', id_blok: '104', nilai_brix: 19.4, nama_petani: 'Siti Rahma', jenis_tebu: 'PS 862', metode_input: 'Otomatis', created_at: '2026-10-12T08:00:00Z' },
    geometry: { type: 'Point', coordinates: [108.2429, -6.6031] }
  }
];

export const DUMMY_PETANI = {
  pending: [
    {
      id_user: 'usr-p01',
      nama: 'Agus Pratama',
      email: 'agus.pratama@tebu.agro.id',
      nomor_telepon: '0812-3456-7890',
      alamat: 'Desa Jatitujuh Blok Cengkir RT 02/01'
    },
    {
      id_user: 'usr-p02',
      nama: 'Dedi Kurniawan',
      email: 'dedi.kurniawan@tebu.agro.id',
      nomor_telepon: '0821-9876-5432',
      alamat: 'Komplek Pabrik Gula Palimanan'
    }
  ],
  approved: [
    {
      id_user: 'usr-a01',
      nama: 'Ahmad Fauzi',
      email: 'ahmad.fauzi@kebun.id',
      nomor_telepon: '0813-4567-8912',
      alamat: 'Jl. Raya Jatitujuh KM 4'
    },
    {
      id_user: 'usr-a02',
      nama: 'Budi Santoso',
      email: 'budi.santoso@kebun.id',
      nomor_telepon: '0852-3456-7891',
      alamat: 'Perum Gula Asri No. 12'
    },
    {
      id_user: 'usr-a03',
      nama: 'Siti Rahma',
      email: 'siti.rahma@lab.id',
      nomor_telepon: '0812-8765-4321',
      alamat: 'Stasiun Riset Kemasakan Tebu'
    },
    {
      id_user: 'usr-a04',
      nama: 'Hendra Wijaya',
      email: 'hendra.w@lapangan.id',
      nomor_telepon: '0877-6543-2109',
      alamat: 'Desa Pilangsari RT 05/03'
    }
  ],
  inactive: [
    {
      id_user: 'usr-i01',
      nama: 'Joko Susilo',
      email: 'joko.alumni@agro.id',
      nomor_telepon: '0899-1234-5678',
      alamat: 'Majalengka Kulon'
    }
  ]
};
