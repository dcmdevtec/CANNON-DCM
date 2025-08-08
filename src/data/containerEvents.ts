export type VesselInfo = {
  vessel_name: string;
  vessel_type: string;
  vessel_imo: string;
  voyage_number: string;
  imageUrl: string;
  destination: string;
  eta: string;
  status: string;
  speed: string;
  course: string;
  draught: string;
  lastReport: string;
  lastPort: string;
  atd: string;
  grossTonnage: string;
  deadweight: string;
  built: string;
  size: string;
  mmsi: string;
};

export type ContainerEvent = {
  id: string;
  container_tracking_id: string;
  event_date: string;
  event_time: string | null;
  event_datetime: string;
  location: string;
  port: string;
  country: string;
  terminal: string | null;
  event_type: string;
  event_description: string;
  vessel_name: string | null;
  voyage_number: string | null;
  event_sequence: number;
  is_estimated: boolean;
};