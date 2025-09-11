// API para consultar datos de contenedores en JSONCargo

export async function fetchContainerFromJsonCargo(containerId: string, naviera: string) {
  // Consulta real a la API de JSONCargo
  const apiKey = "oeFyUMWVcqNH_hL9vAmqFbTbrFMIvKKhV8g7fSfttic"; // Usa el mismo valor que ContainerApiViewer
  const url = `/api/v1/containers/${containerId}?shipping_line=${naviera}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const result = await response.json();
  return result.data;
}
