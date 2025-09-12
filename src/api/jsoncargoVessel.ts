// Consulta la API finder para obtener el IMO y luego la API basic para obtener la posición
export async function fetchVesselFullData(vesselName: string) {
  const apiKey = "oeFyUMWVcqNH_hL9vAmqFbTbrFMIvKKhV8g7fSfttic";
  // 1. Buscar el buque por nombre para obtener el IMO
  const finderUrl = `/api/v1/vessel/finder?name=${encodeURIComponent(vesselName)}`;
  const finderRes = await fetch(finderUrl, {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
    },
  });
  if (!finderRes.ok) throw new Error(`Finder error: ${finderRes.status}`);
  const finderJson = await finderRes.json();
  const vesselInfo = finderJson.data && finderJson.data.length > 0 ? finderJson.data[0] : null;
  if (!vesselInfo || !vesselInfo.imo) throw new Error('No IMO found for vessel');
  // 2. Consultar la API basic con el IMO
  const basicUrl = `/api/v1/vessel/basic?imo=${vesselInfo.imo}`;
  const basicRes = await fetch(basicUrl, {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
    },
  });
  if (!basicRes.ok) throw new Error(`Basic error: ${basicRes.status}`);
  const basicJson = await basicRes.json();
  // Mapear claves para coincidir con la tabla (minúsculas)
  const basicData = basicJson.data || {};
  const mappedBasic = {
    ...basicData,
    last_position_utc: basicData.last_position_UTC,
    eta_utc: basicData.eta_UTC,
  };
  delete mappedBasic.last_position_UTC;
  delete mappedBasic.eta_UTC;
  // Retornar ambos datos combinados
  return {
    finder: vesselInfo,
    basic: mappedBasic
  };
}
