// Chennai Geographical Coordinates, Corridors, Waterways, and Hotspots

export const CHENNAI_CENTER: [number, number] = [13.0827, 80.2707];
export const CHENNAI_BOUNDS = {
  north: 13.25,
  south: 12.85,
  west: 80.05,
  east: 80.35,
};

export interface ChennaiZone {
  id: number;
  name: string;
  zoneNo: string;
  center: [number, number];
  riskLevel: 'safe' | 'low' | 'moderate' | 'high' | 'critical';
  rainfallMm: number;
  congestionIndex: number;
  population: string;
}

export const CHENNAI_ZONES: ChennaiZone[] = [
  { id: 1, name: 'Thiruvottiyur', zoneNo: 'Zone I', center: [13.1610, 80.3015], riskLevel: 'moderate', rainfallMm: 34.2, congestionIndex: 48, population: '250,000' },
  { id: 2, name: 'Manali', zoneNo: 'Zone II', center: [13.1667, 80.2667], riskLevel: 'high', rainfallMm: 46.5, congestionIndex: 55, population: '180,000' },
  { id: 3, name: 'Madhavaram', zoneNo: 'Zone III', center: [13.1488, 80.2306], riskLevel: 'low', rainfallMm: 22.0, congestionIndex: 42, population: '290,000' },
  { id: 4, name: 'Tondiarpet', zoneNo: 'Zone IV', center: [13.1250, 80.2889], riskLevel: 'moderate', rainfallMm: 31.8, congestionIndex: 64, population: '390,000' },
  { id: 5, name: 'Royapuram', zoneNo: 'Zone V', center: [13.1137, 80.2953], riskLevel: 'low', rainfallMm: 28.4, congestionIndex: 72, population: '410,000' },
  { id: 6, name: 'Thiru-Vi-Ka Nagar', zoneNo: 'Zone VI', center: [13.1119, 80.2425], riskLevel: 'high', rainfallMm: 52.1, congestionIndex: 68, population: '370,000' },
  { id: 7, name: 'Ambattur', zoneNo: 'Zone VII', center: [13.1143, 80.1548], riskLevel: 'moderate', rainfallMm: 38.0, congestionIndex: 58, population: '470,000' },
  { id: 8, name: 'Anna Nagar', zoneNo: 'Zone VIII', center: [13.0850, 80.2100], riskLevel: 'low', rainfallMm: 19.5, congestionIndex: 61, population: '340,000' },
  { id: 9, name: 'Teynampet / T. Nagar', zoneNo: 'Zone IX', center: [13.0418, 80.2441], riskLevel: 'moderate', rainfallMm: 41.2, congestionIndex: 82, population: '450,000' },
  { id: 10, name: 'Kodambakkam', zoneNo: 'Zone X', center: [13.0520, 80.2240], riskLevel: 'moderate', rainfallMm: 36.4, congestionIndex: 76, population: '420,000' },
  { id: 11, name: 'Valasaravakkam', zoneNo: 'Zone XI', center: [13.0403, 80.1723], riskLevel: 'low', rainfallMm: 25.1, congestionIndex: 51, population: '260,000' },
  { id: 12, name: 'Alandur / Guindy', zoneNo: 'Zone XII', center: [13.0067, 80.2025], riskLevel: 'moderate', rainfallMm: 39.8, congestionIndex: 79, population: '310,000' },
  { id: 13, name: 'Adyar / Besant Nagar', zoneNo: 'Zone XIII', center: [13.0012, 80.2565], riskLevel: 'low', rainfallMm: 21.0, congestionIndex: 54, population: '350,000' },
  { id: 14, name: 'Perungudi / Velachery', zoneNo: 'Zone XIV', center: [12.9815, 80.2280], riskLevel: 'critical', rainfallMm: 68.4, congestionIndex: 88, population: '380,000' },
  { id: 15, name: 'Sholinganallur / OMR', zoneNo: 'Zone XV', center: [12.9010, 80.2279], riskLevel: 'high', rainfallMm: 58.7, congestionIndex: 74, population: '320,000' },
];

export interface WaterbodyGeometry {
  name: string;
  type: 'river' | 'canal' | 'lake' | 'wetland';
  coordinates: [number, number][];
  currentLevelM: number;
  dangerLevelM: number;
  flowStatus: string;
}

export const CHENNAI_WATERWAYS: WaterbodyGeometry[] = [
  {
    name: 'Adyar River Course',
    type: 'river',
    coordinates: [
      [13.0097, 80.0575], // Chembarambakkam outflow
      [13.0180, 80.1200], // Anakaputhur
      [13.0135, 80.1750], // Manapakkam
      [13.0152, 80.1970], // Nandambakkam
      [13.0178, 80.2205], // Saidapet Bridge
      [13.0160, 80.2400], // Kotturpuram
      [13.0080, 80.2600], // Malar Hospital Adyar
      [13.0040, 80.2780], // Adyar Estuary (Bay of Bengal)
    ],
    currentLevelM: 6.8,
    dangerLevelM: 8.5,
    flowStatus: 'High velocity discharge (2,100 m³/s)',
  },
  {
    name: 'Cooum River Course',
    type: 'river',
    coordinates: [
      [13.0720, 80.1300], // Maduravoyal
      [13.0740, 80.1700], // Koyambedu
      [13.0750, 80.2150], // Aminjikarai
      [13.0710, 80.2410], // Chetpet
      [13.0780, 80.2650], // Egmore
      [13.0720, 80.2800], // Chintadripet
      [13.0670, 80.2870], // Napier Bridge (Bay of Bengal)
    ],
    currentLevelM: 4.5,
    dangerLevelM: 6.0,
    flowStatus: 'Moderate runoff (890 m³/s)',
  },
  {
    name: 'Buckingham Canal (Central-South Corridor)',
    type: 'canal',
    coordinates: [
      [13.0900, 80.2850], // Basin Bridge
      [13.0450, 80.2680], // Mylapore / Mandaveli
      [13.0080, 80.2580], // Kotturpuram junction
      [12.9800, 80.2500], // Thiruvanmiyur
      [12.9300, 80.2450], // Sholinganallur
      [12.8700, 80.2400], // Muttukadu
    ],
    currentLevelM: 3.1,
    dangerLevelM: 3.8,
    flowStatus: 'Flow constrained by tidal backwaters',
  },
  {
    name: 'Pallikaranai Marshland Basin',
    type: 'wetland',
    coordinates: [
      [12.9550, 80.2080],
      [12.9450, 80.2250],
      [12.9250, 80.2220],
      [12.9300, 80.2050],
      [12.9550, 80.2080],
    ],
    currentLevelM: 2.8,
    dangerLevelM: 3.2,
    flowStatus: 'Near retention capacity (91%)',
  }
];

