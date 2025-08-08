import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// --- SIMULACIÓN DE API EXTERNA MEJORADA ---
const mockTrackingAPI = (containerNumber: string) => {
  console.log(`Simulando búsqueda para el contenedor: ${containerNumber}`);
  const statuses = ["En tránsito", "En puerto de transbordo", "Retenido en aduana", "Listo para entrega"];
  const locations = ["Océano Atlántico", "Puerto de Singapur", "Aduana de Manzanillo", "Patio de contenedores"];
  const delayReasons = ["Congestión en el puerto", "Condiciones climáticas adversas", "Inspección de aduanas", "Fallo mecánico menor"];
  
  const randomIndex = Math.floor(Math.random() * statuses.length);
  const isDelayed = Math.random() > 0.5;
  const delayReason = isDelayed ? delayReasons[Math.floor(Math.random() * delayReasons.length)] : null;

  // Coordenadas aleatorias para simulación global
  const latitude = (Math.random() * 180 - 90).toFixed(6);
  const longitude = (Math.random() * 360 - 180).toFixed(6);

  return {
    current_status: statuses[randomIndex],
    current_location: locations[randomIndex],
    latest_move: `Actualizado ${new Date().toLocaleDateString('es-ES')}`,
    pod_eta_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    shipped_from: "Puerto de Origen (Simulado)",
    shipped_to: "Puerto de Destino (Simulado)",
    is_delayed: isDelayed,
    delay_reason: delayReason,
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    vessel_name: "SPANACO ADVENTURE", // Datos simulados consistentes
    vessel_imo: "9014078",
    vessel_type: "General Cargo Ship",
    vessel_flag: "LR",
    vessel_image_url: "/vessel.jpg",
  };
};
// --- FIN DE LA SIMULACIÓN ---

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { container_number, bill_of_lading } = await req.json();

    if (!container_number || !bill_of_lading) {
      return new Response(JSON.stringify({ error: 'Faltan container_number o bill_of_lading' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const trackingData = mockTrackingAPI(container_number);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: trackingResult, error: upsertError } = await supabaseAdmin
      .from('container_trackings')
      .upsert({
        container_number: container_number,
        bill_of_lading_number: bill_of_lading,
        ...trackingData,
      }, { onConflict: 'container_number' })
      .select()
      .single();

    if (upsertError) throw upsertError;

    if (trackingData.is_delayed) {
      const message = `El contenedor ${container_number} ha sufrido una demora. Causa: ${trackingData.delay_reason}.`;
      await supabaseAdmin.from('notifications').insert({
        container_number: container_number,
        type: 'Retraso',
        message: message,
        severity: 'warning',
        action_required: 'Revisar detalles y notificar al cliente.',
      });
    }

    await supabaseAdmin
      .from('container_events')
      .insert({
        container_tracking_id: trackingResult.id,
        event_date: new Date().toISOString(),
        event_description: `Consulta de tracking automatizada. Estado: ${trackingData.current_status}`,
        event_type: 'Consulta de Tracking',
        location: 'Sistema Interno',
      });

    return new Response(JSON.stringify({ success: true, data: trackingResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error en la función de tracking:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})