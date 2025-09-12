export interface VesselArrivalResult {
  hasArrived: boolean
  confidence: "high" | "medium" | "low"
  reason: string
  arrivalMethod: string
  estimatedArrivalTime: string | null
  nextDestination: string | null
}

export function detectVesselArrival(
  currentData: any,
  previousData: any = null,
  timeThresholdHours = 2,
): VesselArrivalResult {
  // Estados de navegación que indican llegada definitiva (ALTA PRIORIDAD)
  const arrivedStatuses = ["At anchor", "Berthed", "Aground", "Not under command"]
  // Estados que NO indican llegada definitiva
  const transitStatuses = [
    "Under way using engine",
    "Under way sailing",
    "Engaged in fishing",
    "Restricted manoeuvrability",
  ]

  // 1. Si está explícitamente en tránsito, NO ha arribado
  if (transitStatuses.includes(currentData.navigation_status)) {
    return {
      hasArrived: false,
      confidence: "high",
      reason: `Barco en tránsito: "${currentData.navigation_status}"`,
      arrivalMethod: "navigation_status",
      estimatedArrivalTime: null,
      nextDestination: currentData.destination || null,
    }
  }

  // 2. Verificación por estado de navegación definitivo (ALTA PRIORIDAD)
  if (arrivedStatuses.includes(currentData.navigation_status)) {
    // Validación adicional: debe tener velocidad baja para confirmar llegada
    const speed = Number.parseFloat(currentData.speed) || 0
    if (speed <= 3) {
      return {
        hasArrived: true,
        confidence: "high",
        reason: `Barco anclado/atracado: "${currentData.navigation_status}" con velocidad ${speed} nudos`,
        arrivalMethod: "navigation_status",
        estimatedArrivalTime: currentData.last_position_utc || currentData.last_position_UTC,
        nextDestination: currentData.destination || null,
      }
    }
  }

  // 3. Verificación especial para "Moored" - requiere validaciones adicionales
  if (currentData.navigation_status === "Moored") {
    const speed = Number.parseFloat(currentData.speed) || 0
    const currentTime = Date.now() / 1000
    const etaTime = currentData.eta_epoch || 0

    // Solo considerar "arribado" si:
    // - Velocidad muy baja (≤ 1 nudo)
    // - Y está cerca o pasó su ETA
    // - Y tiene destino definido
    if (speed <= 1 && etaTime > 0 && currentTime >= etaTime - 86400 && currentData.destination) {
      return {
        hasArrived: true,
        confidence: "high",
        reason: `Barco amarrado en destino con velocidad ${speed} nudos cerca de ETA`,
        arrivalMethod: "moored_validation",
        estimatedArrivalTime: currentData.last_position_utc || currentData.last_position_UTC,
        nextDestination: currentData.destination || null,
      }
    } else {
      return {
        hasArrived: false,
        confidence: "medium",
        reason: `Barco amarrado pero no cumple criterios de llegada (velocidad: ${speed}, ETA: ${etaTime > 0 ? "definida" : "no definida"})`,
        arrivalMethod: "moored_validation",
        estimatedArrivalTime: null,
        nextDestination: currentData.destination || null,
      }
    }
  }

  // 4. Verificación por cambio de puerto de salida (ALTA PRIORIDAD)
  if (
    previousData &&
    previousData.dest_port_unlocode &&
    currentData.dep_port_unlocode === previousData.dest_port_unlocode &&
    currentData.dep_port_unlocode !== previousData.dep_port_unlocode
  ) {
    return {
      hasArrived: true,
      confidence: "high",
      reason: `Puerto de salida cambió a destino anterior: ${currentData.dep_port_unlocode}`,
      arrivalMethod: "port_change",
      estimatedArrivalTime: currentData.atd_utc || currentData.atd_UTC,
      nextDestination: currentData.destination || null,
    }
  }

  // 5. Verificación por ETA superado con condiciones específicas (MEDIA PRIORIDAD)
  const currentTime = Date.now() / 1000
  const etaExceeded = currentData.eta_epoch && currentTime > currentData.eta_epoch
  const speed = Number.parseFloat(currentData.speed) || 0
  const lowSpeed = speed <= 2

  if (etaExceeded && lowSpeed && currentData.destination) {
    // Solo si ha pasado más de 6 horas del ETA
    const hoursOverdue = (currentTime - currentData.eta_epoch) / 3600
    if (hoursOverdue >= 6) {
      return {
        hasArrived: true,
        confidence: "medium",
        reason: `ETA superado por ${Math.round(hoursOverdue)} horas con velocidad baja (${speed} nudos)`,
        arrivalMethod: "eta_speed_analysis",
        estimatedArrivalTime: new Date(currentData.eta_epoch * 1000).toISOString(),
        nextDestination: currentData.destination || null,
      }
    }
  }

  // 6. Verificación por cambio de destino significativo (BAJA PRIORIDAD)
  if (previousData && previousData.destination && currentData.destination !== previousData.destination) {
    // Solo si el cambio es a un destino completamente diferente
    const prevDest = previousData.destination.toLowerCase()
    const currDest = currentData.destination.toLowerCase()

    if (!prevDest.includes(currDest.split(",")[0]) && !currDest.includes(prevDest.split(",")[0])) {
      return {
        hasArrived: true,
        confidence: "low",
        reason: `Destino cambió significativamente: "${previousData.destination}" → "${currentData.destination}"`,
        arrivalMethod: "destination_change",
        estimatedArrivalTime: currentData.last_position_utc || currentData.last_position_UTC,
        nextDestination: currentData.destination || null,
      }
    }
  }

  // Por defecto: No ha arribado
  return {
    hasArrived: false,
    confidence: "high",
    reason: "Barco en tránsito normal",
    arrivalMethod: "none",
    estimatedArrivalTime: null,
    nextDestination: currentData.destination || null,
  }
}
