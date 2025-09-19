import { supabase } from "@/integrations/supabase/client";

// Consulta todos los datos de tracking de un contenedor por su número
export async function fetchContainerTrackingDetail(containerNumber: string) {
  // 1. Buscar el registro principal (el más reciente)
  const { data: trackings, error: trackingError } = await supabase
    .from("cnn_container_tracking")
    .select("*")
    .eq("container_number", containerNumber)
    .order("created_at", { ascending: false })
    .limit(1);

  const tracking = trackings && trackings.length > 0 ? trackings[0] : null;
  if (trackingError || !tracking) return { error: trackingError || 'No tracking found' };

  // Si metadata es un string, lo convertimos a un objeto JSON
  if (tracking.metadata && typeof tracking.metadata === 'string') {
    try {
      tracking.metadata = JSON.parse(tracking.metadata);
    } catch (e) {
      console.error("Error al parsear el string de metadata:", e);
      // Si falla, lo dejamos como está para evitar que la app se rompa
    }
  }

  // 2. Buscar eventos
  const { data: events, error: eventsError } = await supabase
    .from("cnn_container_events")
    .select("*")
    .eq("container_tracking_id", tracking.id)
    .order("event_sequence", { ascending: true });

  // 3. Buscar summary
  const { data: summary, error: summaryError } = await supabase
    .from("cnn_tracking_summary")
    .select("*")
    .eq("container_tracking_id", tracking.id)
    .single();

  return {
    tracking,
    events: events || [],
    summary: summary || null,
    error: eventsError || summaryError || null,
  };
}