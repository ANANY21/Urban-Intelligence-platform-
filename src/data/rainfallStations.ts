// 62 Chennai IMD & GCC Meteorological Stations from chennai_rainfall.csv
export const CHENNAI_RAINFALL_STATIONS = [
  'Adyar',
  'Alandur',
  'Ambathur',
  'Ambattur',
  'Anna Nagar',
  'Anna university',
  'Ayanavaram taluk office',
  'CD Hospital Tondiarpet',
  'Chennai AP',
  'Chennai collectorate building',
  'Chennai nungambakkam',
  'Chennai port trust',
  'DGP Office',
  'Ezhilgam',
  'Gov hr sec school MGR Nagar',
  'Govt. arts college',
  'Kodambakkam',
  'MYLAPORE-TRIPLICANE TALUK',
  'Madhavaram',
  'Manali',
  'Pachaiyappa college',
  'Perambur Corporation park',
  'Perungudi',
  'Purasawalkam - Perambur',
  'Puzhal',
  'Royapuram',
  'Sholinganallur',
  'Teynampet',
  'Thiru-Vi-Ka Nagar',
  'Thiruvottiyur',
  'Tondairpet',
  'Valasaravakkam',
  'Zone 01 Kathivakkam',
  'Zone 01 Thiruvottiyur',
  'Zone 02 D15 Manali',
  'Zone 02 Manali',
  'Zone 03 Madhavaram',
  'Zone 03 Puzhal',
  'Zone 04 Tondiarpet',
  'Zone 05 GCC',
  'Zone 05 Royapuram',
  'Zone 06 D65 Kolathur',
  'Zone 06 T.V.K Nagar',
  'Zone 07 Ambattur',
  'Zone 07 U18 D81 Vanagaram',
  'Zone 08 Anna Nagar',
  'Zone 08 Malar colony',
  'Zone 09 Ice House',
  'Zone 09 Teynampet',
  'Zone 10 Kodambakkam',
  'Zone 11 U32 Maduravoyal',
  'Zone 11 Valasaravakkam',
  'Zone 12 Alandhur',
  'Zone 12 D156 Mugalivakkam',
  'Zone 12 Meenambakkam',
  'Zone 13 Adyar',
  'Zone 13 Adyar Eco Park',
  'Zone 13 U39 Adyar',
  'Zone 14 Perungudi',
  'Zone 14 U41 Perungudi',
  'Zone 15 Sholinganallur',
  'Zone 15 Uthandi'
] as const;

export interface RainfallPreset {
  id: string;
  name: string;
  station: string;
  date: string;
  year: number;
  month: number;
  day: number;
  prev_day_rainfall: number;
  prev_7_day_avg: number;
  description: string;
}

export const RAINFALL_PRESETS: RainfallPreset[] = [
  {
    id: 'michaung_deluge',
    name: 'Cyclone Michaung Cloudburst (Dec 2023)',
    station: 'Chennai nungambakkam',
    date: '2023-12-04',
    year: 2023,
    month: 12,
    day: 4,
    prev_day_rainfall: 142.5,
    prev_7_day_avg: 48.6,
    description: 'Catastrophic cyclonic precipitation band stalling over the Chennai urban catchment basin.'
  },
  {
    id: 'nem_depression',
    name: 'Northeast Monsoon Active Depression (Nov)',
    station: 'Sholinganallur',
    date: '2023-11-15',
    year: 2023,
    month: 11,
    day: 15,
    prev_day_rainfall: 68.2,
    prev_7_day_avg: 34.1,
    description: 'Bay of Bengal low-pressure system bringing continuous maritime convective rainfall.'
  },
  {
    id: 'swm_thunderstorm',
    name: 'Southwest Monsoon Convective Shower (Aug)',
    station: 'Ambathur',
    date: '2023-08-20',
    year: 2023,
    month: 8,
    day: 20,
    prev_day_rainfall: 16.4,
    prev_7_day_avg: 9.8,
    description: 'Late afternoon inland thermal convective thunderstorm over western industrial zones.'
  },
  {
    id: 'dry_summer',
    name: 'Dry Pre-Monsoon Baseline (April)',
    station: 'Zone 12 Meenambakkam',
    date: '2023-04-18',
    year: 2023,
    month: 4,
    day: 18,
    prev_day_rainfall: 0.0,
    prev_7_day_avg: 0.2,
    description: 'Hot summer dry spell with minimal maritime humidity convergence.'
  }
];