export const CHENNAI_CORRIDORS: Array<{
  id: string;
  name: string;
  category: 'arterial' | 'expressway' | 'coastal' | 'ring_road';
  from: string;
  to: string;
  coordinates: [number, number][];
  currentSpeedKmh: number;
  freeFlowSpeedKmh: number;
  congestionIndex: number;
  travelTimeMinutes: number;
  delayMinutes: number;
  severity: 'free' | 'moderate' | 'heavy' | 'severe';
  waterloggingStatus?: string;
}> = [
  {
    id: 'corridor-omr',
    name: 'Rajiv Gandhi Salai (OMR IT Corridor)',
    category: 'expressway',
    from: 'Madhya Kailash',
    to: 'Siruseri SIPCOT',
    coordinates: [
      [13.0062, 80.2536],
      [12.9820, 80.2500],
      [12.9640, 80.2450], // Perungudi Toll
      [12.9380, 80.2340], // Thoraipakkam
      [12.9010, 80.2279], // Sholinganallur
      [12.8710, 80.2220], // Navalur
      [12.8250, 80.2180], // Siruseri
    ],
    currentSpeedKmh: 18,
    freeFlowSpeedKmh: 55,
    congestionIndex: 82,
    travelTimeMinutes: 52,
    delayMinutes: 28,
    severity: 'heavy',
    waterloggingStatus: '150mm standing water near Perungudi junction',
  },
  {
    id: 'corridor-anna-salai',
    name: 'Anna Salai (Mount Road)',
    category: 'arterial',
    from: 'Chennai Central',
    to: 'Kathipara Junction',
    coordinates: [
      [13.0827, 80.2750], // Central
      [13.0640, 80.2600], // Thousand Lights
      [13.0450, 80.2500], // Gemini Flyover
      [13.0320, 80.2350], // Teynampet
      [13.0200, 80.2200], // Saidapet
      [13.0067, 80.2025], // Kathipara
    ],
    currentSpeedKmh: 24,
    freeFlowSpeedKmh: 45,
    congestionIndex: 71,
    travelTimeMinutes: 38,
    delayMinutes: 16,
    severity: 'moderate',
    waterloggingStatus: 'Slow moving traffic near Saidapet ramp',
  },
  {
    id: 'corridor-gst',
    name: 'Grand Southern Trunk (GST Road)',
    category: 'arterial',
    from: 'Kathipara Junction',
    to: 'Tambaram Sanatorium',
    coordinates: [
      [13.0067, 80.2025], // Kathipara
      [12.9900, 80.1800], // Airport
      [12.9650, 80.1500], // Pallavaram
      [12.9450, 80.1350], // Chromepet
      [12.9249, 80.1150], // Tambaram
    ],
    currentSpeedKmh: 14,
    freeFlowSpeedKmh: 50,
    congestionIndex: 89,
    travelTimeMinutes: 58,
    delayMinutes: 36,
    severity: 'severe',
    waterloggingStatus: 'Subway waterlogged at Pallavaram; airport flyover congested',
  },
  {
    id: 'corridor-ecr',
    name: 'East Coast Road (ECR)',
    category: 'coastal',
    from: 'Thiruvanmiyur',
    to: 'Kovalam Toll',
    coordinates: [
      [12.9850, 80.2600],
      [12.9500, 80.2580], // Palavakkam
      [12.9200, 80.2540], // Neelankarai
      [12.8700, 80.2480], // Akkarai
      [12.8100, 80.2420], // Muttukadu
    ],
    currentSpeedKmh: 36,
    freeFlowSpeedKmh: 55,
    congestionIndex: 44,
    travelTimeMinutes: 28,
    delayMinutes: 6,
    severity: 'free',
    waterloggingStatus: 'Clear coastal drainage; free flow',
  },
  {
    id: 'corridor-inner-ring',
    name: '100 Feet Inner Ring Road (Jawaharlal Nehru Salai)',
    category: 'ring_road',
    from: 'Koyambedu CMBT',
    to: 'Kathipara Junction',
    coordinates: [
      [13.0680, 80.1930], // Koyambedu
      [13.0480, 80.2000], // Vadapalani
      [13.0300, 80.2020], // Ashok Pillar
      [13.0180, 80.2030], // Ekkattuthangal
      [13.0067, 80.2025], // Kathipara
    ],
    currentSpeedKmh: 16,
    freeFlowSpeedKmh: 45,
    congestionIndex: 78,
    travelTimeMinutes: 42,
    delayMinutes: 22,
    severity: 'heavy',
    waterloggingStatus: 'Ekkattuthangal bridge approaches experiencing surface ponding',
  },
];
