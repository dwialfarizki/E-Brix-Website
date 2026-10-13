// Data dummy realistis untuk simulasi visual E-BRIX ketika backend belum terhubung
// Terletak di koordinat perkebunan tebu Jatitujuh / Majalengka / Cirebon [108.4312, -6.7111]

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
        [108.4265, -6.7075],
        [108.4375, -6.7075],
        [108.4375, -6.7165],
        [108.4265, -6.7165],
        [108.4265, -6.7075]
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
        [108.4315, -6.7168],
        [108.4390, -6.7168],
        [108.4390, -6.7230],
        [108.4315, -6.7230],
        [108.4315, -6.7168]
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
        [108.4275, -6.7085],
        [108.4318, -6.7085],
        [108.4318, -6.7118],
        [108.4275, -6.7118],
        [108.4275, -6.7085]
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
        [108.4322, -6.7085],
        [108.4368, -6.7085],
        [108.4368, -6.7118],
        [108.4322, -6.7118],
        [108.4322, -6.7085]
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
        [108.4275, -6.7124],
        [108.4318, -6.7124],
        [108.4318, -6.7158],
        [108.4275, -6.7158],
        [108.4275, -6.7124]
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
        [108.4322, -6.7175],
        [108.4382, -6.7175],
        [108.4382, -6.7215],
        [108.4322, -6.7215],
        [108.4322, -6.7175]
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
    latitude: -6.7088,
    longitude: 108.4282,
    waktu_pengukuran: '2026-10-08T08:30:00Z',
    properties: { id_titik: 'SMP-001', id_blok: '101', nilai_brix: 12.8, nama_petani: 'Ahmad Fauzi', jenis_tebu: 'Bululawang (BL)', metode_input: 'Otomatis', created_at: '2026-10-08T08:30:00Z' },
    geometry: { type: 'Point', coordinates: [108.4282, -6.7088] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-002',
    id_blok: '101',
    nilai_brix: 13.5,
    nama_petani: 'Ahmad Fauzi',
    jenis_tebu: 'Bululawang (BL)',
    metode_input: 'Manual',
    latitude: -6.7092,
    longitude: 108.4296,
    waktu_pengukuran: '2026-10-08T09:15:00Z',
    properties: { id_titik: 'SMP-002', id_blok: '101', nilai_brix: 13.5, nama_petani: 'Ahmad Fauzi', jenis_tebu: 'Bululawang (BL)', metode_input: 'Manual', created_at: '2026-10-08T09:15:00Z' },
    geometry: { type: 'Point', coordinates: [108.4296, -6.7092] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-003',
    id_blok: '101',
    nilai_brix: 14.1,
    nama_petani: 'Hendra Wijaya',
    jenis_tebu: 'Bululawang (BL)',
    metode_input: 'Otomatis',
    latitude: -6.7096,
    longitude: 108.4286,
    waktu_pengukuran: '2026-10-09T08:00:00Z',
    properties: { id_titik: 'SMP-003', id_blok: '101', nilai_brix: 14.1, nama_petani: 'Hendra Wijaya', jenis_tebu: 'Bululawang (BL)', metode_input: 'Otomatis', created_at: '2026-10-09T08:00:00Z' },
    geometry: { type: 'Point', coordinates: [108.4286, -6.7096] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-004',
    id_blok: '102',
    nilai_brix: 13.9,
    nama_petani: 'Budi Santoso',
    jenis_tebu: 'PS 881',
    metode_input: 'Manual',
    latitude: -6.7090,
    longitude: 108.4355,
    waktu_pengukuran: '2026-10-09T08:45:00Z',
    properties: { id_titik: 'SMP-004', id_blok: '102', nilai_brix: 13.9, nama_petani: 'Budi Santoso', jenis_tebu: 'PS 881', metode_input: 'Manual', created_at: '2026-10-09T08:45:00Z' },
    geometry: { type: 'Point', coordinates: [108.4355, -6.7090] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-005',
    id_blok: '102',
    nilai_brix: 14.6,
    nama_petani: 'Budi Santoso',
    jenis_tebu: 'PS 881',
    metode_input: 'Otomatis',
    latitude: -6.7097,
    longitude: 108.4362,
    waktu_pengukuran: '2026-10-09T09:20:00Z',
    properties: { id_titik: 'SMP-005', id_blok: '102', nilai_brix: 14.6, nama_petani: 'Budi Santoso', jenis_tebu: 'PS 881', metode_input: 'Otomatis', created_at: '2026-10-09T09:20:00Z' },
    geometry: { type: 'Point', coordinates: [108.4362, -6.7097] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-006',
    id_blok: '103',
    nilai_brix: 13.2,
    nama_petani: 'Siti Rahma',
    jenis_tebu: 'Kidang Kencana',
    metode_input: 'Manual',
    latitude: -6.7152,
    longitude: 108.4285,
    waktu_pengukuran: '2026-10-09T10:00:00Z',
    properties: { id_titik: 'SMP-006', id_blok: '103', nilai_brix: 13.2, nama_petani: 'Siti Rahma', jenis_tebu: 'Kidang Kencana', metode_input: 'Manual', created_at: '2026-10-09T10:00:00Z' },
    geometry: { type: 'Point', coordinates: [108.4285, -6.7152] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-007',
    id_blok: '103',
    nilai_brix: 14.4,
    nama_petani: 'Hendra Wijaya',
    jenis_tebu: 'Kidang Kencana',
    metode_input: 'Otomatis',
    latitude: -6.7150,
    longitude: 108.4312,
    waktu_pengukuran: '2026-10-09T10:30:00Z',
    properties: { id_titik: 'SMP-007', id_blok: '103', nilai_brix: 14.4, nama_petani: 'Hendra Wijaya', jenis_tebu: 'Kidang Kencana', metode_input: 'Otomatis', created_at: '2026-10-09T10:30:00Z' },
    geometry: { type: 'Point', coordinates: [108.4312, -6.7150] }
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
    latitude: -6.7102,
    longitude: 108.4305,
    waktu_pengukuran: '2026-10-10T08:10:00Z',
    properties: { id_titik: 'SMP-008', id_blok: '101', nilai_brix: 16.2, nama_petani: 'Ahmad Fauzi', jenis_tebu: 'Bululawang (BL)', metode_input: 'Otomatis', created_at: '2026-10-10T08:10:00Z' },
    geometry: { type: 'Point', coordinates: [108.4305, -6.7102] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-009',
    id_blok: '101',
    nilai_brix: 17.4,
    nama_petani: 'Ahmad Fauzi',
    jenis_tebu: 'Bululawang (BL)',
    metode_input: 'Manual',
    latitude: -6.7110,
    longitude: 108.4312,
    waktu_pengukuran: '2026-10-10T08:45:00Z',
    properties: { id_titik: 'SMP-009', id_blok: '101', nilai_brix: 17.4, nama_petani: 'Ahmad Fauzi', jenis_tebu: 'Bululawang (BL)', metode_input: 'Manual', created_at: '2026-10-10T08:45:00Z' },
    geometry: { type: 'Point', coordinates: [108.4312, -6.7110] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-010',
    id_blok: '102',
    nilai_brix: 16.8,
    nama_petani: 'Budi Santoso',
    jenis_tebu: 'PS 881',
    metode_input: 'Otomatis',
    latitude: -6.7098,
    longitude: 108.4330,
    waktu_pengukuran: '2026-10-10T09:15:00Z',
    properties: { id_titik: 'SMP-010', id_blok: '102', nilai_brix: 16.8, nama_petani: 'Budi Santoso', jenis_tebu: 'PS 881', metode_input: 'Otomatis', created_at: '2026-10-10T09:15:00Z' },
    geometry: { type: 'Point', coordinates: [108.4330, -6.7098] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-011',
    id_blok: '102',
    nilai_brix: 18.2,
    nama_petani: 'Budi Santoso',
    jenis_tebu: 'PS 881',
    metode_input: 'Manual',
    latitude: -6.7102,
    longitude: 108.4342,
    waktu_pengukuran: '2026-10-10T09:50:00Z',
    properties: { id_titik: 'SMP-011', id_blok: '102', nilai_brix: 18.2, nama_petani: 'Budi Santoso', jenis_tebu: 'PS 881', metode_input: 'Manual', created_at: '2026-10-10T09:50:00Z' },
    geometry: { type: 'Point', coordinates: [108.4342, -6.7102] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-012',
    id_blok: '103',
    nilai_brix: 16.5,
    nama_petani: 'Hendra Wijaya',
    jenis_tebu: 'Kidang Kencana',
    metode_input: 'Otomatis',
    latitude: -6.7130,
    longitude: 108.4292,
    waktu_pengukuran: '2026-10-10T10:15:00Z',
    properties: { id_titik: 'SMP-012', id_blok: '103', nilai_brix: 16.5, nama_petani: 'Hendra Wijaya', jenis_tebu: 'Kidang Kencana', metode_input: 'Otomatis', created_at: '2026-10-10T10:15:00Z' },
    geometry: { type: 'Point', coordinates: [108.4292, -6.7130] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-013',
    id_blok: '103',
    nilai_brix: 17.8,
    nama_petani: 'Hendra Wijaya',
    jenis_tebu: 'Kidang Kencana',
    metode_input: 'Manual',
    latitude: -6.7138,
    longitude: 108.4308,
    waktu_pengukuran: '2026-10-10T11:00:00Z',
    properties: { id_titik: 'SMP-013', id_blok: '103', nilai_brix: 17.8, nama_petani: 'Hendra Wijaya', jenis_tebu: 'Kidang Kencana', metode_input: 'Manual', created_at: '2026-10-10T11:00:00Z' },
    geometry: { type: 'Point', coordinates: [108.4308, -6.7138] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-014',
    id_blok: '103',
    nilai_brix: 18.5,
    nama_petani: 'Siti Rahma',
    jenis_tebu: 'Kidang Kencana',
    metode_input: 'Otomatis',
    latitude: -6.7142,
    longitude: 108.4315,
    waktu_pengukuran: '2026-10-10T11:45:00Z',
    properties: { id_titik: 'SMP-014', id_blok: '103', nilai_brix: 18.5, nama_petani: 'Siti Rahma', jenis_tebu: 'Kidang Kencana', metode_input: 'Otomatis', created_at: '2026-10-10T11:45:00Z' },
    geometry: { type: 'Point', coordinates: [108.4315, -6.7142] }
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
    latitude: -6.7115,
    longitude: 108.4314,
    waktu_pengukuran: '2026-10-11T08:00:00Z',
    properties: { id_titik: 'SMP-015', id_blok: '101', nilai_brix: 19.6, nama_petani: 'Ahmad Fauzi', jenis_tebu: 'Bululawang (BL)', metode_input: 'Otomatis', created_at: '2026-10-11T08:00:00Z' },
    geometry: { type: 'Point', coordinates: [108.4314, -6.7115] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-016',
    id_blok: '102',
    nilai_brix: 20.8,
    nama_petani: 'Budi Santoso',
    jenis_tebu: 'PS 881',
    metode_input: 'Otomatis',
    latitude: -6.7108,
    longitude: 108.4326,
    waktu_pengukuran: '2026-10-11T08:30:00Z',
    properties: { id_titik: 'SMP-016', id_blok: '102', nilai_brix: 20.8, nama_petani: 'Budi Santoso', jenis_tebu: 'PS 881', metode_input: 'Otomatis', created_at: '2026-10-11T08:30:00Z' },
    geometry: { type: 'Point', coordinates: [108.4326, -6.7108] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-017',
    id_blok: '102',
    nilai_brix: 21.5,
    nama_petani: 'Budi Santoso',
    jenis_tebu: 'PS 881',
    metode_input: 'Manual',
    latitude: -6.7112,
    longitude: 108.4334,
    waktu_pengukuran: '2026-10-11T09:00:00Z',
    properties: { id_titik: 'SMP-017', id_blok: '102', nilai_brix: 21.5, nama_petani: 'Budi Santoso', jenis_tebu: 'PS 881', metode_input: 'Manual', created_at: '2026-10-11T09:00:00Z' },
    geometry: { type: 'Point', coordinates: [108.4334, -6.7112] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-018',
    id_blok: '102',
    nilai_brix: 21.8,
    nama_petani: 'Siti Rahma',
    jenis_tebu: 'PS 881',
    metode_input: 'Otomatis',
    latitude: -6.7116,
    longitude: 108.4345,
    waktu_pengukuran: '2026-10-11T09:30:00Z',
    properties: { id_titik: 'SMP-018', id_blok: '102', nilai_brix: 21.8, nama_petani: 'Siti Rahma', jenis_tebu: 'PS 881', metode_input: 'Otomatis', created_at: '2026-10-11T09:30:00Z' },
    geometry: { type: 'Point', coordinates: [108.4345, -6.7116] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-019',
    id_blok: '102',
    nilai_brix: 20.2,
    nama_petani: 'Budi Santoso',
    jenis_tebu: 'PS 881',
    metode_input: 'Manual',
    latitude: -6.7106,
    longitude: 108.4350,
    waktu_pengukuran: '2026-10-11T10:00:00Z',
    properties: { id_titik: 'SMP-019', id_blok: '102', nilai_brix: 20.2, nama_petani: 'Budi Santoso', jenis_tebu: 'PS 881', metode_input: 'Manual', created_at: '2026-10-11T10:00:00Z' },
    geometry: { type: 'Point', coordinates: [108.4350, -6.7106] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-020',
    id_blok: '103',
    nilai_brix: 20.5,
    nama_petani: 'Hendra Wijaya',
    jenis_tebu: 'Kidang Kencana',
    metode_input: 'Otomatis',
    latitude: -6.7126,
    longitude: 108.4312,
    waktu_pengukuran: '2026-10-11T10:30:00Z',
    properties: { id_titik: 'SMP-020', id_blok: '103', nilai_brix: 20.5, nama_petani: 'Hendra Wijaya', jenis_tebu: 'Kidang Kencana', metode_input: 'Otomatis', created_at: '2026-10-11T10:30:00Z' },
    geometry: { type: 'Point', coordinates: [108.4312, -6.7126] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-021',
    id_blok: '103',
    nilai_brix: 19.9,
    nama_petani: 'Hendra Wijaya',
    jenis_tebu: 'Kidang Kencana',
    metode_input: 'Manual',
    latitude: -6.7132,
    longitude: 108.4316,
    waktu_pengukuran: '2026-10-11T11:15:00Z',
    properties: { id_titik: 'SMP-021', id_blok: '103', nilai_brix: 19.9, nama_petani: 'Hendra Wijaya', jenis_tebu: 'Kidang Kencana', metode_input: 'Manual', created_at: '2026-10-11T11:15:00Z' },
    geometry: { type: 'Point', coordinates: [108.4316, -6.7132] }
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
    latitude: -6.7188,
    longitude: 108.4342,
    waktu_pengukuran: '2026-10-11T13:40:00Z',
    properties: { id_titik: 'SMP-022', id_blok: '104', nilai_brix: 13.8, nama_petani: 'Ahmad Fauzi', jenis_tebu: 'PS 862', metode_input: 'Manual', created_at: '2026-10-11T13:40:00Z' },
    geometry: { type: 'Point', coordinates: [108.4342, -6.7188] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-023',
    id_blok: '104',
    nilai_brix: 16.9,
    nama_petani: 'Siti Rahma',
    jenis_tebu: 'PS 862',
    metode_input: 'Otomatis',
    latitude: -6.7202,
    longitude: 108.4365,
    waktu_pengukuran: '2026-10-12T07:15:00Z',
    properties: { id_titik: 'SMP-023', id_blok: '104', nilai_brix: 16.9, nama_petani: 'Siti Rahma', jenis_tebu: 'PS 862', metode_input: 'Otomatis', created_at: '2026-10-12T07:15:00Z' },
    geometry: { type: 'Point', coordinates: [108.4365, -6.7202] }
  },
  {
    type: 'Feature',
    id_titik: 'SMP-024',
    id_blok: '104',
    nilai_brix: 19.4,
    nama_petani: 'Siti Rahma',
    jenis_tebu: 'PS 862',
    metode_input: 'Otomatis',
    latitude: -6.7194,
    longitude: 108.4355,
    waktu_pengukuran: '2026-10-12T08:00:00Z',
    properties: { id_titik: 'SMP-024', id_blok: '104', nilai_brix: 19.4, nama_petani: 'Siti Rahma', jenis_tebu: 'PS 862', metode_input: 'Otomatis', created_at: '2026-10-12T08:00:00Z' },
    geometry: { type: 'Point', coordinates: [108.4355, -6.7194] }
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
