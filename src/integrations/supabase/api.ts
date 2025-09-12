import { supabase } from "@/integrations/supabase/client";

export async function saveContainerInfo(data: any) {
  const { error } = await supabase.from("cnn_container_info").insert([
    {
      container_id: data.container_id,
      container_type: data.container_type,
      container_status: data.container_status,
      shipping_line_name: data.shipping_line_name,
      shipping_line_id: data.shipping_line_id,
      tare: data.tare,
      shipped_from: data.shipped_from,
      shipped_from_terminal: data.shipped_from_terminal,
      shipped_to: data.shipped_to,
      shipped_to_terminal: data.shipped_to_terminal,
      atd_origin: data.atd_origin,
      eta_final_destination: data.eta_final_destination,
      last_location: data.last_location,
      last_location_terminal: data.last_location_terminal,
      next_location: data.next_location,
      next_location_terminal: data.next_location_terminal,
      atd_last_location: data.atd_last_location,
      eta_next_destination: data.eta_next_destination,
      timestamp_of_last_location: data.timestamp_of_last_location,
      last_movement_timestamp: data.last_movement_timestamp,
      loading_port: data.loading_port,
      discharging_port: data.discharging_port,
      customs_clearance: data.customs_clearance,
      bill_of_lading: data.bill_of_lading,
      last_vessel_name: data.last_vessel_name,
      last_voyage_number: data.last_voyage_number,
      current_vessel_name: data.current_vessel_name,
      current_voyage_number: data.current_voyage_number,
      last_updated: data.last_updated,
    },
  ]);
  return error;
}

export async function saveVesselPosition(data: any) {
  const { error } = await supabase
    .from("cnn_vessel_position")
    .insert([data]);

  return error;
}


export async function saveVesselIncident(data: any) {
  const { error } = await supabase.from("cnn_vessel_incident").insert([
    {
      vessel_name: data.vessel_name,
      navigation_status: data.navigation_status,
      description: data.description,
    },
  ]);
  return error;
}
