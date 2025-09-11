import { supabase } from "@/integrations/supabase/client";

export async function fetchVesselPosition(vesselName: string, apiKey: string) {
  const url = `https://api.jsoncargo.com/api/v1/vessel/basic?name=${encodeURIComponent(vesselName)}`;
  const response = await fetch(url, {
    headers: {
      'x-api-key': apiKey,
    },
  });
  if (!response.ok) return null;
  const result = await response.json();
  return result.data;
}

export async function saveVesselPosition(data: any) {
  const { error } = await supabase.from("cnn_vessel_position").insert([
    {
      vessel_name: data.name,
      mmsi: data.mmsi,
      imo: data.imo,
      lat: data.lat,
      lon: data.lon,
      navigation_status: data.navigation_status,
      last_position_utc: data.last_position_UTC,
      eta_utc: data.eta_UTC,
      last_updated: new Date().toISOString(),
    },
  ]);
  return error;
}

export async function saveVesselIncident(data: any) {
  const { error } = await supabase.from("cnn_vessel_incident").insert([
    {
      vessel_name: data.name,
      navigation_status: data.navigation_status,
      description: data.description,
    },
  ]);
  return error;
}
