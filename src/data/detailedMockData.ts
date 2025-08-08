import type { ContainerEvent, VesselInfo } from './containerEvents';

export type DetailedContainerInfo = {
  container_number: string;
  bill_of_lading: string;
  carrier: string;
  current_position: [number, number];
  vessel_info: VesselInfo;
  events: ContainerEvent[];
};

export const allDetailedContainerData: DetailedContainerInfo[] = [
  {
    container_number: "MSBU5451885",
    bill_of_lading: "MEDUIX329112",
    carrier: "MSC",
    current_position: [9.330, -79.932], // Cristobal, Panama
    vessel_info: {
      vessel_name: "SPANACO ADVENTURE", vessel_type: "General Cargo Ship", vessel_imo: "9014078", voyage_number: "NX529A", imageUrl: "/vessel.jpg", destination: "Cape Canaveral, United States (USA)", eta: "Aug 17, 21:00 (in 10 days)", status: "Under way", speed: "12.2 kn", course: "240.6°", draught: "9 m (max 11.8)", lastReport: "Aug 07, 2025 22:38 UTC", lastPort: "Goteborg Anch., Sweden", atd: "Jul 31, 01:58 UTC (8 days ago)", grossTonnage: "29381", deadweight: "47029", built: "1994", size: "200 / 31m", mmsi: "636023909",
    },
    events: [
      { id: "a50edb50-8dc8-4885-bc29-cbf2c6d0358a", container_tracking_id: "9e8f0bef-b8be-46d3-88cb-9f30266dc782", event_date: "2025-07-25", event_time: null, event_datetime: "2025-07-25T00:00:00.000Z", location: "Sines, Pt", port: "Sines", country: "Pt", terminal: null, event_type: "Full Transshipment Loaded", event_description: "Full Transshipment Loaded", vessel_name: "SPANACO ADVENTURE", voyage_number: null, event_sequence: 1, is_estimated: false },
      { id: "32672663-833e-4be8-876c-ac7d8066bc00", container_tracking_id: "9e8f0bef-b8be-46d3-88cb-9f30266dc782", event_date: "2025-07-20", event_time: null, event_datetime: "2025-07-20T00:00:00.000Z", location: "Sines, Pt", port: "Sines", country: "Pt", terminal: null, event_type: "Full Transshipment Discharged", event_description: "Full Transshipment Discharged", vessel_name: "MSC NAIROBI X", voyage_number: null, event_sequence: 2, is_estimated: false },
      { id: "85d88042-4064-4c41-b694-a7c81fee0cfa", container_tracking_id: "9e8f0bef-b8be-46d3-88cb-9f30266dc782", event_date: "2025-06-04", event_time: null, event_datetime: "2025-06-04T00:00:00.000Z", location: "Nhava Sheva, In", port: "Nhava Sheva", country: "In", terminal: null, event_type: "Empty to Shipper", event_description: "Empty to Shipper", vessel_name: null, voyage_number: null, event_sequence: 3, is_estimated: false },
      { id: "3a6f19bf-a379-4c5e-bbbe-916332757647", container_tracking_id: "9e8f0bef-b8be-46d3-88cb-9f30266dc782", event_date: "2025-06-06", event_time: null, event_datetime: "2025-06-06T00:00:00.000Z", location: "Nhava Sheva, In", port: "Nhava Sheva", country: "In", terminal: null, event_type: "Export received at CY", event_description: "Export received at CY", vessel_name: null, voyage_number: null, event_sequence: 4, is_estimated: false },
      { id: "e6c42a85-6211-49ae-a88e-21b57bb7e5cc", container_tracking_id: "9e8f0bef-b8be-46d3-88cb-9f30266dc782", event_date: "2025-06-10", event_time: null, event_datetime: "2025-06-10T00:00:00.000Z", location: "Nhava Sheva, In", port: "Nhava Sheva", country: "In", terminal: null, event_type: "Export Loaded on Vessel", event_description: "Export Loaded on Vessel", vessel_name: "MSC NAIROBI X", voyage_number: null, event_sequence: 5, is_estimated: false }
    ],
  },
  {
    container_number: "MSMU6181134",
    bill_of_lading: "MSC123456",
    carrier: "MSC",
    current_position: [25.276987, 55.296249], // Dubai
    vessel_info: {
      vessel_name: "MSC GULSUN", vessel_type: "Container Ship", vessel_imo: "9839430", voyage_number: "MG123A", imageUrl: "/vessel.jpg", destination: "Jebel Ali, UAE", eta: "Aug 19, 10:00", status: "At Anchor", speed: "0.1 kn", course: "180.0°", draught: "15.1 m", lastReport: "Aug 08, 2025 01:15 UTC", lastPort: "Singapore", atd: "Aug 01, 2025 12:00 UTC", grossTonnage: "232618", deadweight: "228149", built: "2019", size: "400 / 62m", mmsi: "356678000",
    },
    events: [
      { id: "evt-msmu-1", container_tracking_id: "trk-msmu", event_date: "2025-08-01", event_time: null, event_datetime: "2025-08-01T00:00:00.000Z", location: "Singapore", port: "Singapore", country: "SG", terminal: "PSA Terminal", event_type: "Loaded on Vessel", event_description: "Export Loaded on Vessel", vessel_name: "MSC GULSUN", voyage_number: "MG123A", event_sequence: 1, is_estimated: false },
      { id: "evt-msmu-2", container_tracking_id: "trk-msmu", event_date: "2025-07-28", event_time: null, event_datetime: "2025-07-28T00:00:00.000Z", location: "Singapore", port: "Singapore", country: "SG", terminal: "PSA Terminal", event_type: "Received at CY", event_description: "Export received at CY", vessel_name: null, voyage_number: null, event_sequence: 2, is_estimated: false },
    ],
  },
  {
    container_number: "TGBU5843024",
    bill_of_lading: "MSC123457",
    carrier: "MSC",
    current_position: [34.052235, -118.243683], // Los Angeles
    vessel_info: {
      vessel_name: "MSC MIA", vessel_type: "Container Ship", vessel_imo: "9839478", voyage_number: "MM456B", imageUrl: "/vessel.jpg", destination: "Long Beach, USA", eta: "Aug 20, 08:00", status: "Moored", speed: "0.0 kn", course: "N/A", draught: "14.8 m", lastReport: "Aug 08, 2025 02:00 UTC", lastPort: "Busan, South Korea", atd: "Jul 25, 2025 18:00 UTC", grossTonnage: "232618", deadweight: "228149", built: "2019", size: "400 / 62m", mmsi: "356679000",
    },
    events: [
      { id: "evt-tgbu-1", container_tracking_id: "trk-tgbu", event_date: "2025-08-07", event_time: null, event_datetime: "2025-08-07T00:00:00.000Z", location: "Long Beach, US", port: "Long Beach", country: "US", terminal: "Pier J", event_type: "Discharged", event_description: "Full Container Discharged", vessel_name: "MSC MIA", voyage_number: "MM456B", event_sequence: 1, is_estimated: false },
      { id: "evt-tgbu-2", container_tracking_id: "trk-tgbu", event_date: "2025-07-25", event_time: null, event_datetime: "2025-07-25T00:00:00.000Z", location: "Busan, KR", port: "Busan", country: "KR", terminal: "BNCT", event_type: "Loaded on Vessel", event_description: "Export Loaded on Vessel", vessel_name: "MSC MIA", voyage_number: "MM456B", event_sequence: 2, is_estimated: false },
    ],
  },
  {
    container_number: "MSMU6351035",
    bill_of_lading: "MSC123458",
    carrier: "MSC",
    current_position: [40.712776, -74.005974], // New York
    vessel_info: {
      vessel_name: "MSC AMBRA", vessel_type: "Container Ship", vessel_imo: "9839480", voyage_number: "MA789C", imageUrl: "/vessel.jpg", destination: "New York, USA", eta: "Aug 15, 22:00", status: "Under way using engine", speed: "18.2 kn", course: "45.5°", draught: "13.5 m", lastReport: "Aug 08, 2025 01:45 UTC", lastPort: "Algeciras, Spain", atd: "Aug 01, 2025 05:30 UTC", grossTonnage: "232618", deadweight: "228149", built: "2020", size: "400 / 62m", mmsi: "356681000",
    },
    events: [
      { id: "evt-msmu635-1", container_tracking_id: "trk-msmu635", event_date: "2025-08-01", event_time: null, event_datetime: "2025-08-01T00:00:00.000Z", location: "Algeciras, ES", port: "Algeciras", country: "ES", terminal: "TTI Algeciras", event_type: "Loaded on Vessel", event_description: "Export Loaded on Vessel", vessel_name: "MSC AMBRA", voyage_number: "MA789C", event_sequence: 1, is_estimated: false },
    ],
  }
];