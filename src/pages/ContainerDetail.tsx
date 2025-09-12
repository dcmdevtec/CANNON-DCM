"use client"

import { useEffect } from "react"
import { useState } from "react"
import type React from "react"
import { useParams, Link } from "react-router-dom"
import { ArrowLeft, ShipIcon, ArrowRight, MapPin, Clock, Anchor, Navigation, Gauge } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import IntelligentAgent from "@/components/IntelligentAgent"
import ClientOnlyMap from "@/components/ClientOnlyMap"
import ReactCountryFlag from "react-country-flag"
import { getName } from "country-list"
import VesselDetailPanel from "@/components/VesselDetailPanel"
import { supabase } from "@/integrations/supabase/client"
import { detectVesselArrival } from "@/utils/vessel-arrival-detection"

const InfoCard = ({ title, value, children }: { title: string; value: string; children?: React.ReactNode }) => (
  <Card className="flex-1 min-w-[180px] border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
    <CardHeader className="pb-2">
      <p className="text-sm text-muted-foreground font-medium">{title}</p>
    </CardHeader>
    <CardContent>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
      {children}
    </CardContent>
  </Card>
)

const VesselInfoCard = ({ vesselInfo, container }: { vesselInfo: any; container: any }) => {
  const atdOrigin = container.atd_origin ? new Date(container.atd_origin).toLocaleDateString() : "-"
  const etaFinal = container.eta ? new Date(container.eta).toLocaleDateString() : "-"
  const etd = container.eta ? new Date(container.etd).toLocaleDateString() : "-"
  const getIsoFromLocode = (locode: string) => {
    if (!locode || locode.length < 2) return ""
    const isoStart = locode.substring(0, 2).toUpperCase()
    const isoEnd = locode.substring(locode.length - 2).toUpperCase()
    return /^[A-Z]{2}$/.test(isoStart) ? isoStart : /^[A-Z]{2}$/.test(isoEnd) ? isoEnd : ""
  }

  const origin = container?.shipped_from || "-"
  const originIso = getIsoFromLocode(origin.split(",").pop()?.trim() || "")
  const originDate = container?.atd_last_location ? new Date(container.atd_last_location).toLocaleDateString() : "-"
  const destination = container?.shipped_to || "-"
  const destIso = getIsoFromLocode(destination.split(",").pop()?.trim() || "")
  const destDate = container?.eta_final_destination
    ? new Date(container.eta_final_destination).toLocaleDateString()
    : "-"
  const countryIso = vesselInfo.country_iso || vesselInfo.flag || ""
  const [destPlace, setDestPlace] = useState<string>("")

  useEffect(() => {
    async function fetchPlace() {
      if (vesselInfo.lat && vesselInfo.lon) {
        try {
          const res = await fetch(
            `/geonames/oceanJSON?lat=${vesselInfo.lat}&lng=${vesselInfo.lon}&username=${import.meta.env.VITE_GEONAMES_USER}`,
          )
          const json = await res.json()

          if (json?.ocean) {
            setDestPlace(json.ocean.name || "Océano")
          } else {
            const nomRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${vesselInfo.lat}&lon=${vesselInfo.lon}`,
            )
            const nomJson = await nomRes.json()
            setDestPlace(
              nomJson.address?.city ||
                nomJson.address?.town ||
                nomJson.address?.village ||
                nomJson.display_name ||
                "Ubicación desconocida",
            )
          }
        } catch (err) {
          setDestPlace("Error obteniendo ubicación")
        }
      }
    }
    fetchPlace()
  }, [vesselInfo.lat, vesselInfo.lon])

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-slate-50 to-white">
      <CardHeader className="bg-gradient-to-r from-gray-900 to-blue-700 text-white rounded-t-lg">
        <CardTitle className="flex items-center text-lg font-semibold">
          <ShipIcon className="h-6 w-6 mr-3" />
          Información del Buque
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {originIso && (
                <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
                  <ReactCountryFlag
                    countryCode={originIso}
                    svg
                    style={{ width: "1.5em", height: "1.2em" }}
                    title={originIso}
                  />
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{origin}</div>
                    <div className="text-xs text-green-600 font-medium">
                      {originDate !== "-" && `Salida: ${originDate}`}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center px-4">
              <div className="flex items-center">
                <div className="h-0.5 w-12 bg-gradient-to-r from-primary/40 to-primary"></div>
                <ArrowRight className="h-5 w-5 text-primary ml-1" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {destIso && (
                <div className="flex items-center gap-2 bg-primary/5 px-3 py-2 rounded-lg">
                  <ReactCountryFlag
                    countryCode={destIso}
                    svg
                    style={{ width: "1.5em", height: "1.2em" }}
                    title={destIso}
                  />
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{destination}</div>
                    <div className="text-xs text-primary font-medium">{destDate !== "-" && `Llegada: ${destDate}`}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Anchor className="h-4 w-4 text-primary" />
              <div className="flex-1">
                <span className="text-sm text-gray-600">IMO:</span>
                <span className="font-semibold text-gray-900 ml-2">
                  {vesselInfo.imo || vesselInfo.last_voyage_number || vesselInfo.current_voyage_number || "-"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Navigation className="h-4 w-4 text-primary" />
              <div className="flex-1">
                <span className="text-sm text-gray-600">MMSI:</span>
                <span className="font-semibold text-gray-900 ml-2">{vesselInfo.mmsi || "-"}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <ShipIcon className="h-4 w-4 text-primary" />
              <div className="flex-1">
                <span className="text-sm text-gray-600">Tipo:</span>
                <span className="font-semibold text-gray-900 ml-2">
                  {vesselInfo.type || vesselInfo.type_specific || vesselInfo.container_type || "-"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Gauge className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <span className="text-sm text-gray-600">Velocidad:</span>
                <span className="font-semibold text-gray-900 ml-2">
                  {vesselInfo.speed ? vesselInfo.speed + " kn" : vesselInfo.velocidad || "-"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Clock className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <span className="text-sm text-gray-600">ATD (Salida):</span>
                <span className="font-semibold text-gray-900 ml-2">{atdOrigin}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Clock className="h-4 w-4 text-primary" />
              <div className="flex-1">
                <span className="text-sm text-gray-600">ETA (Llegada):</span>
                <span className="font-semibold text-gray-900 ml-2">{etaFinal}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Navigation className="h-4 w-4 text-purple-600" />
              <div className="flex-1">
                <span className="text-sm text-gray-600">Rumbo:</span>
                <span className="font-semibold text-gray-900 ml-2">
                  {vesselInfo.course ? vesselInfo.course + "°" : vesselInfo.rumbo || "-"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <MapPin className="h-4 w-4 text-red-600" />
              <div className="flex-1">
                <span className="text-sm text-gray-600">Ubicación:</span>
                <span className="font-semibold text-gray-900 ml-2">{destPlace || "-"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Estado:</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                {vesselInfo.navigation_status || vesselInfo.estado_navegacion || "En tránsito"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Último reporte:</span>
              <span className="text-sm font-medium text-gray-900">
                {vesselInfo.last_position_UTC
                  ? vesselInfo.last_position_UTC.split("T")[0]
                  : vesselInfo.ultimo_reporte || "-"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const ContainerDetail = () => {
  const { containerId } = useParams()
  const [selectedVessel, setSelectedVessel] = useState<any | null>(null)
  const [container, setContainer] = useState<any | null>(null)
  const [vesselData, setVesselData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [arrivalStatus, setArrivalStatus] = useState<any>(null)

  useEffect(() => {
    const fetchContainer = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from("v_tracking_contenedor_completo")
        .select("*")
        .eq("num_contenedor", containerId)
        .single()
      setContainer(data)
      if (data && data.imo) {
        const { data: vessel, error: vesselError } = await supabase
          .from("cnn_vessel_position")
          .select("*")
          .eq("imo", data.imo)
          .single()
        setVesselData(vessel || null)
        if (vessel) {
          const arrival = detectVesselArrival(vessel)
          setArrivalStatus(arrival)
        }
      } else {
        setVesselData(null)
      }
      setLoading(false)
    }
    fetchContainer()
  }, [containerId])

  if (loading) {
    return <div>Cargando...</div>
  }

  if (!container) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4 py-6 space-y-6 relative">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <Link
              to="/container-tracking"
              className="inline-flex items-center text-sm text-primary hover:text-primary/80 font-medium mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a la lista
            </Link>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <ShipIcon className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Contenedor No: {containerId}</h1>
                <p className="text-gray-600 mt-1">Seguimiento en tiempo real</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoCard title="Conocimiento de Embarque" value={container.proveedor || "-"} />
            <InfoCard title="Transportista" value={container.shipping_line_name || container.naviera || "-"} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <Card className="h-80 relative z-0 shadow-lg border-0 overflow-hidden">
                <CardContent className="h-full p-0"></CardContent>
              </Card>
              <VesselInfoCard vesselInfo={vesselData || container} container={container} />
              <IntelligentAgent />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleVesselClick = (vesselInfo: any) => {
    const fetchVessel = async () => {
      const { data, error } = await supabase.from("cnn_vessel_position").select("*").eq("imo", vesselInfo.imo).single()
      if (data) {
        setSelectedVessel({
          nombre_buque: data.name || "-",
          tipo_buque: data.type || data.type_specific || "-",
          imo: data.imo || "-",
          mmsi: data.mmsi || "-",
          destino: data.destination || "-",
          eta: data.eta_UTC ? data.eta_UTC.split("T")[0] : "-",
          velocidad: data.speed ? data.speed.toString() + " nudos" : "-",
          rumbo: data.course ? data.course.toString() + "°" : "-",
          calado: data.draught_max ? data.draught_max.toString() + " m" : "-",
          estado_navegacion: data.navigation_status || "-",
          ultimo_reporte: data.last_position_UTC ? data.last_position_UTC.split("T")[0] : "-",
          puerto_origen: data.home_port || "-",
          tonelaje_bruto: data.gross_tonnage ? data.gross_tonnage.toString() : "-",
          peso_muerto: data.deadweight ? data.deadweight.toString() : "-",
          construido: data.year_built || "-",
          dimensiones: data.length && data.breadth ? `${data.length} / ${data.breadth} m` : "-",
          imagen: "/vessel.jpg",
        })
      } else {
        setSelectedVessel(null)
      }
    }
    fetchVessel()
  }

  const handleClosePanel = () => {
    setSelectedVessel(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-6 space-y-6 relative">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <Link
            to="/container-tracking"
            className="inline-flex items-center text-sm text-primary hover:text-primary/80 font-medium mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a la lista
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <ShipIcon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Contenedor No: {container.container_id}</h1>
              <p className="text-gray-600 mt-1">Seguimiento en tiempo real</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoCard title="Proveedor" value={container.proveedor || "-"} />
          <InfoCard title="Transportista" value={container.shipping_line_name || container.naviera || "-"} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <Card className="h-80 relative z-0 shadow-lg border-0 overflow-hidden">
              <CardContent className="h-full p-0">
                <ClientOnlyMap
                  position={container.lat && container.lon ? [container.lat, container.lon] : [0, 0]}
                  vesselInfo={container}
                  onVesselClick={handleVesselClick}
                />
              </CardContent>
            </Card>
            <VesselInfoCard vesselInfo={vesselData || container} container={container} />
            <IntelligentAgent />
          </div>

          <div className="lg:col-span-2">
            {!selectedVessel ? (
              <Card className="shadow-xl border-0 bg-white overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-white p-6">
                  <CardTitle className="text-xl font-semibold">Ruta del Contenedor</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Destination Section - Destino debe estar verde */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">Destino</span>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const getIsoFromLocode = (locode: string) => {
                            if (!locode || locode.length < 2) return ""
                            const isoStart = locode.substring(0, 2).toUpperCase()
                            const isoEnd = locode.substring(locode.length - 2).toUpperCase()
                            return /^[A-Z]{2}$/.test(isoStart) ? isoStart : /^[A-Z]{2}$/.test(isoEnd) ? isoEnd : ""
                          }
                          let destIso = ""
                          let countryName = ""
                          if (vesselData?.destination) {
                            const parts = vesselData.destination.split(",")
                            const last = parts[parts.length - 1]?.trim()
                            destIso = getIsoFromLocode(last || vesselData.destination)
                            countryName = getName(destIso) || destIso
                          }
                          return destIso ? (
                            <div className="flex items-center gap-3">
                              <ReactCountryFlag
                                countryCode={destIso}
                                svg
                                style={{ width: "2.5em", height: "2em" }}
                                title={destIso}
                              />
                              <div>
                                <div className="font-bold text-xl text-gray-900">{countryName}</div>
                                <div className="font-semibold text-gray-700">{vesselData?.destination || "-"}</div>
                              </div>
                            </div>
                          ) : (
                            <div className="font-bold text-xl text-gray-900">{vesselData?.destination || "-"}</div>
                          )
                        })()}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                          ETA:{" "}
                          {vesselData?.eta_utc
                            ? new Date(vesselData.eta_utc).toLocaleDateString("es-ES") +
                              ", " +
                              new Date(vesselData.eta_utc).toLocaleTimeString("es-ES", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Elegant Vertical Connection with Arrow - badge arriba, bolita verde arriba, línea hacia abajo */}
                  <div className="relative my-8 flex flex-col items-center">
                    {arrivalStatus?.hasArrived ? (
                      <>
                        {/* Badge arriba */}
                        <Badge
                          variant="default"
                          className={`${
                            arrivalStatus.confidence === "high"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : arrivalStatus.confidence === "medium"
                                ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                : "bg-orange-100 text-orange-800 border-orange-200"
                          } shadow-sm text-sm px-3 py-1 font-medium mb-4`}
                        >
                          ✓ Arribado ({arrivalStatus.confidence})
                        </Badge>
                        {/* Bolita verde arriba */}
                        <div className="relative z-10 p-3 rounded-full bg-green-500 shadow-xl shadow-green-200 scale-110"></div>
                        {/* Línea hacia abajo */}
                        <div className="w-0.5 h-32 bg-gradient-to-b from-green-500 via-green-400 to-green-100"></div>
                        {/* Punta final */}
                        <div className="w-1 h-6 bg-gradient-to-b from-green-100 to-green-50"></div>
                      </>
                    ) : (
                      <>
                        {/* Badge en tránsito */}
                        <Badge
                          variant="default"
                          className="bg-blue-100 text-blue-800 border-blue-200 shadow-sm text-sm px-3 py-1 font-medium mb-4"
                        >
                          🚢 En Tránsito
                        </Badge>
                        {/* Bolita azul pulsante */}
                        <div className="relative z-10 p-3 rounded-full bg-blue-500 shadow-xl shadow-blue-200 scale-110 animate-pulse"></div>
                        {/* Línea animada hacia abajo */}
                        <div className="w-0.5 h-32 bg-gradient-to-b from-blue-500 via-blue-400 to-blue-100 animate-pulse"></div>
                        {/* Punta final */}
                        <div className="w-1 h-6 bg-gradient-to-b from-blue-100 to-blue-50"></div>
                      </>
                    )}
                  </div>

                  {/* Origin Section - Origen color neutro */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">Origen</span>
                    </div>
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const getIsoFromLocode = (locode: string) => {
                            if (!locode || locode.length < 2) return ""
                            const isoStart = locode.substring(0, 2).toUpperCase()
                            const isoEnd = locode.substring(locode.length - 2).toUpperCase()
                            return /^[A-Z]{2}$/.test(isoStart) ? isoStart : /^[A-Z]{2}$/.test(isoEnd) ? isoEnd : ""
                          }
                          let originIso = ""
                          let countryName = ""
                          if (vesselData?.dep_port_unlocode) {
                            const parts = vesselData.dep_port_unlocode.split(",")
                            const last = parts[parts.length - 1]?.trim()
                            originIso = getIsoFromLocode(last || vesselData.dep_port_unlocode)
                            countryName = getName(originIso) || originIso
                          }
                          return originIso ? (
                            <div className="flex items-center gap-3">
                              <ReactCountryFlag
                                countryCode={originIso}
                                svg
                                style={{ width: "2.5em", height: "2em" }}
                                title={originIso}
                              />
                              <div>
                                <div className="font-bold text-xl text-gray-900">{countryName}</div>
                                <div className="font-semibold text-gray-700">{container?.dep_port || "-"}</div>
                              </div>
                            </div>
                          ) : (
                            <div className="font-bold text-xl text-gray-900">{container?.dep_port || "-"}</div>
                          )
                        })()}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">
                          ATD:{" "}
                          {vesselData?.atd_utc
                            ? new Date(vesselData.atd_utc).toLocaleDateString("es-ES") +
                              " (" +
                              Math.floor(
                                (Date.now() - new Date(vesselData.atd_utc).getTime()) / (1000 * 60 * 60 * 24),
                              ) +
                              " días)"
                            : "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Vessel Metrics */}
                  <div className="grid grid-cols-1 gap-3 mt-3 mb-8">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-600">Velocidad:</span>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {vesselData?.speed ? vesselData.speed + " kn" : vesselData?.velocidad || "-"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-primary" />
                        <span className="text-sm text-gray-600">Rumbo:</span>
                      </div>
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                        {vesselData?.course ? vesselData.course + "°" : vesselData?.rumbo || "-"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between  p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Anchor className="h-4 w-4 text-purple-600" />
                        <span className="text-sm text-gray-600">Estado:</span>
                      </div>
                      <Badge
                        className={`${
                          arrivalStatus?.hasArrived
                            ? arrivalStatus.confidence === "high"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : arrivalStatus.confidence === "medium"
                                ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                : "bg-orange-100 text-orange-800 border-orange-200"
                            : "bg-blue-100 text-blue-800 border-blue-200"
                        }`}
                      >
                        {vesselData?.navigation_status || vesselData?.estado_navegacion || "En tránsito"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
        {selectedVessel && (
          <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-2xl w-[400px] max-h-[90vh] overflow-y-auto">
              <VesselDetailPanel vesselInfo={selectedVessel} onClose={handleClosePanel} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ContainerDetail
